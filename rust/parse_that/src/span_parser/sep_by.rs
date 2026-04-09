// Dispatch arms for the sep_by family: SepBy (bare) and SepByWs (fused
// whitespace-trimming variant).

use super::SpanParser;
use crate::scanners::trim_leading_whitespace_mut;
use crate::state::{ParserState, Span};

impl<'a> SpanParser<'a> {
    #[inline(always)]
    pub(super) fn dispatch_sep_by(
        &self,
        inner: &SpanParser<'a>,
        sep: &SpanParser<'a>,
        lo: usize,
        hi: usize,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let start = state.offset;
        let mut count = 0;
        // Parse first element
        let Some(first_span) = inner.call(state) else {
            if lo == 0 {
                return Some(Span::new(start, start, state.src));
            }
            return None;
        };
        let mut end = first_span.end;
        count += 1;
        // Parse (sep elem)* — checkpoint before separator to reject
        // trailing separators.
        while count < hi {
            let cp = state.offset;
            if sep.call(state).is_none() {
                state.offset = cp;
                break;
            }
            if let Some(span) = inner.call(state) {
                end = span.end;
                count += 1;
            } else {
                // Element after separator failed — backtrack past
                // the separator (reject trailing sep).
                state.offset = cp;
                break;
            }
        }
        if count >= lo {
            Some(Span::new(start, end, state.src))
        } else {
            None
        }
    }

    #[inline(always)]
    pub(super) fn dispatch_sep_by_ws(
        &self,
        inner: &SpanParser<'a>,
        sep: &SpanParser<'a>,
        lo: usize,
        hi: usize,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let start = state.offset;
        let mut count = 0;
        // Pre-trim before first element
        trim_leading_whitespace_mut(state);
        // Parse first element
        if inner.call(state).is_none() {
            if lo == 0 {
                return Some(Span::new(start, state.offset, state.src));
            }
            return None;
        }
        count += 1;
        while count < hi {
            let cp = state.offset;
            // Trim before separator
            trim_leading_whitespace_mut(state);
            if sep.call(state).is_none() {
                state.offset = cp;
                break;
            }
            // Trim before next element
            trim_leading_whitespace_mut(state);
            if inner.call(state).is_some() {
                count += 1;
            } else {
                state.offset = cp;
                break;
            }
        }
        if count >= lo {
            // Post-trim after the last element
            trim_leading_whitespace_mut(state);
            Some(Span::new(start, state.offset, state.src))
        } else {
            None
        }
    }
}
