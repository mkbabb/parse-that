use parse_that::kernel::{
    EventSink, Fault, Input, Run, Span, Step, choice, literal, repeat, sequence,
};

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

fn speculative<'i>(run: &mut Run<'i, RecordingSink>) -> Step<'i, Span<'i>> {
    sequence(run, |run| {
        match literal(run, b"a") {
            Step::Matched(_) => {}
            Step::Mismatch(failure) => return Step::Mismatch(failure),
            Step::Fault(fault) => return Step::Fault(fault),
        }
        run.emit(ProbeEvent {
            label: "speculative",
            at: run.cursor().offset(),
        });
        literal(run, b"x")
    })
}

fn fallback<'i>(run: &mut Run<'i, RecordingSink>) -> Step<'i, Span<'i>> {
    literal(run, b"ab")
}

#[test]
fn failed_alternative_rolls_back_cursor_and_append_only_sink() {
    let mut run = Run::with_sink(Input::new(b"ab"), RecordingSink::default());
    let outcome = run.parse_full(|run| choice(run, speculative, fallback));

    assert!(matches!(outcome, Step::Matched(_)));
    assert_eq!(run.cursor().offset(), 2);
    assert!(
        run.sink().events.is_empty(),
        "event from failed alternative leaked"
    );
}

#[test]
fn successful_sequence_commits_its_events() {
    let mut run = Run::with_sink(Input::new(b"ab"), RecordingSink::default());
    let outcome = run.parse_full(|run| {
        sequence(run, |run| {
            match literal(run, b"a") {
                Step::Matched(_) => {}
                Step::Mismatch(failure) => return Step::Mismatch(failure),
                Step::Fault(fault) => return Step::Fault(fault),
            }
            run.emit(ProbeEvent {
                label: "kept",
                at: run.cursor().offset(),
            });
            literal(run, b"b")
        })
    });

    assert!(matches!(outcome, Step::Matched(_)));
    assert_eq!(
        run.sink().events,
        vec![ProbeEvent {
            label: "kept",
            at: 1
        }]
    );
}

#[test]
fn retained_output_can_be_recovered_without_clone_or_allocation() {
    let mut run = Run::with_sink(Input::new(b"a"), RecordingSink::default());
    assert!(matches!(
        run.parse_full(|run| {
            let span = match literal(run, b"a") {
                Step::Matched(span) => span,
                Step::Mismatch(failure) => return Step::Mismatch(failure),
                Step::Fault(fault) => return Step::Fault(fault),
            };
            run.emit(ProbeEvent {
                label: "owned",
                at: span.end(),
            });
            Step::Matched(span)
        }),
        Step::Matched(_)
    ));

    let sink = run.into_sink();
    assert_eq!(
        sink.events,
        vec![ProbeEvent {
            label: "owned",
            at: 1
        }]
    );
}

fn eventful_scalar<'i, S>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>>
where
    S: EventSink<Event = ProbeEvent>,
{
    let span = match literal(run, b"a") {
        Step::Matched(span) => span,
        Step::Mismatch(failure) => return Step::Mismatch(failure),
        Step::Fault(fault) => return Step::Fault(fault),
    };
    run.emit_with(|| ProbeEvent {
        label: "scalar",
        at: span.end(),
    });
    Step::Matched(span)
}

#[test]
fn one_eventful_parser_runs_unchanged_with_discarding_and_retaining_sinks() {
    let mut discarded = Run::discarding::<ProbeEvent>(Input::new(b"a"));
    assert!(matches!(
        discarded.parse_full(eventful_scalar),
        Step::Matched(_)
    ));
    assert_eq!(discarded.sink().len(), 1);

    let mut retained = Run::with_sink(Input::new(b"a"), RecordingSink::default());
    assert!(matches!(
        retained.parse_full(eventful_scalar),
        Step::Matched(_)
    ));
    assert_eq!(
        retained.into_sink().events,
        vec![ProbeEvent {
            label: "scalar",
            at: 1
        }]
    );
}

#[test]
fn discarding_sink_counts_only_transactionally_retained_events() {
    fn speculative<'i>(
        run: &mut Run<'i, parse_that::kernel::NoSink<ProbeEvent>>,
    ) -> Step<'i, Span<'i>> {
        sequence(run, |run| {
            let at = run.cursor().offset();
            run.emit_with(|| ProbeEvent {
                label: "discarded",
                at,
            });
            literal(run, b"x")
        })
    }

    fn fallback<'i>(
        run: &mut Run<'i, parse_that::kernel::NoSink<ProbeEvent>>,
    ) -> Step<'i, Span<'i>> {
        let span = match literal(run, b"ab") {
            Step::Matched(span) => span,
            Step::Mismatch(failure) => return Step::Mismatch(failure),
            Step::Fault(fault) => return Step::Fault(fault),
        };
        run.emit_with(|| ProbeEvent {
            label: "retained",
            at: span.end(),
        });
        Step::Matched(span)
    }

    let mut run = Run::discarding::<ProbeEvent>(Input::new(b"ab"));
    assert!(matches!(
        run.parse_full(|run| choice(run, speculative, fallback)),
        Step::Matched(_)
    ));
    assert_eq!(run.sink().len(), 1);
}

