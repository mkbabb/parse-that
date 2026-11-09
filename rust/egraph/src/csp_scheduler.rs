//! CSP-backed rewrite scheduler.
//!
//! Drives equality saturation by modelling the "which e-classes need
//! re-probing this iteration?" question as a constraint satisfaction
//! problem. Each e-class becomes a CSP variable carrying a monotone
//! `DirtyDomain` lattice; each parent edge in the e-graph becomes a
//! `ParentDirtyProp` constraint ("if a child class is dirty, its
//! parents are dirty too"). A single `csp.propagate()` call computes
//! the transitive dirty closure through all parent edges, then
//! `run_on_dirty` re-probes rules only on classes the closure marked
//! dirty.
//!
//! Compared to `BackoffScheduler`:
//! - **Iteration 1** is identical — every class starts dirty so every
//!   rule is probed everywhere.
//! - **Subsequent iterations** skip the clean-class majority. On a
//!   rule-rich grammar the dirty frontier is typically a small
//!   subtree of the e-graph (the classes that just gained e-nodes,
//!   plus their transitive parents).
//!
//! Isomorphic to how a grammar compiler drives `csp-solver` in its
//! domain passes — same `LatticeDomain` shape, same
//! `Constraint<D>::revise` propagation pattern.

use std::collections::{HashMap, HashSet};
use std::hash::BuildHasherDefault;

use rustc_hash::FxHasher;

use csp_solver::{
    Csp,
    constraint::{Constraint, Revision, VarId},
    domain::{Domain, LatticeDomain},
    variable::Variable,
};

use crate::analysis::Analysis;
use crate::egraph::EGraph;
use crate::id::Id;
use crate::language::Language;
use crate::rewrite::{DirtyClassSet, RewriteFn};
use crate::scheduler::{RunReport, Scheduler};

// Tranche X phase 2: per-iteration scratch maps switch from
// `RandomState` to the Fx hasher. `Id` is a `u32` newtype, and the
// post-W samply profile attributed ~10% of a grammar compile's self-time
// to SipHasher work in these per-iteration scratch maps.
type FxIdMap<V> = HashMap<Id, V, BuildHasherDefault<FxHasher>>;
type FxIdSet = HashSet<Id, BuildHasherDefault<FxHasher>>;

// ── DirtyDomain ─────────────────────────────────────────────────────────────

/// Per-class dirtiness lattice. Bottom = clean, top = dirty. Join is
/// monotone: once a class is marked dirty it stays dirty until the
/// scheduler resets the CSP state between iterations.
#[derive(Clone, Debug, PartialEq)]
pub struct DirtyDomain {
    /// Whether the class needs re-probing this iteration.
    pub dirty: bool,
}

impl DirtyDomain {
    /// Bottom of the dirty lattice — class is clean.
    pub fn clean() -> Self {
        Self { dirty: false }
    }
    /// Top of the dirty lattice — class needs re-probing.
    pub fn dirty() -> Self {
        Self { dirty: true }
    }
}

impl Domain for DirtyDomain {
    type Value = bool;
    fn size(&self) -> usize {
        1
    }
    fn is_singleton(&self) -> bool {
        true
    }
    fn singleton_value(&self) -> Option<bool> {
        Some(self.dirty)
    }
    fn contains(&self, v: &bool) -> bool {
        self.dirty == *v
    }
    fn remove(&mut self, _: &bool) -> bool {
        false
    }
    fn add(&mut self, _: &bool) {}
    fn values(&self) -> Vec<bool> {
        vec![self.dirty]
    }
}

impl LatticeDomain for DirtyDomain {
    fn bottom() -> Self {
        Self::clean()
    }
    fn join(&mut self, other: &Self) -> bool {
        if other.dirty && !self.dirty {
            self.dirty = true;
            true
        } else {
            false
        }
    }
}

// ── ParentDirtyProp ─────────────────────────────────────────────────────────

