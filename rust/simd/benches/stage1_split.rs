//! sk-v27 LW3.PERF-1a / PERF-2: the stage-1 cycle split and the G-K1 cells.
//!
//! Nothing here is read outside a scheduled quiet window (X-7, DIG-QW).
//! The arms are registered as PREREG cells by S12 (the programme's
//! `evidence/LW3.PERF/gk1-cells.md`):
//!
//! - **split** (DIG-K-B8, "the measured negatives"): on each corpus file,
//!   `utf8` (std's validator alone), `scan` (`scan_structural` alone, no
//!   UTF-8, no comments, no atoms), `separate` (`utf8` then `scan`: two
//!   passes, the "separate prepass with no amortisation"), `stage1` (the
//!   fused pass on the selected tier) and `oracle` (`scalar::stage1`).
//! - **G-K1 stage 1**: `stage1` on each tier against its oracle.
//! - **G-K1 ASCII run** (for pprint's renderer, PP-1c): `ascii_prefix_len`
//!   on each tier against `scalar::ascii_prefix_len` over line-shaped
//!   inputs (an all-ASCII line of 16..4096 bytes, then one non-ASCII byte).

use divan::Bencher;
use divan::counter::BytesCount;
use parse_that_simd::{
    CommentClass, PaddedInput, Stage1Spec, StructuralAlphabet, Tier, ascii_prefix_len_with,
    compiled_tiers, scalar, scan_structural, stage1, stage1_with,
};
use std::hint::black_box;

const JSON: Stage1Spec = Stage1Spec::new(
    StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\""),
    b" \t\n\r",
    &[],
);
const CSS: Stage1Spec = Stage1Spec::new(
    StructuralAlphabet::from_parts(b"{}();:,", &[], b"\"'"),
    b" \t\n\r\x0c",
    &[CommentClass::new(b"/*", b"*/")],
);

const FILES: [&str; 5] = [
    "json/twitter.json",
    "json/citm_catalog.json",
    "json/canada.json",
    "css/bootstrap.css",
    "css/tailwind-output.css",
];

fn spec(path: &str) -> &'static Stage1Spec {
    if path.starts_with("css/") { &CSS } else { &JSON }
}

fn tiers() -> Vec<Tier> {
    compiled_tiers().into_iter().filter(|t| t.is_supported()).collect()
}

fn main() {
    divan::main();
}

mod split {
    use super::*;

    #[divan::bench(args = FILES)]
    fn utf8(b: Bencher, path: &str) {
        let bytes = parse_that_corpus::read(path);
        b.counter(BytesCount::of_slice(&bytes))
            .bench(|| black_box(core::str::from_utf8(black_box(&bytes)).is_ok()));
    }

    #[divan::bench(args = FILES)]
    fn scan(b: Bencher, path: &str) {
        let bytes = parse_that_corpus::read(path);
        let alphabet = *spec(path).alphabet();
        b.counter(BytesCount::of_slice(&bytes))
            .bench(|| black_box(scan_structural(black_box(&bytes), &alphabet)));
    }

    #[divan::bench(args = FILES)]
    fn separate(b: Bencher, path: &str) {
        let bytes = parse_that_corpus::read(path);
        let alphabet = *spec(path).alphabet();
        b.counter(BytesCount::of_slice(&bytes)).bench(|| {
            let ok = core::str::from_utf8(black_box(&bytes)).is_ok();
            black_box((ok, scan_structural(&bytes, &alphabet)))
        });
    }

    #[divan::bench(args = FILES)]
    fn fused(b: Bencher, path: &str) {
        let input = PaddedInput::from_slice(&parse_that_corpus::read(path));
        let spec = spec(path);
        b.counter(BytesCount::new(input.len()))
            .bench(|| black_box(stage1(black_box(input.as_padded()), spec)));
    }

    #[divan::bench(args = FILES)]
    fn oracle(b: Bencher, path: &str) {
        let bytes = parse_that_corpus::read(path);
        let spec = spec(path);
        b.counter(BytesCount::of_slice(&bytes))
            .bench(|| black_box(scalar::stage1(black_box(&bytes), spec)));
    }
}

mod gk1 {
    use super::*;

    /// Stage 1 on every tier this host runs, per corpus file.
    #[divan::bench(args = FILES)]
    fn stage1_tiers(b: Bencher, path: &str) {
        let input = PaddedInput::from_slice(&parse_that_corpus::read(path));
        let spec = spec(path);
        let tiers = tiers();
        b.counter(BytesCount::new(input.len() * tiers.len())).bench(|| {
            for &t in &tiers {
                black_box(stage1_with(t, black_box(input.as_padded()), spec));
            }
        });
    }

    const LINES: [usize; 5] = [16, 64, 256, 1024, 4096];

    fn line(n: usize) -> Vec<u8> {
        let mut v: Vec<u8> = b"let width = measure(line); ".iter().copied().cycle().take(n).collect();
        v.extend_from_slice("\u{2026}".as_bytes());
        v
    }

    #[divan::bench(args = LINES)]
    fn ascii_selected(b: Bencher, n: usize) {
        let v = line(n);
        b.counter(BytesCount::new(n))
            .bench(|| black_box(parse_that_simd::ascii_prefix_len(black_box(&v))));
    }

    #[divan::bench(args = LINES)]
    fn ascii_oracle(b: Bencher, n: usize) {
        let v = line(n);
        b.counter(BytesCount::new(n))
            .bench(|| black_box(scalar::ascii_prefix_len(black_box(&v))));
    }

    #[divan::bench(args = LINES)]
    fn ascii_every_tier(b: Bencher, n: usize) {
        let v = line(n);
        let tiers = tiers();
        b.counter(BytesCount::new(n * tiers.len())).bench(|| {
            for &t in &tiers {
                black_box(ascii_prefix_len_with(t, black_box(&v)));
            }
        });
    }
}
