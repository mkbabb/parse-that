//! Regression tests for saturation termination (Tranche J).
//!
//! The bug fixed in Tranche J: `RewriteFn::run` measured "did
//! `find(class_id)` change?" which was wrong because `egraph.union`
//! picks the larger class as destination — when both classes tie on
//! node count, `find(class_id)` stays fixed even though the new
//! equivalence IS installed. The scheduler then concluded
//! `applied_this_iter == 0` after a single iteration and reported
//! `saturated = true`, terminating before any rule had a chance to
//! fire more than once.
//!
//! These tests seed an e-graph that requires **at least two**
//! rewrite iterations to reach its true fixed point, then assert
//! that `BackoffScheduler` iterates that many times. The old
//! (broken) metric would fail the multi-iteration test.

use parse_that_egraph::{BackoffScheduler, EGraph, Id, Language, NoAnalysis, Rewrite, RewriteFn, Scheduler};

// ── Toy language ────────────────────────────────────────────────────────────

/// A minimal alternation language: `Leaf(i64)` leaves plus
/// `Alt(Box<[Id]>)` for unordered alternation. Enough to exercise
/// both the "new node" and "pure union" work-counting paths.
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

// ── Rule: flatten nested Alt ────────────────────────────────────────────────

/// `Alt([Alt([a, b]), c])` ≡ `Alt([a, b, c])`. Each firing unnests
/// one level. Running on `Alt([Alt([Alt([1, 2]), 3]), 4])` requires
/// two iterations to fully flatten — each iteration removes a single
/// level.
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
                // Does any child class contain an Alt node? If so, flatten.
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
                    // No `break`: every Alt node in the class that
                    // has nested children should contribute a match,
                    // otherwise iterations after the first can be
                    // starved of useful work by the oldest Alt node
                    // "stealing" the per-class quota.
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

// ── Rule: dedup identical Alt children (pure union, no new nodes) ───────────

/// Collapses duplicate Alt branches. The rewrite target may or may
/// not introduce a new Alt node (depending on whether deduping
/// yields a new shape). When it does not, the rule does only a
/// union — exercising the "pure union work counts" path.
struct DedupAlt;

struct DedupMatch {
    deduped: Box<[Id]>,
}

impl Rewrite<Toy, NoAnalysis> for DedupAlt {
    type Match = DedupMatch;

    fn name(&self) -> &str {
        "dedup-alt"
    }

    fn search(&self, egraph: &EGraph<Toy, NoAnalysis>) -> Vec<(Id, Self::Match)> {
        use std::collections::HashSet;
        let mut matches = Vec::new();
        for class in egraph.classes() {
            for node in class.iter() {
                let Toy::Alt(children) = node else {
                    continue;
                };
                let mut seen: HashSet<Id> = HashSet::new();
                let mut deduped: Vec<Id> = Vec::with_capacity(children.len());
                for &id in children.iter() {
                    let canon = egraph.find_ref(id);
                    if seen.insert(canon) {
                        deduped.push(id);
                    }
                }
                if deduped.len() < children.len() {
                    matches.push((
                        class.id,
                        DedupMatch {
                            deduped: deduped.into_boxed_slice(),
                        },
                    ));
                    break;
                }
            }
        }
        matches
    }

