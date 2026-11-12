//! wasm32 SIMD128 kernel.
//!
//! 64-byte stripes of four `v128` chunks, the NEON shape:
//!
//! - `i8x16.swizzle` collapses the nibble LUT (one shuffle per chunk
//!   against the low and the high nibble table);
//! - `i8x16.eq` compares singletons, quotes, backslashes and digraphs;
//! - `i8x16.bitmask` extracts each chunk's 16-bit mask.
//!
//! The kernel produces only raw masks. What they mean (escape parity,
//! which quote class is open, the byte-at-a-time epilogue, the digraph
//! lookahead bound) is [`crate::stripe`]'s, shared with every other
//! tier, so the output equals [`crate::scalar::scan`] by construction.
//!
//! wasm has no runtime feature detection: a module that contains
//! SIMD128 instructions does not validate on an engine without them.
//! So this tier is compiled only when the build enables `simd128`
//! (`-C target-feature=+simd128`), and a build that enables it may run
//! it unconditionally.

use crate::StructuralIndex;
use crate::alphabet::{KernelShape, NibbleLut, StructuralAlphabet};
use crate::compaction;
use crate::stripe::{self, MAX_QUOTE_CLASSES, QuoteState, STRIPE};

use core::arch::wasm32::*;

/// Bytes per `v128`.
const CHUNK: usize = 16;

/// The structural-byte classifier of one 16-byte chunk.
#[derive(Clone, Copy)]
enum Classify<'a> {
    /// Nibble-LUT collapse: the low and high nibble tables, and `0x0F`.
    Nibble { lo: v128, hi: v128, lo_mask: v128 },
    /// One compare per singleton (the wide and multi-compare shapes).
    Multi(&'a [u8]),
}

/// wasm32 entry point. Mirrors `scan_structural`.
pub fn scan(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    match KernelShape::select(alphabet) {
        // No singletons: digraphs alone, through the compare path.
        KernelShape::Empty if alphabet.digraph_pairs.is_empty() => StructuralIndex::new(),
        KernelShape::NibbleLut => {
            let lut = NibbleLut::from_singletons(alphabet.singletons);
            let classify = Classify::Nibble {
                lo: u8x16_from(lut.lo),
                hi: u8x16_from(lut.hi),
                lo_mask: u8x16_splat(0x0F),
            };
            run(input, alphabet, classify, &lut.expand())
        }
        KernelShape::Empty | KernelShape::WideLut | KernelShape::MultiCmp => {
            let mut byte_lut = [false; 256];
            for &b in alphabet.singletons {
                byte_lut[b as usize] = true;
            }
            run(input, alphabet, Classify::Multi(alphabet.singletons), &byte_lut)
        }
    }
}

/// The stripe loop, the chunk loop and the shared epilogue.
fn run(
    input: &[u8],
    alphabet: &StructuralAlphabet,
    classify: Classify<'_>,
    byte_lut: &[bool; 256],
) -> StructuralIndex {
    let mut idx = StructuralIndex::with_capacity(input.len() / 8 + 1);
    let mut quotes = QuoteState::default();
    let mut i = 0usize;
    while stripe::region_fits(i, STRIPE, input.len(), alphabet) {
        // SAFETY: `region_fits` bounds every load of the region (and the
        // digraph lookahead byte).
        unsafe { region(input, i, STRIPE / CHUNK, classify, alphabet, &mut quotes, &mut idx) };
        i += STRIPE;
    }
    while stripe::region_fits(i, CHUNK, input.len(), alphabet) {
        // SAFETY: as above, for one chunk.
        unsafe { region(input, i, 1, classify, alphabet, &mut quotes, &mut idx) };
        i += CHUNK;
    }
    stripe::epilogue(input, i, alphabet, byte_lut, &mut quotes, &mut idx);
    idx
}

