//! Tranche O — extracted from `regex/src/egraph/rules/redundant.rs`.
//! Tests for the `DeduplicateAlternation` HIR rewrite rule.

use egraph::{EGraph, NoAnalysis, Rewrite};

use bbnf_regex::egraph::rules::DeduplicateAlternation;
use bbnf_regex::egraph::{HirENode, insert_hir};
use bbnf_regex::hir::Hir;

fn mk_lit(b: u8) -> Hir {
    Hir::Literal(vec![b])
}

#[test]
fn dedup_identical_literal_branches() {
    let hir = Hir::Alternation(vec![mk_lit(b'a'), mk_lit(b'b'), mk_lit(b'a')]);
    let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
    let _root = insert_hir(&mut egraph, &hir);
    egraph.rebuild();
    let matches = <DeduplicateAlternation as Rewrite<HirENode, NoAnalysis>>::search(
        &DeduplicateAlternation,
        &egraph,
    );
    assert!(!matches.is_empty(), "dedup rule must match on [a, b, a]");
    let (_, m) = &matches[0];
    assert_eq!(m.deduped.len(), 2, "deduped list should have 2 survivors");
}

#[test]
fn dedup_no_duplicates() {
    let hir = Hir::Alternation(vec![mk_lit(b'a'), mk_lit(b'b'), mk_lit(b'c')]);
    let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
    let _root = insert_hir(&mut egraph, &hir);
    egraph.rebuild();
    let matches = <DeduplicateAlternation as Rewrite<HirENode, NoAnalysis>>::search(
        &DeduplicateAlternation,
        &egraph,
    );
    assert!(matches.is_empty(), "dedup rule must not match on [a, b, c]");
}
