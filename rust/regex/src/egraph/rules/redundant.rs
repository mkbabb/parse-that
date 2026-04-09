//! Deduplicate alternation branches by e-class canonical identity:
//! `Alt([.., R, .., R, ..]) → Alt([.., R, ..])`.
//!
//! Two branches that share the same canonical e-class are
//! structurally identical — the e-graph has already merged them
//! via hash-cons + union — so keeping both in the branch list is
//! redundant. Mirrors the grammar-tier `DeduplicateAltBranches`
//! rule.

use std::collections::HashSet;

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
                let mut seen: HashSet<Id> = HashSet::new();
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

    fn apply(
        &self,
        egraph: &mut EGraph<HirENode, A>,
        class_id: Id,
        m: Self::Match,
    ) {
        let new_id = if m.deduped.len() == 1 {
            m.deduped[0]
        } else {
            egraph.add(HirENode::Alternation(m.deduped))
        };
        egraph.union(class_id, new_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use egraph::NoAnalysis;

    use crate::egraph::translate::insert_hir;
    use crate::hir::Hir;

    fn mk_lit(b: u8) -> Hir {
        Hir::Literal(vec![b])
    }

    #[test]
    fn dedup_identical_literal_branches() {
        let hir = Hir::Alternation(vec![mk_lit(b'a'), mk_lit(b'b'), mk_lit(b'a')]);
        let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
        let _root = insert_hir(&mut egraph, &hir);
        egraph.rebuild();
        let matches = <DeduplicateAlternation as Rewrite<HirENode, NoAnalysis>>::search(
            &DeduplicateAlternation,
            &egraph,
        );
        assert!(!matches.is_empty(), "dedup rule must match on [a, b, a]");
        let (_, m) = &matches[0];
        assert_eq!(m.deduped.len(), 2, "deduped list should have 2 survivors");
    }

    #[test]
    fn dedup_no_duplicates() {
        let hir = Hir::Alternation(vec![mk_lit(b'a'), mk_lit(b'b'), mk_lit(b'c')]);
        let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
        let _root = insert_hir(&mut egraph, &hir);
        egraph.rebuild();
        let matches = <DeduplicateAlternation as Rewrite<HirENode, NoAnalysis>>::search(
            &DeduplicateAlternation,
            &egraph,
        );
        assert!(matches.is_empty(), "dedup rule must not match on [a, b, c]");
    }
}
