//! Quote-state parity computation.
//!
//! Given a 64-bit mask of unescaped quote positions in a 64-byte
//! stripe, plus the parity carried in from the previous stripe,
//! compute the per-byte "inside string" mask: bit `i` is `1` iff
//! byte `stripe_base + i` is between an unescaped opening quote and
//! its matching closing quote.
//!
//! The classical simdjson trick: prefix-XOR the quote mask. With CLMUL
//! against the all-ones polynomial, the prefix-XOR is one PMULL/CLMUL
//! op per stripe. Without CLMUL, the same prefix can be computed via
//! a 6-op shift-XOR ladder (Lemire's "fast parsing" §6.1):
//!
//! ```text
//! x = quote_mask
//! x ^= x << 1
//! x ^= x << 2
//! x ^= x << 4
//! x ^= x << 8
//! x ^= x << 16
//! x ^= x << 32
//! ```
//!
//! Both forms produce the same 64-bit prefix-XOR; either is folded
//! with the carried parity bit from the previous stripe (XOR).
//!
//! This module is arch-neutral; the AVX2 + NEON kernels call
//! [`prefix_xor_64`] directly, which selects CLMUL or shift-XOR by
//! runtime CPU-feature detection. The output is the in-string mask suitable
//! for AND-NOT'ing against the structural-byte mask before compaction.

/// Compute the prefix-XOR of `mask`, folding `carry_in` (the XOR
/// across all bits of all prior stripes' masks) into bit 0.
///
/// Uses CLMUL on aarch64 (PMULL) or x86_64 (PCLMULQDQ) when the CPU
/// has those features (detected at runtime); falls back to the
/// 6-op shift-XOR ladder otherwise. Both paths produce identical
/// output; tests in `tests/quote_parity.rs` verify this.
#[inline]
pub fn prefix_xor_64(mask: u64, carry_in: bool) -> u64 {
    let prefix = prefix_xor_impl(mask);
    if carry_in { !prefix } else { prefix }
}

/// Compute the per-byte "escaped" mask — bit `i` set iff byte `i`
/// is preceded by an odd-length run of backslashes ending at `i-1`.
/// `bs_mask` holds the per-byte backslash positions; `bs_carry_in`
/// tracks consecutive trailing backslashes carried over from the
/// previous stripe (parity bit only — we only need to know whether
/// the carry-in count of unmatched backslashes is odd).
///
/// Algorithm follows the simdjson trick (Langdale & Lemire §4.2):
///
/// - Find run-start edges: `starts = bs & ~(bs << 1)` (in-stripe).
/// - Even/odd partition by EVEN/ODD bit pattern.
/// - Add `starts` to `bs_mask` to propagate ones through each run;
///   the result's first zero bit (XOR with `bs_mask`) marks the
///   end of each run.
/// - The byte AT the run-end's position is the escaped byte iff the
///   run started at the matching parity.
/// - Finally, the carry-in case: if `bs_carry_in` is true and bit 0
///   of `bs_mask` is 0, then bit 0 itself is escaped by the previous
///   stripe's hanging backslash run. If bit 0 is 1, the carry extends
///   the run from the previous stripe — we need to flip parity for
///   the run-start at bit 0.
///
/// Returns `(escape_mask, new_carry)`; `new_carry` is set iff the
/// stripe ends with an odd-length backslash run that continues into
/// the next stripe.
#[inline]
pub fn escape_mask_64(bs_mask: u64, bs_carry_in: bool) -> (u64, bool) {
    const EVEN_BITS: u64 = 0x5555_5555_5555_5555;
    const ODD_BITS: u64 = 0xAAAA_AAAA_AAAA_AAAA;

    // Run-starts in this stripe — backslashes whose left neighbour is
    // NOT a backslash. The carry from the previous stripe means: if
    // bs_carry_in is true and bit 0 is a backslash, then bit 0 is
    // NOT a run-start (the run was already started in the prior
    // stripe with opposite parity).
    let bs_left = bs_mask << 1;
    let starts = bs_mask & !bs_left;

    // Carry-in flips the parity of the run that began in the previous
    // stripe. If bs_carry_in is true and bit 0 ∈ bs_mask, the run
    // continues; we must remove bit 0 from starts (it's not a fresh
    // start) and flip parity for the EVEN/ODD partition because the
    // carry-in run started one position earlier.
    let carry_continues = bs_carry_in && (bs_mask & 1) == 1;
    let starts_eff = if carry_continues { starts & !1 } else { starts };

    let (even_starts, odd_starts) = if carry_continues {
        // Run from prior stripe extends; its parity (within the
        // current stripe's bit indexing) is at bit 0 ∈ even, but the
        // run *started* in the previous stripe with the OPPOSITE
        // parity. We swap the EVEN/ODD masks for that one run by
        // adding bit 0 to the odd_starts side and removing it from
        // even_starts.
        // Effectively we add an "odd-start" at bit 0 to extend the
        // run with the prior parity.
        (starts_eff & EVEN_BITS, (starts_eff & ODD_BITS) | 1)
    } else {
        (starts_eff & EVEN_BITS, starts_eff & ODD_BITS)
    };

    let (even_carries, _) = bs_mask.overflowing_add(even_starts);
    let even_carry_ends = even_carries & !bs_mask;
    let even_escape = even_carry_ends & ODD_BITS;

    let (odd_carries, _) = bs_mask.overflowing_add(odd_starts);
    let odd_carry_ends = odd_carries & !bs_mask;
    let odd_escape = odd_carry_ends & EVEN_BITS;

    let mut escape_mask = even_escape | odd_escape;

    // Carry-in fold for bit 0: when bs_carry_in is true and bit 0 is
    // NOT a backslash, then bit 0 itself is the escaped byte.
    if bs_carry_in && (bs_mask & 1) == 0 {
        escape_mask |= 1;
    }

    // Carry-out: count trailing 1-bits at the high end (bit 63 down).
    // If bit 63 isn't set, no carry out. If the entire mask is `\`,
    // the new carry depends on input carry XOR 64-parity (= XOR with 0).
    // Otherwise the in-stripe run is local — parity is just
    // `trailing_run % 2`.
    let new_carry = if (bs_mask & (1u64 << 63)) == 0 {
        false
    } else if bs_mask == u64::MAX {
        // Whole stripe is `\`; even contribution to length → carry
        // passes through.
        bs_carry_in
    } else {
        let trailing_run = bs_mask.leading_ones();
        trailing_run % 2 == 1
    };

    (escape_mask, new_carry)
}

