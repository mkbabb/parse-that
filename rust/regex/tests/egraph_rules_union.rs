//! Tranche O — extracted from `regex/src/egraph/rules/union.rs`.
//! Tests for the `UnionMergeClass` HIR rewrite rule.

use egraph::{EGraph, NoAnalysis, Rewrite};

use bbnf_regex::egraph::rules::{UnionMatch, UnionMergeClass};
use bbnf_regex::egraph::{HirENode, insert_hir};
use bbnf_regex::hir::{ByteRange, CharClass, Hir};

fn mk_class(ranges: &[(u8, u8)]) -> Hir {
    Hir::Class(CharClass::Bytes {
        ranges: ranges.iter().map(|&(s, e)| ByteRange::new(s, e)).collect(),
        negated: false,
    })
}

fn search_matches(hir: Hir) -> Vec<UnionMatch> {
    let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
    let _root = insert_hir(&mut egraph, &hir);
    egraph.rebuild();
    <UnionMergeClass as Rewrite<HirENode, NoAnalysis>>::search(&UnionMergeClass, &egraph)
        .into_iter()
        .map(|(_, m)| m)
        .collect()
}

#[test]
fn union_merges_adjacent_classes() {
    // [a-c] | [d-f]  →  [a-f]
    let hir = Hir::Alternation(vec![mk_class(&[(b'a', b'c')]), mk_class(&[(b'd', b'f')])]);
    let ms = search_matches(hir);
    assert!(!ms.is_empty(), "union rule must match [a-c]|[d-f]");
}

#[test]
fn union_does_not_match_on_equal_classes() {
    // [a-c] | [a-c]  — dedup's territory, not union's
    let hir = Hir::Alternation(vec![mk_class(&[(b'a', b'c')]), mk_class(&[(b'a', b'c')])]);
    let ms = search_matches(hir);
    assert!(ms.is_empty(), "union rule must not match equal classes");
}
