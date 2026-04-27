// SIMD-accelerated digit accumulation for the number scanner.
//
// Converts up to 16 ASCII digit bytes into a u64 mantissa value in
// parallel using platform-specific SIMD intrinsics. Falls back to
// the scalar `parse_eight_digits` path on unsupported platforms.
//
// Architecture coverage:
//   - aarch64: NEON (always available on Apple Silicon + aarch64 Linux)
//   - x86_64:  SSE4.2 with runtime feature detection
//   - fallback: scalar 8-digit chunking

use crate::state::PaddedView;

/// Result of a SIMD digit scan: the accumulated u64 value and how many
/// consecutive ASCII digit bytes were consumed (0..=16).
#[derive(Debug, Clone, Copy)]
pub struct SimdDigitResult {
    pub value: u64,
    pub count: u32,
}

/// Count how many of the first 16 bytes at `ptr` are leading ASCII digits.
///
/// Returns 0..=16 using NEON comparison + bit-packing.
///
/// The standard NEON "movemask" equivalent packs one bit per byte into a
/// u16 by shifting each byte's sign bit into place and summing. This
/// produces a 16-bit mask where bit `i` corresponds to byte `i`.
#[cfg(target_arch = "aarch64")]
#[inline(always)]
unsafe fn count_leading_digits_neon(ptr: *const u8) -> u32 {
    use core::arch::aarch64::*;

    unsafe {
        let chunk = vld1q_u8(ptr);
        // Subtract '0': digits become 0..9, bytes < '0' wrap to large values.
        let adjusted = vsubq_u8(chunk, vdupq_n_u8(b'0'));
        // Compare > 9 (unsigned): non-digit lanes become 0xFF.
        let non_digit = vcgtq_u8(adjusted, vdupq_n_u8(9));

        // Pack one bit per lane into a u16 bitmask.
        // Weight vector: byte i gets weight 2^i.
        let bit_weights: [u8; 8] = [1, 2, 4, 8, 16, 32, 64, 128];
        let weights = vld1_u8(bit_weights.as_ptr());

        let lo = vget_low_u8(non_digit);
        let hi = vget_high_u8(non_digit);

        // AND with weights: non-digit lanes keep their weight, digit lanes become 0.
        let lo_masked = vand_u8(lo, weights);
        let hi_masked = vand_u8(hi, weights);

        // Horizontal add across all 8 bytes → single sum.
        let lo_sum = vaddv_u8(lo_masked) as u16;
        let hi_sum = vaddv_u8(hi_masked) as u16;

        let mask = lo_sum | (hi_sum << 8);

        if mask == 0 {
            16
        } else {
            mask.trailing_zeros()
        }
    }
}

/// Accumulate `count` ASCII digit bytes (already validated) into a u64
/// using NEON multiply-add chains.
///
/// `count` must be 1..=16 and the first `count` bytes at `ptr` must be
/// ASCII digits.
#[cfg(target_arch = "aarch64")]
#[inline(always)]
unsafe fn accumulate_digits_neon(ptr: *const u8, count: u32) -> u64 {
    debug_assert!(count >= 1 && count <= 16);

    if count == 16 {
        // Full stripe — two 8-digit SWAR folds. Each
        // `parse_eight_digits` is three multiply-shift operations.
        let hi = unsafe {
            super::parse_eight_digits(core::slice::from_raw_parts(ptr, 8))
        };
        let lo = unsafe {
            super::parse_eight_digits(core::slice::from_raw_parts(ptr.add(8), 8))
        };
        hi * 100_000_000 + lo
    } else if count <= 8 {
        // Short run — byte-by-byte. Each scalar step is 2 ops
        // (multiply + add); avoids the classification overhead of a
        // partial SWAR fold.
        let mut val: u64 = 0;
        for j in 0..count {
            unsafe {
                val = val * 10 + (*ptr.add(j as usize) - b'0') as u64;
            }
        }
        val
    } else {
        // 9..=15 digits — one 8-digit SWAR fold + scalar tail.
        let hi = unsafe {
            super::parse_eight_digits(core::slice::from_raw_parts(ptr, 8))
        };
        let mut lo: u64 = 0;
        let tail = count - 8;
        for j in 0..tail {
            unsafe {
                lo = lo * 10 + (*ptr.add(8 + j as usize) - b'0') as u64;
            }
        }
        hi * POW10[tail as usize] + lo
    }
}

/// Try to scan up to 16 leading ASCII digit bytes from
/// `view.bytes()[offset..]` using NEON intrinsics. Returns the
/// accumulated value and digit count.
///
/// The [`PaddedView`] witness carries the 64-byte-tail guarantee at
/// the type level; the kernel loads a full 16-byte NEON register at
/// `offset` without a per-call `remaining < 16` tail guard. Positions
/// beyond `view.len()` read the NUL-padded region, which always
/// classifies as non-digit, so the leading-digit count naturally
/// clamps to the number of real input digits.
///
/// Returns `None` when the first byte is not a digit.
#[cfg(target_arch = "aarch64")]
#[inline(always)]
pub fn scan_digits_simd(
    view: PaddedView<'_>,
    offset: usize,
) -> Option<SimdDigitResult> {
    let bytes = view.bytes();
    debug_assert!(
        offset + 16 <= bytes.len(),
        "scan_digits_simd: offset {} + 16 exceeds padded buffer len {}",
        offset,
        bytes.len(),
    );

    unsafe {
        let ptr = bytes.as_ptr().add(offset);
        let count = count_leading_digits_neon(ptr);
        if count == 0 {
            return None;
        }
        let value = accumulate_digits_neon(ptr, count);
        Some(SimdDigitResult { value, count })
    }
}

