// Generalized monolithic scanners — language-agnostic, no regex, no vtable.
//
// These are the canonical implementations. Language-specific modules
// (css/scan.rs, json.rs) re-export under domain-prefixed names.

use crate::state::{ParserState, Span};
use super::eisel_lemire::compute_f64;

// ── Number scanning core ──────────────────────────────────────────

/// Accumulated mantissa + metadata from scanning a decimal number string.
pub struct NumberParts {
    pub mantissa: u64,
    pub exponent: i32,
    pub negative: bool,
    pub n_digits: u32,
    /// True when no fractional or exponent part was present.
    pub is_integer: bool,
}

/// Configuration controlling which number syntax is accepted.
pub struct NumberConfig {
    /// Accept `+` as a leading sign.
    pub allow_plus_sign: bool,
    /// Accept `.5` (no digits before the decimal point).
    pub allow_leading_dot: bool,
    /// Reject `007`-style leading zeros (RFC 8259 rule).
    pub reject_leading_zero: bool,
}

pub const GENERIC_NUMBER_CONFIG: NumberConfig = NumberConfig {
    allow_plus_sign: true,
    allow_leading_dot: true,
    reject_leading_zero: false,
};

pub const JSON_NUMBER_CONFIG: NumberConfig = NumberConfig {
    allow_plus_sign: false,
    allow_leading_dot: false,
    reject_leading_zero: true,
};

/// Convert 8 ASCII digit bytes to a u64 in ~3 multiply-shift operations.
/// Ported from simdjson's `parse_eight_digits_unrolled`.
/// Caller must guarantee that `s` contains at least 8 ASCII digit bytes.
#[inline(always)]
pub fn parse_eight_digits(s: &[u8]) -> u64 {
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

/// Core number scanner: accumulates mantissa with 8-digit chunking.
///
/// Scans a number from `bytes[start..]` according to `cfg`, accumulating the
/// mantissa and tracking the decimal exponent in a single pass.
/// Returns `(parts, end_offset)` or `None` if no valid number found.
#[inline(always)]
pub fn scan_number_mantissa(
    bytes: &[u8],
    start: usize,
    cfg: &NumberConfig,
) -> Option<(NumberParts, usize)> {
    let len = bytes.len();
    let mut i = start;

    if i >= len {
        return None;
    }

    // ── Sign ──────────────────────────────────────────────────
    let mut neg = false;
    let b = unsafe { *bytes.get_unchecked(i) };
    if b == b'-' {
        neg = true;
        i += 1;
        if i >= len {
            return None;
        }
    } else if b == b'+' {
        if !cfg.allow_plus_sign {
            return None;
        }
        i += 1;
        if i >= len {
            return None;
        }
    }

    // ── Integer digits — accumulate mantissa ──────────────────
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

    // ── Leading-zero rejection ────────────────────────────────
    if cfg.reject_leading_zero && digit_count > 1 && unsafe { *bytes.get_unchecked(digit_start) } == b'0' {
        // `007` etc. — clamp to just the sign + `0`.
        i = digit_start + 1;
        return Some((
            NumberParts {
                mantissa: 0,
                exponent: 0,
                negative: neg,
                n_digits: 1,
                is_integer: true,
            },
            i,
        ));
    }

    // Track total significant digits and decimal exponent for Eisel-Lemire.
    let mut total_digits = digit_count;
    let mut decimal_exponent: i64 = 0;

    // ── Fractional part ───────────────────────────────────────
    let mut has_frac = false;
    // Gate: only enter the dot if we have pre-dot digits OR leading-dot is allowed.
    if i < len && unsafe { *bytes.get_unchecked(i) } == b'.'
        && (has_pre_dot_digits || cfg.allow_leading_dot)
    {
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

    // ── Exponent (e/E) ────────────────────────────────────────
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

    let is_integer = !has_frac && !has_exp;

    Some((
        NumberParts {
            mantissa,
            exponent: decimal_exponent as i32,
            negative: neg,
            n_digits: total_digits as u32,
            is_integer,
        },
        i,
    ))
}

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

// ── Identifier scanner ─────────────────────────────────────────

/// Scan an identifier: -?[a-zA-Z_][\w-]* | --[\w-]+
/// Handles plain idents, vendor-prefixed (-webkit-), and custom properties (--var).
/// Returns None if no ident at current offset.
#[inline(always)]
pub fn scan_ident<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    if start >= len {
        return None;
    }

    let mut i = start;
    let b0 = unsafe { *bytes.get_unchecked(i) };

    if b0 == b'-' {
        i += 1;
        if i >= len {
            return None;
        }
        let b1 = unsafe { *bytes.get_unchecked(i) };
        if b1 == b'-' {
            // Custom property: --[\w-]+
            i += 1;
            while i < len {
                let b = unsafe { *bytes.get_unchecked(i) };
                if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
                    i += 1;
                } else {
                    break;
                }
            }
            if i == start + 2 {
                return None; // just "--" with no continuation
            }
            state.offset = i;
            return Some(Span::new(start, i, state.src));
        }
        // -[a-zA-Z_]...
        if !(b1.is_ascii_alphabetic() || b1 == b'_') {
            return None;
        }
        i += 1;
    } else if b0.is_ascii_alphabetic() || b0 == b'_' {
        i += 1;
    } else {
        return None;
    }

    // Continue with [a-zA-Z0-9_-]*
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
            i += 1;
        } else {
            break;
        }
    }

    if i == start {
        return None;
    }
    state.offset = i;
    Some(Span::new(start, i, state.src))
}

