//! The failure contract (sk-v27 LW3.COMP-4b, ABI 4): a failure carries the
//! furthest cursor and the expected-label set at that cursor, sorted and
//! deduplicated by construction and merged only at an equal furthest offset.

use parse_that::kernel::{
    Expected, Failure, Input, LABEL_CAPACITY, Label, Run, Span, Step, choice, label, literal,
    repeat, sequence,
};

fn l(id: u16) -> Label {
    Label::new(id).expect("label id inside the table")
}

fn ids(expected: Expected) -> Vec<u16> {
    expected.iter().map(Label::id).collect()
}

fn mismatch<T: core::fmt::Debug>(step: Step<'_, T>) -> Failure<'_> {
    match step {
        Step::Mismatch(failure) => failure,
        other => panic!("expected a mismatch, got {other:?}"),
    }
}

fn lit<'i>(run: &mut Run<'i>, bytes: &'static [u8], id: u16) -> Step<'i, Span<'i>> {
    label(run, l(id), |run| literal(run, bytes))
}

#[test]
fn failure_reports_sorted_expected_set() {
    // Two alternatives failing at one offset, in both orders: one set,
    // sorted by label id.
    let mut run = Run::new(Input::new(b"x"));
    let forward = mismatch(choice(&mut run, |r| lit(r, b"a", 3), |r| lit(r, b"b", 9)));
    let mut run = Run::new(Input::new(b"x"));
    let backward = mismatch(choice(&mut run, |r| lit(r, b"b", 9), |r| lit(r, b"a", 3)));
    assert_eq!(forward.at().offset(), 0);
    assert_eq!(ids(forward.expected()), vec![3, 9]);
    assert_eq!(forward.expected(), backward.expected());
    assert_eq!(forward.at(), backward.at());

    // A later failure at a smaller offset does not replace it: the further
    // set survives the right alternative's failure at offset 0.
    let mut run = Run::new(Input::new(b"ax"));
    let deep = mismatch(choice(
        &mut run,
        |r| {
            sequence(r, |r| {
                let Step::Matched(_) = lit(r, b"a", 1) else {
                    unreachable!("the input starts with a");
                };
                choice(r, |r| lit(r, b"c", 7), |r| lit(r, b"b", 5))
            })
        },
        |r| lit(r, b"z", 0),
    ));
    assert_eq!(deep.at().offset(), 1);
    assert_eq!(ids(deep.expected()), vec![5, 7]);
}

#[test]
fn a_label_met_twice_at_one_offset_is_kept_once() {
    let mut run = Run::new(Input::new(b"x"));
    let twice = mismatch(choice(
        &mut run,
        |r| lit(r, b"b", 4),
        |r| choice(r, |r| lit(r, b"a", 2), |r| lit(r, b"b", 4)),
    ));
    assert_eq!(ids(twice.expected()), vec![2, 4]);
    assert_eq!(twice.expected().len(), 2);
}

#[test]
fn equal_offset_merge_is_commutative_and_associative() {
    let alts: [(&'static [u8], u16); 3] = [(b"p", 200), (b"q", 0), (b"r", 64)];
    let mut sets = Vec::new();
    for order in [
        [0, 1, 2],
        [2, 1, 0],
        [1, 0, 2],
        [1, 2, 0],
        [0, 2, 1],
        [2, 0, 1],
    ] {
        let [a, b, c] = order.map(|i| alts[i]);
        let mut run = Run::new(Input::new(b"x"));
        let left = mismatch(choice(
            &mut run,
            |r| choice(r, |r| lit(r, a.0, a.1), |r| lit(r, b.0, b.1)),
            |r| lit(r, c.0, c.1),
        ));
        let mut run = Run::new(Input::new(b"x"));
        let right = mismatch(choice(
            &mut run,
            |r| lit(r, a.0, a.1),
            |r| choice(r, |r| lit(r, b.0, b.1), |r| lit(r, c.0, c.1)),
        ));
        assert_eq!(left.expected(), right.expected());
        sets.push(ids(left.expected()));
    }
    assert!(sets.iter().all(|s| s == &vec![0, 64, 200]));
}

#[test]
fn a_mismatch_past_the_label_entry_keeps_the_inner_set() {
    let mut run = Run::new(Input::new(b"ax"));
    let inner = mismatch(label(&mut run, l(10), |r| {
        sequence(r, |r| {
            let Step::Matched(_) = literal(r, b"a") else {
                unreachable!("the input starts with a");
            };
            lit(r, b"b", 11)
        })
    }));
    assert_eq!(inner.at().offset(), 1);
    assert_eq!(ids(inner.expected()), vec![11]);

    let mut run = Run::new(Input::new(b"x"));
    let outer = mismatch(label(&mut run, l(10), |r| lit(r, b"a", 11)));
    assert_eq!(outer.at().offset(), 0);
    assert_eq!(ids(outer.expected()), vec![10]);
}

#[test]
fn a_repeat_below_its_minimum_reports_the_failing_iteration() {
    let mut run = Run::new(Input::new(b"aax"));
    let failure = mismatch(repeat(&mut run, 3, None, |r| lit(r, b"a", 6)));
    assert_eq!(failure.at().offset(), 2);
    assert_eq!(ids(failure.expected()), vec![6]);
    assert_eq!(run.cursor().offset(), 0, "the repeat rolls back whole");
}

#[test]
fn an_unlabelled_terminal_reports_an_empty_set() {
    let mut run = Run::new(Input::new(b"x"));
    let failure = mismatch(literal(&mut run, b"a"));
    assert!(failure.expected().is_empty());
    assert_eq!(failure.expected().len(), 0);
}

#[test]
fn labels_span_the_whole_table_and_no_further() {
    let last = u16::try_from(LABEL_CAPACITY - 1).expect("capacity fits u16");
    assert!(Label::new(last).is_some());
    assert!(Label::new(last + 1).is_none());
    let mut run = Run::new(Input::new(b"x"));
    let edges = mismatch(choice(
        &mut run,
        |r| lit(r, b"a", last),
        |r| choice(r, |r| lit(r, b"b", 0), |r| lit(r, b"c", 63)),
    ));
    assert_eq!(ids(edges.expected()), vec![0, 63, last]);
}
