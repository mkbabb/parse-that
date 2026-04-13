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
            Self::JsonNumber => crate::parsers::json::number_span_scan_strict(state),
            Self::JsonString => crate::parsers::json::quoted_string_scan_content(state),
            Self::JsonStringQuoted => crate::parsers::json::quoted_string_scan_full(state),
            Self::CssIdent => crate::parsers::scan::scan_ident(state),
            Self::CssWsComment => crate::parsers::scan::scan_ws_block_comments(state),
            Self::CssString => crate::parsers::scan::scan_string_quoted(state),
            Self::CssBlockComment => crate::parsers::scan::scan_block_comment(state),
        }
    }
}
