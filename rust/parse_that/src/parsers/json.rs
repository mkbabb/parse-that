use std::borrow::Cow;

use crate::parse::*;
use crate::span_parser::*;
use crate::state::{ParserState, Span};

use pprint::Pretty;

// ── Monolithic number scanner ─────────────────────────────────

/// Scans `[-]digits[.digits][(e|E)[+-]digits]` in one byte loop.
#[inline(always)]
pub(crate) fn number_span_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
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
    let pos = memchr::memchr2(b'"', b'\\', bytes.get(i..)?)?;
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
    json_string_unescape(state, content_start, i)
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

// ── JSON Value types and parsers ──────────────────────────────

#[derive(Pretty, Debug, Clone, PartialEq)]
pub enum JsonValue<'a> {
    #[pprint(rename = "null")]
    Null,
    Bool(bool),
    Number(f64),
    String(Cow<'a, str>),
    Array(Vec<JsonValue<'a>>),
    Object(Vec<(Cow<'a, str>, JsonValue<'a>)>),
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    // ── String parser using monolithic SIMD scanner ────────────
    // NOTE: combinator path returns raw spans (no unescape).
    // Use json_parser_fast() for full escape decoding.

    let json_string_content = || -> Parser<'a, Cow<'a, str>> {
        sp_json_string().map(|s| Cow::Borrowed(s.as_str()))
    };

    // ── Leaf values ───────────────────────────────────────────

    let json_null: Parser<'a, JsonValue<'a>> =
        sp_string("null").map(|_| JsonValue::Null);
    let json_true: Parser<'a, JsonValue<'a>> =
        sp_string("true").map(|_| JsonValue::Bool(true));
    let json_false: Parser<'a, JsonValue<'a>> =
        sp_string("false").map(|_| JsonValue::Bool(false));

    let json_number = || -> Parser<'a, JsonValue<'a>> {
        let num: SpanParser<'a> = sp_json_number();
        num.map_closure(|s| {
            JsonValue::Number(fast_float2::parse(s.as_str()).unwrap_or(f64::NAN))
        })
    };

    let json_string = || -> Parser<'a, JsonValue<'a>> {
        json_string_content().map(JsonValue::String)
    };

    // ── Recursive structures ──────────────────────────────────

    let json_array = crate::lazy::lazy(|| {
        let comma_sp: SpanParser<'_> = sp_string(",").trim_whitespace();
        let comma = comma_sp.into_parser();

        json_value()
            .sep_by(comma, ..)
            .or_else(std::vec::Vec::new)
            .trim_whitespace()
            .wrap(crate::leaf::string_span("["), crate::leaf::string_span("]"))
            .map(JsonValue::Array)
    });

    let json_object = crate::lazy::lazy(move || {
        let colon_sp: SpanParser<'_> = sp_string(":").trim_whitespace();
        let colon = colon_sp.into_parser();
        let comma_sp: SpanParser<'_> = sp_string(",").trim_whitespace();
        let comma = comma_sp.into_parser();

        let key_value = json_string_content().skip(colon).then(json_value());

        key_value
            .sep_by(comma, ..)
            .or_else(std::vec::Vec::new)
            .trim_whitespace()
            .wrap(crate::leaf::string_span("{"), crate::leaf::string_span("}"))
            .map(JsonValue::Object)
    });

    // ── First-byte dispatch ───────────────────────────────────

    crate::leaf::dispatch_byte_multi(
        vec![
            (b"{" as &[u8], json_object),
            (b"[", json_array),
            (b"\"", json_string()),
            (b"t", json_true),
            (b"f", json_false),
            (b"n", json_null),
            (
                b"-0123456789",
                json_number(),
            ),
        ],
        None,
    )
}

pub fn json_parser<'a>() -> Parser<'a, JsonValue<'a>> {
    json_value().trim_whitespace()
}

// ── Monolithic fast JSON parser ──────────────────────────────────
//
// Eliminates all vtable hops, redundant whitespace trimming, and Span
// intermediaries. One recursive function handles the full JSON grammar
// with inline first-byte dispatch.