// ── Whitespace + block comment scanner ──────────────────────────

/// Scan whitespace and block comments: (\s | /\*...\*/)*
/// Always succeeds (returns empty span if no ws/comments).
#[inline(always)]
pub fn scan_ws_block_comments<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;

    loop {
        // Skip ASCII whitespace
        while i < len {
            let b = unsafe { *bytes.get_unchecked(i) };
            if b == b' ' || b == b'\t' || b == b'\n' || b == b'\r' || b == 0x0C {
                i += 1;
            } else {
                break;
            }
        }

        // Check for block comment /*...*/
        if i + 1 < len
            && unsafe { *bytes.get_unchecked(i) } == b'/'
            && unsafe { *bytes.get_unchecked(i + 1) } == b'*'
        {
            i += 2;
            // Scan for */
            loop {
                match memchr::memchr(b'*', bytes.get(i..)?) {
                    None => {
                        // Unterminated comment — consume rest
                        i = len;
                        break;
                    }
                    Some(pos) => {
                        i += pos + 1;
                        if i < len && unsafe { *bytes.get_unchecked(i) } == b'/' {
                            i += 1;
                            break;
                        }
                    }
                }
            }
            continue; // Check for more ws/comments after this comment
        }

        break;
    }

    state.offset = i;
    Some(Span::new(start, i, state.src))
}

// ── Quoted string scanner ───────────────────────────────────────

/// Scan a quoted string: "..." or '...' with \-escapes.
/// Returns span including quote delimiters.
#[inline(always)]
pub fn scan_string_quoted<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    if start >= bytes.len() {
        return None;
    }

    let quote = unsafe { *bytes.get_unchecked(start) };
    if quote != b'"' && quote != b'\'' {
        return None;
    }

    let mut i = start + 1;
    loop {
        // SIMD scan for quote or backslash
        match memchr::memchr2(quote, b'\\', bytes.get(i..)?) {
            None => return None, // unterminated string
            Some(pos) => {
                i += pos;
                if unsafe { *bytes.get_unchecked(i) } == quote {
                    i += 1; // consume closing quote
                    state.offset = i;
                    return Some(Span::new(start, i, state.src));
                }
                // backslash: skip next byte
                i += 1;
                if i >= bytes.len() {
                    return None;
                }
                i += 1; // skip the escaped character
            }
        }
    }
}

// ── Block comment scanner ───────────────────────────────────────

/// Scan a block comment: /\*...\*/
/// Returns span including the delimiters.
#[inline(always)]
pub fn scan_block_comment<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();

    if start + 1 >= len {
        return None;
    }
    if unsafe { *bytes.get_unchecked(start) } != b'/'
        || unsafe { *bytes.get_unchecked(start + 1) } != b'*'
    {
        return None;
    }

    let mut i = start + 2;
    loop {
        match memchr::memchr(b'*', bytes.get(i..)?) {
            None => return None, // unterminated comment
            Some(pos) => {
                i += pos + 1;
                if i < len && unsafe { *bytes.get_unchecked(i) } == b'/' {
                    i += 1;
                    state.offset = i;
                    return Some(Span::new(start, i, state.src));
                }
            }
        }
    }
}

