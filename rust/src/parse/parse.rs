use regex::Regex;
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug, Clone)]
pub struct ParserState<'a> {
    pub src: &'a str,
    pub offset: usize,
    pub state_stack: Vec<usize>,
}

impl<'a> ParserState<'a> {
    pub fn new(src: &'a str) -> ParserState<'a> {
        ParserState {
            src,
            offset: 0,
            state_stack: vec![],
        }
    }
    pub fn save(&mut self) {
        self.state_stack.push(self.offset);
    }

    pub fn restore(&mut self) {
        if let Some(offset) = self.state_stack.pop() {
            self.offset = offset;
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

type ParserResult<'a, Output> = Result<Option<Output>, ()>;

pub trait ParserFn<'a, Output>: 'a {
    fn call(&self, state: &mut ParserState<'a>) -> ParserResult<'a, Output>;
}

impl<'a, Output, F> ParserFn<'a, Output> for F
where
    F: Fn(&mut ParserState<'a>) -> ParserResult<'a, Output> + 'a,
{
    fn call(&self, state: &mut ParserState<'a>) -> ParserResult<'a, Output> {
        self(state)
    }
}

pub struct Parser<'a, Output> {
    pub parser_fn: Box<dyn ParserFn<'a, Output> + 'a>,
}

impl<'a, Output> Parser<'a, Output>
where
    Output: 'a,
{
    pub fn new<F>(parser_fn: F) -> Parser<'a, Output>
    where
        F: ParserFn<'a, Output> + 'a,
    {
        let parser = Parser {
            parser_fn: Box::new(parser_fn),
        };
        return parser;
    }

    pub fn parse_return_state(&self, src: &'a str) -> ParserResult<'a, Output> {
        let mut state = ParserState::new(src);
        let result = self.parser_fn.call(&mut state);

        // dbg!(state.state_stack.len());
        // dbg print all of the counts of each state within the state stack - turn it into a dict of counts

        let map =
            state
                .state_stack
                .iter()
                .fold(std::collections::HashMap::new(), |mut map, &state| {
                    *map.entry(state).or_insert(0) += 1;
                    map
                });

        // dbg!(map);
        dbg!(state.state_stack.len());

        return result;
    }

    pub fn parse(&self, src: &'a str) -> Option<Output> {
        match self.parse_return_state(src) {
            Ok(value) => value,
            Err(_) => None,
        }
    }

    pub fn save_state(self) -> Parser<'a, Output> {
        let save_state = move |state: &mut ParserState<'a>| {
            state.save();
            let result = self.parser_fn.call(state);

            match result {
                Ok(_) => {
                    // state.state_stack.pop();
                }
                Err(_) => state.restore(),
            }

            result
        };

        return Parser::new(save_state);
    }

    pub fn then<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, (Output, Option<Output2>)> {
        let then = move |state: &mut ParserState<'a>| {
            if let Ok(Some(value1)) = (self.parser_fn).call(state) {
                let value2 = (next.parser_fn).call(state)?;
                return Ok(Some((value1, value2)));
            }
            Err(())
        };

        Parser::new(then)
    }

    pub fn or(self, other: Parser<'a, Output>) -> Parser<'a, Output> {
        let or = move |state: &mut ParserState<'a>| {
            if let Ok(value) = self.parser_fn.call(state) {
                return Ok(value);
            }
            if let Ok(value) = other.parser_fn.call(state) {
                return Ok(value);
            }
            Err(())
        };
        Parser::new(or)
    }

    pub fn or_else(self, f: fn() -> Output) -> Parser<'a, Output> {
        let or_else = move |state: &mut ParserState<'a>| match self.parser_fn.call(state) {
            Err(_) => return Ok(Some(f())),
            Ok(value) => return Ok(value),
        };
        Parser::new(or_else)
    }

    pub fn map<Output2>(self, f: fn(Output) -> Output2) -> Parser<'a, Output2> {
        let map = move |state: &mut ParserState<'a>| {
            match self.parser_fn.call(state) {
                Err(_) => return Err(()),
                Ok(Some(value)) => return Ok(Some(f(value))),
                Ok(_) => return Ok(None),
            };
        };

        Parser::new(map)
    }

