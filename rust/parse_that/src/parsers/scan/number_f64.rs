// f64 conversion + high-level number scanners built on top of `number.rs`.

use crate::state::{ParserState, Span};
use crate::parsers::eisel_lemire::compute_f64;
use super::number::{
    NumberParts, GENERIC_NUMBER_CONFIG, JSON_NUMBER_CONFIG,
    parse_eight_digits, scan_number_mantissa,
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

// ── High-level number scanners ────────────────────────────────────

/// Generic number span scanner: accepts `+`, leading `.`, no leading-zero rejection.
/// Handles: `-1`, `+1`, `1.5`, `.5`, `1e10`, `1.5e-3`, etc.
#[inline(always)]
pub fn scan_number_span<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;

    if i >= len {
        return None;
    }

    // Optional sign: + or -
    let b = unsafe { *bytes.get_unchecked(i) };
    if b == b'-' || b == b'+' {
        i += 1;
        if i >= len {
            return None;
        }
    }

    // Digits before dot (optional for CSS — `.5` is valid).
    let pre_dot_start = i;
    while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
        i += 1;
    }
    let has_pre_dot_digits = i > pre_dot_start;

    // Optional fraction.
    let mut has_fraction = false;
    if i < len && unsafe { *bytes.get_unchecked(i) } == b'.' {
        i += 1;
        let frac_start = i;
        while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
            i += 1;
        }
        if i > frac_start {
            has_fraction = true;
        } else {
            // '.' with no digits — backtrack.
            i -= 1;
        }
    }

    // Must have at least some digits (before or after dot).
    if !has_pre_dot_digits && !has_fraction {
        return None;
    }

    // Optional exponent.
    if i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b == b'e' || b == b'E' {
            let exp_mark = i;
            i += 1;
            if i < len {
                let b = unsafe { *bytes.get_unchecked(i) };
                if b == b'+' || b == b'-' {
                    i += 1;
                }
            }
            let exp_digit_start = i;
            while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
                i += 1;
            }
            if i == exp_digit_start {
                i = exp_mark; // backtrack
            }
        }
    }

    if i == start {
        return None;
    }

    state.offset = i;
    Some(Span::new(start, i, state.src))
}

/// Fused generic number scanner + converter. Scans CSS-compatible numbers (allows `+`,
/// leading `.` like `.5`, no leading-zero rejection) and converts to f64 in a single
/// pass using mantissa accumulation + Eisel-Lemire. Returns `Option<f64>` directly.
#[inline(always)]
pub fn scan_number_f64<'a>(state: &mut ParserState<'a>) -> Option<f64> {
    let start = state.offset;
    let (parts, end) = scan_number_mantissa(state.src_bytes, start, &GENERIC_NUMBER_CONFIG)?;
    state.offset = end;
    let src = &state.src[start..end];
    Some(number_parts_to_f64(&parts, src))
}

// ── JSON-specific number scanners ────────────────────────────────────
//
// JSON numbers reject `+` sign, leading `.`, and enforce RFC 8259
// leading-zero rejection.  These are thin wrappers over the shared
// `scan_number_mantissa(…, &JSON_NUMBER_CONFIG)` core.

/// JSON number span scanner: no `+`, no leading dot, RFC 8259
/// leading-zero rejection.  Returns the matched span only.
#[inline(always)]
pub fn scan_json_number_span<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let start = state.offset;
    let (_, end) = scan_number_mantissa(state.src_bytes, start, &JSON_NUMBER_CONFIG)?;
    state.offset = end;
    Some(Span::new(start, end, state.src))
}

/// Fused JSON number scanner + converter.  Scans the number span AND
/// accumulates the mantissa in one pass — no re-reading of digits.
/// Returns `(Span, f64)`.
#[inline(always)]
pub fn scan_json_number_fused<'a>(state: &mut ParserState<'a>) -> Option<(Span<'a>, f64)> {
    let start = state.offset;
    let (parts, end) = scan_number_mantissa(state.src_bytes, start, &JSON_NUMBER_CONFIG)?;
    state.offset = end;
    let span = Span::new(start, end, state.src);
    let f = if parts.is_integer && parts.n_digits == 1 && parts.mantissa == 0 {
        0.0
    } else {
        number_parts_to_f64(&parts, span.as_str())
    };
    Some((span, f))
}

/// Fused JSON number scanner returning just `f64` (no Span construction).
#[inline(always)]
pub fn scan_json_number_f64<'a>(state: &mut ParserState<'a>) -> Option<f64> {
    let start = state.offset;
    let (parts, end) = scan_number_mantissa(state.src_bytes, start, &JSON_NUMBER_CONFIG)?;
    state.offset = end;
    let src = &state.src[start..end];
    Some(if parts.is_integer && parts.n_digits == 1 && parts.mantissa == 0 {
        0.0
    } else {
        number_parts_to_f64(&parts, src)
    })
}

// ── Standalone conversion ───────────────────────────────────────────

/// Parse a number string to f64.
///
/// Uses the integer fast path (8-digit chunks, direct u64->f64 cast) for pure
/// integers <= 18 digits. Falls back to `fast_float2::parse` for floats, which
/// has its own highly-optimized digit scanning.
///
/// For the true zero-re-read path, use `scan_number_f64` which accumulates
/// mantissa DURING the initial scan and calls Eisel-Lemire directly.
#[inline(always)]
pub fn parse_number_f64(s: &str) -> f64 {
    let bytes = s.as_bytes();
    if bytes.is_empty() {
        return 0.0;
    }

    let (neg, digits_start) = if bytes[0] == b'-' {
        (true, 1)
    } else if bytes[0] == b'+' {
        (true, 1) // parse_number_f64 historically only handled '-'; keep `+` safe
    } else {
        (false, 0)
    };

    // Find where integer digits end.
    let mut i = digits_start;
    while i < bytes.len() && bytes[i].is_ascii_digit() {
        i += 1;
    }
    let digit_count = i - digits_start;

    // Float or too many digits -> fast_float2 (already near-optimal).
    let is_pure_int =
        i >= bytes.len() || (bytes[i] != b'.' && bytes[i] != b'e' && bytes[i] != b'E');
    if !is_pure_int || digit_count == 0 || digit_count > 18 {
        return fast_float2::parse(s).expect("number scanner produced unparseable span");
    }

    // Integer fast path: 8-digit chunk accumulation.
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
