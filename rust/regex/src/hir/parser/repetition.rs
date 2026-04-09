//! Quantifier parsing — `*`, `+`, `?`, `{n}`, `{n,}`, `{n,m}`, lazy variants.

use super::*;

impl<'a> Parser<'a> {
    pub(super) fn parse_quantified(&mut self) -> Result<Hir, ParseError> {
        let atom = self.parse_atom()?;

        let (min, max) = match self.peek() {
            Some(b'*') => {
                self.advance();
                (0, None)
            }
            Some(b'+') => {
                self.advance();
                (1, None)
            }
            Some(b'?') => {
                self.advance();
                (0, Some(1))
            }
            Some(b'{') => self.parse_repetition_bounds()?,
            _ => return Ok(atom),
        };

        let greedy = if self.peek() == Some(b'?') {
            self.advance();
            false
        } else {
            true
        };

        Ok(Hir::Repetition(Repetition {
            sub: Box::new(atom),
            min,
            max,
            greedy,
        }))
    }

    /// Parse `{n}`, `{n,}`, or `{n,m}`.
    fn parse_repetition_bounds(&mut self) -> Result<(u32, Option<u32>), ParseError> {
        self.expect(b'{')?;
        let n = self.parse_decimal()?;
        let max = if self.peek() == Some(b',') {
            self.advance();
            if self.peek() == Some(b'}') {
                None // {n,} = unbounded
            } else {
                Some(self.parse_decimal()?)
            }
        } else {
            Some(n) // {n} = exact
        };
        self.expect(b'}')?;
        Ok((n, max))
    }

    fn parse_decimal(&mut self) -> Result<u32, ParseError> {
        let start = self.pos;
        while self.peek().is_some_and(|b| b.is_ascii_digit()) {
            self.advance();
        }
        if self.pos == start {
            return Err(self.err("expected decimal number".into()));
        }
        let s = std::str::from_utf8(&self.src[start..self.pos]).unwrap();
        s.parse::<u32>()
            .map_err(|_| self.err("decimal number too large".into()))
    }
}
