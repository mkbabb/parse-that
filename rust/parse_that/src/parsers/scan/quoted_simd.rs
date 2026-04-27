// SIMD-accelerated quoted string scanner with escape-parity handling.
//
// Uses portable_simd (u8x16) to classify 16 bytes at a time. When a
// chunk contains backslashes, the escape parity of all 16 positions is
// resolved via bitwise arithmetic — no per-backslash branches.
//
// The escape-parity problem: a quote at position `i` is real iff the
// number of consecutive backslashes immediately preceding it is EVEN
// (including zero). Equivalently, position `i` is "escaped" iff it is
// immediately preceded by an odd-length backslash run.

use std::simd::prelude::*;

const CHUNK: usize = 16;
const MASK16: u32 = 0xFFFF;
const ODD_BITS: u32 = 0xAAAA; // bits 1, 3, 5, ...

/// SIMD-accelerated quoted string scanner.
///
/// Scans from `start` (the byte AFTER the opening quote) looking for the
/// closing quote byte `quote`, handling `\`-escape sequences. Returns the
/// byte offset of the closing quote, or `None` if the string is
/// unterminated.
///
/// Pass `b'"'` for double-quoted strings, `b'\''` for single-quoted.
///
/// This function only determines which quotes are real (not preceded by
/// an odd number of backslashes). It does NOT validate escape sequence
/// content (e.g. `\uXXXX`). Validation is the caller's job.
#[inline(always)]
pub fn scan_quoted_string_simd(bytes: &[u8], start: usize, quote: u8) -> Option<usize> {
    let mut pos = start;
    let len = bytes.len();

    // Carry: 1 if the previous chunk ended with an odd-length backslash
    // run (meaning the first byte of the next chunk is escaped).
    let mut carry: u32 = 0;

    let quote_splat = u8x16::splat(quote);
    let bs_splat = u8x16::splat(b'\\');

    while pos + CHUNK <= len {
        let chunk = u8x16::from_slice(&bytes[pos..pos + CHUNK]);

        let quote_bits = chunk.simd_eq(quote_splat).to_bitmask() as u32;
        let bs_bits = chunk.simd_eq(bs_splat).to_bitmask() as u32;

        // ── Fast path: no backslashes, no carry from previous chunk ──
        if bs_bits == 0 && carry == 0 {
            if quote_bits != 0 {
                return Some(pos + quote_bits.trailing_zeros() as usize);
            }
            pos += CHUNK;
            continue;
        }

        // ── Compute escaped positions ────────────────────────────────
        let escaped = escaped_mask(bs_bits, &mut carry);

        // A quote is real iff its position is NOT escaped.
        let real_quotes = quote_bits & !escaped;

        if real_quotes != 0 {
            return Some(pos + real_quotes.trailing_zeros() as usize);
        }

        pos += CHUNK;
    }

    // ── Scalar tail for the last < 16 bytes ──────────────────────────
    scalar_tail(bytes, pos, carry != 0, quote)
}

/// Compute a bitmask of "escaped" positions within a 16-byte chunk.
///
/// Bit `i` of the return value is 1 iff position `i` is immediately
/// preceded by an odd-length run of backslashes (possibly spanning from
/// the previous chunk via `carry`).
///
/// On entry, `*carry` is 1 if the previous chunk ended mid-odd-backslash-run.
/// On exit, `*carry` is updated for the next chunk.
#[doc(hidden)]
#[inline(always)]
pub fn escaped_mask(bs_bits: u32, carry: &mut u32) -> u32 {
    if bs_bits == 0 {
        let escaped = *carry;
        *carry = 0;
        return escaped;
    }

    let carry_in = *carry;
    let odd_bs = odd_parity_backslashes(bs_bits, carry_in);

    // Position i is escaped iff position (i-1) is an odd-parity backslash.
    // Shift left by 1; carry_in fills bit 0 (previous chunk's last odd-bs
    // escapes our first byte).
    let escaped = ((odd_bs << 1) | carry_in) & MASK16;

    // Carry-out: 1 iff bit 15 is an odd-parity backslash.
    *carry = (odd_bs >> 15) & 1;

    escaped
}

/// Compute which backslashes in `bs_bits` have odd parity within their
/// respective runs, accounting for `carry_in` from the previous chunk.
///
/// A backslash at odd parity (1st, 3rd, 5th, ... from its run start)
/// escapes the byte that follows it.
///
/// ## Algorithm
///
/// For each contiguous run of backslashes, odd-parity positions are at
/// offsets 0, 2, 4, ... from the run start. We enumerate runs (at most
/// 8 in a 16-bit mask) and build the result mask.
///
/// When `carry_in = 1`, the previous chunk ended mid-odd-backslash-run,
/// so the first byte of this chunk continues that run. The continuation
/// shifts parity: offset 0 from this chunk's perspective is offset
/// (even) from the extended run's start, so the odd-parity positions
/// within the continuation are at odd offsets (1, 3, 5, ...) from bit 0.
#[inline(always)]
pub(super) fn odd_parity_backslashes(bs_bits: u32, carry_in: u32) -> u32 {
    let mut odd = 0u32;
    let mut i = 0u32;

    // Handle carry-continuation: if carry_in = 1 and bit 0 is a backslash,
    // the first run continues from the previous chunk with inverted parity.
    if carry_in == 1 && (bs_bits & 1) != 0 {
        let run_len = (!bs_bits).trailing_zeros().min(16);
        let run_mask = if run_len >= 16 { MASK16 } else { (1u32 << run_len) - 1 };
        // Previous chunk's last backslash was odd (carry=1), so bit 0 is
        // even, bit 1 is odd, bit 2 is even, ... → odd at ODD indices.
        odd |= run_mask & ODD_BITS;
        i = run_len;
    }

    // Process remaining runs (fresh starts, no carry influence).
    while i < 16 {
        if (bs_bits >> i) & 1 == 0 {
            i += 1;
            continue;
        }
        let shifted = bs_bits >> i;
        let run_len = (!shifted).trailing_zeros().min(16 - i);
        let run_mask = if run_len >= 32 { u32::MAX } else { (1u32 << run_len) - 1 };
        // Odd-parity positions are at offsets 0, 2, 4, ... from run start.
        odd |= (run_mask & 0x5555) << i;
        i += run_len;
    }

    odd & MASK16
}

/// Scalar fallback for the tail bytes (< 16 remaining).
#[inline(always)]
fn scalar_tail(bytes: &[u8], mut pos: usize, byte0_escaped: bool, quote: u8) -> Option<usize> {
    let len = bytes.len();

    if byte0_escaped && pos < len {
        pos += 1; // skip the escaped byte
    }

    while pos < len {
        let b = unsafe { *bytes.get_unchecked(pos) };
        if b == quote {
            return Some(pos);
        }
        if b == b'\\' {
            pos += 1;
            if pos >= len {
                return None;
            }
            pos += 1;
            continue;
        }
        pos += 1;
    }

    None
}
