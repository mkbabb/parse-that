use regex::Regex;

use crate::parse::{trim_leading_whitespace, Parser, ParserFn};
use crate::state::{ParserState, Span};
use crate::utils::extract_bounds;
use std::ops::RangeBounds;

use aho_corasick::{AhoCorasick, AhoCorasickBuilder, Anchored, Input, MatchKind, StartKind};

// ── Flags (same values as Parser flags) ───────────────────────

const FLAG_TRIM_WS: u8 = 0b0001;
const FLAG_SAVE_STATE: u8 = 0b0010;

// ── SpanParser: enum-dispatched, zero-boxing for Span hot path ─

pub struct SpanParser<'a> {
    kind: SpanKind<'a>,
    flags: u8,
}

enum SpanKind<'a> {
    // === Leaves (no inner parser, no vtable) ===
    StringLiteral(&'static [u8]),
    RegexMatch(Regex),
    AhoCorasickMatch(AhoCorasick),
    TakeWhileByte(fn(u8) -> bool),
    TakeWhileChar(Box<dyn Fn(char) -> bool + 'a>),
    NextN(usize),
    Epsilon,
    /// Monolithic JSON number scanner: [-]digits[.digits][(e|E)[+-]digits]
    JsonNumber,
    /// Monolithic JSON string scanner: `"` ... `"` with `\`-escapes, using memchr2.
    /// Returns the span of the *content* (between the quotes, exclusive).
    JsonString,

    // === Flat combinators (no nesting depth) ===
    Seq(Vec<SpanParser<'a>>),
    OneOf(Vec<SpanParser<'a>>),
    Many {
        inner: Box<SpanParser<'a>>,
        lo: usize,
        hi: usize,
    },
    SepBy {
        inner: Box<SpanParser<'a>>,
        sep: Box<SpanParser<'a>>,
        lo: usize,
        hi: usize,
    },
    Opt(Box<SpanParser<'a>>),
    Wrap {
        left: Box<SpanParser<'a>>,
        inner: Box<SpanParser<'a>>,
        right: Box<SpanParser<'a>>,
    },
    Skip(Box<SpanParser<'a>>, Box<SpanParser<'a>>),
    Next(Box<SpanParser<'a>>, Box<SpanParser<'a>>),
    Not(Box<SpanParser<'a>>, Box<SpanParser<'a>>),
    LookAhead(Box<SpanParser<'a>>, Box<SpanParser<'a>>),

    // === Escape hatch ===
    Boxed(Box<dyn ParserFn<'a, Span<'a>> + 'a>),
}

impl<'a> SpanParser<'a> {
    // ── Core dispatch ─────────────────────────────────────────

    #[inline(always)]
    pub fn call(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        if self.flags == 0 {
            return self.call_inner(state);
        }
        // Fast path: trim_ws only (most common flag combination)
        if self.flags == FLAG_TRIM_WS {
            state.offset += trim_leading_whitespace(state);
            let result = self.call_inner(state);
            if result.is_some() {
                state.offset += trim_leading_whitespace(state);
            }
            return result;
        }
        self.call_with_flags_cold(state)
    }

    #[inline(never)]
    fn call_with_flags_cold(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        if self.flags & FLAG_TRIM_WS != 0 {
            state.offset += trim_leading_whitespace(state);
        }
        let checkpoint = if self.flags & FLAG_SAVE_STATE != 0 {
            Some(state.offset)
        } else {
            None
        };

        let result = self.call_inner(state);

        if let Some(cp) = checkpoint {
            if result.is_none() {
                state.furthest_offset = state.furthest_offset.max(state.offset);
                state.offset = cp;
                return None;
            }
        }
        // Skip post-trim on failure
        if result.is_some() && self.flags & FLAG_TRIM_WS != 0 {
            state.offset += trim_leading_whitespace(state);
        }
        result
    }

    #[inline(always)]
    fn call_inner(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        match &self.kind {
            SpanKind::StringLiteral(s_bytes) => {
                let end = s_bytes.len();
                if end == 0 {
                    return Some(Span::new(state.offset, state.offset, state.src));
                }
                let slc = state.src_bytes.get(state.offset..)?;
                if slc.len() >= end
                    && slc[0] == s_bytes[0]
                    && (end == 1 || slc[1..end].starts_with(&s_bytes[1..]))
                {
                    let start = state.offset;
                    state.offset += end;
                    Some(Span::new(start, state.offset, state.src))
                } else {
                    None
                }
            }

            SpanKind::RegexMatch(re) => {
                if state.is_at_end() {
                    return None;
                }
                let slc = state.src.get(state.offset..)?;
                let m = re.find_at(slc, 0)?;
                if m.start() != 0 {
                    return None;
                }
                let start = state.offset;
                state.offset += m.end();
                Some(Span::new(start, state.offset, state.src))
            }

            SpanKind::AhoCorasickMatch(ac) => {
                let slc = state.src.get(state.offset..)?;
                let input = Input::new(slc).anchored(Anchored::Yes);
                let m = ac.find(input)?;
                let start = state.offset;
                state.offset += m.end();
                Some(Span::new(start, state.offset, state.src))
            }

            SpanKind::TakeWhileByte(f) => {
                let bytes = state.src_bytes;
                let start = state.offset;
                let end = bytes.len();
                let mut i = start;
                while i < end && f(unsafe { *bytes.get_unchecked(i) }) {
                    i += 1;
                }
                if i == start {
                    return None;
                }
                state.offset = i;
                Some(Span::new(start, i, state.src))
            }

            SpanKind::TakeWhileChar(f) => {
                let slc = state.src.get(state.offset..)?;
                let mut len = slc
                    .char_indices()
                    .take_while(|(_, c)| f(*c))
                    .map(|(i, _)| i)
                    .last()?;
                len += 1;
                while len < slc.len() && !slc.is_char_boundary(len) {
                    len += 1;
                }
                let start = state.offset;
                state.offset += len;
                Some(Span::new(start, state.offset, state.src))
            }

            SpanKind::NextN(amount) => {
                if state.is_at_end() {
                    return None;
                }
                let start = state.offset;
                state.offset += amount;
                Some(Span::new(start, state.offset, state.src))
            }

            SpanKind::Epsilon => Some(Span::new(state.offset, state.offset, state.src)),

            SpanKind::JsonNumber => number_span_fast(state),

            SpanKind::JsonString => json_string_fast(state),

            SpanKind::Seq(parsers) => {
                let start = state.offset;
                for p in parsers {
                    p.call(state)?;
                }
                Some(Span::new(start, state.offset, state.src))
            }

            SpanKind::OneOf(parsers) => {
                for p in parsers {
                    let cp = state.offset;
                    if let Some(span) = p.call(state) {
                        return Some(span);
                    }
                    state.furthest_offset = state.furthest_offset.max(state.offset);
                    state.offset = cp;
                }
                None
            }

            SpanKind::Many { inner, lo, hi } => {
                let start = state.offset;
                let mut end = state.offset;
                let mut count = 0;
                while count < *hi {
                    match inner.call(state) {
                        Some(span) => {
                            end = span.end;
                            count += 1;
                        }
                        None => break,
                    }
                }
                if count >= *lo {
                    Some(Span::new(start, end, state.src))
                } else {
                    None
                }
            }

            SpanKind::SepBy {
                inner,
                sep,
                lo,
                hi,
            } => {
                let start = state.offset;
                let mut end = state.offset;
                let mut count = 0;
                while count < *hi {
                    if let Some(span) = inner.call(state) {
                        end = span.end;
                        count += 1;
                    } else {
                        break;
                    }
                    let cp = state.offset;
                    if sep.call(state).is_none() {
                        state.offset = cp;
                        break;
                    }
                }
                if count >= *lo {
                    Some(Span::new(start, end, state.src))
                } else {
                    None
                }
            }

            SpanKind::Opt(inner) => {
                let start = state.offset;
                if inner.call(state).is_none() {
                    return Some(Span::new(start, start, state.src));
                }
                Some(Span::new(start, state.offset, state.src))
            }

            SpanKind::Wrap { left, inner, right } => {
                left.call(state)?;
                let middle = inner.call(state)?;
                right.call(state)?;
                Some(Span::new(middle.start, middle.end, state.src))
            }

            SpanKind::Skip(first, second) => {
                let span = first.call(state)?;
                second.call(state)?;
                Some(span)
            }

            SpanKind::Next(first, second) => {
                first.call(state)?;
                second.call(state)
            }

            SpanKind::Not(main, negated) => {
                let span = main.call(state)?;
                if negated.call(state).is_none() {
                    return Some(span);
                }
                None
            }

            SpanKind::LookAhead(main, lookahead) => {
                let span = main.call(state)?;
                let offset_after = state.offset;
                let result = lookahead.call(state);
                state.offset = offset_after;
                result?;
                Some(span)
            }

            SpanKind::Boxed(inner) => inner.call(state),
        }
    }

    // ── Combinators with automatic flattening ─────────────────

    /// Sequential composition: flattens Seq chains.
    #[inline]
    pub fn then_span(self, other: SpanParser<'a>) -> SpanParser<'a> {
        let mut parsers = match self.kind {
            SpanKind::Seq(v) if self.flags == 0 => v,
            _ => vec![self],
        };
        match other.kind {
            SpanKind::Seq(v) if other.flags == 0 => parsers.extend(v),
            _ => parsers.push(other),
        };
        SpanParser {
            kind: SpanKind::Seq(parsers),
            flags: 0,
        }
    }

    /// Alternation: flattens OneOf chains.
    #[inline]
    pub fn or(self, other: SpanParser<'a>) -> SpanParser<'a> {
        let mut parsers = match self.kind {
            SpanKind::OneOf(v) if self.flags == 0 => v,
            _ => vec![self],
        };
        match other.kind {
            SpanKind::OneOf(v) if other.flags == 0 => parsers.extend(v),
            _ => parsers.push(other),
        };
        SpanParser {
            kind: SpanKind::OneOf(parsers),
            flags: 0,
        }
    }

    #[inline]
    pub fn opt_span(self) -> SpanParser<'a> {
        SpanParser {
            kind: SpanKind::Opt(Box::new(self)),
            flags: 0,
        }
    }

    #[inline]
    pub fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> SpanParser<'a> {
        let (lo, hi) = extract_bounds(bounds);
        SpanParser {
            kind: SpanKind::Many {
                inner: Box::new(self),
                lo,
                hi,
            },
            flags: 0,
        }
    }

    #[inline]
    pub fn sep_by_span(
        self,
        sep: SpanParser<'a>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> SpanParser<'a> {
        let (lo, hi) = extract_bounds(bounds);
        SpanParser {
            kind: SpanKind::SepBy {
                inner: Box::new(self),
                sep: Box::new(sep),
                lo,
                hi,
            },
            flags: 0,
        }
    }

    #[inline]
    pub fn wrap_span(
        self,
        left: SpanParser<'a>,
        right: SpanParser<'a>,
    ) -> SpanParser<'a> {
        SpanParser {
            kind: SpanKind::Wrap {
                left: Box::new(left),
                inner: Box::new(self),
                right: Box::new(right),
            },
            flags: 0,
        }
    }

    #[inline]
    pub fn skip_span(self, next: SpanParser<'a>) -> SpanParser<'a> {
        SpanParser {
            kind: SpanKind::Skip(Box::new(self), Box::new(next)),
            flags: 0,
        }
    }

    #[inline]
    pub fn next_after(self, next: SpanParser<'a>) -> SpanParser<'a> {
        SpanParser {
            kind: SpanKind::Next(Box::new(self), Box::new(next)),
            flags: 0,
        }
    }

    #[inline]
    pub fn not_span(self, negated: SpanParser<'a>) -> SpanParser<'a> {
        SpanParser {
            kind: SpanKind::Not(Box::new(self), Box::new(negated)),
            flags: 0,
        }
    }

    #[inline]
    pub fn look_ahead_span(self, lookahead: SpanParser<'a>) -> SpanParser<'a> {
        SpanParser {
            kind: SpanKind::LookAhead(Box::new(self), Box::new(lookahead)),
            flags: 0,
        }
    }

    // ── Flag setters ──────────────────────────────────────────

    #[inline]
    pub fn trim_whitespace(mut self) -> SpanParser<'a> {
        self.flags |= FLAG_TRIM_WS;
        self
    }

    #[inline]
    pub fn save_state(mut self) -> SpanParser<'a> {
        self.flags |= FLAG_SAVE_STATE;
        self
    }

    // ── Bridge to Parser<'a, O> ───────────────────────────────

    /// Convert to a generic `Parser<'a, Span<'a>>`.
    #[inline]
    pub fn into_parser(self) -> Parser<'a, Span<'a>> {
        Parser::new(move |state: &mut ParserState<'a>| self.call(state))
    }

    /// Map Span output to any type, producing a generic Parser.
    #[inline]
    pub fn map<O: 'a>(self, f: fn(Span<'a>) -> O) -> Parser<'a, O> {
        Parser::new(move |state: &mut ParserState<'a>| self.call(state).map(f))
    }

    /// Map with a closure (not just fn pointer).
    #[inline]
    pub fn map_closure<O: 'a>(self, f: impl Fn(Span<'a>) -> O + 'a) -> Parser<'a, O> {
        Parser::new(move |state: &mut ParserState<'a>| self.call(state).map(&f))
    }
}

impl<'a> std::ops::BitOr for SpanParser<'a> {
    type Output = SpanParser<'a>;

    #[inline]
    fn bitor(self, other: SpanParser<'a>) -> Self::Output {
        self.or(other)
    }
}

impl<'a> From<SpanParser<'a>> for Parser<'a, Span<'a>> {
    #[inline]
    fn from(sp: SpanParser<'a>) -> Self {
        sp.into_parser()
    }
}


// ── Leaf constructors ─────────────────────────────────────────

/// Match exact string literal (byte comparison).
/// The string must be `'static` (string literals, leaked strings).
#[inline]
pub fn sp_string<'a>(s: &'static str) -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::StringLiteral(s.as_bytes()),
        flags: 0,
    }
}

/// Match regex pattern. The pattern string is compiled at construction time.
pub fn sp_regex<'a>(r: &str) -> SpanParser<'a> {
    let re = Regex::new(r).unwrap_or_else(|_| panic!("Failed to compile regex: {}", r));
    SpanParser {
        kind: SpanKind::RegexMatch(re),
        flags: 0,
    }
}

/// Match any of the given string patterns (Aho-Corasick). Compiled at construction time.
pub fn sp_any<'a>(patterns: &[&str]) -> SpanParser<'a> {
    let ac = AhoCorasickBuilder::new()
        .match_kind(MatchKind::LeftmostFirst)
        .start_kind(StartKind::Anchored)
        .build(patterns)
        .expect("failed to build aho-corasick automaton");
    SpanParser {
        kind: SpanKind::AhoCorasickMatch(ac),
        flags: 0,
    }
}

/// Take bytes while predicate holds (byte-level, ASCII-safe).
#[inline]
pub fn sp_take_while_byte<'a>(f: fn(u8) -> bool) -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::TakeWhileByte(f),
        flags: 0,
    }
}

/// Take characters while predicate holds (char-level, Unicode-safe).
#[inline]
pub fn sp_take_while_char<'a>(f: impl Fn(char) -> bool + 'a) -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::TakeWhileChar(Box::new(f)),
        flags: 0,
    }
}

