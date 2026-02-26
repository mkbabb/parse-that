use crate::parse::*;
use crate::span_parser::*;
use crate::state::Span;

static ESCAPE_PATTERNS: &[&str] = &["b", "f", "n", "r", "t", "\"", "'", "\\", "/"];

pub fn escaped_span<'a>() -> Parser<'a, Span<'a>> {
    string_span("\\").then_span(
        any_span(ESCAPE_PATTERNS)
            | string_span("u").then_span(take_while_span(|c| c.is_ascii_hexdigit())),
    )
}

/// SpanParser version of escaped_span for use in SpanParser chains.
pub fn sp_escaped<'a>() -> SpanParser<'a> {
    sp_string("\\").then_span(
        sp_any(ESCAPE_PATTERNS)
            | sp_string("u").then_span(sp_take_while_byte(|b| b.is_ascii_hexdigit())),
    )
}

pub fn quoted_span(quote_string: &str) -> Parser<'_, Span<'_>> {
    let string_char = || {
        let quote_char = quote_string.chars().next().unwrap();
        let not_quote = take_while_span(move |c| c != quote_char && c != '\\');

        (not_quote | escaped_span())
            .many_span(..)
            .wrap_span(string_span(quote_string), string_span(quote_string))
    };

    string_char()
}

pub fn number_span<'a>() -> Parser<'a, Span<'a>> {
    number_span_fast_parser()
}
