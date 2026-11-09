//! Saturation driver + scheduling.
//!
//! The scheduler is responsible for choosing which rewrite rules to run
//! each iteration and when to stop. Prevents pathological saturation by
//! enforcing iteration caps, per-rule match limits, and growth limits on
//! total e-graph size.

use crate::analysis::Analysis;
use crate::egraph::EGraph;
use crate::language::Language;
use crate::rewrite::RewriteFn;

/// Summary of a single saturation run.
#[derive(Clone, Debug, Default)]
pub struct RunReport {
    /// Total iterations run (bounded by the scheduler's `iter_limit`).
    pub iterations: usize,
    /// Total work done (sum of node-adds and class-unions) across all
    /// iterations. See `RewriteFn::run` for the decomposition. A positive
    /// value means at least one rule changed the e-graph state; zero
    /// across a full iteration means saturation.
    pub total_applied: usize,
    /// Final e-graph size (total e-nodes).
    pub final_nodes: usize,
    /// Final e-graph size (total e-classes).
    pub final_classes: usize,
    /// Whether saturation reached fixed-point (no rule added a new node
    /// this iteration).
    pub saturated: bool,
    /// Whether the iteration limit was hit.
    pub iter_limit_hit: bool,
    /// Whether a growth limit stopped saturation early.
    pub growth_limit_hit: bool,
    /// Per-rule work counts accumulated across all iterations. One entry
    /// per rule passed to the scheduler; order matches the rules slice.
    /// `(rule_name, total_work)` where `total_work` is the sum of
    /// `RewriteFn::run` deltas across every iteration. Load-bearing for
    /// a consumer's per-rule attribution report (Tranche AA.0).
    pub per_rule: Vec<(String, usize)>,
}

/// A scheduler controls saturation — it decides when to stop.
pub trait Scheduler<N: Language, A: Analysis<N>> {
    /// Drive saturation until done. Mutates `egraph` in place.
    fn run(&self, egraph: &mut EGraph<N, A>, rules: &[&dyn RewriteFn<N, A>]) -> RunReport;
}

/// Backoff scheduler: iterates until saturation, or until iteration/growth
/// caps are hit. Simple and deterministic.
#[derive(Clone, Debug)]
pub struct BackoffScheduler {
    /// Maximum iterations. Default: 64.
    pub iter_limit: usize,
    /// Maximum ratio of `final_nodes / initial_nodes`. Default: 16.0.
    pub growth_limit: f64,
    /// Absolute cap on total e-nodes. Default: 100_000.
    pub node_limit: usize,
}

impl Default for BackoffScheduler {
    fn default() -> Self {
        Self {
            iter_limit: 64,
            growth_limit: 16.0,
            node_limit: 100_000,
        }
    }
}

impl<N: Language, A: Analysis<N>> Scheduler<N, A> for BackoffScheduler {
    fn run(&self, egraph: &mut EGraph<N, A>, rules: &[&dyn RewriteFn<N, A>]) -> RunReport {
        let mut report = RunReport {
            per_rule: rules
                .iter()
                .map(|r| (r.name().to_string(), 0usize))
                .collect(),
            ..RunReport::default()
        };
        let initial_nodes = egraph.total_nodes().max(1);

        for iter in 0..self.iter_limit {
            report.iterations = iter + 1;

            let mut applied_this_iter = 0;
            for (rule_idx, rule) in rules.iter().enumerate() {
                let rule_work = rule.run(egraph);
                applied_this_iter += rule_work;
                report.per_rule[rule_idx].1 += rule_work;
            }
            egraph.rebuild();

            report.total_applied += applied_this_iter;
            report.final_nodes = egraph.total_nodes();
            report.final_classes = egraph.classes().count();

            // Stop if no rule introduced a new e-node this iteration.
            // Post-J, `rule.run` returns the `total_nodes` delta, so
            // `applied_this_iter == 0` is the correct saturation fixed
            // point: no rule produced a new canonical form.
            if applied_this_iter == 0 {
                report.saturated = true;
                return report;
            }
            // Growth cap.
            if report.final_nodes > self.node_limit {
                report.growth_limit_hit = true;
                return report;
            }
            let ratio = report.final_nodes as f64 / initial_nodes as f64;
            if ratio > self.growth_limit {
                report.growth_limit_hit = true;
                return report;
            }
        }
        report.iter_limit_hit = true;
        report
    }
}
