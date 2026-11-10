//! NEON kernel.
//!
//! Targeted at Apple M-class P-cores (the bench-of-record host).
//! Verified functional on E-cores and
//! generic aarch64 — no Apple-specific intrinsics, NEON baseline only.
//!
//! # Stripe model
//!
//! 64-byte stripes; four `u8x16` chunks per stripe.
//!
//! Per chunk:
//! - **Nibble-LUT collapse** (`<= 8` singletons): low/high nibble
//!   `vqtbl1q_u8` against the precomputed `(lo, hi)` LUTs, AND, then
//!   `vshrn_n_u16 #4` movemask to a 64-bit per-chunk lane (16 bits
//!   used per chunk; ORed across 4 chunks per stripe).
//! - **Wide-LUT** (`9..=16`): two paired-table lookups
//!   (`vqtbl2q_u8` over `[lo_lo, hi_lo]` + `[lo_hi, hi_hi]`),
//!   ORed before the bitmask.
//! - **MultiCmp** (`> 16`): per-singleton `vceqq_u8` + OR.
//!
//! Per stripe:
//! - **Digraph compare** (`|digraph_pairs| > 0`): `vextq_u8`
//!   shift-by-one + `vceqq_u8` against the per-pair second-byte
//!   splat; AND with shifted first-byte mask; OR into the stripe
//!   mask.
//! - **Quote parity** (`|quote_classes| > 0`): per-quote `vceqq_u8`
//!   reduced to a 64-bit unescaped-quote mask; prefix-XOR via the
//!   shared `parity::prefix_xor_64` (CLMUL/PMULL or 6-op shift-XOR);
//!   AND-NOT against the structural mask before compaction.
//!
//! After classification, the stripe mask is dropped through
//! `compaction::compact_stripe_tzcnt` to produce dense `(positions,
//! kinds)` columns.

#![cfg(target_arch = "aarch64")]

use crate::StructuralIndex;
use crate::alphabet::{KernelShape, NibbleLut, StructuralAlphabet, WideLut};
use crate::compaction;
use crate::stripe::{self, MAX_QUOTE_CLASSES, QuoteState, STRIPE};

use core::arch::aarch64::*;

/// Bytes per NEON register.
const CHUNK: usize = 16;

/// NEON entry point. Mirrors `scan_structural` for aarch64.
pub fn scan(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    let shape = KernelShape::select(alphabet);
    match shape {
        KernelShape::Empty => StructuralIndex::new(),
        KernelShape::NibbleLut => scan_nibble(input, alphabet),
        KernelShape::WideLut => scan_wide(input, alphabet),
        KernelShape::MultiCmp => scan_multi(input, alphabet),
    }
}

/// Mask out string bodies and compact one region's structural bytes.
///
/// # Safety
/// `input[i..i + 16 * chunks]` is in bounds, plus one byte past it when
/// the alphabet has digraphs (`stripe::region_fits`).
#[inline(always)]
unsafe fn finish_region(
    input: &[u8],
    i: usize,
    chunks: usize,
    mut mask: u64,
    alphabet: &StructuralAlphabet,
    quotes: &mut QuoteState,
    idx: &mut StructuralIndex,
) {
    // SAFETY: the caller's bound covers every load below.
    unsafe {
        let ptr = input.as_ptr().add(i);
        if !alphabet.digraph_pairs.is_empty() {
            mask |= digraph_region(ptr, chunks, alphabet.digraph_pairs);
        }
        if !alphabet.quote_classes.is_empty() {
            let mut qmasks = [0u64; MAX_QUOTE_CLASSES];
            let bs = raw_quotes_and_bs(ptr, chunks, alphabet.quote_classes, &mut qmasks);
            mask &= !quotes.body(alphabet.quote_classes, qmasks, bs, (chunks * CHUNK) as u32);
        }
    }
    if mask != 0 {
        compaction::compact_stripe_tzcnt(mask, i as u32, input, &mut idx.positions, &mut idx.kinds);
    }
}

// ───────────────────────── nibble-LUT path ────────────────────────────

