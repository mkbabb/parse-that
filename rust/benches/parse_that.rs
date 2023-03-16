#[global_allocator]
static GLOBAL: tikv_jemallocator::Jemalloc = tikv_jemallocator::Jemalloc;

use parse_that::parse::parsers::json::json_parser;
use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

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

// fn data_xl(b: &mut Bencher) {
//     parse(b, "data-l.json")
// }

fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = Path::new(DATA_DIR_PATH).join(filepath);
    let data = std::fs::read_to_string(filepath).unwrap();
    b.bytes = data.len() as u64;

    // replace all whitespace with a single space
    let data = data.replace(|c: char| c.is_whitespace(), "");

    let parser = json_parser();

    b.iter(|| {
        let buf = black_box(&data);
        parser.parse(buf).unwrap()
    })
}

benchmark_group!(json, data, canada, apache);

benchmark_main!(json);
