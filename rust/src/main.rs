#[global_allocator]
static GLOBAL: tikv_jemallocator::Jemalloc = tikv_jemallocator::Jemalloc;

use parse_that::parse::parsers::csv::csv_parser;
use parse_that::parse::parsers::json::json_parser;
use parse_that::pretty::Printer;

use std::{fs, time::SystemTime, collections::HashMap};

pub fn main() {
    let first_now = SystemTime::now();

    // let csv_file_path = "../data/csv/data.csv";
    // let csv_string = fs::read_to_string(csv_file_path).unwrap();

    // let parser = csv_parser();

    // let now = SystemTime::now();

    // let data = parser.parse(&csv_string).unwrap();

    // let elapsed = now.elapsed().unwrap();

    // println!("CSV Elapsed: {:?}", elapsed);

    let json_file_path = "../data/json/large-file.json";
    let json_string = fs::read_to_string(json_file_path).unwrap();

    let parser = json_parser();

    let now = SystemTime::now();

    let data = parser.parse(&json_string).unwrap();

    let elapsed = now.elapsed().unwrap();

    println!("JSON Elapsed: {:?}", elapsed);

    // let toml_file_path = "./Cargo.toml";
    // let toml_string = fs::read_to_string(toml_file_path).unwrap();

    // let parser = toml_parser();

    // let now = SystemTime::now();

    // let data = parser.parse(&toml_string).unwrap();

    // dbg!(data);

    // let elapsed = now.elapsed().unwrap();

    // println!("TOML Elapsed: {:?}", elapsed);



    let mut map0 = HashMap::new();
    map0.insert(
        "my vibes",
        vec![
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8,
            9, 10,
        ],
    );
    map0.insert("thats vibes", vec![1, 2, 3]);
    map0.insert("ok", vec![1, 2, 3]);

    let mut map2 = HashMap::new();
    map2.insert("my vibes", map0.clone());
    let mut map3 = HashMap::new();
    map3.insert("thats vibes", map2.clone());
    map3.insert("ok", map2.clone());

    let mut data = HashMap::new();
    data.insert("ok", map3.clone());
    data.insert("thats vibes", map3.clone());

    let printer = Printer::new(80, 1, false, true);

    let now = SystemTime::now();

    let pretty = printer.pretty(data);

    let elapsed = now.elapsed().unwrap();

    println!("Printing Elapsed: {:?}", elapsed);

    fs::write("../data/pretty.json", pretty).expect("Unable to write file");

    let elapsed = first_now.elapsed().unwrap();
    println!("Total Elapsed: {:?}", elapsed);
}
