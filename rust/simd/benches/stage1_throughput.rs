//! Stage-1 structural-bitmap throughput benchmark.
//!
//! Canonical corpus (per AW-III.W5):
//! - JSON: twitter (631 KB), citm_catalog (1.7 MB), canada (2.25 MB).
//! - CSS: bootstrap (280 KB), tailwind (3.64 MB).
//!
//! Per-entry throughput in MB/s, reported via divan's `BytesCount`
//! counter against the auto-calibrated sample wall. The kernel is
//! pure CPU + O(n) — the allocator is insignificant at this stripe
//! cadence.
//!
//! The W5 hard gate: ≥ 2 GB/s (≈ 2000 MB/s) on 1 MB JSON.

use divan::Bencher;
use divan::counter::BytesCount;
use parse_that_simd::{alphabet::StructuralAlphabet, scan_structural};
use std::hint::black_box;

const JSON_ALPHABET: StructuralAlphabet = StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\"");

const CSS_ALPHABET: StructuralAlphabet =
    StructuralAlphabet::from_parts(b"{}();:,", &[(b'/', b'*'), (b'*', b'/')], b"\"'");

/// (display name, corpus-relative path, kind).
///
/// Encoded as a `&'static str` discriminant rather than a reference
/// to `StructuralAlphabet` so the array is `const`-constructible
/// and divan's `args` derive can name the parameter cleanly.
#[derive(Clone, Copy)]
struct Fixture {
    name: &'static str,
    path: &'static str,
    kind: Kind,
}

#[derive(Clone, Copy)]
enum Kind {
    Json,
    Css,
}

impl Kind {
    fn alphabet(self) -> &'static StructuralAlphabet {
        match self {
            Kind::Json => &JSON_ALPHABET,
            Kind::Css => &CSS_ALPHABET,
        }
    }
}

impl std::fmt::Display for Fixture {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.name)
    }
}

const FIXTURES: &[Fixture] = &[
    Fixture {
        name: "twitter.json",
        path: "json/twitter.json",
        kind: Kind::Json,
    },
    Fixture {
        name: "citm_catalog.json",
        path: "json/citm_catalog.json",
        kind: Kind::Json,
    },
    Fixture {
        name: "canada.json",
        path: "json/canada.json",
        kind: Kind::Json,
    },
    Fixture {
        name: "bootstrap.css",
        path: "css/bootstrap.css",
        kind: Kind::Css,
    },
    Fixture {
        name: "tailwind.css",
        path: "css/tailwind-output.css",
        kind: Kind::Css,
    },
];

fn read_corpus(rel: &str) -> Vec<u8> {
    parse_that_corpus::read(rel)
}

#[divan::bench(args = FIXTURES)]
fn stage1(b: Bencher, fixture: &Fixture) {
    let input = read_corpus(fixture.path);
    let alphabet = fixture.kind.alphabet();
    b.counter(BytesCount::new(input.len())).bench_local(|| {
        let idx = scan_structural(black_box(input.as_slice()), black_box(alphabet));
        black_box(idx);
    });
}

fn main() {
    // Cold-per-parse — each iter rebuilds the structural index from
    // scratch. Sample shape mirrors the workspace's other divan
    // benches (sample_size=1, skip_ext_time excludes the `with_inputs`
    // setup wall — here it excludes the `bench_local` closure
    // construction). The auto-calibrated sample count converges
    // around the configured budget for sub-millisecond bodies.
    divan::Divan::default()
        .sample_count(100)
        .sample_size(1)
        .skip_ext_time(true)
        .max_time(std::time::Duration::from_secs(30))
        .run_benches();
}
