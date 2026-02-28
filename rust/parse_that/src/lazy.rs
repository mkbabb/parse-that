use std::cell::UnsafeCell;

use crate::parse::Parser;
use crate::state::ParserState;

pub trait LazyParserFn<'a, Output>: 'a {
    fn call(&self) -> Parser<'a, Output>;
}

impl<'a, Output, F> LazyParserFn<'a, Output> for F
where
    Output: 'a,
    F: Fn() -> Parser<'a, Output> + 'a,
{
    fn call(&self) -> Parser<'a, Output> {
        (self)()
    }
}

pub struct LazyParser<'a, Output> {
    parser_fn: Box<dyn LazyParserFn<'a, Output>>,
    cached_parser: Option<Parser<'a, Output>>,
}

impl<'a, Output> LazyParser<'a, Output> {
    pub fn new<F>(parser_fn: F) -> LazyParser<'a, Output>
    where
        F: LazyParserFn<'a, Output> + 'a,
    {
        LazyParser {
            parser_fn: Box::new(parser_fn),
            cached_parser: None,
        }
    }

    #[inline]
    pub fn get(&mut self) -> &Parser<'a, Output>
    where
        Output: 'a,
        Self: 'a,
    {
        if self.cached_parser.is_none() {
            self.cached_parser = Some(self.parser_fn.call());
        }
        self.cached_parser.as_ref().unwrap()
    }
}

pub fn lazy<'a, F, Output>(f: F) -> Parser<'a, Output>
where
    Output: 'a,
    F: LazyParserFn<'a, Output> + 'a,
{
    let cell: UnsafeCell<LazyParser<'a, Output>> = UnsafeCell::new(LazyParser::new(f));

    let lazy = move |state: &mut ParserState<'a>| {
        let parser = unsafe { &mut *cell.get() }.get();
        parser.call(state)
    };

    Parser::new(lazy)
}
