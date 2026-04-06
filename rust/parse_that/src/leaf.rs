use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

use crate::parse::Parser;
use crate::state::{ParserState, Span};

use aho_corasick::{AhoCorasick, AhoCorasickBuilder, Anchored, Input, MatchKind, StartKind};

/// Global Aho-Corasick cache — avoids rebuilding automata on repeated parser construction.
/// Key is the sorted, joined pattern list.
pub fn cached_aho_corasick(patterns: &[&str]) -> Arc<AhoCorasick> {
    static CACHE: OnceLock<Mutex<HashMap<String, Arc<AhoCorasick>>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    let key = patterns.join("\x00");
    let mut map = cache.lock().unwrap();
    if let Some(ac) = map.get(&key) {
        return Arc::clone(ac);
    }
    let ac = Arc::new(
        AhoCorasickBuilder::new()
            .match_kind(MatchKind::LeftmostFirst)
            .start_kind(StartKind::Anchored)
            .build(patterns)
            .expect("failed to build aho-corasick automaton"),
    );
    map.insert(key, Arc::clone(&ac));
    ac
}

/// Global DFA cache — avoids recompiling the same pattern on repeated parser construction.
pub fn cached_dfa(pattern: &str) -> Arc<crate::regex::dfa::Dfa> {
    use std::sync::RwLock;
    static CACHE: OnceLock<RwLock<HashMap<String, Arc<crate::regex::dfa::Dfa>>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| RwLock::new(HashMap::new()));

    // Fast path: read-only lock for cache hit (no contention).
    {
        let map = cache.read().unwrap();
        if let Some(dfa) = map.get(pattern) {
            return Arc::clone(dfa);
        }
    }

    // Slow path: write lock for cache miss (rare after warmup).
    let mut map = cache.write().unwrap();
    // Double-check after acquiring write lock.
    if let Some(dfa) = map.get(pattern) {
        return Arc::clone(dfa);
    }
    let dfa = Arc::new(
        crate::regex::dfa::Dfa::compile(pattern)
            .unwrap_or_else(|| panic!("Failed to compile regex to DFA: {}", pattern)),
    );
    map.insert(pattern.to_owned(), Arc::clone(&dfa));
    dfa
}

#[inline(always)]
pub fn trim_leading_whitespace(state: &ParserState<'_>) -> usize {
    let bytes = state.src_bytes;
    let mut i = state.offset;
    let end = bytes.len();

    // Fast path: first byte is not whitespace (most common case)
    if i >= end
        || !matches!(
            unsafe { *bytes.get_unchecked(i) },
            b' ' | b'\t' | b'\n' | b'\r'
        )
    {
        return 0;
    }

    i += 1; // we know the first byte is whitespace

    // SIMD: process 16 bytes at a time for longer spans
    {
        use std::simd::prelude::*;
        while i + 16 <= end {
            let chunk = u8x16::from_slice(&bytes[i..i + 16]);
            let mask = chunk.simd_eq(u8x16::splat(b' '))
                | chunk.simd_eq(u8x16::splat(b'\t'))
                | chunk.simd_eq(u8x16::splat(b'\n'))
                | chunk.simd_eq(u8x16::splat(b'\r'));
            if mask.all() {
                i += 16;
                continue;
            }
            let first_non_ws = (!mask).to_bitmask().trailing_zeros() as usize;
            return i + first_non_ws - state.offset;
        }
    }

    // Scalar tail
    while i < end {
        match unsafe { *bytes.get_unchecked(i) } {
            b' ' | b'\t' | b'\n' | b'\r' => i += 1,
            _ => break,
        }
    }
    i - state.offset
}

/// Convenience: skip leading whitespace, advancing the state offset.
#[inline(always)]
pub fn trim_leading_whitespace_mut(state: &mut ParserState<'_>) {
    let n = trim_leading_whitespace(state);
    state.offset += n;
}

