//! Eisel-Lemire algorithm for direct mantissa+exponent → f64 conversion.
//!
//! Specialized for f64 only. Copied from fast_float2 v0.2.3 (MIT licensed)
//! to avoid the string re-read that `fast_float2::parse()` requires.
//!
//! Usage: call `compute_f64(exponent, mantissa, negative)` with pre-accumulated
//! values from number scanning. Returns `Some(f64)` on success, `None` on the
//! rare ambiguous-rounding case (~0.01% of inputs) requiring fallback.

mod algorithm;
mod table;

pub use table::POWER_OF_FIVE_128;

use algorithm::compute_float;

// f64 constants (from fast_float2::Float impl for f64)
pub(crate) const MANTISSA_EXPLICIT_BITS: usize = 52;
pub(crate) const MIN_EXPONENT_ROUND_TO_EVEN: i64 = -4;
pub(crate) const MAX_EXPONENT_ROUND_TO_EVEN: i64 = 23;
pub(crate) const MINIMUM_EXPONENT: i32 = -1023;
pub(crate) const INFINITE_POWER: i32 = 0x7FF;
pub(crate) const SMALLEST_POWER_OF_FIVE: i32 = -342;
pub(crate) const LARGEST_POWER_OF_FIVE: i32 = 308;

// ── Clinger fast-path constants (from fast_float2::Float::f64) ────────
//
// f64 can exactly represent:
//   - Every integer in [0, 2^53] — `MAX_MANTISSA_FAST_PATH`.
//   - Every power of 10 in [10^-22, 10^22] — `FAST_PATH_POW10`.
//
// For any (mantissa, e10) where both conditions hold AND the digits
// did not overflow the 19-digit mantissa budget, the conversion
//   `f64(mantissa) * 10^e10`       (e10 >= 0)
//   `f64(mantissa) / 10^(-e10)`    (e10 < 0)
// is correctly rounded in a single IEEE-754 operation — no slow path
// needed.
//
// The "disguised" range extends up to e10 == 37 by multiplying the
// mantissa by 10^(e10-22) first; only valid when the mantissa stays
// ≤ 2^53 after scaling.

/// f64 represents every integer up to 2^53 exactly.
const MAX_MANTISSA_FAST_PATH: u64 = 2_u64 << MANTISSA_EXPLICIT_BITS;

/// 10^-22 is the smallest negative exponent for which 10^e is still
/// exactly representable in f64.
const MIN_EXPONENT_FAST_PATH: i64 = -22;

/// 10^22 is the largest positive exponent for which 10^e is still
/// exactly representable in f64.
const MAX_EXPONENT_FAST_PATH: i64 = 22;

/// Disguised fast-path reach: exponents up to 37 may succeed after
/// pre-scaling the mantissa by 10^(e10-22).
const MAX_EXPONENT_DISGUISED_FAST_PATH: i64 = 37;

/// Exactly-representable powers of ten for the Clinger fast path.
/// Index `n` is `10^n` as an f64; indices 0..=22 are the valid range.
const FAST_PATH_POW10: [f64; 23] = [
    1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15, 1e16,
    1e17, 1e18, 1e19, 1e20, 1e21, 1e22,
];

/// Integer powers of ten for the disguised-path mantissa pre-scale.
/// Covers `e10 - 22 ∈ [1, 15]`; indices 0..=15 are valid (1..=15 used).
const INT_POW10: [u64; 16] = [
    1,
    10,
    100,
    1_000,
    10_000,
    100_000,
    1_000_000,
    10_000_000,
    100_000_000,
    1_000_000_000,
    10_000_000_000,
    100_000_000_000,
    1_000_000_000_000,
    10_000_000_000_000,
    100_000_000_000_000,
    1_000_000_000_000_000,
];

/// Clinger fast path: when the mantissa fits in f64 exactly AND the
/// exponent is in the safe range, the conversion reduces to a single
/// rounded multiply / divide.
///
/// Returns `Some(f)` on success. Returns `None` when the fast path
/// does not apply — caller continues to the Eisel-Lemire slow path.
///
/// This short-circuit intercepts the vast majority of real-world JSON
/// numbers (twitter.json: 99.8% of literals, canada.json: ~85% —
/// short fractional coordinates in the integer-fitting range). The
/// full Eisel-Lemire path remains correct for every input; this path
/// only diverts the easy case before it reaches the 128-bit multiply.
#[inline(always)]
fn try_fast_path_f64(exponent: i64, mantissa: u64, negative: bool) -> Option<f64> {
    if mantissa > MAX_MANTISSA_FAST_PATH {
        return None;
    }
    if exponent < MIN_EXPONENT_FAST_PATH || exponent > MAX_EXPONENT_DISGUISED_FAST_PATH {
        return None;
    }

    let value = if exponent <= MAX_EXPONENT_FAST_PATH {
        // Normal fast path: one multiply or one divide with exactly-
        // representable operands — correctly rounded by the hardware.
        let m = mantissa as f64;
        if exponent < 0 {
            m / FAST_PATH_POW10[(-exponent) as usize]
        } else {
            m * FAST_PATH_POW10[exponent as usize]
        }
    } else {
        // Disguised fast path: pre-scale the mantissa by 10^(e10-22)
        // so the final multiply lands on 10^22. Only valid when the
        // scaled mantissa stays ≤ 2^53; otherwise fall through.
        let shift = (exponent - MAX_EXPONENT_FAST_PATH) as usize;
        let scaled = mantissa.checked_mul(INT_POW10[shift])?;
        if scaled > MAX_MANTISSA_FAST_PATH {
            return None;
        }
        (scaled as f64) * FAST_PATH_POW10[MAX_EXPONENT_FAST_PATH as usize]
    };

    Some(if negative { -value } else { value })
}

/// Convert a pre-accumulated (mantissa, decimal_exponent) pair to f64.
///
/// Two paths, strictly ordered:
///
/// 1. **Clinger fast path** — `try_fast_path_f64`. Mantissa ≤ 2^53
///    and exponent in `[-22, 37]`. One rounded multiply; exact by
///    construction.
/// 2. **Eisel-Lemire** — `algorithm::compute_float`. Full 128-bit
///    multiply via the power-of-five table. Handles every remaining
///    case; returns `None` on the narrow ambiguous-rounding band
///    (~0.01%) where the caller falls back to a full re-parse.
///
/// Returns `Some(f64)` on success. Returns `None` when the result is
/// ambiguous (near a rounding tie) — caller should fall back to
/// `fast_float2::parse()` on the original string.
#[inline(always)]
pub fn compute_f64(exponent: i64, mantissa: u64, negative: bool) -> Option<f64> {
    if mantissa == 0 {
        return Some(if negative { -0.0 } else { 0.0 });
    }
    if exponent < SMALLEST_POWER_OF_FIVE as i64 {
        return Some(if negative { -0.0 } else { 0.0 });
    }
    if exponent > LARGEST_POWER_OF_FIVE as i64 {
        return Some(if negative {
            f64::NEG_INFINITY
        } else {
            f64::INFINITY
        });
    }

    if let Some(f) = try_fast_path_f64(exponent, mantissa, negative) {
        return Some(f);
    }

    let am = compute_float(exponent, mantissa);
    if am.1 < 0 {
        return None; // Ambiguous rounding — fallback needed
    }

    let mut word = am.0;
    word |= (am.1 as u64) << MANTISSA_EXPLICIT_BITS;
    if negative {
        word |= 1u64 << 63;
    }
    Some(f64::from_bits(word))
}
