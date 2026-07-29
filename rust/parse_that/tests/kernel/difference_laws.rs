use std::cell::Cell;

use parse_that::{
    EventSink, Failure, Fault, Input, ResourceKind, Run, Span, Step, difference, literal, repeat,
    sequence,
};

const _: () = assert!(parse_that::KERNEL_ABI == 3);

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct ProbeEvent {
    label: &'static str,
    at: usize,
}

#[derive(Debug, Default)]
struct RecordingSink {
    events: Vec<ProbeEvent>,
}

impl EventSink for RecordingSink {
    type Event = ProbeEvent;

    fn len(&self) -> usize {
        self.events.len()
    }

    fn truncate(&mut self, len: usize) {
        self.events.truncate(len);
    }

    fn push(&mut self, event: Self::Event) {
        self.events.push(event);
    }
}

fn emit<'i, S>(run: &mut Run<'i, S>, label: &'static str)
where
    S: EventSink<Event = ProbeEvent>,
{
    let at = run.cursor().offset();
    run.emit(ProbeEvent { label, at });
}

fn eventful_literal<'i, S>(
    run: &mut Run<'i, S>,
    label: &'static str,
    expected: &[u8],
) -> Step<'i, Span<'i>>
where
    S: EventSink<Event = ProbeEvent>,
{
    emit(run, label);
    literal(run, expected)
}

fn stalled<'i, S>(run: &mut Run<'i, S>) -> Step<'i, usize>
where
    S: EventSink,
{
    repeat(run, 0, None, |run| literal(run, b""))
}

fn mismatch<'i>(step: Step<'i, Span<'i>>) -> Failure<'i> {
    match step {
        Step::Mismatch(failure) => failure,
        other => panic!("expected mismatch, got {other:?}"),
    }
}

fn fault<'i, T>(step: Step<'i, T>) -> Fault<'i> {
    match step {
        Step::Fault(fault) => fault,
        Step::Matched(_) => panic!("expected fault, got match"),
        Step::Mismatch(failure) => {
            panic!("expected fault, got mismatch at {}", failure.at().offset())
        }
    }
}

#[test]
fn excluded_match_rejects_at_the_difference_entry_and_never_invokes_primary() {
    let prior = ProbeEvent {
        label: "prior",
        at: 0,
    };
    let mut run = Run::with_sink(
        Input::new(b"pblocked"),
        RecordingSink {
            events: vec![prior],
        },
    );

    assert!(matches!(
        run.parse_prefix(|run| literal(run, b"p")),
        Step::Matched(_)
    ));
    assert_eq!(run.cursor().offset(), 1);

    let primary_calls = Cell::new(0);
    let outcome = run.parse_prefix(|run| {
        difference(
            run,
            |run| {
                primary_calls.set(primary_calls.get() + 1);
                eventful_literal(run, "primary-must-not-run", b"blocked")
            },
            |run| eventful_literal(run, "excluded-speculation", b"blocked"),
        )
    });

    assert!(
        matches!(outcome, Step::Mismatch(failure) if failure.at().offset() == 1),
        "exclusion match must synthesize its mismatch at the operation entry"
    );
    assert_eq!(primary_calls.get(), 0);
    assert_eq!(run.cursor().offset(), 1);
    assert_eq!(run.sink().events, vec![prior]);
}

#[test]
fn excluded_mismatch_rolls_back_its_probe_then_primary_success_commits() {
    let prior = ProbeEvent {
        label: "prior",
        at: 99,
    };
    let mut run = Run::with_sink(
        Input::new(b"allow"),
        RecordingSink {
            events: vec![prior],
        },
    );

    let outcome = run.parse_full(|run| {
        difference(
            run,
            |run| eventful_literal(run, "primary-commit", b"allow"),
            |run| eventful_literal(run, "excluded-rollback", b"deny"),
        )
    });

    assert!(matches!(outcome, Step::Matched(span) if span.as_bytes() == b"allow"));
    assert_eq!(run.cursor().offset(), 5);
    assert_eq!(
        run.sink().events,
        vec![
            prior,
            ProbeEvent {
                label: "primary-commit",
                at: 0,
            },
        ]
    );
}

#[test]
fn excluded_failure_position_does_not_contaminate_primary_diagnostics() {
    let mut run = Run::new(Input::new(b"aby"));
    let outcome = run.parse_prefix(|run| {
        difference(
            run,
            |run| {
                sequence(run, |run| match literal(run, b"a") {
                    Step::Matched(_) => literal(run, b"x"),
                    Step::Mismatch(failure) => Step::Mismatch(failure),
                    Step::Fault(fault) => Step::Fault(fault),
                })
            },
            |run| {
                sequence(run, |run| match literal(run, b"ab") {
                    Step::Matched(_) => literal(run, b"z"),
                    Step::Mismatch(failure) => Step::Mismatch(failure),
                    Step::Fault(fault) => Step::Fault(fault),
                })
            },
        )
    });

    assert!(
        matches!(outcome, Step::Mismatch(failure) if failure.at().offset() == 1),
        "the excluded failure at offset 2 must be discarded in favor of the primary failure"
    );
    assert_eq!(run.cursor().offset(), 0);
}

