#![feature(cold_path)]

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

use bbnf_derive::Parser;

#[derive(Parser)]
#[parser(path = "benches/grammars/css-fast.bbnf")]
struct BbnfCssFastParser;

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

    let parser = BbnfCssFastParser::stylesheet();

    // Validate completeness once before benchmarking
    {
        let (result, state) = parser.parse_return_state(&data);
        assert!(result.is_some(), "{}: parse failed", filepath.display());
        assert!(
            state.offset * 100 / data.len().max(1) >= 95,
            "{}: only consumed {}% — grammar is incomplete",
            filepath.display(),
            state.offset * 100 / data.len()
        );
    }

    b.iter(|| {
        let buf = black_box(&data);
        parser.parse(buf).unwrap()
    })
}

benchmark_group!(bbnf_css, normalize, bootstrap, tailwind);
benchmark_main!(bbnf_css);
