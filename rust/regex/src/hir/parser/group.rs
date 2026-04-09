//! Group parsing — `(...)`, `(?:...)`, `(?flags)`, `(?flags:...)`.

use super::*;

impl<'a> Parser<'a> {
    /// Parse `(...)` or `(?:...)` or `(?flags)` or `(?flags:...)`.
    pub(super) fn parse_group(&mut self) -> Result<Hir, ParseError> {
        self.expect(b'(')?;

        if self.peek() == Some(b'?') {
            self.advance();

            // Check for non-capturing group (?:...)
            if self.peek() == Some(b':') {
                self.advance();
                let inner = self.parse_alternation()?;
                self.expect(b')')?;
                return Ok(Hir::Group(Box::new(inner)));
            }

            // Inline flags: (?s), (?i), (?si), (?flags:...)
            let saved_dotall = self.dotall;
            let saved_unicode = self.unicode;
            let saved_ci = self.case_insensitive;
            self.parse_flags()?;

            if self.peek() == Some(b':') {
                // Scoped flags: (?flags:pattern)
                self.advance();
                let inner = self.parse_alternation()?;
                self.expect(b')')?;
                // Restore flags after scoped group.
                self.dotall = saved_dotall;
                self.unicode = saved_unicode;
                self.case_insensitive = saved_ci;
                return Ok(Hir::Group(Box::new(inner)));
            }

            if self.peek() == Some(b')') {
                // Bare flag group (?s) — sets flags for the remainder.
                self.advance();
                return Ok(Hir::Empty);
            }

            return Err(self.err("invalid group syntax".into()));
        }

        // Capturing group (treated as transparent).
        let inner = self.parse_alternation()?;
        self.expect(b')')?;
        Ok(Hir::Group(Box::new(inner)))
    }

    /// Parse inline flags (s, i, u, etc.). Modifies parser state.
    fn parse_flags(&mut self) -> Result<(), ParseError> {
        while let Some(b) = self.peek() {
            match b {
                b's' => {
                    self.advance();
                    self.dotall = true;
                }
                b'i' => {
                    self.advance();
                    self.case_insensitive = true;
                }
                b'u' => {
                    self.advance();
                    self.unicode = true;
                }
                _ => break,
            }
        }
        Ok(())
    }
}