// ── x86_64 SSE4.2 implementation ──────────────────────────────────────

/// Count leading ASCII digit bytes in a 16-byte chunk using SSE.
///
/// A byte is a digit iff it is in `['0', '9']`, i.e., `byte >= 0x30`
/// AND `byte <= 0x39`. We check both conditions with unsigned compares
/// (emulated via `_mm_max_epu8` / `_mm_min_epu8` + `_mm_cmpeq_epi8`).
#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "sse4.2")]
#[inline]
unsafe fn count_leading_digits_sse(ptr: *const u8) -> u32 {
    use core::arch::x86_64::*;

    unsafe {
        let chunk = _mm_loadu_si128(ptr as *const __m128i);
        let ascii_zero = _mm_set1_epi8(b'0' as i8);
        let ascii_nine = _mm_set1_epi8(b'9' as i8);

        // Clamp to range and check identity:
        //   clamped = max(min(chunk, '9'), '0')
        //   is_digit = (clamped == chunk)
        let clamped = _mm_max_epu8(_mm_min_epu8(chunk, ascii_nine), ascii_zero);
        let is_digit = _mm_cmpeq_epi8(clamped, chunk);
        // Invert to get non-digit mask for movemask.
        let is_non_digit = _mm_andnot_si128(is_digit, _mm_set1_epi8(-1));
        let mask = _mm_movemask_epi8(is_non_digit) as u32;

        if mask == 0 {
            16
        } else {
            mask.trailing_zeros()
        }
    }
}

/// Accumulate `count` validated ASCII digit bytes into u64 using SSE
/// multiply-add for the full 16-digit case, scalar fallback otherwise.
#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "sse4.2")]
#[inline]
unsafe fn accumulate_digits_sse(ptr: *const u8, count: u32) -> u64 {
    debug_assert!(count >= 1 && count <= 16);

    if count == 16 {
        // Full stripe — two 8-digit SWAR folds.
        let hi = unsafe {
            super::parse_eight_digits(core::slice::from_raw_parts(ptr, 8))
        };
        let lo = unsafe {
            super::parse_eight_digits(core::slice::from_raw_parts(ptr.add(8), 8))
        };
        hi * 100_000_000 + lo
    } else if count <= 8 {
        let mut val: u64 = 0;
        for j in 0..count {
            unsafe {
                val = val * 10 + (*ptr.add(j as usize) - b'0') as u64;
            }
        }
        val
    } else {
        let hi = unsafe {
            super::parse_eight_digits(core::slice::from_raw_parts(ptr, 8))
        };
        let mut lo: u64 = 0;
        let tail = count - 8;
        for j in 0..tail {
            unsafe {
                lo = lo * 10 + (*ptr.add(8 + j as usize) - b'0') as u64;
            }
        }
        hi * POW10[tail as usize] + lo
    }
}

/// Try to scan up to 16 leading ASCII digit bytes from
/// `view.bytes()[offset..]` using SSE4.2 intrinsics. Returns the
/// accumulated value and digit count.
///
/// The [`PaddedView`] witness carries the 64-byte-tail guarantee at
/// the type level; the kernel loads a full 16-byte XMM register at
/// `offset` without a per-call `remaining < 16` tail guard.
#[cfg(target_arch = "x86_64")]
#[inline(always)]
pub fn scan_digits_simd(
    view: PaddedView<'_>,
    offset: usize,
) -> Option<SimdDigitResult> {
    let bytes = view.bytes();
    debug_assert!(
        offset + 16 <= bytes.len(),
        "scan_digits_simd: offset {} + 16 exceeds padded buffer len {}",
        offset,
        bytes.len(),
    );

    // Runtime feature detection for SSE4.2.
    if !is_x86_feature_detected!("sse4.2") {
        return None;
    }

    unsafe {
        let ptr = bytes.as_ptr().add(offset);
        let count = count_leading_digits_sse(ptr);
        if count == 0 {
            return None;
        }
        let value = accumulate_digits_sse(ptr, count);
        Some(SimdDigitResult { value, count })
    }
}

// ── Fallback for unsupported architectures ────────────────────────────

#[cfg(not(any(target_arch = "aarch64", target_arch = "x86_64")))]
#[inline(always)]
pub fn scan_digits_simd(
    _view: PaddedView<'_>,
    _offset: usize,
) -> Option<SimdDigitResult> {
    None
}

// ── Shared power-of-10 table ──────────────────────────────────────────

/// Powers of 10 for combining two digit groups: `POW10[n] = 10^n`.
/// Index range: 0..=16 covers all digit-group combination widths.
pub static POW10: [u64; 17] = [
    1,                   // 10^0
    10,                  // 10^1
    100,                 // 10^2
    1_000,               // 10^3
    10_000,              // 10^4
    100_000,             // 10^5
    1_000_000,           // 10^6
    10_000_000,          // 10^7
    100_000_000,         // 10^8
    1_000_000_000,       // 10^9
    10_000_000_000,      // 10^10
    100_000_000_000,     // 10^11
    1_000_000_000_000,   // 10^12
    10_000_000_000_000,  // 10^13
    100_000_000_000_000, // 10^14
    1_000_000_000_000_000, // 10^15
    10_000_000_000_000_000, // 10^16
];
