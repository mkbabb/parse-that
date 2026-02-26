use std::borrow::Cow;

use crate::parse::*;
use crate::span_parser::*;
use crate::state::ParserState;

use pprint::Pretty;

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
        SpanParser::<'a>::from(sp_string("null")).map(|_| JsonValue::Null);
    let json_true: Parser<'a, JsonValue<'a>> =
        SpanParser::<'a>::from(sp_string("true")).map(|_| JsonValue::Bool(true));
    let json_false: Parser<'a, JsonValue<'a>> =
        SpanParser::<'a>::from(sp_string("false")).map(|_| JsonValue::Bool(false));

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

    let json_array = lazy(|| {
        let comma_sp: SpanParser<'_> = sp_string(",").trim_whitespace();
        let comma = comma_sp.into_parser();

        json_value()
            .sep_by(comma, ..)
            .or_else(std::vec::Vec::new)
            .trim_whitespace()
            .wrap(string_span("["), string_span("]"))
            .map(JsonValue::Array)
    });

    let json_object = lazy(move || {
        let colon_sp: SpanParser<'_> = sp_string(":").trim_whitespace();
        let colon = colon_sp.into_parser();
        let comma_sp: SpanParser<'_> = sp_string(",").trim_whitespace();
        let comma = comma_sp.into_parser();

        let key_value = json_string_content().skip(colon).then(json_value());

        key_value
            .sep_by(comma, ..)
            .or_else(std::vec::Vec::new)
            .trim_whitespace()
            .wrap(string_span("{"), string_span("}"))
            .map(JsonValue::Object)
    });

    // ── First-byte dispatch ───────────────────────────────────

    dispatch_byte_multi(
        vec![
            (&[b'{'] as &[u8], json_object),
            (&[b'['], json_array),
            (&[b'"'], json_string()),
            (&[b't'], json_true),
            (&[b'f'], json_false),
            (&[b'n'], json_null),
            (
                &[b'-', b'0', b'1', b'2', b'3', b'4', b'5', b'6', b'7', b'8', b'9'],
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

use crate::span_parser::{json_string_decoded_fast, number_fast, skip_ws};

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
