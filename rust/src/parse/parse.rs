use regex::Regex;
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug, Clone, Copy)]
pub struct ParserState<'a> {
    pub src: &'a str,
    pub offset: usize,
}

impl<'a> ParserState<'a> {
    pub fn from(&self, offset: usize) -> ParserState<'a> {
        let offset = self.offset + offset;
        ParserState {
            src: self.src,
            offset,
        }
    }

    pub fn get_column_number(&self) -> usize {
        let offset = self.offset;
        let last_newline = self.src[..offset].rfind('\n').unwrap_or(0);

        if offset <= last_newline {
            0
        } else {
            offset - last_newline
        }
    }

    pub fn get_line_number(&self) -> usize {
        self.src[..self.offset]
            .as_bytes()
            .iter()
            .filter(|&&c| c == b'\n')
            .count()
            + 1
    }
}

pub trait ParserFunction<'a, Output>: 'a {
    fn call(&self, state: &ParserState<'a>) -> Result<(ParserState<'a>, Option<Output>), ()>;
}

impl<'a, F, Output> ParserFunction<'a, Output> for F
where
    F: Fn(&ParserState<'a>) -> Result<(ParserState<'a>, Option<Output>), ()> + 'a,
{
    fn call(&self, state: &ParserState<'a>) -> Result<(ParserState<'a>, Option<Output>), ()> {
        self(state)
    }
}

// #[derive(Debug, Clone)]
pub struct Parser<'a, Output, F>
where
    F: ParserFunction<'a, Output> + 'a,
{
    pub parser_fn: F,
    pub lifetime: std::marker::PhantomData<&'a Output>,
}

