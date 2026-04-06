//! Regex pattern parser → bespoke `Hir`.
//!
//! Hand-written recursive descent parser (not using parse-that combinators —
//! avoids circular dependency and keeps the implementation zero-copy).
//!
//! Supports the regex subset used by BBNF grammars:
//! - Character classes: `[a-z]`, `[^abc]`, `\d`, `\w`, `\s`, `\S`, `\W`, `\D`
//! - Alternation: `a|b`
//! - Concatenation: `ab`
//! - Quantifiers: `*`, `+`, `?`, `{n,m}`, lazy variants (`*?`, `+?`, etc.)
//! - Groups: `(...)`, `(?:...)`
//! - Flags: `(?s)` (dotall), `(?i)` (case-insensitive), inline flag groups
//! - Escapes: `\.`, `\\`, `\/`, `\n`, `\r`, `\t`, `\b`, `\f`, `\xHH`, `\u{XXXX}`
//! - Dot: `.`
//! - Anchors: `^`, `$`

use super::hir::*;
use super::unicode::unicode_category_ranges;

// ── Parser state ────────────────────────────────────────────────────────

struct Parser<'a> {
    src: &'a [u8],
    pos: usize,
    /// Dotall mode — `.` matches `\n`.
    dotall: bool,
    /// Unicode mode — shorthand classes are Unicode-aware.
    unicode: bool,
    /// Case-insensitive mode — literals match both cases.
    case_insensitive: bool,
}

impl<'a> Parser<'a> {
    fn new(src: &'a str, opts: &ParseOptions) -> Self {
        Self {
            src: src.as_bytes(),
            pos: 0,
            dotall: false,
            unicode: opts.unicode,
            case_insensitive: false,
        }
    }

    fn at_end(&self) -> bool {
        self.pos >= self.src.len()
    }

    fn peek(&self) -> Option<u8> {
        self.src.get(self.pos).copied()
    }

    fn advance(&mut self) -> Option<u8> {
        let b = self.src.get(self.pos).copied()?;
        self.pos += 1;
        Some(b)
    }

    fn expect(&mut self, expected: u8) -> Result<(), ParseError> {
        match self.advance() {
            Some(b) if b == expected => Ok(()),
            Some(b) => Err(self.err(format!(
                "expected '{}', found '{}'",
                expected as char, b as char
            ))),
            None => Err(self.err(format!("expected '{}', found end of pattern", expected as char))),
        }
    }

    fn err(&self, message: String) -> ParseError {
        ParseError {
            message,
            offset: self.pos,
        }
    }

    // ── Top-level ───────────────────────────────────────────────────

    /// Parse the full pattern.
    fn parse_regex(&mut self) -> Result<Hir, ParseError> {
        let hir = self.parse_alternation()?;
        if !self.at_end() {
            return Err(self.err(format!(
                "unexpected character '{}' at position {}",
                self.src[self.pos] as char,
                self.pos
            )));
        }
        Ok(hir)
    }

    // ── Alternation ─────────────────────────────────────────────────

    fn parse_alternation(&mut self) -> Result<Hir, ParseError> {
        let mut branches = vec![self.parse_concat()?];
        while self.peek() == Some(b'|') {
            self.advance();
            branches.push(self.parse_concat()?);
        }
        if branches.len() == 1 {
            Ok(branches.pop().unwrap())
        } else {
            Ok(Hir::Alternation(branches))
        }
    }

    // ── Concatenation ───────────────────────────────────────────────

    fn parse_concat(&mut self) -> Result<Hir, ParseError> {
        let mut items = Vec::new();
        while !self.at_end() {
            match self.peek() {
                Some(b'|') | Some(b')') => break,
                _ => items.push(self.parse_quantified()?),
            }
        }
        match items.len() {
            0 => Ok(Hir::Empty),
            1 => Ok(items.pop().unwrap()),
            _ => Ok(Hir::Concat(items)),
        }
    }

    // ── Quantifiers ─────────────────────────────────────────────────

