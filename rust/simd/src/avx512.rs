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
    if KernelShape::select(alphabet) == KernelShape::Empty && alphabet.digraph_pairs.is_empty() {
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

// ─────────────────────────── stage 1 (LW3.PERF-1a) ───────────────────────────

/// Mask of the bytes of `v` equal to any of `set`.
#[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
#[inline]
fn eq_set(v: __m512i, set: &[u8]) -> u64 {
    let mut m = 0u64;
    for &b in set {
        m |= _mm512_cmpeq_epi8_mask(v, _mm512_set1_epi8(b as i8));
    }
    m
}

/// Mask of the positions of `chunk` where `seq` (one or two bytes)
/// begins; `next` is the 64 bytes one byte on.
#[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
#[inline]
fn seq_mask(chunk: __m512i, next: __m512i, seq: &[u8]) -> u64 {
    let first = _mm512_cmpeq_epi8_mask(chunk, _mm512_set1_epi8(seq[0] as i8));
    if seq.len() == 1 {
        first
    } else {
        first & _mm512_cmpeq_epi8_mask(next, _mm512_set1_epi8(seq[1] as i8))
    }
}

/// Each byte's high nibble.
#[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
#[inline]
fn high_nibbles(v: __m512i) -> __m512i {
    _mm512_and_si512(_mm512_srli_epi16::<4>(v), _mm512_set1_epi8(0x0F))
}

/// A 16-byte table in all four 128-bit lanes.
#[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
#[inline]
fn broadcast_16(t: &[u8; 16]) -> __m512i {
    // SAFETY: reads exactly the 16 bytes of `t`.
    unsafe { _mm512_broadcast_i32x4(_mm_loadu_si128(t.as_ptr().cast())) }
}

/// `[prev | input]` shifted right by `16 - N` bytes across every lane
/// boundary: each byte's `N`th predecessor.
macro_rules! prev_n {
    ($input:expr, $prev:expr, $n:literal) => {
        _mm512_alignr_epi8::<{ 16 - $n }>(
            $input,
            _mm512_permutex2var_epi64($prev, _mm512_set_epi64(13, 12, 11, 10, 9, 8, 7, 6), $input),
        )
    };
}

/// The fused UTF-8 validator's state (Keiser–Lemire lookup), 64 bytes a
/// step.
struct Utf8 {
    prev: __m512i,
    incomplete: __m512i,
    error: __m512i,
}

impl Utf8 {
    #[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
    #[inline]
    fn new() -> Self {
        Utf8 {
            prev: _mm512_setzero_si512(),
            incomplete: _mm512_setzero_si512(),
            error: _mm512_setzero_si512(),
        }
    }

    /// One block, its bytes past the input's end already zeroed.
    #[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
    #[inline]
    fn block(&mut self, input: __m512i) {
        use crate::stage1::utf8::{BYTE_1_HIGH, BYTE_1_LOW, BYTE_2_HIGH, FOURTH, THIRD};
        if _mm512_movepi8_mask(input) == 0 {
            self.error = _mm512_or_si512(self.error, self.incomplete);
            self.incomplete = _mm512_setzero_si512();
            self.prev = input;
            return;
        }
        let lo = _mm512_set1_epi8(0x0F);
        let prev1 = prev_n!(input, self.prev, 1);
        let sc = _mm512_and_si512(
            _mm512_and_si512(
                _mm512_shuffle_epi8(broadcast_16(&BYTE_1_HIGH), high_nibbles(prev1)),
                _mm512_shuffle_epi8(broadcast_16(&BYTE_1_LOW), _mm512_and_si512(prev1, lo)),
            ),
            _mm512_shuffle_epi8(broadcast_16(&BYTE_2_HIGH), high_nibbles(input)),
        );
        let prev2 = prev_n!(input, self.prev, 2);
        let prev3 = prev_n!(input, self.prev, 3);
        let must = _mm512_and_si512(
            _mm512_or_si512(
                _mm512_subs_epu8(prev2, _mm512_set1_epi8(THIRD as i8)),
                _mm512_subs_epu8(prev3, _mm512_set1_epi8(FOURTH as i8)),
            ),
            _mm512_set1_epi8(0x80u8 as i8),
        );
        self.error = _mm512_or_si512(self.error, _mm512_xor_si512(must, sc));
        // The last 16 bytes' cut-off thresholds in the top lane.
        // SAFETY: reads the 16 bytes of the table.
        let max = _mm512_inserti32x4::<3>(_mm512_set1_epi8(-1), unsafe {
            _mm_loadu_si128(crate::stage1::utf8::INCOMPLETE_16.as_ptr().cast())
        });
        self.incomplete = _mm512_subs_epu8(input, max);
        self.prev = input;
    }

    #[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
    #[inline]
    fn valid(&self) -> bool {
        let e = _mm512_or_si512(self.error, self.incomplete);
        _mm512_test_epi8_mask(e, e) == 0
    }
}

/// AVX-512 stage 1 ([`crate::stage1`]).
///
/// # Safety
/// The running CPU supports AVX-512 F, BW and VBMI2.
#[target_feature(enable = "avx512f,avx512bw,avx512vbmi2")]
pub(crate) unsafe fn stage1(
    input: crate::PaddedSlice<'_>,
    spec: &crate::Stage1Spec,
) -> Result<crate::Stage1Index, crate::Stage1Error> {
    use crate::stage1::{MAX_COMMENT_CLASSES, Raw, drive, utf8_error};
    let alphabet = spec.alphabet();
    let mut utf8 = Utf8::new();
    let out = drive(input, spec, |ptr, n| {
        // SAFETY: `drive`'s contract: 65 bytes are readable at `ptr`.
        let (chunk, next) = unsafe {
            (
                _mm512_loadu_si512(ptr.cast()),
                _mm512_loadu_si512(ptr.add(1).cast()),
            )
        };
        let mut raw = Raw {
            singles: eq_set(chunk, alphabet.singletons),
            ..Raw::default()
        };
        for &(first, second) in alphabet.digraph_pairs {
            raw.digraph |= seq_mask(chunk, next, &[first, second]);
        }
        for (k, &q) in alphabet.quote_classes.iter().enumerate() {
            raw.quotes[k] = _mm512_cmpeq_epi8_mask(chunk, _mm512_set1_epi8(q as i8));
        }
        raw.bs = _mm512_cmpeq_epi8_mask(chunk, _mm512_set1_epi8(b'\\' as i8));
        raw.ws = eq_set(chunk, spec.whitespace());
        for (c, class) in spec.comments().iter().enumerate().take(MAX_COMMENT_CLASSES) {
            raw.open[c] = seq_mask(chunk, next, class.open());
            raw.close[c] = seq_mask(chunk, next, class.close());
        }
        let keep = if n >= 64 { u64::MAX } else { (1u64 << n) - 1 };
        utf8.block(_mm512_maskz_mov_epi8(keep, chunk));
        raw
    });
    if utf8.valid() {
        Ok(out)
    } else {
        Err(utf8_error(input.bytes()))
    }
}

