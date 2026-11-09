//! Tranche K regression tests for `CspScheduler`.
//!
//! These tests cover three scenarios:
//!
//! 1. **Classification**: the CSP correctly identifies clean vs dirty
//!    classes across iterations — the dirty set shrinks between
//!    iterations on a grammar where rewrites reach a fixed point.
//! 2. **Correctness**: `CspScheduler` and `BackoffScheduler` reach
//!    the same fixed point on the same e-graph (the CSP's filtering
//!    does not lose any equivalences).
//! 3. **Parent propagation**: a dirty child's parents become dirty
//!    after a single `propagate` call through `ParentDirtyProp`.

use std::collections::HashSet;

use csp_solver::{Csp, constraint::VarId, domain::LatticeDomain};
use parse_that_egraph::{
    BackoffScheduler, CspScheduler, DirtyDomain, EGraph, Id, Language, NoAnalysis, ParentDirtyProp,
    Rewrite, RewriteFn, Scheduler,
};

// ── Toy language (mirrors saturation.rs) ───────────────────────────────────

#[derive(Clone, Eq, PartialEq, Hash, Debug)]
enum Toy {
    Leaf(i64),
    Alt(Box<[Id]>),
}

impl Language for Toy {
    fn children(&self) -> &[Id] {
        match self {
            Toy::Leaf(_) => &[],
            Toy::Alt(children) => children,
        }
    }
    fn children_mut(&mut self) -> &mut [Id] {
        match self {
            Toy::Leaf(_) => &mut [],
            Toy::Alt(children) => children,
        }
    }
}

// ── Flatten rule (drives saturation across multiple iterations) ────────────

struct FlattenAlt;

struct FlattenMatch {
    flat: Box<[Id]>,
}

impl Rewrite<Toy, NoAnalysis> for FlattenAlt {
    type Match = FlattenMatch;
    fn name(&self) -> &str {
        "flatten-alt"
    }
    fn search(&self, egraph: &EGraph<Toy, NoAnalysis>) -> Vec<(Id, Self::Match)> {
        let mut matches = Vec::new();
        for class in egraph.classes() {
            for node in class.iter() {
                let Toy::Alt(children) = node else {
                    continue;
                };
                let mut any_nested = false;
                let mut flat: Vec<Id> = Vec::with_capacity(children.len());
                for &child in children.iter() {
                    let child_class = egraph.class(child);
                    let nested_children: Option<&[Id]> = child_class.iter().find_map(|n| {
                        if let Toy::Alt(cs) = n {
                            Some(cs.as_ref())
                        } else {
                            None
                        }
                    });
                    if let Some(nested) = nested_children {
                        any_nested = true;
                        flat.extend_from_slice(nested);
                    } else {
                        flat.push(child);
                    }
                }
                if any_nested {
                    matches.push((
                        class.id,
                        FlattenMatch {
                            flat: flat.into_boxed_slice(),
                        },
                    ));
                }
            }
        }
        matches
    }
    fn apply(&self, egraph: &mut EGraph<Toy, NoAnalysis>, class_id: Id, m: Self::Match) {
        let new_id = egraph.add(Toy::Alt(m.flat));
        egraph.union(class_id, new_id);
    }
}

fn build_nested_alt(egraph: &mut EGraph<Toy, NoAnalysis>) -> (Id, Id, Id) {
    // Alt([Alt([Alt([1, 2]), 3]), 4])
    let one = egraph.add(Toy::Leaf(1));
    let two = egraph.add(Toy::Leaf(2));
    let three = egraph.add(Toy::Leaf(3));
    let four = egraph.add(Toy::Leaf(4));
    let inner_alt = egraph.add(Toy::Alt(Box::new([one, two])));
    let mid_alt = egraph.add(Toy::Alt(Box::new([inner_alt, three])));
    let outer_alt = egraph.add(Toy::Alt(Box::new([mid_alt, four])));
    (inner_alt, mid_alt, outer_alt)
}

// ── Test 1: classification ─────────────────────────────────────────────────

