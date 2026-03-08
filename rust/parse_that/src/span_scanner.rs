// Domain-specific monolithic scanners, separated from generic SpanKind dispatch.
// Each variant maps to a hand-written byte scanner that bypasses regex/combinator overhead.

use crate::state::{ParserState, Span};

pub enum SpanScanner {
    // JSON scanners
    /// [-]digits[.digits][(e|E)[+-]digits]
    JsonNumber,
    /// `"` ... `"` with `\`-escapes (memchr2). Returns content span (exclusive of quotes).
    JsonString,
    /// Like JsonString but returns span including quote delimiters (for BBNF codegen).
    JsonStringQuoted,

    // CSS scanners
    /// -?[a-zA-Z_][\w-]* | --[\w-]+
    CssIdent,
    /// (\s | /\*...\*/)* — always succeeds (zero-width on no whitespace).
    CssWsComment,
    /// "..." or '...' with \-escapes (memchr2).
    CssString,
    /// /\*...\*/
    CssBlockComment,
}

impl SpanScanner {
    #[inline(always)]
    pub fn call<'a>(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        match self {
            Self::JsonNumber => crate::parsers::json::number_span_fast(state),
            Self::JsonString => crate::parsers::json::json_string_fast(state),
            Self::JsonStringQuoted => crate::parsers::json::json_string_fast_quoted(state),
            Self::CssIdent => crate::parsers::css::css_ident_fast(state),
            Self::CssWsComment => crate::parsers::css::css_ws_comment_fast(state),
            Self::CssString => crate::parsers::css::css_string_fast(state),
            Self::CssBlockComment => crate::parsers::css::css_block_comment_fast(state),
        }
    }
}
