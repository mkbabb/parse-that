use regex::Regex;

use std::cell::UnsafeCell;

use std::ops::RangeBounds;

use crate::state::{ParserState, Span};
use crate::utils::extract_bounds;

/// Structured error returned by `Parser::parse_or_error()` on failure.
#[derive(Debug, Clone)]
pub struct ParseError {
    /// The offset where the parser stopped.
    pub offset: usize,
    /// The furthest offset reached by any branch before backtracking.
    /// Useful for pointing to the "real" failure location in alternations.
    pub furthest_offset: usize,
    /// 1-based line number of the failure.
    pub line: usize,
    /// 0-based column number of the failure.
    pub column: usize,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "parse error at line {}, column {} (offset {}, furthest offset reached: {})",
            self.line, self.column, self.offset, self.furthest_offset,
        )
    }
}

impl std::error::Error for ParseError {}

#[inline(always)]
pub fn trim_leading_whitespace(state: &ParserState<'_>) -> usize {
    let bytes = state.src_bytes;
    let mut i = state.offset;
    let end = bytes.len();
    while i < end {
        match unsafe { *bytes.get_unchecked(i) } {
            b' ' | b'\t' | b'\n' | b'\r' => i += 1,
            _ => break,
        }
    }
    i - state.offset
}

type ParserResult<'a, Output> = Option<Output>;

pub trait ParserFn<'a, Output>: 'a {
    fn call(&self, state: &mut ParserState<'a>) -> ParserResult<'a, Output>;
}

impl<'a, Output, F> ParserFn<'a, Output> for F
where
    F: Fn(&mut ParserState<'a>) -> ParserResult<'a, Output> + 'a,
{
    #[inline]
    fn call(&self, state: &mut ParserState<'a>) -> ParserResult<'a, Output> {
        self(state)
    }
}

// ── Parser flags ──────────────────────────────────────────────

const FLAG_TRIM_WS: u8 = 0b0001;
const FLAG_SAVE_STATE: u8 = 0b0010;
const FLAG_EOF: u8 = 0b0100;

pub struct Parser<'a, Output> {
    pub parser_fn: Box<dyn ParserFn<'a, Output> + 'a>,
    flags: u8,
}

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    #[inline]
    pub fn new(parser_fn: impl ParserFn<'a, Output>) -> Parser<'a, Output> {
        Parser {
            parser_fn: Box::new(parser_fn),
            flags: 0,
        }
    }

    /// Core call method — inlines flag behavior to avoid wrapper boxing.
    #[inline(always)]
    pub fn call(&self, state: &mut ParserState<'a>) -> Option<Output> {
        if self.flags == 0 {
            return self.parser_fn.call(state);
        }
        // Fast path: trim_ws only (most common flag combination)
        if self.flags == FLAG_TRIM_WS {
            state.offset += trim_leading_whitespace(state);
            let result = self.parser_fn.call(state);
            if result.is_some() {
                state.offset += trim_leading_whitespace(state);
            }
            return result;
        }
        self.call_with_flags_cold(state)
    }

    #[inline(never)]
    fn call_with_flags_cold(&self, state: &mut ParserState<'a>) -> Option<Output> {
        // Pre: trim whitespace
        if self.flags & FLAG_TRIM_WS != 0 {
            state.offset += trim_leading_whitespace(state);
        }

        // Pre: save state for backtracking
        let checkpoint = if self.flags & FLAG_SAVE_STATE != 0 {
            Some(state.offset)
        } else {
            None
        };

        let result = self.parser_fn.call(state);

        // Post: handle save_state backtracking
        if let Some(cp) = checkpoint {
            if result.is_none() {
                state.furthest_offset = state.furthest_offset.max(state.offset);
                state.offset = cp;
                return None;
            }
        }

        // Post: trim whitespace — skip on failure
        if result.is_some() && self.flags & FLAG_TRIM_WS != 0 {
            state.offset += trim_leading_whitespace(state);
        }

        // Post: EOF check
        if self.flags & FLAG_EOF != 0 {
            if result.is_some() && state.offset < state.end {
                return None;
            }
        }

        result
    }

    #[inline]
    pub fn parse_return_state(&self, src: &'a str) -> (ParserResult<'a, Output>, ParserState<'a>) {
        let mut state = ParserState::new(src);
        let result = self.call(&mut state);
        (result, state)
    }

    #[inline]
    pub fn parse(&self, src: &'a str) -> Option<Output> {
        self.parse_return_state(src).0
    }

    pub fn parse_or_error(&self, src: &'a str) -> Result<Output, ParseError> {
        let (result, state) = self.parse_return_state(src);
        match result {
            Some(value) => Ok(value),
            None => Err(ParseError {
                offset: state.offset,
                furthest_offset: state.furthest_offset,
                line: state.get_line_number(),
                column: state.get_column_number(),
            }),
        }
    }

    /// Mark this parser to save/restore state on failure (checkpoint-based).
    #[inline]
    pub fn save_state(mut self) -> Parser<'a, Output> {
        self.flags |= FLAG_SAVE_STATE;
        self
    }

    /// Mark this parser to trim leading whitespace before and after.
    #[inline]
    pub fn trim_whitespace(mut self) -> Parser<'a, Output> {
        self.flags |= FLAG_TRIM_WS;
        self
    }

