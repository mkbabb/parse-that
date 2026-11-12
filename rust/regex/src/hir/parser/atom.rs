//! Atom dispatcher — groups, classes, dot, anchors, escapes, literals.

use super::*;

impl<'a> Parser<'a> {
    pub(super) fn parse_atom(&mut self) -> Result<Hir, ParseError> {
        match self.peek() {
            Some(b'(') => self.parse_group(),
            Some(b'[') => self.parse_char_class(),
            Some(b'.') => {
                self.advance();
                Ok(self.make_dot())
            }
            Some(b'^') => {
                self.advance();
                Ok(Hir::Look(Look::Start))
            }
            Some(b'$') => {
                self.advance();
                Ok(Hir::Look(Look::End))
            }
            Some(b'\\') => self.parse_escape(),
            // A raw non-ASCII scalar under `i` is folded whole (it is read
            // one byte at a time otherwise: its bytes are the literal).
            Some(b) if b >= 0x80 && self.case_insensitive => {
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
                    .ok_or_else(|| self.err("invalid UTF-8 in pattern".into()))?;
                self.pos += len;
                Ok(self.scalar_literal(ch))
            }
            Some(b) if is_literal_char(b) => {
                self.advance();
                Ok(self.maybe_case_fold_byte(b))
            }
            Some(b) => Err(self.err(format!("unexpected character '{}'", b as char))),
            None => Err(self.err("unexpected end of pattern".into())),
        }
    }

    /// Build `.` — any byte (or any codepoint in dotall mode).
    pub(super) fn make_dot(&self) -> Hir {
        if self.dotall {
            // (?s) mode: . matches everything including \n.
            if self.unicode {
                Hir::Class(CharClass::Unicode {
                    ranges: vec![CodepointRange::new('\0', '\u{10FFFF}')],
                    negated: false,
                })
            } else {
                Hir::Class(CharClass::Bytes {
                    ranges: vec![ByteRange::new(0, 255)],
                    negated: false,
                })
            }
        } else if self.unicode {
            // Default: `.` is any scalar but a LineTerminator (LF, CR, LS,
            // PS), one scalar at a time (sk-v27 LW3.RX-1d).
            Hir::Class(CharClass::Unicode {
                ranges: vec![
                    CodepointRange::new('\n', '\n'),
                    CodepointRange::new('\r', '\r'),
                    CodepointRange::new('\u{2028}', '\u{2029}'),
                ],
                negated: true,
            })
        } else {
            // Byte mode: any byte except \n.
            Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(b'\n', b'\n')],
                negated: true,
            })
        }
    }
}
