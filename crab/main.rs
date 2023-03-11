pub mod parse_that;
use parse_that::*;
use std::{fs, time::SystemTime};

pub fn main() {
    let csv_parser = || {
        let whitespace = || regex(r"\s*");

        let double_quotes = || string("\"");
        let single_quotes = || string("'");

        let token = regex("[^\"]+").wrap(double_quotes(), double_quotes())
            | regex("[^']+").wrap(single_quotes(), single_quotes())
            | regex("[^,]+");

        let delim = string(",").trim(whitespace());

        let line = token.sep_by(delim, None, None).trim(whitespace());
        let csv = line.many(None, None);

        csv
    };

    // get current time:

    let file_path = "data/active_charter_schools_report.csv";
    let contents = fs::read_to_string(file_path).unwrap();

    let now = SystemTime::now();
    let results = csv_parser().parse(contents.as_str());

    // dbg!(results);
    // get elapsed time:
    let elapsed = now.elapsed().unwrap();
    println!("elapsed: {:?}", elapsed);
}
