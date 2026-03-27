use std::borrow::Cow;

use crate::parse::*;
use crate::span_parser::*;
use crate::state::{ParserState, Span};

use pprint::Pretty;

// ── Monolithic number scanner ─────────────────────────────────

/// Result of number scanning: span + whether it's a pure integer.
pub struct NumberSpan<'a> {
    pub span: Span<'a>,
    pub is_integer: bool,
}

/// Scans `[-]digits[.digits][(e|E)[+-]digits]` in one byte loop.
/// Returns the span and whether the number is a pure integer (no `.` or `e`/`E`).
#[inline(always)]
pub fn number_span_fast_ex<'a>(state: &mut ParserState<'a>) -> Option<NumberSpan<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    let mut is_integer = true;

    if i >= len {
        return None;
    }

    // Optional sign
    if unsafe { *bytes.get_unchecked(i) } == b'-' {
        i += 1;
        if i >= len {
            return None;
        }
    }

    // Required integer digits
    let digit_start = i;
    while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
        i += 1;
    }
    if i == digit_start {
        return None; // no digits
    }

    // Leading-zero rejection (RFC 8259): only `0` or `0.x` allowed
    let digit_count = i - digit_start;
    if digit_count > 1 && unsafe { *bytes.get_unchecked(digit_start) } == b'0' {
        // `007` etc. — return span of just the sign + `0`
        i = digit_start + 1;
        state.offset = i;
        return Some(NumberSpan {
            span: Span::new(start, i, state.src),
            is_integer: true,
        });
    }

    // Optional fraction
    if i < len && unsafe { *bytes.get_unchecked(i) } == b'.' {
        i += 1;
        let frac_start = i;
        while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
            i += 1;
        }
        if i == frac_start {
            // '.' with no digits after — backtrack the dot
            i -= 1;
        } else {
            is_integer = false;
        }
    }

    // Optional exponent
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
                // 'e' with no digits — backtrack
                i = exp_mark;
            } else {
                is_integer = false;
            }
        }
    }

    if i == start {
        return None;
    }

    state.offset = i;
    Some(NumberSpan {
        span: Span::new(start, i, state.src),
        is_integer,
    })
}

/// Convenience wrapper returning just the span (used by SpanParser).
#[inline(always)]
pub fn number_span_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    number_span_fast_ex(state).map(|ns| ns.span)
}

/// CSS-compatible number scanner: accepts `+`, leading `.`, no leading-zero rejection.
/// Handles: `-1`, `+1`, `1.5`, `.5`, `1e10`, `1.5e-3`, etc.
#[inline(always)]
pub fn css_number_span_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
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

