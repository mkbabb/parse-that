//! Tranche O — extracted from `regex/src/egraph/rules/superset.rs`.
//! Tests for the `SupersetAbsorbClass` HIR rewrite rule.

use egraph::{EGraph, NoAnalysis, Rewrite};

use bbnf_regex::egraph::rules::{AbsorbMatch, SupersetAbsorbClass};
use bbnf_regex::egraph::{HirENode, insert_hir};
use bbnf_regex::hir::{ByteRange, CharClass, Hir};

fn mk_class(ranges: &[(u8, u8)]) -> Hir {
    Hir::Class(CharClass::Bytes {
        ranges: ranges.iter().map(|&(s, e)| ByteRange::new(s, e)).collect(),
        negated: false,
    })
}

fn search_matches(hir: Hir) -> Vec<AbsorbMatch> {
    let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
    let _root = insert_hir(&mut egraph, &hir);
    egraph.rebuild();
    <SupersetAbsorbClass as Rewrite<HirENode, NoAnalysis>>::search(&SupersetAbsorbClass, &egraph)
        .into_iter()
        .map(|(_, m)| m)
        .collect()
}

#[test]
fn superset_absorbs_subset() {
    // [a-z] | [a-c]  →  [a-z]
    let hir = Hir::Alternation(vec![mk_class(&[(b'a', b'z')]), mk_class(&[(b'a', b'c')])]);
    let ms = search_matches(hir);
    assert!(!ms.is_empty(), "superset rule must match [a-z]|[a-c]");
    assert_eq!(ms[0].survivors.len(), 1, "subsumed branch dropped");
}

#[test]
fn disjoint_classes_not_absorbed() {
    let hir = Hir::Alternation(vec![mk_class(&[(b'a', b'c')]), mk_class(&[(b'd', b'f')])]);
    let ms = search_matches(hir);
    assert!(
        ms.is_empty(),
        "superset rule must not match disjoint classes"
    );
}
