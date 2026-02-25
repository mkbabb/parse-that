use crate::parse::*;

use super::utils::{escaped_span, number_span};

use pprint::Pretty;

use crate::parse::ParserSpan;

use fnv::FnvHashMap;

#[derive(Pretty, Debug, Clone, PartialEq)]
pub enum JsonValue<'a> {
    #[pprint(rename = "null")]
    Null,
    Bool(bool),
    Number(f64),
    String(&'a str),
    Array(Vec<JsonValue<'a>>),
    Object(FnvHashMap<&'a str, JsonValue<'a>>),
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    let string_char = || {
        let not_quote = take_while_span(|c| c != '"' && c != '\\');

        let string = (not_quote | escaped_span())
            .many_span(..)
            .wrap_span(string_span("\""), string_span("\""));

        return string.map(|s| s.as_str());
    };

    let json_null = string_span("null").map(|_| JsonValue::Null);
    let json_bool = string_span("true").map(|_| JsonValue::Bool(true))
        | string_span("false").map(|_| JsonValue::Bool(false));

    let json_number = || {
        number_span()
            .map(|s| s.as_str().parse().unwrap_or(f64::NAN))
            .map(JsonValue::Number)
    };

    let json_string = || string_char().map(JsonValue::String);

    let json_array = lazy(|| {
        let comma = string_span(",").trim_whitespace();

        json_value()
            .sep_by(comma, ..)
            .or_else(std::vec::Vec::new)
            .trim_whitespace()
            .wrap(string_span("["), string_span("]"))
            .map(JsonValue::Array)
    });

    let json_object = lazy(move || {
        let colon = string_span(":").trim_whitespace();
        let comma = string_span(",").trim_whitespace();

        let key_value = string_char().skip(colon).then(json_value());

        key_value
            .sep_by(comma, ..)
            .or_else(std::vec::Vec::new)
            .trim_whitespace()
            .wrap(string_span("{"), string_span("}"))
            .map(|pairs| JsonValue::Object(pairs.into_iter().collect()))
    });

    json_object | json_array | json_string() | json_number() | json_bool | json_null
}

pub fn json_parser<'a>() -> Parser<'a, JsonValue<'a>> {
    json_value().trim_whitespace()
}
