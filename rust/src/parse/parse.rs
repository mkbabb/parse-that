use regex::Regex;
use std::cell::RefCell;
use std::collections::HashMap;
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

type ParserFunction<'a, Output> =
    Box<dyn Fn(&ParserState<'a>) -> Result<(ParserState<'a>, Option<Output>), ()> + 'a>;

pub struct ParserContext<'a> {
    pub state: ParserState<'a>,
    pub memo: HashMap<usize, ParserState<'a>>,
    pub left_recursion_counts: HashMap<usize, usize>,
}

impl<'a> Default for ParserContext<'a> {
    fn default() -> Self {
        ParserContext {
            state: ParserState { src: "", offset: 0 },
            memo: HashMap::new(),
            left_recursion_counts: HashMap::new(),
        }
    }
}

type ParserContextRef<'a> = Rc<RefCell<Option<ParserContext<'a>>>>;

pub fn merge_context_impl<'a>(context: ParserContextRef<'a>, state: &ParserState<'a>) {
    let mut context = context.borrow_mut();
    if let Some(context) = context.as_mut() {
        if context.state.offset < state.offset {
            context.state = state.clone();
        }
    }
}

pub struct Parser<'a, Output>
where
    Self: Sized + 'a,
    Output: 'a,
{
    pub parser_fn: ParserFunction<'a, Output>,
    pub context: ParserContextRef<'a>,
}

impl<'a, Output> Parser<'a, Output> {
    pub fn new(
        parser_fn: ParserFunction<'a, Output>,
        context: Option<ParserContextRef<'a>>,
    ) -> Parser<'a, Output> {
        let parser = Parser {
            parser_fn,
            context: context.unwrap_or(Rc::new(RefCell::new(None))),
        };

