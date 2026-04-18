//! Core Eisel-Lemire computation (from fast_float2::binary).
//!
//! Turns a decimal `(exponent, mantissa)` pair into an `(f64_mantissa, power2)`
//! pair, signalling ambiguous rounding via `power2 == -1`.

use super::table::POWER_OF_FIVE_128;
use super::{
    INFINITE_POWER, LARGEST_POWER_OF_FIVE, MANTISSA_EXPLICIT_BITS,
    MAX_EXPONENT_ROUND_TO_EVEN, MIN_EXPONENT_ROUND_TO_EVEN, MINIMUM_EXPONENT,
    SMALLEST_POWER_OF_FIVE,
};

/// Returns (mantissa, power2). power2 == -1 means ambiguous.
#[inline(always)]
pub(super) fn compute_float(q: i64, mut w: u64) -> (u64, i32) {
    if w == 0 || q < SMALLEST_POWER_OF_FIVE as i64 {
        return (0, 0);
    }
    if q > LARGEST_POWER_OF_FIVE as i64 {
        return (0, INFINITE_POWER);
    }
    let lz = w.leading_zeros();
    w <<= lz;
    let (lo, hi) = compute_product_approx(q, w, MANTISSA_EXPLICIT_BITS + 3);
    if lo == 0xFFFF_FFFF_FFFF_FFFF {
        let inside_safe_exponent = (-27..=55).contains(&q);
        if !inside_safe_exponent {
            return (0, -1); // ambiguous
        }
    }
    let upperbit = (hi >> 63) as i32;
    let mut mantissa = hi >> (upperbit + 64 - MANTISSA_EXPLICIT_BITS as i32 - 3);
    let mut power2 = power(q as i32) + upperbit - lz as i32 - MINIMUM_EXPONENT;
    if power2 <= 0 {
        if -power2 + 1 >= 64 {
            return (0, 0);
        }
        mantissa >>= -power2 + 1;
        mantissa += mantissa & 1;
        mantissa >>= 1;
        power2 = (mantissa >= (1_u64 << MANTISSA_EXPLICIT_BITS)) as i32;
        return (mantissa, power2);
    }
    if lo <= 1
        && q >= MIN_EXPONENT_ROUND_TO_EVEN
        && q <= MAX_EXPONENT_ROUND_TO_EVEN
        && mantissa & 3 == 1
        && (mantissa << (upperbit + 64 - MANTISSA_EXPLICIT_BITS as i32 - 3)) == hi
    {
        mantissa &= !1_u64;
    }
    mantissa += mantissa & 1;
    mantissa >>= 1;
    if mantissa >= (2_u64 << MANTISSA_EXPLICIT_BITS) {
        mantissa = 1_u64 << MANTISSA_EXPLICIT_BITS;
        power2 += 1;
    }
    mantissa &= !(1_u64 << MANTISSA_EXPLICIT_BITS);
    if power2 >= INFINITE_POWER {
        return (0, INFINITE_POWER);
    }
    (mantissa, power2)
}

#[inline(always)]
fn power(q: i32) -> i32 {
    (q.wrapping_mul(152_170 + 65536) >> 16) + 63
}

#[inline(always)]
fn full_multiplication(a: u64, b: u64) -> (u64, u64) {
    let r = (a as u128) * (b as u128);
    (r as u64, (r >> 64) as u64)
}

#[inline(always)]
fn compute_product_approx(q: i64, w: u64, precision: usize) -> (u64, u64) {
    let mask = if precision < 64 {
        0xFFFF_FFFF_FFFF_FFFF_u64 >> precision
    } else {
        0xFFFF_FFFF_FFFF_FFFF_u64
    };
    let index = (q - SMALLEST_POWER_OF_FIVE as i64) as usize;
    let (lo5, hi5) = POWER_OF_FIVE_128[index];
    let (mut first_lo, mut first_hi) = full_multiplication(w, lo5);
    if first_hi & mask == mask {
        let (_, second_hi) = full_multiplication(w, hi5);
        first_lo = first_lo.wrapping_add(second_hi);
        if second_hi > first_lo {
            first_hi += 1;
        }
    }
    (first_lo, first_hi)
}
