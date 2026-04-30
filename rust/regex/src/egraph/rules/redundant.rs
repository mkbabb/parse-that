//! Deduplicate alternation branches by e-class canonical identity:
//! `Alt([.., R, .., R, ..]) → Alt([.., R, ..])`.
//!
//! Two branches that share the same canonical e-class are
//! structurally identical — the e-graph has already merged them
//! via hash-cons + union — so keeping both in the branch list is
//! redundant. Mirrors the grammar-tier `DeduplicateAltBranches`
//! rule.

use rustc_hash::FxHashSet;

use egraph::{Analysis, EGraph, Id, Rewrite};

use crate::egraph::node::HirENode;

/// Collapse repeated branches in an `Alternation` e-node.
pub struct DeduplicateAlternation;

#[derive(Clone, Debug)]
pub struct DedupMatch {
    pub deduped: Box<[Id]>,
}

impl<A: Analysis<HirENode>> Rewrite<HirENode, A> for DeduplicateAlternation {
    type Match = DedupMatch;

    fn name(&self) -> &str {
        "hir-deduplicate-alternation"
    }

    fn search(&self, egraph: &EGraph<HirENode, A>) -> Vec<(Id, Self::Match)> {
        let mut matches = Vec::new();
        for class in egraph.classes() {
            for node in class.iter() {
                let HirENode::Alternation(children) = node else {
                    continue;
                };
                let mut seen: FxHashSet<Id> = FxHashSet::default();
                let mut deduped: Vec<Id> = Vec::with_capacity(children.len());
                for &id in children.iter() {
                    let canon = egraph.find_ref(id);
                    if seen.insert(canon) {
                        deduped.push(id);
                    }
                }
                if deduped.len() < children.len() {
                    matches.push((
                        class.id,
                        DedupMatch {
                            deduped: deduped.into_boxed_slice(),
                        },
                    ));
                    break;
                }
            }
        }
        matches
    }

    fn apply(&self, egraph: &mut EGraph<HirENode, A>, class_id: Id, m: Self::Match) {
        let new_id = if m.deduped.len() == 1 {
            m.deduped[0]
        } else {
            egraph.add(HirENode::Alternation(m.deduped))
        };
        egraph.union(class_id, new_id);
    }
}
