//! Tranche P: structural classification throughput.
//!
//! Pre-parses the pattern corpus once, then in the bench loop runs
//! `classify_known_pattern` (string fast-path) followed by
//! `classify_regex_from_hir` (HIR walk). Measures the cost of
//! recognizing semantic categories — Numeric, HexDigits, Identifier,
//! QuotedString, JsonNumber, JsonString — that drive
//! `FnDescriptor` specialization in bbnf and `RegexInfo`'s
//! classification field.

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

#[macro_use]
extern crate bencher;

use bencher::{Bencher, black_box};

use bbnf_regex::classify::{classify_known_pattern, classify_regex_from_hir};
use bbnf_regex::hir::{Hir, ParseOptions};
use bbnf_regex::parse_with;

const PATTERNS: &[&str] = &[
    r#"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?"#,
    r#""(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*""#,
    r"[a-zA-Z_][\w-]*",
    r"-?[a-zA-Z_][\w-]*|--[\w-]+",
    r"[\-]?[a-zA-Z_][\w-]*|--[\w-]+",
    r"[-+]?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?",
    r"[-+]?\d+",
    r"(?s)(?:\s|/\*.*?\*/)*",
    r"[0-9a-fA-F]{3,8}",
    r"[0-9a-fA-F]+",
    r"[iIsS]",
    r"[^\]\\]",
    r"[^\\()\[\]{}|*+?.^$]",
    r#""(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'"#,
    r"\d+",
    r"\s+",
    r"\w+",
    r"[a-z]+",
    r".",
    r"\\",
    r"(?:foo|bar|baz)+",
    r"(a|b)(c|d)",
    r"a*",
    r"a+?",
    r"a{3,5}",
    r"\n\r\t",
    r"\.",
    r"",
    r"(?:-?[a-zA-Z_]|\\[^\n])(?:[\w-]|\\[^\n])*",
    r"[-+]?\d*n",
    r"https?://[a-zA-Z0-9./-]+",
    r"(?:[a-z]+\.)+[a-z]+",
    r"#[0-9a-fA-F]{3,6}",
    r"\d+px",
    r"\d+%",
    r"\d+(?:px|em|rem|vh|vw)",
    r"\d{4}-\d{2}-\d{2}",
    r"\d{2}:\d{2}:\d{2}",
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
    r"0x[0-9a-fA-F]+",
    r"0b[01]+",
    r"0[0-7]+",
    r"\d+\.\d+",
    r"\d+(?:_\d+)*",
    r"[A-Za-z0-9+/]+",
    r"\$[a-zA-Z_][a-zA-Z0-9_]*",
    r"[a-zA-Z][a-zA-Z0-9]*",
    r"\w+(?:[-_]\w+)*",
    r"(?:foo|bar)*",
    r"(?:[a-z]{2,4})+",
    r"(?:0|[1-9][0-9]*)",
    r"[a-zA-Z_]\w*\s*=\s*\d+",
    r"\([^)]*\)",
];

fn pre_parse() -> Vec<(&'static str, Hir)> {
    let opts = ParseOptions::byte_mode();
    PATTERNS
        .iter()
        .filter_map(|&p| parse_with(p, &opts).ok().map(|h| (p, h)))
        .collect()
}

fn classify_known(b: &mut Bencher) {
    let total: usize = PATTERNS.iter().map(|p| p.len()).sum();
    b.bytes = total as u64;

    b.iter(|| {
        for &pattern in PATTERNS {
            let _ = black_box(classify_known_pattern(pattern));
        }
    });
}

fn classify_structural(b: &mut Bencher) {
    let parsed = pre_parse();
    let total: usize = parsed.iter().map(|(p, _)| p.len()).sum();
    b.bytes = total as u64;

    b.iter(|| {
        for (_, hir) in &parsed {
            let _ = black_box(classify_regex_from_hir(hir));
        }
    });
}

benchmark_group!(regex_classify, classify_known, classify_structural);
benchmark_main!(regex_classify);
