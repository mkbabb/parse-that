//! Regex HIR extraction cost model.
//!
//! Mirrors `bbnf_ir::egraph::GrammarCostModel` on the grammar tier:
//! embeds the shared `egraph::CostWeights` substrate (per-node
//! structural cost, alt-branch penalty, dispatch bonus) and layers
//! HIR-specific knobs on top. The shared weights stay in sync
//! across tiers — splitting them would let branch-factoring and
//! dispatch incentives drift between regex and grammar extraction.

use egraph::CostWeights;

/// Extraction cost model for the HIR e-graph. Used by
/// `crate::egraph::extract_canonical` to pick the cheapest
/// equivalent HIR form per e-class after saturation.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct RegexExtractionCost {
    /// Shared cost weights identical across tiers.
    pub weights: CostWeights,
    /// Cost per literal byte. Lower values reward literal runs
    /// (memcmp-friendly).
    pub literal_per_byte: f64,
    /// Cost per character class node. Higher values penalize
    /// many-branch char classes that would expand DFA state
    /// counts.
    pub class_cost: f64,
    /// Cost per repetition node.
    pub repeat_cost: f64,
    /// Bonus applied when a rewrite produces a merged / absorbed
    /// char class (i.e., `[a-c]|[d-f]` → `[a-f]`). Negative values
    /// reward the merged form.
    pub merged_bonus: f64,
}

impl Default for RegexExtractionCost {
    fn default() -> Self {
        Self {
            weights: CostWeights::default(),
            literal_per_byte: 0.25,
            class_cost: 1.5,
            repeat_cost: 1.0,
            merged_bonus: -1.0,
        }
    }
}
