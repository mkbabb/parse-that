//! Grammar-parameterised SIMD structural bitmap kernel.
//!
//! Per-stripe SIMD byte-class scanner that subsumes the deleted
//! memchr1/2/3 + nibble_lut_scan family. The caller supplies a byte
//! set `S` (as `(lo_lut, hi_lut)` nibble tables) and consumes
//! structural positions via a CTZ iterator.
//!
//! ## Stripe model
//!
//! 64-byte stripes. Classification is four `u8x16` nibble-LUT
//! comparisons (a lo-nibble lookup, a hi-nibble lookup, a bitwise
//! AND, a non-zero test) per 16-byte chunk; four chunks per stripe,
//! ORed into a 64-bit mask. The caller CTZ-iterates the mask,
//! advancing past each hit byte. No cursor state — the iterator is
//! a local temporary.
//!
//! ## Padded-input contract
//!
//! [`find_next_structural_from`] consumes a [`PaddedView`] whose
//! backing buffer has [`crate::state::INPUT_PAD_BYTES`] (64 bytes) of
//! trailing zero padding. The stripe loop runs from `start` to
//! `view.len()` inclusive; the final stripe reads into the zero pad,
//! and any match bit with a position `>= view.len()` is masked off
//! before the CTZ probe. This drops the per-stripe tail guard *and*
//! the 16-byte / scalar tail loops that the pre-AW-IV implementation
//! carried.

use crate::state::{PaddedView, INPUT_PAD_BYTES};
use std::simd::prelude::*;

const STRIPE: usize = 64;

/// Apply the 4-way nibble-LUT classification to a 16-byte chunk.
/// Returns a 16-bit mask with bit `i` set iff `chunk[i]` is a
/// member of the classified byte set.
#[inline(always)]
fn classify_16(chunk: u8x16, lo: u8x16, hi: u8x16, lo_mask: u8x16) -> u16 {
    let lo_n = chunk & lo_mask;
    let hi_n = chunk >> 4;
    let lo_r = lo.swizzle_dyn(lo_n);
    let hi_r = hi.swizzle_dyn(hi_n);
    let matched = lo_r & hi_r;
    matched.simd_ne(u8x16::splat(0)).to_bitmask() as u16
}

/// Build a 64-bit structural-byte mask for a 64-byte stripe.
/// Caller guarantees `bytes.len() >= offset + 64`.
#[inline(always)]
pub fn classify_stripe(bytes: &[u8], offset: usize, lo: u8x16, hi: u8x16) -> u64 {
    let lo_mask = u8x16::splat(0x0F);
    let mut mask: u64 = 0;
    for k in 0..4 {
        let chunk = u8x16::from_slice(unsafe {
            bytes.get_unchecked(offset + k * 16..offset + k * 16 + 16)
        });
        let m = classify_16(chunk, lo, hi, lo_mask) as u64;
        mask |= m << (k * 16);
    }
    mask
}

/// Build a 256-byte LUT from a nibble-LUT pair. Used only on the
/// scalar tail epilogue.
#[inline]
pub fn expand_byte_lut(lo_lut: &[u8; 16], hi_lut: &[u8; 16]) -> [bool; 256] {
    let mut lut = [false; 256];
    for b in 0u16..256 {
        let lo = lo_lut[(b & 0x0F) as usize];
        let hi = hi_lut[(b >> 4) as usize];
        lut[b as usize] = lo & hi != 0;
    }
    lut
}

#[inline(never)]
fn classify_tail(bytes: &[u8], offset: usize, byte_lut: &[bool; 256]) -> u64 {
    let len = bytes.len();
    let tail_len = len - offset;
    debug_assert!(tail_len < STRIPE);
    let mut mask: u64 = 0;
    for i in 0..tail_len {
        let b = unsafe { *bytes.get_unchecked(offset + i) };
        if byte_lut[b as usize] {
            mask |= 1u64 << i;
        }
    }
    mask
}

/// One-shot: find the first structural byte at or after `start` in
/// `view`. Returns `Some((offset, byte))` or `None` if no hit before
/// `view.len()`.
///
/// Replaces `memchr::memchr[1,2,3]` + `find_first_of_nibble_lut` at
/// "find the next structural position" call sites. One nibble-LUT
/// lookup per 16 bytes, one CTZ, one mask clamp on the final stripe.
///
/// The final stripe may read up to 64 bytes past `view.len()` into
/// the zero-padded region; the returned position is always clamped
/// to `< view.len()` via the tail mask. Needles that include `0x00`
/// are not supported — grammars mine only non-NUL structural bytes,
/// so the NUL padding is a structural no-op.
#[inline]
pub fn find_next_structural_from(
    view: PaddedView<'_>,
    start: usize,
    lo_lut: &[u8; 16],
    hi_lut: &[u8; 16],
) -> Option<(usize, u8)> {
    let lo = u8x16::from_array(*lo_lut);
    let hi = u8x16::from_array(*hi_lut);
    let bytes = view.bytes();
    let len = view.len();
    debug_assert!(
        bytes.len() >= len + INPUT_PAD_BYTES,
        "find_next_structural_from: PaddedView backing too short ({} < {} + {})",
        bytes.len(),
        len,
        INPUT_PAD_BYTES,
    );
    let mut i = start;

    // Full-stripe hot loop: every iteration fits entirely in the
    // public input range.
    while i + STRIPE <= len {
        let mask = classify_stripe(bytes, i, lo, hi);
        if mask != 0 {
            let pos = i + mask.trailing_zeros() as usize;
            return Some((pos, unsafe { *bytes.get_unchecked(pos) }));
        }
        i += STRIPE;
    }

    // Tail stripe: reads into the zero pad. The raw stripe mask may
    // carry bits for padded positions (all zero, so they're naturally
    // clear for non-NUL needles); the explicit tail mask is kept as
    // a debug_assert correctness probe below.
    if i < len {
        let mask = classify_stripe(bytes, i, lo, hi);
        let valid_bits = len - i;
        let keep_mask = if valid_bits >= STRIPE {
            u64::MAX
        } else {
            (1u64 << valid_bits) - 1
        };
        let clipped = mask & keep_mask;
        if clipped != 0 {
            let pos = i + clipped.trailing_zeros() as usize;
            return Some((pos, unsafe { *bytes.get_unchecked(pos) }));
        }
    }

    None
}

