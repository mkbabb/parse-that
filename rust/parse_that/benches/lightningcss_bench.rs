use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

use lightningcss::stylesheet::{ParserOptions, StyleSheet};

fn data_dir() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../data/css")
}

fn normalize(b: &mut Bencher) {
    parse(b, "normalize.css")
}

fn bootstrap(b: &mut Bencher) {
    parse(b, "bootstrap.css")
}

fn tailwind(b: &mut Bencher) {
    parse(b, "tailwind-output.css")
}

fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));
    b.bytes = data.len() as u64;

    // Verify parse succeeds at least once
    let test = StyleSheet::parse(&data, ParserOptions::default());
    if test.is_err() {
        eprintln!("WARNING: lightningcss failed to parse {}, skipping", filepath.display());
        return;
    }

    b.iter(|| {
        let buf = black_box(&data);
        // lightningcss performs L2 parse (more work than our L1.5)
        let result = StyleSheet::parse(buf, ParserOptions::default());
        black_box(result)
    })
}

// tailwind excluded — lightningcss errors on synthetic file
benchmark_group!(css, normalize, bootstrap);

benchmark_main!(css);
