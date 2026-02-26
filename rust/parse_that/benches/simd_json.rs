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

fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));
    b.bytes = data.len() as u64;

    // Note: simd-json requires mutable input, so .to_vec() per iteration is an inherent
    // cost of the library. We use to_borrowed_value for fairness (returns Cow<str> strings,
    // zero-copy when no escapes — comparable to jiter's approach).
    // The borrowed value references `buf`, so we consume it inside the closure via black_box.
    b.iter(|| {
        let mut buf = black_box(data.as_bytes()).to_vec();
        let val = simd_json::to_borrowed_value(&mut buf).unwrap();
        black_box(&val);
    })
}

benchmark_group!(simd_json_bench, data, canada, apache, data_xl, twitter, citm_catalog);
benchmark_main!(simd_json_bench);