/// Consume exactly N bytes.
#[inline]
pub fn sp_next<'a>(amount: usize) -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::NextN(amount),
        flags: 0,
    }
}

/// Always succeeds, consuming nothing (empty span).
#[inline]
pub fn sp_epsilon<'a>() -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::Epsilon,
        flags: 0,
    }
}

/// Monolithic JSON number scanner.
#[inline]
pub fn sp_json_number<'a>() -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::JsonNumber,
        flags: 0,
    }
}

/// Monolithic JSON string scanner — SIMD-accelerated via memchr2.
/// Returns span of content between quotes (exclusive of delimiters).
#[inline]
pub fn sp_json_string<'a>() -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::JsonString,
        flags: 0,
    }
}

/// Wrap a boxed `ParserFn` as a SpanParser escape hatch.
pub fn sp_boxed<'a>(inner: impl ParserFn<'a, Span<'a>>) -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::Boxed(Box::new(inner)),
        flags: 0,
    }
}

// ── Monolithic number scanner ─────────────────────────────────

/// Scans `[-]digits[.digits][(e|E)[+-]digits]` in one byte loop.
#[inline(always)]
fn number_span_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;

    if i >= len {
        return None;
    }

    // Optional sign
    if unsafe { *bytes.get_unchecked(i) } == b'-' {
        i += 1;
        if i >= len {
            return None;
        }
    }

    // Required integer digits
    let digit_start = i;
    while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
        i += 1;
    }
    if i == digit_start {
        return None; // no digits
    }

    // Optional fraction
    if i < len && unsafe { *bytes.get_unchecked(i) } == b'.' {
        i += 1;
        let frac_start = i;
        while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
            i += 1;
        }
        if i == frac_start {
            // '.' with no digits after — backtrack the dot
            i -= 1;
        }
    }

    // Optional exponent
    if i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b == b'e' || b == b'E' {
            let exp_mark = i;
            i += 1;
            if i < len {
                let b = unsafe { *bytes.get_unchecked(i) };
                if b == b'+' || b == b'-' {
                    i += 1;
                }
            }
            let exp_digit_start = i;
            while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
                i += 1;
            }
            if i == exp_digit_start {
                // 'e' with no digits — backtrack
                i = exp_mark;
            }
        }
    }

    if i == start {
        return None;
    }

    state.offset = i;
    Some(Span::new(start, i, state.src))
}

