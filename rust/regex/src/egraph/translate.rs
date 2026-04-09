//! `Hir` ↔ `HirENode` translation: insert an owning HIR tree into
//! an e-graph, and extract the cost-cheapest HIR tree back out.
//!
//! These translators are the only place where the owning type and
//! the e-node type touch. Every other consumer in the e-graph
//! pipeline (rewrite rules, CSP scheduling, analyses) works against
//! `HirENode` exclusively; every consumer outside the e-graph
//! pipeline (the parser, NFA/DFA compiler, classifier) works
//! against `Hir` exclusively.

use egraph::{Analysis, CostModel, EGraph, Extractor, Id};

use crate::hir::{Hir, Repetition};

use super::node::HirENode;

/// Recursively insert an owning `Hir` tree into an e-graph and
/// return the root class Id.
pub fn insert_hir<A>(egraph: &mut EGraph<HirENode, A>, hir: &Hir) -> Id
where
    A: Analysis<HirENode>,
{
    let enode = match hir {
        Hir::Empty => HirENode::Empty,
        Hir::Literal(bytes) => HirENode::Literal(bytes.clone().into_boxed_slice()),
        Hir::Class(class) => HirENode::Class(class.clone()),
        Hir::Look(look) => HirENode::Look(*look),
        Hir::Repetition(Repetition {
            sub,
            min,
            max,
            greedy,
        }) => {
            let sub_id = insert_hir(egraph, sub);
            HirENode::Repetition {
                sub: sub_id,
                min: *min,
                max: *max,
                greedy: *greedy,
            }
        }
        Hir::Group(sub) => {
            let sub_id = insert_hir(egraph, sub);
            HirENode::Group(sub_id)
        }
        Hir::Concat(children) => {
            let ids: Box<[Id]> = children.iter().map(|c| insert_hir(egraph, c)).collect();
            HirENode::Concat(ids)
        }
        Hir::Alternation(children) => {
            let ids: Box<[Id]> = children.iter().map(|c| insert_hir(egraph, c)).collect();
            HirENode::Alternation(ids)
        }
    };
    egraph.add(enode)
}

/// Extract the cost-cheapest `Hir` tree rooted at `root` from a
/// saturated e-graph.
pub fn extract_hir<A, C>(egraph: &EGraph<HirENode, A>, root: Id, cost: &C) -> Hir
where
    A: Analysis<HirENode>,
    C: CostModel<HirENode, Cost = f64>,
{
    let extractor = Extractor::new(egraph, cost);
    rebuild(egraph, &extractor, egraph.find_ref(root))
}

fn rebuild<A, C>(
    egraph: &EGraph<HirENode, A>,
    extractor: &Extractor<'_, HirENode, A, C>,
    class: Id,
) -> Hir
where
    A: Analysis<HirENode>,
    C: CostModel<HirENode, Cost = f64>,
{
    let best = extractor
        .best_node(class)
        .cloned()
        .expect("extractor returned no best node for a reachable class");
    materialize(egraph, extractor, best)
}

fn materialize<A, C>(
    egraph: &EGraph<HirENode, A>,
    extractor: &Extractor<'_, HirENode, A, C>,
    enode: HirENode,
) -> Hir
where
    A: Analysis<HirENode>,
    C: CostModel<HirENode, Cost = f64>,
{
    match enode {
        HirENode::Empty => Hir::Empty,
        HirENode::Literal(bytes) => Hir::Literal(bytes.into_vec()),
        HirENode::Class(class) => Hir::Class(class),
        HirENode::Look(look) => Hir::Look(look),
        HirENode::Repetition {
            sub,
            min,
            max,
            greedy,
        } => {
            let sub_hir = rebuild(egraph, extractor, sub);
            Hir::Repetition(Repetition {
                sub: Box::new(sub_hir),
                min,
                max,
                greedy,
            })
        }
        HirENode::Group(sub) => {
            let sub_hir = rebuild(egraph, extractor, sub);
            Hir::Group(Box::new(sub_hir))
        }
        HirENode::Concat(children) => {
            let parts: Vec<Hir> = children
                .iter()
                .map(|&id| rebuild(egraph, extractor, id))
                .collect();
            Hir::Concat(parts)
        }
        HirENode::Alternation(children) => {
            let parts: Vec<Hir> = children
                .iter()
                .map(|&id| rebuild(egraph, extractor, id))
                .collect();
            Hir::Alternation(parts)
        }
    }
}
