#[global_allocator]
static GLOBAL: mimalloc::MiMalloc = mimalloc::MiMalloc;

use divan::counter::BytesCount;
use divan::{black_box, Bencher};

use parse_that::{
    sp_number, sp_quoted_string, sp_take_until_any,
    STRICT_NUMBER_CONFIG, STRICT_QUOTED_STRING_CONFIG,
};

fn bench_take_until(b: Bencher, excluded: &'static [u8], stop_byte: u8) {
    let mut input = "a".repeat(8192);
    input.push(stop_byte as char);
    input.push_str("tail");

    let parser = sp_take_until_any(excluded).into_parser();
    let bytes = input.len();

    b.counter(BytesCount::new(bytes))
        .bench_local(|| {
            let span = parser.parse(black_box(input.as_str())).unwrap();
            black_box(span.end)
        });
}

#[divan::bench]
fn take_until_any_1(b: Bencher) {
    bench_take_until(b, b",", b',');
}

#[divan::bench]
fn take_until_any_2(b: Bencher) {
    bench_take_until(b, b",;", b';');
}

#[divan::bench]
fn take_until_any_3(b: Bencher) {
    bench_take_until(b, b",;!", b'!');
}

#[divan::bench]
fn take_until_any_lut(b: Bencher) {
    bench_take_until(b, b",;!?", b'?');
}

#[divan::bench]
fn json_string_unescaped(b: Bencher) {
    let mut content = "abcdefghijklmnopqrstuvwxyz0123456789".repeat(128);
    content.push_str("tail");
    let input = format!("\"{content}\"");
    let bytes = input.len();

    let parser = sp_quoted_string(&STRICT_QUOTED_STRING_CONFIG).into_parser();
    b.counter(BytesCount::new(bytes))
        .bench_local(|| {
            let span = parser.parse(black_box(input.as_str())).unwrap();
            black_box(span.end)
        });
}

#[divan::bench]
fn json_string_escaped(b: Bencher) {
    let unit = "alpha\nbeta\tgamma\\\"delta\\omegaA";
    let content = unit.repeat(128);
    let input = format!("\"{content}\"");
    let bytes = input.len();

    let parser = sp_quoted_string(&STRICT_QUOTED_STRING_CONFIG).into_parser();
    b.counter(BytesCount::new(bytes))
        .bench_local(|| {
            let span = parser.parse(black_box(input.as_str())).unwrap();
            black_box(span.end)
        });
}

fn bench_json_number(b: Bencher, input: &'static str) {
    let parser = sp_number(&STRICT_NUMBER_CONFIG).into_parser();
    b.counter(BytesCount::new(input.len()))
        .bench_local(|| {
            let span = parser.parse(black_box(input)).unwrap();
            black_box(span.end)
        });
}

#[divan::bench]
fn json_number_int_small(b: Bencher) {
    bench_json_number(b, "12345");
}

#[divan::bench]
fn json_number_int_large(b: Bencher) {
    bench_json_number(b, "123456789012345678901234567890");
}

#[divan::bench]
fn json_number_float_exp(b: Bencher) {
    bench_json_number(b, "-123456.7890123e+45");
}

#[inline(always)]
fn trim_ws_scalar(bytes: &[u8], mut i: usize) -> usize {
    let end = bytes.len();
    while i < end {
        match bytes[i] {
            b' ' | b'\t' | b'\n' | b'\r' => i += 1,
            _ => break,
        }
    }
    i
}

#[inline(always)]
fn trim_ws_chunked(bytes: &[u8], mut i: usize) -> usize {
    let end = bytes.len();
    while i + 8 <= end {
        let chunk = &bytes[i..i + 8];
        if chunk
            .iter()
            .all(|b| matches!(*b, b' ' | b'\t' | b'\n' | b'\r'))
        {
            i += 8;
        } else {
            break;
        }
    }
    trim_ws_scalar(bytes, i)
}

#[divan::bench]
fn ws_trim_scalar(b: Bencher) {
    let input = format!("{}x", " \t\n\r".repeat(2048));
    let bytes_owned = input.into_bytes();
    let bytes_len = bytes_owned.len();
    b.counter(BytesCount::new(bytes_len))
        .bench_local(|| black_box(trim_ws_scalar(black_box(&bytes_owned), 0)));
}

#[divan::bench]
fn ws_trim_chunked(b: Bencher) {
    let input = format!("{}x", " \t\n\r".repeat(2048));
    let bytes_owned = input.into_bytes();
    let bytes_len = bytes_owned.len();
    b.counter(BytesCount::new(bytes_len))
        .bench_local(|| black_box(trim_ws_chunked(black_box(&bytes_owned), 0)));
}

fn main() {
    divan::main();
}
