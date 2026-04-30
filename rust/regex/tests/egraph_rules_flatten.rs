//! Tranche O — extracted from `regex/src/egraph/rules/flatten.rs`.
//! Tests for the `FlattenAltConcat` HIR rewrite rule.

use egraph::{EGraph, NoAnalysis, Rewrite};

use bbnf_regex::egraph::rules::FlattenAltConcat;
use bbnf_regex::egraph::{HirENode, insert_hir};
use bbnf_regex::hir::Hir;

fn mk_lit(b: u8) -> Hir {
    Hir::Literal(vec![b])
}

fn search_matches(hir: Hir) -> usize {
    let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
    let _root = insert_hir(&mut egraph, &hir);
    egraph.rebuild();
    let matches =
        <FlattenAltConcat as Rewrite<HirENode, NoAnalysis>>::search(&FlattenAltConcat, &egraph);
    matches.len()
}

#[test]
fn flatten_nested_alternation_matches() {
    // Build `Alt([Alt([a, b]), c])` directly.
    let inner = Hir::Alternation(vec![mk_lit(b'a'), mk_lit(b'b')]);
    let hir = Hir::Alternation(vec![inner, mk_lit(b'c')]);
    assert!(
        search_matches(hir) > 0,
        "flatten rule must match on Alt([Alt([a,b]), c])"
    );
}

#[test]
fn flatten_nested_concat_matches() {
    let inner = Hir::Concat(vec![mk_lit(b'a'), mk_lit(b'b')]);
    let hir = Hir::Concat(vec![inner, mk_lit(b'c')]);
    assert!(
        search_matches(hir) > 0,
        "flatten rule must match on Concat([Concat([a,b]), c])"
    );
}

#[test]
fn flatten_flat_does_not_match() {
    let hir = Hir::Alternation(vec![mk_lit(b'a'), mk_lit(b'b'), mk_lit(b'c')]);
    assert_eq!(
        search_matches(hir),
        0,
        "flatten rule must not match on already-flat Alt"
    );
}
