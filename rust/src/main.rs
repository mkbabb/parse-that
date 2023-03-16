#[global_allocator]
static GLOBAL: tikv_jemallocator::Jemalloc = tikv_jemallocator::Jemalloc;

pub mod parse;
pub mod pretty;

use parse::*;
use pretty::*;

use std::{fs, time::SystemTime, collections::HashMap};

pub fn main() {
    let first_now = SystemTime::now();

    print!("Parsing CSV... ");

    let csv_file_path = "../data/csv/active_charter_schools_report.csv";
    let csv_string = fs::read_to_string(csv_file_path).unwrap();

    let now = SystemTime::now();
    let parser = parsers::csv::csv_parser();
    let rows = parser.parse(&csv_string).unwrap()[..10].to_vec();
    let elapsed = now.elapsed().unwrap();

    // println!("Elapsed: {:?}", elapsed);

    // let json_file_path = "../data/json/data-l.json";
    // let json_string = fs::read_to_string(json_file_path).unwrap();

    // let parser = json_value();

    // let now = SystemTime::now();

    // let map = parser.parse(&json_string).unwrap();

    // let elapsed = now.elapsed().unwrap();

    // println!("dElapsed: {:?}", elapsed);

    // test hashmap with 10 items:

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

    let mut map = HashMap::new();
    map.insert("ok", map3.clone());
    map.insert("thats vibes", map3.clone());

    let printer = Printer::new(80, 1, false, true);

    let now = SystemTime::now();

    let pretty = printer.pretty(map);
    let elapsed = now.elapsed().unwrap();

    println!("Elapsed: {:?}", elapsed);

    fs::write("../data/pretty.json", pretty).expect("Unable to write file");

    let elapsed = first_now.elapsed().unwrap();

    println!("Total Elapsed: {:?}", elapsed);
}
