#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::path::{Path, PathBuf};

use divan::counter::BytesCount;
use divan::{black_box, Bencher};

extern crate serde;
extern crate serde_json;
use serde_json::Value;

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
            let buf = black_box(data.as_str());
            serde_json::from_str::<Value>(buf).unwrap()
        });
}

fn main() {
    divan::main();
}
