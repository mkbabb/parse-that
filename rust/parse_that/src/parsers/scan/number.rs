// Number scanning core — mantissa accumulation + config.
//
// Pure digit/mantissa scanning. f64 conversion lives in `number_f64.rs`.

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