fn faulting_branch<'i>(run: &mut Run<'i, RecordingSink>) -> Step<'i, usize> {
    sequence(run, |run| {
        run.emit(ProbeEvent {
            label: "rolled-back-fault",
            at: run.cursor().offset(),
        });
        repeat(run, 0, None, |run| literal(run, b""))
    })
}

fn forbidden_fallback<'i>(run: &mut Run<'i, RecordingSink>) -> Step<'i, usize> {
    run.emit(ProbeEvent {
        label: "must-not-run",
        at: run.cursor().offset(),
    });
    match literal(run, b"ab") {
        Step::Matched(_) => Step::Matched(1),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    }
}

#[test]
fn fault_rolls_back_and_never_tries_a_sibling_choice() {
    let mut run = Run::with_sink(Input::new(b"ab"), RecordingSink::default());
    let outcome = run.parse_prefix(|run| choice(run, faulting_branch, forbidden_fallback));

    assert!(matches!(outcome, Step::Fault(Fault::StalledRepeat { .. })));
    assert_eq!(run.cursor().offset(), 0);
    assert!(run.sink().events.is_empty());
}

fn eventful_a<'i>(run: &mut Run<'i, RecordingSink>) -> Step<'i, Span<'i>> {
    run.emit(ProbeEvent {
        label: "attempt-a",
        at: run.cursor().offset(),
    });
    literal(run, b"a")
}

#[test]
fn repeat_discards_the_terminating_mismatch_iteration_events() {
    let mut run = Run::with_sink(Input::new(b"aab"), RecordingSink::default());
    assert!(matches!(
        run.parse_prefix(|run| repeat(run, 0, None, eventful_a)),
        Step::Matched(2)
    ));
    assert_eq!(
        run.sink().events,
        vec![
            ProbeEvent {
                label: "attempt-a",
                at: 0,
            },
            ProbeEvent {
                label: "attempt-a",
                at: 1,
            },
        ]
    );
}

#[test]
fn below_minimum_repeat_restores_the_whole_transaction_and_prior_sink_prefix() {
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
    assert!(matches!(
        run.parse_prefix(|run| repeat(run, 2, None, eventful_a)),
        Step::Mismatch(_)
    ));
    assert_eq!(run.cursor().offset(), 0);
    assert_eq!(run.sink().events, vec![prior]);
}

#[test]
fn trailing_input_full_failure_restores_emitted_events_and_prior_prefix() {
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
    assert!(matches!(
        run.parse_full(|run| {
            let span = match literal(run, b"a") {
                Step::Matched(span) => span,
                Step::Mismatch(failure) => return Step::Mismatch(failure),
                Step::Fault(fault) => return Step::Fault(fault),
            };
            run.emit(ProbeEvent {
                label: "rolled-back-trailing",
                at: span.end(),
            });
            Step::Matched(span)
        }),
        Step::Mismatch(_)
    ));
    assert_eq!(run.cursor().offset(), 0);
    assert_eq!(run.sink().events, vec![prior]);
}

#[test]
fn fault_in_right_choice_branch_rolls_back_without_retry() {
    let mut run = Run::with_sink(Input::new(b"a"), RecordingSink::default());
    let outcome = run.parse_prefix(|run| {
        choice(
            run,
            |run| match literal(run, b"z") {
                Step::Matched(_) => Step::Matched(0),
                Step::Mismatch(failure) => Step::Mismatch(failure),
                Step::Fault(fault) => Step::Fault(fault),
            },
            |run| {
                sequence(run, |run| {
                    run.emit(ProbeEvent {
                        label: "right-fault",
                        at: run.cursor().offset(),
                    });
                    repeat(run, 0, None, |run| literal(run, b""))
                })
            },
        )
    });

    assert!(matches!(outcome, Step::Fault(Fault::StalledRepeat { .. })));
    assert_eq!(run.cursor().offset(), 0);
    assert!(run.sink().events.is_empty());
}

#[test]
fn nested_transaction_failure_restores_only_the_preexisting_prefix() {
    let prior = ProbeEvent {
        label: "prior",
        at: 99,
    };
    let mut run = Run::with_sink(
        Input::new(b"a"),
        RecordingSink {
            events: vec![prior],
        },
    );
    let outcome = run.parse_prefix(|run| {
        sequence(run, |run| {
            run.emit(ProbeEvent {
                label: "outer",
                at: 0,
            });
            sequence(run, |run| {
                run.emit(ProbeEvent {
                    label: "inner",
                    at: 0,
                });
                literal(run, b"z")
            })
        })
    });

    assert!(matches!(outcome, Step::Mismatch(_)));
    assert_eq!(run.cursor().offset(), 0);
    assert_eq!(run.sink().events, vec![prior]);
}
