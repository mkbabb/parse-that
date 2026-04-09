use crate::parse::Parser;
use crate::state::ParserState;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    /// Alternation with checkpoint-based backtracking (no Vec push/pop).
    #[inline]
    pub fn or(self, other: Parser<'a, Output>) -> Parser<'a, Output> {
        let or = move |state: &mut ParserState<'a>| {
            let checkpoint = state.offset;
            if let Some(value) = self.call(state) {
                return Some(value);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = checkpoint;

            if let Some(value) = other.call(state) {
                return Some(value);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = checkpoint;

            None
        };
        Parser::new(or)
    }

    /// Monadic bind (flatMap): parse with `self`, then use the result to choose
    /// the next parser via `f`. The second parser runs from where `self` left off.
    ///
    /// This enables context-sensitive parsing where the choice of continuation
    /// depends on the value parsed so far.
    #[inline]
    pub fn chain<Output2, F>(self, f: F) -> Parser<'a, Output2>
    where
        Output2: 'a,
        F: Fn(Output) -> Parser<'a, Output2> + 'a,
    {
        let chain = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            let next = f(value);
            next.call(state)
        };
        Parser::new(chain)
    }
}
