use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

use parse_that::parsers::css::css_parser;
use parse_that::state::ParserState;

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

    let parser = css_parser();

    b.iter(|| {
        let buf = black_box(&data);
        let mut state = ParserState::new(buf);
        let result = parser.call(&mut state);
        black_box(result)
    })
}

benchmark_group!(css, normalize, bootstrap, tailwind);

benchmark_main!(css);
