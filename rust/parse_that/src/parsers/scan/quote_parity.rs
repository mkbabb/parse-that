//! SIMD quote-parity filtering via prefix-xor.
//!
//! Computes, for every byte in an input, whether the byte lies inside
//! a double-quoted string region. The answer is a single bit per byte;
//! produced by the simdjson "unescaped quote parity" trick — a
//! carry-less multiply (equivalently, a mod-2 prefix sum) over the
//! bitmask of unescaped `"` positions.
//!
//! ## Algorithm (simdjson §3.1.4)
//!
//! For each 64-byte stripe:
//!
//!     quote_bits     = bitmask of byte == b'"'
//!     bs_bits        = bitmask of byte == b'\\'
//!     real_quotes    = quote_bits & !escaped(bs_bits, carry_bs)
//!     in_string[i]   = prev_instring ^ parity(real_quotes[0..=i])
//!
//! The prefix-parity of the real-quote bitmask (XORed with the
//! previous stripe's in-string flag) names, bit-for-bit, the bytes
//! that sit inside a quoted region. A closing `"` toggles the flag;
//! an opening `"` does the same; everything between is flagged.
//!
//! On x86-64 we realise `prefix_xor` via `_mm_clmulepi64_si128(mask,
//! 0xFFFF_FFFF_FFFF_FFFF, 0)` — a carry-less multiply whose low
//! 64-bit lane contains the running-XOR of `mask`. On aarch64 the
//! corresponding intrinsic is `vmull_p64`. On platforms lacking
//! pclmul / pmull we fall back to the inlined bit-twiddle identity
//! `x ^= x << 1; x ^= x << 2; … x ^= x << 32;`, which is five shifts
//! and xors — still branchless, no per-byte work, O(1) per stripe.

use crate::state::PaddedView;
use super::quoted_simd::odd_parity_backslashes;

const STRIPE: usize = 64;

/// Compute the prefix-XOR of `mask`: bit `i` of the result is the
/// XOR of bits `0..=i` of the input. Equivalent to a carry-less
/// multiply of `mask` by the all-ones constant, low 64 bits.
#[doc(hidden)]
#[inline(always)]
pub fn prefix_xor(mask: u64) -> u64 {
    #[cfg(all(target_arch = "x86_64", target_feature = "pclmulqdq"))]
    unsafe {
        use std::arch::x86_64::*;
        let a = _mm_set_epi64x(0, mask as i64);
        let b = _mm_set_epi64x(0, -1i64);
        let result = _mm_clmulepi64_si128(a, b, 0x00);
        return _mm_cvtsi128_si64(result) as u64;
    }

    #[cfg(all(target_arch = "aarch64", target_feature = "aes"))]
    unsafe {
        use std::arch::aarch64::*;
        let result = vmull_p64(mask, u64::MAX);
        return vgetq_lane_u64(vreinterpretq_u64_p128(result), 0);
    }

    #[allow(unreachable_code)]
    {
        let mut x = mask;
        x ^= x << 1;
        x ^= x << 2;
        x ^= x << 4;
        x ^= x << 8;
        x ^= x << 16;
        x ^= x << 32;
        x
    }
}

#[inline(always)]
fn classify_stripe_64(bytes: &[u8], offset: usize) -> (u64, u64) {
    use std::simd::prelude::*;

    let mut quote = 0u64;
    let mut bs = 0u64;
    for k in 0..4 {
        let chunk = u8x16::from_slice(unsafe {
            bytes.get_unchecked(offset + k * 16..offset + k * 16 + 16)
        });
        let q = chunk.simd_eq(u8x16::splat(b'"')).to_bitmask() as u64;
        let b = chunk.simd_eq(u8x16::splat(b'\\')).to_bitmask() as u64;
        quote |= q << (k * 16);
        bs |= b << (k * 16);
    }
    (quote, bs)
}

#[inline(always)]
fn escape_mask_64(bs_bits: u64, carry_bs: &mut u64) -> u64 {
    let mut escaped = 0u64;
    let mut carry = *carry_bs;
    for k in 0..4 {
        let lane = ((bs_bits >> (k * 16)) & 0xFFFF) as u32;
        let c32 = carry as u32;
        let odd = odd_parity_backslashes(lane, c32);
        let esc = ((odd << 1) | c32) & 0xFFFF;
        escaped |= (esc as u64) << (k * 16);
        carry = ((odd >> 15) & 1) as u64;
    }
    *carry_bs = carry;
    escaped
}

