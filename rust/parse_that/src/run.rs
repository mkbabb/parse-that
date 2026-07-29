use crate::transaction::Checkpoint;
use crate::{Cursor, EventSink, Failure, Fault, Input, ModuleResult, NoSink, Step};

/// Mutable state for one borrowed input and one append-only event sink.
pub struct Run<'i, S = NoSink> {
    pub(crate) input: Input<'i>,
    pub(crate) offset: usize,
    sink: S,
}

impl<'i> Run<'i, NoSink> {
    #[inline]
    pub const fn new(input: Input<'i>) -> Self {
        Self {
            input,
            offset: 0,
            sink: NoSink::new(),
        }
    }

    /// Create recognition-only state for a parser that emits `E`.
    #[inline]
    pub const fn discarding<E>(input: Input<'i>) -> Run<'i, NoSink<E>> {
        Run {
            input,
            offset: 0,
            sink: NoSink::new(),
        }
    }
}

impl<'i, S: EventSink> Run<'i, S> {
    #[inline]
    pub fn with_sink(input: Input<'i>, sink: S) -> Self {
        Self {
            input,
            offset: 0,
            sink,
        }
    }

    #[inline]
    pub fn cursor(&self) -> Cursor<'i> {
        self.input.cursor_unchecked(self.offset)
    }

    #[inline]
    pub const fn sink(&self) -> &S {
        &self.sink
    }

    #[inline]
    pub fn into_sink(self) -> S {
        self.sink
    }

    /// Parse one complete module and return its source, typed outcome, and sink.
    ///
    /// This is the consuming full-input boundary used by generated module
    /// parsers. It adds no transaction participant beyond
    /// [`Run::parse_full`].
    #[inline]
    pub fn parse_module<T, F>(mut self, parser: F) -> ModuleResult<'i, S>
    where
        F: FnOnce(&mut Self) -> Step<'i, T>,
    {
        let input = self.input;
        let outcome = match self.parse_full(parser) {
            Step::Matched(_) => Step::Matched(input.span_unchecked(0, input.len())),
            Step::Mismatch(failure) => Step::Mismatch(failure),
            Step::Fault(fault) => Step::Fault(fault),
        };
        ModuleResult::new(input, outcome, self.sink)
    }

    #[inline]
    pub fn emit(&mut self, event: S::Event) {
        self.sink.push(event);
    }

    /// Emit lazily so [`NoSink`] erases event construction in recognition mode.
    #[inline]
    pub fn emit_with<F>(&mut self, event: F)
    where
        F: FnOnce() -> S::Event,
    {
        self.sink.push_with(event);
    }

    pub fn parse_prefix<T, F>(&mut self, parser: F) -> Step<'i, T>
    where
        F: FnOnce(&mut Self) -> Step<'i, T>,
    {
        let entry = self.checkpoint();
        match parser(self) {
            matched @ Step::Matched(_) => matched,
            Step::Mismatch(failure) => {
                self.rollback(entry);
                if failure.belongs_to(self.input) {
                    Step::Mismatch(failure)
                } else {
                    Step::Fault(Fault::ForeignOutcome {
                        at: self.input.cursor_unchecked(entry.cursor),
                    })
                }
            }
            Step::Fault(fault) => {
                self.rollback(entry);
                if fault.belongs_to(self.input) {
                    Step::Fault(fault)
                } else {
                    Step::Fault(Fault::ForeignOutcome {
                        at: self.input.cursor_unchecked(entry.cursor),
                    })
                }
            }
        }
    }

    pub fn parse_full<T, F>(&mut self, parser: F) -> Step<'i, T>
    where
        F: FnOnce(&mut Self) -> Step<'i, T>,
    {
        if self.offset != 0 {
            return Step::Fault(Fault::FullParseAfterProgress { at: self.cursor() });
        }
        let entry = self.checkpoint();
        match parser(self) {
            Step::Matched(value) if self.offset == self.input.len() => Step::Matched(value),
            Step::Matched(_) => {
                let failure = Failure::new(self.cursor());
                self.rollback(entry);
                Step::Mismatch(failure)
            }
            Step::Mismatch(failure) => {
                self.rollback(entry);
                if failure.belongs_to(self.input) {
                    Step::Mismatch(failure)
                } else {
                    Step::Fault(Fault::ForeignOutcome {
                        at: self.input.cursor_unchecked(entry.cursor),
                    })
                }
            }
            Step::Fault(fault) => {
                self.rollback(entry);
                if fault.belongs_to(self.input) {
                    Step::Fault(fault)
                } else {
                    Step::Fault(Fault::ForeignOutcome {
                        at: self.input.cursor_unchecked(entry.cursor),
                    })
                }
            }
        }
    }

    #[inline]
    pub(crate) fn checkpoint(&self) -> Checkpoint {
        Checkpoint {
            cursor: self.offset,
            sink_len: self.sink.len(),
        }
    }

    #[inline]
    pub(crate) fn rollback(&mut self, checkpoint: Checkpoint) {
        self.offset = checkpoint.cursor;
        self.sink.truncate(checkpoint.sink_len);
    }

    #[inline]
    pub(crate) fn validate_failure(
        &self,
        failure: Failure<'i>,
        at: usize,
    ) -> Result<Failure<'i>, Fault<'i>> {
        if failure.belongs_to(self.input) {
            Ok(failure)
        } else {
            Err(Fault::ForeignOutcome {
                at: self.input.cursor_unchecked(at),
            })
        }
    }

    #[inline]
    pub(crate) fn validate_fault(&self, fault: Fault<'i>, at: usize) -> Fault<'i> {
        if fault.belongs_to(self.input) {
            fault
        } else {
            Fault::ForeignOutcome {
                at: self.input.cursor_unchecked(at),
            }
        }
    }
}
