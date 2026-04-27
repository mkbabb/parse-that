#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use divan::counter::BytesCount;
use divan::{black_box, Bencher};

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

#[divan::bench]
fn data(b: Bencher) {
    parse(b, "data.json")
}

#[divan::bench]
fn canada(b: Bencher) {
    parse(b, "canada.json")
}

#[divan::bench]
fn apache(b: Bencher) {
    parse(b, "apache-builds.json")
}

#[divan::bench]
fn data_xl(b: Bencher) {
    parse(b, "data-xl.json")
}

#[divan::bench]
fn twitter(b: Bencher) {
    parse(b, "twitter.json")
}

#[divan::bench]
fn citm_catalog(b: Bencher) {
    parse(b, "citm_catalog.json")
}

fn parse(b: Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(filepath).unwrap();

    b.counter(BytesCount::new(data.len()))
        .bench_local(|| {
            let buf = black_box(&data);
            let pair = JsonParser::parse(Rule::json, buf)
                .unwrap()
                .next()
                .unwrap();
            consume(pair)
        });
}

fn main() {
    divan::main();
}
