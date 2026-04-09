//! Tranche P: NFA→DFA compile + match throughput.
//!
//! Two scenarios:
//!
//! 1. **Compile**: for each pattern in the corpus, compile via
//!    `Dfa::compile` (parse → HIR → NFA → DFA → minimize). This
//!    measures the full automata construction pipeline.
//!
//! 2. **Match**: pre-compile a subset of representative patterns,
//!    then run `Dfa::find_at` against a fixed input buffer. This
//!    measures the runtime hot loop (transition table walk +
//!    byte equivalence class lookup).

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

#[macro_use]
extern crate bencher;

use bencher::{Bencher, black_box};

use bbnf_regex::Dfa;

const COMPILE_PATTERNS: &[&str] = &[
    r"\d+",
    r"\s+",
    r"\w+",
    r"[a-z]+",
    r"[a-zA-Z_]\w*",
    r"[0-9a-fA-F]+",
    r"[0-9a-fA-F]{3,8}",
    r"-?\d+",
    r"-?(0|[1-9]\d*)(\.\d+)?",
    r"[-+]?\d+",
    r"[-+]?(\d+(\.\d+)?|\.\d+)",
    r"https?://[a-zA-Z0-9./-]+",
    r"#[0-9a-fA-F]{3,6}",
    r"\d{4}-\d{2}-\d{2}",
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
    r"0x[0-9a-fA-F]+",
    r"\d+px",
    r"\d+(?:px|em|rem|vh|vw)",
    r"(?:foo|bar|baz)+",
    r"[A-Za-z0-9+/]+",
    r"[a-zA-Z][a-zA-Z0-9]*",
    r"(?:0|[1-9][0-9]*)",
    r"[\-]?[a-zA-Z_][\w-]*|--[\w-]+",
    r"[a-zA-Z_][\w-]*",
    r"\d+(?:_\d+)*",
    r"\w+(?:[-_]\w+)*",
];

const MATCH_INPUT: &str = "the quick brown fox 12345 jumped over 3.14159 lazy \
dogs at https://example.com on 2026-04-09 with hex \
deadBEEF and 192.168.1.100 plus 0x7FFF and #FFAACC";

fn dfa_compile(b: &mut Bencher) {
    let total: usize = COMPILE_PATTERNS.iter().map(|p| p.len()).sum();
    b.bytes = total as u64;

    b.iter(|| {
        for &pattern in COMPILE_PATTERNS {
            let _ = black_box(Dfa::compile(pattern));
        }
    });
}

fn dfa_find_at(b: &mut Bencher) {
    // Pre-compile a representative subset.
    let dfas: Vec<Dfa> = [r"\d+", r"\w+", r"[a-zA-Z_]\w*", r"#[0-9a-fA-F]{3,6}"]
        .iter()
        .filter_map(|&p| Dfa::compile(p))
        .collect();
    let bytes = MATCH_INPUT.as_bytes();
    b.bytes = bytes.len() as u64 * dfas.len() as u64;

    b.iter(|| {
        for dfa in &dfas {
            let mut offset = 0;
            while offset < bytes.len() {
                match dfa.find_at(bytes, offset) {
                    Some(end) if end > offset => {
                        black_box(end);
                        offset = end;
                    }
                    _ => offset += 1,
                }
            }
        }
    });
}

benchmark_group!(regex_dfa_compile, dfa_compile, dfa_find_at);
benchmark_main!(regex_dfa_compile);
