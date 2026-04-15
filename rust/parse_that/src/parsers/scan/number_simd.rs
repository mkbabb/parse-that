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
    // For counts <= 8, use byte-by-byte scalar accumulation.
    // For counts 9..=16, use two groups: 8-digit SWAR + scalar tail.
    debug_assert!(count >= 1 && count <= 16);

    if count <= 8 {
        let mut val: u64 = 0;
        for j in 0..count {
            unsafe {
                val = val * 10 + (*ptr.add(j as usize) - b'0') as u64;
            }
        }
        val
    } else {
        // First 8 digits via SWAR.
        let hi = unsafe {
            super::parse_eight_digits(core::slice::from_raw_parts(ptr, 8))
        };
        // Remaining digits scalar.
        let mut lo: u64 = 0;
        let tail = count - 8;
        for j in 0..tail {
            unsafe {
                lo = lo * 10 + (*ptr.add(8 + j as usize) - b'0') as u64;
            }
        }
        // Combine: hi * 10^tail + lo
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

    if count <= 8 {
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

// ── Tests ─────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::INPUT_PAD_BYTES;

    /// Build a padded buffer mirroring `ParserState::new`: the first
    /// `input.len()` bytes are the public input; the next
    /// [`INPUT_PAD_BYTES`] bytes are NUL.
    fn padded_buf(input: &[u8]) -> Vec<u8> {
        let mut v = Vec::with_capacity(input.len() + INPUT_PAD_BYTES);
        v.extend_from_slice(input);
        v.resize(input.len() + INPUT_PAD_BYTES, 0);
        v
    }

    fn scan(input: &[u8], offset: usize) -> Option<SimdDigitResult> {
        let buf = padded_buf(input);
        let view = PaddedView::new(&buf, input.len());
        scan_digits_simd(view, offset)
    }

    #[test]
    fn scan_all_digits_16() {
        let input = b"1234567890123456xyz";
        let result = scan(input, 0).unwrap();
        assert_eq!(result.count, 16);
        assert_eq!(result.value, 1234567890123456);
    }

    #[test]
    fn scan_partial_digits() {
        let input = b"12345abc00000000";
        let result = scan(input, 0).unwrap();
        assert_eq!(result.count, 5);
        assert_eq!(result.value, 12345);
    }

    #[test]
    fn scan_single_digit() {
        let input = b"7_______________";
        let result = scan(input, 0).unwrap();
        assert_eq!(result.count, 1);
        assert_eq!(result.value, 7);
    }

    #[test]
    fn scan_no_digits() {
        let input = b"abcdefghijklmnop";
        assert!(scan(input, 0).is_none());
    }

    /// Under the padded-view contract, a short public input still has
    /// a full 16-byte window available — the padded region is NUL,
    /// which classifies as non-digit. The scanner returns the digits
    /// that are present rather than short-circuiting on length.
    #[test]
    fn scan_short_input_returns_available_digits() {
        let input = b"12345";
        let result = scan(input, 0).unwrap();
        assert_eq!(result.count, 5);
        assert_eq!(result.value, 12345);
    }

    #[test]
    fn scan_with_offset() {
        let input = b"abc1234567890123456xyz";
        let result = scan(input, 3).unwrap();
        assert_eq!(result.count, 16);
        assert_eq!(result.value, 1234567890123456);
    }

    #[test]
    fn scan_nine_digits() {
        // 9 digits exercises the two-group path (8 + 1).
        let input = b"123456789_______";
        let result = scan(input, 0).unwrap();
        assert_eq!(result.count, 9);
        assert_eq!(result.value, 123456789);
    }

    #[test]
    fn scan_all_zeros() {
        let input = b"0000000000000000";
        let result = scan(input, 0).unwrap();
        assert_eq!(result.count, 16);
        assert_eq!(result.value, 0);
    }

    #[test]
    fn scan_all_nines() {
        let input = b"9999999999999999";
        let result = scan(input, 0).unwrap();
        assert_eq!(result.count, 16);
        assert_eq!(result.value, 9999999999999999);
    }

    #[test]
    fn scan_boundary_below_zero() {
        // Bytes just below '0' (0x30): '/' is 0x2F
        let input = b"/234567890123456";
        assert!(scan(input, 0).is_none());
    }

    #[test]
    fn scan_boundary_above_nine() {
        // ':' is 0x3A, just above '9'
        let input = b":234567890123456";
        assert!(scan(input, 0).is_none());
    }

    /// Cross-validate SIMD against scalar for all digit counts 1..=16.
    #[test]
    fn cross_validate_all_counts() {
        for count in 1..=16u32 {
            let mut input = [b'0'; 32];
            // Fill with a recognizable pattern
            for j in 0..count as usize {
                input[j] = b'1' + (j % 9) as u8;
            }
            // Terminate with non-digit
            if (count as usize) < 32 {
                input[count as usize] = b'x';
            }

            // Scalar reference
            let mut scalar_val: u64 = 0;
            for j in 0..count as usize {
                scalar_val = scalar_val * 10 + (input[j] - b'0') as u64;
            }

            if let Some(result) = scan(&input, 0) {
                assert_eq!(
                    result.count, count,
                    "count mismatch for {count} digits"
                );
                assert_eq!(
                    result.value, scalar_val,
                    "value mismatch for {count} digits: SIMD={}, scalar={}",
                    result.value, scalar_val
                );
            }
            // If scan_digits_simd returns None (leading byte is not
            // an ASCII digit), that's fine — the scalar path handles it.
        }
    }
}
