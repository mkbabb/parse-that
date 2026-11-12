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
        // No singletons: digraphs alone, through the compare path (whose
        // singleton loop is then empty).
        KernelShape::Empty if alphabet.digraph_pairs.is_empty() => StructuralIndex::new(),
        KernelShape::Empty => scan_multi(input, alphabet),
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

// ─────────────────────────── stage 1 (LW3.PERF-1a) ───────────────────────────

/// Bitmask of the bytes of the 64-byte region at `ptr` equal to any of `set`.
///
/// # Safety
/// `ptr..ptr + 64` is readable.
#[inline(always)]
unsafe fn eq_set_stripe(ptr: *const u8, set: &[u8]) -> u64 {
    if set.is_empty() {
        return 0;
    }
    let mut mask = 0u64;
    // SAFETY: per the contract above.
    unsafe {
        for k in 0..4 {
            let chunk = vld1q_u8(ptr.add(k * CHUNK));
            let mut acc = vdupq_n_u8(0);
            for &b in set {
                acc = vorrq_u8(acc, vceqq_u8(chunk, vdupq_n_u8(b)));
            }
            mask |= (movemask_u8x16(acc) as u64) << (k * CHUNK);
        }
    }
    mask
}

/// Bitmask of the positions of the 64-byte region at `ptr` where `seq`
/// (one or two bytes) begins.
///
/// # Safety
/// `ptr..ptr + 65` is readable.
#[inline(always)]
unsafe fn seq_stripe(ptr: *const u8, seq: &[u8]) -> u64 {
    // SAFETY: per the contract above.
    unsafe {
        if seq.len() == 1 {
            eq_set_stripe(ptr, seq)
        } else {
            digraph_region(ptr, 4, &[(seq[0], seq[1])])
        }
    }
}

/// The fused UTF-8 validator's state (Keiser–Lemire lookup), 16 bytes a
/// step.
struct Utf8 {
    prev: uint8x16_t,
    incomplete: uint8x16_t,
    error: uint8x16_t,
    b1h: uint8x16_t,
    b1l: uint8x16_t,
    b2h: uint8x16_t,
    max: uint8x16_t,
}

impl Utf8 {
    #[inline(always)]
    fn new() -> Self {
        use crate::stage1::utf8;
        // SAFETY: NEON is baseline on aarch64; the loads read the 16-byte
        // tables.
        unsafe {
            Utf8 {
                prev: vdupq_n_u8(0),
                incomplete: vdupq_n_u8(0),
                error: vdupq_n_u8(0),
                b1h: vld1q_u8(utf8::BYTE_1_HIGH.as_ptr()),
                b1l: vld1q_u8(utf8::BYTE_1_LOW.as_ptr()),
                b2h: vld1q_u8(utf8::BYTE_2_HIGH.as_ptr()),
                max: vld1q_u8(utf8::INCOMPLETE_16.as_ptr()),
            }
        }
    }

    /// One 16-byte step: the error classes of each byte paired with its
    /// predecessor, less the continuations a 3- or 4-byte lead expects.
    #[inline(always)]
    fn step(&mut self, input: uint8x16_t) {
        use crate::stage1::utf8::{FOURTH, THIRD};
        // SAFETY: register-only NEON arithmetic.
        unsafe {
            let prev1 = vextq_u8(self.prev, input, 15);
            let lo = vdupq_n_u8(0x0F);
            let sc = vandq_u8(
                vandq_u8(
                    vqtbl1q_u8(self.b1h, vshrq_n_u8(prev1, 4)),
                    vqtbl1q_u8(self.b1l, vandq_u8(prev1, lo)),
                ),
                vqtbl1q_u8(self.b2h, vshrq_n_u8(input, 4)),
            );
            let prev2 = vextq_u8(self.prev, input, 14);
            let prev3 = vextq_u8(self.prev, input, 13);
            let must = vandq_u8(
                vorrq_u8(vqsubq_u8(prev2, vdupq_n_u8(THIRD)), vqsubq_u8(prev3, vdupq_n_u8(FOURTH))),
                vdupq_n_u8(0x80),
            );
            self.error = vorrq_u8(self.error, veorq_u8(must, sc));
            self.prev = input;
        }
    }

    /// The block at `ptr`, its first `n` bytes kept and the rest zeroed.
    ///
    /// # Safety
    /// `ptr..ptr + 64` is readable.
    #[inline(always)]
    unsafe fn block(&mut self, ptr: *const u8, n: usize) {
        // SAFETY: per the contract above; the mask loads read
        // `TAIL_MASK[64 - n + 16 k .. + 16]`, inside its 128 bytes.
        unsafe {
            let mut c = [
                vld1q_u8(ptr),
                vld1q_u8(ptr.add(16)),
                vld1q_u8(ptr.add(32)),
                vld1q_u8(ptr.add(48)),
            ];
            if n < 64 {
                let mask = crate::stage1::TAIL_MASK.as_ptr().add(64 - n);
                for (k, v) in c.iter_mut().enumerate() {
                    *v = vandq_u8(*v, vld1q_u8(mask.add(16 * k)));
                }
            }
            let any = vorrq_u8(vorrq_u8(c[0], c[1]), vorrq_u8(c[2], c[3]));
            if vmaxvq_u8(any) < 0x80 {
                // All ASCII: only a sequence cut off at the previous
                // block's end can be wrong.
                self.error = vorrq_u8(self.error, self.incomplete);
                self.incomplete = vdupq_n_u8(0);
                self.prev = c[3];
                return;
            }
            for v in c {
                self.step(v);
            }
            self.incomplete = vqsubq_u8(c[3], self.max);
        }
    }

