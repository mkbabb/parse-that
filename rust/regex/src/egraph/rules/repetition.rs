//! Absorb adjacent repetitions over the same sub-expression:
//! `a+a* → a+`, `a*a* → a*`, `a?a* → a*`, `a{2,3}a{1,4} → a{3,7}`.
//!
//! When a `Concat` contains two adjacent `Repetition` children
//! whose `sub` e-classes are canonically equal (and whose greedy
//! flags agree), they can be merged by summing their count
//! bounds: `Rep(a, m1, M1) Rep(a, m2, M2)` → `Rep(a, m1 + m2, M1 + M2)`
//! where `None + _ = None` (unbounded stays unbounded).
//!
//! This is the classic case the user's plan highlights as a
//! genuine equality-saturation win: the RHS may have more nodes
//! than the LHS by count (or fewer, depending on the bounds), so
//! destructive application picks wrong. Only cost-guided
//! extraction via [`crate::egraph::cost::RegexExtractionCost`]
//! produces the right answer — and only the e-graph preserves
//! both the original and merged forms for extraction to choose
//! from.

use egraph::{Analysis, EGraph, Id, Rewrite};

use crate::egraph::node::HirENode;

/// Merge adjacent repetitions with the same sub e-class inside
/// a `Concat`.
pub struct AbsorbRepetition;

#[derive(Clone, Debug)]
pub struct AbsorbRepetitionMatch {
    /// Original Concat children, used to rebuild the rewritten
    /// Concat with the merged repetition installed in place of
    /// the two adjacent ones.
    pub original_children: Box<[Id]>,
    /// Index of the first of the two adjacent repetitions. The
    /// second sits at `merge_idx + 1`.
    pub merge_idx: usize,
    /// Sub-expression e-class shared by both repetitions (some
    /// representative — `apply` canonicalizes on insertion).
    pub merged_sub: Id,
    /// Merged lower bound.
    pub merged_min: u32,
    /// Merged upper bound (`None` = unbounded).
    pub merged_max: Option<u32>,
    /// Merged greedy flag.
    pub merged_greedy: bool,
}

/// Merge the count bounds of two repetitions over the same sub.
/// `None` (unbounded) + anything = `None`.
fn merge_bounds(
    (m1, max1): (u32, Option<u32>),
    (m2, max2): (u32, Option<u32>),
) -> (u32, Option<u32>) {
    let min = m1.saturating_add(m2);
    let max = match (max1, max2) {
        (None, _) | (_, None) => None,
        (Some(a), Some(b)) => Some(a.saturating_add(b)),
    };
    (min, max)
}

/// Extract the `Repetition` payload from an e-class if any of its
/// e-nodes is a `Repetition`.
fn class_repetition<A: Analysis<HirENode>>(
    egraph: &EGraph<HirENode, A>,
    id: Id,
) -> Option<(Id, u32, Option<u32>, bool)> {
    let canon = egraph.find_ref(id);
    egraph.class(canon).iter().find_map(|n| {
        if let HirENode::Repetition {
            sub,
            min,
            max,
            greedy,
        } = n
        {
            Some((egraph.find_ref(*sub), *min, *max, *greedy))
        } else {
            None
        }
    })
}

impl<A: Analysis<HirENode>> Rewrite<HirENode, A> for AbsorbRepetition {
    type Match = AbsorbRepetitionMatch;

    fn name(&self) -> &str {
        "hir-absorb-repetition"
    }

    fn search(&self, egraph: &EGraph<HirENode, A>) -> Vec<(Id, Self::Match)> {
        let mut matches = Vec::new();
        'outer: for class in egraph.classes() {
            for node in class.iter() {
                let HirENode::Concat(children) = node else {
                    continue;
                };
                if children.len() < 2 {
                    continue;
                }
                for i in 0..children.len() - 1 {
                    let left = class_repetition(egraph, children[i]);
                    let right = class_repetition(egraph, children[i + 1]);
                    let (
                        Some((sub_l, min_l, max_l, greedy_l)),
                        Some((sub_r, min_r, max_r, greedy_r)),
                    ) = (left, right)
                    else {
                        continue;
                    };
                    if sub_l != sub_r || greedy_l != greedy_r {
                        continue;
                    }
                    let (merged_min, merged_max) =
                        merge_bounds((min_l, max_l), (min_r, max_r));
                    matches.push((
                        class.id,
                        AbsorbRepetitionMatch {
                            original_children: children.clone(),
                            merge_idx: i,
                            merged_sub: sub_l,
                            merged_min,
                            merged_max,
                            merged_greedy: greedy_l,
                        },
                    ));
                    continue 'outer;
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
        let merged_id = egraph.add(HirENode::Repetition {
            sub: m.merged_sub,
            min: m.merged_min,
            max: m.merged_max,
            greedy: m.merged_greedy,
        });
        let mut new_children: Vec<Id> =
            Vec::with_capacity(m.original_children.len() - 1);
        for (k, &id) in m.original_children.iter().enumerate() {
            if k == m.merge_idx {
                new_children.push(merged_id);
            } else if k == m.merge_idx + 1 {
                continue;
            } else {
                new_children.push(id);
            }
        }
        let new_id = if new_children.len() == 1 {
            new_children[0]
        } else {
            egraph.add(HirENode::Concat(new_children.into_boxed_slice()))
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
    use crate::hir::{Hir, Repetition};

    fn rep(inner: Hir, min: u32, max: Option<u32>) -> Hir {
        Hir::Repetition(Repetition {
            sub: Box::new(inner),
            min,
            max,
            greedy: true,
        })
    }

    fn search_matches(hir: Hir) -> Vec<AbsorbRepetitionMatch> {
        let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
        let _root = insert_hir(&mut egraph, &hir);
        egraph.rebuild();
        <AbsorbRepetition as Rewrite<HirENode, NoAnalysis>>::search(&AbsorbRepetition, &egraph)
            .into_iter()
            .map(|(_, m)| m)
            .collect()
    }

    #[test]
    fn merge_plus_star_to_plus() {
        // a+ a*  →  Rep(a, 1, None)   (min=1+0=1, max=None)
        let a = Hir::Literal(vec![b'a']);
        let hir = Hir::Concat(vec![rep(a.clone(), 1, None), rep(a, 0, None)]);
        let ms = search_matches(hir);
        assert!(!ms.is_empty(), "absorb rule must match on a+a*");
        let m = &ms[0];
        assert_eq!(m.merged_min, 1);
        assert_eq!(m.merged_max, None);
    }

    #[test]
    fn merge_different_subs_does_not_match() {
        let a = Hir::Literal(vec![b'a']);
        let b = Hir::Literal(vec![b'b']);
        let hir = Hir::Concat(vec![rep(a, 1, None), rep(b, 0, None)]);
        let ms = search_matches(hir);
        assert!(ms.is_empty(), "absorb rule must not match on a+b*");
    }

    #[test]
    fn merge_bounds_arithmetic() {
        // a{2,3} a{1,4}  →  Rep(a, 3, Some(7))
        assert_eq!(merge_bounds((2, Some(3)), (1, Some(4))), (3, Some(7)));
        // a+ a*  →  Rep(a, 1, None)
        assert_eq!(merge_bounds((1, None), (0, None)), (1, None));
        // a? a*  →  Rep(a, 0, None)
        assert_eq!(merge_bounds((0, Some(1)), (0, None)), (0, None));
        // a* a*  →  Rep(a, 0, None)
        assert_eq!(merge_bounds((0, None), (0, None)), (0, None));
    }
}