    /// Mark this parser to require EOF after successful parse.
    #[inline]
    pub fn eof(mut self) -> Parser<'a, Output> {
        self.flags |= FLAG_EOF;
        self
    }

    #[inline]
    pub fn then<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, (Output, Output2)>
    where
        Output2: 'a,
    {
        let with = move |state: &mut ParserState<'a>| {
            let value1 = self.call(state)?;
            let value2 = next.call(state)?;
            Some((value1, value2))
        };
        Parser::new(with)
    }

    /// Alternation with checkpoint-based backtracking (no Vec push/pop).
    #[inline]
    pub fn or(self, other: Parser<'a, Output>) -> Parser<'a, Output> {
        let or = move |state: &mut ParserState<'a>| {
            let checkpoint = state.offset;
            if let Some(value) = self.call(state) {
                return Some(value);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = checkpoint;

            let checkpoint = state.offset;
            if let Some(value) = other.call(state) {
                return Some(value);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = checkpoint;

            None
        };
        Parser::new(or)
    }

    #[inline]
    pub fn or_else(self, f: fn() -> Output) -> Parser<'a, Output> {
        let or_else = move |state: &mut ParserState<'a>| match self.call(state) {
            Some(value) => Some(value),
            None => Some(f()),
        };
        Parser::new(or_else)
    }

    #[inline]
    pub fn opt(self) -> Parser<'a, Option<Output>> {
        let opt = move |state: &mut ParserState<'a>| {
            if let Some(value) = self.call(state) {
                return Some(Some(value));
            }
            Some(None)
        };
        Parser::new(opt)
    }

    #[inline]
    pub fn not<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let not = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            if next.call(state).is_none() {
                return Some(value);
            }
            None
        };
        Parser::new(not)
    }

    #[inline]
    pub fn negate(self) -> Parser<'a, ()> {
        let negate = move |state: &mut ParserState<'a>| {
            if self.call(state).is_none() {
                return Some(());
            }
            None
        };
        Parser::new(negate)
    }

    #[inline]
    pub fn map<Output2>(self, f: fn(Output) -> Output2) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map = move |state: &mut ParserState<'a>| self.call(state).map(f);
        Parser::new(map)
    }

    #[inline]
    pub fn map_with_state<Output2>(
        self,
        f: fn(Output, usize, &mut ParserState<'a>) -> Output2,
    ) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map_with_state = move |state: &mut ParserState<'a>| {
            let offset = state.offset;
            let result = self.call(state)?;
            Some(f(result, offset, state))
        };
        Parser::new(map_with_state)
    }

    #[inline]
    pub fn skip<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let skip = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            next.call(state)?;
            Some(value)
        };
        Parser::new(skip)
    }

    #[inline]
    pub fn next<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let next = move |state: &mut ParserState<'a>| {
            self.call(state)?;
            next.call(state)
        };
        Parser::new(next)
    }

    #[inline]
    pub fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Parser<'a, Vec<Output>> {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let many = move |state: &mut ParserState<'a>| {
            let est = if lower_bound > 0 {
                lower_bound
            } else {
                let remaining = state.end.saturating_sub(state.offset);
                (remaining / 32).clamp(8, 1024)
            };
            let mut values = Vec::with_capacity(est);

            while values.len() < upper_bound {
                if let Some(value) = self.call(state) {
                    values.push(value);
                } else {
                    break;
                }
            }
            if values.len() >= lower_bound {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(many)
    }

    #[inline]
    pub fn wrap<Output2, Output3>(
        self,
        left: Parser<'a, Output2>,
        right: Parser<'a, Output3>,
    ) -> Parser<'a, Output>
    where
        Output2: 'a,
        Output3: 'a,
    {
        let wrap = move |state: &mut ParserState<'a>| {
            left.call(state)?;
            let value = self.call(state)?;
            right.call(state)?;
            Some(value)
        };
        Parser::new(wrap)
    }

    #[inline]
    pub fn trim<Output2>(self, trimmer: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            trimmer.call(state)?;
            let value = self.call(state)?;
            trimmer.call(state)?;
            Some(value)
        };
        Parser::new(trim)
    }

    #[inline]
    pub fn trim_keep<Output2>(
        self,
        trimmer: Parser<'a, Output2>,
    ) -> Parser<'a, (Output2, Output, Output2)>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            let trim1 = trimmer.call(state)?;
            let value = self.call(state)?;
            let trim2 = trimmer.call(state)?;
            Some((trim1, value, trim2))
        };
        Parser::new(trim)
    }

    #[inline]
    pub fn sep_by<Output2>(
        self,
        sep: Parser<'a, Output2>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> Parser<'a, Vec<Output>>
    where
        Output2: 'a,
    {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let est = if lower_bound > 0 {
                lower_bound
            } else {
                let remaining = state.end.saturating_sub(state.offset);
                (remaining / 32).clamp(8, 1024)
            };
            let mut values = Vec::with_capacity(est);

            while values.len() < upper_bound {
                if let Some(value) = self.call(state) {
                    values.push(value);
                } else {
                    break;
                }
                // Checkpoint-based: if sep fails, don't leave state dirty
                let cp = state.offset;
                if sep.call(state).is_none() {
                    state.offset = cp;
                    break;
                }
            }

            if values.len() >= lower_bound {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(sep_by)
    }

    #[inline]
    pub fn look_ahead<Output2>(self, parser: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let look_ahead = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            let offset_after_self = state.offset;
            let lookahead_result = parser.call(state);
            state.offset = offset_after_self;
            lookahead_result?;
            Some(value)
        };
        Parser::new(look_ahead)
    }
}

