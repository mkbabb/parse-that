use fnv::FnvHashMap;

use crate::{parse::*, pretty::Doc};

use parse::ParserSpan;

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
        let not_quote = take_while_span(|c| c != '"' && c != '\\');
        let escape: Parser<Span> = string_span("\\").then_span({
            string_span("b")
                | string_span("f")
                | string_span("n")
                | string_span("r")
                | string_span("t")
                | string_span("\"")
                | string_span("'")
                | string_span("\\")
                | string_span("/")
                | string_span("u").then_span(take_while_span(|c| c.is_digit(16)).many_span(4..4))
        });
        let string = (not_quote | escape)
            .many_span(0..)
            .wrap_span(string_span("\""), string_span("\""));

        return string.map(|s| s.as_str());
    };

    let json_null = string_span("null").map(|_| JsonValue::Null);
    let json_bool = (string_span("true") | string_span("false")).map(|_| JsonValue::Bool(false));

    let json_number = || {
        let sign = || string_span("-").opt_span();
        let digits = || take_while_span(|c| c.is_digit(10));

        let integer = digits();
        let fraction = string_span(".").then_span(digits());
        let exponent = (string_span("e") | string_span("E"))
            .then_span(sign())
            .then_span(digits());

        return sign()
            .then_span(integer)
            .then_span(fraction.opt_span())
            .then_span(exponent.opt_span())
            .map(|s| s.as_str().parse().unwrap_or(f64::NAN))
            .map(JsonValue::Number);
    };

    let json_string = || string_char().map(JsonValue::String);

    let json_array = lazy(|| {
        let comma = string_span(",").trim_whitespace();

        json_value()
            .sep_by(comma, ..)
            .or_else(|| vec![])
            .trim_whitespace()
            .wrap(string_span("["), string_span("]"))
            .map(JsonValue::Array)
    });

    let json_object = lazy(move || {
        let colon = string_span(":").trim_whitespace();
        let comma = string_span(",").trim_whitespace();

        let key_value = string_char().skip(colon).with(json_value());

        key_value
            .sep_by(comma, ..)
            .or_else(|| vec![])
            .trim_whitespace()
            .wrap(string_span("{"), string_span("}"))
            .map(|pairs| JsonValue::Object(pairs.into_iter().collect()))
    });

    json_object | json_array | json_string() | json_number() | json_bool | json_null
}

pub fn json_parser<'a>() -> Parser<'a, JsonValue<'a>> {
    json_value().trim_whitespace()
}
