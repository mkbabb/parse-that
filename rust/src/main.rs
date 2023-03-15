#![feature(type_alias_impl_trait)]
#![feature(return_position_impl_trait_in_trait)]

#[global_allocator]
static GLOBAL: tikv_jemallocator::Jemalloc = tikv_jemallocator::Jemalloc;

pub mod parse;
pub mod pikevm;
pub mod pretty;

use parse::*;
use pikevm::*;
use pretty::*;

extern crate fnv;
use fnv::FnvHashMap;

use std::{fs, time::SystemTime};

#[derive(Debug, Clone)]
pub enum JsonValue<'a> {
    Null,
    Bool(bool),
    Number(f64),
    String(&'a str),
    Array(Vec<JsonValue<'a>>),
    Object(FnvHashMap<&'a str, JsonValue<'a>>),
}

// Doc<'a> impl for JsonValue:
impl<'a> Into<Doc<'a>> for JsonValue<'a> {
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

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>, impl ParserFunction<'a, JsonValue<'a>> + 'a> {
    let parse_json_value = |state: &ParserState<'a>| {
        let json_null = string("null").map(|_| JsonValue::Null);
        let json_bool = string("true").map(|_| JsonValue::Bool(true))
            | string("false").map(|_| JsonValue::Bool(false));

        let json_number =
            regex(r#"-?\d+(\.\d+)?"#).map(|s| JsonValue::Number(s.parse().unwrap_or(f64::NAN)));

        let json_string = regex(r#"([^"\\]|\\["\\/bfnrt]|\\u[a-fA-F0-9]{4})*"#)
            .wrap(string("\""), string("\""))
            .map(JsonValue::String);

        let json_array = {
            let comma = string(",").trim_whitespace();
            json_value()
                .sep_by(comma, None, None)
                .or_else(|| vec![])
                .trim_whitespace()
                .wrap(string("["), string("]"))
                .map(JsonValue::Array)
        };

        let json_object = {
            let colon = string(":").trim_whitespace();
            let key = regex(r#""([^"\\]|\\["\\/bfnrt]|\\u[a-fA-F0-9]{4})*""#);
            let key_value = key.skip(colon).with(json_value());

            let comma = string(",").trim_whitespace();

            key_value
                .sep_by(comma, None, None)
                .or_else(|| vec![])
                .trim_whitespace()
                .wrap(string("{"), string("}"))
                .map(|pairs| JsonValue::Object(pairs.into_iter().collect()))
        };

        let json_value: Parser<_, _> =
            json_object | json_array | json_string | json_number | json_bool | json_null;
        json_value.parser_fn.call(state)
    };

    lazy(move ||Parser::new(parse_json_value))
}

pub fn parse_csv(src: &str) -> Vec<Vec<&str>> {
    let parser = || {
        let whitespace = || lazy(|| regex(r"\s*"));

        let double_quotes = || lazy(|| string("\""));
        let single_quotes = || string("'");

        let token: Parser<_, _> = regex("[^\"]+").wrap(double_quotes(), double_quotes())
            | regex("[^']+").wrap(single_quotes(), single_quotes())
            | regex(r"[^,\r\n]+")
            | string("").look_ahead(string(","));

        let delim = string(",");

        let line = token.sep_by(delim, None, None);
        let csv = line.sep_by(string("\r\n"), None, None);
        csv
    };

    parser().parse(src).expect("failed to parse csv")
}

// pub fn csv_fsm() -> FSMParser {
//     let double_quotes = FSMParser::regex("\"");
//     let single_quotes = FSMParser::regex("'");

//     let token = FSMParser::regex("[^\"]+")
//         .wrap(double_quotes.clone(), double_quotes)
//         .or(FSMParser::regex("[^']+").wrap(single_quotes.clone(), single_quotes))
//         .or(FSMParser::regex(r"[^,\r\n]+"));

//     let delim = FSMParser::regex(",").trim_whitespace();

//     let line = token.sep_by(delim).trim_whitespace();
//     let csv = line.many(0);

//     csv
// }

pub fn main() {
    let first_now = SystemTime::now();

    // let mut f = FSMParser::new();
    // let a = FSMParser::regex("a");
    // let b = FSMParser::regex("b").or(FSMParser::regex("v"));

    // let mut fsm = a.then(b).many(0).done();

    // let src = "abavab";

    // let t = fsm.run(src);

    // let mut fsm = csv_fsm().done();
    // let csv_file_path = "../data/active_charter_schools_report.csv";
    // let src = fs::read_to_string(csv_file_path).unwrap();

    // let t = fsm.run(&src);

    // println!("{:?}", t);

    // let elapsed = first_now.elapsed().unwrap();

    // println!("Elapsed: {:?}", elapsed);

    // let csv_file_path = "../data/active_charter_schools_report.csv";
    // let csv_string = fs::read_to_string(csv_file_path).unwrap();
    // let rows = parse_csv(&csv_string);

    let json_file_path = "../data/canada.json";
    let json_string = fs::read_to_string(json_file_path).unwrap();

    let parser = json_value();

    let now = SystemTime::now();

    let map = parser.parse(&json_string).unwrap();

    let elapsed = now.elapsed().unwrap();

    println!("dElapsed: {:?}", elapsed);

    // test hashmap with 10 items:

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

    // let mut map = HashMap::new();
    // map.insert("ok", map3.clone());
    // map.insert("thats vibes", map3.clone());

    let printer = Printer::new(80, 1, false, true);

    let now = SystemTime::now();

    let pretty = printer.pretty(map);
    let elapsed = now.elapsed().unwrap();

    println!("Elapsed: {:?}", elapsed);

    fs::write("../data/pretty.json", pretty).expect("Unable to write file");

    let elapsed = first_now.elapsed().unwrap();

    println!("Total Elapsed: {:?}", elapsed);
}
