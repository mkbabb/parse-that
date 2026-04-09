//! Flatten nested `Alt` / `Concat` nodes: `Alt([Alt([a,b]), c]) → Alt([a,b,c])`
//! and `Concat(Concat(a,b),c) → Concat(a,b,c)`.
//!
//! The HIR parser already produces flat alternations for most
//! surface syntax, but rewrites from other rules (fusion,
//! lifting, prefix factoring) can re-nest alternations and
//! concatenations. Every downstream rule benefits from seeing
//! the flattened form, so this runs first.
//!
//! Non-destructive: adds the flattened form as a new e-node in
//! the same e-class; cost-guided extraction picks the cheapest.

use egraph::{Analysis, EGraph, Id, Rewrite};

use crate::egraph::node::HirENode;

/// Flatten nested `Alternation` / `Concat` e-nodes one level at a
/// time. Fires repeatedly until no nested children remain.
pub struct FlattenAltConcat;

#[derive(Clone, Debug)]
pub enum FlattenMatch {
    /// A flat alternation whose children include at least one
    /// child e-class that also contains an `Alternation` node.
    Alt(Box<[Id]>),
    /// A flat concatenation whose children include at least one
    /// child e-class that also contains a `Concat` node.
    Concat(Box<[Id]>),
}

impl<A: Analysis<HirENode>> Rewrite<HirENode, A> for FlattenAltConcat {
    type Match = FlattenMatch;

    fn name(&self) -> &str {
        "hir-flatten-alt-concat"
    }

    fn search(&self, egraph: &EGraph<HirENode, A>) -> Vec<(Id, Self::Match)> {
        let mut matches = Vec::new();
        for class in egraph.classes() {
            for node in class.iter() {
                match node {
                    HirENode::Alternation(children) => {
                        let mut flat: Vec<Id> = Vec::with_capacity(children.len());
                        let mut nested = false;
                        for &id in children.iter() {
                            let canon = egraph.find_ref(id);
                            let child_class = egraph.class(canon);
                            let inner = child_class.iter().find_map(|n| {
                                if let HirENode::Alternation(inner) = n {
                                    Some(inner.clone())
                                } else {
                                    None
                                }
                            });
                            if let Some(inner) = inner {
                                nested = true;
                                flat.extend(inner.iter().copied());
                            } else {
                                flat.push(id);
                            }
                        }
                        if nested {
                            matches.push((
                                class.id,
                                FlattenMatch::Alt(flat.into_boxed_slice()),
                            ));
                            break;
                        }
                    }
                    HirENode::Concat(children) => {
                        let mut flat: Vec<Id> = Vec::with_capacity(children.len());
                        let mut nested = false;
                        for &id in children.iter() {
                            let canon = egraph.find_ref(id);
                            let child_class = egraph.class(canon);
                            let inner = child_class.iter().find_map(|n| {
                                if let HirENode::Concat(inner) = n {
                                    Some(inner.clone())
                                } else {
                                    None
                                }
                            });
                            if let Some(inner) = inner {
                                nested = true;
                                flat.extend(inner.iter().copied());
                            } else {
                                flat.push(id);
                            }
                        }
                        if nested {
                            matches.push((
                                class.id,
                                FlattenMatch::Concat(flat.into_boxed_slice()),
                            ));
                            break;
                        }
                    }
                    _ => {}
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
        let new_id = match m {
            FlattenMatch::Alt(flat) => egraph.add(HirENode::Alternation(flat)),
            FlattenMatch::Concat(flat) => egraph.add(HirENode::Concat(flat)),
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

    fn search_matches(hir: Hir) -> usize {
        let mut egraph: EGraph<HirENode, NoAnalysis> = EGraph::new();
        let _root = insert_hir(&mut egraph, &hir);
        egraph.rebuild();
        let matches =
            <FlattenAltConcat as Rewrite<HirENode, NoAnalysis>>::search(&FlattenAltConcat, &egraph);
        matches.len()
    }

    #[test]
    fn flatten_nested_alternation_matches() {
        // Build `Alt([Alt([a, b]), c])` directly.
        let inner = Hir::Alternation(vec![mk_lit(b'a'), mk_lit(b'b')]);
        let hir = Hir::Alternation(vec![inner, mk_lit(b'c')]);
        assert!(
            search_matches(hir) > 0,
            "flatten rule must match on Alt([Alt([a,b]), c])"
        );
    }

    #[test]
    fn flatten_nested_concat_matches() {
        let inner = Hir::Concat(vec![mk_lit(b'a'), mk_lit(b'b')]);
        let hir = Hir::Concat(vec![inner, mk_lit(b'c')]);
        assert!(
            search_matches(hir) > 0,
            "flatten rule must match on Concat([Concat([a,b]), c])"
        );
    }

    #[test]
    fn flatten_flat_does_not_match() {
        let hir = Hir::Alternation(vec![mk_lit(b'a'), mk_lit(b'b'), mk_lit(b'c')]);
        assert_eq!(
            search_matches(hir),
            0,
            "flatten rule must not match on already-flat Alt"
        );
    }
}
