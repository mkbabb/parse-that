use regex::Regex;

use std::any::Any;
use std::cell::RefCell;

use std::ops::{Range, RangeBounds};
use std::rc::Rc;

#[inline(always)]
pub fn trim_leading_whitespace<'a>(state: &ParserState<'a>) -> usize {
    unsafe {
        state
            .src_bytes
            .get_unchecked(state.offset..)
            .iter()
            .take_while(|&b| u8::is_ascii_whitespace(b))
            .count()
    }
}

pub struct Span<'a> {
    pub start: usize,
    pub end: usize,
    pub src: &'a str,
}

impl<'a> Span<'a> {
    pub fn new(start: usize, end: usize, src: &'a str) -> Self {
        Span { start, end, src }
    }

    pub fn as_str(&self) -> &'a str {
        unsafe { self.src.get_unchecked(self.start..self.end) }
    }
}

pub struct ParserState<'a> {
    pub src: &'a str,
    pub src_bytes: &'a [u8],

    pub offset: usize,

    pub state_stack: Vec<usize>,
}

impl<'a> Default for ParserState<'a> {
    fn default() -> Self {
        ParserState {
            src: "",
            src_bytes: &[],
            offset: 0,
            state_stack: Vec::new(),
        }
    }
}

impl<'a> ParserState<'a> {
    pub fn new(src: &'a str) -> ParserState<'a> {
        ParserState {
            src,
            src_bytes: src.as_bytes(),
            ..Default::default()
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

type ParserResult<'a, Output> = Option<Output>;

pub trait ParserFn<'a, Output>: 'a {
    fn call(&self, state: &mut ParserState<'a>) -> ParserResult<'a, Output>;
    fn as_any(&self) -> &(dyn Any + 'a);
}

impl<'a, Output, F> ParserFn<'a, Output> for F
where
    F: Fn(&mut ParserState<'a>) -> ParserResult<'a, Output> + 'a,
{
    fn call(&self, state: &mut ParserState<'a>) -> ParserResult<'a, Output> {
        self(state)
    }

    fn as_any(&self) -> &(dyn Any + 'a) {
        self
    }
}

pub struct Parser<'a, Output> {
    pub parser_fn: Box<dyn ParserFn<'a, Output> + 'a>,
}

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
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
        return self.parser_fn.call(&mut state);
    }

    pub fn parse(&self, src: &'a str) -> Option<Output> {
        self.parse_return_state(src)
    }

    pub fn save_state(self) -> Parser<'a, Output> {
        let save_state = move |state: &mut ParserState<'a>| {
            state.save();

            let result = self.parser_fn.call(state);

            if state.state_stack.is_empty() {
                return result;
            }

            match result {
                Some(_) => {
                    state.state_stack.pop();
                }
                None => state.restore(),
            }

            result
        };

        return Parser {
            parser_fn: Box::new(save_state),
        };
    }

    pub fn then<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, (Output, Option<Output2>)>
    where
        Output2: 'a,
    {
        let then = move |state: &mut ParserState<'a>| {
            if let Some(value1) = (self.parser_fn).call(state) {
                let value2 = (next.parser_fn).call(state);
                return Some((value1, value2));
            }
            None
        };

        Parser::new(then)
    }

    pub fn with<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, (Output, Output2)>
    where
        Output2: 'a,
    {
        let with = move |state: &mut ParserState<'a>| {
            if let Some(value1) = (self.parser_fn).call(state) {
                if let Some(value2) = (next.parser_fn).call(state) {
                    return Some((value1, value2));
                }
            }
            None
        };
        Parser::new(with)
    }

    pub fn or(self, other: Parser<'a, Output>) -> Parser<'a, Output> {
        let or = move |state: &mut ParserState<'a>| {
            if let Some(value) = self.parser_fn.call(state) {
                return Some(value);
            }
            if let Some(value) = other.parser_fn.call(state) {
                return Some(value);
            }
            None
        };

        Parser::new(or)
    }

    pub fn or_else(self, f: fn() -> Output) -> Parser<'a, Output> {
        let or_else = move |state: &mut ParserState<'a>| match self.parser_fn.call(state) {
            Some(value) => return Some(value),
            None => return Some(f()),
        };
        Parser::new(or_else)
    }

    pub fn opt(self) -> Parser<'a, Option<Output>> {
        let opt = move |state: &mut ParserState<'a>| {
            if let Some(value) = self.parser_fn.call(state) {
                return Some(Some(value));
            }
            Some(None)
        };
        Parser::new(opt)
    }

    pub fn map<Output2>(self, f: fn(Output) -> Output2) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map = move |state: &mut ParserState<'a>| {
            match self.parser_fn.call(state) {
                Some(value) => return Some(f(value)),
                None => return None,
            };
        };

        Parser::new(map)
    }

    pub fn skip<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let skip = move |state: &mut ParserState<'a>| {
            if let Some(value) = (self.parser_fn).call(state) {
                let _ = (next.parser_fn).call(state)?;
                return Some(value);
            }
            None
        };
        Parser::new(skip)
    }

    pub fn next<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let next = move |state: &mut ParserState<'a>| {
            if let Some(_) = (self.parser_fn).call(state) {
                return (next.parser_fn).call(state);
            }
            None
        };
        Parser::new(next)
    }

    pub fn many(self, lower: Option<usize>, upper: Option<usize>) -> Parser<'a, Vec<Output>> {
        let many = move |state: &mut ParserState<'a>| {
            let mut values = Vec::new();

            loop {
                if let Some(value) = self.parser_fn.call(state) {
                    values.push(value);
                } else {
                    break;
                }
            }
            if lower.map_or(true, |min| values.len() >= min)
                && upper.map_or(true, |max| values.len() <= max)
            {
                Some(values)
            } else {
                None
            }
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
            if let None = left.parser_fn.call(state) {
                return None;
            }
            let Some(value) = self.parser_fn.call(state) else {
                return None;
            };
            if let None = right.parser_fn.call(state) {
                return None;
            }

            Some(value)
        };

        Parser::new(wrap)
    }

    pub fn trim<Output2>(self, trimmer: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            if let None = trimmer.parser_fn.call(state) {
                return None;
            }
            let Some(value) = self.parser_fn.call(state) else {
                return None;
            };
            if let None = trimmer.parser_fn.call(state) {
                return None;
            }
            Some(value)
        };

        Parser::new(trim)
    }

    pub fn trim_whitespace(self) -> Parser<'a, Output> {
        let trim_whitespace = move |state: &mut ParserState<'a>| {
            state.offset += trim_leading_whitespace(state);
            let Some(value) = self.parser_fn.call(state) else {
                return None;
            };
            state.offset += trim_leading_whitespace(state);
            Some(value)
        };

        Parser::new(trim_whitespace)
    }

    pub fn sep_by<Output2>(
        self,
        delim: Parser<'a, Output2>,
        lower: Option<usize>,
        upper: Option<usize>,
    ) -> Parser<'a, Vec<Output>>
    where
        Output2: 'a,
    {
        let sep_by = move |state: &mut ParserState<'a>| {
            let mut values = Vec::new();

            loop {
                if let Some(value) = self.parser_fn.call(state) {
                    values.push(value);
                } else {
                    break;
                }
                if let Some(_) = delim.parser_fn.call(state) {
                } else {
                    break;
                }
            }

            if lower.map_or(true, |min| values.len() >= min)
                && upper.map_or(true, |max| values.len() <= max)
            {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(sep_by)
    }

    pub fn look_ahead(self, parser: Parser<'a, Output>) -> Parser<'a, Output> {
        let look_ahead = move |state: &mut ParserState<'a>| {
            let Some(value) = self.parser_fn.call(state)  else {
                return None;
            };
            if let None = parser.parser_fn.call(state) {
                return None;
            }

            state.restore();

            Some(value)
        };

        Parser::new(look_ahead).save_state()
    }

    pub fn eof(self) -> Parser<'a, Output> {
        let eof = move |state: &mut ParserState<'a>| {
            let Some(value) = self.parser_fn.call(state) else {
                return None;
            };
            if state.offset >= state.src.len() {
                Some(value)
            } else {
                None
            }
        };

        Parser::new(eof)
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
    cached_parser: Option<Rc<Parser<'a, Output>>>,
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

    pub fn get(&mut self) -> Rc<Parser<'a, Output>>
    where
        Output: 'a,
        Self: 'a,
    {
        if let Some(parser) = self.cached_parser.clone() {
            parser
        } else {
            let parser = Rc::new(self.parser_fn.call());
            self.cached_parser = Some(parser.clone());
            parser
        }
    }
}

