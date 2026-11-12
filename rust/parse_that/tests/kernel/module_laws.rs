use parse_that::kernel::{
    EventSink, Fault, Input, ResourceKind, Run, Span, Step, eof, literal, repeat,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct ModuleEvent {
    label: &'static str,
    at: usize,
}

#[derive(Debug, Default, Eq, PartialEq)]
struct RecordingSink {
    events: Vec<ModuleEvent>,
}

impl EventSink for RecordingSink {
    type Event = ModuleEvent;

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

fn prior_event() -> ModuleEvent {
    ModuleEvent {
        label: "prior",
        at: 99,
    }
}

fn sink_with_prior_event() -> RecordingSink {
    RecordingSink {
        events: vec![prior_event()],
    }
}

#[test]
fn module_success_returns_the_original_input_typed_outcome_and_retained_sink() {
    let bytes = Vec::from(&b"ab"[..]);
    let input = Input::new(&bytes);
    let result = Run::with_sink(input, RecordingSink::default()).parse_module(|run| {
        let first = match literal(run, b"a") {
            Step::Matched(span) => span,
            Step::Mismatch(failure) => return Step::Mismatch(failure),
            Step::Fault(fault) => return Step::Fault(fault),
        };
        run.emit(ModuleEvent {
            label: "accepted",
            at: first.end(),
        });
        match literal(run, b"b") {
            Step::Matched(_) => Step::Matched(first),
            Step::Mismatch(failure) => Step::Mismatch(failure),
            Step::Fault(fault) => Step::Fault(fault),
        }
    });

    assert_eq!(result.input().bytes().as_ptr(), bytes.as_ptr());
    assert_eq!(result.input().start(), input.start());
    match result.outcome() {
        Step::Matched(span) => assert_eq!(span.as_bytes(), b"ab"),
        other => panic!("expected a complete module match, got {other:?}"),
    }
    assert_eq!(
        result.sink().events,
        vec![ModuleEvent {
            label: "accepted",
            at: 1,
        }]
    );

    let (returned_input, outcome, sink) = result.into_parts();
    assert_eq!(returned_input.start(), input.start());
    assert!(matches!(outcome, Step::Matched(span) if span.as_bytes() == b"ab"));
    assert_eq!(
        sink.events,
        vec![ModuleEvent {
            label: "accepted",
            at: 1,
        }]
    );
}

#[test]
fn module_trailing_input_is_a_full_parse_mismatch_and_restores_the_sink() {
    let input = Input::new(b"ab");
    let result = Run::with_sink(input, sink_with_prior_event()).parse_module(|run| {
        let span = match literal(run, b"a") {
            Step::Matched(span) => span,
            Step::Mismatch(failure) => return Step::Mismatch(failure),
            Step::Fault(fault) => return Step::Fault(fault),
        };
        run.emit(ModuleEvent {
            label: "trailing",
            at: span.end(),
        });
        Step::Matched(span)
    });

    match result.outcome() {
        Step::Mismatch(failure) => assert_eq!(failure.at().offset(), 1),
        other => panic!("expected trailing-input mismatch, got {other:?}"),
    }
    assert_eq!(result.input().start(), input.start());
    assert_eq!(result.sink().events, vec![prior_event()]);
}

#[test]
fn module_parser_mismatch_restores_cursor_transaction_and_sink() {
    let input = Input::new(b"ab");
    let result = Run::with_sink(input, sink_with_prior_event()).parse_module(|run| {
        let span = match literal(run, b"a") {
            Step::Matched(span) => span,
            Step::Mismatch(failure) => return Step::Mismatch(failure),
            Step::Fault(fault) => return Step::Fault(fault),
        };
        run.emit(ModuleEvent {
            label: "mismatch",
            at: span.end(),
        });
        literal(run, b"z")
    });

    match result.outcome() {
        Step::Mismatch(failure) => assert_eq!(failure.at().offset(), 1),
        other => panic!("expected parser mismatch, got {other:?}"),
    }
    assert_eq!(result.sink().events, vec![prior_event()]);
}

#[test]
fn module_parser_fault_restores_cursor_transaction_and_sink() {
    let input = Input::new(b"a");
    let result = Run::with_sink(input, sink_with_prior_event()).parse_module(|run| {
        let span = match literal(run, b"a") {
            Step::Matched(span) => span,
            Step::Mismatch(failure) => return Step::Mismatch(failure),
            Step::Fault(fault) => return Step::Fault(fault),
        };
        run.emit(ModuleEvent {
            label: "fault",
            at: span.end(),
        });
        repeat(run, 0, None, |run| literal(run, b""))
    });

    match result.outcome() {
        Step::Fault(Fault::StalledRepeat { at }) => assert_eq!(at.offset(), 1),
        other => panic!("expected parser fault, got {other:?}"),
    }
    assert_eq!(result.sink().events, vec![prior_event()]);
}

#[test]
fn module_localizes_foreign_failure_evidence_at_its_own_entry() {
    let primary_input = Input::new(b"primary");
    let foreign_input = Input::new(b"foreign");
    let mut foreign = Run::new(foreign_input);
    let result = Run::with_sink(primary_input, sink_with_prior_event()).parse_module(|run| {
        run.emit(ModuleEvent {
            label: "foreign-failure",
            at: run.cursor().offset(),
        });
        literal(&mut foreign, b"x")
    });

    match result.outcome() {
        Step::Fault(Fault::ForeignOutcome { at }) => {
            assert_eq!(*at, primary_input.start());
            assert_ne!(*at, foreign_input.start());
        }
        other => panic!("expected localized foreign failure, got {other:?}"),
    }
    assert_eq!(result.sink().events, vec![prior_event()]);
}

#[test]
fn module_localizes_foreign_fault_evidence_at_its_own_entry() {
    let primary_input = Input::new(b"primary");
    let foreign_input = Input::new(b"foreign");
    let result = Run::with_sink(primary_input, sink_with_prior_event()).parse_module(|run| {
        run.emit(ModuleEvent {
            label: "foreign-fault",
            at: run.cursor().offset(),
        });
        Step::<Span<'_>>::Fault(Fault::ResourceLimit {
            at: foreign_input.start(),
            kind: ResourceKind::Work,
            limit: 17,
        })
    });

    match result.outcome() {
        Step::Fault(Fault::ForeignOutcome { at }) => {
            assert_eq!(*at, primary_input.start());
            assert_ne!(*at, foreign_input.start());
        }
        other => panic!("expected localized foreign fault, got {other:?}"),
    }
    assert_eq!(result.sink().events, vec![prior_event()]);
}

