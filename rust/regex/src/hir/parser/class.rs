//! Character class parsing — `[...]`, `[^...]`, shorthand escapes within classes.

use super::*;

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
            Ok(Hir::Class(CharClass::Bytes { ranges: byte_ranges, negated }))
        } else {
            // Promote byte ranges to codepoint ranges and merge.
            for br in &byte_ranges {
                cp_ranges.push(CodepointRange::new(br.start as char, br.end as char));
            }
            cp_ranges.sort();
            cp_ranges.dedup();
            Ok(Hir::Class(CharClass::Unicode { ranges: cp_ranges, negated }))
        }
    }

    /// Parse a single item inside a character class.
    fn parse_class_item(
        &mut self,
        byte_ranges: &mut Vec<ByteRange>,
        cp_ranges: &mut Vec<CodepointRange>,
    ) -> Result<(), ParseError> {
        if self.peek() == Some(b'\\') {
            self.advance();
            match self.peek() {
                // Shorthand classes — expand directly into byte ranges.
                Some(b'd') => { self.advance(); byte_ranges.push(ByteRange::new(b'0', b'9')); return Ok(()); }
                Some(b'D') => {
                    self.advance();
                    byte_ranges.push(ByteRange::new(0, b'0' - 1));
                    byte_ranges.push(ByteRange::new(b'9' + 1, 255));
                    return Ok(());
                }
                Some(b'w') => {
                    self.advance();
                    byte_ranges.push(ByteRange::new(b'0', b'9'));
                    byte_ranges.push(ByteRange::new(b'A', b'Z'));
                    byte_ranges.push(ByteRange::new(b'_', b'_'));
                    byte_ranges.push(ByteRange::new(b'a', b'z'));
                    return Ok(());
                }
                Some(b'W') => {
                    self.advance();
                    byte_ranges.push(ByteRange::new(0, b'0' - 1));
                    byte_ranges.push(ByteRange::new(b'9' + 1, b'A' - 1));
                    byte_ranges.push(ByteRange::new(b'Z' + 1, b'_' - 1));
                    byte_ranges.push(ByteRange::new(b'_' + 1, b'a' - 1));
                    byte_ranges.push(ByteRange::new(b'z' + 1, 255));
                    return Ok(());
                }
                Some(b's') => {
                    self.advance();
                    byte_ranges.push(ByteRange::new(0x09, 0x0D));
                    byte_ranges.push(ByteRange::new(0x20, 0x20));
                    return Ok(());
                }
                Some(b'S') => {
                    self.advance();
                    byte_ranges.push(ByteRange::new(0, 0x08));
                    byte_ranges.push(ByteRange::new(0x0E, 0x1F));
                    byte_ranges.push(ByteRange::new(0x21, 255));
                    return Ok(());
                }
                // Unicode escape inside class: \u{XXXX}
                Some(b'u') => {
                    self.advance();
                    let cp = self.parse_class_unicode_codepoint()?;
                    let ch = char::from_u32(cp)
                        .ok_or_else(|| self.err(format!("invalid codepoint U+{:04X}", cp)))?;
                    if self.peek() == Some(b'-') && self.src.get(self.pos + 1) != Some(&b']') {
                        self.advance(); // consume '-'
                        // Expect another \u{...} for the range end.
                        self.expect(b'\\')?;
                        self.expect(b'u')?;
                        let cp_hi = self.parse_class_unicode_codepoint()?;
                        let ch_hi = char::from_u32(cp_hi)
                            .ok_or_else(|| self.err(format!("invalid codepoint U+{:04X}", cp_hi)))?;
                        cp_ranges.push(CodepointRange::new(ch, ch_hi));
                    } else {
                        cp_ranges.push(CodepointRange::new(ch, ch));
                    }
                    return Ok(());
                }
                _ => {
                    // Single-byte escape.
                    let b = self.parse_class_escape_single()?;
                    let lo = b;
                    if self.peek() == Some(b'-') && self.src.get(self.pos + 1) != Some(&b']') {
                        self.advance();
                        let hi = self.parse_class_atom_single()?;
                        byte_ranges.push(ByteRange::new(lo, hi));
                    } else {
                        byte_ranges.push(ByteRange::new(lo, lo));
                    }
                    return Ok(());
                }
            }
        }

        // Non-escape atom.
        let lo = self.parse_class_atom_single()?;
        if self.peek() == Some(b'-') && self.src.get(self.pos + 1) != Some(&b']') {
            self.advance();
            let hi = self.parse_class_atom_single()?;
            byte_ranges.push(ByteRange::new(lo, hi));
        } else {
            byte_ranges.push(ByteRange::new(lo, lo));
        }
        Ok(())
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
            Some(b) if is_escapable(b) => Ok(b),
            Some(b) => Err(self.err(format!("invalid escape in class: \\{}", b as char))),
            None => Err(self.err("unexpected end after backslash in class".into())),
        }
    }
}
