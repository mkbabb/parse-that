//! Shared cost / scheduling configuration container.
//!
//! `CostConfig` is the single per-compile substrate every e-graph
//! consumer reads from. It owns:
//!
//! - The shared [`CostWeights`] (per-node structural, alt-branch
//!   penalty, dispatch bonus) — the cross-tier extraction knobs that
//!   stay in lockstep between the grammar tier and the regex HIR tier.
//! - Scheduler caps for [`crate::CspScheduler`] (`iter_limit`,
//!   `node_limit`).
//! - The rayon parallelism threshold consumed by every per-rule
//!   parallel pass — gating parallelism on grammar size keeps the
//!   `LockLatch::wait_and_reset` overhead from dominating small
//!   grammars (the post-V profile measured this at ~25% of a grammar
//!   compile).
//!
//! Domain-specific cost-model knobs (literal/regex/ref weights for
//! the grammar tier; literal-byte / class / repeat weights for the
//! regex tier) live on each tier's wrapper struct, not here. The
//! split keeps the egraph crate domain-agnostic while still letting
//! both tiers share a single source of truth for the cross-cutting
//! decisions.
//!
//! # Tunability
//!
//! Every field is public. A consumer that exposes tuning knobs (an
//! environment variable, a directive in its own input language) writes
//! them into this struct; the crate itself reads no environment.

use crate::cost_weights::{CALIBRATED_WEIGHTS, CostWeights};

/// Shared cost / scheduling substrate. See module docs.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct CostConfig {
    /// Cross-tier extraction weights — read by both
    /// `GrammarCostModel` and `RegexExtractionCost`.
    pub weights: CostWeights,

    /// Maximum saturation iterations the [`crate::CspScheduler`]
    /// will run before giving up. Mirrors the previous default.
    pub egraph_iter_limit: usize,

    /// Absolute cap on total e-nodes across both tiers' e-graphs.
    /// Mirrors the previous default.
    pub egraph_node_limit: usize,

    /// Minimum rule count before per-rule parallel passes
    /// (`generate_dispatch_tables`, `eliminate_epsilon`, etc.) use
    /// `rayon::par_iter_mut`. Below this threshold, the per-iteration
    /// `LockLatch::wait_and_reset` cost exceeds the work the closure
    /// does on each rule.
    pub parallelism_threshold: usize,
}

impl Default for CostConfig {
    fn default() -> Self {
        Self {
            // AW-IV.W5.3 — extraction cost weights come from the
            // grid-sweep-calibrated const. `CostWeights::default()`
            // remains the per-field-default surface (useful in unit
            // tests and when constructing from raw fields); every
            // production extraction consumer receives
            // `CALIBRATED_WEIGHTS` here.
            weights: CALIBRATED_WEIGHTS,
            egraph_iter_limit: 64,
            egraph_node_limit: 100_000,
            parallelism_threshold: 128,
        }
    }
}
