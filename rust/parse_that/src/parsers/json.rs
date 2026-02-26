use crate::parse::*;
use crate::span_parser::*;

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
