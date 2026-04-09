// Dispatch arms for flat combinators: Seq, OneOf, Many, Opt, Skip, Next.

use super::SpanParser;
use crate::state::{ParserState, Span};

impl<'a> SpanParser<'a> {
    #[inline(always)]
    pub(super) fn dispatch_seq(
        &self,
        parsers: &[SpanParser<'a>],
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let start = state.offset;
        for p in parsers {
            p.call(state)?;
        }
        Some(Span::new(start, state.offset, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_one_of(
        &self,
        parsers: &[SpanParser<'a>],
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        for p in parsers {
            let cp = state.offset;
            if let Some(span) = p.call(state) {
                return Some(span);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
        }
        None
    }

    #[inline(always)]
    pub(super) fn dispatch_many(
        &self,
        inner: &SpanParser<'a>,
        lo: usize,
        hi: usize,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let start = state.offset;
        let mut end = state.offset;
        let mut count = 0;
        while count < hi {
            let prev_offset = state.offset;
            match inner.call(state) {
                Some(span) => {
                    end = span.end;
                    count += 1;
                    // Guard: break on zero-length match to prevent infinite loops.
                    if state.offset == prev_offset {
                        break;
                    }
                }
                None => {
                    state.offset = prev_offset;
                    break;
                }
            }
        }
        if count >= lo {
            Some(Span::new(start, end, state.src))
        } else {
            None
        }
    }

    #[inline(always)]
    pub(super) fn dispatch_opt(
        &self,
        inner: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let start = state.offset;
        if inner.call(state).is_none() {
            return Some(Span::new(start, start, state.src));
        }
        Some(Span::new(start, state.offset, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_skip(
        &self,
        first: &SpanParser<'a>,
        second: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let span = first.call(state)?;
        second.call(state)?;
        Some(span)
    }

    #[inline(always)]
    pub(super) fn dispatch_next(
        &self,
        first: &SpanParser<'a>,
        second: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        first.call(state)?;
        second.call(state)
    }
}
