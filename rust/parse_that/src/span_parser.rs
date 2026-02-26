use std::borrow::Cow;

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
    /// Like JsonString but returns span including the quote delimiters.
    /// Used by BBNF codegen where the regex captures the full quoted string.
    JsonStringQuoted,

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
            SpanKind::JsonStringQuoted => json_string_fast_quoted(state),

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

/// Monolithic JSON string scanner — SIMD-accelerated via memchr2.
/// Returns span including the quote delimiters (matches regex behavior).
#[inline]
pub fn sp_json_string_quoted<'a>() -> SpanParser<'a> {
    SpanParser {
        kind: SpanKind::JsonStringQuoted,
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

/// Core JSON string scanner with configurable span bounds.
/// When `include_quotes` is false, returns content between quotes (exclusive).
/// When `include_quotes` is true, returns full span including delimiters.
#[inline(always)]
fn json_string_fast_inner<'a>(state: &mut ParserState<'a>, include_quotes: bool) -> Option<Span<'a>> {
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
                    i += 1; // consume closing quote
                    state.offset = i;
                    return if include_quotes {
                        Some(Span::new(start, i, state.src))
                    } else {
                        Some(Span::new(start + 1, i - 1, state.src))
                    };
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

/// Scans a JSON string `"..."` with `\`-escape handling using SIMD (memchr2).
/// Returns the span of the *content* (between the quotes, exclusive of `"`).
#[inline(always)]
pub(crate) fn json_string_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    json_string_fast_inner(state, false)
}

/// Scans a JSON string `"..."` with `\`-escape handling using SIMD (memchr2).
/// Returns the span including the quote delimiters (matches regex behavior).
#[inline(always)]
pub(crate) fn json_string_fast_quoted<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    json_string_fast_inner(state, true)
}

// ── JSON string with full escape decoding ─────────────────────

/// Decode 4 hex digits at `bytes[i..i+4]` into a `u16`.
#[inline]
fn decode_hex4(bytes: &[u8], i: usize) -> Option<u16> {
    if i + 4 > bytes.len() {
        return None;
    }
    let mut val: u16 = 0;
    // Unrolled — 4 iterations, branchless per digit
    for j in 0..4 {
        let b = unsafe { *bytes.get_unchecked(i + j) };
        let digit = match b {
            b'0'..=b'9' => b - b'0',
            b'a'..=b'f' => b - b'a' + 10,
            b'A'..=b'F' => b - b'A' + 10,
            _ => return None,
        };
        val = (val << 4) | digit as u16;
    }
    Some(val)
}

/// Slow path: unescape a JSON string that contains at least one backslash.
/// `content_start` is the index of the first byte after the opening `"`.
/// `first_backslash` is the index of the first `\` found by the fast scan.
#[cold]
fn json_string_unescape<'a>(
    state: &mut ParserState<'a>,
    content_start: usize,
    first_backslash: usize,
) -> Option<Cow<'a, str>> {
    let bytes = state.src_bytes;
    // Pre-allocate: content before first escape + room for more
    let mut out = String::with_capacity(first_backslash - content_start + 32);
    // Copy everything before the first backslash
    out.push_str(unsafe {
        std::str::from_utf8_unchecked(&bytes[content_start..first_backslash])
    });

    let mut i = first_backslash;
    loop {
        // i points at a backslash
        debug_assert_eq!(bytes[i], b'\\');
        i += 1; // skip backslash
        if i >= bytes.len() {
            return None;
        }
        match unsafe { *bytes.get_unchecked(i) } {
            b'"' => {
                out.push('"');
                i += 1;
            }
            b'\\' => {
                out.push('\\');
                i += 1;
            }
            b'/' => {
                out.push('/');
                i += 1;
            }
            b'b' => {
                out.push('\u{0008}');
                i += 1;
            }
            b'f' => {
                out.push('\u{000C}');
                i += 1;
            }
            b'n' => {
                out.push('\n');
                i += 1;
            }
            b'r' => {
                out.push('\r');
                i += 1;
            }
            b't' => {
                out.push('\t');
                i += 1;
            }
            b'u' => {
                i += 1; // skip 'u'
                let code = decode_hex4(bytes, i)?;
                i += 4;
                if (0xD800..=0xDBFF).contains(&code) {
                    // High surrogate — expect \uDCxx low surrogate
                    if i + 6 <= bytes.len()
                        && unsafe { *bytes.get_unchecked(i) } == b'\\'
                        && unsafe { *bytes.get_unchecked(i + 1) } == b'u'
                    {
                        let low = decode_hex4(bytes, i + 2)?;
                        if (0xDC00..=0xDFFF).contains(&low) {
                            let cp = 0x10000
                                + ((code as u32 - 0xD800) << 10)
                                + (low as u32 - 0xDC00);
                            out.push(char::from_u32(cp)?);
                            i += 6;
                        } else {
                            return None; // invalid low surrogate
                        }
                    } else {
                        return None; // lone high surrogate
                    }
                } else if (0xDC00..=0xDFFF).contains(&code) {
                    return None; // lone low surrogate
                } else {
                    out.push(char::from_u32(code as u32)?);
                }
            }
            _ => return None, // invalid escape character
        }

        // Scan for next `"` or `\` — copies literal segments in bulk
        match memchr::memchr2(b'"', b'\\', bytes.get(i..)?) {
            None => return None,
            Some(pos) => {
                // Copy literal segment between escapes
                out.push_str(unsafe {
                    std::str::from_utf8_unchecked(&bytes[i..i + pos])
                });
                i += pos;
                if unsafe { *bytes.get_unchecked(i) } == b'"' {
                    state.offset = i + 1;
                    return Some(Cow::Owned(out));
                }
                // Another backslash — continue loop
            }
        }
    }
}

