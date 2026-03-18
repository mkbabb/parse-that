#![feature(cold_path)]

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

use bbnf_derive::Parser;
use parse_that::Span;

#[derive(Parser)]
#[parser(path = "benches/grammars/json.bbnf")]
struct BbnfJsonParser;

// ── Borrowed JSON value type ────────────────────────────────────────────────
// Numbers parsed to f64. Strings borrowed as &str (quotes stripped, no escape
// decode). This is the fastest "structured" parse — comparable to what
// serde_json_borrow does on inputs without escape sequences.

#[derive(Debug)]
enum JsonValue<'a> {
    Null,
    Bool(bool),
    Number(f64),
    String(&'a str),
    Array(Vec<JsonValue<'a>>),
    Object(Vec<(&'a str, JsonValue<'a>)>),
}

fn to_value<'a>(node: BbnfJsonParserEnum<'a>) -> JsonValue<'a> {
    match node {
        BbnfJsonParserEnum::null(_) => JsonValue::Null,
        BbnfJsonParserEnum::bool(s) => JsonValue::Bool(s.as_str() == "true"),
        BbnfJsonParserEnum::number(s) => JsonValue::Number(parse_number(s)),
        BbnfJsonParserEnum::string(s) => JsonValue::String(borrow_string(s)),
        BbnfJsonParserEnum::array(items) => {
            JsonValue::Array(items.into_iter().map(to_value).collect())
        }
        BbnfJsonParserEnum::object(pairs) => {
            JsonValue::Object(
                pairs
                    .into_iter()
                    .map(|p| {
                        let BbnfJsonParserEnum::pair((key_span, val_box)) = p else {
                            unreachable!()
                        };
                        (borrow_string(key_span), to_value(*val_box))
                    })
                    .collect(),
            )
        }
        _ => unreachable!(),
    }
}

#[inline]
fn parse_number(s: Span<'_>) -> f64 {
    fast_float2::parse(s.as_str()).unwrap()
}

#[inline]
fn borrow_string<'a>(s: Span<'a>) -> &'a str {
    let raw = s.as_str();
    &raw[1..raw.len() - 1]
}

// ── Bench harness ───────────────────────────────────────────────────────────

fn data_dir() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../data/json")
}

fn parse_borrow(b: &mut Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));
    b.bytes = data.len() as u64;

    let parser = BbnfJsonParser::value();

    b.iter(|| {
        let buf = black_box(&data);
        let ast = parser.parse(buf).unwrap();
        to_value(*ast)
    })
}

fn data(b: &mut Bencher) { parse_borrow(b, "data.json") }
fn canada(b: &mut Bencher) { parse_borrow(b, "canada.json") }
fn apache(b: &mut Bencher) { parse_borrow(b, "apache-builds.json") }
fn data_xl(b: &mut Bencher) { parse_borrow(b, "data-xl.json") }
fn twitter(b: &mut Bencher) { parse_borrow(b, "twitter.json") }
fn citm_catalog(b: &mut Bencher) { parse_borrow(b, "citm_catalog.json") }

benchmark_group!(bbnf_json_borrow, data, canada, apache, data_xl, twitter, citm_catalog);
benchmark_main!(bbnf_json_borrow);