    fn parse_quantified(&mut self) -> Result<Hir, ParseError> {
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

    // ── Atoms ───────────────────────────────────────────────────────

    fn parse_atom(&mut self) -> Result<Hir, ParseError> {
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

    /// Parse `(...)` or `(?:...)` or `(?flags)` or `(?flags:...)`.
    fn parse_group(&mut self) -> Result<Hir, ParseError> {
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

    /// Build `.` — any byte (or any codepoint in dotall mode).
    fn make_dot(&self) -> Hir {
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

    // ── Character classes ───────────────────────────────────────────

    /// Parse `[...]` or `[^...]`.
    ///
    /// If any Unicode escapes (`\u{...}`) are present, produces a
    /// `CharClass::Unicode`. Otherwise produces `CharClass::Bytes`.
    fn parse_char_class(&mut self) -> Result<Hir, ParseError> {
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

    // ── Escapes (outside character classes) ──────────────────────────

    fn parse_escape(&mut self) -> Result<Hir, ParseError> {
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

    fn parse_hex_digit(&mut self) -> Result<u8, ParseError> {
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

    fn parse_hex_codepoint(&mut self) -> Result<u32, ParseError> {
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

    /// Produce a literal or a case-insensitive class for a single byte.
    fn maybe_case_fold_byte(&self, b: u8) -> Hir {
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

    fn shorthand_space(&self, negated: bool) -> Hir {
        Hir::Class(CharClass::Bytes {
            ranges: vec![
                ByteRange::new(0x09, 0x0D), // \t \n \v \f \r
                ByteRange::new(0x20, 0x20), // space
            ],
            negated,
        })
    }
}

// ── Helper functions ────────────────────────────────────────────────────

/// Characters that don't need escaping outside character classes.
/// Note: `}` is allowed as a literal — it's only special after `{`.
fn is_literal_char(b: u8) -> bool {
    !matches!(
        b,
        b'(' | b')' | b'[' | b']' | b'{' | b'|' | b'*' | b'+' | b'?' | b'.' | b'^'
            | b'$' | b'\\'
    )
}

/// Characters that can be backslash-escaped.
fn is_escapable(b: u8) -> bool {
    matches!(
        b,
        b'(' | b')'
            | b'['
            | b']'
            | b'{'
            | b'}'
            | b'|'
            | b'*'
            | b'+'
            | b'?'
            | b'.'
            | b'^'
            | b'$'
            | b'\\'
            | b'/'
            | b'-'
            | b'"'
            | b'\''
    )
}

/// Merge sorted, potentially overlapping byte ranges into non-overlapping ranges.
fn merge_byte_ranges(mut ranges: Vec<ByteRange>) -> Vec<ByteRange> {
    if ranges.len() <= 1 {
        return ranges;
    }
    ranges.sort_by_key(|r| (r.start, r.end));
    let mut merged = vec![ranges[0]];
    for r in &ranges[1..] {
        let last = merged.last_mut().unwrap();
        if r.start <= last.end + 1 {
            last.end = last.end.max(r.end);
        } else {
            merged.push(*r);
        }
    }
    merged
}

// ── Public API ──────────────────────────────────────────────────────────

/// Parse a regex pattern into HIR with default options (Unicode mode).
pub fn parse(pattern: &str) -> Result<Hir, ParseError> {
    parse_with(pattern, &ParseOptions::default())
}

/// Parse a regex pattern into HIR with explicit options.
pub fn parse_with(pattern: &str, opts: &ParseOptions) -> Result<Hir, ParseError> {
    let mut parser = Parser::new(pattern, opts);
    parser.parse_regex()
}

// ── Tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn p(s: &str) -> Hir {
        parse(s).unwrap_or_else(|e| panic!("parse({:?}) failed: {}", s, e))
    }

    #[test]
    fn empty() {
        assert_eq!(p(""), Hir::Empty);
    }

    #[test]
    fn literal() {
        assert_eq!(p("abc"), Hir::Concat(vec![
            Hir::Literal(vec![b'a']),
            Hir::Literal(vec![b'b']),
            Hir::Literal(vec![b'c']),
        ]));
    }

    #[test]
    fn char_class() {
        match p("[a-z]") {
            Hir::Class(CharClass::Bytes { ranges, negated }) => {
                assert!(!negated);
                assert_eq!(ranges, vec![ByteRange::new(b'a', b'z')]);
            }
            other => panic!("expected Bytes class, got {:?}", other),
        }
    }

    #[test]
    fn negated_class() {
        match p("[^abc]") {
            Hir::Class(CharClass::Bytes { negated, .. }) => assert!(negated),
            other => panic!("expected negated Bytes class, got {:?}", other),
        }
    }

    #[test]
    fn alternation() {
        match p("a|b|c") {
            Hir::Alternation(branches) => assert_eq!(branches.len(), 3),
            other => panic!("expected Alternation, got {:?}", other),
        }
    }

    #[test]
    fn quantifiers() {
        match p("a*") {
            Hir::Repetition(Repetition { min: 0, max: None, greedy: true, .. }) => {}
            other => panic!("expected star, got {:?}", other),
        }
        match p("a+") {
            Hir::Repetition(Repetition { min: 1, max: None, greedy: true, .. }) => {}
            other => panic!("expected plus, got {:?}", other),
        }
        match p("a?") {
            Hir::Repetition(Repetition { min: 0, max: Some(1), greedy: true, .. }) => {}
            other => panic!("expected optional, got {:?}", other),
        }
    }

    #[test]
    fn lazy_quantifier() {
        match p("a*?") {
            Hir::Repetition(Repetition { min: 0, max: None, greedy: false, .. }) => {}
            other => panic!("expected lazy star, got {:?}", other),
        }
    }

    #[test]
    fn bounded_repetition() {
        match p("a{3,5}") {
            Hir::Repetition(Repetition { min: 3, max: Some(5), .. }) => {}
            other => panic!("expected {{3,5}}, got {:?}", other),
        }
    }

    #[test]
    fn non_capturing_group() {
        match p("(?:abc)") {
            Hir::Group(inner) => {
                assert!(matches!(*inner, Hir::Concat(_)));
            }
            other => panic!("expected Group, got {:?}", other),
        }
    }

    #[test]
    fn dotall_flag_unicode() {
        // (?s). in unicode mode → Unicode class matching all codepoints.
        match p("(?s).") {
            Hir::Concat(items) => {
                assert_eq!(items.len(), 2); // Empty (from flag group) + dot
                match &items[1] {
                    Hir::Class(CharClass::Unicode { ranges, negated: false }) => {
                        assert_eq!(ranges[0], CodepointRange::new('\0', '\u{10FFFF}'));
                    }
                    other => panic!("expected Unicode class for dotall, got {:?}", other),
                }
            }
            other => panic!("expected Concat, got {:?}", other),
        }
    }

    #[test]
    fn dotall_flag_byte_mode() {
        // (?s). in byte mode → Bytes class matching all bytes.
        let hir = parse_with("(?s).", &ParseOptions::byte_mode()).unwrap();
        match hir {
            Hir::Concat(items) => {
                match &items[1] {
                    Hir::Class(CharClass::Bytes { ranges, negated: false }) => {
                        assert_eq!(ranges[0], ByteRange::new(0, 255));
                    }
                    other => panic!("expected Bytes class for dotall byte mode, got {:?}", other),
                }
            }
            other => panic!("expected Concat, got {:?}", other),
        }
    }

    #[test]
    fn shorthand_classes() {
        match p(r"\d") {
            Hir::Class(CharClass::Bytes { ranges, negated: false }) => {
                assert_eq!(ranges, vec![ByteRange::new(b'0', b'9')]);
            }
            other => panic!("expected digit class, got {:?}", other),
        }
        match p(r"\w") {
            Hir::Class(CharClass::Bytes { ranges, negated: false }) => {
                assert_eq!(ranges.len(), 4); // 0-9, A-Z, _, a-z
            }
            other => panic!("expected word class, got {:?}", other),
        }
    }

    #[test]
    fn escaped_literal() {
        assert_eq!(p(r"\."), Hir::Literal(vec![b'.']));
        assert_eq!(p(r"\\"), Hir::Literal(vec![b'\\']));
        assert_eq!(p(r"\/"), Hir::Literal(vec![b'/']));
    }

    #[test]
    fn json_number() {
        // The canonical JSON number pattern should parse without error.
        let _hir = p(r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?");
    }

    #[test]
    fn json_string() {
        let _hir = p(r#""(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*""#);
    }

    #[test]
    fn css_ws_comment() {
        let _hir = p(r"(?s)(?:\s|/\*.*?\*/)*");
    }

    #[test]
    fn css_ident() {
        let _hir = p(r"[a-zA-Z_][\w-]*");
    }

    #[test]
    fn complex_ident() {
        let _hir = p(r"[\-]?[a-zA-Z_][\w-]*|--[\w-]+");
    }

    #[test]
    fn quoted_string() {
        let _hir = p(r#""(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'"#);
    }

    #[test]
    fn hex_color() {
        let _hir = p(r"[0-9a-fA-F]{3,8}");
    }

    #[test]
    fn byte_mode() {
        let hir = parse_with(r"\w", &ParseOptions::byte_mode()).unwrap();
        match hir {
            Hir::Class(CharClass::Bytes { ranges, .. }) => {
                // Byte mode: \w = [0-9A-Za-z_]
                assert_eq!(ranges.len(), 4);
            }
            other => panic!("expected Bytes class in byte mode, got {:?}", other),
        }
    }

    #[test]
    fn dot_default() {
        match p(".") {
            Hir::Class(CharClass::Bytes { negated: true, ranges }) => {
                assert_eq!(ranges, vec![ByteRange::new(b'\n', b'\n')]);
            }
            other => panic!("expected negated class for dot, got {:?}", other),
        }
    }
}
