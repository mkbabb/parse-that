#[macro_use]
extern crate bencher;
use bencher::{Bencher, black_box};

use parse_that::{sp_json_number, sp_json_string, sp_take_until_any};

fn bench_take_until(b: &mut Bencher, excluded: &'static [u8], stop_byte: u8) {
    let mut input = "a".repeat(8192);
    input.push(stop_byte as char);
    input.push_str("tail");
    b.bytes = input.len() as u64;

    let parser = sp_take_until_any(excluded).into_parser();

    b.iter(|| {
        let span = parser.parse(black_box(input.as_str())).unwrap();
        black_box(span.end)
    });
}

fn take_until_any_1(b: &mut Bencher) {
    bench_take_until(b, b",", b',');
}

fn take_until_any_2(b: &mut Bencher) {
    bench_take_until(b, b",;", b';');
}

fn take_until_any_3(b: &mut Bencher) {
    bench_take_until(b, b",;!", b'!');
}

fn take_until_any_lut(b: &mut Bencher) {
    bench_take_until(b, b",;!?", b'?');
}

fn json_string_unescaped(b: &mut Bencher) {
    let mut content = "abcdefghijklmnopqrstuvwxyz0123456789".repeat(128);
    content.push_str("tail");
    let input = format!("\"{content}\"");
    b.bytes = input.len() as u64;

    let parser = sp_json_string().into_parser();
    b.iter(|| {
        let span = parser.parse(black_box(input.as_str())).unwrap();
        black_box(span.end)
    });
}

fn json_string_escaped(b: &mut Bencher) {
    let unit = r#"alpha\nbeta\tgamma\"delta\\omega\u0041"#;
    let content = unit.repeat(128);
    let input = format!("\"{content}\"");
    b.bytes = input.len() as u64;

    let parser = sp_json_string().into_parser();
    b.iter(|| {
        let span = parser.parse(black_box(input.as_str())).unwrap();
        black_box(span.end)
    });
}

fn bench_json_number(b: &mut Bencher, input: &'static str) {
    b.bytes = input.len() as u64;
    let parser = sp_json_number().into_parser();
    b.iter(|| {
        let span = parser.parse(black_box(input)).unwrap();
        black_box(span.end)
    });
}

fn json_number_int_small(b: &mut Bencher) {
    bench_json_number(b, "12345");
}

fn json_number_int_large(b: &mut Bencher) {
    bench_json_number(b, "123456789012345678901234567890");
}

fn json_number_float_exp(b: &mut Bencher) {
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

fn ws_trim_scalar(b: &mut Bencher) {
    let input = format!("{}x", " \t\n\r".repeat(2048));
    let bytes = input.as_bytes();
    b.bytes = bytes.len() as u64;
    b.iter(|| black_box(trim_ws_scalar(black_box(bytes), 0)));
}

fn ws_trim_chunked(b: &mut Bencher) {
    let input = format!("{}x", " \t\n\r".repeat(2048));
    let bytes = input.as_bytes();
    b.bytes = bytes.len() as u64;
    b.iter(|| black_box(trim_ws_chunked(black_box(bytes), 0)));
}

benchmark_group!(
    take_until_any_micro,
    take_until_any_1,
    take_until_any_2,
    take_until_any_3,
    take_until_any_lut
);
benchmark_group!(
    json_string_micro,
    json_string_unescaped,
    json_string_escaped
);
benchmark_group!(
    json_number_micro,
    json_number_int_small,
    json_number_int_large,
    json_number_float_exp
);
benchmark_group!(whitespace_micro, ws_trim_scalar, ws_trim_chunked);

benchmark_main!(
    take_until_any_micro,
    json_string_micro,
    json_number_micro,
    whitespace_micro
);
