// Dispatch arms for leaf SpanKind variants: literals, DFAs, Aho-Corasick,
// take-while predicates, fixed-size advances, epsilon, and domain scanners.

use std::sync::Arc;

use aho_corasick::{AhoCorasick, Anchored, Input};

use super::{SpanParser, SpanScanner};
use crate::state::{ParserState, Span};

impl<'a> SpanParser<'a> {
    #[inline(always)]
    pub(super) fn dispatch_string_literal(
        &self,
        s_bytes: &'static [u8],
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let end = s_bytes.len();
        if end == 0 {
            return Some(Span::new(state.offset, state.offset, state.src));
        }
        let slc = state.src_bytes.get(state.offset..)?;
        if slc.len() >= end
            && slc[0] == s_bytes[0]
            && (end == 1 || slc[1..end].starts_with(&s_bytes[1..]))
        {
            let start = state.offset;
            state.offset += end;
            Some(Span::new(start, state.offset, state.src))
        } else {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            None
        }
    }

    #[inline(always)]
    pub(super) fn dispatch_compiled_dfa(
        &self,
        dfa: &Arc<crate::regex::dfa::Dfa>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let bytes = &state.src_bytes[state.offset..];
        match dfa.find_at(bytes, 0) {
            Some(end) => {
                let start = state.offset;
                state.offset += end;
                Some(Span::new(start, state.offset, state.src))
            }
            None => {
                #[cfg(feature = "diagnostics")]
                if let Some(lbl) = self.label {
                    state.add_expected(lbl);
                }
                None
            }
        }
    }

    #[inline(always)]
    pub(super) fn dispatch_aho_corasick(
        &self,
        ac: &Arc<AhoCorasick>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let slc = state.src.get(state.offset..)?;
        let input = Input::new(slc).anchored(Anchored::Yes);
        match ac.find(input) {
            Some(m) => {
                let start = state.offset;
                state.offset += m.end();
                Some(Span::new(start, state.offset, state.src))
            }
            None => {
                #[cfg(feature = "diagnostics")]
                if let Some(lbl) = self.label {
                    state.add_expected(lbl);
                }
                None
            }
        }
    }

    #[inline(always)]
    pub(super) fn dispatch_take_while_byte(
        &self,
        f: fn(u8) -> bool,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let bytes = state.src_bytes;
        let start = state.offset;
        let end = bytes.len();
        let mut i = start;
        while i < end && f(unsafe { *bytes.get_unchecked(i) }) {
            i += 1;
        }
        if i == start {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        state.offset = i;
        Some(Span::new(start, i, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_take_while_char(
        &self,
        f: &(dyn Fn(char) -> bool + 'a),
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let slc = state.src.get(state.offset..)?;
        match slc
            .char_indices()
            .take_while(|(_, c)| f(*c))
            .map(|(i, _)| i)
            .last()
        {
            Some(mut len) => {
                len += 1;
                while len < slc.len() && !slc.is_char_boundary(len) {
                    len += 1;
                }
                let start = state.offset;
                state.offset += len;
                Some(Span::new(start, state.offset, state.src))
            }
            None => {
                #[cfg(feature = "diagnostics")]
                if let Some(lbl) = self.label {
                    state.add_expected(lbl);
                }
                None
            }
        }
    }

    #[inline(always)]
    pub(super) fn dispatch_next_n(
        &self,
        amount: usize,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let start = state.offset;
        let new_offset = start + amount;
        if new_offset > state.src.len() {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        state.offset = new_offset;
        Some(Span::new(start, new_offset, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_epsilon(&self, state: &ParserState<'a>) -> Option<Span<'a>> {
        Some(Span::new(state.offset, state.offset, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_scanner(
        &self,
        scanner: &SpanScanner,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let result = scanner.call(state);
        #[cfg(feature = "diagnostics")]
        if result.is_none() {
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
        }
        result
    }

    #[inline(always)]
    pub(super) fn dispatch_eof(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        if state.is_at_end() {
            Some(Span::new(state.offset, state.offset, state.src))
        } else {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            None
        }
    }

    #[inline(always)]
    pub(super) fn dispatch_boxed(
        &self,
        inner: &(dyn crate::parse::ParserFn<'a, Span<'a>> + 'a),
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        inner.call(state)
    }
}