#[test]
fn excluded_fault_rolls_back_and_never_invokes_primary() {
    let prior = ProbeEvent {
        label: "prior",
        at: 99,
    };
    let mut run = Run::with_sink(
        Input::new(b"x"),
        RecordingSink {
            events: vec![prior],
        },
    );
    let primary_calls = Cell::new(0);

    let outcome = run.parse_prefix(|run| {
        difference(
            run,
            |run| {
                primary_calls.set(primary_calls.get() + 1);
                eventful_literal(run, "primary-must-not-run", b"x")
            },
            |run| {
                emit(run, "excluded-fault-rollback");
                stalled(run)
            },
        )
    });

    assert!(matches!(
        outcome,
        Step::Fault(Fault::StalledRepeat { at }) if at.offset() == 0
    ));
    assert_eq!(primary_calls.get(), 0);
    assert_eq!(run.cursor().offset(), 0);
    assert_eq!(run.sink().events, vec![prior]);
}

#[test]
fn primary_fault_rolls_back_exclusion_and_primary_speculation() {
    let prior = ProbeEvent {
        label: "prior",
        at: 99,
    };
    let mut run = Run::with_sink(
        Input::new(b"x"),
        RecordingSink {
            events: vec![prior],
        },
    );

    let outcome = run.parse_prefix(|run| {
        difference(
            run,
            |run| {
                emit(run, "primary-fault-rollback");
                stalled(run)
            },
            |run| eventful_literal(run, "excluded-mismatch-rollback", b"z"),
        )
    });

    assert!(matches!(
        outcome,
        Step::Fault(Fault::StalledRepeat { at }) if at.offset() == 0
    ));
    assert_eq!(run.cursor().offset(), 0);
    assert_eq!(run.sink().events, vec![prior]);
}

#[test]
fn failing_primary_restores_cursor_and_every_speculative_event() {
    let prior = ProbeEvent {
        label: "prior",
        at: 99,
    };
    let mut run = Run::with_sink(
        Input::new(b"ab"),
        RecordingSink {
            events: vec![prior],
        },
    );

    let outcome = run.parse_prefix(|run| {
        difference(
            run,
            |run| {
                sequence(run, |run| {
                    emit(run, "primary-rollback");
                    match literal(run, b"a") {
                        Step::Matched(_) => literal(run, b"x"),
                        Step::Mismatch(failure) => Step::Mismatch(failure),
                        Step::Fault(fault) => Step::Fault(fault),
                    }
                })
            },
            |run| eventful_literal(run, "excluded-rollback", b"z"),
        )
    });

    assert!(matches!(
        outcome,
        Step::Mismatch(failure) if failure.at().offset() == 1
    ));
    assert_eq!(run.cursor().offset(), 0);
    assert_eq!(run.sink().events, vec![prior]);
}

#[test]
fn nullable_exclusion_blocks_primary_without_leaking_events() {
    let mut run = Run::with_sink(Input::new(b"x"), RecordingSink::default());
    let primary_calls = Cell::new(0);

    let outcome = run.parse_prefix(|run| {
        difference(
            run,
            |run| {
                primary_calls.set(primary_calls.get() + 1);
                eventful_literal(run, "primary-must-not-run", b"x")
            },
            |run| eventful_literal(run, "nullable-exclusion", b""),
        )
    });

    assert!(matches!(
        outcome,
        Step::Mismatch(failure) if failure.at().offset() == 0
    ));
    assert_eq!(primary_calls.get(), 0);
    assert_eq!(run.cursor().offset(), 0);
    assert!(run.sink().events.is_empty());
}

