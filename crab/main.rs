pub mod parse_that;
use parse_that::*;

pub mod doc;
use doc::*;

use std::{fs, time::SystemTime};

pub fn csv_test() -> std::time::Duration {
    let csv_parser = || {
        let whitespace = || lazy(|| regex(r"\s*"));

        let double_quotes = || string("\"");
        let single_quotes = || string("'");

        let token = regex("[^\"]+").wrap(double_quotes(), double_quotes())
            | regex("[^']+").wrap(single_quotes(), single_quotes())
            | regex(r"[^,\r\n]+")
            | string("").look_ahead(string(","));

        let delim = string(",");

        let line = token.sep_by(delim, None, None).trim(whitespace());
        let csv = line.sep_by(string("\r\n"), None, None);

        csv
    };

    let file_path = "data/active_charter_schools_report.csv";
    let string = fs::read_to_string(file_path).unwrap();
    let src = string.as_str();

    let now = SystemTime::now();

    let results = csv_parser().parse(src);

    // dbg!(results);

    now.elapsed().unwrap()
}

pub fn main() {
    // let elapsed = csv_test();
    // println!("elapsed: {:?}", elapsed);

    let p = Printer::new(10, 2);

    let array_to_doc =
        |items: Vec<&str>| -> Vec<Doc> { items.into_iter().map(|x| text(x)).collect() };

    let format_array = |items: Vec<Doc>| -> Doc {
        text("[") + p.indent(join(text(",") + Doc::Hardline, items)) + Doc::Hardline + text("]")
    };

    let items = vec![
        "a this is a vibing that's really",
        "b this is a vibing",
        "c this is a vibing",
        "ok",
        "ok",
        "no that's not ok",
    ];

    let fmt1 = format_array(array_to_doc(items));
    let fmt2 = format_array(vec![fmt1.clone(), fmt1]);
    let fmt3 = format_array(vec![fmt2.clone(), fmt2]);

    println!("{}", p.print(fmt3));
}