impl<'a, Output2> std::ops::BitOr<Parser<'a, Output2>> for Parser<'a, Output2>
where
    Output2: 'a,
{
    type Output = Parser<'a, Output2>;

    #[inline]
    fn bitor(self, other: Parser<'a, Output2>) -> Self::Output {
        self.or(other)
    }
}

impl<'a, Output, Output2> std::ops::Add<Parser<'a, Output2>> for Parser<'a, Output>
where
    Output: 'a,
    Output2: 'a,
{
    type Output = Parser<'a, (Output, Output2)>;

    #[inline]
    fn add(self, other: Parser<'a, Output2>) -> Self::Output {
        self.then(other)
    }
}

#[inline]
pub fn epsilon<'a>() -> Parser<'a, ()> {
    let epsilon = move |_: &mut ParserState<'a>| Some(());
    Parser::new(epsilon)
}

pub trait LazyParserFn<'a, Output>: 'a {
    fn call(&self) -> Parser<'a, Output>;
}

impl<'a, Output, F> LazyParserFn<'a, Output> for F
where
    Output: 'a,
    F: Fn() -> Parser<'a, Output> + 'a,
{
    fn call(&self) -> Parser<'a, Output> {
        (self)()
    }
}

pub struct LazyParser<'a, Output> {
    parser_fn: Box<dyn LazyParserFn<'a, Output>>,
    cached_parser: Option<Parser<'a, Output>>,
}

