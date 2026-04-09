//! Tranche O — extracted from `regex/src/egraph/mod.rs`.
//! End-to-end `simplify_hir` tests.

use bbnf_regex::egraph::{RegexExtractionCost, simplify_hir};
use bbnf_regex::hir::{ByteRange, CharClass, Hir};

fn mk_class(ranges: &[(u8, u8)]) -> Hir {
    Hir::Class(CharClass::Bytes {
        ranges: ranges.iter().map(|&(s, e)| ByteRange::new(s, e)).collect(),
        negated: false,
    })
}

#[test]
fn simplify_hir_round_trips_leaf() {
    let hir = Hir::Literal(vec![b'a', b'b', b'c']);
    let cost = RegexExtractionCost::default();
    let out = simplify_hir(&hir, &cost);
    assert_eq!(out, hir, "simplify on a leaf should be identity");
}

#[test]
fn simplify_hir_preserves_structure() {
    // A pattern with no applicable rewrites should extract back to
    // something equivalent. Since the cost model picks the
    // cheapest, we check semantic — not byte — equivalence.
    let hir = Hir::Alternation(vec![
        mk_class(&[(b'a', b'c')]),
        mk_class(&[(b'd', b'f')]),
    ]);
    let cost = RegexExtractionCost::default();
    let out = simplify_hir(&hir, &cost);
    // After union-merge + cost-guided extraction, the cheapest form
    // is the merged [a-f] class.
    match out {
        Hir::Class(CharClass::Bytes {
            ranges,
            negated: false,
        }) => {
            let mut covered = [false; 256];
            for r in &ranges {
                for b in r.start..=r.end {
                    covered[b as usize] = true;
                }
            }
            for b in b'a'..=b'f' {
                assert!(
                    covered[b as usize],
                    "merged class must cover {}",
                    b as char
                );
            }
        }
        other => panic!("expected merged Class, got {:?}", other),
    }
}

#[test]
fn simplify_hir_dedup_alt_branches() {
    let hir = Hir::Alternation(vec![
        Hir::Literal(vec![b'a']),
        Hir::Literal(vec![b'b']),
        Hir::Literal(vec![b'a']),
    ]);
    let cost = RegexExtractionCost::default();
    let out = simplify_hir(&hir, &cost);
    // Cost-guided extraction should pick the deduped form (2
    // branches beats 3 branches).
    match out {
        Hir::Alternation(branches) => {
            assert_eq!(branches.len(), 2, "deduped alt should have 2 branches");
        }
        other => panic!("expected Alternation with 2 branches, got {:?}", other),
    }
}
