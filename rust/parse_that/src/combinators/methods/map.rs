use crate::parse::Parser;
use crate::state::ParserState;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    #[inline]
    pub fn map<Output2>(self, f: fn(Output) -> Output2) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map = move |state: &mut ParserState<'a>| self.call(state).map(f);
        Parser::new(map)
    }

    #[inline]
    pub fn map_with_ctx<Output2, F>(self, f: F) -> Parser<'a, Output2>
    where
        Output2: 'a,
        F: Fn(Output, &mut ParserState<'a>) -> Output2 + 'a,
    {
        let map = move |state: &mut ParserState<'a>| {
            let result = self.call(state)?;
            Some(f(result, state))
        };
        Parser::new(map)
    }

    #[inline]
    pub fn map_with_state<Output2>(
        self,
        f: fn(Output, usize, &mut ParserState<'a>) -> Output2,
    ) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map_with_state = move |state: &mut ParserState<'a>| {
            let offset = state.offset;
            let result = self.call(state)?;
            Some(f(result, offset, state))
        };
        Parser::new(map_with_state)
    }
}