#[test]
fn module_success_replaces_a_foreign_value_with_the_canonical_input_span() {
    let primary_bytes = Vec::from(&b"a"[..]);
    let foreign_bytes = Vec::from(&b"z"[..]);
    let primary = Input::new(&primary_bytes);
    let foreign = Input::new(&foreign_bytes);
    let foreign_span = foreign
        .span(foreign.start(), foreign.end())
        .expect("checked foreign span");

    let result = Run::new(primary).parse_module(|run| match literal(run, b"a") {
        Step::Matched(_) => Step::Matched(foreign_span),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    });

    match result.outcome() {
        Step::Matched(span) => {
            assert_eq!(
                *span,
                primary
                    .span(primary.start(), primary.end())
                    .expect("checked primary span")
            );
            assert_ne!(*span, foreign_span);
        }
        other => panic!("expected canonical module span, got {other:?}"),
    }
}

#[test]
fn empty_module_result_retains_source_identity_through_into_parts() {
    let primary_bytes = Vec::new();
    let other_bytes = Vec::new();
    let input = Input::new(&primary_bytes);
    let other = Input::new(&other_bytes);
    let result = Run::new(input).parse_module(eof);

    assert_eq!(result.input().start(), input.start());
    assert_ne!(result.input().start(), other.start());
    match result.outcome() {
        Step::Matched(span) => {
            assert_eq!(
                *span,
                input.span(input.start(), input.end()).expect("empty span")
            );
        }
        other => panic!("expected empty module match, got {other:?}"),
    }

    let (returned_input, outcome, _sink) = result.into_parts();
    assert_eq!(returned_input.start(), input.start());
    assert_ne!(returned_input.start(), other.start());
    assert!(matches!(
        outcome,
        Step::Matched(span)
            if span == input.span(input.start(), input.end()).expect("empty span")
    ));
}
