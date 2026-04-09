use std::ops::RangeBounds;

use crate::parse::Parser;
use crate::scanners::trim_leading_whitespace_mut;
use crate::state::ParserState;
use crate::utils::extract_bounds;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    /// Strictly interleaving: `elem (sep elem)*`. Never accepts a trailing
    /// separator — trailing sep acceptance is a grammar concern.
    #[inline]
    pub fn sep_by<Output2>(
        self,
        sep: Parser<'a, Output2>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> Parser<'a, Vec<Output>>
    where
        Output2: 'a,
    {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let est = if lower_bound > 0 {
                lower_bound.max(16)
            } else {
                16
            };
            let mut values = Vec::with_capacity(est);

            // Parse first element
            if let Some(value) = self.call(state) {
                values.push(value);
            } else if lower_bound == 0 {
                return Some(values);
            } else {
                return None;
            }

            // Parse (sep elem)* — checkpoint before separator so trailing
            // separators are rejected by restoring state.
            while values.len() < upper_bound {
                let cp = state.offset;
                if sep.call(state).is_none() {
                    state.offset = cp;
                    break;
                }
                if let Some(value) = self.call(state) {
                    values.push(value);
                } else {
                    // Element after separator failed — backtrack past the
                    // separator to reject the trailing separator.
                    state.offset = cp;
                    break;
                }
            }

            if values.len() >= lower_bound {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(sep_by)
    }

    /// Fused sep_by + whitespace trimming. Instead of wrapping element and
    /// separator in trim_whitespace (which double-trims between elements),
    /// this does a single trim between each step:
    ///   trim_ws → parse_element → (trim_ws → parse_sep → trim_ws → parse_element)*
    #[inline]
    pub fn sep_by_ws<Output2>(
        self,
        sep: Parser<'a, Output2>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> Parser<'a, Vec<Output>>
    where
        Output2: 'a,
    {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by_ws = move |state: &mut ParserState<'a>| {
            let remaining = state.end - state.offset;
            let est = if remaining > 4096 {
                (remaining / 64).clamp(64, 16384)
            } else {
                8
            };
            let mut values = Vec::with_capacity(est);

            // Pre-trim before first element
            trim_leading_whitespace_mut(state);

            // Parse first element
            if let Some(value) = self.call(state) {
                values.push(value);
            } else if lower_bound == 0 {
                return Some(values);
            } else {
                return None;
            }

            while values.len() < upper_bound {
                let cp = state.offset;
                // Trim before separator — bypass sep's own flag dispatch
                // since we're handling whitespace
                trim_leading_whitespace_mut(state);
                if sep.parser_fn.call(state).is_none() {
                    state.offset = cp;
                    break;
                }
                // Trim before next element
                trim_leading_whitespace_mut(state);
                if let Some(value) = self.call(state) {
                    values.push(value);
                } else {
                    state.offset = cp;
                    break;
                }
            }

            if values.len() >= lower_bound {
                // Post-trim after the last element
                trim_leading_whitespace_mut(state);
                Some(values)
            } else {
                None
            }
        };

        Parser::new(sep_by_ws)
    }

    /// Fused sep_by + whitespace trimming + speculative termination.
    /// Before attempting the separator, peeks at the next non-whitespace byte.
    /// If it matches `terminator`, breaks immediately without checkpoint/restore.
    #[inline]
    pub fn sep_by_ws_until<Output2>(
        self,
        sep: Parser<'a, Output2>,
        bounds: impl RangeBounds<usize> + 'a,
        terminator: &'static [u8],
    ) -> Parser<'a, Vec<Output>>
    where
        Output2: 'a,
    {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by_ws = move |state: &mut ParserState<'a>| {
            let remaining = state.end - state.offset;
            let est = if remaining > 4096 {
                (remaining / 64).clamp(64, 16384)
            } else {
                8
            };
            let mut values = Vec::with_capacity(est);

            trim_leading_whitespace_mut(state);

            if let Some(value) = self.call(state) {
                values.push(value);
            } else if lower_bound == 0 {
                return Some(values);
            } else {
                return None;
            }

            while values.len() < upper_bound {
                let cp = state.offset;
                trim_leading_whitespace_mut(state);
                // Peek terminator — skip separator attempt entirely
                if let Some(&b) = state.src_bytes.get(state.offset) {
                    if terminator.contains(&b) {
                        break;
                    }
                }
                if sep.parser_fn.call(state).is_none() {
                    state.offset = cp;
                    break;
                }
                trim_leading_whitespace_mut(state);
                if let Some(value) = self.call(state) {
                    values.push(value);
                } else {
                    state.offset = cp;
                    break;
                }
            }

            if values.len() >= lower_bound {
                trim_leading_whitespace_mut(state);
                Some(values)
            } else {
                None
            }
        };

        Parser::new(sep_by_ws)
    }
}