/// Scans and decodes a JSON string `"..."` with full escape processing.
/// Returns `Cow::Borrowed` for strings without escapes (zero-copy fast path),
/// `Cow::Owned` for strings that require unescaping (\\n, \\uXXXX, etc.).
#[inline(always)]
pub(crate) fn json_string_decoded_fast<'a>(
    state: &mut ParserState<'a>,
) -> Option<Cow<'a, str>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    if bytes.get(start) != Some(&b'"') {
        return None;
    }
    let content_start = start + 1;
    let mut i = content_start;

    // Fast path: SIMD scan hoping for no escapes
    loop {
        match memchr::memchr2(b'"', b'\\', bytes.get(i..)?) {
            None => return None, // unterminated
            Some(pos) => {
                i += pos;
                if unsafe { *bytes.get_unchecked(i) } == b'"' {
                    // No escapes — return borrowed slice (zero-copy)
                    let s = unsafe {
                        std::str::from_utf8_unchecked(&bytes[content_start..i])
                    };
                    state.offset = i + 1;
                    return Some(Cow::Borrowed(s));
                }
                // Hit a backslash — delegate to cold unescape path
                return json_string_unescape(state, content_start, i);
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

// ── Monolithic helpers for json_value_fast ─────────────────────

/// Inline whitespace skip — modifies state.offset directly.
/// Unlike `trim_leading_whitespace` (which returns a delta), this updates in place.
#[inline(always)]
pub(crate) fn skip_ws(state: &mut ParserState) {
    let bytes = state.src_bytes;
    let mut i = state.offset;
    let end = bytes.len();
    while i < end {
        match unsafe { *bytes.get_unchecked(i) } {
            b' ' | b'\t' | b'\n' | b'\r' => i += 1,
            _ => break,
        }
    }
    state.offset = i;
}

/// Fast number parser with dedicated integer fast path.
/// Pure integers (no `.`/`e`/`E`) are converted directly from accumulated u64,
/// bypassing `fast_float2` entirely. Floats fall through to Eisel-Lemire.
#[inline(always)]
pub(crate) fn number_fast(state: &mut ParserState) -> Option<f64> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;

    if i >= len {
        return None;
    }

    // Optional sign
    let neg = if unsafe { *bytes.get_unchecked(i) } == b'-' {
        i += 1;
        if i >= len {
            return None;
        }
        true
    } else {
        false
    };

    // Accumulate integer digits with wrapping arithmetic
    let digit_start = i;
    let mut int_val: u64 = 0;
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if !b.is_ascii_digit() {
            break;
        }
        int_val = int_val.wrapping_mul(10).wrapping_add((b & 0x0f) as u64);
        i += 1;
    }
    if i == digit_start {
        return None;
    }

    let digit_count = i - digit_start;

    // Check for float indicator
    let next = if i < len {
        unsafe { *bytes.get_unchecked(i) }
    } else {
        0
    };
    if next == b'.' || next == b'e' || next == b'E' {
        // Float path: continue scanning fraction/exponent, then fast_float2
        if next == b'.' {
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
                    i = exp_mark; // backtrack 'e' with no digits
                }
            }
        }
        state.offset = i;
        let span = unsafe { state.src.get_unchecked(start..i) };
        return Some(fast_float2::parse(span).unwrap_or(f64::NAN));
    }

    // Pure integer — no '.' or 'e'/'E' follows
    state.offset = i;
    if digit_count <= 15
        || (digit_count == 16 && int_val <= 9_007_199_254_740_992)
    {
        // Integers up to 2^53 (9_007_199_254_740_992) fit exactly in f64.
        // 15-digit integers are always < 10^15 < 2^50, safe unconditionally.
        // 16-digit integers need an explicit range check against 2^53.
        let val = if neg {
            -(int_val as i64) as f64
        } else {
            int_val as f64
        };
        Some(val)
    } else {
        // Large integers — use fast_float2 for exact conversion
        let span = unsafe { state.src.get_unchecked(start..i) };
        Some(fast_float2::parse(span).unwrap_or(f64::NAN))
    }
}
