pub mod parse_that;
use parse_that::*;

pub mod doc;
use doc::*;

use std::{collections::HashMap, fs, time::SystemTime};

#[derive(Debug, Clone)]
pub enum JsonValue {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<JsonValue>),
    Object(HashMap<String, JsonValue>),
}

pub fn json<'a>() -> Parser<'a, JsonValue> {
    let json_null = || string("null").map(|_| JsonValue::Null);
    let json_bool = || {
        string("true").map(|_| JsonValue::Bool(true))
            | string("false").map(|_| JsonValue::Bool(false))
    };

    let json_number =
        || regex(r#"-?(0|[1-9]\d*)(\.\d+)?"#).map(|s| JsonValue::Number(s.parse().unwrap()));

    let json_string = || {
        let string_char = regex(r#"[^"\\]+"#);
        string_char
            .many(None, None)
            .wrap(string("\""), string("\""))
            .map(|s| JsonValue::String(s.join("")))
    };

    let json_array = lazy(Box::new(|| {
        let comma = string(",").trim_whitespace();
        json()
            .sep_by(comma, None, None)
            .opt()
            .trim_whitespace()
            .wrap(string("["), string("]"))
            .map(|v| JsonValue::Array(v))
    }));

    let json_object = lazy(Box::new(move || {
        let key_value = json_string()
            .skip(string(":").trim_whitespace())
            .then(json());

        let comma = string(",").trim_whitespace();
        key_value
            .sep_by(comma, None, None)
            .opt()
            .trim_whitespace()
            .wrap(string("{"), string("}"))
            .map(|pairs| {
                let mut obj = HashMap::new();

                for pair in pairs {
                    if let (JsonValue::String(key), Some(value)) = pair {
                        obj.insert(key, value);
                    }
                }

                JsonValue::Object(obj)
            })
    }));

    json_null() | json_bool() | json_number() | json_string() | json_array | json_object
}

pub fn csv_test() -> Vec<Vec<String>> {
    let csv_parser = || {
        let whitespace = || regex(r"\s*");

        let double_quotes = || string("\"");
        let single_quotes = || string("'");

        let token = regex("[^\"]+").wrap(double_quotes(), double_quotes())
            | regex("[^']+").wrap(single_quotes(), single_quotes())
            | regex(r"[^,\r\n]+")
            | string("").look_ahead(string(","));

        let delim = string(",");

        let line = token.sep_by(delim, None, None).trim(whitespace());
        let csv = line.sep_by(string("\r\n"), None, None);

        csv
    };

    let file_path = "data/active_charter_schools_report.csv";
    let string = fs::read_to_string(file_path).unwrap();
    let src = string.as_str();

    let now = SystemTime::now();

    let results = csv_parser().parse(src).unwrap();

    let elapsed = now.elapsed().unwrap();
    println!("elapsed: {:?}", elapsed);

    return results
        .into_iter()
        .map(|x| x.into_iter().map(|x| x.to_string()).collect())
        .collect();
}

pub fn json_test() {
    let now = SystemTime::now();

    let file_path = "data/data-l.json";
    let string = fs::read_to_string(file_path).unwrap();
    let src = string.as_str();

    let parser = json();

    let values = parser.parse(src).unwrap();

    dbg!(values);

    let elapsed = now.elapsed().unwrap();
    println!("elapsed: {:?}", elapsed);
}

pub fn main() {
    // let rows = csv_test();

    let rows = vec![
        vec!["a", "b", "c"],
        vec!["d", "e", "f"],
        vec!["g", "h", "i"],
    ];

    let p = Printer::new(30, 2);

    let array_to_doc =
        |items: Vec<&str>| -> Vec<Doc> { items.into_iter().map(|x| text(x)).collect() };

    let format_array = |items: Vec<Doc>| -> Doc {
        text("[") + p.indent(join(text(",") + Doc::Hardline, items)) + Doc::Hardline + text("]")
    };

    let now = SystemTime::now();

    let fmt = rows
        .into_iter()
        .map(|row| array_to_doc(row))
        .map(|row| format_array(row))
        .collect::<Vec<Doc>>();

    let mut smrt = smart_join(
        text(" , "),
        vec![
            text("hey this is cool"),
            text("gay ass vibes"),
            text("a"),
            text("wthat the heck"),
            text("b"),
            text("c"),
            text("d"),
            text("gay ass vibes"),
            text("gay ass vibes"),
        ],
    );

    smrt = text("[") + p.indent(smrt) + Doc::Hardline + text("]");

    let pretty = p.pretty(smrt);

    println!("{}", pretty);

    // json_test();
}
