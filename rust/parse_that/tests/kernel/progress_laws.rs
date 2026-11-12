use parse_that::kernel::{Fault, Input, Run, Step, literal, repeat};

#[test]
fn unbounded_epsilon_repeat_faults_at_the_absolute_cursor() {
    let mut run = Run::new(Input::new(b"abc"));
    let outcome = run.parse_prefix(|run| match literal(run, b"a") {
        Step::Matched(_) => repeat(run, 0, None, |run| literal(run, b"")),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    });

    match outcome {
        Step::Fault(Fault::StalledRepeat { at }) => assert_eq!(at.offset(), 1),
        other => panic!("expected stalled-repeat fault, got {other:?}"),
    }
    assert_eq!(
        run.cursor().offset(),
        0,
        "the enclosing invocation rolls back a fault"
    );
}

#[test]
fn finite_repeat_still_rejects_a_non_progressing_child() {
    let mut run = Run::new(Input::new(b""));
    let outcome = run.parse_prefix(|run| repeat(run, 0, Some(2), |run| literal(run, b"")));

    assert!(matches!(outcome, Step::Fault(Fault::StalledRepeat { .. })));
}