        if cfg!(feature = "perf") {
            return parser;
        } else {
            return parser.merge_context();
        }
    }

    fn merge_context(self) -> Parser<'a, Output> {
        let context = self.context.clone();

        let _merge_error_state = move |state: &ParserState<'a>| {
            let context = self.context.clone();

            match (self.parser_fn)(state) {
                Ok((state, value)) => {
                    merge_context_impl(context, &state);
                    return Ok((state, value));
                }

                Err(_) => {
                    merge_context_impl(context, state);
                    return Err(());
                }
            };
        };

        Parser {
            parser_fn: Box::new(_merge_error_state),
            context,
        }
    }

    pub fn parse_return_state(
        &self,
        src: &'a str,
    ) -> Result<(ParserState<'a>, Option<Output>), ()> {
        let state = ParserState { src, offset: 0 };
        if cfg!(feature = "perf") {
        } else {
            self.context.replace(Some(ParserContext::default()));
        }
        return (self.parser_fn)(&state);
    }

    pub fn parse(&self, src: &'a str) -> Option<Output> {
        match self.parse_return_state(src) {
            Ok((_, value)) => value,
            Err(_) => None,
        }
    }

    pub fn then<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, (Output, Option<Output2>)> {
        let then = move |state: &ParserState<'a>| {
            if let Ok((state1, Some(value1))) = (self.parser_fn)(state) {
                let (state2, value2) = (next.parser_fn)(&state1)?;

                return Ok((state2, Some((value1, value2))));
            }
            Err(())
        };

        Parser::new(Box::new(then), Some(self.context.clone()))
    }

    pub fn or(self, other: Parser<'a, Output>) -> Parser<'a, Output> {
        let or = move |state: &ParserState<'a>| {
            if let Ok(state1) = (self.parser_fn)(state) {
                return Ok(state1);
            }
            if let Ok(state2) = (other.parser_fn)(state) {
                return Ok(state2);
            }

            Err(())
        };

        Parser::new(Box::new(or), Some(self.context.clone()))
    }

    pub fn or_else(self, f: fn() -> Output) -> Parser<'a, Output> {
        let or_else = move |state: &ParserState<'a>| match (self.parser_fn)(state) {
            Err(_) => return Ok((state.clone(), Some(f()))),
            Ok(result) => return Ok(result),
        };

        Parser::new(Box::new(or_else), Some(self.context.clone()))
    }

    pub fn not<Output2>(self, parser: Parser<'a, Output2>) -> Parser<'a, Output> {
        let not = move |state: &ParserState<'a>| {
            if let Ok(_) = (parser.parser_fn)(state) {
                return Err(());
            }
            if let Ok(result) = (self.parser_fn)(state) {
                return Ok(result);
            }
            Err(())
        };

        Parser::new(Box::new(not), Some(self.context.clone()))
    }

    pub fn negate(self) -> Parser<'a, Option<Output>> {
        let negate = move |state: &ParserState<'a>| match (self.parser_fn)(state) {
            Err(_) => Ok((state.clone(), None)),
            Ok(_) => Err(()),
        };

        Parser::new(Box::new(negate), Some(self.context.clone()))
    }

    pub fn map<Output2>(self, f: fn(Output) -> Output2) -> Parser<'a, Output2> {
        let map = move |state: &ParserState<'a>| match (self.parser_fn)(state) {
            Err(_) => return Err(()),
            Ok((state1, Some(value1))) => return Ok((state1, Some(f(value1)))),
            Ok((state1, None)) => return Ok((state1, None)),
        };

        Parser::new(Box::new(map), Some(self.context.clone()))
    }

    pub fn map_state(
        self,
        f: fn(&ParserState<'a>, &ParserState<'a>) -> ParserState<'a>,
    ) -> Parser<'a, Output> {
        let map_state = move |state: &ParserState<'a>| match (self.parser_fn)(state) {
            Ok((state1, value)) => {
                return Ok((f(state, &state1), value));
            }
            Err(_) => {
                return Err(());
            }
        };
        Parser::new(Box::new(map_state), Some(self.context.clone()))
    }

    pub fn satisfy(self, f: fn(&Output) -> bool) -> Parser<'a, Output> {
        let satisfy = move |state: &ParserState<'a>| match (self.parser_fn)(state) {
            Err(_) => return Err(()),
            Ok((state1, Some(value1))) => {
                if f(&value1) {
                    return Ok((state1, Some(value1)));
                }
                return Err(());
            }
            Ok((state1, None)) => return Ok((state1, None)),
        };

        Parser::new(Box::new(satisfy), Some(self.context.clone()))
    }

    pub fn opt(self) -> Parser<'a, Output> {
        let opt = move |state: &ParserState<'a>| match (self.parser_fn)(state) {
            Err(_) => return Ok((state.clone(), None)),
            Ok(result) => return Ok(result),
        };
        Parser::new(Box::new(opt), Some(self.context.clone()))
    }

    pub fn skip<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output> {
        self.then(next).map(|(x, _)| x)
    }

    pub fn next<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output2> {
        self.then(next).map(|(_, x)| {
            if let Some(x) = x {
                x
            } else {
                panic!("Expected value, got None");
            }
        })
    }

    pub fn many(self, lower: Option<usize>, upper: Option<usize>) -> Parser<'a, Vec<Output>> {
        let many = move |state: &ParserState<'a>| {
            let mut state1 = state.clone();
            let mut values = Vec::new();

            for i in 0..upper.unwrap_or(std::usize::MAX) {
                if let Ok((state2, value2)) = (self.parser_fn)(&state1) {
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

        Parser::new(Box::new(many), Some(self.context.clone()))
    }

    pub fn wrap<Output2, Output3>(
        self,
        left: Parser<'a, Output2>,
        right: Parser<'a, Output3>,
    ) -> Parser<'a, Output> {
        let wrap = move |state: &ParserState<'a>| {
            let (state1, _) = (left.parser_fn)(state)?;
            let (state2, value2) = (self.parser_fn)(&state1)?;
            let (state3, _) = (right.parser_fn)(&state2)?;

            Ok((state3, value2))
        };

        Parser::new(Box::new(wrap), Some(self.context.clone()))
    }

    pub fn trim<Output2>(self, trimmer: Parser<'a, Output2>) -> Parser<'a, Output> {
        let trim = move |state: &ParserState<'a>| {
            let (state1, _) = (trimmer.parser_fn)(state)?;
            let (state2, value2) = (self.parser_fn)(&state1)?;
            let (state3, _) = (trimmer.parser_fn)(&state2)?;

            Ok((state3, value2))
        };

        Parser::new(Box::new(trim), Some(self.context.clone()))
    }

    pub fn trim_whitespace(self) -> Parser<'a, Output> {
        let trim_leading_whitespace = move |state: &ParserState<'a>| {
            let slc = &state.src[state.offset..];
            slc.chars().take_while(|c| c.is_whitespace()).count()
        };

        let trim_whitespace = move |state: &ParserState<'a>| {
            let offset = trim_leading_whitespace(state);

            let state1 = state.from(offset);
            let (state2, value2) = (self.parser_fn)(&state1)?;

            let offset = trim_leading_whitespace(&state2);

            Ok((state2.from(offset), value2))
        };

        Parser::new(Box::new(trim_whitespace), Some(self.context.clone()))
    }

    pub fn sep_by<Output2>(
        self,
        delim: Parser<'a, Output2>,
        lower: Option<usize>,
        upper: Option<usize>,
    ) -> Parser<'a, Vec<Output>> {
        // self.skip(delim.opt())
        //     .many(lower.map_or(Some(1), |x| Some(x + 1)), upper)

        let sep_by = move |state: &ParserState<'a>| {
            let mut state1 = state.clone();
            let mut values = Vec::new();

            for i in 0..upper.unwrap_or(std::usize::MAX) {
                if let Ok((state2, value2)) = (self.parser_fn)(&state1) {
                    if let Some(value2) = value2 {
                        values.push(value2);
                    }
                    state1 = state2;
                } else if i < lower.unwrap_or(0) {
                    return Err(());
                } else {
                    break;
                }

                if let Ok((state2, _)) = (delim.parser_fn)(&state1) {
                    state1 = state2;
                } else {
                    break;
                }
            }

            Ok((state1, Some(values)))
        };

        Parser::new(Box::new(sep_by), Some(self.context.clone()))
    }

    pub fn look_ahead(self, parser: Parser<'a, Output>) -> Parser<'a, Output> {
        let look_ahead = move |state: &ParserState<'a>| {
            let (state1, value1) = (self.parser_fn)(state)?;
            (parser.parser_fn)(&state1)?;

            Ok((state1, value1))
        };

        Parser::new(Box::new(look_ahead), Some(self.context.clone()))
    }
}

