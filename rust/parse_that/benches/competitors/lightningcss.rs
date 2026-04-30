#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::path::Path;

use divan::counter::BytesCount;
use divan::{Bencher, black_box};

use lightningcss::stylesheet::{ParserOptions, StyleSheet};

fn data_dir() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../data/css")
}

#[divan::bench]
fn normalize(b: Bencher) {
    parse(b, "normalize.css")
}

#[divan::bench]
fn bootstrap(b: Bencher) {
    parse(b, "bootstrap.css")
}

#[divan::bench]
fn tailwind(b: Bencher) {
    parse(b, "tailwind-output.css")
}

fn parse(b: Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));

    // Verify parse succeeds at least once
    let test = StyleSheet::parse(&data, ParserOptions::default());
    if test.is_err() {
        eprintln!(
            "WARNING: lightningcss failed to parse {}, skipping",
            filepath.display()
        );
        return;
    }

    b.counter(BytesCount::new(data.len())).bench_local(|| {
        let buf = black_box(&data);
        // lightningcss performs L2 parse (more work than our L1.5)
        let result = StyleSheet::parse(buf, ParserOptions::default());
        black_box(result)
    });
}

fn main() {
    divan::main();
}
