use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

use parse_that::json::json_parser;

const DATA_DIR_PATH: &str = "../data/json";

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
    let filepath = Path::new(DATA_DIR_PATH).join(filepath);
    let data = std::fs::read_to_string(filepath).unwrap();
    b.bytes = data.len() as u64;

    let parser = json_parser();

    b.iter(|| {
        let buf = black_box(&data);
        parser.parse(buf).unwrap()
    })
}

benchmark_group!(json, data, canada, apache, data_xl, twitter, citm_catalog);

benchmark_main!(json);