impl<'a, Output, F> Parser<'a, Output, F>
where
    Self: Sized + 'a,
    Output: 'a,
    F: ParserFunction<'a, Output> + 'a,
{
    pub fn new(parser_fn: F) -> Self {
        let parser = Parser {
            parser_fn,
            lifetime: std::marker::PhantomData,
        };

        return parser;
    }

    pub fn parse_return_state(
        &self,
        src: &'a str,
    ) -> Result<(ParserState<'a>, Option<Output>), ()> {
        let state = ParserState { src, offset: 0 };

        return self.parser_fn.call(&state);
    }

    pub fn parse(&self, src: &'a str) -> Option<Output> {
        match self.parse_return_state(src) {
            Ok((_, value)) => value,
            Err(_) => None,
        }
    }

    pub fn then<Output2, G>(
        self,
        next: Parser<'a, Output2, G>,
    ) -> Parser<'a, (Output, Option<Output2>), impl ParserFunction<'a, (Output, Option<Output2>)>>
    where
        Output2: 'a,
        G: ParserFunction<'a, Output2> + 'a,
    {
        let then = move |state: &ParserState<'a>| {
            if let Ok((state1, Some(value1))) = (self.parser_fn).call(state) {
                let (state2, value2) = (next.parser_fn).call(&state1)?;

                return Ok((state2, Some((value1, value2))));
            }
            Err(())
        };
        Parser::new(then)
    }

    pub fn with<Output2, G>(
        self,
        next: Parser<'a, Output2, G>,
    ) -> Parser<'a, (Output, Output2), impl ParserFunction<'a, (Output, Output2)>>
    where
        Output2: 'a,
        G: ParserFunction<'a, Output2> + 'a,
    {
        let with = move |state: &ParserState<'a>| {
            if let Ok((state1, Some(value1))) = (self.parser_fn).call(state) {
                if let Ok((state2, Some(value2))) = (next.parser_fn).call(&state1) {
                    return Ok((state2, Some((value1, value2))));
                }
            }
            Err(())
        };
        Parser::new(with)
    }

    pub fn or<G>(
        self,
        other: Parser<'a, Output, G>,
    ) -> Parser<'a, Output, impl ParserFunction<'a, Output>>
    where
        G: ParserFunction<'a, Output> + 'a,
    {
        let or = move |state: &ParserState<'a>| {
            if let Ok(state1) = self.parser_fn.call(state) {
                return Ok(state1);
            }
            if let Ok(state2) = other.parser_fn.call(state) {
                return Ok(state2);
            }
            Err(())
        };
        Parser::new(or)
    }

    pub fn or_else(self, f: fn() -> Output) -> Parser<'a, Output, impl ParserFunction<'a, Output>> {
        let or_else = move |state: &ParserState<'a>| match self.parser_fn.call(state) {
            Err(_) => return Ok((state.clone(), Some(f()))),
            Ok((state1, value1)) => return Ok((state1, value1)),
        };
        Parser::new(or_else)
    }

    pub fn map<Output2>(
        self,
        f: fn(Output) -> Output2,
    ) -> Parser<'a, Output2, impl ParserFunction<'a, Output2>>
    where
        Output2: 'a,
    {
        let map = move |state: &ParserState<'a>| match self.parser_fn.call(state) {
            Err(_) => return Err(()),
            Ok((state1, Some(value1))) => return Ok((state1, Some(f(value1)))),
            Ok((state1, None)) => return Ok((state1, None)),
        };

        Parser::new(map)
    }

    pub fn opt(self) -> Parser<'a, Output, impl ParserFunction<'a, Output>> {
        let opt = move |state: &ParserState<'a>| match self.parser_fn.call(state) {
            Err(_) => return Ok((state.clone(), None)),
            Ok(result) => return Ok(result),
        };
        Parser::new(opt)
    }

    pub fn skip<Output2, G>(
        self,
        next: Parser<'a, Output2, G>,
    ) -> Parser<'a, Output, impl ParserFunction<'a, Output>>
    where
        Output2: 'a,
        G: ParserFunction<'a, Output2> + 'a,
    {
        self.then(next).map(|(x, _)| x)
    }

    pub fn next<Output2, G>(
        self,
        next: Parser<'a, Output2, G>,
    ) -> Parser<'a, Output2, impl ParserFunction<'a, Output2>>
    where
        Output2: 'a,
        G: ParserFunction<'a, Output2> + 'a,
    {
        self.then(next).map(|(_, x)| {
            if let Some(x) = x {
                x
            } else {
                panic!("Expected value, got None");
            }
        })
    }

    pub fn many(
        self,
        lower: Option<usize>,
        upper: Option<usize>,
    ) -> Parser<'a, Vec<Output>, impl ParserFunction<'a, Vec<Output>> + 'a> {
        let many = move |state: &ParserState<'a>| {
            let mut state1 = state.clone();
            let mut values = Vec::new();

            for i in 0..upper.unwrap_or(std::usize::MAX) {
                if let Ok((state2, value2)) = self.parser_fn.call(&state1) {
                    if let Some(value2) = value2 {
                        values.push(value2);
                    }
                    state1 = state2;
                } else if i < lower.unwrap_or(0) {
                    return Err(());
                } else {
                    break;
                }
            }
            Ok((state1, Some(values)))
        };

        Parser::new(many)
    }

    pub fn wrap<Output2, Output3, G, H>(
        self,
        left: Parser<'a, Output2, G>,
        right: Parser<'a, Output3, H>,
    ) -> Parser<'a, Output, impl ParserFunction<'a, Output> + 'a>
    where
        Output2: 'a,
        Output3: 'a,
        G: ParserFunction<'a, Output2> + 'a,
        H: ParserFunction<'a, Output3> + 'a,
    {
        let wrap = move |state: &ParserState<'a>| {
            let (state1, _) = left.parser_fn.call(state)?;
            let (state2, value2) = self.parser_fn.call(&state1)?;
            let (state3, _) = right.parser_fn.call(&state2)?;

            Ok((state3, value2))
        };

        Parser::new(wrap)
    }

    pub fn trim<Output2, G>(
        self,
        trimmer: Parser<'a, Output2, G>,
    ) -> Parser<'a, Output, impl ParserFunction<'a, Output> + 'a>
    where
        Output2: 'a,
        G: ParserFunction<'a, Output2> + 'a,
    {
        let trim = move |state: &ParserState<'a>| {
            let (state1, _) = trimmer.parser_fn.call(state)?;
            let (state2, value2) = (self.parser_fn).call(&state1)?;
            let (state3, _) = trimmer.parser_fn.call(&state2)?;

            Ok((state3, value2))
        };

        Parser::new(trim)
    }

    pub fn trim_whitespace(self) -> Parser<'a, Output, impl ParserFunction<'a, Output> + 'a> {
        let trim_leading_whitespace = |state: &ParserState<'a>| {
            let slc = &state.src[state.offset..];
            slc.chars().take_while(|c| c.is_whitespace()).count()
        };

        let trim_whitespace = move |state: &ParserState<'a>| {
            let offset = trim_leading_whitespace(state);

            let state1 = state.from(offset);
            let (mut state2, value2) = self.parser_fn.call(&state1)?;

            let offset = trim_leading_whitespace(&state2);
            state2.offset += offset;

            Ok((state2, value2))
        };

        Parser::new(trim_whitespace)
    }

    pub fn sep_by<Output2, G>(
        self,
        delim: Parser<'a, Output2, G>,
        lower: Option<usize>,
        upper: Option<usize>,
    ) -> Parser<'a, Vec<Output>, impl ParserFunction<'a, Vec<Output>> + 'a>
    where
        Output2: 'a,
        G: ParserFunction<'a, Output2> + 'a,
    {
        let sep_by = move |state: &ParserState<'a>| {
            let mut state1 = state.clone();
            let mut values = Vec::new();

            loop {
                if let Ok((next_state, value)) = self.parser_fn.call(&state1) {
                    if let Some(value) = value {
                        values.push(value);
                    }
                    state1 = next_state;
                } else {
                    break;
                }

                if let Ok((next_state, _)) = delim.parser_fn.call(&state1) {
                    state1 = next_state;
                } else {
                    break;
                }
            }

            if lower.map_or(true, |min| values.len() >= min)
                && upper.map_or(true, |max| values.len() <= max)
            {
                Ok((state1, Some(values)))
            } else {
                Err(())
            }
        };

        Parser::new(sep_by)
    }

    pub fn look_ahead<G>(
        self,
        parser: Parser<'a, Output, G>,
    ) -> Parser<'a, Output, impl ParserFunction<'a, Output> + 'a>
    where
        G: ParserFunction<'a, Output> + 'a,
    {
        let look_ahead = move |state: &ParserState<'a>| {
            let (state1, value1) = self.parser_fn.call(state)?;
            parser.parser_fn.call(&state1)?;

            Ok((state1, value1))
        };

        Parser::new(look_ahead)
    }
}

