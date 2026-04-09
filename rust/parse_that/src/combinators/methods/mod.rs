use std::cell::RefCell;
use std::collections::HashMap;

use crate::parse::Parser;
use crate::state::ParserState;

mod alternation;
mod map;
mod minus;
mod recover;
mod repetition;
mod sep_by;
mod sequence;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    #[inline]
    pub fn opt(self) -> Parser<'a, Option<Output>> {
        let opt = move |state: &mut ParserState<'a>| {
            if let Some(value) = self.call(state) {
                return Some(Some(value));
            }
            Some(None)
        };
        Parser::new(opt)
    }

    /// State-based memoization for monolithic slab functions.
    ///
    /// Cache lives in `ParserState.memo` (dropped with each parse), not in the
    /// parser closure. No `Output` values stored in the closure — the parser
    /// only captures `(self, memo_id)`.
    ///
    /// The existing `memoize()` is unchanged — box parsers continue using it
    /// for warm cross-iteration caching.
    pub fn memoize_state(self, memo_id: usize) -> Parser<'a, Output>
    where
        Output: Clone,
    {
        let memo = move |state: &mut ParserState<'a>| {
            let key = state.offset;

            // Check cache.
            {
                let cache = state.memo.table_mut::<Output>(memo_id);
                if let Some(entry) = cache.get(&key).cloned() {
                    return match entry {
                        Some((end, val)) => {
                            state.offset = end;
                            Some(val)
                        }
                        None => None,
                    };
                }
            }

            // Cache miss: parse and store.
            let result = self.call(state);
            let entry = result.as_ref().map(|v| (state.offset, v.clone()));
            state.memo.table_mut::<Output>(memo_id).insert(key, entry);
            result
        };
        Parser::new(memo)
    }

    /// Packrat memoization: cache parse results by input offset.
    /// On cache hit, restores offset and returns cloned value in O(1).
    /// Eliminates exponential re-parsing in ambiguous/cyclic grammars.
    ///
    /// Context-aware: when `context_ptr` changes (e.g. fresh slab between
    /// parses), the cache is cleared to avoid returning stale references.
    /// For the box path (`context_ptr` is always null), this is a no-op
    /// comparison and the cache stays warm across iterations.
    pub fn memoize(self) -> Parser<'a, Output>
    where
        Output: Clone,
    {
        let cache: RefCell<(*const (), HashMap<usize, Option<(usize, Output)>>)> =
            RefCell::new((std::ptr::null(), HashMap::new()));

        let memo = move |state: &mut ParserState<'a>| {
            let key = state.offset;

            // Check if context changed (slab swapped) — if so, invalidate
            {
                let mut guard = cache.borrow_mut();
                if guard.0 != state.context_ptr {
                    guard.1.clear();
                    guard.0 = state.context_ptr;
                }
                // Fast path: cache hit
                if let Some(entry) = guard.1.get(&key).cloned() {
                    return match entry {
                        Some((end_offset, value)) => {
                            state.offset = end_offset;
                            Some(value)
                        }
                        None => None,
                    };
                }
            }

            // Cache miss: parse and store result
            let result = self.call(state);
            let entry = result.as_ref().map(|v| (state.offset, v.clone()));
            cache.borrow_mut().1.insert(key, entry);
            result
        };

        Parser::new(memo)
    }
}

impl<'a, Output2> std::ops::BitOr<Parser<'a, Output2>> for Parser<'a, Output2>
where
    Output2: 'a,
{
    type Output = Parser<'a, Output2>;

    #[inline]
    fn bitor(self, other: Parser<'a, Output2>) -> Self::Output {
        self.or(other)
    }
}

impl<'a, Output, Output2> std::ops::Add<Parser<'a, Output2>> for Parser<'a, Output>
where
    Output: 'a,
    Output2: 'a,
{
    type Output = Parser<'a, (Output, Output2)>;

    #[inline]
    fn add(self, other: Parser<'a, Output2>) -> Self::Output {
        self.then(other)
    }
}

#[path = "../../span_trait.rs"]
mod span_trait;
pub use span_trait::*;
