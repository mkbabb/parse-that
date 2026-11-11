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
        KernelShape::Empty => StructuralIndex::new(),
        KernelShape::NibbleLut => {
            let lut = NibbleLut::from_singletons(alphabet.singletons);
            let classify = Classify::Nibble {
                lo: u8x16_from(lut.lo),
                hi: u8x16_from(lut.hi),
                lo_mask: u8x16_splat(0x0F),
            };
            run(input, alphabet, classify, &lut.expand())
        }
        KernelShape::WideLut | KernelShape::MultiCmp => {
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
