#[global_allocator]
static GLOBAL: tikv_jemallocator::Jemalloc = tikv_jemallocator::Jemalloc;

use lazy_regex::regex as re;

pub mod parse;
use parse::*;

// pub mod pretty;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

extern crate fnv;
use fnv::FnvHashMap;

#[derive(Debug, Clone)]
pub enum JsonValue<'a> {
    Null,
    Bool(bool),
    Number(f64),
    String(&'a str),
    Array(Vec<JsonValue<'a>>),
    Object(FnvHashMap<&'a str, JsonValue<'a>>),
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    let json_null = string("null").map(|_| JsonValue::Null);
    let json_bool = string("true").map(|_| JsonValue::Bool(true))
        | string("false").map(|_| JsonValue::Bool(false));

    let json_number =
        regex(r#"-?\d+(\.\d+)?"#).map(|s| JsonValue::Number(s.parse().unwrap_or(f64::NAN)));

    let json_string = || {
        take_while(|c| c != '"')
            .wrap(string("\""), string("\""))
            .map(JsonValue::String)
    };

    let json_array = lazy(Box::new(|| {
        let comma = string(",").trim_whitespace();
        json_value()
            .sep_by(comma, None, None)
            .or_else(|| vec![])
            .trim_whitespace()
            .wrap(string("["), string("]"))
            .map(JsonValue::Array)
    }));

    let json_object = lazy(Box::new(move || {
        let colon = string(":").trim_whitespace();

        let key_value = json_string().skip(colon).with(json_value());

        let comma = string(",").trim_whitespace();
        key_value
            .sep_by(comma, None, None)
            .or_else(|| vec![])
            .trim_whitespace()
            .wrap(string("{"), string("}"))
            .map(|pairs| {
                JsonValue::Object(
                    pairs
                        .into_iter()
                        .map(|(k, v)| match k {
                            JsonValue::String(s) => (s, v),
                            _ => unreachable!(),
                        })
                        .collect(),
                )
            })
    }));

    json_object | json_array | json_string() | json_number | json_bool | json_null
}

fn basic(b: &mut Bencher) {
    let data = &"  { \"a\"\t: 42,
    \"b\": [ \"x\", \"y\", 12 ] ,
    \"c\": { \"hello\" : \"world\"
    }
    }  ";
    b.bytes = data.len() as u64;
    parse(b, data)
}

fn data(b: &mut Bencher) {
    let data = include_str!("./data.json");
    b.bytes = data.len() as u64;
    parse(b, data)
}

fn canada(b: &mut Bencher) {
    let data = include_str!("./canada.json");
    b.bytes = data.len() as u64;
    parse(b, data)
}

fn apache(b: &mut Bencher) {
    let data = include_str!("./apache_builds.json");
    b.bytes = data.len() as u64;
    parse(b, data)
}

fn parse(b: &mut Bencher, buffer: &str) {
    let parser = json_value().trim_whitespace();

    b.iter(|| {
        let buf = black_box(buffer);
        parser.parse(buf).unwrap()
    })
}

benchmark_group!(json, basic, data, canada, apache);
benchmark_main!(json);