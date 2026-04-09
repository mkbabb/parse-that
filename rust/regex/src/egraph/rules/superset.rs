//! Subset absorption across sibling `Class` branches of an
//! `Alternation`: `Alt([[a-z], [a-c]]) → Alt([[a-z]])`.
//!
//! When one branch's byte set is a strict superset of another's,
//! the subsumed branch is redundant and can be dropped. Delegates
//! to the pure function [`crate::algebra::is_superset`] — the
//! HIR e-graph rule is a thin lift that projects each child
//! `Class` e-node into a `ByteSet`, runs the comparison, and
//! installs the filtered form as a new e-node in the same class.
//!
//! Mirrors the grammar-tier `SupersetAbsorbAlt` rule.

use egraph::{Analysis, EGraph, Id, Rewrite};

use crate::algebra::is_superset;
use crate::egraph::node::HirENode;
use crate::egraph::rules::util::{char_class_byteset, class_payload};

/// Drop branches whose byte set is a strict subset of another
/// branch's byte set inside the same alternation.
pub struct SupersetAbsorbClass;

#[derive(Clone, Debug)]
pub struct AbsorbMatch {
    pub survivors: Box<[Id]>,
}

impl<A: Analysis<HirENode>> Rewrite<HirENode, A> for SupersetAbsorbClass {
    type Match = AbsorbMatch;

    fn name(&self) -> &str {
        "hir-superset-absorb-class"
    }

    fn search(&self, egraph: &EGraph<HirENode, A>) -> Vec<(Id, Self::Match)> {
        let mut matches = Vec::new();
        for class in egraph.classes() {
            for node in class.iter() {
                let HirENode::Alternation(children) = node else {
                    continue;
                };
                // Project every branch to its ByteSet (if it's a
                // non-negated Bytes class). Non-class branches stay
                // `None` and are never subsumed.
                let bytesets: Vec<Option<crate::sets::byteset::ByteSet>> = children
                    .iter()
                    .map(|&id| class_payload(egraph, id).and_then(|c| char_class_byteset(&c)))
                    .collect();

                let mut keep = vec![true; children.len()];
                for i in 0..children.len() {
                    let Some(bs_i) = &bytesets[i] else { continue };
                    for j in 0..children.len() {
                        if i == j || !keep[j] {
                            continue;
                        }
                        let Some(bs_j) = &bytesets[j] else { continue };
                        if bs_i != bs_j && is_superset(bs_i, bs_j) {
                            keep[j] = false;
                        }
                    }
                }
                let survivors: Vec<Id> = children
                    .iter()
                    .zip(&keep)
                    .filter_map(|(id, k)| if *k { Some(*id) } else { None })
                    .collect();
                if survivors.len() < children.len() {
                    matches.push((
                        class.id,
                        AbsorbMatch {
                            survivors: survivors.into_boxed_slice(),
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
    ) -> bool {
        let new_id = if m.survivors.len() == 1 {
            m.survivors[0]
        } else {
            egraph.add(HirENode::Alternation(m.survivors))
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

    fn search_matches(hir: Hir) -> Vec<AbsorbMatch> {
        let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
        let _root = insert_hir(&mut egraph, &hir);
        egraph.rebuild();
        <SupersetAbsorbClass as Rewrite<HirENode, NoAnalysis>>::search(
            &SupersetAbsorbClass,
            &egraph,
        )
        .into_iter()
        .map(|(_, m)| m)
        .collect()
    }

    #[test]
    fn superset_absorbs_subset() {
        // [a-z] | [a-c]  →  [a-z]
        let hir = Hir::Alternation(vec![mk_class(&[(b'a', b'z')]), mk_class(&[(b'a', b'c')])]);
        let ms = search_matches(hir);
        assert!(!ms.is_empty(), "superset rule must match [a-z]|[a-c]");
        assert_eq!(ms[0].survivors.len(), 1, "subsumed branch dropped");
    }

    #[test]
    fn disjoint_classes_not_absorbed() {
        let hir = Hir::Alternation(vec![mk_class(&[(b'a', b'c')]), mk_class(&[(b'd', b'f')])]);
        let ms = search_matches(hir);
        assert!(ms.is_empty(), "superset rule must not match disjoint classes");
    }
}
