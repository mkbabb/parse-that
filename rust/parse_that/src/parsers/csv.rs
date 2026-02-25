use crate::parse::*;

use super::utils::escaped_span;

use pprint::{Doc, Join};

#[derive(Debug, PartialEq)]
pub enum CSV<'a> {
    Lines(Vec<Vec<&'a str>>),
}

impl<'a> From<CSV<'a>> for Doc<'a> {
    fn from(val: CSV<'a>) -> Self {
        let CSV::Lines(lines) = val;

        return lines
            .into_iter()
            .map(|line| {
                line.into_iter()
                    .map(Doc::from)
                    .collect::<Vec<_>>()
                    .join(",")
            })
            .collect::<Vec<_>>()
            .join(Doc::Hardline);
    }
}

pub fn csv_parser<'a>() -> Parser<'a, CSV<'a>> {
    let delim = || string_span(",");

    let double_quotes = (string_span("\"\"") | escaped_span() | take_while_span(|c| c != '"'))
        .many_span(..)
        .wrap_span(string_span("\""), string_span("\""));

    let no_quotes = take_while_span(|c| c != ',' && c != '"' && c != '\r' && c != '\n');

    let empty = string_span("").look_ahead(delim());

    let token = (double_quotes | no_quotes | empty).map(|span| span.as_str());

    let line = token.sep_by(delim(), 1..);

    let csv = line.sep_by(regex_span(r"\s+"), ..);

    csv.trim_whitespace().map(CSV::Lines)
}
