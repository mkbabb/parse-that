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
//! ## Tail handling
//!
//! Input is not required to be padded; the short tail (< 64 bytes)
//! is handled by a scalar epilogue that builds the same 64-bit mask
//! byte-by-byte using a 256-byte LUT reconstructed from the nibble
//! tables. No per-byte classification branch during the hot stripe
//! loop.

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
/// `bytes`. Returns `Some((offset, byte))` or `None` if no hit.
///
/// Replaces `memchr::memchr[1,2,3]` + `find_first_of_nibble_lut` at
/// "find the next structural position" call sites. One nibble-LUT
/// lookup per 16 bytes, one CTZ, one bounds check on the tail.
#[inline]
pub fn find_next_structural_from(
    bytes: &[u8],
    start: usize,
    lo_lut: &[u8; 16],
    hi_lut: &[u8; 16],
) -> Option<(usize, u8)> {
    let lo = u8x16::from_array(*lo_lut);
    let hi = u8x16::from_array(*hi_lut);
    let lo_mask = u8x16::splat(0x0F);
    let len = bytes.len();
    let mut i = start;

    while i + STRIPE <= len {
        let mask = classify_stripe(bytes, i, lo, hi);
        if mask != 0 {
            let pos = i + mask.trailing_zeros() as usize;
            return Some((pos, unsafe { *bytes.get_unchecked(pos) }));
        }
        i += STRIPE;
    }

    while i + 16 <= len {
        let chunk = u8x16::from_slice(unsafe { bytes.get_unchecked(i..i + 16) });
        let m = classify_16(chunk, lo, hi, lo_mask);
        if m != 0 {
            let pos = i + m.trailing_zeros() as usize;
            return Some((pos, unsafe { *bytes.get_unchecked(pos) }));
        }
        i += 16;
    }

    let byte_lut = expand_byte_lut(lo_lut, hi_lut);
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if byte_lut[b as usize] {
            return Some((i, b));
        }
        i += 1;
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

#[cfg(test)]
mod tests {
    use super::*;

    fn lut_for(targets: &[u8]) -> ([u8; 16], [u8; 16]) {
        let mut lo = [0u8; 16];
        let mut hi = [0u8; 16];
        for (i, &b) in targets.iter().enumerate() {
            assert!(i < 8, "nibble-LUT supports <= 8 targets");
            let bit = 1u8 << i;
            lo[(b & 0x0F) as usize] |= bit;
            hi[(b >> 4) as usize] |= bit;
        }
        (lo, hi)
    }

    #[test]
    fn find_next_basic() {
        let input = b"   hello, world! {wow}   ";
        let (lo, hi) = lut_for(&[b',', b'{', b'}']);
        let r = find_next_structural_from(input, 0, &lo, &hi);
        assert_eq!(r, Some((8, b',')));
        let r2 = find_next_structural_from(input, 9, &lo, &hi);
        assert_eq!(r2, Some((17, b'{')));
    }

    #[test]
    fn find_next_tail_only() {
        let input = b"  !";
        let (lo, hi) = lut_for(&[b'!']);
        let r = find_next_structural_from(input, 0, &lo, &hi);
        assert_eq!(r, Some((2, b'!')));
    }

    #[test]
    fn find_next_none() {
        let input = b"abcdefg";
        let (lo, hi) = lut_for(&[b',', b'{']);
        let r = find_next_structural_from(input, 0, &lo, &hi);
        assert_eq!(r, None);
    }

    #[test]
    fn iter_basic() {
        let input = b"{abc,xyz:1,qq}";
        let (lo, hi) = lut_for(&[b'{', b'}', b',', b':']);
        let mut it = NibbleBitmapIter::new(input, 0, &lo, &hi);
        let mut got = Vec::new();
        while let Some((pos, b)) = it.next() {
            got.push((pos, b));
        }
        assert_eq!(
            got,
            vec![
                (0, b'{'),
                (4, b','),
                (8, b':'),
                (10, b','),
                (13, b'}'),
            ]
        );
    }

    #[test]
    fn iter_across_stripe() {
        let mut s = String::new();
        s.push_str("{");
        s.push_str(&"a".repeat(70));
        s.push_str(",b}");
        let bytes = s.as_bytes();
        let (lo, hi) = lut_for(&[b'{', b'}', b',']);
        let mut it = NibbleBitmapIter::new(bytes, 0, &lo, &hi);
        let mut got = Vec::new();
        while let Some((pos, b)) = it.next() {
            got.push((pos, b));
        }
        assert_eq!(got, vec![(0, b'{'), (71, b','), (73, b'}'),]);
    }

    #[test]
    fn iter_set_offset_skips_forward() {
        let input = b"{a,b,c,d}";
        let (lo, hi) = lut_for(&[b',']);
        let mut it = NibbleBitmapIter::new(input, 0, &lo, &hi);
        let first = it.next();
        assert_eq!(first, Some((2, b',')));
        it.set_offset(6);
        let next = it.next();
        assert_eq!(next, Some((6, b',')));
    }
}
