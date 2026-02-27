use std::borrow::Cow;

use bbnf_derive::Parser;
use parse_that::csv::csv_parser;
use parse_that::get_cargo_root_path;
use parse_that::json::json_parser;
use parse_that::json::JsonValue;

use parse_that::parse::*;

use std::{fs, time::SystemTime};

#[derive(Parser)]
#[parser(path = "../../grammar/json.bbnf")]
pub struct Json;

pub fn consume_json<'a>(p: &'a JsonEnum) -> JsonValue<'a> {
    pub fn recurse<'a>(p: &'a JsonEnum) -> JsonValue<'a> {
        match p {
            JsonEnum::null(_) => JsonValue::Null,
            JsonEnum::bool(b) => JsonValue::Bool(b.as_str().parse().unwrap()),
            JsonEnum::number(n) => JsonValue::Number(n.as_str().parse().unwrap()),
            JsonEnum::string(s) => JsonValue::String(Cow::Borrowed(s.as_str())),
            JsonEnum::array(values) => {
                JsonValue::Array(values.iter().map(|v| recurse(v)).collect())
            }
            JsonEnum::pair((key_span, value)) => {
                // Phase E: key is Span directly (string is span-eligible)
                let key_str = Cow::Borrowed(key_span.as_str());
                JsonValue::Object(vec![(key_str, recurse(value))])
            }
            JsonEnum::object(pairs) => {
                let map: Vec<(Cow<'a, str>, JsonValue<'a>)> = pairs
                    .iter()
                    .map(|pair| match pair.as_ref() {
                        JsonEnum::pair((key_span, value)) => {
                            // Phase E: key is Span directly
                            let key_str = Cow::Borrowed(key_span.as_str());
                            (key_str, recurse(value))
                        }
                        _ => panic!("Expected pair in object"),
                    })
                    .collect();
                JsonValue::Object(map)
            }
            _ => unimplemented!(),
        }
    }

    recurse(p)
}

#[derive(Parser)]
#[parser(path = "../../grammar/css-keyframes.bbnf", ignore_whitespace)]
pub struct CSSKeyframes;

#[derive(Parser)]
#[parser(path = "../../grammar/g4.bbnf", ignore_whitespace, debug)]
pub struct G4;

pub fn main() {
    let first_now = SystemTime::now();

    let root_path = get_cargo_root_path();
    let json_file_path = root_path.join("../../data/json/canada.json");

    let json_string = fs::read_to_string(&json_file_path).unwrap();

    // BBNF-derived parser
    let now = SystemTime::now();
    let x = Json::value().parse(&json_string).unwrap();
    let _tmp = consume_json(&*x);
    let elapsed = now.elapsed().unwrap();
    println!("JSON (BBNF) Elapsed: {:?}", elapsed);

    // Combinator parser
    let parser = json_parser();
    let now = SystemTime::now();
    let _data = parser.parse(&json_string).unwrap();
    let elapsed = now.elapsed().unwrap();
    println!("JSON (combinator) Elapsed: {:?}", elapsed);

    // CSV parser
    let csv_file_path = root_path.join("../../data/csv/active_charter_schools_report.csv");
    let csv_string = fs::read_to_string(&csv_file_path).unwrap();
    let csv_parser = csv_parser();
    let now = SystemTime::now();
    let _data = csv_parser.parse(&csv_string).unwrap();
    let elapsed = now.elapsed().unwrap();
    println!("CSV Elapsed: {:?}", elapsed);

    let elapsed = first_now.elapsed().unwrap();
    println!("Total Elapsed: {:?}", elapsed);
}
