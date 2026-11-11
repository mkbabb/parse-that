//! Rewrite rules: search for patterns and add equivalences.
//!
//! A rewrite rule is a named pair of a *searcher* (finds matches in the
//! e-graph) and an *applier* (installs the rewritten form as a new e-node
//! in the matched class). Unlike destructive rewrites, applying a rewrite
//! never removes the original form — it only adds a new equivalence.

use std::collections::HashSet;
use std::hash::BuildHasherDefault;

use rustc_hash::FxHasher;

use crate::analysis::Analysis;
use crate::egraph::EGraph;
use crate::id::Id;
use crate::language::Language;

/// Tranche X phase 2: dirty-class set used by the CSP scheduler and
/// the per-rule incremental re-search path. `FxHashSet` over the
/// default `RandomState` HashSet — `Id` is a `u32` newtype, so the
/// SipHasher cost was 3-10% of a grammar compile's self-time per the
/// post-W samply profile. The Fx hasher collapses to a single
/// 64-bit multiply.
pub type DirtyClassSet = HashSet<Id, BuildHasherDefault<FxHasher>>;

/// A rewrite rule over a language `N` with analysis `A`.
///
/// Rewrites are intentionally imperative rather than pattern-based: each
/// rule implements `search` directly and returns the list of e-class IDs
/// it would like to rewrite (plus any rule-specific match data). `apply`
/// then installs the new form for each match. This mirrors `csp-solver`'s
/// constraint-with-domain approach — more verbose than a pattern DSL but
/// easier to debug and extend.
pub trait Rewrite<N: Language, A: Analysis<N>>: Send + Sync {
    /// Human-readable name (used for debugging and scheduler backoff).
    fn name(&self) -> &str;

    /// Per-call match payload. Carry information from `search` into
    /// `apply` (e.g., the matched sub-tree shape).
    type Match;

    /// Find all matches in the e-graph. Called once per saturation iteration.
    fn search(&self, egraph: &EGraph<N, A>) -> Vec<(Id, Self::Match)>;

    /// Tranche AA.5 — per-match predicate guard.
    ///
    /// Called between `search` and `apply` to let a rule consult its
    /// class's `Analysis` data and decide whether applying the match
    /// is actually worthwhile (e.g., a rewrite that rewrites an Alt
    /// might abort when `EClassFacts::first_set` shows the dispatch
    /// is already tight and the rewrite would only bloat the graph).
    ///
    /// Default returns `true` — rules that don't need analysis-guided
    /// gating keep the pre-AA.5 behaviour. Rules that do override can
    /// read from `egraph.class(class_id).data` without changing their
    /// `search` signature.
    #[allow(unused_variables)]
    fn should_apply(&self, egraph: &EGraph<N, A>, class_id: Id, matched: &Self::Match) -> bool {
        true
    }

    /// Apply one match, installing the rewritten form and unioning with
    /// the matched class. Rules install equivalences unconditionally;
    /// progress is measured by the scheduler via `egraph.total_nodes()`
    /// delta, not by a per-match boolean. This mirrors LLVM's `Changed`
    /// flag pattern — individual rewrites can't reliably tell whether
    /// they changed the canonical form (a `union` between classes of
    /// equal size leaves `find(class_id)` unchanged even though the new
    /// e-node is now reachable from that class).
    fn apply(&self, egraph: &mut EGraph<N, A>, class_id: Id, matched: Self::Match);
}

/// A type-erased rewrite wrapper: consumers pass `&[&dyn RewriteFn]` to
/// the saturation driver without caring about the `Match` associated type.
pub trait RewriteFn<N: Language, A: Analysis<N>>: Send + Sync {
    /// Human-readable name.
    fn name(&self) -> &str;
    /// Run one full iteration: search + apply all matches. Returns the
    /// amount of **work done** — the sum of `egraph.total_nodes()`
    /// growth and the number of successful `egraph.union` calls (i.e.,
    /// `egraph.union_count()` delta). Both operations are the only two
    /// ways a rewrite rule can change the e-graph state: `add` installs
    /// a fresh canonical form, `union` merges two classes. Zero work
    /// means the rule had no effect and saturation has been reached.
    ///
    /// This replaces the previous "did `find(class_id)` change?" metric,
    /// which was fundamentally broken — `union(a, b)` picks the larger
    /// class as destination, so when both classes have the same node
    /// count, `find(class_id)` stays fixed even though the union
    /// happened.
    fn run(&self, egraph: &mut EGraph<N, A>) -> usize;

    /// Like `run`, but only apply matches whose canonical class id is
    /// in `dirty`. Used by `CspScheduler` to skip re-probing clean
    /// classes between iterations. Returns work-done delta.
    ///
    /// The default implementation runs the full search then filters
    /// applies post-hoc — this saves apply-time but not search-time.
    /// Individual rules can override to skip search on clean classes
    /// as well.
    fn run_on_dirty(&self, egraph: &mut EGraph<N, A>, dirty: &DirtyClassSet) -> usize;
}

/// Blanket erasure: any `Rewrite` is also a `RewriteFn`.
impl<N, A, R> RewriteFn<N, A> for R
where
    N: Language,
    A: Analysis<N>,
    R: Rewrite<N, A>,
{
    fn name(&self) -> &str {
        Rewrite::name(self)
    }

    fn run(&self, egraph: &mut EGraph<N, A>) -> usize {
        let before_nodes = egraph.total_nodes();
        let before_unions = egraph.union_count();
        let matches = self.search(egraph);
        for (class_id, m) in matches {
            if self.should_apply(egraph, class_id, &m) {
                self.apply(egraph, class_id, m);
            }
        }
        let node_delta = egraph.total_nodes().saturating_sub(before_nodes);
        let union_delta = (egraph.union_count() - before_unions) as usize;
        node_delta + union_delta
    }

    fn run_on_dirty(&self, egraph: &mut EGraph<N, A>, dirty: &DirtyClassSet) -> usize {
        let before_nodes = egraph.total_nodes();
        let before_unions = egraph.union_count();
        let matches = self.search(egraph);
        for (class_id, m) in matches {
            if dirty.contains(&egraph.find_ref(class_id)) && self.should_apply(egraph, class_id, &m)
            {
                self.apply(egraph, class_id, m);
            }
        }
        let node_delta = egraph.total_nodes().saturating_sub(before_nodes);
        let union_delta = (egraph.union_count() - before_unions) as usize;
        node_delta + union_delta
    }
}
