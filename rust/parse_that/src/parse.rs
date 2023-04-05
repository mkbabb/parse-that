use regex::Regex;

use std::cell::RefCell;

use std::ops::RangeBounds;
use std::rc::Rc;

use crate::state::{ParserState, Span};
use crate::utils::extract_bounds;

#[inline(always)]
pub fn trim_leading_whitespace(state: &ParserState<'_>) -> usize {
    unsafe {
        state
            .src_bytes
            .get_unchecked(state.offset..)
            .iter()
            .take_while(|&b| u8::is_ascii_whitespace(b))
            .count()
    }
}

type ParserResult<'a, Output> = Option<Output>;

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
    Self: 'a,
    Output: 'a,
{
    pub fn new(parser_fn: impl ParserFn<'a, Output>) -> Parser<'a, Output> {
        Parser {
            parser_fn: Box::new(parser_fn),
        }
    }

    pub fn parse_return_state(&self, src: &'a str) -> ParserResult<'a, Output> {
        let mut state = ParserState::new(src);
        self.parser_fn.call(&mut state)
    }

    pub fn parse(&self, src: &'a str) -> Option<Output> {
        self.parse_return_state(src)
    }

    #[inline(always)]
    pub fn merge_context(self) -> Parser<'a, Output> {
        let merge_context = #[inline(always)]
        move |state: &mut ParserState<'a>| {
            let result = self.parser_fn.call(state);
            state.furthest_offset = state.furthest_offset.max(state.offset);
            result
        };
        Parser {
            parser_fn: Box::new(merge_context),
        }
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

        Parser {
            parser_fn: Box::new(save_state),
        }
    }

    pub fn then<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, (Output, Output2)>
    where
        Output2: 'a,
    {
        let with = move |state: &mut ParserState<'a>| {
            if let Some(value1) = self.parser_fn.call(state) {
                if let Some(value2) = next.parser_fn.call(state) {
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
            Some(value) => Some(value),
            None => Some(f()),
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

    pub fn not<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let not = move |state: &mut ParserState<'a>| {
            if let Some(value) = self.parser_fn.call(state) {
                if next.parser_fn.call(state).is_none() {
                    return Some(value);
                }
            }
            None
        };
        Parser::new(not)
    }

    pub fn negate(self) -> Parser<'a, ()> {
        let negate = move |state: &mut ParserState<'a>| {
            if self.parser_fn.call(state).is_none() {
                return Some(());
            }
            None
        };
        Parser::new(negate)
    }

    pub fn map<Output2>(self, f: fn(Output) -> Output2) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map = move |state: &mut ParserState<'a>| self.parser_fn.call(state).map(f);

        Parser::new(map)
    }

    pub fn map_with_state<Output2>(
        self,
        f: fn(Output, usize, &mut ParserState<'a>) -> Output2,
    ) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map_with_state = move |state: &mut ParserState<'a>| {
            let offset = state.offset;

            let Some(result) = self.parser_fn.call(state) else {
                    return None;
            };
            Some(f(result, offset, state))
        };

        Parser::new(map_with_state)
    }

    pub fn skip<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let skip = move |state: &mut ParserState<'a>| {
            if let Some(value) = self.parser_fn.call(state) {
                let _ = next.parser_fn.call(state)?;
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
            if self.parser_fn.call(state).is_some() {
                return next.parser_fn.call(state);
            }
            None
        };
        Parser::new(next)
    }

    pub fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Parser<'a, Vec<Output>> {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let many = move |state: &mut ParserState<'a>| {
            let mut values = Vec::new();

            while values.len() < upper_bound {
                if let Some(value) = self.parser_fn.call(state) {
                    values.push(value);
                } else {
                    break;
                }
            }
            if values.len() >= lower_bound {
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
            left.parser_fn.call(state)?;
            let Some(value) = self.parser_fn.call(state) else {
                return None;
            };
            right.parser_fn.call(state)?;

            Some(value)
        };

        Parser::new(wrap)
    }

    pub fn trim<Output2>(self, trimmer: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            trimmer.parser_fn.call(state)?;
            let Some(value) = self.parser_fn.call(state) else {
                return None;
            };
            trimmer.parser_fn.call(state)?;
            Some(value)
        };

        Parser::new(trim)
    }

    pub fn trim_keep<Output2>(
        self,
        trimmer: Parser<'a, Output2>,
    ) -> Parser<'a, (Output2, Output, Output2)>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            let Some(trim1) = trimmer.parser_fn.call(state) else {
                return None;
            };
            let Some(value) = self.parser_fn.call(state) else {
                return None;
            };
            let Some(trim2) = trimmer.parser_fn.call(state) else {
                return None;
            };

            Some((trim1, value, trim2))
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
        sep: Parser<'a, Output2>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> Parser<'a, Vec<Output>>
    where
        Output2: 'a,
    {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let mut values = Vec::new();

            while values.len() < upper_bound {
                if let Some(value) = self.parser_fn.call(state) {
                    values.push(value);
                } else {
                    break;
                }
                if let Some(_) = sep.parser_fn.call(state) {
                } else {
                    break;
                }
            }

            if values.len() >= lower_bound {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(sep_by)
    }

    pub fn look_ahead<Output2>(self, parser: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let look_ahead = move |state: &mut ParserState<'a>| {
            let Some(value) = self.parser_fn.call(state)  else {
                return None;
            };
            parser.parser_fn.call(state)?;
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

impl<'a, Output, Output2> std::ops::Add<Parser<'a, Output2>> for Parser<'a, Output>
where
    Output: 'a,
    Output2: 'a,
{
    type Output = Parser<'a, (Output, Output2)>;

    fn add(self, other: Parser<'a, Output2>) -> Self::Output {
        self.then(other)
    }
}

pub fn epsilon<'a>() -> Parser<'a, ()> {
    let epsilon = move |_: &mut ParserState<'a>| Some(());
    Parser::new(epsilon)
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
fn string_impl<'a>(s_bytes: &[u8], end: &usize, state: &mut ParserState<'a>) -> Option<Span<'a>> {
    if *end == 0 {
        return Some(Span::new(state.offset, state.offset, state.src));
    }

    let Some(slc) = &state.src_bytes.get(state.offset..) else {
        return None;
    };
    if slc.len() >= *end && slc[0] == s_bytes[0] && slc[1..*end].starts_with(&s_bytes[1..]) {
        let start = state.offset;
        state.offset += end;

        Some(Span::new(start, state.offset, state.src))
    } else {
        None
    }
}

#[inline(always)]
pub fn string<'a>(s: &'a str) -> Parser<'a, &'a str> {
    let s_bytes = s.as_bytes();
    let end = s_bytes.len();
    let string = move |state: &mut ParserState<'a>| {
        return string_impl(s_bytes, &end, state).map(|span| span.as_str());
    };
    Parser::new(string)
}