/// Find the first occurrence of any of 4 target bytes in `haystack`.
/// Returns `(position, byte_found)`. Uses SIMD to scan 16 bytes per iteration.
///
/// Used by delimiter-scan codegen to replace 2 sequential `memchr` calls
/// (find delimiter, then find pivot within range) with a single pass that
/// classifies all structural bytes simultaneously.
#[inline(always)]
pub fn find_first_of_4(haystack: &[u8], b0: u8, b1: u8, b2: u8, b3: u8) -> Option<(usize, u8)> {
    use std::simd::prelude::*;

    let v0 = u8x16::splat(b0);
    let v1 = u8x16::splat(b1);
    let v2 = u8x16::splat(b2);
    let v3 = u8x16::splat(b3);

    let len = haystack.len();
    let mut i = 0;

    // SIMD: 16 bytes at a time.
    while i + 16 <= len {
        let chunk = u8x16::from_slice(&haystack[i..]);
        let mask = chunk.simd_eq(v0)
            | chunk.simd_eq(v1)
            | chunk.simd_eq(v2)
            | chunk.simd_eq(v3);
        if mask.any() {
            let pos = mask.to_bitmask().trailing_zeros() as usize;
            let idx = i + pos;
            return Some((idx, unsafe { *haystack.get_unchecked(idx) }));
        }
        i += 16;
    }

    // Scalar tail.
    while i < len {
        let b = unsafe { *haystack.get_unchecked(i) };
        if b == b0 || b == b1 || b == b2 || b == b3 {
            return Some((i, b));
        }
        i += 1;
    }

    None
}

// ── Nibble-LUT SIMD byte classification ─────────────────────────────────────
//
// Technique from simdjson: two 16-byte lookup tables indexed by the low and
// high nibbles of each input byte.  A byte matches if the AND of both lookups
// is non-zero.  Each target gets its own bit (up to 8), so cross-target
// nibble collisions don't cause false positives.
//
// On x86-64 this compiles to two VPSHUFB instructions per 16-byte chunk.
// On ARM it compiles to TBL.

/// Build nibble lookup tables for SIMD byte classification.
/// Supports up to 8 unique target bytes with zero false positives.
#[inline]
pub fn build_nibble_luts(targets: &[u8]) -> ([u8; 16], [u8; 16]) {
    debug_assert!(
        targets.len() <= 8,
        "nibble LUT supports at most 8 targets, got {}",
        targets.len()
    );
    let mut lo_lut = [0u8; 16];
    let mut hi_lut = [0u8; 16];
    let mut i = 0;
    while i < targets.len() {
        let bit = 1u8 << i;
        lo_lut[(targets[i] & 0x0F) as usize] |= bit;
        hi_lut[(targets[i] >> 4) as usize] |= bit;
        i += 1;
    }
    (lo_lut, hi_lut)
}

/// SIMD nibble-LUT byte scanner: find first occurrence of any target byte
/// in `haystack` using two 16-byte lookup tables + `swizzle_dyn` (vpshufb/tbl).
///
/// Processes 16 bytes per iteration.  The `lo_lut`/`hi_lut` must be pre-built
/// via [`build_nibble_luts`].
///
/// Marked `#[inline(never)]` to prevent SIMD code from bloating I-cache when
/// inlined into hot scanner loops.
#[inline(never)]
pub fn find_first_of_nibble_lut(
    haystack: &[u8],
    lo_lut: &[u8; 16],
    hi_lut: &[u8; 16],
) -> Option<(usize, u8)> {
    use std::simd::prelude::*;

    let lo = u8x16::from_array(*lo_lut);
    let hi = u8x16::from_array(*hi_lut);
    let lo_mask = u8x16::splat(0x0F);

    let len = haystack.len();
    let mut i = 0;

    // SIMD: 16 bytes at a time
    while i + 16 <= len {
        let chunk = u8x16::from_slice(&haystack[i..i + 16]);
        let lo_nibbles = chunk & lo_mask;
        let hi_nibbles = chunk >> 4;
        let lo_result = lo.swizzle_dyn(lo_nibbles);
        let hi_result = hi.swizzle_dyn(hi_nibbles);
        let matched = lo_result & hi_result;
        let is_match = matched.simd_ne(u8x16::splat(0));
        if is_match.any() {
            let pos = is_match.to_bitmask().trailing_zeros() as usize;
            let idx = i + pos;
            return Some((idx, unsafe { *haystack.get_unchecked(idx) }));
        }
        i += 16;
    }

    // Scalar tail
    while i < len {
        let b = unsafe { *haystack.get_unchecked(i) };
        if lo_lut[(b & 0x0F) as usize] & hi_lut[(b >> 4) as usize] != 0 {
            return Some((i, b));
        }
        i += 1;
    }

    None
}