pub fn lazy<'a, F, Output>(f: F) -> Parser<'a, Output>
where
    Output: 'a,
    F: LazyParserFn<'a, Output> + 'a,
{
    let lazy_parser = RefCell::new(LazyParser::new(f));

    let lazy = move |state: &mut ParserState<'a>| {
        let parser = lazy_parser.borrow_mut().get();
        parser.parser_fn.call(state)
    };

    Parser::new(lazy)
}

#[inline(always)]
pub fn string<'a>(s: &'a str) -> Parser<'a, &'a str> {
    let s_bytes = s.as_bytes();
    let end = s_bytes.len();

    let string = move |state: &mut ParserState<'a>| {
        let Some(slc) = &state.src_bytes.get(state.offset..) else {
            return None;
        };

        if slc[0] == s_bytes[0] && slc[1..end].starts_with(&s_bytes[1..]) {
            state.offset += end;
            Some(s)
        } else {
            None
        }
    };
    Parser::new(string)
}

pub fn take<'a>(n: usize) -> Parser<'a, &'a str> {
    let take = move |state: &mut ParserState<'a>| unsafe {
        let slc = &state.src.get_unchecked(state.offset..);

        if slc.len() >= n {
            let result = &slc[..n];
            state.offset += n;
            Some(result)
        } else {
            None
        }
    };
    Parser::new(take)
}

