pub mod parse_that;
use parse_that::*;

use std::fmt::*;

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

// Doc<'a> impl for JsonValue:
impl<'a> Into<Doc<'a>> for JsonValue {
    fn into(self) -> Doc<'a> {
        match self {
            JsonValue::Null => "null".into(),
            JsonValue::Bool(b) => b.to_string().into(),
            JsonValue::Number(n) => n.into(),
            JsonValue::String(s) => format!("\"{}\"", s).into(),
            JsonValue::Array(a) => a.into(),
            JsonValue::Object(o) => o.into(),
        }
    }
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
                        obj.insert(format!("\"{}\"", key), value);
                    }
                }

                JsonValue::Object(obj)
            })
    }));

    json_null() | json_bool() | json_number() | json_string() | json_array | json_object
}

pub fn parse_csv(src: &str) -> Vec<Vec<&str>> {
    let parser = || {
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

    parser().parse(src).expect("failed to parse csv")
}

pub fn main() {
    // let csv_file_path = "data/active_charter_schools_report.csv";
    // let csv_string = fs::read_to_string(csv_file_path).unwrap();
    // let rows = parse_csv(&csv_string);

    let json_file_path = "data/data-l.json";
    let json_string = fs::read_to_string(json_file_path).unwrap();
    let map = json().parse(&json_string).unwrap();

    // test hashmap with 10 items:

    // let mut map0 = HashMap::new();
    // map0.insert("my vibes", vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // map0.insert("thats vibes", vec![1, 2, 3, ]);
    // map0.insert("ok", vec![1, 2, 3, ]);


    // let mut map2 = HashMap::new();
    // map2.insert("my vibes", map0.clone());
    // let mut map3 = HashMap::new();
    // map3.insert("thats vibes", map2.clone());
    // map3.insert("ok", map2.clone());


    // let mut map = HashMap::new();
    // map.insert("ok", map3.clone());

    let printer = Printer {
        max_width: 80,
        indent: 1,
        break_long_text: true,
        use_tabs: true,
    };

    let now = SystemTime::now();
    
    let pretty = printer.pretty(map);
    let elapsed = now.elapsed().unwrap();
    
    println!("Elapsed: {:?}", elapsed);

    fs::write("pretty.json", pretty).expect("Unable to write file");
}
