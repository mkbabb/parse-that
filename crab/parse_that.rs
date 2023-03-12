use regex::Regex;

#[derive(Debug, Clone, Copy)]
pub struct ParserState<'a> {
    src: &'a str,
    offset: usize,
}

impl<'a> ParserState<'a> {
    fn from(&self, offset: usize) -> ParserState<'a> {
        let offset = self.offset + offset;
        ParserState {
            src: self.src,
            offset,
        }
    }

    #[allow(dead_code)]
    fn get_column_number(&self) -> usize {
        let offset = self.offset;
        let last_newline = self.src[..offset].rfind('\n').unwrap_or(0);
        offset - last_newline - 1
    }

    #[allow(dead_code)]
    fn get_line_number(&self) -> usize {
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

pub struct Parser<'a, Output>
where
    Self: Sized + 'a,
    Output: 'a,
{
    parser_fn: ParserFunction<'a, Output>,
}

impl<'a, Output> Parser<'a, Output> {
    pub fn parse(&self, src: &'a str) -> Option<Output> {
        let state = ParserState { src, offset: 0 };

        match (self.parser_fn)(&state) {
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

        Parser {
            parser_fn: Box::new(then),
        }
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

        Parser {
            parser_fn: Box::new(or),
        }
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

        Parser {
            parser_fn: Box::new(not),
        }
    }

    pub fn negate(self) -> Parser<'a, Option<Output>> {
        let negate = move |state: &ParserState<'a>| {
            if let Ok(_) = (self.parser_fn)(state) {
                return Err(());
            }

            Ok((state.from(0), None))
        };
        Parser {
            parser_fn: Box::new(negate),
        }
    }

    pub fn map<Output2>(self, f: fn(Output) -> Output2) -> Parser<'a, Output2> {
        let map = move |state: &ParserState<'a>| {
            if let Ok((state1, Some(value1))) = (self.parser_fn)(state) {
                return Ok((state1, Some(f(value1))));
            }
            Err(())
        };
        Parser {
            parser_fn: Box::new(map),
        }
    }

    pub fn opt(self) -> Parser<'a, Output> {
        let opt = move |state: &ParserState<'a>| match (self.parser_fn)(state) {
            Err(_) => return Ok((state.from(0), None)),
            Ok(result) => return Ok(result),
        };

        Parser {
            parser_fn: Box::new(opt),
        }
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
            let mut state1 = state.from(0);
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

            Ok((state1.from(0), Some(values)))
        };

        Parser {
            parser_fn: Box::new(many),
        }
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

        Parser {
            parser_fn: Box::new(wrap),
        }
    }

    pub fn trim<Output2>(self, trimmer: Parser<'a, Output2>) -> Parser<'a, Output> {
        let trim = move |state: &ParserState<'a>| {
            let (state1, _) = (trimmer.parser_fn)(state)?;
            let (state2, value2) = (self.parser_fn)(&state1)?;
            let (state3, _) = (trimmer.parser_fn)(&state2)?;

            Ok((state3, value2))
        };

        Parser {
            parser_fn: Box::new(trim),
        }
    }

    pub fn trim_whitespace(self) -> Parser<'a, Output> {
        self.trim(regex(r"\s*"))
    }

    pub fn sep_by<Output2>(
        self,
        delim: Parser<'a, Output2>,
        lower: Option<usize>,
        upper: Option<usize>,
    ) -> Parser<'a, Vec<Output>> {
        self.skip(delim.opt())
            .many(lower.map_or(Some(1), |x| Some(x + 1)), upper)
    }

    pub fn look_ahead(self, parser: Parser<'a, Output>) -> Parser<'a, Output> {
        let look_ahead = move |state: &ParserState<'a>| {
            let (state1, value1) = (self.parser_fn)(state)?;
            (parser.parser_fn)(&state1)?;

            Ok((state1, value1))
        };

        Parser {
            parser_fn: Box::new(look_ahead),
        }
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
        if state.offset == state.src.len() {
            Ok((state.from(0), Some(())))
        } else {
            Err(())
        }
    };

    Parser {
        parser_fn: Box::new(eof),
    }
}

use std::cell::RefCell;
use std::rc::Rc;

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
    let lazy_parser = Rc::new(RefCell::new(LazyParser::new(f)));

    let lazy = move |state: &ParserState<'a>| {
        let parser = lazy_parser.borrow_mut().get();
        (parser.parser_fn)(state)
    };

    Parser {
        parser_fn: Box::new(lazy),
    }
}

pub fn string<'a>(s: &'a str) -> Parser<'a, &'a str> {
    let string = move |state: &ParserState<'a>| {
        state
            .src
            .get(state.offset..)
            .and_then(|src| {
                if src.starts_with(s) {
                    Some((state.from(s.len()), Some(s)))
                } else {
                    None
                }
            })
            .ok_or(())
    };

    Parser {
        parser_fn: Box::new(string),
    }
}

pub fn regex<'a>(r: &str) -> Parser<'a, &'a str> {
    let re = Regex::new(r).expect(&format!("Failed to compile regex: {}", r));

    let regex = move |state: &ParserState<'a>| {
        let slc = state.src.get(state.offset..).unwrap_or("");
        if let Some(m) = re.find(slc) {
            if m.start() == 0 {
                let value = m.as_str();
                let offset = m.end();
                return Ok((state.from(offset), Some(value)));
            }
        }

        return Err(());
    };

    Parser {
        parser_fn: Box::new(regex),
    }
}
