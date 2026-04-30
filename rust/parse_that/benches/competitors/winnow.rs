#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use divan::counter::BytesCount;
use divan::{Bencher, black_box};

use winnow::ascii::float;
use winnow::combinator::{
    delimited, dispatch, fail, peek, preceded, separated, separated_pair, terminated,
};
use winnow::prelude::*;
use winnow::token::{any, take, take_while};

// ── JSON Value type (borrowed strings for zero-copy fairness) ────────────

#[derive(Debug, Clone, PartialEq)]
enum JsonValue<'a> {
    Null,
    Bool(bool),
    Num(f64),
    Str(&'a str),
    Array(Vec<JsonValue<'a>>),
    Object(HashMap<&'a str, JsonValue<'a>>),
}

// ── Parsers ──────────────────────────────────────────────────────────────

fn json<'i>(input: &mut &'i str) -> ModalResult<JsonValue<'i>> {
    delimited(ws, json_value, ws).parse_next(input)
}

fn json_value<'i>(input: &mut &'i str) -> ModalResult<JsonValue<'i>> {
    dispatch!(peek(any);
        'n' => "null".value(JsonValue::Null),
        't' => "true".value(JsonValue::Bool(true)),
        'f' => "false".value(JsonValue::Bool(false)),
        '"' => string.map(JsonValue::Str),
        '+' => float.map(JsonValue::Num),
        '-' => float.map(JsonValue::Num),
        '0'..='9' => float.map(JsonValue::Num),
        '[' => array.map(JsonValue::Array),
        '{' => object.map(JsonValue::Object),
        _ => fail,
    )
    .parse_next(input)
}

// Borrowed string parser: returns the raw &str between quotes (zero-copy).
// Escape sequences are validated but NOT decoded — same as parse_that.
fn string<'i>(input: &mut &'i str) -> ModalResult<&'i str> {
    preceded('"', terminated(string_content, '"')).parse_next(input)
}

fn string_content<'i>(input: &mut &'i str) -> ModalResult<&'i str> {
    let start = *input;
    loop {
        let _: &str = take_while(0.., |c: char| c != '"' && c != '\\').parse_next(input)?;

        if input.is_empty() || input.starts_with('"') {
            let consumed = start.len() - input.len();
            return Ok(&start[..consumed]);
        }

        // Backslash — skip escape sequence
        let _: char = any.parse_next(input)?;
        let esc: char = any.parse_next(input)?;
        match esc {
            '"' | '\\' | '/' | 'b' | 'f' | 'n' | 'r' | 't' => {}
            'u' => {
                let _: &str = take(4usize).parse_next(input)?;
            }
            _ => {
                return fail.parse_next(input);
            }
        }
    }
}

fn array<'i>(input: &mut &'i str) -> ModalResult<Vec<JsonValue<'i>>> {
    preceded(
        ('[', ws),
        terminated(separated(0.., json_value, (ws, ',', ws)), (ws, ']')),
    )
    .parse_next(input)
}

fn object<'i>(input: &mut &'i str) -> ModalResult<HashMap<&'i str, JsonValue<'i>>> {
    preceded(
        ('{', ws),
        terminated(separated(0.., key_value, (ws, ',', ws)), (ws, '}')),
    )
    .parse_next(input)
}

fn key_value<'i>(input: &mut &'i str) -> ModalResult<(&'i str, JsonValue<'i>)> {
    separated_pair(string, (ws, ':', ws), json_value).parse_next(input)
}

fn ws<'i>(input: &mut &'i str) -> ModalResult<&'i str> {
    take_while(0.., |c: char| " \t\r\n".contains(c)).parse_next(input)
}

// ── Benchmarks ───────────────────────────────────────────────────────────

fn data_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../data/json")
}

#[divan::bench]
fn data(b: Bencher) {
    parse(b, "data.json")
}

#[divan::bench]
fn canada(b: Bencher) {
    parse(b, "canada.json")
}

#[divan::bench]
fn apache(b: Bencher) {
    parse(b, "apache-builds.json")
}

#[divan::bench]
fn data_xl(b: Bencher) {
    parse(b, "data-xl.json")
}

#[divan::bench]
fn twitter(b: Bencher) {
    parse(b, "twitter.json")
}

#[divan::bench]
fn citm_catalog(b: Bencher) {
    parse(b, "citm_catalog.json")
}

// winnow is nom's successor (parser combinator). This benchmark uses borrowed
// strings (&str) for zero-copy fairness, matching parse_that's approach.
// The dispatch! macro gives O(1) branching on the first character.
fn parse(b: Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));

    b.counter(BytesCount::new(data.len())).bench_local(|| {
        let buf = black_box(data.as_str());
        json.parse(buf).unwrap()
    });
}

fn main() {
    divan::main();
}
