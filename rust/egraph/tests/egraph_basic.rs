//! End-to-end e-graph tests over a small arithmetic language.
//!
//! Exercises interning, union, rebuild, and cost-model extraction on a
//! simple `Calc` e-node type with rewrite rules for commutativity and
//! identity.

use parse_that_egraph::{
    AstSize, BackoffScheduler, EGraph, Extractor, Id, Language, NoAnalysis, Rewrite, RewriteFn,
    Scheduler,
};

// ── Language definition ─────────────────────────────────────────────────────

#[derive(Clone, Eq, PartialEq, Hash, Debug)]
enum Calc {
    Num(i64),
    Var(&'static str),
    Add(Box<[Id]>),
}

impl Language for Calc {
    fn children(&self) -> &[Id] {
        match self {
            Calc::Num(_) | Calc::Var(_) => &[],
            Calc::Add(children) => children,
        }
    }

    fn children_mut(&mut self) -> &mut [Id] {
        match self {
            Calc::Num(_) | Calc::Var(_) => &mut [],
            Calc::Add(children) => children,
        }
    }
}

// ── Basic interning ─────────────────────────────────────────────────────────

#[test]
fn intern_dedupes_identical_nodes() {
    let mut egraph: EGraph<Calc, NoAnalysis> = EGraph::new();
    let a = egraph.add(Calc::Num(1));
    let b = egraph.add(Calc::Num(1));
    assert_eq!(a, b, "identical leaves should intern to one class");
    assert_eq!(egraph.total_classes(), 1);
}

#[test]
fn intern_distinct_nodes() {
    let mut egraph: EGraph<Calc, NoAnalysis> = EGraph::new();
    let one = egraph.add(Calc::Num(1));
    let two = egraph.add(Calc::Num(2));
    let x = egraph.add(Calc::Var("x"));
    assert_ne!(one, two);
    assert_ne!(one, x);
    assert_eq!(egraph.total_classes(), 3);
}

#[test]
fn intern_builds_shared_children() {
    let mut egraph: EGraph<Calc, NoAnalysis> = EGraph::new();
    let x = egraph.add(Calc::Var("x"));
    let one = egraph.add(Calc::Num(1));
    // (x + 1) two different ways — should intern to the same class.
    let sum_a = egraph.add(Calc::Add(Box::new([x, one])));
    let sum_b = egraph.add(Calc::Add(Box::new([x, one])));
    assert_eq!(sum_a, sum_b);
}

// ── Union ───────────────────────────────────────────────────────────────────

#[test]
fn union_merges_classes() {
    let mut egraph: EGraph<Calc, NoAnalysis> = EGraph::new();
    let x = egraph.add(Calc::Var("x"));
    let zero = egraph.add(Calc::Num(0));
    let sum = egraph.add(Calc::Add(Box::new([x, zero])));
    // Declare: x + 0 ≡ x
    egraph.union(sum, x);
    egraph.rebuild();
    assert_eq!(egraph.find(sum), egraph.find(x));
}

// ── Rewrite rules + saturation ──────────────────────────────────────────────

/// Rule: `a + 0 → a` (right-identity).
struct AddZero;

struct AddZeroMatch {
    non_zero_child: Id,
}

impl Rewrite<Calc, NoAnalysis> for AddZero {
    type Match = AddZeroMatch;

    fn name(&self) -> &str {
        "add-zero"
    }

    fn search(&self, egraph: &EGraph<Calc, NoAnalysis>) -> Vec<(Id, Self::Match)> {
        let mut matches = Vec::new();
        for class in egraph.classes() {
            for node in class.iter() {
                let Calc::Add(children) = node else {
                    continue;
                };
                if children.len() != 2 {
                    continue;
                }
                // Look for a child whose class contains Num(0).
                for (i, &child) in children.iter().enumerate() {
                    let child_class = egraph.class(child);
                    let has_zero = child_class.iter().any(|n| matches!(n, Calc::Num(0)));
                    if has_zero {
                        let other = children[1 - i];
                        matches.push((
                            class.id,
                            AddZeroMatch {
                                non_zero_child: other,
                            },
                        ));
                        break;
                    }
                }
            }
        }
        matches
    }

    fn apply(&self, egraph: &mut EGraph<Calc, NoAnalysis>, class_id: Id, matched: Self::Match) {
        egraph.union(class_id, matched.non_zero_child);
    }
}

#[test]
fn saturate_add_zero() {
    let mut egraph: EGraph<Calc, NoAnalysis> = EGraph::new();
    let x = egraph.add(Calc::Var("x"));
    let zero = egraph.add(Calc::Num(0));
    let sum = egraph.add(Calc::Add(Box::new([x, zero])));
    // Before saturation: sum and x are in different classes.
    assert_ne!(egraph.find(sum), egraph.find(x));

    let rules: Vec<&dyn RewriteFn<Calc, NoAnalysis>> = vec![&AddZero];
    let scheduler = BackoffScheduler::default();
    let report = scheduler.run(&mut egraph, &rules);

    assert!(report.saturated || report.iter_limit_hit);
    assert_eq!(egraph.find(sum), egraph.find(x));
}

// ── Extraction ──────────────────────────────────────────────────────────────

#[test]
fn extract_smallest_after_saturate() {
    let mut egraph: EGraph<Calc, NoAnalysis> = EGraph::new();
    let x = egraph.add(Calc::Var("x"));
    let zero = egraph.add(Calc::Num(0));
    let sum = egraph.add(Calc::Add(Box::new([x, zero])));

    // Add the equivalence sum ≡ x.
    egraph.union(sum, x);
    egraph.rebuild();

    // Extract from the sum class. Since x is cheaper (1 node) than
    // the Add (3 nodes: Add + Var + Num), extraction picks x.
    let canonical = egraph.find(sum);
    let extractor = Extractor::new(&egraph, &AstSize);
    let best = extractor.best_node(canonical).expect("should extract");
    assert!(matches!(best, Calc::Var("x")));
}
