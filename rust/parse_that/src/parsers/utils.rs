use crate::{any_span, string_span, take_while_span, Parser, ParserSpan, Span};

static ESCAPE_PATTERNS: &[&str] = &["b", "f", "n", "r", "t", "\"", "'", "\\", "/"];

pub fn escaped_span<'a>() -> Parser<'a, Span<'a>> {
    return string_span("\\").then_span(
        any_span(&ESCAPE_PATTERNS)
            | string_span("u").then_span(take_while_span(|c| c.is_digit(16))),
    );
}

pub fn number_span<'a>() -> Parser<'a, Span<'a>> {
    let sign = || string_span("-").opt_span();
    let digits = || take_while_span(|c| c.is_digit(10));

    let integer = digits();
    let fraction = string_span(".").then_span(digits());
    let exponent = (string_span("e") | string_span("E"))
        .then_span(sign())
        .then_span(digits());

    return sign()
        .then_span(integer)
        .then_span(fraction.opt_span())
        .then_span(exponent.opt_span());
}
