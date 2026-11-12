use parse_that_regex::{DEAD, Dfa};

use super::{EventSink, Failure, Run, Span, Step};

/// A checked, borrowed DFA table emitted at compile time.
///
/// This is the static form of a `parse-that-regex` automaton: generated code
/// writes a look-free [`Dfa`]'s byte classes, flat transitions and acceptance
/// as `static` arrays and checks them here in const context. A pattern with
/// look conditions is recognized through [`RegexTerminal::from_dfa`].
#[derive(Clone, Copy, Debug)]
pub struct RegexPlan<'p> {
    byte_classes: &'p [u8; 256],
    state_count: usize,
    class_count: usize,
    start_state: usize,
    transitions: &'p [u32],
    accepting: &'p [bool],
}

impl<'p> RegexPlan<'p> {
    pub const DEAD: u32 = u32::MAX;

    pub const fn new(
        byte_classes: &'p [u8; 256],
        state_count: usize,
        class_count: usize,
        start_state: usize,
        transitions: &'p [u32],
        accepting: &'p [bool],
    ) -> Result<Self, RegexPlanError> {
        if class_count == 0 || class_count > 256 {
            return Err(RegexPlanError::ClassCount);
        }
        if state_count == 0
            || state_count > u32::MAX as usize
            || start_state >= state_count
            || accepting.len() != state_count
        {
            return Err(RegexPlanError::StateShape);
        }

        let Some(expected_transitions) = state_count.checked_mul(class_count) else {
            return Err(RegexPlanError::TransitionShape);
        };
        if transitions.len() != expected_transitions {
            return Err(RegexPlanError::TransitionShape);
        }

        let mut byte = 0;
        while byte < byte_classes.len() {
            if byte_classes[byte] as usize >= class_count {
                return Err(RegexPlanError::ByteClass);
            }
            byte += 1;
        }

        let mut transition = 0;
        while transition < transitions.len() {
            let target = transitions[transition];
            if target != Self::DEAD && target as usize >= state_count {
                return Err(RegexPlanError::TransitionTarget);
            }
            transition += 1;
        }

        Ok(Self {
            byte_classes,
            state_count,
            class_count,
            start_state,
            transitions,
            accepting,
        })
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RegexPlanError {
    ClassCount,
    StateShape,
    ByteClass,
    TransitionShape,
    TransitionTarget,
}

/// A direct terminal backed by one checked regex plan.
#[derive(Clone, Copy, Debug)]
pub struct RegexTerminal<'p> {
    plan: Plan<'p>,
}

/// Where a terminal's automaton lives.
#[derive(Clone, Copy, Debug)]
enum Plan<'p> {
    /// A checked static table.
    Table(RegexPlan<'p>),
    /// `parse-that-regex`'s compiled automaton, walked by its own
    /// leftmost-first [`Dfa::find_at`] (look conditions included).
    Engine(&'p Dfa),
}

impl<'p> RegexTerminal<'p> {
    #[inline]
    pub const fn new(plan: RegexPlan<'p>) -> Self {
        Self {
            plan: Plan::Table(plan),
        }
    }

    /// A terminal over `parse-that-regex`'s compiled automaton.
    ///
    /// The automaton's fields are public, so its shape is checked once here:
    /// a recognition step never indexes outside the table it walks.
    pub fn from_dfa(dfa: &'p Dfa) -> Result<Self, RegexPlanError> {
        check_dfa(dfa)?;
        Ok(Self {
            plan: Plan::Engine(dfa),
        })
    }
}

fn check_dfa(dfa: &Dfa) -> Result<(), RegexPlanError> {
    let class_count = usize::from(dfa.num_classes);
    if class_count == 0 || class_count > 256 {
        return Err(RegexPlanError::ClassCount);
    }
    let state_count = dfa.states.len();
    if state_count == 0 || state_count > u32::MAX as usize {
        return Err(RegexPlanError::StateShape);
    }
    // State 0 is the start with no look-behind: the look-free walk begins
    // there, and every look-behind start names a state.
    if dfa.starts[0] != 0 || dfa.starts.iter().any(|&s| s as usize >= state_count) {
        return Err(RegexPlanError::StateShape);
    }
    if state_count.checked_mul(class_count) != Some(dfa.flat_transitions.len()) {
        return Err(RegexPlanError::TransitionShape);
    }
    if dfa
        .byte_classes
        .iter()
        .any(|&c| usize::from(c) >= class_count)
    {
        return Err(RegexPlanError::ByteClass);
    }
    if dfa
        .flat_transitions
        .iter()
        .any(|&t| t != DEAD && t as usize >= state_count)
    {
        return Err(RegexPlanError::TransitionTarget);
    }
    if dfa.states.iter().any(|state| {
        state
            .accept_when
            .as_ref()
            .is_some_and(|when| when.classes.len() != class_count)
    }) {
        return Err(RegexPlanError::StateShape);
    }
    Ok(())
}

pub fn literal<'i, S: EventSink>(run: &mut Run<'i, S>, expected: &[u8]) -> Step<'i, Span<'i>> {
    let start = run.offset;
    let Some(end) = start.checked_add(expected.len()) else {
        return Step::Mismatch(Failure::new(run.cursor()));
    };
    if run.input.bytes().get(start..end) == Some(expected) {
        run.offset = end;
        Step::Matched(run.input.span_unchecked(start, end))
    } else {
        Step::Mismatch(Failure::new(run.cursor()))
    }
}

pub fn eof<'i, S: EventSink>(run: &mut Run<'i, S>) -> Step<'i, Span<'i>> {
    if run.offset == run.input.len() {
        Step::Matched(run.input.span_unchecked(run.offset, run.offset))
    } else {
        Step::Mismatch(Failure::new(run.cursor()))
    }
}

pub fn regex<'i, S: EventSink>(
    run: &mut Run<'i, S>,
    terminal: &RegexTerminal<'_>,
) -> Step<'i, Span<'i>> {
    let plan = match terminal.plan {
        Plan::Table(plan) => plan,
        Plan::Engine(dfa) => {
            let start = run.offset;
            return match dfa.find_at(run.input.bytes(), start) {
                Some(end) => {
                    run.offset = end;
                    Step::Matched(run.input.span_unchecked(start, end))
                }
                None => Step::Mismatch(Failure::new(run.cursor())),
            };
        }
    };
    let start = run.offset;
    let mut state = plan.start_state;
    let mut scan = start;
    let mut accepted = plan.accepting[state].then_some(start);

    while let Some(&byte) = run.input.bytes().get(scan) {
        let class = usize::from(plan.byte_classes[usize::from(byte)]);
        debug_assert!(class < plan.class_count);
        let target = plan.transitions[state * plan.class_count + class];
        if target == RegexPlan::DEAD {
            break;
        }
        state = target as usize;
        debug_assert!(state < plan.state_count);
        scan += 1;
        if plan.accepting[state] {
            accepted = Some(scan);
        }
    }

    match accepted {
        Some(end) => {
            run.offset = end;
            Step::Matched(run.input.span_unchecked(start, end))
        }
        None => Step::Mismatch(Failure::new(run.cursor())),
    }
}
