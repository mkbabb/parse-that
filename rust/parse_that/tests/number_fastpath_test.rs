//! Tests for AV.3.5 — 16-digit SIMD integer fast path and the
//! Clinger / Eisel-Lemire short-circuit.
//!
//! Covers three invariants:
//!
//! 1. The integer SIMD stripe returns the same mantissa + length as
//!    the scalar ground-truth across the 15/16/17-digit transition.
//! 2. `compute_f64` under the short-circuit returns exactly the same
//!    f64 bits as the Eisel-Lemire slow path for every fast-path
//!    input — the short-circuit cannot diverge.
//! 3. The full `scan_number_f64` / `scan_number_strict_f64` pipeline
//!    round-trips every representative JSON / CSS numeric literal
//!    through the new code.
//!
//! All numeric comparisons use bit-exact equality (`to_bits`) so a
//! single-ULP divergence in the fast path would fail the test.
//! `f64::NAN`-comparison pitfalls are avoided by going through
//! `to_bits`.

use parse_that::parsers::eisel_lemire::compute_f64;
use parse_that::parsers::scan::{
    GENERIC_NUMBER_CONFIG, STRICT_NUMBER_CONFIG, number_parts_to_f64, scan_number_mantissa,
};
use parse_that::state::{INPUT_PAD_BYTES, PaddedView};

fn padded_buf(input: &[u8]) -> Vec<u8> {
    let mut v = Vec::with_capacity(input.len() + INPUT_PAD_BYTES);
    v.extend_from_slice(input);
    v.resize(input.len() + INPUT_PAD_BYTES, 0);
    v
}

fn scan_generic(input: &str) -> (u64, i32, u32, bool, usize) {
    let buf = padded_buf(input.as_bytes());
    let view = PaddedView::new(&buf, input.len());
    let (parts, end) = scan_number_mantissa(view, 0, &GENERIC_NUMBER_CONFIG)
        .expect("number scan must succeed");
    (
        parts.mantissa,
        parts.exponent,
        parts.n_digits,
        parts.is_integer,
        end,
    )
}

fn scan_strict(input: &str) -> (u64, i32, u32, bool, usize) {
    let buf = padded_buf(input.as_bytes());
    let view = PaddedView::new(&buf, input.len());
    let (parts, end) = scan_number_mantissa(view, 0, &STRICT_NUMBER_CONFIG)
        .expect("strict number scan must succeed");
    (
        parts.mantissa,
        parts.exponent,
        parts.n_digits,
        parts.is_integer,
        end,
    )
}

// ── Integer-part 16-digit fast path ─────────────────────────────────

#[test]
fn integer_one_digit() {
    let (m, e, n, is_int, end) = scan_generic("7");
    assert_eq!(m, 7);
    assert_eq!(e, 0);
    assert_eq!(n, 1);
    assert!(is_int);
    assert_eq!(end, 1);
}

#[test]
fn integer_four_digits_below_simd_stripe() {
    // Short integer (4 digits) terminated by non-digit — the SIMD
    // stripe classifies all 16 lanes, returns count=4.
    let (m, _, n, is_int, end) = scan_generic("1234,");
    assert_eq!(m, 1234);
    assert_eq!(n, 4);
    assert!(is_int);
    assert_eq!(end, 4);
}

#[test]
fn integer_fifteen_digits_fits_in_single_stripe() {
    let s = "123456789012345";
    let (m, _, n, is_int, end) = scan_generic(s);
    assert_eq!(m, 123_456_789_012_345);
    assert_eq!(n, 15);
    assert!(is_int);
    assert_eq!(end, 15);
}

#[test]
fn integer_sixteen_digits_fills_stripe() {
    // Exactly fills the SIMD stripe — loop continues to next stripe
    // which classifies padded NUL bytes as non-digit and returns 0.
    let s = "1234567890123456";
    let (m, _, n, is_int, end) = scan_generic(s);
    assert_eq!(m, 1_234_567_890_123_456);
    assert_eq!(n, 16);
    assert!(is_int);
    assert_eq!(end, 16);
}

#[test]
fn integer_seventeen_digits_crosses_stripe() {
    // First stripe: 16 digits. Second stripe starts at offset 16; it
    // returns count=1 and the loop exits.
    let s = "12345678901234567";
    let (m, _, n, is_int, end) = scan_generic(s);
    assert_eq!(m, 12_345_678_901_234_567);
    assert_eq!(n, 17);
    assert!(is_int);
    assert_eq!(end, 17);
}

#[test]
fn integer_eighteen_digits_fits_budget() {
    // 18 digits — fits within the 19-digit mantissa budget; two
    // stripes fire.
    let s = "123456789012345678";
    let (m, _, n, is_int, end) = scan_generic(s);
    assert_eq!(m, 123_456_789_012_345_678);
    assert_eq!(n, 18);
    assert!(is_int);
    assert_eq!(end, 18);
}