/// Fused CSS number scanner + converter. Scans CSS-compatible numbers (allows `+`,
/// leading `.` like `.5`, no leading-zero rejection) and converts to f64 in a single
/// pass using mantissa accumulation + Eisel-Lemire. Returns `Option<f64>` directly.
#[inline(always)]
pub fn css_number_scan_f64<'a>(state: &mut ParserState<'a>) -> Option<f64> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;

    if i >= len {
        return None;
    }

    // Optional sign: + or -
    let mut neg = false;
    let b = unsafe { *bytes.get_unchecked(i) };
    if b == b'-' {
        neg = true;
        i += 1;
        if i >= len {
            return None;
        }
    } else if b == b'+' {
        i += 1;
        if i >= len {
            return None;
        }
    }

    // Integer digits — accumulate mantissa during scan.
    let digit_start = i;
    let mut mantissa: u64 = 0;

    // 8-digit chunks (simdjson trick).
    while i + 8 <= len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if !b.is_ascii_digit() {
            break;
        }
        let chunk = &bytes[i..i + 8];
        if chunk.iter().all(|b| b.is_ascii_digit()) {
            let chunk_val = parse_eight_digits(chunk);
            mantissa = mantissa
                .wrapping_mul(100_000_000)
                .wrapping_add(chunk_val);
            i += 8;
        } else {
            break;
        }
    }
    // Remaining digits (< 8).
    while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
        mantissa = mantissa * 10 + (unsafe { *bytes.get_unchecked(i) } - b'0') as u64;
        i += 1;
    }
    let digit_count = i - digit_start;
    let has_pre_dot_digits = digit_count > 0;

    // Track total significant digits and decimal exponent for Eisel-Lemire.
    let mut total_digits = digit_count;
    let mut decimal_exponent: i64 = 0;

    // Fractional part: continue accumulating mantissa, adjust exponent.
    let mut has_frac = false;
    if i < len && unsafe { *bytes.get_unchecked(i) } == b'.' {
        i += 1;
        let frac_start = i;
        // Accumulate fractional digits into mantissa (same 8-digit chunks).
        while i + 8 <= len && total_digits + 8 <= 19 {
            let b = unsafe { *bytes.get_unchecked(i) };
            if !b.is_ascii_digit() {
                break;
            }
            let chunk = &bytes[i..i + 8];
            if chunk.iter().all(|b| b.is_ascii_digit()) {
                mantissa = mantissa
                    .wrapping_mul(100_000_000)
                    .wrapping_add(parse_eight_digits(chunk));
                i += 8;
                total_digits += 8;
            } else {
                break;
            }
        }
        while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() && total_digits < 19 {
            mantissa = mantissa * 10 + (unsafe { *bytes.get_unchecked(i) } - b'0') as u64;
            i += 1;
            total_digits += 1;
        }
        // Skip remaining fractional digits beyond 19 significant digits.
        while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
            i += 1;
        }
        let frac_digits = i - frac_start;
        if frac_digits == 0 {
            // '.' with no digits after — backtrack the dot.
            i -= 1;
        } else {
            has_frac = true;
            // Fractional digits shift the exponent negative.
            decimal_exponent -= (i - frac_start) as i64;
            // But we only accumulated min(frac_digits, 19-digit_count) of them.
            let accumulated_frac = total_digits - digit_count;
            decimal_exponent += (frac_digits - accumulated_frac) as i64;
        }
    }

    // Must have at least some digits (before or after dot).
    if !has_pre_dot_digits && !has_frac {
        return None;
    }

    // Optional exponent (e/E).
    let mut has_exp = false;
    if i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b == b'e' || b == b'E' {
            has_exp = true;
            let exp_mark = i;
            i += 1;
            let mut exp_neg = false;
            if i < len {
                let b = unsafe { *bytes.get_unchecked(i) };
                if b == b'+' {
                    i += 1;
                } else if b == b'-' {
                    exp_neg = true;
                    i += 1;
                }
            }
            let exp_digit_start = i;
            let mut explicit_exp: i64 = 0;
            while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
                explicit_exp =
                    explicit_exp * 10 + (unsafe { *bytes.get_unchecked(i) } - b'0') as i64;
                i += 1;
                if explicit_exp > 999 {
                    // Clamp to avoid overflow; Eisel-Lemire handles out-of-range.
                    explicit_exp = 999;
                }
            }
            if i == exp_digit_start {
                has_exp = false;
                i = exp_mark; // backtrack
            } else {
                decimal_exponent += if exp_neg { -explicit_exp } else { explicit_exp };
            }
        }
    }

    if i == start {
        return None;
    }

    state.offset = i;

    // Fast path: pure integer, <= 18 digits, fits in u64 -> direct f64 cast.
    if !has_frac && !has_exp && digit_count <= 18 {
        let f = mantissa as f64;
        return Some(if neg { -f } else { f });
    }

    // Eisel-Lemire: direct mantissa+exponent -> f64 (no digit re-read).
    if total_digits <= 19 {
        if let Some(f) = super::eisel_lemire::compute_f64(decimal_exponent, mantissa, neg) {
            return Some(f);
        }
    }

    // Rare fallback (~0.01%): ambiguous rounding or >19 significant digits.
    let s = &state.src[start..i];
    let f: f64 = fast_float2::parse(s).expect("css_number_scan_f64: invalid CSS number");
    Some(f)
}