fn scan_nibble(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    let lut = NibbleLut::from_singletons(alphabet.singletons);
    let byte_lut = lut.expand();
    // Estimate dense capacity: ~1 structural per 8 bytes. Avoids ~5
    // grow-and-copies on a 1 MB input.
    let mut idx = StructuralIndex::with_capacity(input.len() / 8 + 1);
    let mut quotes = QuoteState::default();
    let mut i = 0usize;

    // SAFETY: NEON is in the aarch64 baseline; every load is bounded by
    // `stripe::region_fits` for the region it reads.
    unsafe {
        let lo_v = vld1q_u8(lut.lo.as_ptr());
        let hi_v = vld1q_u8(lut.hi.as_ptr());
        let lo_mask = vdupq_n_u8(0x0F);

        while stripe::region_fits(i, STRIPE, input.len(), alphabet) {
            let mask = classify_stripe_nibble(input.as_ptr().add(i), lo_v, hi_v, lo_mask);
            finish_region(
                input,
                i,
                STRIPE / CHUNK,
                mask,
                alphabet,
                &mut quotes,
                &mut idx,
            );
            i += STRIPE;
        }
        while stripe::region_fits(i, CHUNK, input.len(), alphabet) {
            let mask = classify_chunk_nibble(input.as_ptr().add(i), lo_v, hi_v, lo_mask) as u64;
            finish_region(input, i, 1, mask, alphabet, &mut quotes, &mut idx);
            i += CHUNK;
        }
    }
    stripe::epilogue(input, i, alphabet, &byte_lut, &mut quotes, &mut idx);
    idx
}

#[inline(always)]
unsafe fn classify_stripe_nibble(
    ptr: *const u8,
    lo_v: uint8x16_t,
    hi_v: uint8x16_t,
    lo_mask: uint8x16_t,
) -> u64 {
    let mut mask = 0u64;
    for k in 0..4 {
        let m = unsafe { classify_chunk_nibble(ptr.add(k * 16), lo_v, hi_v, lo_mask) } as u64;
        mask |= m << (k * 16);
    }
    mask
}

#[inline(always)]
unsafe fn classify_chunk_nibble(
    ptr: *const u8,
    lo_v: uint8x16_t,
    hi_v: uint8x16_t,
    lo_mask: uint8x16_t,
) -> u16 {
    // SAFETY: caller guarantees `ptr..ptr+16` is in bounds.
    unsafe {
        let chunk = vld1q_u8(ptr);
        let lo_n = vandq_u8(chunk, lo_mask);
        let hi_n = vshrq_n_u8(chunk, 4);
        let lo_r = vqtbl1q_u8(lo_v, lo_n);
        let hi_r = vqtbl1q_u8(hi_v, hi_n);
        // matched lane is non-zero iff the byte is in the alphabet; the
        // exact bit pattern encodes which singleton matched. We don't
        // need that here — the movemask only cares about `set/clear`,
        // so collapse non-zero → 0xFF via cmp-against-zero.
        let matched = vandq_u8(lo_r, hi_r);
        let any = vtstq_u8(matched, matched);
        movemask_u8x16(any)
    }
}

// ─────────────────────────── wide-LUT path ────────────────────────────

fn scan_wide(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    let lut = WideLut::from_singletons(alphabet.singletons);
    let byte_lut = lut.expand();
    let mut idx = StructuralIndex::with_capacity(input.len() / 8 + 1);
    let mut quotes = QuoteState::default();
    let mut i = 0usize;

    // SAFETY: see scan_nibble.
    unsafe {
        let lo_lo_v = vld1q_u8(lut.lo_lo.as_ptr());
        let hi_lo_v = vld1q_u8(lut.hi_lo.as_ptr());
        let lo_hi_v = vld1q_u8(lut.lo_hi.as_ptr());
        let hi_hi_v = vld1q_u8(lut.hi_hi.as_ptr());
        let lo_mask = vdupq_n_u8(0x0F);

        while stripe::region_fits(i, STRIPE, input.len(), alphabet) {
            let mask = classify_stripe_wide(
                input.as_ptr().add(i),
                lo_lo_v,
                hi_lo_v,
                lo_hi_v,
                hi_hi_v,
                lo_mask,
            );
            finish_region(
                input,
                i,
                STRIPE / CHUNK,
                mask,
                alphabet,
                &mut quotes,
                &mut idx,
            );
            i += STRIPE;
        }
    }
    stripe::epilogue(input, i, alphabet, &byte_lut, &mut quotes, &mut idx);
    idx
}