/// Find the first occurrence of any target byte in `haystack`.
/// Returns `(position, byte_found)`.
///
/// Auto-dispatches to the optimal strategy based on target count:
/// - 1–3: `memchr` (hardware-accelerated AVX2/SSE2)
/// - 4:   SIMD `u8x16` parallel equality (4 splat + OR)
/// - 5–8: nibble LUT + `swizzle_dyn` (2 VPSHUFB per 16 bytes)
/// - 9+:  256-byte scalar LUT
///
/// Callers should pass deduplicated targets for best performance.
#[inline]
pub fn find_first_of(haystack: &[u8], targets: &[u8]) -> Option<(usize, u8)> {
    match targets.len() {
        0 => None,
        1 => {
            let p = memchr::memchr(targets[0], haystack)?;
            Some((p, unsafe { *haystack.get_unchecked(p) }))
        }
        2 => {
            let p = memchr::memchr2(targets[0], targets[1], haystack)?;
            Some((p, unsafe { *haystack.get_unchecked(p) }))
        }
        3 => {
            let p = memchr::memchr3(targets[0], targets[1], targets[2], haystack)?;
            Some((p, unsafe { *haystack.get_unchecked(p) }))
        }
        4 => find_first_of_4(haystack, targets[0], targets[1], targets[2], targets[3]),
        5..=8 => {
            let (lo_lut, hi_lut) = build_nibble_luts(targets);
            find_first_of_nibble_lut(haystack, &lo_lut, &hi_lut)
        }
        _ => {
            // 9+ targets: 256-byte scalar LUT
            let mut lut = [false; 256];
            let mut j = 0;
            while j < targets.len() {
                lut[targets[j] as usize] = true;
                j += 1;
            }
            let mut i = 0;
            let len = haystack.len();
            while i < len {
                let b = unsafe { *haystack.get_unchecked(i) };
                if lut[b as usize] {
                    return Some((i, b));
                }
                i += 1;
            }
            None
        }
    }
}

/// Find the first occurrence of any of 3 target bytes in `haystack`.
/// Returns `(position, byte_found)`. Uses SIMD to scan 16 bytes per iteration.
#[inline(always)]
pub fn find_first_of_3(haystack: &[u8], b0: u8, b1: u8, b2: u8) -> Option<(usize, u8)> {
    use std::simd::prelude::*;

    let v0 = u8x16::splat(b0);
    let v1 = u8x16::splat(b1);
    let v2 = u8x16::splat(b2);

    let len = haystack.len();
    let mut i = 0;

    while i + 16 <= len {
        let chunk = u8x16::from_slice(&haystack[i..]);
        let mask = chunk.simd_eq(v0) | chunk.simd_eq(v1) | chunk.simd_eq(v2);
        if mask.any() {
            let pos = mask.to_bitmask().trailing_zeros() as usize;
            let idx = i + pos;
            return Some((idx, unsafe { *haystack.get_unchecked(idx) }));
        }
        i += 16;
    }

    while i < len {
        let b = unsafe { *haystack.get_unchecked(i) };
        if b == b0 || b == b1 || b == b2 {
            return Some((i, b));
        }
        i += 1;
    }

    None
}

#[inline]
pub fn epsilon<'a>() -> Parser<'a, ()> {
    let epsilon = move |_: &mut ParserState<'a>| Some(());
    Parser::new(epsilon)
}

#[inline(always)]
pub fn string_impl<'a>(
    s_bytes: &[u8],
    end: &usize,
    state: &mut ParserState<'a>,
) -> Option<Span<'a>> {
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
    let string = move |state: &mut ParserState<'a>| match string_impl(s_bytes, &end, state) {
        Some(span) => Some(span.as_str()),
        None => {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            None
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
    let string = move |state: &mut ParserState<'a>| match string_impl(s_bytes, &end, state) {
        Some(span) => Some(span),
        None => {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            None
        }
    };
    Parser::new(string)
}

#[inline(always)]
fn dfa_impl<'a>(dfa: &crate::regex::dfa::Dfa, state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = &state.src_bytes[state.offset..];
    let end = dfa.find_at(bytes, 0)?;
    if end == 0 {
        return None;
    }
    let start = state.offset;
    state.offset += end;
    Some(Span::new(start, state.offset, state.src))
}

