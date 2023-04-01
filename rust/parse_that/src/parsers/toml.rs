// use crate::parse::*;

// extern crate pretty;
// use pretty::Pretty;

// use fnv::FnvHashMap;

// #[derive(Pretty, Debug, Clone, PartialEq)]
// pub enum TomlValue<'a> {
//     String(&'a str),
//     Integer(i64),
//     Float(f64),
//     Boolean(bool),
//     DateTime(&'a str),
//     Array(Vec<TomlValue<'a>>),
//     InlineTable(FnvHashMap<&'a str, TomlValue<'a>>),
// }

// type TomlKeyValue<'a> = (&'a str, TomlValue<'a>);

// pub fn toml_value<'a>() -> Parser<'a, TomlValue<'a>> {
//     let string_char = || {
//         let not_quote = take_while_span(|c| c != '"' && c != '\\');

//         let string = (not_quote | escaped_span())
//             .many_span(..)
//             .wrap_span(string_span("\""), string_span("\""));

//         return string.map(|s| s.as_str());
//     };

//     let toml_string = || string_char().map(TomlValue::String);

//     let toml_integer = || {
//         let sign = || string_span("-").opt_span();
//         let digits = || take_while_span(|c| c.is_digit(10));

//         let integer = digits();

//         return sign()
//             .then_span(integer)
//             .map(|s| s.as_str().parse().unwrap())
//             .map(TomlValue::Integer);
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
//             .map(|s| s.as_str().parse().unwrap())
//             .map(TomlValue::Float);
//     };

//     let toml_boolean = string_span("true").map(|_| TomlValue::Boolean(true))
//         | string_span("false").map(|_| TomlValue::Boolean(false));

//     let toml_datetime =
//         take_while_span(|c| c.is_digit(10) || c == ':' || c == '-' || c == 'T' || c == 'Z')
//             .map(|s| TomlValue::DateTime(s.as_str()));

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

//         let key_value = string_char().skip(equals).with(toml_value());

//         key_value
//             .sep_by(comma, ..)
//             .or_else(|| vec![])
//             .trim_whitespace()
//             .wrap(string_span("{"), string_span("}"))
//             .map(|pairs| TomlValue::InlineTable(pairs.into_iter().collect()))
//     });

//     toml_inline_table
//         | toml_array
//         | toml_string()
//         | toml_float()
//         | toml_integer()
//         | toml_boolean
//         | toml_datetime
// }

// pub fn toml_key_value<'a>() -> Parser<'a, TomlKeyValue<'a>> {
//     let string_char = || {
//         let not_quote = take_while_span(|c| c != '"' && c != '\\');

//         let string = (not_quote | escaped_span())
//             .many_span(..)
//             .wrap_span(string_span("\""), string_span("\""));

//         return string;
//     };

//     let bare_key = take_while_span(|c| c.is_alphanumeric() || c == ' ' || c == '-');
//     let key = (bare_key | string_char()).map(|s| s.as_str());
//     let equals = string_span("=").trim_whitespace();

//     key.skip(equals).with(toml_value())
// }

// pub fn toml_table<'a>() -> Parser<'a, (Vec<&'a str>, FnvHashMap<&'a str, TomlValue<'a>>)> {
//     let table_start = string_span("[").trim_whitespace();
//     let table_end = string_span("]").trim_whitespace();
//     let dot = string_span(".").trim_whitespace();

//     let table_name = toml_key_value()
//         .map(|(key, _)| key)
//         .sep_by(dot, ..)
//         .trim_whitespace()
//         .wrap(table_start, table_end);

//     let key_values = toml_key_value()
//         .sep_by(string_span("\n"), ..)
//         .or_else(|| vec![])
//         .trim_whitespace();

//     table_name
//         .with(key_values)
//         .map(|(path, pairs)| (path, pairs.into_iter().collect()))
// }

// pub fn toml_parser<'a>() -> Parser<
//     'a,
//     (
//         Vec<(Vec<&'a str>, FnvHashMap<&'a str, TomlValue<'a>>)>,
//         FnvHashMap<&'a str, TomlValue<'a>>,
//     ),
// > {
//     let new_line = string_span("\n").trim_whitespace();

//     let tables = toml_table().sep_by(new_line, ..).or_else(|| vec![]);
//     let key_values = toml_key_value().sep_by(new_line, ..).or_else(|| vec![]);

//     tables
//         .then(key_values)
//         .map(|(tables, kvs)| (tables, kvs.into_iter().collect()))
// }
