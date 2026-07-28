use parse_that::{Input, Run, Span, Step, choice, literal, repeat, sequence};

fn ax<'i>(run: &mut Run<'i>) -> Step<'i, Span<'i>> {
    sequence(run, |run| match literal(run, b"a") {
        Step::Matched(_) => literal(run, b"x"),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    })
}

fn ab<'i>(run: &mut Run<'i>) -> Step<'i, Span<'i>> {
    sequence(run, |run| match literal(run, b"a") {
        Step::Matched(_) => literal(run, b"b"),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    })
}

#[test]
fn sequence_is_atomic_on_mismatch() {
    let mut run = Run::new(Input::new(b"ab"));
    assert!(matches!(run.parse_prefix(ax), Step::Mismatch(_)));
    assert_eq!(run.cursor().offset(), 0);
}

#[test]
fn choice_retries_from_its_entry_cursor() {
    let mut run = Run::new(Input::new(b"ab"));
    assert!(matches!(
        run.parse_full(|run| choice(run, ax, ab)),
        Step::Matched(_)
    ));
    assert_eq!(run.cursor().offset(), 2);
}

#[test]
fn repeat_honors_minimum_maximum_and_rolls_back_final_mismatch() {
    let mut bounded = Run::new(Input::new(b"aaab"));
    let outcome = bounded.parse_prefix(|run| repeat(run, 2, Some(3), |run| literal(run, b"a")));
    assert!(matches!(outcome, Step::Matched(3)));
    assert_eq!(bounded.cursor().offset(), 3);

    let mut below_minimum = Run::new(Input::new(b"ab"));
    assert!(matches!(
        below_minimum.parse_prefix(|run| repeat(run, 2, None, |run| literal(run, b"a"))),
        Step::Mismatch(_)
    ));
    assert_eq!(below_minimum.cursor().offset(), 0);
}