    #[inline(always)]
    fn valid(&self) -> bool {
        // SAFETY: register-only NEON arithmetic.
        unsafe { vmaxvq_u8(vorrq_u8(self.error, self.incomplete)) == 0 }
    }
}

/// NEON stage 1 ([`crate::stage1`]).
pub(crate) fn stage1(
    input: crate::PaddedSlice<'_>,
    spec: &crate::Stage1Spec,
) -> Result<crate::Stage1Index, crate::Stage1Error> {
    use crate::stage1::{MAX_COMMENT_CLASSES, Raw, drive, utf8_error};
    let alphabet = spec.alphabet();
    let shape = KernelShape::select(alphabet);
    let nib = NibbleLut::from_singletons(if shape == KernelShape::NibbleLut {
        alphabet.singletons
    } else {
        &[]
    });
    let wide = WideLut::from_singletons(if shape == KernelShape::WideLut {
        alphabet.singletons
    } else {
        &[]
    });
    let mut utf8 = Utf8::new();
    // SAFETY: NEON is baseline on aarch64; the LUT loads read 16-byte arrays.
    let (lo_v, hi_v, lo_lo, hi_lo, lo_hi, hi_hi, lo_mask) = unsafe {
        (
            vld1q_u8(nib.lo.as_ptr()),
            vld1q_u8(nib.hi.as_ptr()),
            vld1q_u8(wide.lo_lo.as_ptr()),
            vld1q_u8(wide.hi_lo.as_ptr()),
            vld1q_u8(wide.lo_hi.as_ptr()),
            vld1q_u8(wide.hi_hi.as_ptr()),
            vdupq_n_u8(0x0F),
        )
    };
    let out = drive(input, spec, |ptr, n| {
        let mut raw = Raw::default();
        // SAFETY: `drive`'s contract: 65 bytes are readable at `ptr`.
        unsafe {
            raw.singles = match shape {
                KernelShape::Empty => 0,
                KernelShape::NibbleLut => classify_stripe_nibble(ptr, lo_v, hi_v, lo_mask),
                KernelShape::WideLut => {
                    classify_stripe_wide(ptr, lo_lo, hi_lo, lo_hi, hi_hi, lo_mask)
                }
                KernelShape::MultiCmp => classify_stripe_multi(ptr, alphabet.singletons),
            };
            if !alphabet.digraph_pairs.is_empty() {
                raw.digraph = digraph_region(ptr, 4, alphabet.digraph_pairs);
            }
            raw.bs = raw_quotes_and_bs(ptr, 4, alphabet.quote_classes, &mut raw.quotes);
            raw.ws = eq_set_stripe(ptr, spec.whitespace());
            for (c, class) in spec.comments().iter().enumerate().take(MAX_COMMENT_CLASSES) {
                raw.open[c] = seq_stripe(ptr, class.open());
                raw.close[c] = seq_stripe(ptr, class.close());
            }
            utf8.block(ptr, n);
        }
        raw
    });
    if utf8.valid() {
        Ok(out)
    } else {
        Err(utf8_error(input.bytes()))
    }
}

// ─────────────────────── the all-ASCII run (LW3.PERF-2) ───────────────────────

/// NEON [`crate::ascii_prefix_len`]: 64 bytes a step while the run lasts,
/// then 16, then the scalar oracle on the last `< 16` bytes. Reads only
/// `bytes`.
pub(crate) fn ascii_prefix_len(bytes: &[u8]) -> usize {
    let len = bytes.len();
    let p = bytes.as_ptr();
    let mut i = 0usize;
    // SAFETY: every load reads `p[i..i + w]` with `i + w <= len`.
    unsafe {
        while i + 64 <= len {
            let a = vmaxq_u8(vld1q_u8(p.add(i)), vld1q_u8(p.add(i + 16)));
            let b = vmaxq_u8(vld1q_u8(p.add(i + 32)), vld1q_u8(p.add(i + 48)));
            if vmaxvq_u8(vmaxq_u8(a, b)) >= 0x80 {
                break;
            }
            i += 64;
        }
        while i + 16 <= len {
            let v = vld1q_u8(p.add(i));
            if vmaxvq_u8(v) >= 0x80 {
                let high = vcltzq_s8(vreinterpretq_s8_u8(v));
                return i + movemask_u8x16(high).trailing_zeros() as usize;
            }
            i += 16;
        }
    }
    i + crate::scalar::ascii_prefix_len(&bytes[i..])
}
