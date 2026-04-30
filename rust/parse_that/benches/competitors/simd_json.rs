#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::path::{Path, PathBuf};

use divan::counter::BytesCount;
use divan::{Bencher, black_box};

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
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));

    // Note: simd-json requires mutable input, so .to_vec() per iteration is an inherent
    // cost of the library. We use to_borrowed_value for fairness (returns Cow<str> strings,
    // zero-copy when no escapes — comparable to jiter's approach).
    // The borrowed value references `buf`, so we consume it inside the closure via black_box.
    b.counter(BytesCount::new(data.len())).bench_local(|| {
        let mut buf = black_box(data.as_bytes()).to_vec();
        let val = simd_json::to_borrowed_value(&mut buf).unwrap();
        black_box(&val);
    });
}

fn main() {
    divan::main();
}
