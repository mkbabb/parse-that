// f64 conversion + high-level number scanners — AW-IV.W4.2.b consolidated.
//
// Every number-scan entry point reduces to one of two shapes:
//   1. Span-only: `scan_number_span_cfg(state, cfg)`.
//   2. Fused span + f64: `scan_number_fused_cfg(state, cfg)`.
//
// The span-only variants return the matched `Span<'a>` and advance
// the cursor; the fused variants also compute the f64 via
// `number_parts_to_f64`. The six public entry points are thin
// dialect-specific wrappers that pick between
// `GENERIC_NUMBER_CONFIG` (CSS-style: `+` sign, `.5` leading dot,
// no leading-zero rejection) and `STRICT_NUMBER_CONFIG` (RFC 8259:
// `-` only, no leading dot, reject `007`).

use crate::parsers::eisel_lemire::compute_f64;
use crate::state::{ParserState, Span};

use super::number::{
    GENERIC_NUMBER_CONFIG, NumberConfig, NumberParts, STRICT_NUMBER_CONFIG, parse_eight_digits,
    scan_number_mantissa,
};

/// Convert `NumberParts` to f64. Integer fast path + Eisel-Lemire + fast_float2 fallback.
#[inline(always)]
pub fn number_parts_to_f64(parts: &NumberParts, src: &str) -> f64 {
    // Pure integer <= 18 digits: direct u64->f64 (skip all float math).
    if parts.is_integer && parts.n_digits <= 18 {
        let val = parts.mantissa as f64;
        return if parts.negative { -val } else { val };
    }

    // Eisel-Lemire for <= 19 significant digits.
    if parts.n_digits <= 19 {
        if let Some(f) = compute_f64(parts.exponent as i64, parts.mantissa, parts.negative) {
            return f;
        }
    }

    // Emergency fallback (~0.01%): ambiguous rounding or >19 significant digits.
    fast_float2::parse(src).expect("valid number string")
}

// ── Generic (CSS-style) ──────────────────────────────────────────

#[inline(always)]
fn scan_with_cfg<'a>(
    state: &mut ParserState<'a>,
    cfg: &NumberConfig,
) -> Option<(NumberParts, Span<'a>)> {
    let start = state.offset;
    let (parts, end) = scan_number_mantissa(state.padded(), start, cfg)?;
    state.offset = end;
    Some((parts, Span::new(start, end, state.src)))
}

#[inline(always)]
fn fused_f64_with_cfg(parts: &NumberParts, span: Span<'_>) -> f64 {
    if parts.is_integer && parts.n_digits == 1 && parts.mantissa == 0 {
        0.0
    } else {
        number_parts_to_f64(parts, span.as_str())
    }
}

/// Generic number span scanner: accepts `+`, leading `.`, no
/// leading-zero rejection.
#[inline(always)]
pub fn scan_number_span<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    scan_with_cfg(state, &GENERIC_NUMBER_CONFIG).map(|(_, span)| span)
}

/// Fused generic number scanner + converter.
#[inline(always)]
pub fn scan_number_f64<'a>(state: &mut ParserState<'a>) -> Option<f64> {
    let (parts, span) = scan_with_cfg(state, &GENERIC_NUMBER_CONFIG)?;
    Some(number_parts_to_f64(&parts, span.as_str()))
}

// ── Strict (RFC 8259) ────────────────────────────────────────────

/// Strict number span scanner: no `+`, no leading dot, RFC 8259
/// leading-zero rejection. Returns the matched span only.
#[inline(always)]
pub fn scan_number_strict_span<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    scan_with_cfg(state, &STRICT_NUMBER_CONFIG).map(|(_, span)| span)
}

/// Fused strict number scanner + converter. Returns `(Span, f64)`.
#[inline(always)]
pub fn scan_number_strict_fused<'a>(state: &mut ParserState<'a>) -> Option<(Span<'a>, f64)> {
    let (parts, span) = scan_with_cfg(state, &STRICT_NUMBER_CONFIG)?;
    let f = fused_f64_with_cfg(&parts, span);
    Some((span, f))
}

/// Fused strict number scanner returning just `f64` (no Span construction).
#[inline(always)]
pub fn scan_number_strict_f64<'a>(state: &mut ParserState<'a>) -> Option<f64> {
    let (parts, span) = scan_with_cfg(state, &STRICT_NUMBER_CONFIG)?;
    Some(fused_f64_with_cfg(&parts, span))
}

// ── Standalone conversion ───────────────────────────────────────

/// Parse a number string to f64.
///
/// Integer fast path (8-digit chunks, direct u64->f64) for pure
/// integers <= 18 digits; falls back to `fast_float2::parse` for
/// floats / large mantissas. For zero-re-read throughput use
/// `scan_number_f64`, which accumulates DURING the scan.
#[inline(always)]
pub fn parse_number_f64(s: &str) -> f64 {
    let bytes = s.as_bytes();
    if bytes.is_empty() {
        return 0.0;
    }

    let (neg, digits_start) = if bytes[0] == b'-' {
        (true, 1)
    } else if bytes[0] == b'+' {
        (true, 1)
    } else {
        (false, 0)
    };

    let mut i = digits_start;
    while i < bytes.len() && bytes[i].is_ascii_digit() {
        i += 1;
    }
    let digit_count = i - digits_start;

    let is_pure_int =
        i >= bytes.len() || (bytes[i] != b'.' && bytes[i] != b'e' && bytes[i] != b'E');
    if !is_pure_int || digit_count == 0 || digit_count > 18 {
        return fast_float2::parse(s).expect("number scanner produced unparseable span");
    }

    let digits = &bytes[digits_start..i];
    let mut mantissa: u64 = 0;
    let mut j = 0;
    while j + 8 <= digits.len() {
        mantissa = mantissa
            .wrapping_mul(100_000_000)
            .wrapping_add(parse_eight_digits(&digits[j..]));
        j += 8;
    }
    while j < digits.len() {
        mantissa = mantissa * 10 + (digits[j] - b'0') as u64;
        j += 1;
    }

    let f = mantissa as f64;
    if neg { -f } else { f }
}
