#![feature(cold_path)]

use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

use bbnf_derive::Parser;

#[derive(Parser)]
#[parser(path = "benches/grammars/json.bbnf")]
struct BbnfJsonParser;

fn data_dir() -> std::path::PathBuf {
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

fn twitter(b: &mut Bencher) {
    parse(b, "twitter.json")
}

fn citm_catalog(b: &mut Bencher) {
    parse(b, "citm_catalog.json")
}

fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));
    b.bytes = data.len() as u64;

    let parser = BbnfJsonParser::value();

    b.iter(|| {
        let buf = black_box(&data);
        parser.parse(buf).unwrap()
    })
}

benchmark_group!(bbnf_json, data, canada, apache, data_xl, twitter, citm_catalog);
benchmark_main!(bbnf_json);
