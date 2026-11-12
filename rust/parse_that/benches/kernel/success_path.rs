//! The kernel's success path, for the paired parent-vs-cure cell of
//! sk-v27 LW3.COMP-4b (S12-P4-6): a generated-shaped JSON recognizer over
//! `parse_that::kernel`, written only against the API that ABI 3 and ABI 4
//! share, so the same file builds on the parent (the COMP-1a tree, ABI 3)
//! and on the cure (ABI 4, where `Failure` carries the expected set).
//!
//! The cell reads the success path only: every input parses. It is a timing
//! cell, so it is read only inside the bench window (X-7, DIG-QW).

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use divan::counter::BytesCount;
use divan::{Bencher, black_box};
use parse_that::kernel::{
    Input, RegexPlan, RegexTerminal, Run, Span, Step, choice, literal, regex, repeat, sequence,
};

fn main() {
    divan::main();
}

const fn class_table(members: &[(u8, u8)]) -> [u8; 256] {
    let mut classes = [1_u8; 256];
    let mut i = 0;
    while i < members.len() {
        let (lo, hi) = members[i];
        let mut b = lo;
        while b <= hi {
            classes[b as usize] = 0;
            if b == 255 {
                break;
            }
            b += 1;
        }
        i += 1;
    }
    classes
}

// `[ \t\n\r]*` and `[0-9]+` and a string body `[^"\\]*`, as two-state tables.
static WS_CLASSES: [u8; 256] =
    class_table(&[(b' ', b' '), (b'\t', b'\t'), (b'\n', b'\n'), (b'\r', b'\r')]);
static WS_TRANSITIONS: [u32; 2] = [0, RegexPlan::DEAD];
static WS_ACCEPTING: [bool; 1] = [true];
static WS: RegexPlan<'static> =
    match RegexPlan::new(&WS_CLASSES, 1, 2, 0, &WS_TRANSITIONS, &WS_ACCEPTING) {
        Ok(plan) => plan,
        Err(_) => panic!("whitespace plan"),
    };

static DIGIT_CLASSES: [u8; 256] =
    class_table(&[(b'0', b'9'), (b'-', b'-'), (b'.', b'.'), (b'e', b'e')]);
static DIGIT_TRANSITIONS: [u32; 4] = [1, RegexPlan::DEAD, 1, RegexPlan::DEAD];
static DIGIT_ACCEPTING: [bool; 2] = [false, true];
static DIGITS: RegexPlan<'static> = match RegexPlan::new(
    &DIGIT_CLASSES,
    2,
    2,
    0,
    &DIGIT_TRANSITIONS,
    &DIGIT_ACCEPTING,
) {
    Ok(plan) => plan,
    Err(_) => panic!("number plan"),
};

static BODY_CLASSES: [u8; 256] = {
    let mut classes = [0_u8; 256];
    classes[b'"' as usize] = 1;
    classes[b'\\' as usize] = 1;
    classes
};
static BODY_TRANSITIONS: [u32; 2] = [0, RegexPlan::DEAD];
static BODY_ACCEPTING: [bool; 1] = [true];
static BODY: RegexPlan<'static> =
    match RegexPlan::new(&BODY_CLASSES, 1, 2, 0, &BODY_TRANSITIONS, &BODY_ACCEPTING) {
        Ok(plan) => plan,
        Err(_) => panic!("string body plan"),
    };

fn ws<'i>(run: &mut Run<'i>) -> Step<'i, Span<'i>> {
    regex(run, &RegexTerminal::new(WS))
}

fn token<'i>(run: &mut Run<'i>, bytes: &'static [u8]) -> Step<'i, Span<'i>> {
    sequence(run, |run| {
        let Step::Matched(_) = ws(run) else {
            unreachable!("whitespace is nullable")
        };
        literal(run, bytes)
    })
}

macro_rules! then {
    ($step:expr) => {
        match $step {
            Step::Matched(value) => value,
            Step::Mismatch(failure) => return Step::Mismatch(failure),
            Step::Fault(fault) => return Step::Fault(fault),
        }
    };
}

fn string<'i>(run: &mut Run<'i>) -> Step<'i, ()> {
    sequence(run, |run| {
        then!(token(run, b"\""));
        then!(regex(run, &RegexTerminal::new(BODY)));
        then!(literal(run, b"\""));
        Step::Matched(())
    })
}

fn number<'i>(run: &mut Run<'i>) -> Step<'i, ()> {
    sequence(run, |run| {
        then!(ws(run));
        then!(regex(run, &RegexTerminal::new(DIGITS)));
        Step::Matched(())
    })
}

fn members<'i, F>(run: &mut Run<'i>, close: &'static [u8], mut item: F) -> Step<'i, ()>
where
    F: FnMut(&mut Run<'i>) -> Step<'i, ()>,
{
    choice(
        run,
        |run| {
            sequence(run, |run| {
                then!(item(run));
                then!(repeat(run, 0, None, |run| {
                    sequence(run, |run| {
                        then!(token(run, b","));
                        item(run)
                    })
                }));
                then!(token(run, close));
                Step::Matched(())
            })
        },
        |run| {
            then!(token(run, close));
            Step::Matched(())
        },
    )
}

fn value<'i>(run: &mut Run<'i>) -> Step<'i, ()> {
    choice(
        run,
        |run| {
            sequence(run, |run| {
                then!(token(run, b"{"));
                members(run, b"}", |run| {
                    sequence(run, |run| {
                        then!(string(run));
                        then!(token(run, b":"));
                        value(run)
                    })
                })
            })
        },
        |run| {
            choice(
                run,
                |run| {
                    sequence(run, |run| {
                        then!(token(run, b"["));
                        members(run, b"]", value)
                    })
                },
                |run| {
                    choice(run, string, |run| {
                        choice(run, number, |run| {
                            choice(
                                run,
                                |run| unit(token(run, b"true")),
                                |run| {
                                    choice(
                                        run,
                                        |run| unit(token(run, b"false")),
                                        |run| unit(token(run, b"null")),
                                    )
                                },
                            )
                        })
                    })
                },
            )
        },
    )
}

fn unit<'i>(step: Step<'i, Span<'i>>) -> Step<'i, ()> {
    match step {
        Step::Matched(_) => Step::Matched(()),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    }
}

fn document(depth: usize, width: usize) -> String {
    fn node(out: &mut String, depth: usize, width: usize) {
        if depth == 0 {
            out.push_str("[1, -2.5e3, \"leaf\", true, false, null]");
            return;
        }
        out.push('{');
        for i in 0..width {
            if i > 0 {
                out.push_str(", ");
            }
            out.push_str(&format!("\"k{i}\": "));
            node(out, depth - 1, width);
        }
        out.push('}');
    }
    let mut out = String::new();
    node(&mut out, depth, width);
    out
}

#[divan::bench(args = [(3, 4), (4, 6), (5, 6)])]
fn success_path(bencher: Bencher, shape: (usize, usize)) {
    let text = document(shape.0, shape.1);
    let bytes = text.as_bytes();
    let mut run = Run::new(Input::new(bytes));
    assert!(matches!(run.parse_full(value), Step::Matched(())));
    bencher.counter(BytesCount::new(bytes.len())).bench(|| {
        let mut run = Run::new(Input::new(black_box(bytes)));
        black_box(run.parse_full(value))
    });
}
