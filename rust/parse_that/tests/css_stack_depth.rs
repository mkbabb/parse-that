//! Stack cost of nested CSS at-rules (sk-v27 LW2.PERF-3).
//!
//! Each nesting level of `@media { … }` re-enters the at-rule body, so the
//! stack a parse needs grows linearly with depth. This file measures that
//! slope and holds it to the default test-thread stack.
//!
//! The measurement re-runs this test binary as a child process, one parse
//! per child on a thread of a chosen stack size, and binary-searches the
//! smallest size that parses (an overflow aborts only the child). The
//! sweep prints its table so the record can cite it.

use std::process::Command;

use parse_that::parsers::css::*;
use parse_that::state::ParserState;

const CHILD_DEPTH: &str = "PARSE_THAT_CSS_STACK_DEPTH";
const CHILD_STACK: &str = "PARSE_THAT_CSS_STACK_BYTES";
/// Search resolution: a thread's stack is rounded up to whole pages, and
/// the largest page size on the hosts we run (aarch64 macOS) is 16 KiB.
const STEP: usize = 16 * 1024;

/// `depth` nested `@media` blocks around one qualified rule.
fn nested(depth: usize) -> String {
    let mut css = String::new();
    for _ in 0..depth {
        css.push_str("@media screen { ");
    }
    css.push_str(".sm { display: block; }");
    for _ in 0..depth {
        css.push_str(" }");
    }
    css
}

/// Parse `nested(depth)` and check the shape: one node per level.
fn parse_nested(depth: usize) {
    let css = nested(depth);
    let mut state = ParserState::new(&css);
    let nodes = css_parser().call(&mut state).unwrap_or_default();
    let mut level = &nodes;
    for _ in 0..depth {
        assert_eq!(level.len(), 1);
        match &level[0] {
            CssNode::AtMedia { body, .. } => level = body,
            other => panic!("expected AtMedia, got {other:?}"),
        }
    }
    assert!(matches!(level.as_slice(), [CssNode::QualifiedRule { .. }]));
}

/// The child half: runs only when the parent sets both variables.
#[test]
fn child_parse_on_sized_stack() {
    let (Ok(depth), Ok(bytes)) = (std::env::var(CHILD_DEPTH), std::env::var(CHILD_STACK)) else {
        return;
    };
    let depth: usize = depth.parse().unwrap();
    let bytes: usize = bytes.parse().unwrap();
    std::thread::Builder::new()
        .stack_size(bytes)
        .spawn(move || parse_nested(depth))
        .unwrap()
        .join()
        .unwrap();
}

fn parses_within(depth: usize, bytes: usize) -> bool {
    Command::new(std::env::current_exe().unwrap())
        .args(["child_parse_on_sized_stack", "--exact", "--test-threads=1"])
        .env(CHILD_DEPTH, depth.to_string())
        .env(CHILD_STACK, bytes.to_string())
        .output()
        .unwrap()
        .status
        .success()
}

/// Smallest thread stack (to `STEP`) on which `nested(depth)` parses.
fn stack_needed(depth: usize) -> usize {
    let (mut lo, mut hi) = (STEP, 256 * 1024 * 1024);
    assert!(parses_within(depth, hi), "depth {depth} fails at 256 MiB");
    while hi - lo > STEP {
        let mid = (lo + hi) / 2 / STEP * STEP;
        if parses_within(depth, mid) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    hi
}

/// The order's falsifier shape at the default test-thread stack (2 MiB
/// unless `RUST_MIN_STACK` says otherwise): sixteen levels, not two.
#[test]
fn nested_at_rules_depth_16_default_stack() {
    parse_nested(16);
}

/// The depth sweep: per-level growth is one constant, independent of depth.
///
/// `stack_needed(d)` is the maximum of a few paths that each grow by the
/// same per-level cost (the at-rule body re-entered) from different
/// intercepts, so the slope is read between sweep points, not from depth
/// 0. The 8 -> 16 interval is the reading of record (its search error is
/// `2 * STEP / 8`); every earlier interval must agree with it within its
/// own search error, `2 * STEP / (d2 - d1)`.
#[test]
fn nested_at_rule_stack_slope_is_constant() {
    let depths = [1usize, 2, 4, 8, 16];
    let needs: Vec<usize> = depths.iter().map(|&d| stack_needed(d)).collect();
    println!("depth\tstack_needed_bytes\tper_level_bytes_since_previous");
    println!("{}\t{}\t-", depths[0], needs[0]);
    let mut slopes = Vec::new();
    for i in 1..depths.len() {
        let span = depths[i] - depths[i - 1];
        let slope = (needs[i] - needs[i - 1]) / span;
        slopes.push((span, slope));
        println!("{}\t{}\t{}", depths[i], needs[i], slope);
    }
    let (_, reference) = *slopes.last().unwrap();
    println!("per_level_bytes_of_record\t{reference}");
    for (i, &(span, slope)) in slopes.iter().enumerate() {
        let tolerance = 2 * STEP / span + 2 * STEP / 8;
        assert!(
            slope.abs_diff(reference) <= tolerance,
            "per-level stack {}->{} is {slope} B; 8->16 is {reference} B (tolerance {tolerance} B)",
            depths[i],
            depths[i + 1],
        );
    }
}