/// "If the child class is dirty, every parent class is dirty too."
///
/// One constraint per e-class with a non-empty parent list. `revise`
/// checks the child's dirty flag and propagates it upward along all
/// parent edges in one call. Parent flag changes cascade naturally
/// through AC-3's worklist — a parent becoming dirty enqueues ITS
/// constraint, and so on, until the transitive closure is reached.
#[derive(Debug)]
pub struct ParentDirtyProp {
    scope: Vec<VarId>,
    child: VarId,
    parents: Vec<VarId>,
}

impl ParentDirtyProp {
    /// Build a propagation constraint for the given child/parents.
    pub fn new(child: VarId, parents: Vec<VarId>) -> Self {
        let mut scope = vec![child];
        scope.extend_from_slice(&parents);
        scope.sort_unstable();
        scope.dedup();
        Self {
            scope,
            child,
            parents,
        }
    }
}

impl Constraint<DirtyDomain> for ParentDirtyProp {
    fn scope(&self) -> &[VarId] {
        &self.scope
    }

    fn check(&self, _: &[Option<bool>]) -> bool {
        // Structural constraint: always satisfiable. Real work is in
        // `revise` which propagates the lattice join.
        true
    }

    fn revise(&self, vars: &mut [Variable<DirtyDomain>], _depth: usize) -> Revision {
        if !vars[self.child as usize].domain.dirty {
            return Revision::Unchanged;
        }
        let mut changed = false;
        for &p in &self.parents {
            if !vars[p as usize].domain.dirty {
                vars[p as usize].domain.dirty = true;
                changed = true;
            }
        }
        if changed {
            Revision::Changed
        } else {
            Revision::Unchanged
        }
    }
}

// ── CspScheduler ────────────────────────────────────────────────────────────

/// CSP-backed equality saturation scheduler.
#[derive(Clone, Debug)]
pub struct CspScheduler {
    /// Maximum iterations before bailing out.
    pub iter_limit: usize,
    /// Absolute cap on total e-nodes.
    pub node_limit: usize,
}

impl Default for CspScheduler {
    fn default() -> Self {
        let cfg = crate::cost_config::CostConfig::default();
        Self {
            iter_limit: cfg.egraph_iter_limit,
            node_limit: cfg.egraph_node_limit,
        }
    }
}

impl CspScheduler {
    /// Build a scheduler from a [`crate::CostConfig`]. The constructor
    /// is the gestalt entry point — every consumer that has a config
    /// in scope should call this instead of the bare `Default::default`.
    pub fn from_config(cfg: &crate::cost_config::CostConfig) -> Self {
        Self {
            iter_limit: cfg.egraph_iter_limit,
            node_limit: cfg.egraph_node_limit,
        }
    }
}

