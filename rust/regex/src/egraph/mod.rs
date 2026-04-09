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
//! - The substrate analysis is `egraph::NoAnalysis` — neither
//!   tier consumes per-class lattice data, so the wrapper struct
//!   was deleted in Tranche M.
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

pub mod cost;
pub mod node;
pub mod rules;
pub mod translate;

pub use cost::RegexExtractionCost;
pub use node::HirENode;
pub use rules::default_hir_rules;
pub use translate::{extract_hir, insert_hir};

use egraph::{CspScheduler, EGraph, Id, NoAnalysis, RewriteFn, Scheduler};

use crate::hir::Hir;

/// The HIR e-graph type — an `EGraph` parameterized on `HirENode`
/// with the substrate `NoAnalysis` (no per-class lattice data is
/// consumed by any rule, cost model, or extractor in either tier).
pub type HirEGraph = EGraph<HirENode, NoAnalysis>;

/// Build an e-graph from a single owning `Hir` tree. Returns the
/// populated graph and the root e-class Id. After `build`, the
/// graph is rebuild-clean and ready for saturation.
pub fn build_hir_egraph(hir: &Hir) -> (HirEGraph, Id) {
    let mut egraph: HirEGraph = EGraph::new();
    let root = insert_hir(&mut egraph, hir);
    egraph.rebuild();
    (egraph, root)
}

/// Drive rewrites to fixed-point using `CspScheduler`.
/// Mirrors `bbnf_ir::egraph::build_and_saturate` exactly — same
/// scheduler, same iteration cap, same growth limit. When
/// `BBNF_HIR_EGRAPH_REPORT=1` is set in the environment, prints
/// a run report with per-rule fire counts, mirroring the
/// grammar-tier `BBNF_EGRAPH_REPORT`.
pub fn saturate_hir_egraph(egraph: &mut HirEGraph) {
    let rules = default_hir_rules::<NoAnalysis>();
    let rule_refs: Vec<&dyn RewriteFn<HirENode, NoAnalysis>> =
        rules.iter().map(|r| r.as_ref()).collect();

    let scheduler = CspScheduler::default();
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