/// For each 64-byte stripe of the public input, invoke
/// `f(offset, in_string, real_quotes)` where:
///
/// * `offset` is the byte position of the stripe's first byte,
/// * `in_string` is a 64-bit mask; bit `i` is 1 iff byte `offset+i`
///   lies inside a double-quoted region,
/// * `real_quotes` is a 64-bit mask of unescaped `"` positions
///   within the stripe (bit `i` at `offset + i`).
///
/// Consumes the [`PaddedView`] witness: the backing buffer's trailing
/// [`crate::state::INPUT_PAD_BYTES`] bytes are NUL, so every 64-byte
/// stripe load lands inside the allocation without a per-stripe tail
/// guard. The public stripe count is
/// `(view.len() + STRIPE - 1) / STRIPE`; the final stripe may straddle
/// the public end, with NUL-padded positions masked out of the
/// `in_string` / `real_quotes` payload handed to `f`.
#[inline]
pub fn compute_in_string_bitmap<F>(view: PaddedView<'_>, mut f: F)
where
    F: FnMut(usize, u64, u64),
{
    let bytes = view.bytes();
    let len = view.len();
    let mut offset = 0;
    let mut prev_instring: u64 = 0;
    let mut carry_bs: u64 = 0;

    // Walk every full-stripe window that lies entirely inside the
    // public input.
    while offset + STRIPE <= len {
        let (quote_bits, bs_bits) = classify_stripe_64(bytes, offset);
        let escaped = escape_mask_64(bs_bits, &mut carry_bs);
        let real_quotes = quote_bits & !escaped;

        let in_string = prefix_xor(real_quotes) ^ prev_instring;

        f(offset, in_string, real_quotes);

        prev_instring = if (in_string >> 63) & 1 == 1 { !0u64 } else { 0u64 };
        offset += STRIPE;
    }

    // Straddling-tail stripe: the SIMD classify reads a full 64-byte
    // window thanks to the padded-view invariant, but only the first
    // `tail_len` bits belong to the public input — mask the rest
    // before computing in-string state.
    if offset < len {
        let tail_len = len - offset;
        let (quote_bits, bs_bits) = classify_stripe_64(bytes, offset);
        let escaped = escape_mask_64(bs_bits, &mut carry_bs);
        let valid_mask = if tail_len >= 64 {
            !0u64
        } else {
            (1u64 << tail_len) - 1
        };
        let real_quotes = quote_bits & !escaped & valid_mask;
        let in_string = (prefix_xor(real_quotes) ^ prev_instring) & valid_mask;
        f(offset, in_string, real_quotes);
    }
}

/// Remove structural positions that fall inside quoted strings.
///
/// Replaces the deleted AO.0.3 scalar `filter_quote_parity` —
/// O(input × quotes) scalar backwards-backslash scan becomes
/// O(input / 64 + positions) SIMD stripe scan.
pub fn filter_quote_parity(view: PaddedView<'_>, positions: &mut Vec<u32>) {
    if positions.is_empty() {
        return;
    }

    let input = view.bytes();
    let len = view.len();
    let nwords = (len + 63) / 64;
    let mut in_string_map = vec![0u64; nwords];

    compute_in_string_bitmap(view, |offset, in_string, _real_quotes| {
        in_string_map[offset / 64] = in_string;
    });

    let mut write = 0;
    for read in 0..positions.len() {
        let pos = positions[read] as usize;
        if pos >= len {
            positions[write] = positions[read];
            write += 1;
            continue;
        }
        let byte = unsafe { *input.get_unchecked(pos) };
        let word = in_string_map[pos / 64];
        let bit = (word >> (pos % 64)) & 1;

        if byte == b'"' {
            positions[write] = positions[read];
            write += 1;
        } else if bit == 0 {
            positions[write] = positions[read];
            write += 1;
        }
    }
    positions.truncate(write);
}

