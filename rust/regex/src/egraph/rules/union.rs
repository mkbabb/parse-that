//! Charclass union merge: `Alt([[a-c], [d-f]]) → Alt([[a-f]])`.
//!
//! When two branches of an alternation are non-negated
//! `Class::Bytes` nodes whose byte sets can be combined into a
//! single merged class, the merged form is strictly cheaper (fewer
//! Alt branches, fewer DFA transitions) so extraction prefers it.
//! Delegates to the pure function [`crate::algebra::try_union`] —
//! the HIR e-graph rule is a thin lift.
//!
//! Mirrors the grammar-tier `UnionMergeAlt` rule.

use egraph::{Analysis, EGraph, Id, Rewrite};

use crate::algebra::try_union;
use crate::egraph::node::HirENode;
use crate::egraph::rules::util::{byteset_to_char_class, char_class_byteset, class_payload};

/// Merge two non-negated `Class::Bytes` branches of an
/// alternation into a single union class.
pub struct UnionMergeClass;

#[derive(Clone, Debug)]
pub struct UnionMatch {
    /// The merged `CharClass` to install as a new e-class.
    pub merged_class: crate::hir::CharClass,
    /// Index of the first merged branch in the original Alt —
    /// replaced with the merged class.
    pub left_idx: usize,
    /// Index of the second merged branch — dropped.
    pub right_idx: usize,
    /// The original Alt's children, used to rebuild the rewritten
    /// Alt with the merged branch.
    pub original_children: Box<[Id]>,
}

impl<A: Analysis<HirENode>> Rewrite<HirENode, A> for UnionMergeClass {
    type Match = UnionMatch;

    fn name(&self) -> &str {
        "hir-union-merge-class"
    }

    fn search(&self, egraph: &EGraph<HirENode, A>) -> Vec<(Id, Self::Match)> {
        let mut matches = Vec::new();
        'outer: for class in egraph.classes() {
            for node in class.iter() {
                let HirENode::Alternation(children) = node else {
                    continue;
                };
                for i in 0..children.len() {
                    let Some(class_i) = class_payload(egraph, children[i]) else {
                        continue;
                    };
                    let Some(bs_i) = char_class_byteset(&class_i) else {
                        continue;
                    };
                    for j in (i + 1)..children.len() {
                        let Some(class_j) = class_payload(egraph, children[j]) else {
                            continue;
                        };
                        let Some(bs_j) = char_class_byteset(&class_j) else {
                            continue;
                        };
                        // Skip if one is already a superset of the
                        // other — the superset rule handles that
                        // case and fires first.
                        if bs_i == bs_j {
                            continue;
                        }
                        let merged = try_union(&bs_i, &bs_j);
                        if merged == bs_i || merged == bs_j {
                            continue;
                        }
                        let merged_class = byteset_to_char_class(&merged);
                        matches.push((
                            class.id,
                            UnionMatch {
                                merged_class,
                                left_idx: i,
                                right_idx: j,
                                original_children: children.clone(),
                            },
                        ));
                        continue 'outer;
                    }
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
    ) -> bool {
        let merged_id = egraph.add(HirENode::Class(m.merged_class));
        let mut new_children: Vec<Id> = Vec::with_capacity(m.original_children.len() - 1);
        for (k, &id) in m.original_children.iter().enumerate() {
            if k == m.right_idx {
                continue;
            }
            new_children.push(if k == m.left_idx { merged_id } else { id });
        }
        let new_id = if new_children.len() == 1 {
            new_children[0]
        } else {
            egraph.add(HirENode::Alternation(new_children.into_boxed_slice()))
        };
        let before = egraph.find(class_id);
        egraph.union(class_id, new_id);
        egraph.find(class_id) != before
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use egraph::NoAnalysis;

    use crate::egraph::translate::insert_hir;
    use crate::hir::{ByteRange, CharClass, Hir};

    fn mk_class(ranges: &[(u8, u8)]) -> Hir {
        Hir::Class(CharClass::Bytes {
            ranges: ranges.iter().map(|&(s, e)| ByteRange::new(s, e)).collect(),
            negated: false,
        })
    }

    fn search_matches(hir: Hir) -> Vec<UnionMatch> {
        let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
        let _root = insert_hir(&mut egraph, &hir);
        egraph.rebuild();
        <UnionMergeClass as Rewrite<HirENode, NoAnalysis>>::search(&UnionMergeClass, &egraph)
            .into_iter()
            .map(|(_, m)| m)
            .collect()
    }

    #[test]
    fn union_merges_adjacent_classes() {
        // [a-c] | [d-f]  →  [a-f]
        let hir = Hir::Alternation(vec![mk_class(&[(b'a', b'c')]), mk_class(&[(b'd', b'f')])]);
        let ms = search_matches(hir);
        assert!(!ms.is_empty(), "union rule must match [a-c]|[d-f]");
    }

    #[test]
    fn union_does_not_match_on_equal_classes() {
        // [a-c] | [a-c]  — dedup's territory, not union's
        let hir = Hir::Alternation(vec![mk_class(&[(b'a', b'c')]), mk_class(&[(b'a', b'c')])]);
        let ms = search_matches(hir);
        assert!(ms.is_empty(), "union rule must not match equal classes");
    }
}
