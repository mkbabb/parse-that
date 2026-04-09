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

use super::*;

mod atom;
mod class;
mod cursor;
mod escape;
mod group;
mod repetition;

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
