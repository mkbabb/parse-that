use fnv::FnvHashMap;

use crate::{parse::*, pretty::Doc};

extern crate pest;

#[derive(Debug, Clone, PartialEq)]
pub enum JsonValue<'a> {
    Null,
    Bool(bool),
    Number(f64),
    String(&'a str),
    Array(Vec<JsonValue<'a>>),
    Object(FnvHashMap<&'a str, JsonValue<'a>>),
}

impl<'a> Into<Doc<'a>> for JsonValue<'a> {
    fn into(self) -> Doc<'a> {
        match self {
            JsonValue::Null => "null".into(),
            JsonValue::Bool(b) => b.into(),
            JsonValue::Number(n) => n.into(),
            JsonValue::String(s) => s.into(),
            JsonValue::Array(a) => a.into(),
            JsonValue::Object(o) => o.into(),
        }
    }
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    let string_char = || {
        regex(r#"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"#).wrap(string("\""), string("\""))
    };

    let json_null = string("null").map(|_| JsonValue::Null);
    let json_bool = string("true").map(|_| JsonValue::Bool(true))
        | string("false").map(|_| JsonValue::Bool(false));

    let json_number = regex(r#"-?(\d+)(\.\d+)?([eE][+-]?\d+)?"#)
        .map(|s| JsonValue::Number(s.parse().unwrap_or(f64::NAN)));

    let json_string = string_char().map(JsonValue::String);

    let json_array = lazy(|| {
        let comma = string(",").trim_whitespace();

        json_value()
            .sep_by(comma, None, None)
            .or_else(|| vec![])
            .trim_whitespace()
            .wrap(string("["), string("]"))
            .map(JsonValue::Array)
    });

    let json_object = lazy(move || {
        let colon = string(":").trim_whitespace();
        let comma = string(",").trim_whitespace();

        let key_value = string_char().skip(colon).with(json_value());

        key_value
            .sep_by(comma, None, None)
            .or_else(|| vec![])
            .trim_whitespace()
            .wrap(string("{"), string("}"))
            .map(|pairs| JsonValue::Object(pairs.into_iter().collect()))
    });

    json_object | json_array | json_string | json_number | json_bool | json_null
}

pub fn json_parser<'a>() -> Parser<'a, JsonValue<'a>> {
    json_value().trim_whitespace().eof()
}
