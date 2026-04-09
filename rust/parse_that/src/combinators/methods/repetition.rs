use std::ops::RangeBounds;

use crate::parse::Parser;
use crate::state::ParserState;
use crate::utils::extract_bounds;
use smallvec::SmallVec;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    #[inline]
    pub fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Parser<'a, Vec<Output>> {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let many = move |state: &mut ParserState<'a>| {
            let est = if lower_bound > 0 {
                lower_bound.max(16)
            } else {
                16
            };
            let mut values = Vec::with_capacity(est);

            while values.len() < upper_bound {
                let prev_offset = state.offset;
                if let Some(value) = self.call(state) {
                    values.push(value);
                    // Guard: break on zero-length match to prevent infinite loops.
                    // Mirrors the VM interpreter's iter_start_offset check.
                    if state.offset == prev_offset {
                        break;
                    }
                } else {
                    // Restore offset — the inner parser may have advanced past a
                    // partial match before failing (e.g., `binding.skip(comma)` where
                    // binding matched but comma didn't). Without this, subsequent
                    // parsers (like `.then(expression)`) see a wrong offset.
                    state.offset = prev_offset;
                    break;
                }
            }
            if values.len() >= lower_bound {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(many)
    }

    /// Like `many()` but returns `SmallVec<A>` — inline storage avoids heap
    /// allocation for small collections.
    #[inline]
    pub fn many_small<A>(self, bounds: impl RangeBounds<usize> + 'a) -> Parser<'a, SmallVec<A>>
    where
        A: smallvec::Array<Item = Output> + 'a,
    {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let many = move |state: &mut ParserState<'a>| {
            let mut values = SmallVec::new();

            while values.len() < upper_bound {
                let prev_offset = state.offset;
                if let Some(value) = self.call(state) {
                    values.push(value);
                    if state.offset == prev_offset {
                        break;
                    }
                } else {
                    state.offset = prev_offset;
                    break;
                }
            }
            if values.len() >= lower_bound {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(many)
    }

    /// Like `sep_by()` but returns `SmallVec<A>` — inline storage avoids heap
    /// allocation for small collections.
    #[inline]
    pub fn sep_by_small<Output2, A>(
        self,
        sep: Parser<'a, Output2>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> Parser<'a, SmallVec<A>>
    where
        Output2: 'a,
        A: smallvec::Array<Item = Output> + 'a,
    {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let mut values = SmallVec::new();

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
                if sep.call(state).is_none() {
                    state.offset = cp;
                    break;
                }
                if let Some(value) = self.call(state) {
                    values.push(value);
                } else {
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
}