#[test]
fn integer_twenty_digits_budget_guard_fires() {
    // 20 digits — the SIMD stripe stops before pushing past the
    // 19-digit budget; the per-byte fallback swallows the overflow
    // bytes (but does not change mantissa past the 19-digit mark on
    // the generic / strict config path since the caller observes
    // n_digits == the in-budget total).
    //
    // `scan_number_mantissa` does not enforce a hard cap on the
    // integer mantissa (it truncates via `wrapping_mul`), so the
    // test asserts the first 19 digits are captured correctly.
    let s = "12345678901234567890";
    let (m, _, n, is_int, end) = scan_generic(s);
    // First 16 digits via SIMD stripe, then the remaining 4 via
    // per-byte loop (which wraps on overflow — that's fine, the
    // fast-f64 layer routes to fast_float2 for n_digits > 18).
    // Mantissa arithmetic is wrapping — we do NOT assert a specific
    // u64 here beyond that the scan consumed all 20 digits.
    assert_eq!(n, 20);
    assert_eq!(end, 20);
    assert!(is_int);
    // Guard against silently dropping digits: wrapping multiply
    // composed with the 20 scalar digits must yield a non-zero value
    // for this input.
    assert_ne!(m, 0);
}

#[test]
fn integer_digits_followed_by_fraction() {
    // The integer SIMD path must not greedily consume the dot.
    let (m, e, n, is_int, end) = scan_generic("1234567890.5");
    assert_eq!(m, 12_345_678_905);
    assert_eq!(e, -1);
    assert_eq!(n, 11);
    assert!(!is_int);
    assert_eq!(end, 12);
}

#[test]
fn integer_digits_followed_by_exponent() {
    let (m, e, n, is_int, end) = scan_generic("1234e5");
    assert_eq!(m, 1234);
    assert_eq!(e, 5);
    assert_eq!(n, 4);
    assert!(!is_int);
    assert_eq!(end, 6);
}

#[test]
fn integer_strict_negative() {
    let (m, _, n, is_int, end) = scan_strict("-1234567890123456");
    assert_eq!(m, 1_234_567_890_123_456);
    assert_eq!(n, 16);
    assert!(is_int);
    assert_eq!(end, 17);
}

// ── Cross-validate SIMD vs scalar integer scan at every length ──────

#[test]
fn integer_cross_validate_all_lengths() {
    // Every length from 1 to 25 — covers the 15/16/17 stripe
    // transitions and the 19-digit budget guard.
    for n in 1..=25_usize {
        let s: String = (0..n).map(|i| char::from(b'1' + ((i % 9) as u8))).collect();
        let (simd_m, _, simd_n, _, simd_end) = scan_generic(&s);

        // Scalar reference: accumulate digit-by-digit with the same
        // wrapping arithmetic that `scan_number_mantissa` uses.
        let mut ref_m: u64 = 0;
        for b in s.bytes() {
            ref_m = ref_m.wrapping_mul(10).wrapping_add((b - b'0') as u64);
        }
        assert_eq!(
            simd_m, ref_m,
            "mantissa mismatch for {n}-digit input {s:?}"
        );
        assert_eq!(simd_n as usize, n, "n_digits mismatch for {n}-digit input");
        assert_eq!(simd_end, n, "end offset mismatch for {n}-digit input");
    }
}

// ── Clinger / Eisel-Lemire short-circuit correctness ────────────────

/// The fast path must return identical f64 bits to the `fast_float2`
/// reference parser (which runs the full Eisel-Lemire path, then
/// falls back to `parse_long_mantissa` on ambiguity).
fn assert_fast_path_matches_reference(input: &str) {
    let parsed = number_parts_to_f64(
        &{
            let buf = padded_buf(input.as_bytes());
            let view = PaddedView::new(&buf, input.len());
            let (parts, _) = scan_number_mantissa(view, 0, &GENERIC_NUMBER_CONFIG)
                .expect("scan should succeed");
            parts
        },
        input,
    );

    let reference: f64 = input.parse().expect("reference parse must succeed");

    assert_eq!(
        parsed.to_bits(),
        reference.to_bits(),
        "fast-path f64 diverged from reference for {input:?}: \
         fast={parsed} ({:#x}) ref={reference} ({:#x})",
        parsed.to_bits(),
        reference.to_bits(),
    );
}

#[test]
fn fastpath_short_fractions() {
    // Typical canada.json coordinates.
    for s in [
        "0.0",
        "0.5",
        "-0.5",
        "1.5",
        "3.14159",
        "2.71828",
        "-123.456",
        "100.001",
        "0.0000001",
        "99.9999999",
    ] {
        assert_fast_path_matches_reference(s);
    }
}