// ── Balanced delimiter scanner ──────────────────────────────────

/// Configuration for balanced structural scanning.
///
/// The union of `{open, close, quotes[..], terminators[..]}` forms the target
/// set for SIMD byte classification.  Must total ≤ 8 unique bytes.
pub struct BalancedScanConfig {
    /// Byte that increases nesting depth (e.g., `(` or `{`).
    pub open: u8,
    /// Byte that decreases nesting depth (e.g., `)` or `}`).
    pub close: u8,
    /// Quote bytes that toggle string-skipping mode (e.g., `"`, `'`).
    pub quotes: &'static [u8],
    /// Escape byte inside quotes (e.g., `\`).
    pub escape: u8,
    /// Bytes that terminate scanning at depth 0 (e.g., `;`, `{`, `}`).
    pub terminators: &'static [u8],
}

/// Scan forward to find a depth-0 terminator, respecting nesting and quotes.
/// Returns offset of the terminator (relative to start of `bytes`).
///
/// Uses SIMD (nibble LUT + `swizzle_dyn`) to skip data bytes between structural
/// characters, and `memchr2` for SIMD-accelerated string skipping.
#[inline(always)]
pub fn scan_balanced(bytes: &[u8], config: &BalancedScanConfig) -> usize {
    use crate::scanners::{build_nibble_luts, find_first_of_nibble_lut};

    // Pre-build nibble LUTs for all structural bytes (done once per call).
    let mut structural = [0u8; 8];
    let mut n = 0;
    structural[n] = config.open;
    n += 1;
    structural[n] = config.close;
    n += 1;
    for &q in config.quotes {
        structural[n] = q;
        n += 1;
    }
    for &t in config.terminators {
        structural[n] = t;
        n += 1;
    }
    debug_assert!(n <= 8, "scan_balanced: too many structural bytes for nibble LUT");
    let (lo_lut, hi_lut) = build_nibble_luts(&structural[..n]);

    let len = bytes.len();
    let mut i = 0;
    let mut depth: u32 = 0;

    while i < len {
        // SIMD: skip data bytes, find next structural byte
        match find_first_of_nibble_lut(&bytes[i..], &lo_lut, &hi_lut) {
            None => return len,
            Some((pos, b)) => {
                i += pos;
                if b == config.open {
                    depth += 1;
                    i += 1;
                } else if b == config.close {
                    if depth > 0 {
                        depth -= 1;
                    }
                    i += 1;
                } else if config.quotes.contains(&b) {
                    // Skip quoted string — memchr2 for SIMD-accelerated scanning
                    i += 1;
                    loop {
                        match bytes.get(i..) {
                            Some(rem) if !rem.is_empty() => {
                                match memchr::memchr2(b, config.escape, rem) {
                                    None => {
                                        i = len;
                                        break;
                                    }
                                    Some(p) => {
                                        i += p;
                                        if unsafe { *bytes.get_unchecked(i) } == b {
                                            i += 1;
                                            break;
                                        }
                                        // Escape: skip next byte
                                        i += 2;
                                        if i >= len {
                                            i = len;
                                            break;
                                        }
                                    }
                                }
                            }
                            _ => {
                                i = len;
                                break;
                            }
                        }
                    }
                } else {
                    // Terminator byte
                    if depth == 0 {
                        return i;
                    }
                    i += 1;
                }
            }
        }
    }

    len
}

/// CSS-specific balanced scanner: tracks `()` nesting, skips `""`/`''` strings,
/// terminates at depth-0 `;`, `{`, or `}`.
#[inline(always)]
pub fn scan_balanced_end(bytes: &[u8]) -> usize {
    static CSS_CONFIG: BalancedScanConfig = BalancedScanConfig {
        open: b'(',
        close: b')',
        quotes: &[b'"', b'\''],
        escape: b'\\',
        terminators: &[b';', b'{', b'}'],
    };
    scan_balanced(bytes, &CSS_CONFIG)
}