/// Monolithic recursive JSON value parser — zero vtable hops.
/// Whitespace is skipped exactly once per value (before dispatch)
/// and once after each comma/colon.
fn json_value_fast<'a>(state: &mut ParserState<'a>) -> Option<JsonValue<'a>> {
    skip_ws(state);

    let bytes = state.src_bytes;
    let offset = state.offset;
    if offset >= bytes.len() {
        return None;
    }

    match unsafe { *bytes.get_unchecked(offset) } {
        b'"' => {
            let s = json_string_decoded_fast(state)?;
            Some(JsonValue::String(s))
        }

        b'-' | b'0'..=b'9' => Some(JsonValue::Number(number_fast(state)?)),

        b'{' => {
            state.offset = offset + 1;
            skip_ws(state);
            if state.offset < bytes.len()
                && unsafe { *bytes.get_unchecked(state.offset) } == b'}'
            {
                state.offset += 1;
                return Some(JsonValue::Object(Vec::new()));
            }

            let mut pairs = Vec::with_capacity(4);
            loop {
                // Key: must be a JSON string (fully decoded)
                let key = json_string_decoded_fast(state)?;
                skip_ws(state);
                // Expect ':'
                if state.offset >= state.src_bytes.len()
                    || unsafe { *state.src_bytes.get_unchecked(state.offset) } != b':'
                {
                    return None;
                }
                state.offset += 1;
                // Value (recursive — skip_ws is inside json_value_fast)
                let val = json_value_fast(state)?;
                pairs.push((key, val));
                skip_ws(state);
                if state.offset >= state.src_bytes.len() {
                    return None;
                }
                match unsafe { *state.src_bytes.get_unchecked(state.offset) } {
                    b',' => {
                        state.offset += 1;
                        skip_ws(state);
                    }
                    b'}' => {
                        state.offset += 1;
                        break;
                    }
                    _ => {
                        std::hint::cold_path();
                        return None;
                    }
                }
            }

            Some(JsonValue::Object(pairs))
        }

        b'[' => {
            state.offset = offset + 1;
            skip_ws(state);
            if state.offset < bytes.len()
                && unsafe { *bytes.get_unchecked(state.offset) } == b']'
            {
                state.offset += 1;
                return Some(JsonValue::Array(Vec::new()));
            }

            let mut values = Vec::with_capacity(4);
            loop {
                values.push(json_value_fast(state)?);
                skip_ws(state);
                if state.offset >= state.src_bytes.len() {
                    return None;
                }
                match unsafe { *state.src_bytes.get_unchecked(state.offset) } {
                    b',' => {
                        state.offset += 1;
                    }
                    b']' => {
                        state.offset += 1;
                        break;
                    }
                    _ => {
                        std::hint::cold_path();
                        return None;
                    }
                }
            }

            Some(JsonValue::Array(values))
        }

        b't' => {
            if offset + 4 <= bytes.len() {
                let word = unsafe {
                    (bytes.as_ptr().add(offset) as *const u32).read_unaligned()
                };
                if word == u32::from_ne_bytes(*b"true") {
                    state.offset = offset + 4;
                    return Some(JsonValue::Bool(true));
                }
            }
            None
        }

        b'f' => {
            if offset + 5 <= bytes.len() {
                let word = unsafe {
                    (bytes.as_ptr().add(offset) as *const u32).read_unaligned()
                };
                let fifth = unsafe { *bytes.get_unchecked(offset + 4) };
                if word == u32::from_ne_bytes(*b"fals") && fifth == b'e' {
                    state.offset = offset + 5;
                    return Some(JsonValue::Bool(false));
                }
            }
            None
        }

        b'n' => {
            if offset + 4 <= bytes.len() {
                let word = unsafe {
                    (bytes.as_ptr().add(offset) as *const u32).read_unaligned()
                };
                if word == u32::from_ne_bytes(*b"null") {
                    state.offset = offset + 4;
                    return Some(JsonValue::Null);
                }
            }
            None
        }

        _ => {
            std::hint::cold_path();
            None
        }
    }
}

/// Fast monolithic JSON parser entry point.
/// Uses direct recursive dispatch — no vtable hops, no combinator overhead.
pub fn json_parser_fast<'a>() -> Parser<'a, JsonValue<'a>> {
    Parser::new(|state: &mut ParserState<'a>| {
        let result = json_value_fast(state)?;
        skip_ws(state); // consume trailing whitespace
        Some(result)
    })
}
