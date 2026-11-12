//! A deliberately small generated-shaped control.
//!
//! This is an isomorphic external API fixture, not generator output. Genuine
//! generator output is checked by the generator's own crossing gate.

use parse_that::kernel::{
    EventSink, Input, Run, Span, Step, choice, eof, literal, repeat, sequence,
};

macro_rules! matched {
    ($expression:expr) => {
        match $expression {
            Step::Matched(value) => value,
            Step::Mismatch(failure) => return Step::Mismatch(failure),
            Step::Fault(fault) => return Step::Fault(fault),
        }
    };
}

fn keyword<'i, S: EventSink>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>> {
    choice(
        run,
        |run| literal(run, b"let"),
        |run| literal(run, b"const"),
    )
}

fn name<'i, S: EventSink>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>> {
    choice(run, |run| literal(run, b"x"), |run| literal(run, b"y"))
}

fn value<'i, S: EventSink>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>> {
    choice(run, |run| literal(run, b"0"), |run| literal(run, b"1"))
}

fn assignment<'i, S: EventSink>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>> {
    sequence(run, |run| {
        let first = matched!(keyword(run));
        matched!(literal(run, b" "));
        matched!(name(run));
        matched!(literal(run, b"="));
        matched!(value(run));
        Step::Matched(first)
    })
}

fn assignment_tail<'i, S: EventSink>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>> {
    sequence(run, |run| {
        matched!(literal(run, b";"));
        assignment(run)
    })
}

fn document<'i, S: EventSink>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>> {
    sequence(run, |run| {
        let first = matched!(assignment(run));
        matched!(repeat(run, 0, None, assignment_tail));
        matched!(eof(run));
        Step::Matched(first)
    })
}

#[test]
fn direct_control_shape_accepts_and_rejects_without_a_runtime_graph() {
    let mut accepted = Run::new(Input::new(b"let x=0;const y=1"));
    assert!(matches!(accepted.parse_full(document), Step::Matched(_)));

    let mut rejected = Run::new(Input::new(b"let z=0"));
    assert!(matches!(rejected.parse_full(document), Step::Mismatch(_)));
    assert_eq!(rejected.cursor().offset(), 0);
}