/// Convert 8 ASCII digit bytes to a u64 in ~3 multiply-shift operations.
/// Ported from simdjson's `parse_eight_digits_unrolled`.
/// Caller must guarantee that `s` contains exactly 8 ASCII digit bytes.
#[inline(always)]
fn parse_eight_digits(s: &[u8]) -> u64 {
    debug_assert!(s.len() >= 8);
    let mut val = u64::from_le_bytes(s[..8].try_into().unwrap());
    val = val.wrapping_sub(0x3030_3030_3030_3030); // subtract '0'
    // Fold pairs: each byte pair → 2-digit value in alternating bytes
    val = (val & 0x0F0F_0F0F_0F0F_0F0F).wrapping_mul(0x0A01) >> 8;
    // Fold quads: each 2-byte pair → 4-digit value
    val = (val & 0x00FF_00FF_00FF_00FF).wrapping_mul(0x0064_0001) >> 16;
    // Fold octets: combine into single value
    (val & 0x0000_FFFF_0000_FFFF).wrapping_mul(0x0000_2710_0000_0001) >> 32
}

/// Fused JSON number scanner + converter. Scans the number span AND accumulates
/// the mantissa in one pass — no re-reading of digits. Returns `(Span, f64)`.
///
/// For integers ≤ 18 digits: direct u64 accumulation (with 8-digit chunking
/// via simdjson's multiply-fold trick), then cast to f64.
/// For floats and large integers: falls back to `fast_float2::parse`.
#[inline(always)]
pub fn number_scan_convert<'a>(state: &mut ParserState<'a>) -> Option<(Span<'a>, f64)> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    let mut neg = false;

    if i >= len {
        return None;
    }

    // Optional sign
    if unsafe { *bytes.get_unchecked(i) } == b'-' {
        neg = true;
        i += 1;
        if i >= len {
            return None;
        }
    }

    // Integer digits — accumulate mantissa during scan
    let digit_start = i;
    let mut mantissa: u64 = 0;

    // 8-digit chunks (simdjson trick)
    while i + 8 <= len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if !b.is_ascii_digit() {
            break;
        }
        // Check all 8 bytes are digits
        let chunk = &bytes[i..i + 8];
        if chunk.iter().all(|b| b.is_ascii_digit()) {
            let chunk_val = parse_eight_digits(chunk);
            mantissa = mantissa
                .wrapping_mul(100_000_000)
                .wrapping_add(chunk_val);
            i += 8;
        } else {
            break;
        }
    }
    // Remaining digits (< 8)
    while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
        mantissa = mantissa * 10 + (unsafe { *bytes.get_unchecked(i) } - b'0') as u64;
        i += 1;
    }
    let digit_count = i - digit_start;
    if digit_count == 0 {
        return None;
    }

    // Leading-zero rejection
    if digit_count > 1 && unsafe { *bytes.get_unchecked(digit_start) } == b'0' {
        i = digit_start + 1;
        state.offset = i;
        let span = Span::new(start, i, state.src);
        return Some((span, 0.0));
    }

    // Track total significant digits and decimal exponent for Eisel-Lemire.
    let mut total_digits = digit_count;
    let mut decimal_exponent: i64 = 0;

    // Fractional part: continue accumulating mantissa, adjust exponent.
    let has_frac = i < len && unsafe { *bytes.get_unchecked(i) } == b'.';
    if has_frac {
        i += 1;
        let frac_start = i;
        // Accumulate fractional digits into mantissa (same 8-digit chunks).
        while i + 8 <= len && total_digits + 8 <= 19 {
            let b = unsafe { *bytes.get_unchecked(i) };
            if !b.is_ascii_digit() {
                break;
            }
            let chunk = &bytes[i..i + 8];
            if chunk.iter().all(|b| b.is_ascii_digit()) {
                mantissa = mantissa
                    .wrapping_mul(100_000_000)
                    .wrapping_add(parse_eight_digits(chunk));
                i += 8;
                total_digits += 8;
            } else {
                break;
            }
        }
        while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() && total_digits < 19 {
            mantissa = mantissa * 10 + (unsafe { *bytes.get_unchecked(i) } - b'0') as u64;
            i += 1;
            total_digits += 1;
        }
        // Skip remaining fractional digits beyond 19 significant digits.
        while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
            i += 1;
        }
        let frac_digits = i - frac_start;
        if frac_digits == 0 {
            i -= 1; // backtrack dot with no digits
        } else {
            // Fractional digits shift the exponent negative.
            decimal_exponent -= (i - frac_start) as i64;
            // But we only accumulated min(frac_digits, 19-digit_count) of them.
            let accumulated_frac = total_digits - digit_count;
            decimal_exponent += (frac_digits - accumulated_frac) as i64;
        }
    }

    // Explicit exponent (e/E).
    let mut has_exp = false;
    if i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b == b'e' || b == b'E' {
            has_exp = true;
            let exp_mark = i;
            i += 1;
            let mut exp_neg = false;
            if i < len {
                let b = unsafe { *bytes.get_unchecked(i) };
                if b == b'+' {
                    i += 1;
                } else if b == b'-' {
                    exp_neg = true;
                    i += 1;
                }
            }
            let exp_digit_start = i;
            let mut explicit_exp: i64 = 0;
            while i < len && unsafe { *bytes.get_unchecked(i) }.is_ascii_digit() {
                explicit_exp = explicit_exp * 10 + (unsafe { *bytes.get_unchecked(i) } - b'0') as i64;
                i += 1;
                if explicit_exp > 999 {
                    // Clamp to avoid overflow; Eisel-Lemire handles out-of-range.
                    explicit_exp = 999;
                }
            }
            if i == exp_digit_start {
                has_exp = false;
                i = exp_mark;
            } else {
                decimal_exponent += if exp_neg { -explicit_exp } else { explicit_exp };
            }
        }
    }

    if i == start {
        return None;
    }

    state.offset = i;
    let span = Span::new(start, i, state.src);

    // Fast path: pure integer, ≤ 18 digits, fits in u64 → direct f64 cast.
    if !has_frac && !has_exp && digit_count <= 18 {
        let f = mantissa as f64;
        return Some((span, if neg { -f } else { f }));
    }

    // Eisel-Lemire: direct mantissa+exponent → f64 (no digit re-read).
    if total_digits <= 19 {
        if let Some(f) = super::eisel_lemire::compute_f64(decimal_exponent, mantissa, neg) {
            return Some((span, f));
        }
    }

    // Rare fallback (~0.01%): ambiguous rounding or >19 significant digits.
    let f: f64 = fast_float2::parse(span.as_str())
        .expect("number_scan_convert: invalid JSON number");
    Some((span, f))
}