#[inline(always)]
unsafe fn classify_stripe_wide(
    ptr: *const u8,
    lo_lo: uint8x16_t,
    hi_lo: uint8x16_t,
    lo_hi: uint8x16_t,
    hi_hi: uint8x16_t,
    lo_mask: uint8x16_t,
) -> u64 {
    let mut mask = 0u64;
    for k in 0..4 {
        let m = unsafe { classify_chunk_wide(ptr.add(k * 16), lo_lo, hi_lo, lo_hi, hi_hi, lo_mask) }
            as u64;
        mask |= m << (k * 16);
    }
    mask
}

#[inline(always)]
unsafe fn classify_chunk_wide(
    ptr: *const u8,
    lo_lo: uint8x16_t,
    hi_lo: uint8x16_t,
    lo_hi: uint8x16_t,
    hi_hi: uint8x16_t,
    lo_mask: uint8x16_t,
) -> u16 {
    // SAFETY: caller guarantees ptr..ptr+16 in bounds.
    unsafe {
        let chunk = vld1q_u8(ptr);
        let lo_n = vandq_u8(chunk, lo_mask);
        let hi_n = vshrq_n_u8(chunk, 4);
        let r_lo_lo = vqtbl1q_u8(lo_lo, lo_n);
        let r_hi_lo = vqtbl1q_u8(hi_lo, hi_n);
        let r_lo_hi = vqtbl1q_u8(lo_hi, lo_n);
        let r_hi_hi = vqtbl1q_u8(hi_hi, hi_n);
        let matched_lo = vandq_u8(r_lo_lo, r_hi_lo);
        let matched_hi = vandq_u8(r_lo_hi, r_hi_hi);
        let matched = vorrq_u8(matched_lo, matched_hi);
        let any = vtstq_u8(matched, matched);
        movemask_u8x16(any)
    }
}

// ─────────────────────────── multi-cmp path ───────────────────────────

fn scan_multi(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    let mut byte_lut = [false; 256];
    for &b in alphabet.singletons {
        byte_lut[b as usize] = true;
    }
    let mut idx = StructuralIndex::with_capacity(input.len() / 8 + 1);
    let mut quotes = QuoteState::default();
    let mut i = 0usize;

    // SAFETY: see scan_nibble.
    unsafe {
        while stripe::region_fits(i, STRIPE, input.len(), alphabet) {
            let mask = classify_stripe_multi(input.as_ptr().add(i), alphabet.singletons);
            finish_region(
                input,
                i,
                STRIPE / CHUNK,
                mask,
                alphabet,
                &mut quotes,
                &mut idx,
            );
            i += STRIPE;
        }
    }
    stripe::epilogue(input, i, alphabet, &byte_lut, &mut quotes, &mut idx);
    idx
}

#[inline(always)]
unsafe fn classify_stripe_multi(ptr: *const u8, singletons: &[u8]) -> u64 {
    let mut mask = 0u64;
    // SAFETY: caller bounds ptr..ptr+64.
    unsafe {
        for k in 0..4 {
            let chunk = vld1q_u8(ptr.add(k * 16));
            let mut acc = vdupq_n_u8(0);
            for &target in singletons {
                let cmp = vceqq_u8(chunk, vdupq_n_u8(target));
                acc = vorrq_u8(acc, cmp);
            }
            let m = movemask_u8x16(acc) as u64;
            mask |= m << (k * 16);
        }
    }
    mask
}

// ──────────────────────── digraph + quote helpers ─────────────────────

