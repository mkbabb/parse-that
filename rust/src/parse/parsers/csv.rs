use crate::{
    parse::*,
    pretty::{str, Doc, Join, Wrap},
};

// define CSV enum:

#[derive(Debug, PartialEq)]
pub enum CSV<'a> {
    Lines(Vec<Vec<&'a str>>),
}

impl<'a> Into<Doc<'a>> for CSV<'a> {
    fn into(self) -> Doc<'a> {
        let CSV::Lines(lines) = self;

        return lines
            .into_iter()
            .map(|line| {
                line.into_iter()
                    .map(|s| {
                        if s.contains(',') {
                            str(s).wrap(str("\""), str("\""))
                        } else {
                            str(s)
                        }
                    })
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

    let line = token.sep_by(delim(), ..);

    let csv = line
        .debug("csv")
        .sep_by(regex(r"\s+"), ..);

    csv.trim_whitespace().map(CSV::Lines)
}
