use regex::Regex;
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

use crate::parse::Parser;
use crate::state::{ParserState, Span};

use aho_corasick::{AhoCorasickBuilder, Anchored, Input, MatchKind, StartKind};

/// Global regex cache — avoids recompiling the same pattern on repeated parser construction.
pub fn cached_regex(pattern: &str) -> Arc<Regex> {
    static CACHE: OnceLock<Mutex<HashMap<String, Arc<Regex>>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    let mut map = cache.lock().unwrap();
    if let Some(re) = map.get(pattern) {
        return Arc::clone(re);
    }
    let re = Arc::new(
        Regex::new(pattern).unwrap_or_else(|_| panic!("Failed to compile regex: {}", pattern)),
    );
    map.insert(pattern.to_owned(), Arc::clone(&re));
    re
}

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
#[allow(clippy::manual_map)]
pub fn string<'a>(s: &'a str) -> Parser<'a, &'a str> {
    let s_bytes = s.as_bytes();
    let end = s_bytes.len();
    #[cfg(feature = "diagnostics")]
    let label: &'static str = Box::leak(format!("\"{}\"", s).into_boxed_str());
    let string = move |state: &mut ParserState<'a>| {
        match string_impl(s_bytes, &end, state) {
            Some(span) => Some(span.as_str()),
            None => {
                #[cfg(feature = "diagnostics")]
                state.add_expected(label);
                None
            }
        }
    };
    Parser::new(string)
}

#[inline(always)]
#[allow(clippy::manual_map)]
pub fn string_span<'a>(s: &'a str) -> Parser<'a, Span<'a>> {
    let s_bytes = s.as_bytes();
    let end = s_bytes.len();
    #[cfg(feature = "diagnostics")]
    let label: &'static str = Box::leak(format!("\"{}\"", s).into_boxed_str());
    let string = move |state: &mut ParserState<'a>| {
        match string_impl(s_bytes, &end, state) {
            Some(span) => Some(span),
            None => {
                #[cfg(feature = "diagnostics")]
                state.add_expected(label);
                None
            }
        }
    };
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
#[allow(clippy::manual_map)]
pub fn regex<'a>(r: &'a str) -> Parser<'a, &'a str> {
    let re = cached_regex(r);
    #[cfg(feature = "diagnostics")]
    let label: &'static str = Box::leak(format!("/{}/", r).into_boxed_str());
    let regex = move |state: &mut ParserState<'a>| {
        match regex_impl(&re, state) {
            Some(span) => Some(span.as_str()),
            None => {
                #[cfg(feature = "diagnostics")]
                state.add_expected(label);
                None
            }
        }
    };
    Parser::new(regex)
}

#[inline(always)]
#[allow(clippy::manual_map)]
pub fn regex_span<'a>(r: &'a str) -> Parser<'a, Span<'a>> {
    let re = cached_regex(r);
    #[cfg(feature = "diagnostics")]
    let label: &'static str = Box::leak(format!("/{}/", r).into_boxed_str());
    let regex = move |state: &mut ParserState<'a>| {
        match regex_impl(&re, state) {
            Some(span) => Some(span),
            None => {
                #[cfg(feature = "diagnostics")]
                state.add_expected(label);
                None
            }
        }
    };
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
            .last();

        match len {
            Some(ref mut l) => {
                *l += 1;
                while *l < slc.len() && !slc.is_char_boundary(*l) {
                    *l += 1;
                }
                let start = state.offset;
                state.offset += *l;
                Some(Span::new(start, state.offset, state.src))
            }
            None => {
                #[cfg(feature = "diagnostics")]
                state.add_expected("matching character");
                None
            }
        }
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
            #[cfg(feature = "diagnostics")]
            state.add_expected("matching byte");
            return None;
        }
        state.offset = i;
        Some(Span::new(start, i, state.src))
    };
    Parser::new(take_while)
}

/// Match one or more bytes until any byte in `excluded` is found.
/// Uses a 256-byte LUT for branch-free scanning—10-15x faster than regex for
/// negated character classes like `/[^;{}!,]+/`.
#[inline]
pub fn take_until_any_span<'a>(excluded: &'static [u8]) -> Parser<'a, Span<'a>> {
    let mut lut = [false; 256];
    for &b in excluded {
        lut[b as usize] = true;
    }
    #[cfg(feature = "diagnostics")]
    let label: &'static str = {
        let chars: String = excluded.iter().map(|&b| b as char).collect();
        Box::leak(format!("any byte not in [{}]", chars).into_boxed_str())
    };
    let take_until = move |state: &mut ParserState<'a>| {
        let bytes = state.src_bytes;
        let start = state.offset;
        let end = bytes.len();
        let mut i = start;
        while i < end && !lut[unsafe { *bytes.get_unchecked(i) } as usize] {
            i += 1;
        }
        if i == start {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            return None;
        }
        state.offset = i;
        Some(Span::new(start, i, state.src))
    };
    Parser::new(take_until)
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
    #[cfg(feature = "diagnostics")]
    let label: &'static str = Box::leak(format!("one of {:?}", patterns).into_boxed_str());

    let any = move |state: &mut ParserState<'a>| {
        let slc = state.src.get(state.offset..)?;
        let input = Input::new(slc).anchored(Anchored::Yes);
        match ac.find(input) {
            Some(m) => {
                let start = state.offset;
                state.offset += m.end();
                Some(Span::new(start, state.offset, state.src))
            }
            None => {
                #[cfg(feature = "diagnostics")]
                state.add_expected(label);
                None
            }
        }
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
    #[cfg(feature = "diagnostics")]
    let label: &'static str = {
        let chars: Vec<char> = table.iter().map(|(b, _)| *b as char).collect();
        Box::leak(format!("one of {:?}", chars).into_boxed_str())
    };
    Parser::new(move |state: &mut ParserState<'a>| {
        let byte = *state.src_bytes.get(state.offset)?;
        if let Some(idx) = lut[byte as usize] {
            table[idx as usize].1.call(state)
        } else if let Some(ref fb) = fallback {
            fb.call(state)
        } else {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
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
    #[cfg(feature = "diagnostics")]
    let mut all_bytes: Vec<u8> = Vec::new();
    for (bytes, parser) in table {
        let idx = parsers.len() as u16;
        parsers.push(parser);
        for &byte in bytes {
            lut[byte as usize] = Some(idx);
            #[cfg(feature = "diagnostics")]
            all_bytes.push(byte);
        }
    }
    #[cfg(feature = "diagnostics")]
    let label: &'static str = {
        let chars: Vec<char> = all_bytes.iter().map(|b| *b as char).collect();
        Box::leak(format!("one of {:?}", chars).into_boxed_str())
    };
    Parser::new(move |state: &mut ParserState<'a>| {
        let byte = *state.src_bytes.get(state.offset)?;
        if let Some(idx) = lut[byte as usize] {
            parsers[idx as usize].call(state)
        } else if let Some(ref fb) = fallback {
            fb.call(state)
        } else {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            None
        }
    })
}
