use crate::leaf::trim_leading_whitespace;
use crate::state::ParserState;

/// Structured error returned by `Parser::parse_or_error()` on failure.
#[derive(Debug, Clone)]
pub struct ParseError {
    /// The offset where the parser stopped.
    pub offset: usize,
    /// The furthest offset reached by any branch before backtracking.
    /// Useful for pointing to the "real" failure location in alternations.
    pub furthest_offset: usize,
    /// 1-based line number of the failure.
    pub line: usize,
    /// 0-based column number of the failure.
    pub column: usize,
    /// Parser names/descriptions that were expected at the failure point.
    /// Populated from parser context when available.
    pub expected: Vec<String>,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "parse error at line {}, column {} (offset {}, furthest offset reached: {})",
            self.line, self.column, self.offset, self.furthest_offset,
        )?;
        if !self.expected.is_empty() {
            write!(f, ", expected: {}", self.expected.join(" | "))?;
        }
        Ok(())
    }
}

impl std::error::Error for ParseError {}

pub type ParserResult<'a, Output> = Option<Output>;

pub trait ParserFn<'a, Output>: 'a {
    fn call(&self, state: &mut ParserState<'a>) -> ParserResult<'a, Output>;
}

impl<'a, Output, F> ParserFn<'a, Output> for F
where
    F: Fn(&mut ParserState<'a>) -> ParserResult<'a, Output> + 'a,
{
    #[inline]
    fn call(&self, state: &mut ParserState<'a>) -> ParserResult<'a, Output> {
        self(state)
    }
}

// ── Parser flags ──────────────────────────────────────────────

const FLAG_TRIM_WS: u8 = 0b0001;
const FLAG_SAVE_STATE: u8 = 0b0010;
const FLAG_EOF: u8 = 0b0100;

pub struct Parser<'a, Output> {
    pub parser_fn: Box<dyn ParserFn<'a, Output> + 'a>,
    flags: u8,
}

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    #[inline]
    pub fn new(parser_fn: impl ParserFn<'a, Output>) -> Parser<'a, Output> {
        Parser {
            parser_fn: Box::new(parser_fn),
            flags: 0,
        }
    }

    /// Core call method — inlines flag behavior to avoid wrapper boxing.
    #[inline(always)]
    pub fn call(&self, state: &mut ParserState<'a>) -> Option<Output> {
        if self.flags == 0 {
            return self.parser_fn.call(state);
        }
        // Fast path: trim_ws only (most common flag combination)
        if self.flags == FLAG_TRIM_WS {
            state.offset += trim_leading_whitespace(state);
            let result = self.parser_fn.call(state);
            if result.is_some() {
                state.offset += trim_leading_whitespace(state);
            }
            return result;
        }
        self.call_with_flags_cold(state)
    }

    #[inline(never)]
    fn call_with_flags_cold(&self, state: &mut ParserState<'a>) -> Option<Output> {
        // Pre: trim whitespace
        if self.flags & FLAG_TRIM_WS != 0 {
            state.offset += trim_leading_whitespace(state);
        }

        // Pre: save state for backtracking
        let checkpoint = if self.flags & FLAG_SAVE_STATE != 0 {
            Some(state.offset)
        } else {
            None
        };

        let result = self.parser_fn.call(state);

        // Post: handle save_state backtracking
        if let Some(cp) = checkpoint {
            if result.is_none() {
                state.furthest_offset = state.furthest_offset.max(state.offset);
                state.offset = cp;
                return None;
            }
        }

        // Post: trim whitespace — skip on failure
        if result.is_some() && self.flags & FLAG_TRIM_WS != 0 {
            state.offset += trim_leading_whitespace(state);
        }

        // Post: EOF check
        if self.flags & FLAG_EOF != 0 && result.is_some() && state.offset < state.end {
            return None;
        }

        result
    }

    #[inline]
    pub fn parse_return_state(&self, src: &'a str) -> (ParserResult<'a, Output>, ParserState<'a>) {
        let mut state = ParserState::new(src);
        let result = self.call(&mut state);
        (result, state)
    }

    #[inline]
    pub fn parse(&self, src: &'a str) -> Option<Output> {
        self.parse_return_state(src).0
    }

    pub fn parse_or_error(&self, src: &'a str) -> Result<Output, ParseError> {
        let (result, state) = self.parse_return_state(src);
        match result {
            Some(value) => Ok(value),
            None => Err(ParseError {
                offset: state.offset,
                furthest_offset: state.furthest_offset,
                line: state.get_line_number(),
                column: state.get_column_number(),
                expected: Vec::new(),
            }),
        }
    }

    /// Mark this parser to save/restore state on failure (checkpoint-based).
    #[inline]
    pub fn save_state(mut self) -> Parser<'a, Output> {
        self.flags |= FLAG_SAVE_STATE;
        self
    }

    /// Mark this parser to trim leading whitespace before and after.
    #[inline]
    pub fn trim_whitespace(mut self) -> Parser<'a, Output> {
        self.flags |= FLAG_TRIM_WS;
        self
    }

    /// Mark this parser to require EOF after successful parse.
    #[inline]
    pub fn eof(mut self) -> Parser<'a, Output> {
        self.flags |= FLAG_EOF;
        self
    }
}
