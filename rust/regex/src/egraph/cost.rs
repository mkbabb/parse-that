//! Regex HIR extraction cost model.
//!
//! Mirrors `bbnf_ir::egraph::GrammarCostModel` on the grammar tier:
//! embeds the shared `egraph::CostWeights` substrate (per-node
//! structural cost, alt-branch penalty, dispatch bonus) and layers
//! HIR-specific knobs on top. The shared weights stay in sync
//! across tiers — splitting them would let branch-factoring and
//! dispatch incentives drift between regex and grammar extraction.

use egraph::{CostConfig, CostModel, CostWeights, Id};

use crate::egraph::node::HirENode;

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

impl RegexExtractionCost {
    /// Build a `RegexExtractionCost` from a shared
    /// [`egraph::CostConfig`].
    ///
    /// Only the cross-tier `weights` substrate flows through the
    /// shared config; HIR-specific knobs (literal-per-byte, class
    /// cost, repeat cost, merged bonus) keep their `Default` values
    /// because the egraph crate is deliberately domain-agnostic and
    /// shouldn't carry HIR-specific tunables. Consumers that need
    /// to override the HIR knobs (e.g. the bbnf-lang grammar
    /// pipeline reading its `CostConfig.hir_*` fields) call this
    /// constructor and then set the individual fields.
    pub fn from_egraph_config(cfg: &CostConfig) -> Self {
        Self {
            weights: cfg.weights,
            ..Self::default()
        }
    }
}

/// Per-variant cost summation. Each variant pays the shared
/// structural weight (from `CostWeights`) plus its domain-specific
/// knob, plus the sum of its children's costs (via the
/// `child_cost` closure). Alternations additionally pay
/// `alt_per_branch` per child to encourage factoring.
///
/// Mirrors `bbnf_ir::egraph::GrammarCostModel::cost`: same
/// structural weight plumbing, same alt-branch penalty. Diverges
/// only on the leaf multipliers — literal byte count and
/// char-class cardinality for the HIR tier, versus
/// literal/regex/ref multipliers for the grammar tier.
impl CostModel<HirENode> for RegexExtractionCost {
    type Cost = f64;

    fn cost(&self, node: &HirENode, child_cost: impl Fn(Id) -> f64) -> f64 {
        let w = &self.weights;
        match node {
            HirENode::Empty => w.structural,
            HirENode::Literal(bytes) => {
                w.structural + self.literal_per_byte * bytes.len() as f64
            }
            HirENode::Class(_) => w.structural + self.class_cost,
            HirENode::Look(_) => w.structural,
            HirENode::Repetition { sub, .. } => {
                w.structural + self.repeat_cost + child_cost(*sub)
            }
            HirENode::Group(inner) => w.structural + child_cost(*inner),
            HirENode::Concat(children) => {
                w.structural + children.iter().map(|&id| child_cost(id)).sum::<f64>()
            }
            HirENode::Alternation(children) => {
                let branch_penalty = w.alt_per_branch * children.len() as f64;
                w.structural
                    + branch_penalty
                    + children.iter().map(|&id| child_cost(id)).sum::<f64>()
            }
        }
    }
}
