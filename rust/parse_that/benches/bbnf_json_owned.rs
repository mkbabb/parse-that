#![feature(cold_path)]

#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use std::borrow::Cow;
use std::path::Path;

#[macro_use]
extern crate bencher;
use bencher::{black_box, Bencher};

use bbnf_derive::Parser;
use parse_that::Span;

#[derive(Parser)]
#[parser(path = "benches/grammars/json.bbnf")]
struct BbnfJsonParser;

// ── Owned JSON value type ───────────────────────────────────────────────────

#[derive(Debug)]
enum JsonValue<'a> {
    Null,
    Bool(bool),
    Number(f64),
    String(Cow<'a, str>),
    Array(Vec<JsonValue<'a>>),
    Object(Vec<(Cow<'a, str>, JsonValue<'a>)>),
}

// ── Conversion from BBNF spans to owned values ─────────────────────────────

fn to_value<'a>(node: BbnfJsonParserEnum<'a>) -> JsonValue<'a> {
    match node {
        BbnfJsonParserEnum::null(_) => JsonValue::Null,
        BbnfJsonParserEnum::bool(s) => JsonValue::Bool(s.as_str() == "true"),
        BbnfJsonParserEnum::number(s) => JsonValue::Number(parse_number(s)),
        BbnfJsonParserEnum::string(s) => JsonValue::String(decode_string(s)),
        BbnfJsonParserEnum::array(items) => {
            JsonValue::Array(items.into_iter().map(to_value).collect())
        }
        BbnfJsonParserEnum::object(pairs) => {
            JsonValue::Object(
                pairs
                    .into_iter()
                    .map(|p| {
                        // pair = (string_span, Box<value>)
                        let BbnfJsonParserEnum::pair((key_span, val_box)) = p else {
                            unreachable!()
                        };
                        (decode_string(key_span), to_value(*val_box))
                    })
                    .collect(),
            )
        }
        // value dispatches to the above; pair handled inside object
        _ => unreachable!(),
    }
}

#[inline]
fn parse_number(s: Span<'_>) -> f64 {
    fast_float2::parse(s.as_str()).unwrap()
}

#[inline]
fn decode_string<'a>(s: Span<'a>) -> Cow<'a, str> {
    let raw = s.as_str();
    // Strip surrounding quotes
    let inner = &raw[1..raw.len() - 1];
    // Fast path: no backslash → borrow directly
    if !inner.contains('\\') {
        return Cow::Borrowed(inner);
    }
    // Slow path: decode escape sequences
    let mut out = String::with_capacity(inner.len());
    let bytes = inner.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'\\' {
            i += 1;
            match bytes[i] {
                b'"' => out.push('"'),
                b'\\' => out.push('\\'),
                b'/' => out.push('/'),
                b'b' => out.push('\u{08}'),
                b'f' => out.push('\u{0C}'),
                b'n' => out.push('\n'),
                b'r' => out.push('\r'),
                b't' => out.push('\t'),
                b'u' => {
                    let hex = &inner[i + 1..i + 5];
                    let cp = u16::from_str_radix(hex, 16).unwrap();
                    i += 4;
                    if (0xD800..=0xDBFF).contains(&cp) {
                        // Surrogate pair
                        i += 1; // skip backslash
                        i += 1; // skip 'u'
                        let hex2 = &inner[i..i + 4];
                        let lo = u16::from_str_radix(hex2, 16).unwrap();
                        i += 4;
                        let full = 0x10000 + ((cp as u32 - 0xD800) << 10) + (lo as u32 - 0xDC00);
                        out.push(char::from_u32(full).unwrap());
                        i += 1;
                        continue;
                    }
                    out.push(char::from_u32(cp as u32).unwrap());
                }
                _ => {
                    out.push('\\');
                    out.push(bytes[i] as char);
                }
            }
        } else {
            out.push(bytes[i] as char);
        }
        i += 1;
    }
    Cow::Owned(out)
}

// ── Bench harness ───────────────────────────────────────────────────────────

fn data_dir() -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../data/json")
}

fn parse_owned(b: &mut Bencher, filepath: &str) {
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

fn data(b: &mut Bencher) { parse_owned(b, "data.json") }
fn canada(b: &mut Bencher) { parse_owned(b, "canada.json") }
fn apache(b: &mut Bencher) { parse_owned(b, "apache-builds.json") }
fn data_xl(b: &mut Bencher) { parse_owned(b, "data-xl.json") }
fn twitter(b: &mut Bencher) { parse_owned(b, "twitter.json") }
fn citm_catalog(b: &mut Bencher) { parse_owned(b, "citm_catalog.json") }

benchmark_group!(bbnf_json_owned, data, canada, apache, data_xl, twitter, citm_catalog);
benchmark_main!(bbnf_json_owned);
