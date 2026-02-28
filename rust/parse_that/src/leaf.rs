use regex::Regex;

use crate::parse::Parser;
use crate::state::{ParserState, Span};

use aho_corasick::{AhoCorasickBuilder, Anchored, Input, MatchKind, StartKind};

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

#[inline]
pub fn epsilon<'a>() -> Parser<'a, ()> {
    let epsilon = move |_: &mut ParserState<'a>| Some(());
    Parser::new(epsilon)
}

#[inline(always)]
pub fn string_impl<'a>(s_bytes: &[u8], end: &usize, state: &mut ParserState<'a>) -> Option<Span<'a>> {
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