impl<'a, Output> LazyParser<'a, Output> {
    pub fn new<F>(parser_fn: F) -> LazyParser<'a, Output>
    where
        F: LazyParserFn<'a, Output> + 'a,
    {
        LazyParser {
            parser_fn: Box::new(parser_fn),
            cached_parser: None,
        }
    }

    #[inline]
    pub fn get(&mut self) -> &Parser<'a, Output>
    where
        Output: 'a,
        Self: 'a,
    {
        if self.cached_parser.is_none() {
            self.cached_parser = Some(self.parser_fn.call());
        }
        self.cached_parser.as_ref().unwrap()
    }
}

pub fn lazy<'a, F, Output>(f: F) -> Parser<'a, Output>
where
    Output: 'a,
    F: LazyParserFn<'a, Output> + 'a,
{
    let cell: UnsafeCell<LazyParser<'a, Output>> = UnsafeCell::new(LazyParser::new(f));

    let lazy = move |state: &mut ParserState<'a>| {
        let parser = unsafe { &mut *cell.get() }.get();
        parser.call(state)
    };

    Parser::new(lazy)
}

#[inline(always)]
fn string_impl<'a>(s_bytes: &[u8], end: &usize, state: &mut ParserState<'a>) -> Option<Span<'a>> {
    if *end == 0 {
        return Some(Span::new(state.offset, state.offset, state.src));
    }

    let Some(slc) = &state.src_bytes.get(state.offset..) else {
        return None;
    };
    if slc.len() >= *end && slc[0] == s_bytes[0] && slc[1..*end].starts_with(&s_bytes[1..]) {
        let start = state.offset;
        state.offset += end;

        Some(Span::new(start, state.offset, state.src))
    } else {
        None
    }
}

#[inline(always)]
pub fn string<'a>(s: &'a str) -> Parser<'a, &'a str> {
    let s_bytes = s.as_bytes();
    let end = s_bytes.len();
    let string = move |state: &mut ParserState<'a>| {
        string_impl(s_bytes, &end, state).map(|span| span.as_str())
    };
    Parser::new(string)
}

#[inline(always)]
pub fn string_span<'a>(s: &'a str) -> Parser<'a, Span<'a>> {
    let s_bytes = s.as_bytes();
    let end = s_bytes.len();

    let string = move |state: &mut ParserState<'a>| string_impl(s_bytes, &end, state);
    Parser::new(string)
}

#[inline(always)]
fn regex_impl<'a>(re: &Regex, state: &mut ParserState<'a>) -> Option<Span<'a>> {
    if state.is_at_end() {
        return None;
    }
    let slc = state.src.get(state.offset..)?;
    match re.find_at(slc, 0) {
        Some(m) => {
            if m.start() != 0 {
                return None;
            }
            let start = state.offset;
            state.offset += m.end();
            Some(Span::new(start, state.offset, state.src))
        }
        None => None,
    }
}

#[inline(always)]
pub fn regex<'a>(r: &'a str) -> Parser<'a, &'a str> {
    let re = Regex::new(r).unwrap_or_else(|_| panic!("Failed to compile regex: {}", r));
    let regex = move |state: &mut ParserState<'a>| regex_impl(&re, state).map(|span| span.as_str());
    Parser::new(regex)
}

#[inline(always)]
pub fn regex_span<'a>(r: &'a str) -> Parser<'a, Span<'a>> {
    let re = Regex::new(r).unwrap_or_else(|_| panic!("Failed to compile regex: {}", r));
    let regex = move |state: &mut ParserState<'a>| regex_impl(&re, state);
    Parser::new(regex)
}

#[inline]
pub fn take_while_span<'a, F>(f: F) -> Parser<'a, Span<'a>>
where
    F: Fn(char) -> bool + 'a,
{
    let take_while = move |state: &mut ParserState<'a>| {
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
    };

    Parser::new(take_while)
}

/// Fast byte-level take_while — for ASCII predicates only.
#[inline]
pub fn take_while_byte_span<'a>(f: fn(u8) -> bool) -> Parser<'a, Span<'a>> {
    let take_while = move |state: &mut ParserState<'a>| {
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
    };
    Parser::new(take_while)
}

