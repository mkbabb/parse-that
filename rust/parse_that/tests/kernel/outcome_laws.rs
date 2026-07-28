use parse_that::{Fault, Input, Run, Span, Step, choice, literal};

fn shallow_failure<'i>(run: &mut Run<'i>) -> Step<'i, Span<'i>> {
    match literal(run, b"ab") {
        Step::Matched(_) => literal(run, b"x"),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    }
}

fn deep_failure<'i>(run: &mut Run<'i>) -> Step<'i, Span<'i>> {
    match literal(run, b"abc") {
        Step::Matched(_) => literal(run, b"y"),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    }
}

#[test]
fn mismatch_preserves_furthest_absolute_failure_evidence() {
    let mut run = Run::new(Input::new(b"abcq"));
    let outcome = run.parse_prefix(|run| choice(run, shallow_failure, deep_failure));

    match outcome {
        Step::Mismatch(failure) => assert_eq!(failure.at().offset(), 3),
        other => panic!("expected mismatch, got {other:?}"),
    }
    assert_eq!(run.cursor().offset(), 0, "failed choice is atomic");
}

#[test]
fn full_and_prefix_recognition_are_distinct_named_operations() {
    let mut prefix = Run::new(Input::new(b"ab-tail"));
    assert!(matches!(
        prefix.parse_prefix(|run| literal(run, b"ab")),
        Step::Matched(_)
    ));
    assert_eq!(prefix.cursor().offset(), 2);

    let mut full = Run::new(Input::new(b"ab-tail"));
    assert!(matches!(
        full.parse_full(|run| literal(run, b"ab")),
        Step::Mismatch(_)
    ));
    assert_eq!(
        full.cursor().offset(),
        0,
        "full-recognition failure rolls back the invocation"
    );
}

#[test]
fn full_recognition_is_whole_source_not_remaining_suffix() {
    let input = Input::new(b"ab");
    let mut run = Run::new(input);
    assert!(matches!(
        run.parse_prefix(|run| literal(run, b"a")),
        Step::Matched(_)
    ));

    match run.parse_full(|run| literal(run, b"b")) {
        Step::Fault(Fault::FullParseAfterProgress { at }) => {
            assert_eq!(at.offset(), 1);
        }
        other => panic!("expected full-after-progress fault, got {other:?}"),
    }
    assert_eq!(run.cursor().offset(), 1);
}

#[test]
fn typed_fault_is_not_collapsed_into_mismatch() {
    let mut run = Run::new(Input::new(b""));
    let outcome = run.parse_prefix(|run| parse_that::repeat(run, 0, None, |run| literal(run, b"")));

    assert!(matches!(outcome, Step::Fault(Fault::StalledRepeat { .. })));
}

#[test]
fn foreign_failure_evidence_becomes_a_typed_local_fault() {
    let primary_input = Input::new(b"primary");
    let foreign_input = Input::new(b"foreign");
    let mut primary = Run::new(primary_input);
    let mut foreign = Run::new(foreign_input);

    let outcome = primary.parse_prefix(|_| literal(&mut foreign, b"x"));
    match outcome {
        Step::Fault(Fault::ForeignOutcome { at }) => {
            assert_eq!(at, primary_input.start());
        }
        other => panic!("expected foreign-outcome fault, got {other:?}"),
    }
    assert_eq!(primary.cursor(), primary_input.start());
}

#[test]
fn foreign_empty_failure_evidence_becomes_a_typed_local_fault() {
    let primary_bytes = Vec::new();
    let foreign_bytes = Vec::new();
    let primary_input = Input::new(&primary_bytes);
    let foreign_input = Input::new(&foreign_bytes);
    let mut primary = Run::new(primary_input);
    let mut foreign = Run::new(foreign_input);

    let outcome = primary.parse_prefix(|_| literal(&mut foreign, b"x"));
    match outcome {
        Step::Fault(Fault::ForeignOutcome { at }) => {
            assert_eq!(at, primary_input.start());
        }
        other => panic!("expected foreign-outcome fault, got {other:?}"),
    }
    assert_eq!(primary.cursor(), primary_input.start());
}