#[inline(always)]
#[allow(clippy::manual_map)]
pub fn regex<'a>(r: &'a str) -> Parser<'a, &'a str> {
    let dfa = cached_dfa(r);
    #[cfg(feature = "diagnostics")]
    let label: &'static str = Box::leak(format!("/{}/", r).into_boxed_str());
    let f = move |state: &mut ParserState<'a>| match dfa_impl(&dfa, state) {
        Some(span) => Some(span.as_str()),
        None => {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            None
        }
    };
    Parser::new(f)
}

#[inline(always)]
#[allow(clippy::manual_map)]
pub fn regex_span<'a>(r: &'a str) -> Parser<'a, Span<'a>> {
    let dfa = cached_dfa(r);
    #[cfg(feature = "diagnostics")]
    let label: &'static str = Box::leak(format!("/{}/", r).into_boxed_str());
    let f = move |state: &mut ParserState<'a>| match dfa_impl(&dfa, state) {
        Some(span) => Some(span),
        None => {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            None
        }
    };
    Parser::new(f)
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
    enum TakeUntilScan {
        One(u8),
        Two(u8, u8),
        Three(u8, u8, u8),
        Lut(Box<[bool; 256]>),
    }

    let mut lut = [false; 256];
    let mut unique = [0u8; 3];
    let mut unique_count = 0usize;
    let mut overflow = false;
    for &b in excluded {
        let idx = b as usize;
        if lut[idx] {
            continue;
        }
        lut[idx] = true;
        if unique_count < 3 {
            unique[unique_count] = b;
            unique_count += 1;
        } else {
            overflow = true;
        }
    }
    let scan = if overflow {
        TakeUntilScan::Lut(Box::new(lut))
    } else {
        match unique_count {
            1 => TakeUntilScan::One(unique[0]),
            2 => TakeUntilScan::Two(unique[0], unique[1]),
            3 => TakeUntilScan::Three(unique[0], unique[1], unique[2]),
            _ => TakeUntilScan::Lut(Box::new(lut)),
        }
    };
    #[cfg(feature = "diagnostics")]
    let label: &'static str = {
        let chars: String = excluded.iter().map(|&b| b as char).collect();
        Box::leak(format!("any byte not in [{}]", chars).into_boxed_str())
    };
    let take_until = move |state: &mut ParserState<'a>| {
        let bytes = state.src_bytes;
        let start = state.offset;
        if start >= bytes.len() {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            return None;
        }
        let scan_len = match &scan {
            TakeUntilScan::One(b1) => {
                memchr::memchr(*b1, &bytes[start..]).unwrap_or(bytes.len() - start)
            }
            TakeUntilScan::Two(b1, b2) => {
                memchr::memchr2(*b1, *b2, &bytes[start..]).unwrap_or(bytes.len() - start)
            }
            TakeUntilScan::Three(b1, b2, b3) => {
                memchr::memchr3(*b1, *b2, *b3, &bytes[start..]).unwrap_or(bytes.len() - start)
            }
            TakeUntilScan::Lut(lut) => {
                let mut i = start;
                let end = bytes.len();
                while i < end && !lut[unsafe { *bytes.get_unchecked(i) } as usize] {
                    i += 1;
                }
                i - start
            }
        };
        if scan_len == 0 {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            return None;
        }
        let end = start + scan_len;
        state.offset = end;
        Some(Span::new(start, end, state.src))
    };
    Parser::new(take_until)
}

#[inline]
pub fn next_span<'a>(amount: usize) -> Parser<'a, Span<'a>> {
    let next = move |state: &mut ParserState<'a>| {
        let start = state.offset;
        let new_offset = start + amount;
        if new_offset > state.src.len() {
            return None;
        }
        state.offset = new_offset;
        Some(Span::new(start, new_offset, state.src))
    };
    Parser::new(next)
}

pub fn any_span<'a>(patterns: &[&'a str]) -> Parser<'a, Span<'a>> {
    let ac = cached_aho_corasick(patterns);
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
pub fn dispatch_byte<'a, O: 'a>(table: Vec<(u8, Parser<'a, O>)>) -> Parser<'a, O> {
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
        } else {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            None
        }
    })
}

/// First-byte dispatch with multiple bytes mapping to the same parser.
/// Avoids duplicating parsers for bytes that share the same handler (e.g., digits 0-9).
pub fn dispatch_byte_multi<'a, O: 'a>(table: Vec<(&[u8], Parser<'a, O>)>) -> Parser<'a, O> {
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
        } else {
            #[cfg(feature = "diagnostics")]
            state.add_expected(label);
            None
        }
    })
}
