#[global_allocator]
static GLOBAL: tikv_jemallocator::Jemalloc = tikv_jemallocator::Jemalloc;
#[macro_use]
extern crate bencher;
use std::path::Path;

use bencher::{black_box, Bencher};

extern crate serde;
extern crate serde_json;
use serde_json::Value;

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

fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = Path::new(DATA_DIR_PATH).join(filepath);
    let data = std::fs::read_to_string(filepath).unwrap();
    b.bytes = data.len() as u64;

    b.iter(|| {
        let buf = black_box(data.as_str());
        serde_json::from_str::<Value>(buf).unwrap()
    })
}

benchmark_group!(serde_json, data, canada, apache, data_xl);
benchmark_main!(serde_json);