#[inline]
pub fn next_span<'a>(amount: usize) -> Parser<'a, Span<'a>> {
    let next = move |state: &mut ParserState<'a>| {
        if state.is_at_end() {
            return None;
        }
        let start = state.offset;
        state.offset += amount;
        Some(Span::new(start, state.offset, state.src))
    };
    Parser::new(next)
}

use aho_corasick::{AhoCorasickBuilder, Anchored, Input, MatchKind, StartKind};

pub fn any_span<'a>(patterns: &[&'a str]) -> Parser<'a, Span<'a>> {
    let ac = AhoCorasickBuilder::new()
        .match_kind(MatchKind::LeftmostFirst)
        .start_kind(StartKind::Anchored)
        .build(patterns)
        .expect("failed to build aho-corasick automaton");

    let any = move |state: &mut ParserState<'a>| {
        let slc = state.src.get(state.offset..)?;
        let input = Input::new(slc).anchored(Anchored::Yes);
        let m = ac.find(input)?;

        let start = state.offset;
        state.offset += m.end();
        Some(Span::new(start, state.offset, state.src))
    };

    Parser::new(any)
}

// ── one_of: flat N-way alternation ────────────────────────────

/// Flat N-way alternation — tries each parser in order with checkpoint backtracking.
pub fn one_of<'a, O: 'a>(parsers: Vec<Parser<'a, O>>) -> Parser<'a, O> {
    Parser::new(move |state: &mut ParserState<'a>| {
        for parser in &parsers {
            let checkpoint = state.offset;
            if let Some(value) = parser.call(state) {
                return Some(value);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = checkpoint;
        }
        None
    })
}

// ── dispatch_byte: first-byte lookup table ────────────────────

/// First-byte dispatch — O(1) branch selection by peeking the next byte.
pub fn dispatch_byte<'a, O: 'a>(
    table: Vec<(u8, Parser<'a, O>)>,
    fallback: Option<Parser<'a, O>>,
) -> Parser<'a, O> {
    // Build lookup table: byte → index into table
    let mut lut: [Option<u16>; 256] = [None; 256];
    for (i, (byte, _)) in table.iter().enumerate() {
        lut[*byte as usize] = Some(i as u16);
    }
    Parser::new(move |state: &mut ParserState<'a>| {
        let byte = *state.src_bytes.get(state.offset)?;
        if let Some(idx) = lut[byte as usize] {
            table[idx as usize].1.call(state)
        } else if let Some(ref fb) = fallback {
            fb.call(state)
        } else {
            None
        }
    })
}

/// First-byte dispatch with multiple bytes mapping to the same parser.
/// Avoids duplicating parsers for bytes that share the same handler (e.g., digits 0-9).
pub fn dispatch_byte_multi<'a, O: 'a>(
    table: Vec<(&[u8], Parser<'a, O>)>,
    fallback: Option<Parser<'a, O>>,
) -> Parser<'a, O> {
    // Build lookup table: byte → index into parsers vec
    let mut lut: [Option<u16>; 256] = [None; 256];
    let mut parsers: Vec<Parser<'a, O>> = Vec::with_capacity(table.len());
    for (bytes, parser) in table {
        let idx = parsers.len() as u16;
        parsers.push(parser);
        for &byte in bytes {
            lut[byte as usize] = Some(idx);
        }
    }
    Parser::new(move |state: &mut ParserState<'a>| {
        let byte = *state.src_bytes.get(state.offset)?;
        if let Some(idx) = lut[byte as usize] {
            parsers[idx as usize].call(state)
        } else if let Some(ref fb) = fallback {
            fb.call(state)
        } else {
            None
        }
    })
}

// ── ParserSpan trait ──────────────────────────────────────────

