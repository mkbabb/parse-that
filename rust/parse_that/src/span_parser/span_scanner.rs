// Structural monolithic scanners, separated from generic SpanKind dispatch.
//
// Each variant maps to a hand-written byte scanner that bypasses
// regex/combinator overhead. The variants are language-agnostic;
// language-specific behavior (e.g., JSON-RFC-8259 vs CSS) is encoded
// by the caller via `sp_*(config)` constructors.

use crate::state::{ParserState, Span};

pub enum SpanScanner {
    /// `[-]digits[.digits][(e|E)[+-]digits]` with strict (RFC 8259)
    /// rejection of `+`, leading `.`, and `007`-style leading zeros.
    NumberStrict,
    /// Same as `QuotedStringStrictContent` but returns the span
    /// *including* the quote delimiters (matches regex behavior).
    QuotedStringStrict,

    /// `-?[a-zA-Z_][\w-]* | --[\w-]+` — vendor prefixes + custom properties.
    Identifier,
    /// `(\s | /\*...\*/)*` — always succeeds (zero-width on no whitespace).
    WsComment,
    /// `"..."` or `'...'` with `\`-escape skipping (no validation).
    QuotedString,
    /// `/\*...\*/`.
    BlockComment,
}

impl SpanScanner {
    #[inline(always)]
    pub fn call<'a>(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        match self {
            Self::NumberStrict => crate::parsers::scan::scan_number_strict_span(state),
            Self::QuotedStringStrict => crate::parsers::scan::scan_quoted_string_strict(state),
            Self::Identifier => {
                crate::parsers::scan::scan_ident(state, &crate::parsers::scan::CSS_IDENT_CONFIG)
            }
            Self::WsComment => crate::parsers::scan::scan_ws_block_comments(state),
            Self::QuotedString => crate::parsers::scan::scan_string_quoted(state),
            Self::BlockComment => crate::parsers::scan::scan_block_comment(state),
        }
    }
}
