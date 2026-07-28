//! Compile-time HIR→NFA→DFA→checked-table throughput.

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use divan::{Bencher, black_box};

use bbnf_regex::RegexTablePlan;

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

#[divan::bench]
fn table_plan_compile(b: Bencher) {
    b.bench(|| {
        for &pattern in COMPILE_PATTERNS {
            let _ = black_box(RegexTablePlan::compile(pattern));
        }
    });
}

#[divan::bench]
fn table_plan_serialize(b: Bencher) {
    let plans: Vec<RegexTablePlan> = [r"\d+", r"\w+", r"[a-zA-Z_]\w*", r"#[0-9a-fA-F]{3,6}"]
        .iter()
        .filter_map(|&pattern| RegexTablePlan::compile(pattern).ok())
        .collect();

    b.bench(|| {
        for plan in &plans {
            black_box(plan.to_bytes());
        }
    });
}

fn main() {
    divan::main();
}
