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

fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));
    b.bytes = data.len() as u64;

    b.iter(|| {
        let mut buf = black_box(data.as_bytes()).to_vec();
        simd_json::to_owned_value(&mut buf).unwrap()
    })
}

benchmark_group!(simd_json_bench, data, canada, apache, data_xl);
benchmark_main!(simd_json_bench);