impl<N: Language, A: Analysis<N>> Scheduler<N, A> for CspScheduler {
    fn run(&self, egraph: &mut EGraph<N, A>, rules: &[&dyn RewriteFn<N, A>]) -> RunReport {
        let mut report = RunReport {
            per_rule: rules
                .iter()
                .map(|r| (r.name().to_string(), 0usize))
                .collect(),
            ..RunReport::default()
        };

        // Snapshot per-class node counts so we can detect "grew since
        // last iteration" between applies. Classes that grow get
        // marked dirty in the next iteration's seed set.
        let mut node_count_snapshot: FxIdMap<usize> = FxIdMap::default();

        // Seed iteration 1: every class is dirty.
        let mut seed_dirty: FxIdSet = egraph.classes().map(|c| c.id).collect();

        for iter in 0..self.iter_limit {
            report.iterations = iter + 1;

            // Build a fresh CSP per iteration. The e-graph's class set
            // and parent edges may have changed since the last iter
            // (rewrites spawn new classes), and csp-solver's adjacency
            // graph is keyed on constraint count at build time. Fresh
            // CSP each iter keeps the propagation graph consistent
            // with the current e-graph state.
            let (mut csp, class_var) = build_csp(egraph, &seed_dirty);

            // AC-3 transitive dirty closure through parent edges.
            // On first iteration all classes are already dirty — the
            // closure is a no-op. On subsequent iterations the closure
            // extends the seed dirty set with parents of dirty classes.
            let _ = csp.propagate();

            // Harvest the dirty set from the propagated CSP.
            let dirty: DirtyClassSet = class_var
                .iter()
                .filter_map(|(&class_id, &var_id)| {
                    if csp.variables[var_id as usize].domain.dirty {
                        Some(class_id)
                    } else {
                        None
                    }
                })
                .collect();

            if dirty.is_empty() {
                report.saturated = true;
                return report;
            }

            // Snapshot pre-apply counts so we can compute newly-dirty
            // classes after `rebuild()`.
            node_count_snapshot.clear();
            for class in egraph.classes() {
                node_count_snapshot.insert(class.id, class.nodes.len());
            }

            // Run every rule restricted to the dirty set.
            let before_nodes = egraph.total_nodes();
            let before_unions = egraph.union_count();
            let mut applied_this_iter = 0usize;
            for (rule_idx, rule) in rules.iter().enumerate() {
                let rule_work = rule.run_on_dirty(egraph, &dirty);
                applied_this_iter += rule_work;
                report.per_rule[rule_idx].1 += rule_work;
            }
            egraph.rebuild();
            let after_nodes = egraph.total_nodes();
            let after_unions = egraph.union_count();
            let total_delta =
                after_nodes.saturating_sub(before_nodes) + (after_unions - before_unions) as usize;
            report.total_applied += applied_this_iter;
            report.final_nodes = after_nodes;
            report.final_classes = egraph.classes().count();

            // Growth guard.
            if after_nodes > self.node_limit {
                report.growth_limit_hit = true;
                return report;
            }

            // No work ⇒ saturated.
            if total_delta == 0 {
                report.saturated = true;
                return report;
            }

            // Compute next iteration's seed dirty set: every class
            // whose node count grew since the snapshot, plus every
            // class that's brand new (not in the snapshot at all).
            seed_dirty.clear();
            for class in egraph.classes() {
                match node_count_snapshot.get(&class.id) {
                    Some(&prev) if prev < class.nodes.len() => {
                        seed_dirty.insert(class.id);
                    }
                    None => {
                        seed_dirty.insert(class.id);
                    }
                    _ => {}
                }
            }

            // If we applied work but no class is "grown" (pure unions
            // that don't add nodes), fall back to the conservative
            // "everything dirty" seed — AC-3 will still short-circuit
            // at clean leaves but we can't miss any downstream impact.
            if seed_dirty.is_empty() {
                for class in egraph.classes() {
                    seed_dirty.insert(class.id);
                }
            }
        }

        report.iter_limit_hit = true;
        report
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/// Build a fresh CSP from the current e-graph state, seeding the
/// given classes as dirty. Returns the CSP and a `class_id → var_id`
/// lookup map.
fn build_csp<N: Language, A: Analysis<N>>(
    egraph: &EGraph<N, A>,
    seed_dirty: &FxIdSet,
) -> (Csp<DirtyDomain>, FxIdMap<VarId>) {
    let mut csp = Csp::<DirtyDomain>::new();
    let mut class_var: FxIdMap<VarId> = FxIdMap::default();

    // One variable per current e-class.
    for class in egraph.classes() {
        let domain = if seed_dirty.contains(&class.id) {
            DirtyDomain::dirty()
        } else {
            DirtyDomain::clean()
        };
        let var = csp.add_variable(domain);
        class_var.insert(class.id, var);
    }

    // One constraint per child→parent edge. Build by walking each
    // class's `parents` vector.
    for class in egraph.classes() {
        let child_var = class_var[&class.id];
        // Deduplicate parent class ids (canonicalized).
        let mut parent_vars: Vec<VarId> = Vec::with_capacity(class.parents.len());
        let mut seen: FxIdSet = FxIdSet::default();
        for (_, parent_id) in &class.parents {
            let canonical = egraph.find_ref(*parent_id);
            if seen.insert(canonical)
                && let Some(&v) = class_var.get(&canonical)
            {
                parent_vars.push(v);
            }
        }
        if parent_vars.is_empty() {
            continue;
        }
        csp.add_constraint(ParentDirtyProp::new(child_var, parent_vars));
    }

    (csp, class_var)
}
