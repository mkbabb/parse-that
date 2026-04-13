use std::borrow::Cow;

use crate::parse::*;
use crate::span_parser::*;
use crate::state::ParserState;

use pprint::Pretty;

use super::scan::{scan_number_strict_f64, STRICT_QUOTED_STRING_CONFIG};

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

    let json_string_content = || -> Parser<'a, Cow<'a, str>> {
        sp_quoted_string(&STRICT_QUOTED_STRING_CONFIG)
            .map(|s| Cow::Borrowed(s.as_str()))
    };

    // ── Leaf values ───────────────────────────────────────────

    let json_null: Parser<'a, JsonValue<'a>> = sp_string("null").map(|_| JsonValue::Null);
    let json_true: Parser<'a, JsonValue<'a>> = sp_string("true").map(|_| JsonValue::Bool(true));
    let json_false: Parser<'a, JsonValue<'a>> = sp_string("false").map(|_| JsonValue::Bool(false));

    let json_number = || -> Parser<'a, JsonValue<'a>> {
        Parser::new(move |state: &mut ParserState<'a>| {
            let f = scan_number_strict_f64(state)?;
            Some(JsonValue::Number(f))
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
            crate::scanners::trim_leading_whitespace_mut(state);

            if close.call(state).is_some() {
                return Some(JsonValue::Array(Box::new(Vec::new())));
            }

            let mut items = Vec::with_capacity(4);
            loop {
                crate::scanners::trim_leading_whitespace_mut(state);
                items.push(value.call(state)?);
                crate::scanners::trim_leading_whitespace_mut(state);
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
            crate::scanners::trim_leading_whitespace_mut(state);

            if close.call(state).is_some() {
                return Some(JsonValue::Object(Box::new(Vec::new())));
            }

            let mut entries = Vec::with_capacity(4);
            loop {
                crate::scanners::trim_leading_whitespace_mut(state);
                let k = key.call(state)?;
                colon.call(state)?;
                let v = value.call(state)?;
                entries.push((k, v));
                crate::scanners::trim_leading_whitespace_mut(state);
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