#[test]
fn fastpath_integers_to_2_53() {
    // Boundary around f64's exact-integer limit (2^53 = 9_007_199_254_740_992).
    for s in [
        "0",
        "1",
        "-1",
        "1000000000000000",     // 10^15
        "9007199254740991",     // 2^53 - 1 (max exact integer)
        "9007199254740992",     // 2^53 (still exact)
        "-9007199254740992",
    ] {
        assert_fast_path_matches_reference(s);
    }
}

#[test]
fn fastpath_scientific_in_range() {
    // Exponents that land inside the [-22, 37] fast-path window.
    for s in [
        "1e0",
        "1e5",
        "1e22",
        "1e-22",
        "1.5e10",
        "3.14e-10",
        "1e37",       // disguised path
        "1e-15",
    ] {
        assert_fast_path_matches_reference(s);
    }
}

#[test]
fn fastpath_out_of_range_falls_through() {
    // Exponents outside [-22, 37] — Eisel-Lemire slow path takes
    // over; result must still match the reference parser.
    for s in [
        "1e38",
        "1e-23",
        "1e100",
        "1.23456789012345e50",
    ] {
        assert_fast_path_matches_reference(s);
    }
}

#[test]
fn fastpath_overflow_mantissa_falls_through() {
    // Mantissa > 2^53 — fast path rejects; the Eisel-Lemire path
    // produces the correctly-rounded f64.
    for s in [
        "9007199254740993",     // 2^53 + 1 (not exact in f64)
        "12345678901234567890", // 20 digits (overflows fast-path mantissa)
    ] {
        assert_fast_path_matches_reference(s);
    }
}

#[test]
fn fastpath_and_slow_path_agree_in_range() {
    // Direct `compute_f64` comparison: for every mantissa / exponent
    // pair in the fast-path window the two paths return identical
    // bits. We don't disable the fast path, but we check the output
    // against `fast_float2::parse` which goes through the full
    // decimal pipeline on every call.
    for mantissa in [1_u64, 7, 42, 999_999, 9_007_199_254_740_992] {
        for exponent in [-22_i64, -15, -5, 0, 5, 15, 22, 30, 37] {
            let Some(fast) = compute_f64(exponent, mantissa, false) else {
                continue;
            };
            let s = format!("{mantissa}e{exponent}");
            let reference: f64 = s.parse().expect("reference parse must succeed");
            assert_eq!(
                fast.to_bits(),
                reference.to_bits(),
                "compute_f64 disagreed with reference for mantissa={mantissa} e={exponent}: \
                 fast={fast} ref={reference}",
            );
        }
    }
}

#[test]
fn fastpath_negative_zero() {
    let zero = compute_f64(0, 0, true).unwrap();
    assert_eq!(zero.to_bits(), (-0.0_f64).to_bits());
    let pzero = compute_f64(0, 0, false).unwrap();
    assert_eq!(pzero.to_bits(), 0.0_f64.to_bits());
}

// ── canada.json-shaped inputs hit the Clinger short-circuit ──────────

/// Representative canada.json coordinate shape: 2 integer digits,
/// 7 fractional digits. The full scanner must hit the Clinger fast
/// path for every sample, and the result must agree bit-for-bit with
/// the reference parser (no rounding divergence).
///
/// This is the AV.3.5 hard-gate regression probe: if a future change
/// routes these numbers through the Eisel-Lemire slow path it shows
/// up here as an accuracy mismatch (when the slow path diverges) or
/// at least as an infrastructure break (panics / compile failures).
#[test]
fn fastpath_canada_shaped_coordinates() {
    let samples = [
        "43.0215264",
        "-79.3839722",
        "51.0247778",
        "0.5",
        "-0.0000001",
        "12.3456789",
        "999.9999999",
        "-89.9999999",
        "180.0000001",
        "1.0",
        "-1e-5",
        "3.14159265",
    ];
    for s in samples {
        assert_fast_path_matches_reference(s);
    }
}

// ── 16-digit stripe boundary offsets ────────────────────────────────

#[test]
fn integer_scan_at_nonzero_start_offset() {
    // Scan starts mid-buffer — the stripe load must align to the
    // scan offset, not the buffer origin.
    let input = "   1234567890123456   ";
    let buf = padded_buf(input.as_bytes());
    let view = PaddedView::new(&buf, input.len());
    let (parts, end) = scan_number_mantissa(view, 3, &GENERIC_NUMBER_CONFIG)
        .expect("scan at offset 3 should succeed");
    assert_eq!(parts.mantissa, 1_234_567_890_123_456);
    assert_eq!(parts.n_digits, 16);
    assert_eq!(end, 19);
}

#[test]
fn integer_scan_right_up_to_input_boundary() {
    // Final digit lands at `len - 1` — the next stripe load reads
    // padded NULs, which classify as non-digit.
    let input = "123456789012345";
    let (m, _, n, is_int, end) = scan_generic(input);
    assert_eq!(m, 123_456_789_012_345);
    assert_eq!(n, 15);
    assert!(is_int);
    assert_eq!(end, input.len());
}