#[inline(always)]
pub fn string_span<'a>(s: &'a str) -> Parser<'a, Span<'a>> {
    let s_bytes = s.as_bytes();
    let end = s_bytes.len();

    let string = move |state: &mut ParserState<'a>| {
        return string_impl(s_bytes, &end, state);
    };
    Parser::new(string)
}

#[inline(always)]
fn regex_impl<'a>(re: &Regex, state: &mut ParserState<'a>) -> Option<Span<'a>> {
    if state.is_at_end() {
        return None;
    }
    let Some(slc) = &state.src.get(state.offset..) else {
        return None;
    };
    match re.find_at(slc, 0) {
        Some(m) => {
            if m.start() != 0 {
                return None;
            }
            let start = state.offset;
            state.offset += m.end();
            Some(Span::new(start, state.offset, state.src))
        }
        None => None,
    }
}

#[inline(always)]
pub fn regex<'a>(r: &'a str) -> Parser<'a, &'a str> {
    let re = Regex::new(r).unwrap_or_else(|_| panic!("Failed to compile regex: {}", r));
    let regex = move |state: &mut ParserState<'a>| regex_impl(&re, state).map(|span| span.as_str());
    Parser::new(regex)
}

#[inline(always)]
pub fn regex_span<'a>(r: &'a str) -> Parser<'a, Span<'a>> {
    let re = Regex::new(r).unwrap_or_else(|_| panic!("Failed to compile regex: {}", r));
    let regex = move |state: &mut ParserState<'a>| regex_impl(&re, state);
    Parser::new(regex)
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
        Some(Span::new(start, state.offset, state.src))
    };

    Parser::new(take_while)
}

pub fn next_span<'a>(amount: usize) -> Parser<'a, Span<'a>> {
    let next = move |state: &mut ParserState<'a>| {
        if state.is_at_end() {
            return None;
        }
        let start = state.offset;
        state.offset += amount;
        Some(Span::new(start, state.offset, state.src))
    };
    Parser::new(next)
}

use aho_corasick::{AhoCorasickBuilder, MatchKind};

pub fn any_span<'a>(patterns: &[&'a str]) -> Parser<'a, Span<'a>> {
    let ac = AhoCorasickBuilder::new()
        .match_kind(MatchKind::LeftmostFirst)
        .anchored(true)
        .build(patterns);

    let any = move |state: &mut ParserState<'a>| {
        let Some(slc) = state.src.get(state.offset..) else {
            return None;
        };
        let Some(m) = ac.find(slc) else {
            return None;
            };

        let start = state.offset;
        state.offset += m.end();
        Some(Span::new(start, state.offset, state.src))
    };

    Parser::new(any)
}

