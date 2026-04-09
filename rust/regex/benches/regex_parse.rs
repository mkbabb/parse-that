//! Tranche P: bbnf-regex HIR parser throughput.
//!
//! Cold-parse 50+ real-world regex patterns drawn from JSON, CSS,
//! identifiers, dates, IPs, hex literals, etc. Each iteration parses
//! the entire corpus from scratch — measures the parser hot path and
//! the surrounding `Hir` allocation.

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

#[macro_use]
extern crate bencher;

use bencher::{Bencher, black_box};

use bbnf_regex::hir::ParseOptions;
use bbnf_regex::parse_with;

const PATTERNS: &[&str] = &[
    // ── JSON ──────────────────────────────────────────────────
    r#"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?"#,
    r#""(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*""#,
    // ── CSS identifiers ───────────────────────────────────────
    r"[a-zA-Z_][\w-]*",
    r"-?[a-zA-Z_][\w-]*|--[\w-]+",
    r"[\-]?[a-zA-Z_][\w-]*|--[\w-]+",
    // ── CSS numbers ───────────────────────────────────────────
    r"[-+]?(\d+(\.\d+)?|\.\d+)([eE][-+]?\d+)?",
    r"[-+]?\d+",
    // ── Whitespace + comments ─────────────────────────────────
    r"(?s)(?:\s|/\*.*?\*/)*",
    // ── Character classes ─────────────────────────────────────
    r"[0-9a-fA-F]{3,8}",
    r"[0-9a-fA-F]+",
    r"[iIsS]",
    r"[^\]\\]",
    r"[^\\()\[\]{}|*+?.^$]",
    // ── Quoted strings ────────────────────────────────────────
    r#""(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'"#,
    // ── Simple patterns ───────────────────────────────────────
    r"\d+",
    r"\s+",
    r"\w+",
    r"[a-z]+",
    r".",
    r"\\",
    // ── Groups + alternation ──────────────────────────────────
    r"(?:foo|bar|baz)+",
    r"(a|b)(c|d)",
    // ── Quantifiers ───────────────────────────────────────────
    r"a*",
    r"a+?",
    r"a{3,5}",
    // ── Escapes ───────────────────────────────────────────────
    r"\n\r\t",
    r"\.",
    // ── Empty / pathological ──────────────────────────────────
    r"",
    // ── Complex CSS ───────────────────────────────────────────
    r"(?:-?[a-zA-Z_]|\\[^\n])(?:[\w-]|\\[^\n])*",
    r"[-+]?\d*n",
    // ── URLs / domains ────────────────────────────────────────
    r"https?://[a-zA-Z0-9./-]+",
    r"(?:[a-z]+\.)+[a-z]+",
    // ── Colors / units ────────────────────────────────────────
    r"#[0-9a-fA-F]{3,6}",
    r"\d+px",
    r"\d+%",
    r"\d+(?:px|em|rem|vh|vw)",
    // ── Dates / times / IPs ───────────────────────────────────
    r"\d{4}-\d{2}-\d{2}",
    r"\d{2}:\d{2}:\d{2}",
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
    // ── Numeric literals ──────────────────────────────────────
    r"0x[0-9a-fA-F]+",
    r"0b[01]+",
    r"0[0-7]+",
    r"\d+\.\d+",
    r"\d+(?:_\d+)*",
    // ── Identifiers / slugs ───────────────────────────────────
    r"[A-Za-z0-9+/]+",
    r"\$[a-zA-Z_][a-zA-Z0-9_]*",
    r"[a-zA-Z][a-zA-Z0-9]*",
    r"\w+(?:[-_]\w+)*",
    // ── Repeated alternation / nesting ────────────────────────
    r"(?:foo|bar)*",
    r"(?:[a-z]{2,4})+",
    // ── Decimal integer (canonical) ───────────────────────────
    r"(?:0|[1-9][0-9]*)",
    // ── Assignment shape ──────────────────────────────────────
    r"[a-zA-Z_]\w*\s*=\s*\d+",
    // ── Parenthesized ─────────────────────────────────────────
    r"\([^)]*\)",
];

fn parse_corpus(b: &mut Bencher) {
    let opts = ParseOptions::byte_mode();
    let total: usize = PATTERNS.iter().map(|p| p.len()).sum();
    b.bytes = total as u64;

    b.iter(|| {
        for &pattern in PATTERNS {
            let _ = black_box(parse_with(pattern, &opts));
        }
    });
}

fn parse_unicode(b: &mut Bencher) {
    let opts = ParseOptions { unicode: true };
    let total: usize = PATTERNS.iter().map(|p| p.len()).sum();
    b.bytes = total as u64;

    b.iter(|| {
        for &pattern in PATTERNS {
            let _ = black_box(parse_with(pattern, &opts));
        }
    });
}

benchmark_group!(regex_parse, parse_corpus, parse_unicode);
benchmark_main!(regex_parse);
