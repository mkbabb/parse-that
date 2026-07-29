use crate::{Input, Span, Step};

/// The complete result of one consuming module parse.
///
/// A successful outcome contains the canonical full-input span, never a
/// parser-supplied value. Compiler products travel through the transactional
/// sink as source-relative events. The sink is caller-owned: this type
/// guarantees its commit/rollback state, not invariants of an external event
/// payload.
#[must_use = "module parse results contain the final typed outcome and sink"]
pub struct ModuleResult<'i, S> {
    input: Input<'i>,
    outcome: Step<'i, Span<'i>>,
    sink: S,
}

impl<'i, S> ModuleResult<'i, S> {
    #[inline]
    pub(crate) const fn new(input: Input<'i>, outcome: Step<'i, Span<'i>>, sink: S) -> Self {
        Self {
            input,
            outcome,
            sink,
        }
    }

    #[inline]
    pub const fn input(&self) -> Input<'i> {
        self.input
    }

    #[inline]
    pub const fn outcome(&self) -> &Step<'i, Span<'i>> {
        &self.outcome
    }

    #[inline]
    pub const fn sink(&self) -> &S {
        &self.sink
    }

    #[inline]
    pub fn into_parts(self) -> (Input<'i>, Step<'i, Span<'i>>, S) {
        (self.input, self.outcome, self.sink)
    }
}
