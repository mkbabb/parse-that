//! Cursor primitives — byte-level peek/advance/expect over the source.

use super::*;

impl<'a> Parser<'a> {
    pub(super) fn at_end(&self) -> bool {
        self.pos >= self.src.len()
    }

    pub(super) fn peek(&self) -> Option<u8> {
        self.src.get(self.pos).copied()
    }

    pub(super) fn advance(&mut self) -> Option<u8> {
        let b = self.src.get(self.pos).copied()?;
        self.pos += 1;
        Some(b)
    }

    pub(super) fn expect(&mut self, expected: u8) -> Result<(), ParseError> {
        match self.advance() {
            Some(b) if b == expected => Ok(()),
            Some(b) => Err(self.err(format!(
                "expected '{}', found '{}'",
                expected as char, b as char
            ))),
            None => Err(self.err(format!(
                "expected '{}', found end of pattern",
                expected as char
            ))),
        }
    }

    pub(super) fn err(&self, message: String) -> ParseError {
        ParseError {
            message,
            offset: self.pos,
        }
    }
}
