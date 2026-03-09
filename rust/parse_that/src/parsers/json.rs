use std::borrow::Cow;

use crate::parse::*;
use crate::span_parser::*;
use crate::state::{ParserState, Span};

use pprint::Pretty;

// ── Monolithic number scanner ─────────────────────────────────

/// Result of number scanning: span + whether it's a pure integer.
pub(crate) struct NumberSpan<'a> {
    pub span: Span<'a>,
    pub is_integer: bool,
}

/// Scans `[-]digits[.digits][(e|E)[+-]digits]` in one byte loop.
/// Returns the span and whether the number is a pure integer (no `.` or `e`/`E`).
#[inline(always)]
pub(crate) fn number_span_fast_ex<'a>(state: &mut ParserState<'a>) -> Option<NumberSpan<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    let mut is_integer = true;

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

    // Leading-zero rejection (RFC 8259): only `0` or `0.x` allowed
    let digit_count = i - digit_start;
    if digit_count > 1 && unsafe { *bytes.get_unchecked(digit_start) } == b'0' {
        // `007` etc. — return span of just the sign + `0`
        i = digit_start + 1;
        state.offset = i;
        return Some(NumberSpan {
            span: Span::new(start, i, state.src),
            is_integer: true,
        });
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
        } else {
            is_integer = false;
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
            } else {
                is_integer = false;
            }
        }
    }

    if i == start {
        return None;
    }

    state.offset = i;
    Some(NumberSpan {
        span: Span::new(start, i, state.src),
        is_integer,
    })
}

/// Convenience wrapper returning just the span (used by SpanParser).
#[inline(always)]
pub(crate) fn number_span_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    number_span_fast_ex(state).map(|ns| ns.span)
}

#[inline(always)]
fn parse_json_number_f64(span: Span<'_>, is_integer: bool) -> f64 {
    let s = span.as_str();
    let bytes = s.as_bytes();
    if !is_integer {
        return fast_float2::parse(s).expect("sp_json_number must only yield valid JSON numbers");
    }

    let (neg, digits) = if bytes.first() == Some(&b'-') {
        (true, &bytes[1..])
    } else {
        (false, bytes)
    };
    if digits.is_empty() || digits.len() > 18 {
        return fast_float2::parse(s).expect("sp_json_number must only yield valid JSON numbers");
    }

    let mut int = 0u64;
    for &b in digits {
        int = int * 10 + (b - b'0') as u64;
    }
    let num = int as f64;
    if neg { -num } else { num }
}


#[inline(always)]
fn decode_hex_nibble(b: u8) -> Option<u16> {
    match b {
        b'0'..=b'9' => Some((b - b'0') as u16),
        b'a'..=b'f' => Some((b - b'a' + 10) as u16),
        b'A'..=b'F' => Some((b - b'A' + 10) as u16),
        _ => None,
    }
}

#[inline(always)]
fn decode_hex4(bytes: &[u8], start: usize) -> Option<u16> {
    Some(
        (decode_hex_nibble(*bytes.get(start)?)? << 12)
            | (decode_hex_nibble(*bytes.get(start + 1)?)? << 8)
            | (decode_hex_nibble(*bytes.get(start + 2)?)? << 4)
            | decode_hex_nibble(*bytes.get(start + 3)?)?,
    )
}

// ── Monolithic JSON string scanner ────────────────────────────

/// Core JSON string scanner with configurable span bounds.
/// When `include_quotes` is false, returns content between quotes (exclusive).
/// When `include_quotes` is true, returns full span including delimiters.
#[inline(always)]
fn json_string_fast_inner<'a>(
    state: &mut ParserState<'a>,
    include_quotes: bool,
) -> Option<Span<'a>> {
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
                        // Check for surrogate pairs: \uD800-\uDBFF must be followed by \uDC00-\uDFFF.
                        let hi = decode_hex4(bytes, i + 1)?;
                        i += 5; // skip u + 4 hex digits
                        if (0xD800..=0xDBFF).contains(&hi) {
                            // High surrogate — must be followed by \uDC00-\uDFFF
                            if i + 5 < bytes.len() && bytes[i] == b'\\' && bytes[i + 1] == b'u' {
                                let lo = decode_hex4(bytes, i + 2)?;
                                if !(0xDC00..=0xDFFF).contains(&lo) {
                                    return None; // not a valid low surrogate
                                }
                                i += 6; // skip \uXXXX for the low surrogate
                            } else {
                                return None; // lone high surrogate
                            }
                        } else if (0xDC00..=0xDFFF).contains(&hi) {
                            return None; // lone low surrogate
                        }
                    }
                    b'"' | b'\\' | b'/' | b'b' | b'f' | b'n' | b'r' | b't' => {
                        i += 1;
                    }
                    _ => return None, // invalid escape sequence
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

