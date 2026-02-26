use std::path::{Path, PathBuf};

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

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

fn twitter(b: &mut Bencher) {
    parse(b, "twitter.json")
}

fn citm_catalog(b: &mut Bencher) {
    parse(b, "citm_catalog.json")
}

// sonic-rs uses arena allocation + SIMD. It returns owned Values with full
// string unescape — it does MORE work than parse_that but is extremely fast.
// Note: runs without -C target-cpu=native, so SIMD auto-detection is used.
fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));
    b.bytes = data.len() as u64;

    b.iter(|| {
        let buf = black_box(data.as_str());
        sonic_rs::from_str::<sonic_rs::Value>(buf).unwrap()
    })
}

benchmark_group!(sonic_rs_bench, data, canada, apache, data_xl, twitter, citm_catalog);
benchmark_main!(sonic_rs_bench);
