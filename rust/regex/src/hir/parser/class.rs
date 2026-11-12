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

        // Under u/v semantics (Unicode mode) a class is a set of scalar
        // values: a negated class is its complement over scalars and consumes
        // a whole scalar, and a member at or above 0x80 is that scalar, never
        // a byte (sk-v27 LW3.RX-1d). Byte mode keeps byte classes.
        // Under `i` a class is closed over the case equivalence of its
        // members (a negated class is the complement of that closure).
        let scalar_class = !cp_ranges.is_empty()
            || (self.unicode && (negated || byte_ranges.iter().any(|r| r.end >= 0x80)))
            || (self.case_insensitive
                && (self.unicode || byte_ranges.iter().all(|r| r.end < 0x80)));
        if !scalar_class {
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
            let mut ranges = crate::hir::merge_codepoint_ranges(cp_ranges);
            if self.case_insensitive {
                ranges = crate::casefold::close_ranges(&ranges, self.unicode);
            }
            Ok(Hir::Class(class_of(ranges, negated)))
        }
    }

    /// Parse a single item inside a character class.
    fn parse_class_item(
        &mut self,
        byte_ranges: &mut Vec<ByteRange>,
        cp_ranges: &mut Vec<CodepointRange>,
    ) -> Result<(), ParseError> {
        // Shorthand classes. `\d` and `\w` are ASCII; `\s` is the ECMAScript
        // set. In Unicode mode a negated shorthand is its complement over
        // scalar values; in byte mode, over bytes.
        if self.peek() == Some(b'\\')
            && let Some(c @ (b'd' | b'D' | b'w' | b'W' | b's' | b'S')) =
                self.src.get(self.pos + 1).copied()
        {
            self.pos += 2;
            let positive: Vec<CodepointRange> = match c.to_ascii_lowercase() {
                b'd' => vec![CodepointRange::new('0', '9')],
                b'w' => vec![
                    CodepointRange::new('0', '9'),
                    CodepointRange::new('A', 'Z'),
                    CodepointRange::new('_', '_'),
                    CodepointRange::new('a', 'z'),
                ],
                _ if self.unicode => super::escape::ecma_space_ranges(),
                _ => vec![
                    CodepointRange::new('\t', '\r'),
                    CodepointRange::new(' ', ' '),
                ],
            };
            let mut positive = positive;
            if c.eq_ignore_ascii_case(&b'w') && self.unicode && self.case_insensitive {
                positive
                    .extend(crate::casefold::iu_word_extra().map(|e| CodepointRange::new(e, e)));
                positive = crate::hir::merge_codepoint_ranges(positive);
            }
            let negated_shorthand = c.is_ascii_uppercase();
            if self.unicode {
                if negated_shorthand {
                    cp_ranges.extend(crate::hir::negate_codepoint_ranges(&positive));
                } else if positive.iter().any(|r| r.end as u32 >= 0x80) {
                    cp_ranges.extend(positive);
                } else {
                    byte_ranges.extend(
                        positive
                            .iter()
                            .map(|r| ByteRange::new(r.start as u8, r.end as u8)),
                    );
                }
            } else {
                let bytes: Vec<ByteRange> = positive
                    .iter()
                    .map(|r| ByteRange::new(r.start as u8, r.end as u8))
                    .collect();
                if negated_shorthand {
                    byte_ranges.extend(crate::hir::negate_byte_ranges(&bytes));
                } else {
                    byte_ranges.extend(bytes);
                }
            }
            return Ok(());
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
            self.parse_u_hex4()
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

/// A scalar class, written as a byte class when every member is ASCII and
/// the class is not negated (the two read the same).
pub(super) fn class_of(ranges: Vec<CodepointRange>, negated: bool) -> CharClass {
    if !negated && ranges.iter().all(|r| (r.end as u32) < 0x80) {
        return CharClass::Bytes {
            ranges: ranges
                .iter()
                .map(|r| ByteRange::new(r.start as u8, r.end as u8))
                .collect(),
            negated: false,
        };
    }
    CharClass::Unicode { ranges, negated }
}
