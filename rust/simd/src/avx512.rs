//! AVX-512 kernel (F + BW + VBMI2).
//!
//! One `__m512i` per 64-byte stripe: `_mm512_cmpeq_epi8_mask` yields the
//! stripe's 64-bit masks directly (no movemask), and VBMI2's
//! `_mm512_maskz_compress_epi8` compacts the structural positions and
//! kinds of a stripe in two instructions instead of a CTZ pop loop.
//! Quote state and the epilogue are the shared
//! [`crate::stripe::QuoteState`] and [`crate::stripe::epilogue`].
//!
//! # Dispatch
//!
//! Compiled into every x86_64 build under
//! `#[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]`;
//! [`crate::dispatch`] calls [`scan`] only after detecting all three.
//! No host this crate is developed on (Apple silicon; Rosetta 2 stops
//! at SSE4.2) can execute it: it is held to the scalar oracle only
//! where CI runs on AVX-512 hardware or under Intel SDE.

#![cfg(target_arch = "x86_64")]

use crate::StructuralIndex;
use crate::alphabet::{KernelShape, StructuralAlphabet};
use crate::stripe::{self, MAX_QUOTE_CLASSES, QuoteState, STRIPE};

use core::arch::x86_64::*;

/// AVX-512 entry point.
///
/// # Safety
/// The running CPU supports AVX-512 F, BW and VBMI2
/// (`Tier::Avx512.is_supported()`).
#[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
pub unsafe fn scan(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    if KernelShape::select(alphabet) == KernelShape::Empty {
        return StructuralIndex::new();
    }
    let mut byte_lut = [false; 256];
    for &b in alphabet.singletons {
        byte_lut[b as usize] = true;
    }
    let positions_pattern: [u8; 64] = core::array::from_fn(|k| k as u8);
    let mut idx = StructuralIndex::with_capacity(input.len() / 8 + 1);
    let mut quotes = QuoteState::default();
    let mut i = 0usize;

    // SAFETY: every load at `i` is bounded by `region_fits` (64 bytes,
    // +1 with digraphs); the pattern and staging buffers are 64 bytes.
    unsafe {
        let pos_v = _mm512_loadu_si512(positions_pattern.as_ptr().cast());
        while stripe::region_fits(i, STRIPE, input.len(), alphabet) {
            let ptr = input.as_ptr().add(i);
            let chunk = _mm512_loadu_si512(ptr.cast());
            let mut mask: u64 = 0;
            for &target in alphabet.singletons {
                mask |= _mm512_cmpeq_epi8_mask(chunk, _mm512_set1_epi8(target as i8));
            }
            if !alphabet.digraph_pairs.is_empty() {
                let next = _mm512_loadu_si512(ptr.add(1).cast());
                for &(first, second) in alphabet.digraph_pairs {
                    let f_eq = _mm512_cmpeq_epi8_mask(chunk, _mm512_set1_epi8(first as i8));
                    let s_eq = _mm512_cmpeq_epi8_mask(next, _mm512_set1_epi8(second as i8));
                    mask |= f_eq & s_eq;
                }
            }
            if !alphabet.quote_classes.is_empty() {
                let mut qmasks = [0u64; MAX_QUOTE_CLASSES];
                for (qi, &q) in alphabet.quote_classes.iter().enumerate() {
                    qmasks[qi] = _mm512_cmpeq_epi8_mask(chunk, _mm512_set1_epi8(q as i8));
                }
                let bs = _mm512_cmpeq_epi8_mask(chunk, _mm512_set1_epi8(b'\\' as i8));
                mask &= !quotes.body(alphabet.quote_classes, qmasks, bs, STRIPE as u32);
            }

            let count = mask.count_ones() as usize;
            if count > 0 {
                let mut pos_buf = [0u8; 64];
                let mut kind_buf = [0u8; 64];
                _mm512_storeu_si512(
                    pos_buf.as_mut_ptr().cast(),
                    _mm512_maskz_compress_epi8(mask, pos_v),
                );
                _mm512_storeu_si512(
                    kind_buf.as_mut_ptr().cast(),
                    _mm512_maskz_compress_epi8(mask, chunk),
                );
                idx.positions.reserve(count);
                idx.kinds.reserve(count);
                for k in 0..count {
                    idx.positions.push(i as u32 + pos_buf[k] as u32);
                    idx.kinds.push(kind_buf[k]);
                }
            }
            i += STRIPE;
        }
    }
    stripe::epilogue(input, i, alphabet, &byte_lut, &mut quotes, &mut idx);
    idx
}
