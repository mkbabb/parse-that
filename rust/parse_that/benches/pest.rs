use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

extern crate pest;
extern crate pest_grammars;

use pest::iterators::Pair;
use pest::{Parser, Span};

use pest_grammars::json::*;

pub enum Json<'i> {
    Null,
    Bool(bool),
    Number(f64),
    String(Span<'i>),
    Array(Vec<Json<'i>>),
    Object(HashMap<Span<'i>, Json<'i>>),
}

pub fn consume(pair: Pair<Rule>) -> Json {
    fn value(pair: Pair<Rule>) -> Json {
        let pair = pair.into_inner().next().unwrap();

        match pair.as_rule() {
            Rule::null => Json::Null,
            Rule::bool => match pair.as_str() {
                "false" => Json::Bool(false),
                "true" => Json::Bool(true),
                _ => unreachable!(),
            },
            Rule::number => Json::Number(pair.as_str().parse().unwrap()),
            Rule::string => Json::String(pair.as_span()),
            Rule::array => Json::Array(pair.into_inner().map(value).collect()),
            Rule::object => {
                let pairs = pair.into_inner().map(|pos| {
                    let mut pair = pos.into_inner();

                    let key = pair.next().unwrap().as_span();
                    let value = value(pair.next().unwrap());

                    (key, value)
                });

                Json::Object(pairs.collect())
            }
            _ => unreachable!(),
        }
    }

    value(pair)
}

fn data_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../data/json")
}

fn data(b: &mut Bencher) {
    parse(b, "data.json")
}

fn canada(b: &mut Bencher) {
    parse(b, "canada.json")
}

fn apache(b: &mut Bencher) {
    parse(b, "apache-builds.json")
}

fn data_xl(b: &mut Bencher) {
    parse(b, "data-xl.json")
}

fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(filepath).unwrap();
    b.bytes = data.len() as u64;

    b.iter(|| {
        let buf = black_box(&data);
        JsonParser::parse(Rule::json, buf).unwrap();
    })
}

benchmark_group!(pest_json, data, canada, apache, data_xl);
benchmark_main!(pest_json);