    fn apply(&self, egraph: &mut EGraph<Toy, NoAnalysis>, class_id: Id, m: Self::Match) {
        let new_id = if m.deduped.len() == 1 {
            m.deduped[0]
        } else {
            egraph.add(Toy::Alt(m.deduped))
        };
        egraph.union(class_id, new_id);
    }
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[test]
fn multi_iteration_flatten_reaches_fixed_point() {
    // Build `Alt([Alt([Alt([1, 2]), 3]), 4])`. Flattening requires
    // two iterations: iter 1 produces `Alt([Alt([1, 2]), 3, 4])`,
    // iter 2 produces `Alt([1, 2, 3, 4])`.
    let mut egraph: EGraph<Toy, NoAnalysis> = EGraph::new();
    let one = egraph.add(Toy::Leaf(1));
    let two = egraph.add(Toy::Leaf(2));
    let three = egraph.add(Toy::Leaf(3));
    let four = egraph.add(Toy::Leaf(4));
    let inner_alt = egraph.add(Toy::Alt(Box::new([one, two])));
    let mid_alt = egraph.add(Toy::Alt(Box::new([inner_alt, three])));
    let outer_alt = egraph.add(Toy::Alt(Box::new([mid_alt, four])));

    let rules: Vec<&dyn RewriteFn<Toy, NoAnalysis>> = vec![&FlattenAlt];
    let scheduler = BackoffScheduler::default();
    let report = scheduler.run(&mut egraph, &rules);

    // Post-Tranche J: saturation requires at least two iterations
    // because each flatten-alt firing only peels one level. Before
    // Tranche J the scheduler terminated after a single iteration
    // regardless of remaining work.
    assert!(
        report.iterations >= 2,
        "flatten-alt needs at least two iterations to reach fixed point, got {}",
        report.iterations,
    );
    assert!(
        report.saturated,
        "scheduler should eventually saturate; report={:?}",
        report,
    );
    assert!(
        report.total_applied > 0,
        "some work must be reported, got total_applied={}",
        report.total_applied,
    );

    // Verify the e-graph actually reached the fully-flattened form:
    // `outer_alt`'s class should now contain an Alt with all four
    // leaves as direct children.
    let canonical = egraph.find(outer_alt);
    let has_flat_four = egraph.class(canonical).iter().any(|n| {
        let Toy::Alt(children) = n else {
            return false;
        };
        children.len() == 4
    });
    assert!(
        has_flat_four,
        "outer_alt's canonical class should contain the fully-flattened Alt of four leaves",
    );
}

#[test]
fn no_op_saturates_in_one_iteration() {
    // Build `Leaf(1)` — no Alt, no rule fires.
    let mut egraph: EGraph<Toy, NoAnalysis> = EGraph::new();
    let _one = egraph.add(Toy::Leaf(1));

    let rules: Vec<&dyn RewriteFn<Toy, NoAnalysis>> = vec![&FlattenAlt, &DedupAlt];
    let scheduler = BackoffScheduler::default();
    let report = scheduler.run(&mut egraph, &rules);

    assert!(report.saturated);
    assert_eq!(report.iterations, 1);
    assert_eq!(report.total_applied, 0);
}

#[test]
fn pure_union_rule_counted_as_work() {
    // Build `Alt([Leaf(1), Leaf(1)])`. Dedup's rewrite produces
    // `Leaf(1)` (a single-child boxed slice collapses to its lone
    // child) — which unions the outer Alt class with the Leaf(1)
    // class WITHOUT calling `egraph.add` at all. This is the case
    // the old `total_nodes`-only metric would have missed.
    let mut egraph: EGraph<Toy, NoAnalysis> = EGraph::new();
    let one = egraph.add(Toy::Leaf(1));
    let one_dup = egraph.add(Toy::Leaf(1));
    assert_eq!(one, one_dup, "identical leaves intern to same class");
    let alt = egraph.add(Toy::Alt(Box::new([one, one_dup])));

    let rules: Vec<&dyn RewriteFn<Toy, NoAnalysis>> = vec![&DedupAlt];
    let scheduler = BackoffScheduler::default();
    let report = scheduler.run(&mut egraph, &rules);

    // Saturation completed + at least one unit of work counted.
    assert!(report.saturated, "should saturate: {:?}", report);
    assert!(
        report.total_applied > 0,
        "pure-union rule must register as work, got total_applied={}",
        report.total_applied,
    );

    // The outer Alt and Leaf(1) should now be in the same class.
    assert_eq!(egraph.find(alt), egraph.find(one));
}