pub fn regex<'a>(r: &'a str) -> Parser<'a, &'a str> {
    let re = Regex::new(r).unwrap_or_else(|_| panic!("Failed to compile regex: {}", r));

    let regex = move |state: &mut ParserState<'a>| unsafe {
        let slc = &state.src.get_unchecked(state.offset..);

        match re.find_at(slc, 0) {
            Some(m) => {
                if m.start() != 0 {
                    return None;
                }
                state.offset += m.end();
                Some(m.as_str())
            }
            None => None,
        }
    };
    Parser::new(regex)
}

#[inline(always)]
pub fn string_span<'a>(s: &'a str) -> Parser<'a, Span<'a>> {
    let s_bytes = s.as_bytes();
    let end = s_bytes.len();

    let string = move |state: &mut ParserState<'a>| {
        let Some(slc) = &state.src_bytes.get(state.offset..) else {
            return None;
        };

        if slc[0] == s_bytes[0] && slc[1..end].starts_with(&s_bytes[1..]) {
            let start = state.offset;
            state.offset += end;
            Some(Span::new(start, state.offset, &state.src))
        } else {
            None
        }
    };
    Parser::new(string)
}

pub fn take_span<'a>(n: usize) -> Parser<'a, Span<'a>> {
    let take = move |state: &mut ParserState<'a>| {
        let Some(slc) = &state.src.get(state.offset..) else {
            return None;
        };

        if slc.len() >= n {
            let start = state.offset;
            state.offset += n;

            Some(Span::new(start, state.offset, &state.src))
        } else {
            None
        }
    };
    Parser::new(take)
}

pub fn take_while_span<'a, F>(f: F) -> Parser<'a, Span<'a>>
where
    F: Fn(char) -> bool + 'a,
{
    let take_while = move |state: &mut ParserState<'a>| {
        let Some(slc) = state.src.get(state.offset..) else {
            return None;
        };
        let Some(mut len) = slc
            .char_indices()
            .take_while(|(_, c)| f(*c))
            .map(|(i, _)| i)
            .last() else {
            return None;
            };
        len += 1;

        while len < slc.len() && !slc.is_char_boundary(len) {
            len += 1;
        }

        let start = state.offset;
        state.offset += len;
        Some(Span::new(start, state.offset, &state.src))
    };

    Parser::new(take_while)
}

impl<'a> Parser<'a, Span<'a>> {
    pub fn opt_span(self) -> Parser<'a, Span<'a>> {
        let opt = move |state: &mut ParserState<'a>| {
            let start = state.offset;

            let Some(_) = self.parser_fn.call(state) else {
                return Some(Span::new(start, start, &state.src));
            };

            Some(Span::new(start, state.offset, &state.src))
        };

        Parser::new(opt)
    }

    pub fn then_span(self, other: Parser<'a, Span<'a>>) -> Parser<'a, Span<'a>> {
        let then = move |state: &mut ParserState<'a>| {
            let Some(start) = self.parser_fn.call(state) else {
                return None
            };
            let Some(end) = other.parser_fn.call(state) else {
                return None
            };
            Some(Span::new(start.start, end.end, &state.src))
        };
        Parser::new(then)
    }

    pub fn wrap_span(
        self,
        left: Parser<'a, Span<'a>>,
        right: Parser<'a, Span<'a>>,
    ) -> Parser<'a, Span<'a>> {
        let wrap = move |state: &mut ParserState<'a>| {
            let Some(left) = left.parser_fn.call(state) else {
                return None
            };
            let Some(_) = self.parser_fn.call(state) else {
                return None
            };
            let Some(right) = right.parser_fn.call(state) else {
                return None
            };
            Some(Span::new(left.start, right.end, &state.src))
        };
        Parser::new(wrap)
    }

    pub fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> Parser<'a, Span<'a>> {
        let many = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            let mut end = state.offset;

            let mut count = 0;

            while bounds.contains(&count) {
                match self.parser_fn.call(state) {
                    Some(span) => {
                        end = span.end;
                        count += 1;
                    }
                    None => break,
                }
            }
            if bounds.contains(&count) {
                Some(Span::new(start, end, &state.src))
            } else {
                None
            }
        };

        Parser::new(many)
    }
}
