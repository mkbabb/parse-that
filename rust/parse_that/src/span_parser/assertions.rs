// Dispatch arms for zero-width and set-difference assertions: Not, Minus,
// LookAhead, Negate, Peek.

use super::SpanParser;
use crate::state::{ParserState, Span};

impl<'a> SpanParser<'a> {
    #[inline(always)]
    pub(super) fn dispatch_not(
        &self,
        main: &SpanParser<'a>,
        negated: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let span = main.call(state)?;
        let checkpoint = state.offset;
        let saved_furthest = state.furthest_offset;
        if negated.call(state).is_none() {
            state.offset = checkpoint;
            state.furthest_offset = saved_furthest;
            return Some(span);
        }
        state.offset = checkpoint;
        state.furthest_offset = saved_furthest;
        None
    }

    #[inline(always)]
    pub(super) fn dispatch_minus(
        &self,
        main: &SpanParser<'a>,
        excluded: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let checkpoint = state.offset;
        let saved_furthest = state.furthest_offset;
        if excluded.call(state).is_some() {
            state.offset = checkpoint;
            state.furthest_offset = saved_furthest;
            return None;
        }
        state.offset = checkpoint;
        state.furthest_offset = saved_furthest;
        main.call(state)
    }

    #[inline(always)]
    pub(super) fn dispatch_look_ahead(
        &self,
        main: &SpanParser<'a>,
        lookahead: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let span = main.call(state)?;
        let offset_after = state.offset;
        let result = lookahead.call(state);
        state.offset = offset_after;
        result?;
        Some(span)
    }

    #[inline(always)]
    pub(super) fn dispatch_negate(
        &self,
        inner: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let checkpoint = state.offset;
        let saved_furthest = state.furthest_offset;
        if inner.call(state).is_none() {
            state.offset = checkpoint;
            state.furthest_offset = saved_furthest;
            return Some(Span::new(checkpoint, checkpoint, state.src));
        }
        state.offset = checkpoint;
        state.furthest_offset = saved_furthest;
        None
    }

    #[inline(always)]
    pub(super) fn dispatch_peek(
        &self,
        inner: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let checkpoint = state.offset;
        let saved_furthest = state.furthest_offset;
        let span = inner.call(state)?;
        state.offset = checkpoint;
        state.furthest_offset = saved_furthest;
        Some(span)
    }
}
