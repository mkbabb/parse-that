#![feature(box_patterns)]
#![feature(once_cell)]

use bbnf::grammar::BBNFGrammar;
use bbnf_derive::Parser;
use parse_that::csv::csv_parser;
use parse_that::json::json_parser;
use pretty::{concat, Doc, Pretty, Printer, PRINTER};

use parse_that::parse::*;

use std::{collections::HashMap, fs, time::SystemTime};

#[derive(Parser)]
#[parser(path = "../grammar/math.bbnf")]
pub struct Math {}

pub fn consume(p: &MathEnum) -> f64 {
    pub fn recurse(p: &MathEnum) -> f64 {
        let fold_expression = |acc, (op, rest): &(&str, Box<MathEnum>)| match *op {
            "+" => acc + recurse(rest),
            "-" => acc - recurse(rest),
            "*" => acc * recurse(rest),
            "/" => acc / recurse(rest),
            _ => unreachable!(),
        };

        match p {
            MathEnum::expr((term, rest)) => rest.into_iter().fold(recurse(term), fold_expression),
            MathEnum::term((factor, rest)) => {
                rest.into_iter().fold(recurse(factor), fold_expression)
            }
            MathEnum::wrapped((_, expr, _)) => recurse(expr),
            MathEnum::factor(num) => recurse(num),
            MathEnum::number(num) => num.parse().unwrap(),
        }
    }

    recurse(p)
}

pub fn main() {
    let first_now = SystemTime::now();

    let x = Math::expr().parse("1 + 2 + 3 * 3").unwrap();
    let tmp = consume(&x);

    println!("{:?}", tmp);

    println!("{:?}", Doc::from(x));

    // let x = Json::value().parse("[1, 2, 3]").unwrap();

    // println!("{:?}", Doc::from(x));

    // let csv_file_path = "../data/csv/data.csv";
    // let csv_string = fs::read_to_string(csv_file_path).unwrap();

    // let parser = csv_parser();

    // let now = SystemTime::now();

    // let data = parser.parse(&csv_string).unwrap();

    // let elapsed = now.elapsed().unwrap();

    // println!("CSV Elapsed: {:?}", elapsed);

    // let json_file_path = "../data/json/large-file.json";
    // let json_string = fs::read_to_string(json_file_path).unwrap();

    // let parser = json_parser();

    // let now = SystemTime::now();

    // let data = parser.parse(&json_string).unwrap();

    // let elapsed = now.elapsed().unwrap();

    // println!("JSON Elapsed: {:?}", elapsed);

    // let toml_file_path = "./Cargo.toml";
    // let toml_string = fs::read_to_string(toml_file_path).unwrap();

    // let parser = toml_parser();

    // let now = SystemTime::now();

    // let data = parser.parse(&toml_string).unwrap();

    // dbg!(data);

    // let elapsed = now.elapsed().unwrap();

    // println!("TOML Elapsed: {:?}", elapsed);

    // let bbnf_filepath = "../grammar/g4.bbnf";
    // let bbnf_string = fs::read_to_string(bbnf_filepath).unwrap();

    // let parser = BBNFGrammar::grammar();

    // let now = SystemTime::now();

    // let data = parser.parse(&bbnf_string).unwrap();

    // dbg!(data.get("ONG "));

    // let elapsed = now.elapsed().unwrap();

    // println!("BBNF Elapsed: {:?}", elapsed);

    // let mut map0 = HashMap::new();
    // map0.insert(
    //     "my vibes",
    //     vec![
    //         1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8,
    //         9, 10,
    //     ],
    // );
    // map0.insert("thats vibes", vec![1, 2, 3]);
    // map0.insert("ok", vec![1, 2, 3]);

    // let mut map2 = HashMap::new();
    // map2.insert("my vibes", map0.clone());
    // let mut map3 = HashMap::new();
    // map3.insert("thats vibes", map2.clone());
    // map3.insert("ok", map2.clone());

    // let mut data = HashMap::new();
    // data.insert("ok", map3.clone());
    // data.insert("thats vibes", map3.clone());

    // println!("{}", Doc::from(data));

    // let printer = Printer::new(30, 1, false, true);

    // let now = SystemTime::now();

    // let pretty = printer.pretty(data);

    // println!("{}", pretty);

    // let elapsed = now.elapsed().unwrap();

    // println!("Printing Elapsed: {:?}", elapsed);

    // fs::write("../data/pretty.json", pretty).expect("Unable to write file");

    // let elapsed = first_now.elapsed().unwrap();
    // println!("Total Elapsed: {:?}", elapsed);
}
