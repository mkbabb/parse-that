//! Benchmark: hand-written regex parser vs self-hosted (derive-generated) parser.
//!
//! Parses a comprehensive suite of regex patterns used across BBNF grammars.
//! Measures cold parse throughput — fresh parser per iteration.

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use bencher::{Bencher, benchmark_group, benchmark_main};

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

fn bench_handwritten(b: &mut Bencher) {
    b.iter(|| {
        for &pattern in PATTERNS {
            let _ = parse_that::regex::parse(pattern);
        }
    });
}

fn bench_generated(b: &mut Bencher) {
    b.iter(|| {
        for &pattern in PATTERNS {
            let _ = regex_bootstrap::parse_generated(pattern);
        }
    });
}

benchmark_group!(regex_parsers, bench_handwritten, bench_generated);
benchmark_main!(regex_parsers);
