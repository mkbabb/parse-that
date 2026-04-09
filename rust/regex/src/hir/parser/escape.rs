//! Escape sequence parsing (outside character classes) + shorthand class
//! builders + case-fold literal helper + hex digit helpers.

use super::*;
use crate::unicode::unicode_category_ranges;

impl<'a> Parser<'a> {
    pub(super) fn parse_escape(&mut self) -> Result<Hir, ParseError> {
        self.expect(b'\\')?;

        match self.advance() {
            // Character escapes.
            Some(b'n') => Ok(Hir::Literal(vec![b'\n'])),
            Some(b'r') => Ok(Hir::Literal(vec![b'\r'])),
            Some(b't') => Ok(Hir::Literal(vec![b'\t'])),
            Some(b'f') => Ok(Hir::Literal(vec![0x0C])),
            Some(b'a') => Ok(Hir::Literal(vec![0x07])),
            Some(b'0') => Ok(Hir::Literal(vec![0])),

            // Shorthand classes.
            Some(b'd') => Ok(self.shorthand_digit(false)),
            Some(b'D') => Ok(self.shorthand_digit(true)),
            Some(b'w') => Ok(self.shorthand_word(false)),
            Some(b'W') => Ok(self.shorthand_word(true)),
            Some(b's') => Ok(self.shorthand_space(false)),
            Some(b'S') => Ok(self.shorthand_space(true)),

            // Hex escape: \xHH
            Some(b'x') => self.parse_hex_escape(),

            // Unicode escape: \u{HHHH} or \uHHHH
            Some(b'u') => self.parse_unicode_escape(),

            // Unicode property: \p{Name} or \P{Name}
            Some(b'p') => self.parse_unicode_property(false),
            Some(b'P') => self.parse_unicode_property(true),

            // Word boundary (zero-width — not supported, return empty for now).
            Some(b'b') => Ok(Hir::Literal(vec![0x08])), // \b inside regex = backspace

            // Literal escapes.
            Some(b) if is_escapable(b) => Ok(self.maybe_case_fold_byte(b)),

            Some(b) => Err(self.err(format!("invalid escape: \\{}", b as char))),
            None => Err(self.err("unexpected end after backslash".into())),
        }
    }

    /// `\xHH` — two hex digits.
    fn parse_hex_escape(&mut self) -> Result<Hir, ParseError> {
        let hi = self.parse_hex_digit()?;
        let lo = self.parse_hex_digit()?;
        Ok(Hir::Literal(vec![(hi << 4) | lo]))
    }

    /// `\u{HHHH}` or `\uHHHH`.
    fn parse_unicode_escape(&mut self) -> Result<Hir, ParseError> {
        if self.peek() == Some(b'{') {
            self.advance();
            let cp = self.parse_hex_codepoint()?;
            self.expect(b'}')?;
            let ch = char::from_u32(cp)
                .ok_or_else(|| self.err(format!("invalid codepoint U+{:04X}", cp)))?;
            let mut buf = [0u8; 4];
            let s = ch.encode_utf8(&mut buf);
            Ok(Hir::Literal(s.as_bytes().to_vec()))
        } else {
            // \uHHHH — exactly 4 hex digits.
            let mut cp = 0u32;
            for _ in 0..4 {
                let d = self.parse_hex_digit()? as u32;
                cp = (cp << 4) | d;
            }
            let ch = char::from_u32(cp)
                .ok_or_else(|| self.err(format!("invalid codepoint U+{:04X}", cp)))?;
            let mut buf = [0u8; 4];
            let s = ch.encode_utf8(&mut buf);
            Ok(Hir::Literal(s.as_bytes().to_vec()))
        }
    }

    /// Parse `\p{Name}` or `\P{Name}` — Unicode general category.
    fn parse_unicode_property(&mut self, negated: bool) -> Result<Hir, ParseError> {
        self.expect(b'{')?;
        let start = self.pos;
        while self.peek().is_some_and(|b| b != b'}') {
            self.advance();
        }
        let name = std::str::from_utf8(&self.src[start..self.pos])
            .map_err(|_| self.err("invalid UTF-8 in property name".into()))?;
        self.expect(b'}')?;

        let ranges = unicode_category_ranges(name)
            .ok_or_else(|| self.err(format!("unknown Unicode property: {}", name)))?;

        Ok(Hir::Class(CharClass::Unicode { ranges, negated }))
    }

    pub(super) fn parse_hex_digit(&mut self) -> Result<u8, ParseError> {
        match self.advance() {
            Some(b) if b.is_ascii_hexdigit() => {
                Ok(match b {
                    b'0'..=b'9' => b - b'0',
                    b'a'..=b'f' => b - b'a' + 10,
                    b'A'..=b'F' => b - b'A' + 10,
                    _ => unreachable!(),
                })
            }
            Some(b) => Err(self.err(format!("expected hex digit, found '{}'", b as char))),
            None => Err(self.err("expected hex digit, found end of pattern".into())),
        }
    }

    pub(super) fn parse_hex_codepoint(&mut self) -> Result<u32, ParseError> {
        let start = self.pos;
        while self.peek().is_some_and(|b| b.is_ascii_hexdigit()) {
            self.advance();
        }
        if self.pos == start {
            return Err(self.err("expected hex digits in \\u{...}".into()));
        }
        let s = std::str::from_utf8(&self.src[start..self.pos]).unwrap();
        u32::from_str_radix(s, 16)
            .map_err(|_| self.err("hex codepoint too large".into()))
    }

    // ── Shorthand classes ───────────────────────────────────────────

    fn shorthand_digit(&self, negated: bool) -> Hir {
        Hir::Class(CharClass::Bytes {
            ranges: vec![ByteRange::new(b'0', b'9')],
            negated,
        })
    }

    fn shorthand_word(&self, negated: bool) -> Hir {
        Hir::Class(CharClass::Bytes {
            ranges: vec![
                ByteRange::new(b'0', b'9'),
                ByteRange::new(b'A', b'Z'),
                ByteRange::new(b'_', b'_'),
                ByteRange::new(b'a', b'z'),
            ],
            negated,
        })
    }

    fn shorthand_space(&self, negated: bool) -> Hir {
        Hir::Class(CharClass::Bytes {
            ranges: vec![
                ByteRange::new(0x09, 0x0D), // \t \n \v \f \r
                ByteRange::new(0x20, 0x20), // space
            ],
            negated,
        })
    }

    /// Produce a literal or a case-insensitive class for a single byte.
    pub(super) fn maybe_case_fold_byte(&self, b: u8) -> Hir {
        if self.case_insensitive && b.is_ascii_alphabetic() {
            let lo = b.to_ascii_lowercase();
            let hi = b.to_ascii_uppercase();
            Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(hi, hi), ByteRange::new(lo, lo)],
                negated: false,
            })
        } else {
            Hir::Literal(vec![b])
        }
    }
}