/// Digraph first-byte mask over `chunks` 16-byte chunks.
///
/// # Safety
/// `ptr..ptr + 16 * chunks + 1` is in bounds (the second-byte compare
/// reads one byte past the region).
#[inline(always)]
unsafe fn digraph_region(ptr: *const u8, chunks: usize, pairs: &[(u8, u8)]) -> u64 {
    let mut mask = 0u64;
    // SAFETY: per the contract above.
    unsafe {
        for &(first, second) in pairs {
            for k in 0..chunks {
                let chunk = vld1q_u8(ptr.add(k * CHUNK));
                let next = vld1q_u8(ptr.add(k * CHUNK + 1));
                let f_eq = vceqq_u8(chunk, vdupq_n_u8(first));
                let s_eq = vceqq_u8(next, vdupq_n_u8(second));
                let m = movemask_u8x16(vandq_u8(f_eq, s_eq)) as u64;
                mask |= m << (k * CHUNK);
            }
        }
    }
    mask
}

/// Per-class raw quote masks (into `out`) and the backslash mask (the
/// return value) over `chunks` 16-byte chunks.
///
/// # Safety
/// `ptr..ptr + 16 * chunks` is in bounds.
#[inline(always)]
unsafe fn raw_quotes_and_bs(
    ptr: *const u8,
    chunks: usize,
    quotes: &[u8],
    out: &mut [u64; MAX_QUOTE_CLASSES],
) -> u64 {
    let mut bsmask = 0u64;
    // SAFETY: per the contract above.
    unsafe {
        for k in 0..chunks {
            let chunk = vld1q_u8(ptr.add(k * CHUNK));
            for (qi, &q) in quotes.iter().enumerate() {
                let m = movemask_u8x16(vceqq_u8(chunk, vdupq_n_u8(q))) as u64;
                out[qi] |= m << (k * CHUNK);
            }
            let bs = vceqq_u8(chunk, vdupq_n_u8(b'\\'));
            bsmask |= (movemask_u8x16(bs) as u64) << (k * CHUNK);
        }
    }
    bsmask
}

// ─────────────────────────── movemask ─────────────────────────────────

/// Construct a 16-bit mask from a `uint8x16_t` whose bytes are
/// `0xFF` for "set" and `0x00` for "clear" (the natural output of
/// NEON `vceqq_u8`).
///
/// Standard NEON movemask via `vshrn_n_u16 #4` + read as u64 + bit-
/// stitch: shift-right-narrow on a 16-byte vector treating it as 8
/// `u16` lanes produces an 8-byte output where each nibble carries
/// the "set/clear" of the corresponding source byte. We then extract
/// the 16 nibbles as a u64 and apply a parallel-bits-extract to
/// reconstruct the 16-bit per-byte mask.
#[inline(always)]
pub(crate) unsafe fn movemask_u8x16(v: uint8x16_t) -> u16 {
    // SAFETY: pure SIMD intrinsics on a register; no memory access.
    unsafe {
        // Reinterpret the 16-byte vector as 8 u16 lanes, then narrow
        // right by 4 to produce 8 bytes whose low 4 bits each encode
        // 4 source bytes' set/clear via the 0xF/0x0 pattern.
        // Actually, vshrn_n_u16 #4 on a vec of [0xFFFF, 0x0000, ...]
        // yields per-byte [0xFF, 0x00, ...] where each byte represents
        // a pair of input bytes. We re-pack via a per-bit pattern.
        let pat: [u8; 16] = [1, 2, 4, 8, 16, 32, 64, 128, 1, 2, 4, 8, 16, 32, 64, 128];
        let bits = vandq_u8(v, vld1q_u8(pat.as_ptr()));
        // Sum the 8 low-half bytes into one u8 (they're disjoint bits),
        // similarly for the 8 high-half bytes. addv reduces a 16-byte
        // vector to a single u8 by horizontal addition; we want
        // separate sums for the two 8-byte halves, so we use addv on
        // each half via vget_low/high.
        let lo_u8 = vaddv_u8(vget_low_u8(bits)) as u16;
        let hi_u8 = vaddv_u8(vget_high_u8(bits)) as u16;
        lo_u8 | (hi_u8 << 8)
    }
}
