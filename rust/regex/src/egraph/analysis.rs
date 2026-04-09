//! Per-class lattice analysis for the HIR e-graph.
//!
//! Mirrors `bbnf_ir::egraph::GrammarAnalysis` shape: tracks light
//! structural facts needed by rewrite rules and the cost model.
//!
//! - `min_size`: minimum node count among all representatives of
//!   the class (feeds `RegexExtractionCost`'s structural weight).
//! - `nullable`: whether the class contains a representative that
//!   matches the empty string. Propagated monotonically through
//!   `merge` as rewrites add new forms.
//!
//! Match-width bounds and literal-prefix analysis stay in
//! `crate::info::RegexInfo` where they already live as whole-HIR
//! walks — the e-graph analysis is minimal and keeps saturation
//! cheap.

use egraph::{Analysis, EGraph, Id};

use crate::egraph::node::HirENode;

/// Per-e-class data: monotone lattice values refined during
/// saturation.
#[derive(Clone, Debug, Default)]
pub struct HirClassData {
    /// Minimum HIR node count among all representatives of this
    /// class.
    pub min_size: u32,
    /// Whether the class contains a node that matches the empty
    /// string. `None` = unknown (no representative has been
    /// classified yet).
    pub nullable: Option<bool>,
}

/// HIR analysis — implements `egraph::Analysis<HirENode>`.
///
/// Identical structural shape to `bbnf_ir::egraph::GrammarAnalysis`:
/// same two lattice fields (`min_size`, `nullable`), same merge
/// semantics, same `make` shape (recurse through child classes).
/// The isomorphism is load-bearing — rewrite rules and the cost
/// model read the same facts from the same fields in both tiers.
#[derive(Clone, Copy, Debug, Default)]
pub struct HirAnalysis;

impl Analysis<HirENode> for HirAnalysis {
    type Data = HirClassData;

    fn make(egraph: &EGraph<HirENode, Self>, node: &HirENode) -> Self::Data {
        let child_size = |id: Id| egraph.class(id).data.min_size as usize;
        let child_nullable = |id: Id| egraph.class(id).data.nullable;
        let size_of = |children: &[Id]| children.iter().map(|&id| child_size(id)).sum::<usize>();

        let min_size = match node {
            HirENode::Empty | HirENode::Literal(_) | HirENode::Class(_) | HirENode::Look(_) => 1,
            HirENode::Group(inner) => 1 + child_size(*inner),
            HirENode::Repetition { sub, .. } => 1 + child_size(*sub),
            HirENode::Concat(children) | HirENode::Alternation(children) => 1 + size_of(children),
        };

        // Nullability: Empty / Look always nullable; Literal /
        // Class never; Repetition nullable iff min==0 or the
        // sub-expression is nullable; Concat nullable iff all
        // children are; Alternation nullable iff any child is.
        let nullable = match node {
            HirENode::Empty | HirENode::Look(_) => Some(true),
            HirENode::Literal(_) | HirENode::Class(_) => Some(false),
            HirENode::Group(inner) => child_nullable(*inner),
            HirENode::Repetition { sub, min, .. } => {
                if *min == 0 {
                    Some(true)
                } else {
                    child_nullable(*sub)
                }
            }
            HirENode::Concat(children) => {
                let mut acc = Some(true);
                for &id in children.iter() {
                    match child_nullable(id) {
                        Some(true) => continue,
                        Some(false) => {
                            acc = Some(false);
                            break;
                        }
                        None => acc = None,
                    }
                }
                acc
            }
            HirENode::Alternation(children) => {
                let mut acc = Some(false);
                for &id in children.iter() {
                    match child_nullable(id) {
                        Some(true) => {
                            acc = Some(true);
                            break;
                        }
                        Some(false) => continue,
                        None => acc = None,
                    }
                }
                acc
            }
        };

        HirClassData {
            min_size: u32::try_from(min_size.min(u32::MAX as usize)).unwrap_or(u32::MAX),
            nullable,
        }
    }

    fn merge(a: &mut Self::Data, b: Self::Data) -> bool {
        let mut changed = false;
        if b.min_size < a.min_size {
            a.min_size = b.min_size;
            changed = true;
        }
        if a.nullable != b.nullable {
            a.nullable = match (a.nullable, b.nullable) {
                (Some(x), Some(y)) if x == y => Some(x),
                (Some(_), Some(_)) => None, // conflicting — treat as unknown
                (Some(x), None) => Some(x),
                (None, Some(y)) => {
                    changed = true;
                    Some(y)
                }
                (None, None) => None,
            };
        }
        changed
    }
}