pub trait ParserSpan<'a> {
    type Output;

    fn opt(self) -> Self::Output;
    fn opt_span(self) -> Self::Output;

    fn then(self, next: Self::Output) -> Self::Output;
    fn then_span(self, next: Self::Output) -> Self::Output;

    fn wrap(self, left: Self::Output, right: Self::Output) -> Self::Output;
    fn wrap_span(self, left: Self::Output, right: Self::Output) -> Self::Output;

    fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
    fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;

    fn sep_by(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
    fn sep_by_span(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
}

impl<'a> ParserSpan<'a> for Parser<'a, Span<'a>> {
    type Output = Parser<'a, Span<'a>>;

    fn opt(self) -> Self::Output {
        let opt = move |state: &mut ParserState<'a>| {
            let start = state.offset;

            let Some(_) = self.parser_fn.call(state) else {
                return Some(Span::new(start, start, state.src));
            };

            Some(Span::new(start, state.offset, state.src))
        };
        Parser::new(opt)
    }

    fn opt_span(self) -> Self::Output {
        return ParserSpan::opt(self);
    }

    fn then(self, other: Self::Output) -> Self::Output {
        let then = move |state: &mut ParserState<'a>| {
            let Some(start) = self.parser_fn.call(state) else {
                return None
            };
            let Some(end) = other.parser_fn.call(state) else {
                return None
            };
            Some(Span::new(start.start, end.end, state.src))
        };
        Parser::new(then)
    }

    fn then_span(self, other: Self::Output) -> Self::Output {
        return ParserSpan::then(self, other);
    }

    fn wrap(self, left: Self::Output, right: Self::Output) -> Self::Output {
        let wrap = move |state: &mut ParserState<'a>| {
            let Some(_) = left.parser_fn.call(state) else {
                return None
            };
            let Some(middle) = self.parser_fn.call(state) else {
                return None
            };
            let Some(_) = right.parser_fn.call(state) else {
                return None
            };
            Some(Span::new(middle.start, middle.end, state.src))
        };
        Parser::new(wrap)
    }

    fn wrap_span(self, left: Self::Output, right: Self::Output) -> Self::Output {
        return ParserSpan::wrap(self, left, right);
    }

    fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let many = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            let mut end = state.offset;

            let mut count = 0;

            while count < upper_bound {
                match self.parser_fn.call(state) {
                    Some(span) => {
                        end = span.end;
                        count += 1;
                    }
                    None => break,
                }
            }

            if count >= lower_bound {
                Some(Span::new(start, end, state.src))
            } else {
                None
            }
        };
        Parser::new(many)
    }

    fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        return ParserSpan::many(self, bounds);
    }

    fn sep_by(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            let mut end = state.offset;

            let mut count = 0;

            while count < upper_bound {
                if let Some(value) = self.parser_fn.call(state) {
                    end = value.end;
                    count += 1;
                } else {
                    break;
                }
                if sep.parser_fn.call(state).is_some() {
                } else {
                    break;
                }
            }

            if count >= lower_bound {
                Some(Span::new(start, end, state.src))
            } else {
                None
            }
        };
        Parser::new(sep_by)
    }

    fn sep_by_span(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        return ParserSpan::sep_by(self, sep, bounds);
    }
}

pub trait ParserFlat<'a, First, Last> {
    type Output;

    fn then(self, next: Parser<'a, Last>) -> Self::Output;
    fn then_flat(self, next: Parser<'a, Last>) -> Self::Output;
}

macro_rules! impl_parser_flat {
    ($($T:ident),*) => {
        #[allow(non_snake_case)]
        impl<'a, $($T,)* Last> ParserFlat<'a, ($($T,)*), Last> for Parser<'a, ($($T,)*)>
        where
            $($T: 'a,)*
            Last: 'a,
        {
            type Output = Parser<'a, ($($T,)* Last)>;

            fn then(self, other: Parser<'a, Last>) -> Self::Output {
                let then = move |state: &mut ParserState<'a>| {
                    let Some(($($T,)*)) = self.parser_fn.call(state) else {
                        return None
                    };
                    let Some(last) = other.parser_fn.call(state) else {
                        return None
                    };
                    Some(($($T,)* last))
                };
                Parser::new(then)
            }

            fn then_flat(self, other: Parser<'a, Last>) -> Self::Output {
                return ParserFlat::then(self, other);
            }
        }
    };
}

impl_parser_flat!(B, C);
impl_parser_flat!(B, C, D);
impl_parser_flat!(B, C, D, E);
impl_parser_flat!(B, C, D, E, F);
impl_parser_flat!(B, C, D, E, F, G);
impl_parser_flat!(B, C, D, E, F, G, H);
impl_parser_flat!(B, C, D, E, F, G, H, I);
impl_parser_flat!(B, C, D, E, F, G, H, I, J);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L, M);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L, M, N);
