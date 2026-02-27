use parse_that::csv::csv_parser;
use parse_that::get_cargo_root_path;
use parse_that::json::json_parser;

use std::{fs, time::SystemTime};

pub fn main() {
    let first_now = SystemTime::now();

    let root_path = get_cargo_root_path();
    let json_file_path = root_path.join("../../data/json/canada.json");

    let json_string = fs::read_to_string(&json_file_path).unwrap();

    // Combinator parser
    let parser = json_parser();
    let now = SystemTime::now();
    let _data = parser.parse(&json_string).unwrap();
    let elapsed = now.elapsed().unwrap();
    println!("JSON (combinator) Elapsed: {:?}", elapsed);

    // CSV parser
    let csv_file_path = root_path.join("../../data/csv/active_charter_schools_report.csv");
    let csv_string = fs::read_to_string(&csv_file_path).unwrap();
    let csv_parser = csv_parser();
    let now = SystemTime::now();
    let _data = csv_parser.parse(&csv_string).unwrap();
    let elapsed = now.elapsed().unwrap();
    println!("CSV Elapsed: {:?}", elapsed);

    let elapsed = first_now.elapsed().unwrap();
    println!("Total Elapsed: {:?}", elapsed);
}
