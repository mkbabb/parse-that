//! Character class parsing — `[...]`, `[^...]`, shorthand escapes within classes.

use super::*;

/// A class member before ranges are assembled.
#[derive(Clone, Copy)]
enum ClassAtom {
    Byte(u8),
    Scalar(char),
}

impl ClassAtom {
    /// The member as a scalar value; a byte promotes to the scalar of the
    /// same number, as a byte range does in a codepoint class.
    fn scalar(self) -> char {
        match self {
            ClassAtom::Byte(b) => b as char,
            ClassAtom::Scalar(c) => c,
        }
    }
}

impl<'a> Parser<'a> {
    /// Parse `[...]` or `[^...]`.
    ///
    /// If any Unicode escapes (`\u{...}`) are present, produces a
    /// `CharClass::Unicode`. Otherwise produces `CharClass::Bytes`.
    pub(super) fn parse_char_class(&mut self) -> Result<Hir, ParseError> {
        self.expect(b'[')?;

        let negated = if self.peek() == Some(b'^') {
            self.advance();
            true
        } else {
            false
        };

        let mut byte_ranges = Vec::new();
        let mut cp_ranges: Vec<CodepointRange> = Vec::new();

        // Special case: ] as first char in class is literal.
        if self.peek() == Some(b']') {
            self.advance();
            byte_ranges.push(ByteRange::new(b']', b']'));
        }

        while self.peek() != Some(b']') && !self.at_end() {
            self.parse_class_item(&mut byte_ranges, &mut cp_ranges)?;
        }

        self.expect(b']')?;

        if cp_ranges.is_empty() {
            byte_ranges.sort();
            byte_ranges = merge_byte_ranges(byte_ranges);
            Ok(Hir::Class(CharClass::Bytes {
                ranges: byte_ranges,
                negated,
            }))
        } else {
            // Promote byte ranges to codepoint ranges and merge.
            for br in &byte_ranges {
                cp_ranges.push(CodepointRange::new(br.start as char, br.end as char));
            }
            cp_ranges.sort();
            cp_ranges.dedup();
            Ok(Hir::Class(CharClass::Unicode {
                ranges: cp_ranges,
                negated,
            }))
        }
    }

    /// Parse a single item inside a character class.
    fn parse_class_item(
        &mut self,
        byte_ranges: &mut Vec<ByteRange>,
        cp_ranges: &mut Vec<CodepointRange>,
    ) -> Result<(), ParseError> {
        if self.peek() == Some(b'\\') {
            match self.src.get(self.pos + 1).copied() {
                // Shorthand classes — expand directly into byte ranges.
                Some(b'd') => {
                    self.pos += 2;
                    byte_ranges.push(ByteRange::new(b'0', b'9'));
                    return Ok(());
                }
                Some(b'D') => {
                    self.pos += 2;
                    byte_ranges.push(ByteRange::new(0, b'0' - 1));
                    byte_ranges.push(ByteRange::new(b'9' + 1, 255));
                    return Ok(());
                }
                Some(b'w') => {
                    self.pos += 2;
                    byte_ranges.push(ByteRange::new(b'0', b'9'));
                    byte_ranges.push(ByteRange::new(b'A', b'Z'));
                    byte_ranges.push(ByteRange::new(b'_', b'_'));
                    byte_ranges.push(ByteRange::new(b'a', b'z'));
                    return Ok(());
                }
                Some(b'W') => {
                    self.pos += 2;
                    byte_ranges.push(ByteRange::new(0, b'0' - 1));
                    byte_ranges.push(ByteRange::new(b'9' + 1, b'A' - 1));
                    byte_ranges.push(ByteRange::new(b'Z' + 1, b'_' - 1));
                    byte_ranges.push(ByteRange::new(b'_' + 1, b'a' - 1));
                    byte_ranges.push(ByteRange::new(b'z' + 1, 255));
                    return Ok(());
                }
                Some(b's') => {
                    self.pos += 2;
                    byte_ranges.push(ByteRange::new(0x09, 0x0D));
                    byte_ranges.push(ByteRange::new(0x20, 0x20));
                    return Ok(());
                }
                Some(b'S') => {
                    self.pos += 2;
                    byte_ranges.push(ByteRange::new(0, 0x08));
                    byte_ranges.push(ByteRange::new(0x0E, 0x1F));
                    byte_ranges.push(ByteRange::new(0x21, 255));
                    return Ok(());
                }
                _ => {}
            }
        }

        let lo = self.parse_class_atom()?;
        let hi = if self.peek() == Some(b'-') && self.src.get(self.pos + 1) != Some(&b']') {
            self.advance(); // consume '-'
            self.parse_class_atom()?
        } else {
            lo
        };
        match (lo, hi) {
            (ClassAtom::Byte(lo), ClassAtom::Byte(hi)) => byte_ranges.push(ByteRange::new(lo, hi)),
            (lo, hi) => cp_ranges.push(CodepointRange::new(lo.scalar(), hi.scalar())),
        }
        Ok(())
    }

