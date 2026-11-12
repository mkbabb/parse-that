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

            // `\b` and `\B` outside a class are the ECMAScript word-boundary
            // assertions (sk-v27 A-9), never backspace. Inside a class `\b` is
            // backspace (`parse_class_escape_single`).
            // Under `/iu` the word set gains U+017F and U+212A, which the
            // `Hir` v1 boundary (the ASCII set) cannot carry: refused, named,
            // never read with the wrong set (its reading is the Hir v2
            // lookaround of LW3.RX-1f).
            Some(b'b' | b'B') if self.unicode && self.case_insensitive => Err(self.err(
                "\\b and \\B under case-insensitive Unicode mode use the /iu word set (U+017F, U+212A), which Hir v1 cannot carry".into(),
            )),
            Some(b'b') => Ok(Hir::Look(Look::WordBoundary)),
            Some(b'B') => Ok(Hir::Look(Look::NotWordBoundary)),

            // Literal escapes.
            Some(b) if is_escapable(b) => Ok(self.maybe_case_fold_byte(b)),

            Some(b) => Err(self.err(format!("invalid escape: \\{}", b as char))),
            None => Err(self.err("unexpected end after backslash".into())),
        }
    }

    /// `\xHH` — two hex digits. In Unicode mode it names the scalar U+00HH
    /// (its UTF-8 bytes); in byte mode, the byte.
    fn parse_hex_escape(&mut self) -> Result<Hir, ParseError> {
        let hi = self.parse_hex_digit()?;
        let lo = self.parse_hex_digit()?;
        let b = (hi << 4) | lo;
        if self.unicode && b >= 0x80 {
            return Ok(self.scalar_literal(b as char));
        }
        Ok(self.maybe_case_fold_byte(b))
    }

    /// `\u{HHHH}` or `\uHHHH`.
    fn parse_unicode_escape(&mut self) -> Result<Hir, ParseError> {
        if self.peek() == Some(b'{') {
            self.advance();
            let cp = self.parse_hex_codepoint()?;
            self.expect(b'}')?;
            let ch = char::from_u32(cp)
                .ok_or_else(|| self.err(format!("invalid codepoint U+{:04X}", cp)))?;
            Ok(self.scalar_literal(ch))
        } else {
            let cp = self.parse_u_hex4()?;
            let ch = char::from_u32(cp)
                .ok_or_else(|| self.err(format!("invalid codepoint U+{:04X}", cp)))?;
            Ok(self.scalar_literal(ch))
        }
    }

    /// The four hex digits after `\u`. In Unicode mode a lead surrogate
    /// escape followed by a trail surrogate escape (`\uD83D\uDE00`) is the
    /// one scalar they encode (ECMA-262 RegExpUnicodeEscapeSequence
    /// [+UnicodeMode]); a lone surrogate stays a surrogate, which has no
    /// scalar and is refused by the caller.
    pub(super) fn parse_u_hex4(&mut self) -> Result<u32, ParseError> {
        let lead = self.parse_hex4()?;
        if self.unicode
            && (0xD800..=0xDBFF).contains(&lead)
            && self.src.get(self.pos) == Some(&b'\\')
            && self.src.get(self.pos + 1) == Some(&b'u')
        {
            let save = self.pos;
            self.pos += 2;
            match self.parse_hex4() {
                Ok(trail) if (0xDC00..=0xDFFF).contains(&trail) => {
                    return Ok(0x1_0000 + ((lead - 0xD800) << 10) + (trail - 0xDC00));
                }
                _ => self.pos = save,
            }
        }
        Ok(lead)
    }

    fn parse_hex4(&mut self) -> Result<u32, ParseError> {
        let mut cp = 0u32;
        for _ in 0..4 {
            cp = (cp << 4) | self.parse_hex_digit()? as u32;
        }
        Ok(cp)
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
            Some(b) if b.is_ascii_hexdigit() => Ok(match b {
                b'0'..=b'9' => b - b'0',
                b'a'..=b'f' => b - b'a' + 10,
                b'A'..=b'F' => b - b'A' + 10,
                _ => unreachable!(),
            }),
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
        u32::from_str_radix(s, 16).map_err(|_| self.err("hex codepoint too large".into()))
    }

    // ── Shorthand classes ───────────────────────────────────────────

    fn shorthand_digit(&self, negated: bool) -> Hir {
        self.shorthand(&[(b'0', b'9')], negated)
    }

    /// `\w`: `[A-Za-z0-9_]`; under `/iu` also the scalars whose folding is
    /// in it (U+017F, U+212A), ECMA-262 WordCharacters.
    fn shorthand_word(&self, negated: bool) -> Hir {
        const ASCII: &[(u8, u8)] = &[(b'0', b'9'), (b'A', b'Z'), (b'_', b'_'), (b'a', b'z')];
        if self.unicode && self.case_insensitive {
            let mut ranges: Vec<CodepointRange> = ASCII
                .iter()
                .map(|&(lo, hi)| CodepointRange::new(lo as char, hi as char))
                .collect();
            ranges.extend(crate::casefold::iu_word_extra().map(|e| CodepointRange::new(e, e)));
            return Hir::Class(CharClass::Unicode {
                ranges: crate::hir::merge_codepoint_ranges(ranges),
                negated,
            });
        }
        self.shorthand(ASCII, negated)
    }

    /// `\s` is ECMAScript's WhiteSpace and LineTerminator set; in byte mode,
    /// its ASCII members.
    fn shorthand_space(&self, negated: bool) -> Hir {
        if self.unicode {
            return Hir::Class(CharClass::Unicode {
                ranges: ecma_space_ranges(),
                negated,
            });
        }
        self.shorthand(&[(0x09, 0x0D), (0x20, 0x20)], negated)
    }

    /// An ASCII shorthand class. Negated in Unicode mode, its complement is
    /// taken over scalar values, so it consumes a whole scalar (u/v
    /// semantics, sk-v27 LW3.RX-1d); in byte mode, over bytes.
    fn shorthand(&self, ascii: &[(u8, u8)], negated: bool) -> Hir {
        if self.unicode && negated {
            return Hir::Class(CharClass::Unicode {
                ranges: ascii
                    .iter()
                    .map(|&(lo, hi)| CodepointRange::new(lo as char, hi as char))
                    .collect(),
                negated: true,
            });
        }
        Hir::Class(CharClass::Bytes {
            ranges: ascii
                .iter()
                .map(|&(lo, hi)| ByteRange::new(lo, hi))
                .collect(),
            negated,
        })
    }

    /// Produce a literal or a case-insensitive class for a single byte
    /// (an ASCII byte, or any byte in byte mode).
    pub(super) fn maybe_case_fold_byte(&self, b: u8) -> Hir {
        if self.case_insensitive && b.is_ascii() {
            return self.scalar_literal(b as char);
        }
        Hir::Literal(vec![b])
    }

    /// One scalar as a literal (its UTF-8 bytes), or under `i` the class of
    /// the scalars that canonicalize with it (ECMA-262 Canonicalize: simple
    /// case folding in Unicode mode, the non-u toUppercase rule in byte
    /// mode).
    pub(super) fn scalar_literal(&self, c: char) -> Hir {
        if self.case_insensitive {
            let eq = crate::casefold::equivalents(c, self.unicode);
            if eq.len() > 1 {
                let ranges = eq.into_iter().map(|e| CodepointRange::new(e, e)).collect();
                return Hir::Class(super::class::class_of(
                    crate::hir::merge_codepoint_ranges(ranges),
                    false,
                ));
            }
        }
        let mut buf = [0u8; 4];
        Hir::Literal(c.encode_utf8(&mut buf).as_bytes().to_vec())
    }
}

/// ECMAScript `\s`: WhiteSpace (TAB, VT, FF, ZWNBSP, and every `Zs` scalar)
/// and LineTerminator (LF, CR, LS, PS), sorted and merged (ECMA-262
/// §22.2.2.9, CharacterClassEscape `s`; `Zs` at the Unicode version of the
/// pinned UCD).
pub(crate) fn ecma_space_ranges() -> Vec<CodepointRange> {
    const RANGES: &[(u32, u32)] = &[
        (0x0009, 0x000D),
        (0x0020, 0x0020),
        (0x00A0, 0x00A0),
        (0x1680, 0x1680),
        (0x2000, 0x200A),
        (0x2028, 0x2029),
        (0x202F, 0x202F),
        (0x205F, 0x205F),
        (0x3000, 0x3000),
        (0xFEFF, 0xFEFF),
    ];
    RANGES
        .iter()
        .map(|&(lo, hi)| {
            CodepointRange::new(char::from_u32(lo).unwrap(), char::from_u32(hi).unwrap())
        })
        .collect()
}
