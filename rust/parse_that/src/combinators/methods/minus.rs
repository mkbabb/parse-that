use crate::parse::Parser;
use crate::state::ParserState;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    /// Consuming negative lookahead: parse `self`, then check that `next` does
    /// NOT match at the resulting position. If `next` matches, the overall
    /// parse fails. Unlike `negate()` (zero-width), `not()` consumes the input
    /// matched by `self` on success.
    #[inline]
    pub fn not<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let not = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            let checkpoint = state.offset;
            let saved_furthest = state.furthest_offset;
            if next.call(state).is_none() {
                state.offset = checkpoint;
                state.furthest_offset = saved_furthest;
                return Some(value);
            }
            state.offset = checkpoint;
            state.furthest_offset = saved_furthest;
            None
        };
        Parser::new(not)
    }

    /// Set difference: match `self` only if `excluded` would NOT match at the
    /// same starting position. Used for EBNF/BNF exception (`-`) semantics.
    #[inline]
    pub fn minus<Output2>(self, excluded: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let minus = move |state: &mut ParserState<'a>| {
            let checkpoint = state.offset;
            let saved_furthest = state.furthest_offset;
            if excluded.call(state).is_some() {
                state.offset = checkpoint;
                state.furthest_offset = saved_furthest;
                return None;
            }
            state.offset = checkpoint;
            state.furthest_offset = saved_furthest;
            self.call(state)
        };
        Parser::new(minus)
    }

    /// Zero-width negative assertion: succeeds (returning `()`) when the inner
    /// parser *fails*, and fails when the inner parser *succeeds*. Does not
    /// consume any input in either case.
    #[inline]
    pub fn negate(self) -> Parser<'a, ()> {
        let negate = move |state: &mut ParserState<'a>| {
            let checkpoint = state.offset;
            let saved_furthest = state.furthest_offset;
            if self.call(state).is_none() {
                state.offset = checkpoint;
                state.furthest_offset = saved_furthest;
                return Some(());
            }
            state.offset = checkpoint;
            state.furthest_offset = saved_furthest;
            None
        };
        Parser::new(negate)
    }

    /// Zero-width positive assertion: succeeds with the inner parser's value
    /// when it matches, but does NOT consume any input. The dual of `negate()`:
    /// where `negate()` succeeds when the inner parser fails, `peek()` succeeds
    /// when the inner parser succeeds — both without advancing the offset.
    #[inline]
    pub fn peek(self) -> Parser<'a, Output> {
        let peek = move |state: &mut ParserState<'a>| {
            let checkpoint = state.offset;
            let saved_furthest = state.furthest_offset;
            let value = self.call(state)?;
            state.offset = checkpoint;
            state.furthest_offset = saved_furthest;
            Some(value)
        };
        Parser::new(peek)
    }

    #[inline]
    pub fn look_ahead<Output2>(self, parser: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let look_ahead = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            let offset_after_self = state.offset;
            let lookahead_result = parser.call(state);
            state.offset = offset_after_self;
            lookahead_result?;
            Some(value)
        };
        Parser::new(look_ahead)
    }
}
