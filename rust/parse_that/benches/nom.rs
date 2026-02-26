use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

extern crate nom;
use nom::{
    branch::alt,
    bytes::complete::{escaped, tag, take_while, take_while1},
    character::complete::{char, one_of},
    combinator::{cut, iterator, map, opt},
    multi::separated_list0,
    number::complete::double,
    sequence::{delimited, pair, preceded, separated_pair, terminated},
    IResult,
};
use std::str;

pub fn is_string_character(c: char) -> bool {
    c != '"' && c != '\\'
}

pub fn is_space(c: char) -> bool {
    c == ' ' || c == '\t' || c == '\r' || c == '\n'
}

fn sp(i: &str) -> IResult<&str, &str> {
    take_while(is_space)(i)
}

#[derive(Debug, PartialEq)]
pub enum JsonValue<'a> {
    Null,
    Str(&'a str),
    Boolean(bool),
    Num(f64),
    Array(Vec<JsonValue<'a>>),
    Object(HashMap<&'a str, JsonValue<'a>>),
}

fn string(i: &str) -> IResult<&str, &str> {
    preceded(
        char('\"'),
        cut(terminated(
            alt((
                escaped(
                    take_while1(is_string_character),
                    '\\',
                    one_of("\"bfnrt\\/u"),
                ),
                // Handle empty strings
                tag(""),
            )),
            char('\"'),
        )),
    )(i)
}

fn boolean(i: &str) -> IResult<&str, bool> {
    alt((map(tag("false"), |_| false), map(tag("true"), |_| true)))(i)
}

fn null(i: &str) -> IResult<&str, ()> {
    map(tag("null"), |_| ())(i)
}

fn array(i: &str) -> IResult<&str, Vec<JsonValue>> {
    preceded(
        char('['),
        cut(terminated(
            separated_list0(preceded(sp, char(',')), value),
            preceded(sp, char(']')),
        )),
    )(i)
}

fn key_value(i: &str) -> IResult<&str, (&str, JsonValue)> {
    separated_pair(preceded(sp, string), cut(preceded(sp, char(':'))), value)(i)
}

fn hash(i: &str) -> IResult<&str, HashMap<&str, JsonValue>> {
    let (i, _) = char('{')(i)?;
    let mut res = HashMap::default();

    match key_value(i) {
        Err(_) => preceded(sp, char('}'))(i).map(|(i, _)| (i, res)),
        Ok((i, first)) => {
            res.insert(first.0, first.1);
            let mut it = iterator(i, preceded(pair(sp, char(',')), key_value));
            res.extend(&mut it);

            let (i, _) = it.finish()?;
            preceded(sp, char('}'))(i).map(|(i, _)| (i, res))
        }
    }
}

fn value(i: &str) -> IResult<&str, JsonValue> {
    preceded(
        sp,
        alt((
            map(hash, JsonValue::Object),
            map(array, JsonValue::Array),
            map(string, JsonValue::Str),
            map(double, JsonValue::Num),
            map(boolean, JsonValue::Boolean),
            map(null, |_| JsonValue::Null),
        )),
    )(i)
}

fn root(i: &str) -> IResult<&str, JsonValue> {
    delimited(
        sp,
        alt((map(hash, JsonValue::Object), map(array, JsonValue::Array))),
        opt(sp),
    )(i)
}

fn data_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../data/json")
}

fn data(b: &mut Bencher) {
    parse(b, "data.json")
}

fn canada(b: &mut Bencher) {
    parse(b, "canada.json")
}

fn apache(b: &mut Bencher) {
    parse(b, "apache-builds.json")
}

fn data_xl(b: &mut Bencher) {
    parse(b, "data-xl.json")
}

fn parse(b: &mut Bencher, filepath: &str) {
    let filepath = data_dir().join(filepath);
    let data = std::fs::read_to_string(&filepath)
        .unwrap_or_else(|e| panic!("Failed to read {}: {}", filepath.display(), e));
    b.bytes = data.len() as u64;

    b.iter(|| {
        let buf = black_box(&data);
        match root(buf) {
            Ok((_, o)) => o,
            Err(err) => {
                panic!("got err: {:?}", err)
            }
        }
    });
}

benchmark_group!(json, data, canada, apache, data_xl);

benchmark_main!(json);
