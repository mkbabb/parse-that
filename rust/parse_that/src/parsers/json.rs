use crate::parse::*;
use crate::span_parser::*;
use crate::state::ParserState;

use pprint::Pretty;

use std::collections::HashMap;

#[derive(Pretty, Debug, Clone, PartialEq)]
pub enum JsonValue<'a> {
    #[pprint(rename = "null")]
    Null,
    Bool(bool),
    Number(f64),
    String(&'a str),
    Array(Vec<JsonValue<'a>>),
    Object(HashMap<&'a str, JsonValue<'a>>),
}

fn pairs_to_object<'a>(pairs: Vec<(&'a str, JsonValue<'a>)>) -> JsonValue<'a> {
    let mut map = HashMap::with_capacity(pairs.len());
    for (k, v) in pairs {
        map.insert(k, v);
    }
    JsonValue::Object(map)
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    // ── String parser using monolithic SIMD scanner ────────────

    let json_string_content = || -> Parser<'a, &'a str> {
        sp_json_string().map(|s| s.as_str())
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
            .map(pairs_to_object)
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

use crate::span_parser::{json_string_fast, number_fast, skip_ws};

/// Monolithic recursive JSON value parser — zero vtable hops.
/// Whitespace is skipped exactly once per value (before dispatch)
/// and once after each comma/colon.
#[inline(always)]
fn json_value_fast<'a>(state: &mut ParserState<'a>) -> Option<JsonValue<'a>> {
    skip_ws(state);

    match state.src_bytes.get(state.offset)? {
        b'"' => {
            let span = json_string_fast(state)?;
            Some(JsonValue::String(span.as_str()))
        }

        b'-' | b'0'..=b'9' => Some(JsonValue::Number(number_fast(state)?)),

        b'{' => {
            state.offset += 1; // consume '{'
            skip_ws(state);
            if state.src_bytes.get(state.offset) == Some(&b'}') {
                state.offset += 1;
                return Some(JsonValue::Object(HashMap::new()));
            }

            let mut pairs = Vec::with_capacity(8);
            loop {
                // Key: must be a JSON string
                let key_span = json_string_fast(state)?;
                skip_ws(state);
                // Expect ':'
                if state.src_bytes.get(state.offset)? != &b':' {
                    return None;
                }
                state.offset += 1;
                // Value (recursive — skip_ws is inside json_value_fast)
                let val = json_value_fast(state)?;
                pairs.push((key_span.as_str(), val));
                skip_ws(state);
                match state.src_bytes.get(state.offset)? {
                    b',' => {
                        state.offset += 1;
                        skip_ws(state); // skip ws before next key's opening quote
                    }
                    b'}' => {
                        state.offset += 1;
                        break;
                    }
                    _ => return None,
                }
            }

            let mut map = HashMap::with_capacity(pairs.len());
            for (k, v) in pairs {
                map.insert(k, v);
            }
            Some(JsonValue::Object(map))
        }

        b'[' => {
            state.offset += 1; // consume '['
            skip_ws(state);
            if state.src_bytes.get(state.offset) == Some(&b']') {
                state.offset += 1;
                return Some(JsonValue::Array(vec![]));
            }

            let mut values = Vec::with_capacity(8);
            loop {
                // Value (recursive — skip_ws is inside json_value_fast)
                values.push(json_value_fast(state)?);
                skip_ws(state);
                match state.src_bytes.get(state.offset)? {
                    b',' => {
                        state.offset += 1;
                        // skip_ws not needed here — json_value_fast starts with skip_ws
                    }
                    b']' => {
                        state.offset += 1;
                        break;
                    }
                    _ => return None,
                }
            }

            Some(JsonValue::Array(values))
        }

        b't' => {
            if state.src_bytes.get(state.offset..state.offset + 4)? == b"true" {
                state.offset += 4;
                Some(JsonValue::Bool(true))
            } else {
                None
            }
        }

        b'f' => {
            if state.src_bytes.get(state.offset..state.offset + 5)? == b"false" {
                state.offset += 5;
                Some(JsonValue::Bool(false))
            } else {
                None
            }
        }

        b'n' => {
            if state.src_bytes.get(state.offset..state.offset + 4)? == b"null" {
                state.offset += 4;
                Some(JsonValue::Null)
            } else {
                None
            }
        }

        _ => None,
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
