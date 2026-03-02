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
    Array(Vec<JsonValue<'a>>),
    Object(Vec<(Cow<'a, str>, JsonValue<'a>)>),
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    // ── String parser using monolithic SIMD scanner ────────────
    // Returns raw spans (no unescape) — zero-copy.

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
