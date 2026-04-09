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
        } else {
            // Default: . matches everything except \n.
            Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(b'\n', b'\n')],
                negated: true,
            })
        }
    }
}