impl<'a, Output2, F, G> std::ops::BitOr<Parser<'a, Output2, G>> for Parser<'a, Output2, F>
where
    Output2: 'a,
    F: ParserFunction<'a, Output2> + 'a,
    G: ParserFunction<'a, Output2> + 'a,
{
    type Output = Parser<'a, Output2, impl ParserFunction<'a, Output2> + 'a>;

    fn bitor(self, other: Parser<'a, Output2, G>) -> Self::Output {
        let or = move |state: &ParserState<'a>| match (self.parser_fn).call(state) {
            Ok(result) => Ok(result),
            Err(_) => (other.parser_fn).call(state),
        };
        Parser::new(or)
    }
}

pub fn eof<'a>() -> Parser<'a, (), impl ParserFunction<'a, ()> + 'a> {
    let eof = move |state: &ParserState<'a>| {
        if state.offset >= state.src.len() {
            Ok((state.clone(), Some(())))
        } else {
            Err(())
        }
    };
    Parser::new(eof)
}

pub trait LazyParserFnTrait<'a, Output>: 'a {
    type ParserFn: ParserFunction<'a, Output> + 'a;

    fn call(&self) -> Parser<'a, Output, Self::ParserFn>;
}

impl<'a, F, Output, PF> LazyParserFnTrait<'a, Output> for F
where
    Output: 'a,
    F: Fn() -> Parser<'a, Output, PF> + 'a,
    PF: ParserFunction<'a, Output> + 'a,
{
    type ParserFn = PF;

    fn call(&self) -> Parser<'a, Output, Self::ParserFn> {
        self()
    }
}

pub struct LazyParser<'a, Output, PF>
where
    Output: 'a,
    PF: ParserFunction<'a, Output> + 'a,
{
    parser_fn: Box<dyn LazyParserFnTrait<'a, Output, ParserFn = PF> + 'a>,
    cached_parser: Option<Rc<Parser<'a, Output, PF>>>,
}

impl<'a, Output, PF> LazyParser<'a, Output, PF>
where
    Output: 'a,
    PF: ParserFunction<'a, Output> + 'a,
{
    pub fn new<F>(parser_fn: F) -> Self
    where
        F: LazyParserFnTrait<'a, Output, ParserFn = PF> + 'a,
    {
        LazyParser {
            parser_fn: Box::new(parser_fn),
            cached_parser: None,
        }
    }

    pub fn get(&mut self) -> Rc<Parser<'a, Output, PF>> {
        if let Some(parser) = self.cached_parser.as_ref() {
            parser.clone()
        } else {
            let parser = Rc::new(self.parser_fn.call());
            self.cached_parser = Some(parser.clone());
            parser
        }
    }
}

pub fn lazy<'a, Output, F, PF>(f: F) -> Parser<'a, Output, impl ParserFunction<'a, Output> + 'a>
where
    Output: 'a,
    F: LazyParserFnTrait<'a, Output, ParserFn = PF> + 'a,
    PF: ParserFunction<'a, Output> + 'a,
{
    let lazy_parser = RefCell::new(LazyParser::new(f));

    let lazy = move |state: &ParserState<'a>| {
        let parser = lazy_parser.borrow_mut().get();
        parser.parser_fn.call(state)
    };

    Parser::new(lazy)
}

pub fn string<'a>(s: &'a str) -> Parser<'a, &'a str, impl ParserFunction<'a, &'a str>> {
    let string = move |state: &ParserState<'a>| {
        let slc = &state.src[state.offset..];
        if slc.starts_with(s) {
            Ok((state.from(s.len()), Some(s)))
        } else {
            Err(())
        }
    };

    Parser::new(string)
}

pub fn regex<'a>(r: &str) -> Parser<'a, &'a str, impl ParserFunction<'a, &'a str>> {
    let re = Regex::new(r).expect(&format!("Failed to compile regex: {}", r));

    let regex = move |state: &ParserState<'a>| {
        let slc = &state.src[state.offset..];

        match re.find(slc) {
            Some(m) => {
                if m.start() != 0 {
                    return Err(());
                }
                Ok((state.from(m.end()), Some(m.as_str())))
            }
            None => Err(()),
        }
    };

    Parser::new(regex)
}
