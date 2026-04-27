//! Tranche P: HIR e-graph saturation throughput.
//!
//! Pre-parses the pattern corpus once, then in the bench loop runs
//! `simplify_hir` (build → CspScheduler-driven saturate → cost-guided
//! extract) for each pattern. Verifies that the four-layer optimizer's
//! HIR tier — `EGraph<HirENode, NoAnalysis>` plus the five default
//! HIR rewrite rules (flatten, dedup, superset absorb, union merge,
//! repetition absorb) — sustains acceptable throughput on real-world
//! patterns.

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use divan::{Bencher, black_box};

use bbnf_regex::egraph::{RegexExtractionCost, simplify_hir};
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
    // ── Patterns the HIR e-graph can actually simplify ────────
    // Charclass union merge: [a-c]|[d-f] → [a-f]
    r"[a-c]|[d-f]|[g-i]",
    // Superset absorption: [a-z]|[a-c] → [a-z]
    r"[a-z]|[a-c]",
    // Dedup: a|b|a → a|b
    r"a|b|a|c|b",
    // Adjacent repetition absorption: a+a* → a+
    r"a+a*",
    // Nested alt flatten: ((a|b)|c) → (a|b|c)
    r"(?:(?:a|b)|c|(?:d|e))",
];

fn pre_parse() -> Vec<Hir> {
    let opts = ParseOptions::byte_mode();
    PATTERNS
        .iter()
        .filter_map(|&p| parse_with(p, &opts).ok())
        .collect()
}

#[divan::bench]
fn simplify_corpus(b: Bencher) {
    let parsed = pre_parse();
    let cost = RegexExtractionCost::default();

    b.bench(|| {
        for hir in &parsed {
            let _ = black_box(simplify_hir(hir, &cost));
        }
    });
}

fn main() {
    divan::main();
}