/// Classify, mask out string bodies and compact one region of
/// `chunks` chunks at `input[i..]`.
///
/// # Safety
/// `stripe::region_fits(i, chunks * 16, input.len(), alphabet)`.
#[inline(always)]
unsafe fn region(
    input: &[u8],
    i: usize,
    chunks: usize,
    classify: Classify<'_>,
    alphabet: &StructuralAlphabet,
    quotes: &mut QuoteState,
    idx: &mut StructuralIndex,
) {
    let mut mask = 0u64;
    let mut qmasks = [0u64; MAX_QUOTE_CLASSES];
    let mut bs = 0u64;
    let n_quotes = alphabet.quote_classes.len().min(MAX_QUOTE_CLASSES);
    for k in 0..chunks {
        // SAFETY: the caller's bound covers `input[i..i + 16 * chunks]`
        // and, with digraphs, the byte after it.
        let (chunk, next) = unsafe {
            let ptr = input.as_ptr().add(i + k * CHUNK);
            let next = if alphabet.digraph_pairs.is_empty() {
                u8x16_splat(0)
            } else {
                v128_load(ptr.add(1) as *const v128)
            };
            (v128_load(ptr as *const v128), next)
        };
        let shift = k * CHUNK;
        mask |= (classify_chunk(chunk, classify) as u64) << shift;
        for &(first, second) in alphabet.digraph_pairs {
            let both = v128_and(
                u8x16_eq(chunk, u8x16_splat(first)),
                u8x16_eq(next, u8x16_splat(second)),
            );
            mask |= (u8x16_bitmask(both) as u64) << shift;
        }
        for (slot, &q) in qmasks.iter_mut().zip(&alphabet.quote_classes[..n_quotes]) {
            *slot |= (u8x16_bitmask(u8x16_eq(chunk, u8x16_splat(q))) as u64) << shift;
        }
        bs |= (u8x16_bitmask(u8x16_eq(chunk, u8x16_splat(b'\\'))) as u64) << shift;
    }
    if !alphabet.quote_classes.is_empty() {
        mask &= !quotes.body(alphabet.quote_classes, qmasks, bs, (chunks * CHUNK) as u32);
    }
    if mask != 0 {
        compaction::compact_stripe_tzcnt(mask, i as u32, input, &mut idx.positions, &mut idx.kinds);
    }
}

#[inline(always)]
fn classify_chunk(chunk: v128, classify: Classify<'_>) -> u16 {
    match classify {
        Classify::Nibble { lo, hi, lo_mask } => {
            let lo_r = u8x16_swizzle(lo, v128_and(chunk, lo_mask));
            let hi_r = u8x16_swizzle(hi, u8x16_shr(chunk, 4));
            u8x16_bitmask(u8x16_ne(v128_and(lo_r, hi_r), u8x16_splat(0)))
        }
        Classify::Multi(singletons) => {
            let mut acc = u8x16_splat(0);
            for &target in singletons {
                acc = v128_or(acc, u8x16_eq(chunk, u8x16_splat(target)));
            }
            u8x16_bitmask(acc)
        }
    }
}

#[inline(always)]
fn u8x16_from(arr: [u8; 16]) -> v128 {
    u8x16(
        arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7], arr[8], arr[9], arr[10],
        arr[11], arr[12], arr[13], arr[14], arr[15],
    )
}

// ─────────────────────────── stage 1 (LW3.PERF-1a) ───────────────────────────

/// Mask of the bytes of `v` equal to any of `set`.
#[inline(always)]
fn eq_set(v: v128, set: &[u8]) -> u16 {
    let mut acc = u8x16_splat(0);
    for &b in set {
        acc = v128_or(acc, u8x16_eq(v, u8x16_splat(b)));
    }
    u8x16_bitmask(acc)
}

/// Mask of the positions of `chunk` where `seq` (one or two bytes)
/// begins; `next` is the 16 bytes one byte on.
#[inline(always)]
fn seq_mask(chunk: v128, next: v128, seq: &[u8]) -> u16 {
    let first = u8x16_eq(chunk, u8x16_splat(seq[0]));
    if seq.len() == 1 {
        u8x16_bitmask(first)
    } else {
        u8x16_bitmask(v128_and(first, u8x16_eq(next, u8x16_splat(seq[1]))))
    }
}

/// The fused UTF-8 validator's state (Keiser–Lemire lookup), 16 bytes a
/// step.
struct Utf8 {
    prev: v128,
    incomplete: v128,
    error: v128,
}

