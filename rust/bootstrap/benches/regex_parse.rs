//! Benchmark: hand-written regex parser vs self-hosted (derive-generated) parser.
//!
//! Parses a comprehensive suite of regex patterns used across BBNF grammars.
//! Measures cold parse throughput — fresh parser per iteration.

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use divan::Bencher;

/// Comprehensive pattern suite — every regex pattern class from BBNF grammars.
const PATTERNS: &[&str] = &[
    // JSON
    r#"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?"#,
    r#""(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*""#,
    // CSS identifiers
    r"[a-zA-Z_][\w-]*",
    r"-?[a-zA-Z_][\w-]*|--[\w-]+",
    r"[\-]?[a-zA-Z_][\w-]*|--[\w-]+",
    // CSS numbers
    r"[-+]?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?",
    r"[-+]?\d+",
    // Whitespace + comments
    r"(?s)(?:\s|/\*.*?\*/)*",
    // Character classes
    r"[0-9a-fA-F]{3,8}",
    r"[0-9a-fA-F]+",
    r"[iIsS]",
    r"[^\]\\]",
    r"[^\\()\[\]{}|*+?.^$]",
    // Quoted strings
    r#""(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'"#,
    // Simple patterns
    r"\d+",
    r"\s+",
    r"\w+",
    r"[a-z]+",
    r".",
    r"\\",
    // Groups
    r"(?:foo|bar|baz)+",
    r"(a|b)(c|d)",
    // Quantifiers
    r"a*",
    r"a+?",
    r"a{3,5}",
    // Escapes
    r"\n\r\t",
    r"\.",
    // Empty
    r"",
    // Complex CSS
    r"(?:-?[a-zA-Z_]|\\[^\n])(?:[\w-]|\\[^\n])*",
    r"[-+]?\d*n",
];

#[divan::bench]
fn bench_handwritten(b: Bencher) {
    b.bench(|| {
        for &pattern in PATTERNS {
            let _ = parse_that::regex::parse(pattern);
        }
    });
}

#[divan::bench]
fn bench_generated(b: Bencher) {
    b.bench(|| {
        for &pattern in PATTERNS {
            let _ = regex_bootstrap::parse_generated(pattern);
        }
    });
}

fn main() {
    divan::main();
}
