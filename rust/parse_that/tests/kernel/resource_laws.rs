use std::cell::Cell;

use parse_that::kernel::{EventSink, Fault, Input, ResourceKind, Run, Span, Step, choice, literal};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
struct ResourceEvent {
    label: &'static str,
    at: usize,
}

#[derive(Debug, Default)]
struct RecordingSink {
    events: Vec<ResourceEvent>,
}

impl EventSink for RecordingSink {
    type Event = ResourceEvent;

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

#[test]
fn each_generic_resource_kind_preserves_its_usize_limit_and_absolute_evidence() {
    let cases = [
        ResourceKind::InputBytes,
        ResourceKind::Nesting,
        ResourceKind::Work,
        ResourceKind::Events,
    ];

    for (index, kind) in cases.into_iter().enumerate() {
        let input = Input::new(b"x");
        let limit = usize::MAX - index;
        let result = Run::new(input).parse_module(|run| {
            Step::<Span<'_>>::Fault(Fault::ResourceLimit {
                at: run.cursor(),
                kind,
                limit,
            })
        });

        match result.outcome() {
            Step::Fault(Fault::ResourceLimit {
                at,
                kind: actual_kind,
                limit: actual_limit,
            }) => {
                assert_eq!(*at, input.start());
                assert_eq!(*actual_kind, kind);
                assert_eq!(*actual_limit, limit);
            }
            other => panic!("expected {kind:?} resource fault, got {other:?}"),
        }
    }
}

#[test]
fn resource_fault_rolls_back_events_and_never_tries_a_choice_sibling() {
    for kind in [
        ResourceKind::InputBytes,
        ResourceKind::Nesting,
        ResourceKind::Work,
        ResourceKind::Events,
    ] {
        let sibling_called = Cell::new(false);
        let prior = ResourceEvent {
            label: "prior",
            at: 99,
        };
        let input = Input::new(b"ab");
        let result = Run::with_sink(
            input,
            RecordingSink {
                events: vec![prior],
            },
        )
        .parse_module(|run| {
            choice(
                run,
                |run| {
                    let span = match literal(run, b"a") {
                        Step::Matched(span) => span,
                        Step::Mismatch(failure) => return Step::Mismatch(failure),
                        Step::Fault(fault) => return Step::Fault(fault),
                    };
                    run.emit(ResourceEvent {
                        label: "must-roll-back",
                        at: span.end(),
                    });
                    Step::Fault(Fault::ResourceLimit {
                        at: run.cursor(),
                        kind,
                        limit: 64,
                    })
                },
                |run| {
                    sibling_called.set(true);
                    run.emit(ResourceEvent {
                        label: "must-not-run",
                        at: run.cursor().offset(),
                    });
                    literal(run, b"ab")
                },
            )
        });

        match result.outcome() {
            Step::Fault(Fault::ResourceLimit {
                at,
                kind: actual_kind,
                limit,
            }) => {
                assert_eq!(at.offset(), 1);
                assert_eq!(*actual_kind, kind);
                assert_eq!(*limit, 64);
            }
            other => panic!("expected {kind:?} resource fault, got {other:?}"),
        }
        assert!(!sibling_called.get(), "fault tried a sibling for {kind:?}");
        assert_eq!(result.sink().events, vec![prior]);
    }
}