#[test]
fn foreign_exclusion_failure_and_fault_become_entry_position_faults() {
    let foreign_input = Input::new(b"foreign");
    let mut foreign_mismatch_run = Run::new(foreign_input);
    let foreign_failure =
        mismatch(foreign_mismatch_run.parse_prefix(|run| literal(run, b"not-foreign")));
    let mut foreign_fault_run = Run::new(foreign_input);
    let foreign_fault = fault(foreign_fault_run.parse_prefix(stalled));

    for excluded in [
        Step::<Span<'_>>::Mismatch(foreign_failure),
        Step::<Span<'_>>::Fault(foreign_fault),
    ] {
        let prior = ProbeEvent {
            label: "prior",
            at: 99,
        };
        let mut run = Run::with_sink(
            Input::new(b"local"),
            RecordingSink {
                events: vec![prior],
            },
        );
        let primary_calls = Cell::new(0);
        let outcome = run.parse_prefix(|run| {
            difference(
                run,
                |run| {
                    primary_calls.set(primary_calls.get() + 1);
                    eventful_literal(run, "primary-must-not-run", b"local")
                },
                |run| {
                    emit(run, "foreign-exclusion-rollback");
                    excluded
                },
            )
        });

        assert!(matches!(
            outcome,
            Step::Fault(Fault::ForeignOutcome { at }) if at.offset() == 0
        ));
        assert_eq!(primary_calls.get(), 0);
        assert_eq!(run.cursor().offset(), 0);
        assert_eq!(run.sink().events, vec![prior]);
    }
}

#[test]
fn foreign_primary_failure_and_fault_become_entry_position_faults() {
    let foreign_input = Input::new(b"foreign");
    let mut foreign_mismatch_run = Run::new(foreign_input);
    let foreign_failure =
        mismatch(foreign_mismatch_run.parse_prefix(|run| literal(run, b"not-foreign")));
    let mut foreign_fault_run = Run::new(foreign_input);
    let foreign_fault = fault(foreign_fault_run.parse_prefix(stalled));

    for primary in [
        Step::<Span<'_>>::Mismatch(foreign_failure),
        Step::<Span<'_>>::Fault(foreign_fault),
    ] {
        let prior = ProbeEvent {
            label: "prior",
            at: 99,
        };
        let mut run = Run::with_sink(
            Input::new(b"local"),
            RecordingSink {
                events: vec![prior],
            },
        );
        let outcome = run.parse_prefix(|run| {
            difference(
                run,
                |run| {
                    emit(run, "foreign-primary-rollback");
                    primary
                },
                |run| eventful_literal(run, "excluded-mismatch-rollback", b"z"),
            )
        });

        assert!(matches!(
            outcome,
            Step::Fault(Fault::ForeignOutcome { at }) if at.offset() == 0
        ));
        assert_eq!(run.cursor().offset(), 0);
        assert_eq!(run.sink().events, vec![prior]);
    }
}

fn parity_parser<'i, S>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>>
where
    S: EventSink<Event = ProbeEvent>,
{
    difference(
        run,
        |run| eventful_literal(run, "primary", b"allow"),
        |run| eventful_literal(run, "excluded", b"deny"),
    )
}

#[test]
fn retaining_and_discarding_sinks_have_identical_outcomes_and_counts() {
    for input in [b"allow".as_slice(), b"deny".as_slice(), b"other".as_slice()] {
        let mut retained = Run::with_sink(Input::new(input), RecordingSink::default());
        let retained_outcome = retained.parse_prefix(parity_parser);
        let retained_offset = retained.cursor().offset();
        let retained_count = retained.sink().len();

        let mut discarded = Run::discarding::<ProbeEvent>(Input::new(input));
        let discarded_outcome = discarded.parse_prefix(parity_parser);
        let discarded_offset = discarded.cursor().offset();
        let discarded_count = discarded.sink().len();

        assert_eq!(
            outcome_view(retained_outcome),
            outcome_view(discarded_outcome)
        );
        assert_eq!(retained_offset, discarded_offset);
        assert_eq!(retained_count, discarded_count);
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum OutcomeView {
    Matched { start: usize, end: usize },
    Mismatch { at: usize },
    Fault { at: usize, kind: &'static str },
}

fn outcome_view(step: Step<'_, Span<'_>>) -> OutcomeView {
    match step {
        Step::Matched(span) => OutcomeView::Matched {
            start: span.start(),
            end: span.end(),
        },
        Step::Mismatch(failure) => OutcomeView::Mismatch {
            at: failure.at().offset(),
        },
        Step::Fault(fault) => OutcomeView::Fault {
            at: fault.at().offset(),
            kind: match fault {
                Fault::StalledRepeat { .. } => "stalled-repeat",
                Fault::ForeignOutcome { .. } => "foreign-outcome",
                Fault::FullParseAfterProgress { .. } => "full-after-progress",
                Fault::ResourceLimit {
                    kind: ResourceKind::InputBytes,
                    ..
                } => "input-bytes",
                Fault::ResourceLimit {
                    kind: ResourceKind::Nesting,
                    ..
                } => "nesting",
                Fault::ResourceLimit {
                    kind: ResourceKind::Work,
                    ..
                } => "work",
                Fault::ResourceLimit {
                    kind: ResourceKind::Events,
                    ..
                } => "events",
                _ => "other",
            },
        },
    }
}
