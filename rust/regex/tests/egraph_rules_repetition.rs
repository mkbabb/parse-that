//! Tranche O — extracted from `regex/src/egraph/rules/repetition.rs`.
//! Tests for the `AbsorbRepetition` HIR rewrite rule.

use egraph::{EGraph, NoAnalysis, Rewrite};

use bbnf_regex::egraph::rules::{AbsorbRepetition, AbsorbRepetitionMatch, merge_bounds};
use bbnf_regex::egraph::{HirENode, insert_hir};
use bbnf_regex::hir::{Hir, Repetition};

fn rep(inner: Hir, min: u32, max: Option<u32>) -> Hir {
    Hir::Repetition(Repetition {
        sub: Box::new(inner),
        min,
        max,
        greedy: true,
    })
}

fn search_matches(hir: Hir) -> Vec<AbsorbRepetitionMatch> {
    let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
    let _root = insert_hir(&mut egraph, &hir);
    egraph.rebuild();
    <AbsorbRepetition as Rewrite<HirENode, NoAnalysis>>::search(&AbsorbRepetition, &egraph)
        .into_iter()
        .map(|(_, m)| m)
        .collect()
}

#[test]
fn merge_plus_star_to_plus() {
    // a+ a*  →  Rep(a, 1, None)   (min=1+0=1, max=None)
    let a = Hir::Literal(vec![b'a']);
    let hir = Hir::Concat(vec![rep(a.clone(), 1, None), rep(a, 0, None)]);
    let ms = search_matches(hir);
    assert!(!ms.is_empty(), "absorb rule must match on a+a*");
    let m = &ms[0];
    assert_eq!(m.merged_min, 1);
    assert_eq!(m.merged_max, None);
}

#[test]
fn merge_different_subs_does_not_match() {
    let a = Hir::Literal(vec![b'a']);
    let b = Hir::Literal(vec![b'b']);
    let hir = Hir::Concat(vec![rep(a, 1, None), rep(b, 0, None)]);
    let ms = search_matches(hir);
    assert!(ms.is_empty(), "absorb rule must not match on a+b*");
}

#[test]
fn merge_bounds_arithmetic() {
    // a{2,3} a{1,4}  →  Rep(a, 3, Some(7))
    assert_eq!(merge_bounds((2, Some(3)), (1, Some(4))), (3, Some(7)));
    // a+ a*  →  Rep(a, 1, None)
    assert_eq!(merge_bounds((1, None), (0, None)), (1, None));
    // a? a*  →  Rep(a, 0, None)
    assert_eq!(merge_bounds((0, Some(1)), (0, None)), (0, None));
    // a* a*  →  Rep(a, 0, None)
    assert_eq!(merge_bounds((0, None), (0, None)), (0, None));
}
