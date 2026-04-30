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
pub mod saturation_cache;
pub mod translate;

pub use cost::RegexExtractionCost;
pub use node::HirENode;
pub use rules::default_hir_rules;
pub use saturation_cache::SaturationCache;
pub use translate::{extract_hir, insert_hir};

use egraph::{CspScheduler, EGraph, Id, NoAnalysis, RewriteFn, Scheduler};

use crate::hir::Hir;
use crate::info::count_hir_nodes;

/// The HIR e-graph type — an `EGraph` parameterized on `HirENode`
/// with the substrate `NoAnalysis` (no per-class lattice data is
/// consumed by any rule, cost model, or extractor in either tier).
pub type HirEGraph = EGraph<HirENode, NoAnalysis>;

/// Build an e-graph from a single owning `Hir` tree. Returns the
/// populated graph and the root e-class Id. After `build`, the
/// graph is rebuild-clean and ready for saturation.
///
/// The hash-cons table is pre-sized via `EGraph::with_capacity` from the
/// HIR node count so the dropped capacity stays proportional to actual
/// occupancy. Without this, the default `FxHashMap` settles at the next
/// power of two and `drop_in_place<EGraph<HirENode>>` becomes the
/// dominant cost on small patterns (the same cliff that the grammar
/// tier hit on `compile_bbnf`).
pub fn build_hir_egraph(hir: &Hir) -> (HirEGraph, Id) {
    // The five rewrite rules can introduce up to ~2x more e-nodes through
    // flattening / canonicalization, so we double the input node count as
    // the capacity hint. The cost is one Vec/HashMap reservation up front;
    // the win is that the drop walks ~2N buckets instead of the next power
    // of two above 2N.
    let expected_nodes = count_hir_nodes(hir).saturating_mul(2);
    let mut egraph: HirEGraph = EGraph::with_capacity(expected_nodes);
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
            "hir-egraph saturation: rules={} iters={} applied={} initial_nodes={} final_nodes={} final_classes={} saturated={} iter_hit={} growth_hit={}",
            rule_refs.len(),
            report.iterations,
            report.total_applied,
            egraph.total_nodes(),
            report.final_nodes,
            report.final_classes,
            report.saturated,
            report.iter_limit_hit,
            report.growth_limit_hit,
        );
        for (rule_name, work) in &report.per_rule {
            eprintln!("  rule={} work={}", rule_name, work);
        }
    }
}

/// Extract the cost-cheapest equivalent `Hir` form rooted at
/// `root` from a saturated e-graph, using the given cost model.
///
/// Wraps `extract_hir` (the low-level translator) for API
/// symmetry with `build_hir_egraph` / `saturate_hir_egraph`.
pub fn extract_canonical(egraph: &HirEGraph, root: Id, cost: &RegexExtractionCost) -> Hir {
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
///
/// **Trivial-HIR fast path**: every retained rewrite rule
/// (`FlattenAltConcat`, `DeduplicateAlternation`,
/// `SupersetAbsorbClass`, `UnionMergeClass`, `AbsorbRepetition`)
/// either targets an `Alternation` directly or requires a
/// `Repetition` paired with a sibling `Repetition` inside a
/// `Concat`. A pattern that contains zero `Alternation` and zero
/// `Repetition` nodes therefore cannot trigger any rule — saturation
/// is a guaranteed no-op and the build/rebuild/drop overhead is
/// pure waste. The fast path returns the input HIR unchanged in
/// that case, eliminating the dominant cost on simple character-class
/// or literal patterns (the JSON / CSS L4 grammars are mostly these).
pub fn simplify_hir(hir: &Hir, cost: &RegexExtractionCost) -> Hir {
    if !needs_saturation(hir) {
        return hir.clone();
    }
    let (mut egraph, root) = build_hir_egraph(hir);
    saturate_hir_egraph(&mut egraph);
    extract_canonical(&egraph, root, cost)
}

/// Tranche X phase 3: per-compile cached variant of [`simplify_hir`].
///
/// JSON's 4-6 unique regex patterns previously paid the full
/// `build → saturate → extract → drop` cycle on every compile of the
/// same grammar (`compile_json` was 9.17% inclusive on
/// `bbnf_regex::egraph::saturate_hir_egraph` per the post-W samply
/// profile). The trivial-HIR `needs_saturation` skip in
/// [`simplify_hir`] only handled `Empty / Literal / Class / Look`
/// leaves; JSON's string and number patterns have nested
/// `Alternation` and `Repetition` so they fell through to the full
/// saturate path on every call.
///
/// `simplify_hir_cached` keys the canonical-HIR result on the
/// (input HIR, cost) hash via the per-compile [`SaturationCache`].
/// On hit, returns the cached canonical form. On miss, runs the full
/// `simplify_hir` and stores the result. The cache is owned by the
/// caller (`compute_regex_info` allocates one per compile and drops
/// it at the end), so there is no global state to invalidate and no
/// cross-compile leakage.
pub fn simplify_hir_cached(
    hir: &Hir,
    cost: &RegexExtractionCost,
    cache: &mut SaturationCache,
) -> Hir {
    if !needs_saturation(hir) {
        return hir.clone();
    }
    if let Some(canonical) = cache.get(hir) {
        return canonical.clone();
    }
    let canonical = {
        let (mut egraph, root) = build_hir_egraph(hir);
        saturate_hir_egraph(&mut egraph);
        extract_canonical(&egraph, root, cost)
    };
    cache.insert(hir.clone(), canonical.clone());
    canonical
}

/// Predicate: does this HIR contain any node that a retained rewrite
/// rule could fire on? See [`simplify_hir`] for the rationale.
fn needs_saturation(hir: &Hir) -> bool {
    match hir {
        Hir::Empty | Hir::Literal(_) | Hir::Class(_) | Hir::Look(_) => false,
        Hir::Alternation(_) | Hir::Repetition(_) => true,
        Hir::Group(sub) => needs_saturation(sub),
        Hir::Concat(seq) => seq.iter().any(needs_saturation),
    }
}