    pub fn opt(self) -> Parser<'a, Output> {
        let opt = move |state: &mut ParserState<'a>| {
            match self.parser_fn.call(state) {
                Err(_) => return Ok(None),
                Ok(result) => return Ok(result),
            };
        };

        Parser::new(opt)
    }

    pub fn skip<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output> {
        self.then(next).map(|(x, _)| x)
    }

    pub fn next<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output2> {
        self.then(next).map(|(_, x)| {
            if let Some(x) = x {
                x
            } else {
                panic!("Expected value");
            }
        })
    }

    pub fn many(self, lower: Option<usize>, upper: Option<usize>) -> Parser<'a, Vec<Output>> {
        let many = move |state: &mut ParserState<'a>| {
            let mut values = Vec::new();

            for i in 0..upper.unwrap_or(std::usize::MAX) {
                if let Ok(value) = self.parser_fn.call(state) {
                    if let Some(value) = value {
                        values.push(value);
                    }
                } else if i < lower.unwrap_or(0) {
                    return Err(());
                } else {
                    break;
                }
            }

            Ok(Some(values))
        };

        Parser::new(many)
    }

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
            let _ = left.parser_fn.call(state)?;
            let value = self.parser_fn.call(state)?;
            let _ = right.parser_fn.call(state)?;

            Ok(value)
        };

        Parser::new(wrap)
    }

    pub fn trim<Output2>(self, trimmer: Parser<'a, Output2>) -> Parser<'a, Output> {
        let trim = move |state: &mut ParserState<'a>| {
            let _ = trimmer.parser_fn.call(state)?;
            let value = (self.parser_fn).call(state)?;
            let _ = trimmer.parser_fn.call(state)?;

            Ok(value)
        };

        Parser::new(trim)
    }

    pub fn trim_whitespace(self) -> Parser<'a, Output> {
        let trim_leading_whitespace = |state: &ParserState<'a>| {
            let slc = &state.src[state.offset..];
            slc.chars().take_while(|c| c.is_whitespace()).count()
        };

        let trim_whitespace = move |state: &mut ParserState<'a>| {
            state.offset += trim_leading_whitespace(state);

            let value = self.parser_fn.call(state)?;

            state.offset += trim_leading_whitespace(state);
            Ok(value)
        };

        Parser::new(trim_whitespace)
    }

    pub fn sep_by<Output2>(
        self,
        delim: Parser<'a, Output2>,
        lower: Option<usize>,
        upper: Option<usize>,
    ) -> Parser<'a, Vec<Output>> {
        let sep_by = move |state: &mut ParserState<'a>| {
            let mut values = Vec::new();

            loop {
                if let Ok(value) = self.parser_fn.call(state) {
                    if let Some(value) = value {
                        values.push(value);
                    }
                } else {
                    break;
                }

                if let Ok(_) = delim.parser_fn.call(state) {
                } else {
                    break;
                }
            }

            if lower.map_or(true, |min| values.len() >= min)
                && upper.map_or(true, |max| values.len() <= max)
            {
                Ok(Some(values))
            } else {
                Err(())
            }
        };

        Parser::new(sep_by)
    }

    pub fn look_ahead(self, parser: Parser<'a, Output>) -> Parser<'a, Output> {
        let look_ahead = move |state: &mut ParserState<'a>| {
            let value = self.parser_fn.call(state)?;
            parser.parser_fn.call(state)?;
            state.restore();
            Ok(value)
        };

        Parser::new(look_ahead)
    }
}

impl<'a, Output2> std::ops::BitOr<Parser<'a, Output2>> for Parser<'a, Output2>
where
    Output2: 'a,
{
    type Output = Parser<'a, Output2>;

    fn bitor(self, other: Parser<'a, Output2>) -> Self::Output {
        self.or(other)
    }
}

pub fn eof<'a>() -> Parser<'a, ()> {
    let eof = move |state: &mut ParserState<'a>| {
        if state.offset >= state.src.len() {
            Ok(Some(()))
        } else {
            Err(())
        }
    };
    Parser::new(eof)
}

type LazyParserFn<'a, Output> = Box<dyn Fn() -> Parser<'a, Output>>;

pub struct LazyParser<'a, Output>
where
    Output: 'a,
{
    lazy_parser_fn: LazyParserFn<'a, Output>,
    cached_parser: Option<Rc<Parser<'a, Output>>>,
}

impl<'a, Output> LazyParser<'a, Output>
where
    Output: 'a,
{
    pub fn new(lazy_parser_fn: LazyParserFn<'a, Output>) -> Self {
        LazyParser {
            lazy_parser_fn: Box::new(lazy_parser_fn),
            cached_parser: None,
        }
    }

    pub fn get(&mut self) -> Rc<Parser<'a, Output>> {
        if let Some(parser) = self.cached_parser.as_ref() {
            parser.clone()
        } else {
            let parser = Rc::new((self.lazy_parser_fn)());
            self.cached_parser = Some(parser.clone());
            parser
        }
    }
}

pub fn lazy<'a, Output>(f: LazyParserFn<'a, Output>) -> Parser<'a, Output>
where
    Output: 'a,
{
    let lazy_parser = RefCell::new(LazyParser::new(f));

    let lazy = move |state: &mut ParserState<'a>| {
        let parser = lazy_parser.borrow_mut().get();
        parser.parser_fn.call(state)
    };

    Parser::new(lazy)
}

pub fn string<'a>(s: &'a str) -> Parser<'a, &'a str> {
    let string = move |state: &mut ParserState<'a>| {
        let slc = &state.src[state.offset..];
        if slc.starts_with(s) {
            state.offset += s.len();
            Ok(Some(s))
        } else {
            Err(())
        }
    };

    Parser::new(string)
}

pub fn regex<'a>(r: &str) -> Parser<'a, &'a str> {
    let re = Regex::new(r).expect(&format!("Failed to compile regex: {}", r));

    let regex = move |state: &mut ParserState<'a>| {
        let slc = &state.src[state.offset..];

        match re.find(slc) {
            Some(m) => {
                if m.start() != 0 {
                    return Err(());
                }
                state.offset += m.end();
                Ok(Some(m.as_str()))
            }
            None => Err(()),
        }
    };

    Parser::new(regex)
}
