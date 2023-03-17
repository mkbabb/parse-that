// use std::borrow::Cow;

// use fnv::FnvHashMap;

// use crate::{parse::*, pretty::Doc};

// use parse::ParserSpan;

// use super::json::JsonValue;

// #[derive(Debug, Clone, PartialEq)]
// pub enum TomlValue<'a> {
//     Null,
//     Bool(bool),
//     Integer(i64),
//     Float(f64),
//     String(&'a str),
//     DateTime(&'a str),
//     Array(Vec<TomlValue<'a>>),
//     InlineTable(FnvHashMap<&'a str, TomlValue<'a>>),
//     Table(FnvHashMap<&'a str, TomlValue<'a>>),
// }

// pub fn toml_value<'a>() -> Parser<'a, TomlValue<'a>> {
//     let string_char = || {
//         let not_quote = take_while_span(|c| c != '"' && c != '\\');

//         let string = (not_quote | escaped_span()).many_span(..);

//         return string;
//     };

//     let toml_string = || {
//         let basic_string = || {
//             let not_quote = take_while_span(|c| c != '"' && c != '\\');
//             let string = (not_quote | escaped_span())
//                 .many_span(0..)
//                 .wrap_span(string_span("\""), string_span("\""));
//             return string;
//         };

//         let literal_string = || {
//             let not_apostrophe = take_while_span(|c| c != '\'');
//             let string = not_apostrophe.wrap_span(string_span("'"), string_span("'"));
//             return string;
//         };

//         return (basic_string() | literal_string()).map(|s| TomlValue::String(s.as_str()));
//     };

//     let toml_integer = || {
//         let sign = || string_span("-").opt_span();
//         let digits = || take_while_span(|c| c.is_digit(10));

//         sign()
//             .then_span(digits())
//             .map(|s| s.as_str().parse().unwrap_or(0))
//             .map(TomlValue::Integer)
//     };

//     let toml_float = || {
//         let sign = || string_span("-").opt_span();
//         let digits = || take_while_span(|c| c.is_digit(10));

//         let integer = digits();
//         let fraction = string_span(".").then_span(digits());
//         let exponent = (string_span("e") | string_span("E"))
//             .then_span(sign())
//             .then_span(digits());

//         return sign()
//             .then_span(integer)
//             .then_span(fraction)
//             .then_span(exponent.opt_span())
//             .map(|s| s.as_str().parse().unwrap_or(f64::NAN))
//             .map(TomlValue::Float);
//     };

//     let toml_bool = || {
//         (string_span("true") | string_span("false"))
//             .map(|s| s.as_str().parse().unwrap_or(false))
//             .map(TomlValue::Bool)
//     };

//     let toml_datetime = || {
//         let digits = || take_while_span(|c| c.is_digit(10));

//         let date = digits()
//             .then_span(string_span("-"))
//             .then_span(digits())
//             .then_span(string_span("-"))
//             .then_span(digits());

//         let time = digits()
//             .then_span(string_span(":"))
//             .then_span(digits())
//             .then_span(string_span(":"))
//             .then_span(digits())
//             .then_span((string_span(".") | string_span("Z")).opt_span());

//         date.then_span(string_span("T"))
//             .then_span(time)
//             .map(|s| s.as_str())
//             .map(TomlValue::DateTime)
//     };

//     let toml_array = lazy(|| {
//         let comma = string_span(",").trim_whitespace();

//         toml_value()
//             .sep_by(comma, ..)
//             .or_else(|| vec![])
//             .trim_whitespace()
//             .wrap(string_span("["), string_span("]"))
//             .map(TomlValue::Array)
//     });

//     let toml_inline_table = lazy(move || {
//         let equals = string_span("=").trim_whitespace();
//         let comma = string_span(",").trim_whitespace();

//         let key_value = string_char()
//             .map(|s| s.as_str())
//             .skip(equals)
//             .with(toml_value());

//         key_value
//             .sep_by(comma, ..)
//             .or_else(|| vec![])
//             .trim_whitespace()
//             .wrap(string_span("{"), string_span("}"))
//             .map(|pairs| TomlValue::Table(pairs.into_iter().collect()))
//     });

//     let toml_table_header = || {
//         let dot = string_span(".");
//         let key = take_while_span(|c| c.is_alphanumeric() || c == '-' || c == '_');
//         let table_key = key.sep_by_span(dot, ..);

//         table_key
//             .trim_whitespace()
//             .wrap_span(string_span("["), string_span("]"))
//             .skip(string_span("\n"))
//             .debug("toml_table_header")
//     };

//     let toml_table = lazy(move || {
//         let equals = string_span("=").trim_whitespace();
//         let newline = string_span("\n").trim_whitespace();

//         let key_value = string_char().debug("key").skip(equals).with(toml_value());

//         toml_table_header()
//             .with(key_value.sep_by(newline, ..).or_else(|| vec![]))
//             .map(|(header, pairs)| {
//                 let header_str = header.as_str();
//                 let mut table = FnvHashMap::default();

//                 for (key, value) in pairs {
//                     let key = format!("{}.{}", header_str, key.as_str());
//                     table.insert(key, value);
//                 }

//                 TomlValue::Table(table)
//             })
//     });

//     toml_table
//         | toml_inline_table
//         | toml_array
//         | toml_string()
//         | toml_datetime()
//         | toml_float()
//         | toml_integer()
//         | toml_bool()
// }

// pub fn toml_parser<'a>() -> Parser<'a, TomlValue<'a>> {
//     toml_value().trim_whitespace()
// }

// impl<'a> Into<Doc<'a>> for TomlValue<'a> {
//     fn into(self) -> Doc<'a> {
//         match self {
//             TomlValue::String(s) => s.into(),
//             TomlValue::Integer(n) => n.into(),
//             TomlValue::Float(n) => n.into(),
//             TomlValue::Bool(b) => b.into(),
//             TomlValue::Datetime(s) => s.into(),
//             TomlValue::Array(a) => a.into(),
//             TomlValue::Table(o) => o.into(),
//         }
//     }
// }

// // impl<'a> From<TomlValue<'a>> for JsonValue<'a> {
// //     fn from(toml_value: TomlValue<'a>) -> JsonValue<'a> {
// //         match toml_value {
// //             TomlValue::String(s) => JsonValue::String(s),
// //             TomlValue::Integer(n) => JsonValue::Number(n as f64),
// //             TomlValue::Float(n) => JsonValue::Number(n),
// //             TomlValue::Bool(b) => JsonValue::Bool(b),
// //             TomlValue::Datetime(s) => JsonValue::String(s),
// //             TomlValue::Array(a) => {
// //                 let json_array = a.into_iter().map(JsonValue::from).collect();
// //                 JsonValue::Array(json_array)
// //             }
// //             TomlValue::Table(o) => {
// //                 let json_object = o
// //                     .into_iter()
// //                     .map(|(k, v)| (k, JsonValue::from(v)))
// //                     .collect();
// //                 JsonValue::Object(json_object)
// //             }
// //         }
// //     }
// // }