/// Parse a JSON number string to f64.
///
/// Uses the integer fast path (8-digit chunks, direct u64→f64 cast) for pure
/// integers ≤ 18 digits. Falls back to `fast_float2::parse` for floats, which
/// has its own highly-optimized digit scanning.
///
/// For the true zero-re-read path, use `number_scan_convert` which accumulates
/// mantissa DURING the initial scan and calls Eisel-Lemire directly.
#[inline(always)]
pub fn parse_number_f64(s: &str) -> f64 {
    let bytes = s.as_bytes();
    if bytes.is_empty() {
        return 0.0;
    }

    let (neg, digits_start) = if bytes[0] == b'-' {
        (true, 1)
    } else {
        (false, 0)
    };

    // Find where integer digits end.
    let mut i = digits_start;
    while i < bytes.len() && bytes[i].is_ascii_digit() {
        i += 1;
    }
    let digit_count = i - digits_start;

    // Float or too many digits → fast_float2 (already near-optimal).
    let is_pure_int = i >= bytes.len() || (bytes[i] != b'.' && bytes[i] != b'e' && bytes[i] != b'E');
    if !is_pure_int || digit_count == 0 || digit_count > 18 {
        return fast_float2::parse(s).unwrap_or(0.0);
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

#[inline(always)]
fn parse_json_number_f64(span: Span<'_>, is_integer: bool) -> f64 {
    let s = span.as_str();
    let bytes = s.as_bytes();
    if !is_integer {
        return fast_float2::parse(s).expect("sp_json_number must only yield valid JSON numbers");
    }

    let (neg, digits) = if bytes.first() == Some(&b'-') {
        (true, &bytes[1..])
    } else {
        (false, bytes)
    };
    if digits.is_empty() || digits.len() > 18 {
        return fast_float2::parse(s).expect("sp_json_number must only yield valid JSON numbers");
    }

    let mut int = 0u64;
    for &b in digits {
        int = int * 10 + (b - b'0') as u64;
    }
    let num = int as f64;
    if neg {
        -num
    } else {
        num
    }
}

#[inline(always)]
fn decode_hex_nibble(b: u8) -> Option<u16> {
    match b {
        b'0'..=b'9' => Some((b - b'0') as u16),
        b'a'..=b'f' => Some((b - b'a' + 10) as u16),
        b'A'..=b'F' => Some((b - b'A' + 10) as u16),
        _ => None,
    }
}

#[inline(always)]
fn decode_hex4(bytes: &[u8], start: usize) -> Option<u16> {
    Some(
        (decode_hex_nibble(*bytes.get(start)?)? << 12)
            | (decode_hex_nibble(*bytes.get(start + 1)?)? << 8)
            | (decode_hex_nibble(*bytes.get(start + 2)?)? << 4)
            | decode_hex_nibble(*bytes.get(start + 3)?)?,
    )
}

// ── Monolithic JSON string scanner ────────────────────────────

/// Core JSON string scanner with configurable span bounds.
/// When `include_quotes` is false, returns content between quotes (exclusive).
/// When `include_quotes` is true, returns full span including delimiters.
#[inline(always)]
fn json_string_fast_inner<'a>(
    state: &mut ParserState<'a>,
    include_quotes: bool,
) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    if bytes.get(start) != Some(&b'"') {
        return None;
    }
    let mut i = start + 1;
    loop {
        // SIMD scan for next '"' or '\\'
        match memchr::memchr2(b'"', b'\\', bytes.get(i..)?) {
            None => return None, // unterminated string
            Some(pos) => {
                i += pos;
                if unsafe { *bytes.get_unchecked(i) } == b'"' {
                    i += 1; // consume closing quote
                    state.offset = i;
                    return if include_quotes {
                        Some(Span::new(start, i, state.src))
                    } else {
                        Some(Span::new(start + 1, i - 1, state.src))
                    };
                }
                // backslash: skip escape sequence
                i += 1;
                if i >= bytes.len() {
                    return None;
                }
                match unsafe { *bytes.get_unchecked(i) } {
                    b'u' => {
                        if i + 4 >= bytes.len() {
                            return None;
                        }
                        // Check for surrogate pairs: \uD800-\uDBFF must be followed by \uDC00-\uDFFF.
                        let hi = decode_hex4(bytes, i + 1)?;
                        i += 5; // skip u + 4 hex digits
                        if (0xD800..=0xDBFF).contains(&hi) {
                            // High surrogate — must be followed by \uDC00-\uDFFF
                            if i + 5 < bytes.len() && bytes[i] == b'\\' && bytes[i + 1] == b'u' {
                                let lo = decode_hex4(bytes, i + 2)?;
                                if !(0xDC00..=0xDFFF).contains(&lo) {
                                    return None; // not a valid low surrogate
                                }
                                i += 6; // skip \uXXXX for the low surrogate
                            } else {
                                return None; // lone high surrogate
                            }
                        } else if (0xDC00..=0xDFFF).contains(&hi) {
                            return None; // lone low surrogate
                        }
                    }
                    b'"' | b'\\' | b'/' | b'b' | b'f' | b'n' | b'r' | b't' => {
                        i += 1;
                    }
                    _ => return None, // invalid escape sequence
                }
            }
        }
    }
}