// ── Utility: number_span_fast as a standalone Parser ──────────

/// Monolithic number span parser — replaces the 12-combinator chain.
#[inline]
pub fn number_span_fast_parser<'a>() -> Parser<'a, Span<'a>> {
    Parser::new(move |state: &mut ParserState<'a>| number_span_fast(state))
}

// ── JSON Value types and parsers ──────────────────────────────

#[derive(Pretty, Debug, Clone, PartialEq)]
pub enum JsonValue<'a> {
    #[pprint(rename = "null")]
    Null,
    Bool(bool),
    Number(f64),
    String(Cow<'a, str>),
    Array(Box<Vec<JsonValue<'a>>>),
    Object(Box<Vec<(Cow<'a, str>, JsonValue<'a>)>>),
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    // ── String parser using monolithic SIMD scanner ────────────
    // Returns raw spans (no unescape) — zero-copy.

    let json_string_content =
        || -> Parser<'a, Cow<'a, str>> { sp_json_string().map(|s| Cow::Borrowed(s.as_str())) };

    // ── Leaf values ───────────────────────────────────────────

    let json_null: Parser<'a, JsonValue<'a>> = sp_string("null").map(|_| JsonValue::Null);
    let json_true: Parser<'a, JsonValue<'a>> = sp_string("true").map(|_| JsonValue::Bool(true));
    let json_false: Parser<'a, JsonValue<'a>> = sp_string("false").map(|_| JsonValue::Bool(false));

    let json_number = || -> Parser<'a, JsonValue<'a>> {
        Parser::new(move |state: &mut ParserState<'a>| {
            let ns = number_span_fast_ex(state)?;
            Some(JsonValue::Number(parse_json_number_f64(ns.span, ns.is_integer)))
        })
    };

    let json_string =
        || -> Parser<'a, JsonValue<'a>> { json_string_content().map(JsonValue::String) };

    // ── Array: hand-rolled loop inside a Parser for pre-allocated capacity ──

    let json_array = crate::lazy::lazy(|| {
        let value = json_value();
        let open = sp_string("[");
        let close = sp_string("]");
        let comma = sp_string(",").trim_whitespace();

        Parser::new(move |state: &mut ParserState<'a>| {
            open.call(state)?;
            crate::leaf::trim_leading_whitespace_mut(state);

            if close.call(state).is_some() {
                return Some(JsonValue::Array(Box::new(Vec::new())));
            }

            let mut items = Vec::with_capacity(4);
            loop {
                crate::leaf::trim_leading_whitespace_mut(state);
                items.push(value.call(state)?);
                crate::leaf::trim_leading_whitespace_mut(state);
                if comma.call(state).is_none() {
                    break;
                }
            }

            close.call(state)?;
            Some(JsonValue::Array(Box::new(items)))
        })
    });

    // ── Object: hand-rolled loop inside a Parser for pre-allocated capacity ──

    let json_object = crate::lazy::lazy(move || {
        let value = json_value();
        let key = json_string_content();
        let open = sp_string("{");
        let close = sp_string("}");
        let colon = sp_string(":").trim_whitespace();
        let comma = sp_string(",").trim_whitespace();

        Parser::new(move |state: &mut ParserState<'a>| {
            open.call(state)?;
            crate::leaf::trim_leading_whitespace_mut(state);

            if close.call(state).is_some() {
                return Some(JsonValue::Object(Box::new(Vec::new())));
            }

            let mut entries = Vec::with_capacity(4);
            loop {
                crate::leaf::trim_leading_whitespace_mut(state);
                let k = key.call(state)?;
                colon.call(state)?;
                let v = value.call(state)?;
                entries.push((k, v));
                crate::leaf::trim_leading_whitespace_mut(state);
                if comma.call(state).is_none() {
                    break;
                }
            }

            close.call(state)?;
            Some(JsonValue::Object(Box::new(entries)))
        })
    });

    // ── First-byte dispatch ───────────────────────────────────

    crate::leaf::dispatch_byte_multi(vec![
        (b"{" as &[u8], json_object),
        (b"[", json_array),
        (b"\"", json_string()),
        (b"t", json_true),
        (b"f", json_false),
        (b"n", json_null),
        (b"-0123456789", json_number()),
    ])
}

pub fn json_parser<'a>() -> Parser<'a, JsonValue<'a>> {
    json_value().trim_whitespace()
}
