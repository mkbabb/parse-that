//! HIR e-graph — equality saturation over regex HIR.
//!
//! Mirrors the grammar-tier e-graph in `bbnf-ir`. See
//! `docs/four-layer-optimizer.md` in bbnf-lang for the full
//! architectural framing.
//!
//! # Substrate
//!
//! - [`HirENode`] — the e-node enum (variant-parallel to `Hir`,
//!   with `Id` children). Derives `Language` via
//!   `egraph_derive::Language`.
//! - [`HirAnalysis`] — per-class lattice analysis (min_size,
//!   nullable), mirroring `bbnf_ir::egraph::GrammarAnalysis`.
//! - [`insert_hir`] — recursive translator: owning `Hir` tree →
//!   e-graph root Id.
//! - [`extract_hir`] — recursive extractor: saturated e-graph +
//!   root Id → cost-cheapest owning `Hir` tree.
//! - [`RegexExtractionCost`] — cost model embedding the shared
//!   `egraph::CostWeights` substrate.
//! - [`default_hir_rules`] — the five retained HIR rewrite rules
//!   (flatten, dedup, superset, union, repetition).
//!
//! # High-level entry points
//!
//! - [`build_hir_egraph`] — build an e-graph from a single `Hir`.
//! - [`saturate_hir_egraph`] — drive rewrites to fixed-point via
//!   `BackoffScheduler` (isomorphic to the grammar tier's
//!   `build_and_saturate`).
//! - [`extract_canonical`] — extract the cost-cheapest equivalent
//!   `Hir` form from a saturated e-graph.
//! - [`simplify_hir`] — convenience: build + saturate + extract.
//!   This is the one consumers call from
//!   `RegexInfo::analyze_from_hir` (Tranche H-6).

pub mod analysis;
pub mod cost;
pub mod node;
pub mod rules;
pub mod translate;

pub use analysis::{HirAnalysis, HirClassData};
pub use cost::RegexExtractionCost;
pub use node::HirENode;
pub use rules::default_hir_rules;
pub use translate::{extract_hir, insert_hir};

use egraph::{BackoffScheduler, EGraph, Id, RewriteFn, Scheduler};

use crate::hir::Hir;

/// The HIR e-graph type — an `EGraph` parameterized on `HirENode`
/// and the minimal `HirAnalysis` lattice.
pub type HirEGraph = EGraph<HirENode, HirAnalysis>;

/// Build an e-graph from a single owning `Hir` tree. Returns the
/// populated graph and the root e-class Id. After `build`, the
/// graph is rebuild-clean and ready for saturation.
pub fn build_hir_egraph(hir: &Hir) -> (HirEGraph, Id) {
    let mut egraph: HirEGraph = EGraph::new();
    let root = insert_hir(&mut egraph, hir);
    egraph.rebuild();
    (egraph, root)
}

/// Drive rewrites to fixed-point using `BackoffScheduler`.
/// Mirrors `bbnf_ir::egraph::build_and_saturate` exactly — same
/// scheduler, same iteration cap, same growth limit. When
/// `BBNF_HIR_EGRAPH_REPORT=1` is set in the environment, prints
/// a run report with per-rule fire counts, mirroring the
/// grammar-tier `BBNF_EGRAPH_REPORT`.
pub fn saturate_hir_egraph(egraph: &mut HirEGraph) {
    let rules = default_hir_rules::<HirAnalysis>();
    let rule_refs: Vec<&dyn RewriteFn<HirENode, HirAnalysis>> =
        rules.iter().map(|r| r.as_ref()).collect();

    let scheduler = BackoffScheduler::default();
    let report = scheduler.run(egraph, &rule_refs);

    if std::env::var("BBNF_HIR_EGRAPH_REPORT").is_ok() {
        eprintln!(
            "hir-egraph saturation: rules={} rules_count={} iters={} applied={} initial_nodes={} final_nodes={} final_classes={} saturated={} iter_hit={} growth_hit={}",
            rule_refs.len(),
            rule_refs.iter().map(|r| r.name()).collect::<Vec<_>>().join(","),
            report.iterations,
            report.total_applied,
            egraph.total_nodes(),
            report.final_nodes,
            report.final_classes,
            report.saturated,
            report.iter_limit_hit,
            report.growth_limit_hit,
        );
    }
}

/// Extract the cost-cheapest equivalent `Hir` form rooted at
/// `root` from a saturated e-graph, using the given cost model.
///
/// Wraps `extract_hir` (the low-level translator) for API
/// symmetry with `build_hir_egraph` / `saturate_hir_egraph`.
pub fn extract_canonical(
    egraph: &HirEGraph,
    root: Id,
    cost: &RegexExtractionCost,
) -> Hir {
    extract_hir(egraph, root, cost)
}

/// Build + saturate + extract in one call.
///
/// This is the entry point consumed by
/// `RegexInfo::analyze_from_hir` in Tranche H-6 — every pattern
/// passes through `simplify_hir` before any downstream analysis
/// (FIRST sets, nullable, width, DFA sizing) sees it, so those
/// analyses all receive the canonicalized HIR with zero
/// caller-side awareness.
pub fn simplify_hir(hir: &Hir, cost: &RegexExtractionCost) -> Hir {
    let (mut egraph, root) = build_hir_egraph(hir);
    saturate_hir_egraph(&mut egraph);
    extract_canonical(&egraph, root, cost)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hir::{ByteRange, CharClass, Hir};

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
        // A pattern with no applicable rewrites should extract
        // back to something equivalent. Since the cost model
        // picks the cheapest, we check that the result is
        // semantically equivalent (not byte-equal).
        let hir = Hir::Alternation(vec![
            mk_class(&[(b'a', b'c')]),
            mk_class(&[(b'd', b'f')]),
        ]);
        let cost = RegexExtractionCost::default();
        let out = simplify_hir(&hir, &cost);
        // After union-merge + cost-guided extraction, the
        // cheapest form is the merged [a-f] class (fewer Alt
        // branches, less structural cost). Assert the output
        // is a single Class covering both ranges.
        match out {
            Hir::Class(CharClass::Bytes { ranges, negated: false }) => {
                let mut covered = [false; 256];
                for r in &ranges {
                    for b in r.start..=r.end {
                        covered[b as usize] = true;
                    }
                }
                for b in b'a'..=b'f' {
                    assert!(covered[b as usize], "merged class must cover {}", b as char);
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
        // Cost-guided extraction should pick the deduped form
        // (2 branches beats 3 branches).
        match out {
            Hir::Alternation(branches) => {
                assert_eq!(branches.len(), 2, "deduped alt should have 2 branches");
            }
            other => panic!("expected Alternation with 2 branches, got {:?}", other),
        }
    }
}