/// Scans a JSON string `"..."` with `\`-escape handling using SIMD (memchr2).
/// Returns the span of the *content* (between the quotes, exclusive of `"`).
#[inline(always)]
pub(crate) fn json_string_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    json_string_fast_inner(state, false)
}

/// Scans a JSON string `"..."` with `\`-escape handling using SIMD (memchr2).
/// Returns the span including the quote delimiters (matches regex behavior).
#[inline(always)]
pub fn json_string_fast_quoted<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    json_string_fast_inner(state, true)
}

// ── Utility: number_span_fast as a standalone Parser ──────────

/// Monolithic number span parser — replaces the 12-combinator chain.
#[inline]
pub fn number_span_fast_parser<'a>() -> Parser<'a, Span<'a>> {
    Parser::new(move |state: &mut ParserState<'a>| number_span_fast(state))
}

// ── JSON Value types and parsers ──────────────────────────────

#[derive(Pretty, Debug, Clone, PartialEq)]
pub enum JsonValue<'a> {
    #[pprint(rename = "null")]
    Null,
    Bool(bool),
    Number(f64),
    String(Cow<'a, str>),
    Array(Box<Vec<JsonValue<'a>>>),
    Object(Box<Vec<(Cow<'a, str>, JsonValue<'a>)>>),
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    // ── String parser using monolithic SIMD scanner ────────────
    // Returns raw spans (no unescape) — zero-copy.

    let json_string_content =
        || -> Parser<'a, Cow<'a, str>> { sp_json_string().map(|s| Cow::Borrowed(s.as_str())) };

    // ── Leaf values ───────────────────────────────────────────

    let json_null: Parser<'a, JsonValue<'a>> = sp_string("null").map(|_| JsonValue::Null);
    let json_true: Parser<'a, JsonValue<'a>> = sp_string("true").map(|_| JsonValue::Bool(true));
    let json_false: Parser<'a, JsonValue<'a>> = sp_string("false").map(|_| JsonValue::Bool(false));

    let json_number = || -> Parser<'a, JsonValue<'a>> {
        Parser::new(move |state: &mut ParserState<'a>| {
            let (_, f) = number_scan_convert(state)?;
            Some(JsonValue::Number(f))
        })
    };

    let json_string =
        || -> Parser<'a, JsonValue<'a>> { json_string_content().map(JsonValue::String) };

    // ── Array: hand-rolled loop inside a Parser for pre-allocated capacity ──

    let json_array = crate::lazy::lazy(|| {
        let value = json_value();
        let open = sp_string("[");
        let close = sp_string("]");
        let comma = sp_string(",").trim_whitespace();

        Parser::new(move |state: &mut ParserState<'a>| {
            open.call(state)?;
            crate::leaf::trim_leading_whitespace_mut(state);

            if close.call(state).is_some() {
                return Some(JsonValue::Array(Box::new(Vec::new())));
            }

            let mut items = Vec::with_capacity(4);
            loop {
                crate::leaf::trim_leading_whitespace_mut(state);
                items.push(value.call(state)?);
                crate::leaf::trim_leading_whitespace_mut(state);
                if comma.call(state).is_none() {
                    break;
                }
            }

            close.call(state)?;
            Some(JsonValue::Array(Box::new(items)))
        })
    });

    // ── Object: hand-rolled loop inside a Parser for pre-allocated capacity ──

    let json_object = crate::lazy::lazy(move || {
        let value = json_value();
        let key = json_string_content();
        let open = sp_string("{");
        let close = sp_string("}");
        let colon = sp_string(":").trim_whitespace();
        let comma = sp_string(",").trim_whitespace();

        Parser::new(move |state: &mut ParserState<'a>| {
            open.call(state)?;
            crate::leaf::trim_leading_whitespace_mut(state);

            if close.call(state).is_some() {
                return Some(JsonValue::Object(Box::new(Vec::new())));
            }

            let mut entries = Vec::with_capacity(4);
            loop {
                crate::leaf::trim_leading_whitespace_mut(state);
                let k = key.call(state)?;
                colon.call(state)?;
                let v = value.call(state)?;
                entries.push((k, v));
                crate::leaf::trim_leading_whitespace_mut(state);
                if comma.call(state).is_none() {
                    break;
                }
            }

            close.call(state)?;
            Some(JsonValue::Object(Box::new(entries)))
        })
    });

    // ── First-byte dispatch ───────────────────────────────────

    crate::leaf::dispatch_byte_multi(vec![
        (b"{" as &[u8], json_object),
        (b"[", json_array),
        (b"\"", json_string()),
        (b"t", json_true),
        (b"f", json_false),
        (b"n", json_null),
        (b"-0123456789", json_number()),
    ])
}

pub fn json_parser<'a>() -> Parser<'a, JsonValue<'a>> {
    json_value().trim_whitespace()
}