pub trait ParserSpan<'a> {
    type Output;

    fn opt(self) -> Self::Output;
    fn opt_span(self) -> Self::Output;

    fn then(self, next: Self::Output) -> Self::Output;
    fn then_span(self, next: Self::Output) -> Self::Output;

    fn wrap(self, left: Self::Output, right: Self::Output) -> Self::Output;
    fn wrap_span(self, left: Self::Output, right: Self::Output) -> Self::Output;

    fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
    fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;

    fn sep_by(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
    fn sep_by_span(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
}

impl<'a> ParserSpan<'a> for Parser<'a, Span<'a>> {
    type Output = Parser<'a, Span<'a>>;

    #[inline]
    fn opt(self) -> Self::Output {
        let opt = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            if self.call(state).is_none() {
                return Some(Span::new(start, start, state.src));
            }
            Some(Span::new(start, state.offset, state.src))
        };
        Parser::new(opt)
    }

    #[inline]
    fn opt_span(self) -> Self::Output {
        ParserSpan::opt(self)
    }

    #[inline]
    fn then(self, other: Self::Output) -> Self::Output {
        let then = move |state: &mut ParserState<'a>| {
            let start = self.call(state)?;
            let end = other.call(state)?;
            Some(Span::new(start.start, end.end, state.src))
        };
        Parser::new(then)
    }

    #[inline]
    fn then_span(self, other: Self::Output) -> Self::Output {
        ParserSpan::then(self, other)
    }

    #[inline]
    fn wrap(self, left: Self::Output, right: Self::Output) -> Self::Output {
        let wrap = move |state: &mut ParserState<'a>| {
            left.call(state)?;
            let middle = self.call(state)?;
            right.call(state)?;
            Some(Span::new(middle.start, middle.end, state.src))
        };
        Parser::new(wrap)
    }

    #[inline]
    fn wrap_span(self, left: Self::Output, right: Self::Output) -> Self::Output {
        ParserSpan::wrap(self, left, right)
    }

    #[inline]
    fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let many = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            let mut end = state.offset;
            let mut count = 0;

            while count < upper_bound {
                match self.call(state) {
                    Some(span) => {
                        end = span.end;
                        count += 1;
                    }
                    None => break,
                }
            }

            if count >= lower_bound {
                Some(Span::new(start, end, state.src))
            } else {
                None
            }
        };
        Parser::new(many)
    }

    #[inline]
    fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        ParserSpan::many(self, bounds)
    }

    #[inline]
    fn sep_by(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            let mut end = state.offset;
            let mut count = 0;

            while count < upper_bound {
                if let Some(value) = self.call(state) {
                    end = value.end;
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

            if count >= lower_bound {
                Some(Span::new(start, end, state.src))
            } else {
                None
            }
        };
        Parser::new(sep_by)
    }

    #[inline]
    fn sep_by_span(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        ParserSpan::sep_by(self, sep, bounds)
    }
}

pub trait ParserFlat<'a, First, Last> {
    type Output;

    fn then(self, next: Parser<'a, Last>) -> Self::Output;
    fn then_flat(self, next: Parser<'a, Last>) -> Self::Output;
}

macro_rules! impl_parser_flat {
    ($($T:ident),*) => {
        #[allow(non_snake_case)]
        impl<'a, $($T,)* Last> ParserFlat<'a, ($($T,)*), Last> for Parser<'a, ($($T,)*)>
        where
            $($T: 'a,)*
            Last: 'a,
        {
            type Output = Parser<'a, ($($T,)* Last)>;

            #[inline]
            fn then(self, other: Parser<'a, Last>) -> Self::Output {
                let then = move |state: &mut ParserState<'a>| {
                    let ($($T,)*) = self.call(state)?;
                    let last = other.call(state)?;
                    Some(($($T,)* last))
                };
                Parser::new(then)
            }

            #[inline]
            fn then_flat(self, other: Parser<'a, Last>) -> Self::Output {
                return ParserFlat::then(self, other);
            }
        }
    };
}

impl_parser_flat!(B, C);
impl_parser_flat!(B, C, D);
impl_parser_flat!(B, C, D, E);
impl_parser_flat!(B, C, D, E, F);
impl_parser_flat!(B, C, D, E, F, G);
impl_parser_flat!(B, C, D, E, F, G, H);
impl_parser_flat!(B, C, D, E, F, G, H, I);
impl_parser_flat!(B, C, D, E, F, G, H, I, J);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L, M);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L, M, N);
