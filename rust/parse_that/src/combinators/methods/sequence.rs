use crate::parse::Parser;
use crate::state::ParserState;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    #[inline]
    pub fn then<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, (Output, Output2)>
    where
        Output2: 'a,
    {
        let with = move |state: &mut ParserState<'a>| {
            let value1 = self.call(state)?;
            let value2 = next.call(state)?;
            Some((value1, value2))
        };
        Parser::new(with)
    }

    #[inline]
    pub fn skip<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let skip = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            next.call(state)?;
            Some(value)
        };
        Parser::new(skip)
    }

    #[inline]
    pub fn next<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let next = move |state: &mut ParserState<'a>| {
            self.call(state)?;
            next.call(state)
        };
        Parser::new(next)
    }

    #[inline]
    pub fn wrap<Output2, Output3>(
        self,
        left: Parser<'a, Output2>,
        right: Parser<'a, Output3>,
    ) -> Parser<'a, Output>
    where
        Output2: 'a,
        Output3: 'a,
    {
        let wrap = move |state: &mut ParserState<'a>| {
            #[cfg(feature = "diagnostics")]
            let open_offset = state.offset;
            left.call(state)?;
            #[cfg(feature = "diagnostics")]
            let open_end = state.offset;
            let value = self.call(state)?;
            if right.call(state).is_some() {
                Some(value)
            } else {
                #[cfg(feature = "diagnostics")]
                {
                    let delimiter = state.src[open_offset..open_end].to_string();
                    state.add_suggestion(|| crate::state::Suggestion {
                        kind: crate::state::SuggestionKind::UnclosedDelimiter {
                            delimiter: delimiter.clone(),
                            open_offset,
                        },
                        message: format!(
                            "close the delimiter with matching `{}`",
                            match delimiter.as_str() {
                                "{" => "}",
                                "[" => "]",
                                "(" => ")",
                                d => d,
                            }
                        ),
                    });
                    state.add_secondary_span(
                        open_offset,
                        format!("unclosed `{}` opened here", delimiter),
                    );
                }
                None
            }
        };
        Parser::new(wrap)
    }

    #[inline]
    pub fn trim<Output2>(self, trimmer: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            trimmer.call(state)?;
            let value = self.call(state)?;
            trimmer.call(state)?;
            Some(value)
        };
        Parser::new(trim)
    }

    #[inline]
    pub fn trim_keep<Output2>(
        self,
        trimmer: Parser<'a, Output2>,
    ) -> Parser<'a, (Output2, Output, Output2)>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            let trim1 = trimmer.call(state)?;
            let value = self.call(state)?;
            let trim2 = trimmer.call(state)?;
            Some((trim1, value, trim2))
        };
        Parser::new(trim)
    }
}