/// Stateful per-stripe iterator. Constructed from a byte slice +
/// byte-class LUTs; yields structural byte positions via `next()`.
pub struct NibbleBitmapIter<'a> {
    bytes: &'a [u8],
    lo: u8x16,
    hi: u8x16,
    byte_lut: [bool; 256],
    offset: usize,
    stripe_mask: u64,
    stripe_base: usize,
}

impl<'a> NibbleBitmapIter<'a> {
    #[inline]
    pub fn new(bytes: &'a [u8], start: usize, lo_lut: &[u8; 16], hi_lut: &[u8; 16]) -> Self {
        Self {
            bytes,
            lo: u8x16::from_array(*lo_lut),
            hi: u8x16::from_array(*hi_lut),
            byte_lut: expand_byte_lut(lo_lut, hi_lut),
            offset: start,
            stripe_mask: 0,
            stripe_base: usize::MAX,
        }
    }

    /// Return the next structural position at or after `self.offset`.
    #[inline]
    pub fn next(&mut self) -> Option<(usize, u8)> {
        let len = self.bytes.len();

        while self.stripe_mask != 0 {
            let bit = self.stripe_mask.trailing_zeros() as usize;
            let pos = self.stripe_base + bit;
            self.stripe_mask &= !(1u64 << bit);
            if pos >= self.offset {
                self.offset = pos + 1;
                return Some((pos, unsafe { *self.bytes.get_unchecked(pos) }));
            }
        }

        let mut i = if self.stripe_base == usize::MAX {
            self.offset & !(STRIPE - 1)
        } else {
            self.stripe_base + STRIPE
        };
        if i < self.offset {
            i = self.offset & !(STRIPE - 1);
        }

        while i + STRIPE <= len {
            let mask = classify_stripe(self.bytes, i, self.lo, self.hi);
            if mask != 0 {
                self.stripe_base = i;
                self.stripe_mask = mask;
                let rel = self.offset.saturating_sub(i);
                if rel > 0 && rel < 64 {
                    self.stripe_mask &= !((1u64 << rel) - 1);
                }
                if self.stripe_mask != 0 {
                    let bit = self.stripe_mask.trailing_zeros() as usize;
                    let pos = i + bit;
                    self.stripe_mask &= !(1u64 << bit);
                    self.offset = pos + 1;
                    return Some((pos, unsafe { *self.bytes.get_unchecked(pos) }));
                }
            }
            i += STRIPE;
        }

        if i < len {
            let mut mask = classify_tail(self.bytes, i, &self.byte_lut);
            let rel = self.offset.saturating_sub(i);
            if rel > 0 && rel < 64 {
                mask &= !((1u64 << rel) - 1);
            }
            if mask != 0 {
                let bit = mask.trailing_zeros() as usize;
                let pos = i + bit;
                self.stripe_base = i;
                self.stripe_mask = mask & !(1u64 << bit);
                self.offset = pos + 1;
                return Some((pos, unsafe { *self.bytes.get_unchecked(pos) }));
            }
        }

        self.offset = len;
        None
    }

    /// Fast-forward the iterator past `new_offset`. Positions before
    /// `new_offset` will be skipped on subsequent `next()` calls.
    #[inline]
    pub fn set_offset(&mut self, new_offset: usize) {
        self.offset = new_offset;
        if self.stripe_base != usize::MAX && new_offset >= self.stripe_base {
            let rel = new_offset - self.stripe_base;
            if rel < 64 {
                self.stripe_mask &= !((1u64 << rel) - 1);
            } else {
                self.stripe_mask = 0;
            }
        } else {
            self.stripe_mask = 0;
        }
    }
}

/// Given a first-byte mask over a 64-byte stripe + the stripe's raw
/// bytes, return a mask of positions where byte `i` is the first
/// byte AND byte `i+1` is the second byte. Used for `/\*`, `\*/`,
/// `->` digraph detection.
#[inline]
pub fn digraph_mask(
    bytes: &[u8],
    offset: usize,
    first_mask: u64,
    second: u8,
) -> u64 {
    let len = bytes.len();
    let end = (offset + 64).min(len);
    let mut second_mask: u64 = 0;
    let mut i = offset;
    while i < end {
        if unsafe { *bytes.get_unchecked(i) } == second {
            second_mask |= 1u64 << (i - offset);
        }
        i += 1;
    }
    let shifted = (first_mask & !(1u64 << 63)) << 1;
    shifted & second_mask
}