/// Internal: pure prefix-XOR with no carry. The carry handling is
/// folded in by [`prefix_xor_64`] via inversion.
///
/// CLMUL (x86 `pclmulqdq`) or PMULL64 (aarch64 `aes`) when the CPU has
/// it, detected at runtime unless the build's baseline already enables
/// it (aarch64-apple does, so the Mac path is decided at compile time);
/// the shift-XOR ladder otherwise, and always under Miri.
#[inline]
fn prefix_xor_impl(mask: u64) -> u64 {
    #[cfg(all(target_arch = "aarch64", not(miri)))]
    {
        if cfg!(target_feature = "aes") || std::arch::is_aarch64_feature_detected!("aes") {
            // SAFETY: the `aes` feature (PMULL64) is compiled in or detected.
            return unsafe { clmul_prefix_xor_aarch64(mask) };
        }
    }
    #[cfg(all(target_arch = "x86_64", not(miri)))]
    {
        if cfg!(target_feature = "pclmulqdq") || std::arch::is_x86_feature_detected!("pclmulqdq") {
            // SAFETY: the `pclmulqdq` feature is compiled in or detected.
            return unsafe { clmul_prefix_xor_x86(mask) };
        }
    }
    shift_xor_prefix(mask)
}

/// 6-op shift-XOR prefix ladder. Always correct; used as the
/// portable fallback and as the test reference for CLMUL parity.
#[inline]
pub fn shift_xor_prefix(mut x: u64) -> u64 {
    x ^= x << 1;
    x ^= x << 2;
    x ^= x << 4;
    x ^= x << 8;
    x ^= x << 16;
    x ^= x << 32;
    x
}

/// CLMUL/PMULL prefix-XOR on aarch64.
///
/// # Safety
/// The CPU supports the `aes` feature (PMULL64).
#[cfg(all(target_arch = "aarch64", not(miri)))]
#[target_feature(enable = "neon,aes")]
#[inline]
unsafe fn clmul_prefix_xor_aarch64(mask: u64) -> u64 {
    use core::arch::aarch64::vmull_p64;
    // Low 64 bits of the 128-bit carry-less product with all-ones ==
    // prefix-XOR. The intrinsic is safe to call here: this function's
    // `target_feature` enables it.
    let m = vmull_p64(mask, !0u64);
    m as u64
}

/// CLMUL prefix-XOR on x86_64.
///
/// # Safety
/// The CPU supports the `pclmulqdq` feature (and SSE2, baseline).
#[cfg(all(target_arch = "x86_64", not(miri)))]
#[target_feature(enable = "pclmulqdq")]
#[inline]
unsafe fn clmul_prefix_xor_x86(mask: u64) -> u64 {
    use core::arch::x86_64::{_mm_clmulepi64_si128, _mm_cvtsi128_si64, _mm_set1_epi8, _mm_set_epi64x};
    let a = _mm_set_epi64x(0, mask as i64);
    let b = _mm_set1_epi8(-1i8);
    let prod = _mm_clmulepi64_si128::<0>(a, b);
    _mm_cvtsi128_si64(prod) as u64
}

/// Compute the byte-position "inside-string" mask for a slice.
/// Used by the scalar-fallback kernel to filter structural bytes
/// caught inside string literals; produces a `Vec<bool>` parallel
/// to the input.
///
/// The kernels do this on-the-fly per stripe via [`prefix_xor_64`];
/// the per-byte form here exists so the scalar reference and the
/// fuzz test can compare against a single implementation.
///
/// Byte `i` is `true` iff it is inside a string literal: the opening
/// quote is outside, the closing quote inside, and an escaped quote
/// does not close.
///
/// ```
/// use parse_that_simd::parity::compute_inside_string_bytes;
///
/// let inside = compute_inside_string_bytes(br#"a"b\"c"d"#, b"\"");
/// let marks: String = inside.iter().map(|&b| if b { '1' } else { '0' }).collect();
/// assert_eq!(marks, "00111110");
/// ```
pub fn compute_inside_string_bytes(input: &[u8], quote_classes: &[u8]) -> Vec<bool> {
    let mut quote_lut = [false; 256];
    for &b in quote_classes {
        quote_lut[b as usize] = true;
    }
    let mut out = vec![false; input.len()];
    if quote_classes.is_empty() {
        return out;
    }

    let mut inside = false;
    let mut active_quote = 0u8;
    let mut i = 0;
    while i < input.len() {
        let b = input[i];
        if !inside {
            if quote_lut[b as usize] {
                inside = true;
                active_quote = b;
            }
            i += 1;
            continue;
        }
        out[i] = true;
        if b == active_quote {
            // Escape parity: count preceding backslashes.
            let mut bs = 0usize;
            let mut j = i;
            while j > 0 && input[j - 1] == b'\\' {
                bs += 1;
                j -= 1;
            }
            if bs.is_multiple_of(2) {
                inside = false;
            }
        }
        i += 1;
    }
    out
}
