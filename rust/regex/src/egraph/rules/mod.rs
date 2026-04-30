//! HIR rewrite rules for equality saturation over the regex HIR.
//!
//! Mirrors the grammar-tier rules in
//! `bbnf_ir::egraph::rules::regex` — same shape, same retention
//! policy, identical `Rewrite` / `RewriteFn` substrate. The HIR
//! tier handles *intra-regex* rewrites (simplifications that
//! operate on the content of a single pattern), leaving the
//! grammar tier to handle *grammar-level Alt* rewrites (fusion
//! across sibling `Regex` branches of a grammar `Alt`).
//!
//! # Rule retention policy
//!
//! Rules in [`default_hir_rules`] justify themselves by one of
//! three criteria:
//!
//! 1. **Ordering-independent equivalence** — catches rewrites
//!    that a destructive fixed-order pass would miss because
//!    equivalence is only visible after e-class canonicalization.
//! 2. **Cost-guided canonical form selection** — the RHS may
//!    have more nodes than the LHS by count, so destructive
//!    application picks wrong. Only cost-guided extraction
//!    produces the right answer.
//! 3. **Regex algebra family** — peephole rewrites that are
//!    equality-saturation-native (superset absorption, charclass
//!    union, redundant branch dedup, flattening).
//!
//! Instrumentation: every rule's name flows into the
//! `BackoffScheduler` report, which prints per-rule fire counts
//! when `BBNF_HIR_EGRAPH_REPORT=1` is set in the environment,
//! mirroring `BBNF_EGRAPH_REPORT` on the grammar tier.

mod flatten;
mod redundant;
mod repetition;
mod superset;
mod union;
mod util;

pub use flatten::FlattenAltConcat;
pub use redundant::{DedupMatch, DeduplicateAlternation};
pub use repetition::{AbsorbRepetition, AbsorbRepetitionMatch, merge_bounds};
pub use superset::{AbsorbMatch, SupersetAbsorbClass};
pub use union::{UnionMatch, UnionMergeClass};

use egraph::{Analysis, RewriteFn};

use crate::egraph::node::HirENode;

/// Default rule set for the HIR e-graph.
///
/// - [`FlattenAltConcat`] — `Alt([Alt([a,b]), c]) → Alt([a,b,c])`,
///   `Concat(Concat(a,b),c) → Concat(a,b,c)`. High fire count —
///   every other rule benefits from this being applied first.
/// - [`DeduplicateAlternation`] — `Alt([.., R, .., R, ..])` →
///   `Alt([.., R, ..])`. Collapses e-class-equal sibling branches.
/// - [`SupersetAbsorbClass`] — `Alt([[a-z], [a-c]]) → Alt([[a-z]])`.
///   Subset absorption across sibling `Class` branches inside a
///   single `Alternation` e-class.
/// - [`UnionMergeClass`] — `Alt([[a-c], [d-f]]) → Alt([[a-f]])`.
///   Charclass union merge.
/// - [`AbsorbRepetition`] — `a+a* → a+`, `a*a* → a*`, `a?a* → a*`,
///   `aa+ → a+a`. Genuine equality-saturation wins; only
///   cost-guided extraction picks the right form.
pub fn default_hir_rules<A: Analysis<HirENode> + 'static>() -> Vec<Box<dyn RewriteFn<HirENode, A>>>
{
    vec![
        Box::new(FlattenAltConcat),
        Box::new(DeduplicateAlternation),
        Box::new(SupersetAbsorbClass),
        Box::new(UnionMergeClass),
        Box::new(AbsorbRepetition),
    ]
}
