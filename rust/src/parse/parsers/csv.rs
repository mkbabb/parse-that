use crate::parse::*;

pub fn csv_parser<'a>() -> Parser<'a, Vec<Vec<&'a str>>> {
    let double_quotes = || string("\"");
    let single_quotes = || string("'");

    let token = regex("[^\"]+").wrap(double_quotes(), double_quotes())
        | regex("[^']+").wrap(single_quotes(), single_quotes())
        | regex(r"[^,\r\n]+")
        | string("").look_ahead(string(","));

    let delim = string(",");

    let line = token.sep_by(delim, ..).skip(regex(r"\s")).trim_whitespace();
    let csv = line.many(1..);

    csv.trim_whitespace()
}