impl<'a, Output> std::ops::BitOr<Parser<'a, Output>> for Parser<'a, Output> {
    type Output = Parser<'a, Output>;
    fn bitor(self, other: Parser<'a, Output>) -> Parser<'a, Output> {
        self.or(other)
    }
}

impl<'a, Output, Output2> std::ops::Add<Parser<'a, Output2>> for Parser<'a, Output> {
    type Output = Parser<'a, (Output, Option<Output2>)>;
    fn add(self, other: Parser<'a, Output2>) -> Parser<'a, (Output, Option<Output2>)> {
        self.then(other)
    }
}

pub fn eof<'a>() -> Parser<'a, ()> {
    let eof = move |state: &ParserState<'a>| {
        if state.offset >= state.src.len() {
            Ok((state.clone(), Some(())))
        } else {
            Err(())
        }
    };

    Parser::new(Box::new(eof), None)
}

type LazyParserFn<'a, Output> = Box<dyn Fn() -> Parser<'a, Output>>;

pub struct LazyParser<'a, Output> {
    parser_fn: LazyParserFn<'a, Output>,
    cached_parser: Option<Rc<Parser<'a, Output>>>,
}

impl<'a, Output> LazyParser<'a, Output> {
    pub fn new(parser_fn: LazyParserFn<'a, Output>) -> LazyParser<'a, Output> {
        LazyParser {
            parser_fn: parser_fn,
            cached_parser: None,
        }
    }

    pub fn get(&mut self) -> Rc<Parser<'a, Output>>
    where
        Output: 'a,
        Self: 'a,
    {
        if let Some(parser) = self.cached_parser.as_ref() {
            parser.clone()
        } else {
            let parser = Rc::new((self.parser_fn)());
            self.cached_parser = Some(parser.clone());
            parser
        }
    }
}

pub fn lazy<'a, Output>(f: LazyParserFn<'a, Output>) -> Parser<'a, Output> {
    let lazy_parser = RefCell::new(LazyParser::new(f));

    let lazy = move |state: &ParserState<'a>| {
        let parser = lazy_parser.borrow_mut().get();
        (parser.parser_fn)(state)
    };

    Parser::new(Box::new(lazy), None)
}

pub fn string<'a>(s: &'a str) -> Parser<'a, &'a str> {
    let string = move |state: &ParserState<'a>| {
        let slc = &state.src[state.offset..];
        if slc.starts_with(s) {
            Ok((state.from(s.len()), Some(s)))
        } else {
            Err(())
        }
    };
    Parser::new(Box::new(string), None)
}

pub fn regex<'a>(r: &str) -> Parser<'a, &'a str> {
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

    Parser::new(Box::new(regex), None)
}
