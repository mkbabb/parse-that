use crate::{EventSink, Failure, Run, Span, Step};

/// A checked, borrowed DFA table emitted at compile time.
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
        if state_count == 0
            || class_count == 0
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
    StateShape,
    ByteClass,
    TransitionShape,
    TransitionTarget,
}

/// A direct terminal backed by one checked regex plan.
#[derive(Clone, Copy, Debug)]
pub struct RegexTerminal<'p> {
    plan: RegexPlan<'p>,
}

impl<'p> RegexTerminal<'p> {
    #[inline]
    pub const fn new(plan: RegexPlan<'p>) -> Self {
        Self { plan }
    }
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
    let start = run.offset;
    let plan = terminal.plan;
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
