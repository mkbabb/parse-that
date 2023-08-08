#![feature(box_patterns)]
#![feature(once_cell)]

extern crate bbnf;
extern crate parse_that;
extern crate pretty;

use bbnf_derive::Parser;
use parse_that::csv::csv_parser;
use parse_that::get_cargo_root_path;
use parse_that::json::json_parser;
use parse_that::json::JsonValue;
use parse_that::Span;

use parse_that::parse::*;
use pretty::Doc;

use std::{fs, time::SystemTime};

// #[derive(Parser)]
// #[parser(path = "../../grammar/math.bbnf", ignore_whitespace, debug)]
// pub struct Math {}

// pub fn consume_math(p: &MathEnum) -> f64 {
//     pub fn recurse(p: &MathEnum) -> f64 {
//         let fold_expression = |acc, (op, rest): &(&str, MathEnum)| match *op {
//             "+" => acc + recurse(rest),
//             "-" => acc - recurse(rest),
//             "*" => acc * recurse(rest),
//             "/" => acc / recurse(rest),
//             _ => unreachable!(),
//         };
//         match p {
//             MathEnum::expr((term, rest, ..)) => rest.iter().fold(recurse(term), fold_expression),
//             MathEnum::term((factor, rest)) => rest.iter().fold(recurse(factor), fold_expression),
//             MathEnum::wrapped((_, expr, _)) => recurse(expr),
//             MathEnum::factor(num) => recurse(num),
//             MathEnum::number(num) => num.parse().unwrap(),
//         }
//     }
//     recurse(p)
// }

#[derive(Parser)]
#[parser(path = "../../grammar/json.bbnf")]
pub struct Json;

pub fn consume_json<'a>(p: &'a JsonEnum) -> JsonValue<'a> {
    pub fn recurse<'a>(p: &'a JsonEnum) -> JsonValue<'a> {
        match p {
            JsonEnum::null(_) => JsonValue::Null,
            JsonEnum::bool(b) => JsonValue::Bool(b.as_str().parse().unwrap()),
            JsonEnum::number(n) => JsonValue::Number(n.as_str().parse().unwrap()),
            JsonEnum::string(s) => JsonValue::String(s),
            JsonEnum::array(values) => {
                JsonValue::Array(values.iter().map(|v| recurse(v)).collect())
            }
            JsonEnum::object(pairs) => {
                let map = pairs
                    .iter()
                    .map(|(key, value)| {
                        let JsonEnum::string(key) = key.as_ref() else {
                            panic!("Expected string")
                        };
                        (*key, recurse(value))
                    })
                    .collect();
                JsonValue::Object(map)
            }
            JsonEnum::value(v) => recurse(v),
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

    // let math = Math::expr().parse("1 + 2 + 3 * 3 / 12").unwrap();
    // let tmp = consume_math(&math);
    // println!("{:?}", tmp);

    let root_path = get_cargo_root_path();
    let json_file_path = root_path.join("../../data/json/canada.json");

    let json_string = fs::read_to_string(&json_file_path).unwrap();

    let now = SystemTime::now();

    let x = Json::value().parse(&json_string).unwrap();

    let tmp = consume_json(&x);
    let elapsed = now.elapsed().unwrap();

    println!("JSON2 Elapsed: {:?}", elapsed);
    // println!("{:?}", tmp);

    // let tmp = G4::sentence().parse("the fat woman ate the fat man");
    // println!("{:?}", Doc::from(tmp));

    // println!("{:?}", Doc::from(tmp));

    // let x = Math::expr().parse("1 + 2 + 3 * 3").unwrap();
    // let tmp = consume(&x);

    // println!("{:?}", tmp);

    // println!("{:?}", Doc::from(x));

    // let x = Json::value().parse("[1, 2, 3]").unwrap();

    // println!("{:?}", Doc::from(x));

    let csv_file_path = "../../data/csv/active_charter_schools_report.csv";
    let csv_string = fs::read_to_string(csv_file_path).unwrap();

    let parser = csv_parser();

    let now = SystemTime::now();

    let data = parser.parse(&csv_string).unwrap();

    let elapsed = now.elapsed().unwrap();

    println!("CSV Elapsed: {:?}", elapsed);
    // println!("{:?}", Doc::from(data));

    // let json_file_path = "../../data/json/data.json";
    let json_string = fs::read_to_string(&json_file_path).unwrap();

    let parser = json_parser();

    let now = SystemTime::now();

    let _data = parser.parse(&json_string).unwrap();

    let elapsed = now.elapsed().unwrap();

    println!("JSON Elapsed: {:?}", elapsed);

    // let toml_file_path = "./Cargo.toml";
    // let toml_string = fs::read_to_string(toml_file_path).unwrap();

    // let parser = toml_parser();

    // let now = SystemTime::now();

    // let data = parser.parse(&toml_string).unwrap();

    // dbg!(data);

    // let elapsed = now.elapsed().unwrap();

    // println!("TOML Elapsed: {:?}", elapsed);

    // let bbnf_filepath = "../grammar/g4.bbnf";
    // let bbnf_string = fs::read_to_string(bbnf_filepath).unwrap();

    // let parser = BBNFGrammar::grammar();

    // let now = SystemTime::now();

    // let data = parser.parse(&bbnf_string).unwrap();

    // dbg!(data.get("ONG "));

    // let elapsed = now.elapsed().unwrap();

    // println!("BBNF Elapsed: {:?}", elapsed);

    // let mut map0 = HashMap::new();
    // map0.insert(
    //     "my vibes",
    //     vec![
    //         1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8,
    //         9, 10,
    //     ],
    // );
    // map0.insert("thats vibes", vec![1, 2, 3]);
    // map0.insert("ok", vec![1, 2, 3]);

    // let mut map2 = HashMap::new();
    // map2.insert("my vibes", map0.clone());
    // let mut map3 = HashMap::new();
    // map3.insert("thats vibes", map2.clone());
    // map3.insert("ok", map2.clone());

    // let mut data = HashMap::new();
    // data.insert("ok", map3.clone());
    // data.insert("thats vibes", map3.clone());

    // println!("{}", Doc::from(data));

    // let printer = Printer::new(30, 1, false, true);

    // let now = SystemTime::now();

    // let pretty = printer.pretty(data);

    // println!("{}", pretty);

    // let elapsed = now.elapsed().unwrap();

    // println!("Printing Elapsed: {:?}", elapsed);

    // fs::write("../data/pretty.json", pretty).expect("Unable to write file");

    let elapsed = first_now.elapsed().unwrap();
    println!("Total Elapsed: {:?}", elapsed);
}