impl Utf8 {
    #[inline(always)]
    fn step(&mut self, input: v128) {
        use crate::stage1::utf8::{BYTE_1_HIGH, BYTE_1_LOW, BYTE_2_HIGH, FOURTH, THIRD};
        let lo = u8x16_splat(0x0F);
        let prev1 = i8x16_shuffle::<15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30>(
            self.prev, input,
        );
        let sc = v128_and(
            v128_and(
                u8x16_swizzle(u8x16_from(BYTE_1_HIGH), u8x16_shr(prev1, 4)),
                u8x16_swizzle(u8x16_from(BYTE_1_LOW), v128_and(prev1, lo)),
            ),
            u8x16_swizzle(u8x16_from(BYTE_2_HIGH), u8x16_shr(input, 4)),
        );
        let prev2 = i8x16_shuffle::<14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29>(
            self.prev, input,
        );
        let prev3 = i8x16_shuffle::<13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28>(
            self.prev, input,
        );
        let must = v128_and(
            v128_or(
                u8x16_sub_sat(prev2, u8x16_splat(THIRD)),
                u8x16_sub_sat(prev3, u8x16_splat(FOURTH)),
            ),
            u8x16_splat(0x80),
        );
        self.error = v128_or(self.error, v128_xor(must, sc));
        self.prev = input;
    }

    #[inline(always)]
    fn block(&mut self, c: [v128; 4]) {
        let any = v128_or(v128_or(c[0], c[1]), v128_or(c[2], c[3]));
        if u8x16_bitmask(any) == 0 {
            self.error = v128_or(self.error, self.incomplete);
            self.incomplete = u8x16_splat(0);
            self.prev = c[3];
            return;
        }
        for v in c {
            self.step(v);
        }
        self.incomplete = u8x16_sub_sat(c[3], u8x16_from(crate::stage1::utf8::INCOMPLETE_16));
    }
}

/// wasm32 SIMD128 stage 1 ([`crate::stage1`]).
pub(crate) fn stage1(
    input: crate::PaddedSlice<'_>,
    spec: &crate::Stage1Spec,
) -> Result<crate::Stage1Index, crate::Stage1Error> {
    use crate::stage1::{MAX_COMMENT_CLASSES, Raw, TAIL_MASK, drive, utf8_error};
    let alphabet = spec.alphabet();
    let classify = match KernelShape::select(alphabet) {
        KernelShape::NibbleLut => {
            let lut = NibbleLut::from_singletons(alphabet.singletons);
            Some(Classify::Nibble {
                lo: u8x16_from(lut.lo),
                hi: u8x16_from(lut.hi),
                lo_mask: u8x16_splat(0x0F),
            })
        }
        KernelShape::WideLut | KernelShape::MultiCmp => Some(Classify::Multi(alphabet.singletons)),
        KernelShape::Empty => None,
    };
    let mut utf8 = Utf8 {
        prev: u8x16_splat(0),
        incomplete: u8x16_splat(0),
        error: u8x16_splat(0),
    };
    let out = drive(input, spec, |ptr, n| {
        let mut raw = Raw::default();
        let mut c = [u8x16_splat(0); 4];
        for (k, slot) in c.iter_mut().enumerate() {
            // SAFETY: `drive`'s contract: 65 bytes are readable at `ptr`.
            let (chunk, next) = unsafe {
                let p = ptr.add(k * CHUNK);
                (v128_load(p as *const v128), v128_load(p.add(1) as *const v128))
            };
            let shift = k * CHUNK;
            if let Some(classify) = classify {
                raw.singles |= (classify_chunk(chunk, classify) as u64) << shift;
            }
            for &(first, second) in alphabet.digraph_pairs {
                raw.digraph |= (seq_mask(chunk, next, &[first, second]) as u64) << shift;
            }
            for (q, &b) in alphabet.quote_classes.iter().enumerate() {
                raw.quotes[q] |= (eq_set(chunk, &[b]) as u64) << shift;
            }
            raw.bs |= (eq_set(chunk, b"\\") as u64) << shift;
            raw.ws |= (eq_set(chunk, spec.whitespace()) as u64) << shift;
            for (cc, class) in spec.comments().iter().enumerate().take(MAX_COMMENT_CLASSES) {
                raw.open[cc] |= (seq_mask(chunk, next, class.open()) as u64) << shift;
                raw.close[cc] |= (seq_mask(chunk, next, class.close()) as u64) << shift;
            }
            *slot = if n < 64 {
                // SAFETY: reads `TAIL_MASK[64 - n + 16 k .. + 16]`, inside
                // its 128 bytes.
                let keep = unsafe { v128_load(TAIL_MASK.as_ptr().add(64 - n + shift) as *const v128) };
                v128_and(chunk, keep)
            } else {
                chunk
            };
        }
        utf8.block(c);
        raw
    });
    if !v128_any_true(v128_or(utf8.error, utf8.incomplete)) {
        Ok(out)
    } else {
        Err(utf8_error(input.bytes()))
    }
}

