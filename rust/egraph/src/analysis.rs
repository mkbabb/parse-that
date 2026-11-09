//! Per-e-class lattice analysis.
//!
//! An `Analysis<N>` computes a lattice-ordered value for each e-class,
//! updated monotonically as rewrites add e-nodes and merges. Rewrite rules
//! can read the analysis to decide whether to fire (e.g., only inline a
//! `Ref(id)` if the e-class's analysis says the body is small enough).

use crate::egraph::EGraph;
use crate::id::Id;
use crate::language::Language;

/// Per-e-class data computed during saturation.
///
/// The analysis type implements a monotone lattice. `make` computes the
/// lattice value for a single e-node (given the current analyses of its
/// children's classes). `merge` joins two analyses when two e-classes are
/// unioned — the join must be monotone (idempotent, commutative, associative).
pub trait Analysis<N: Language>: Sized {
    /// The lattice-valued data stored per e-class.
    type Data: Clone;

    /// Compute the analysis for a fresh e-node.
    ///
    /// `egraph` gives access to child e-classes' analyses via
    /// `egraph.class(child_id).data`.
    fn make(egraph: &EGraph<N, Self>, node: &N) -> Self::Data;

    /// Join two analysis values into one.
    ///
    /// Called when two e-classes are merged. The result must be the lattice
    /// join (least upper bound) of the two inputs. Returns whether the
    /// result changed compared to `a` — the e-graph uses this to detect
    /// fixed-point saturation.
    fn merge(a: &mut Self::Data, b: Self::Data) -> bool;

    /// Hook called after an e-class's analysis has been updated (e.g., from
    /// a rebuild). Default impl is a no-op.
    ///
    /// Consumers can override to perform side-effectful bookkeeping when
    /// an analysis value changes.
    fn modify(_egraph: &mut EGraph<N, Self>, _id: Id) {}
}

/// A trivial analysis that stores no data. Use when rewrite rules don't
/// need any per-class derived facts.
#[derive(Clone, Copy, Debug, Default)]
pub struct NoAnalysis;

impl<N: Language> Analysis<N> for NoAnalysis {
    type Data = ();

    fn make(_egraph: &EGraph<N, Self>, _node: &N) -> Self::Data {}

    fn merge(_a: &mut Self::Data, _b: Self::Data) -> bool {
        false
    }
}
