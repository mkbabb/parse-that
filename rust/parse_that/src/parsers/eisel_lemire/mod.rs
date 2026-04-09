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

/// Convert a pre-accumulated (mantissa, decimal_exponent) pair to f64.
///
/// Returns `Some(f64)` on success. Returns `None` when the result is ambiguous
/// (near a rounding tie, ~0.01% of inputs) — caller should fall back to
/// `fast_float2::parse()` on the original string.
#[inline]
pub fn compute_f64(exponent: i64, mantissa: u64, negative: bool) -> Option<f64> {
    if mantissa == 0 {
        return Some(if negative { -0.0 } else { 0.0 });
    }
    if exponent < SMALLEST_POWER_OF_FIVE as i64 {
        return Some(if negative { -0.0 } else { 0.0 });
    }
    if exponent > LARGEST_POWER_OF_FIVE as i64 {
        return Some(if negative { f64::NEG_INFINITY } else { f64::INFINITY });
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