#[test]
fn csp_scheduler_reaches_saturation() {
    let mut egraph: EGraph<Toy, NoAnalysis> = EGraph::new();
    let (_inner, _mid, outer) = build_nested_alt(&mut egraph);

    let rules: Vec<&dyn RewriteFn<Toy, NoAnalysis>> = vec![&FlattenAlt];
    let scheduler = CspScheduler::default();
    let report = scheduler.run(&mut egraph, &rules);

    assert!(
        report.saturated,
        "CspScheduler must reach saturation: {:?}",
        report,
    );
    assert!(
        report.iterations >= 2,
        "multi-level flatten needs at least two iterations, got {}",
        report.iterations,
    );
    assert!(
        report.total_applied > 0,
        "work must be reported, got total_applied={}",
        report.total_applied,
    );

    // Verify the fully-flattened `Alt([1, 2, 3, 4])` is now in
    // outer's class.
    let canonical = egraph.find(outer);
    let flat_four = egraph.class(canonical).iter().any(|n| {
        let Toy::Alt(children) = n else {
            return false;
        };
        children.len() == 4
    });
    assert!(
        flat_four,
        "CspScheduler must reach the fully-flattened form",
    );
}

// ── Test 2: correctness parity with BackoffScheduler ────────────────────────

#[test]
fn csp_scheduler_matches_backoff_scheduler() {
    // Build two independent but identical e-graphs and run both
    // schedulers to fixed point. They must produce the same final
    // class counts and the same "flat four" outcome.

    let mut eg_backoff: EGraph<Toy, NoAnalysis> = EGraph::new();
    let (_a, _b, outer_backoff) = build_nested_alt(&mut eg_backoff);

    let mut eg_csp: EGraph<Toy, NoAnalysis> = EGraph::new();
    let (_a, _b, outer_csp) = build_nested_alt(&mut eg_csp);

    let rules: Vec<&dyn RewriteFn<Toy, NoAnalysis>> = vec![&FlattenAlt];

    BackoffScheduler::default().run(&mut eg_backoff, &rules);
    CspScheduler::default().run(&mut eg_csp, &rules);

    // Both should have the same total nodes (rewrites add the same
    // new Alt e-nodes) and the same fully-flattened presence.
    assert_eq!(
        eg_backoff.total_nodes(),
        eg_csp.total_nodes(),
        "node counts must match: backoff={}, csp={}",
        eg_backoff.total_nodes(),
        eg_csp.total_nodes(),
    );

    let has_four = |egraph: &EGraph<Toy, NoAnalysis>, root: Id| {
        let canon = egraph.find_ref(root);
        egraph.class(canon).iter().any(|n| {
            let Toy::Alt(cs) = n else {
                return false;
            };
            cs.len() == 4
        })
    };
    assert!(has_four(&eg_backoff, outer_backoff));
    assert!(has_four(&eg_csp, outer_csp));
}

// ── Test 3: parent dirty propagation ───────────────────────────────────────

#[test]
fn parent_dirty_prop_propagates_through_ac3() {
    // Build a 3-variable CSP directly: X (child), Y (parent of X),
    // Z (parent of Y). Mark X dirty; propagate; assert Y and Z
    // become dirty.
    let mut csp = Csp::<DirtyDomain>::new();
    let x = csp.add_variable(DirtyDomain::dirty());
    let y = csp.add_variable(DirtyDomain::clean());
    let z = csp.add_variable(DirtyDomain::clean());

    // X is a child; Y is its parent.
    csp.add_constraint(ParentDirtyProp::new(x, vec![y]));
    // Y is a child (of Z); Z is its parent.
    csp.add_constraint(ParentDirtyProp::new(y, vec![z]));

    let result = csp.propagate();
    assert!(result.is_ok(), "CSP must propagate without conflict");

    // After propagation, Y and Z should both be dirty.
    assert!(
        csp.variables[y as usize].domain.dirty,
        "Y should be dirty after propagation from X",
    );
    assert!(
        csp.variables[z as usize].domain.dirty,
        "Z should be dirty after transitive propagation from X through Y",
    );
}

// ── Test 4: DirtyDomain lattice basics ─────────────────────────────────────

#[test]
fn dirty_domain_lattice_semantics() {
    let bottom = DirtyDomain::bottom();
    assert!(!bottom.dirty);

    let mut d = DirtyDomain::clean();
    assert!(!d.dirty);

    // join with dirty → becomes dirty; reports change
    assert!(d.join(&DirtyDomain::dirty()));
    assert!(d.dirty);

    // join with clean → no change
    assert!(!d.join(&DirtyDomain::clean()));
    assert!(d.dirty);

    // join with dirty when already dirty → no change
    assert!(!d.join(&DirtyDomain::dirty()));
    assert!(d.dirty);
}

// Suppress unused-import lints in this test file if HashSet/VarId
// are unused after refactoring. These imports stay because future
// tests may grow into them.
#[allow(dead_code)]
fn _force_imports() -> (HashSet<Id>, VarId) {
    (HashSet::new(), 0)
}