    /// One class member: a byte, or a scalar value. A `\u` escape is a
    /// scalar; so is a raw non-ASCII character in Unicode mode, read whole
    /// (ECMAScript reads a class one scalar at a time, never one byte of
    /// one). In byte mode a raw non-ASCII character is its bytes.
    fn parse_class_atom(&mut self) -> Result<ClassAtom, ParseError> {
        match self.peek() {
            Some(b'\\') if self.src.get(self.pos + 1) == Some(&b'u') => {
                self.pos += 2;
                let cp = self.parse_class_unicode_codepoint()?;
                let ch = char::from_u32(cp)
                    .ok_or_else(|| self.err(format!("invalid codepoint U+{:04X}", cp)))?;
                Ok(ClassAtom::Scalar(ch))
            }
            Some(b) if b >= 0x80 && self.unicode => {
                let len = match b {
                    0xF0..=0xFF => 4,
                    0xE0..=0xEF => 3,
                    _ => 2,
                };
                let ch = self
                    .src
                    .get(self.pos..self.pos + len)
                    .and_then(|bytes| std::str::from_utf8(bytes).ok())
                    .and_then(|text| text.chars().next())
                    .ok_or_else(|| self.err("invalid UTF-8 inside character class".into()))?;
                self.pos += len;
                Ok(ClassAtom::Scalar(ch))
            }
            _ => Ok(ClassAtom::Byte(self.parse_class_atom_single()?)),
        }
    }

    /// Parse `{XXXX}` after `\u` inside a character class.
    fn parse_class_unicode_codepoint(&mut self) -> Result<u32, ParseError> {
        if self.peek() == Some(b'{') {
            self.advance();
            let cp = self.parse_hex_codepoint()?;
            self.expect(b'}')?;
            Ok(cp)
        } else {
            // \uHHHH — exactly 4 hex digits.
            let mut cp = 0u32;
            for _ in 0..4 {
                let d = self.parse_hex_digit()? as u32;
                cp = (cp << 4) | d;
            }
            Ok(cp)
        }
    }

    /// Parse a single byte atom inside a character class (non-shorthand).
    fn parse_class_atom_single(&mut self) -> Result<u8, ParseError> {
        match self.advance() {
            Some(b'\\') => self.parse_class_escape_single(),
            Some(b) => Ok(b),
            None => Err(self.err("unexpected end inside character class".into())),
        }
    }

    /// Parse a single-byte escape inside a character class.
    fn parse_class_escape_single(&mut self) -> Result<u8, ParseError> {
        match self.advance() {
            Some(b'n') => Ok(b'\n'),
            Some(b'r') => Ok(b'\r'),
            Some(b't') => Ok(b'\t'),
            Some(b'f') => Ok(0x0C),
            Some(b'a') => Ok(0x07),
            Some(b'0') => Ok(0),
            Some(b'b') => Ok(0x08), // backspace inside a class
            Some(b'x') => {
                let hi = self.parse_hex_digit()?;
                let lo = self.parse_hex_digit()?;
                Ok((hi << 4) | lo)
            }
            Some(b) if is_escapable(b) => Ok(b),
            Some(b) => Err(self.err(format!("invalid escape in class: \\{}", b as char))),
            None => Err(self.err("unexpected end after backslash in class".into())),
        }
    }
}