// ── Monolithic JSON string scanner ────────────────────────────

/// Scans a JSON string `"..."` with `\`-escape handling using SIMD (memchr2).
/// Returns the span of the *content* (between the quotes, exclusive of `"`).
#[inline(always)]
fn json_string_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    if bytes.get(start) != Some(&b'"') {
        return None;
    }
    let mut i = start + 1;
    loop {
        // SIMD scan for next '"' or '\\'
        match memchr::memchr2(b'"', b'\\', bytes.get(i..)?) {
            None => return None, // unterminated string
            Some(pos) => {
                i += pos;
                if unsafe { *bytes.get_unchecked(i) } == b'"' {
                    let content_start = start + 1;
                    let content_end = i;
                    i += 1; // consume closing quote
                    state.offset = i;
                    return Some(Span::new(content_start, content_end, state.src));
                }
                // backslash: skip escape sequence
                i += 1;
                if i >= bytes.len() {
                    return None;
                }
                match unsafe { *bytes.get_unchecked(i) } {
                    b'u' => {
                        if i + 4 >= bytes.len() {
                            return None;
                        }
                        i += 5; // \uXXXX — skip u + 4 hex digits
                    }
                    _ => i += 1, // \n, \t, \\, \", etc.
                }
            }
        }
    }
}

// ── Utility: number_span_fast as a standalone Parser ──────────

/// Monolithic number span parser — replaces the 12-combinator chain.
#[inline]
pub fn number_span_fast_parser<'a>() -> Parser<'a, Span<'a>> {
    Parser::new(move |state: &mut ParserState<'a>| number_span_fast(state))
}
