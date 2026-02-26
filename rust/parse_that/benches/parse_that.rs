use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

use parse_that::json::json_parser;
use parse_that::csv::csv_parser;

// ── JSON benchmarks ─────────────────────────────────────────────────────

const JSON_DATA_DIR: &str = "../data/json";

fn json_data(b: &mut Bencher) {
    json_parse(b, "data.json")
}

fn json_canada(b: &mut Bencher) {
    json_parse(b, "canada.json")
}

fn json_apache(b: &mut Bencher) {
    json_parse(b, "apache-builds.json")
}

fn json_data_xl(b: &mut Bencher) {
    json_parse(b, "data-xl.json")
}

fn json_twitter(b: &mut Bencher) {
    json_parse(b, "twitter.json")
}

fn json_citm_catalog(b: &mut Bencher) {
    json_parse(b, "citm_catalog.json")
}

fn json_parse(b: &mut Bencher, filepath: &str) {
    let filepath = Path::new(JSON_DATA_DIR).join(filepath);
    let data = std::fs::read_to_string(filepath).unwrap();
    b.bytes = data.len() as u64;

    let parser = json_parser();

    b.iter(|| {
        let buf = black_box(&data);
        parser.parse(buf).unwrap()
    })
}

// ── CSV benchmarks ──────────────────────────────────────────────────────

const CSV_DATA_DIR: &str = "../data/csv";

fn csv_small(b: &mut Bencher) {
    let data = r#""a","b","c"
"d","e","f"
"g","h","i""#;
    b.bytes = data.len() as u64;
    let parser = csv_parser();

    b.iter(|| {
        let buf = black_box(data);
        parser.parse(buf).unwrap()
    })
}

fn csv_large(b: &mut Bencher) {
    let filepath = Path::new(CSV_DATA_DIR).join("active_charter_schools_report.csv");
    let data = std::fs::read_to_string(filepath).unwrap();
    b.bytes = data.len() as u64;

    let parser = csv_parser();

    b.iter(|| {
        let buf = black_box(&data);
        parser.parse(buf).unwrap()
    })
}

benchmark_group!(json, json_data, json_canada, json_apache, json_data_xl, json_twitter, json_citm_catalog);
benchmark_group!(csv, csv_small, csv_large);

benchmark_main!(json, csv);
