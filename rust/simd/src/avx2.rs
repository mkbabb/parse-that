//! AVX2 kernel.
//!
//! 32-byte stripes (one `__m256i` chunk per stripe). Two stripes
//! make a 64-byte block matching the NEON-side stripe; we keep the
//! 32-byte primitive and OR pairs into 64-bit masks for output
//! parity with the NEON shape.
//!
//! Per chunk:
//! - **Singletons** (any cardinality): per-singleton `_mm256_cmpeq_epi8`
//!   and an OR-reduce. `<= 8` enables a `_mm256_shuffle_epi8` nibble-LUT
//!   path that pays one shuffle per chunk instead of N comparisons.
//! - **Movemask**: `_mm256_movemask_epi8` → `u32` chunk mask.
//!
//! Per pair-of-chunks (== 64 B stripe):
//! - **Digraphs**: per-pair shifted-compare via unaligned next-chunk
//!   load, AND with first-byte mask.
//! - **Quotes**: per-class `_mm256_cmpeq_epi8` masks plus the backslash
//!   mask, folded by the shared [`crate::stripe::QuoteState`] (escape
//!   parity, per-class string state); bytes past the last stripe go
//!   through the shared [`crate::stripe::epilogue`].
//!
//! # Dispatch
//!
//! Compiled into every x86_64 build: the bodies carry
//! `#[target_feature(enable = "avx2")]`, so the build's baseline never
//! hides the tier, and [`crate::dispatch`] calls [`scan`] only after
//! `is_x86_feature_detected!("avx2")`.

#![cfg(target_arch = "x86_64")]

use crate::StructuralIndex;
use crate::alphabet::{KernelShape, NibbleLut, StructuralAlphabet};
use crate::compaction;
use crate::stripe::{self, MAX_QUOTE_CLASSES, QuoteState, STRIPE};

use core::arch::x86_64::*;

const CHUNK: usize = 32;

/// AVX2 entry point.
///
/// # Safety
/// The running CPU supports AVX2 (`Tier::Avx2.is_supported()`).
#[target_feature(enable = "avx2")]
pub unsafe fn scan(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    match KernelShape::select(alphabet) {
        // No singletons: digraphs alone, through the compare path.
        KernelShape::Empty if alphabet.digraph_pairs.is_empty() => StructuralIndex::new(),
        KernelShape::NibbleLut => scan_nibble(input, alphabet),
        KernelShape::Empty | KernelShape::WideLut | KernelShape::MultiCmp => {
            scan_multi(input, alphabet)
        }
    }
}

#[target_feature(enable = "avx2")]
fn scan_nibble(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    let lut = NibbleLut::from_singletons(alphabet.singletons);
    let byte_lut = lut.expand();
    let mut idx = StructuralIndex::with_capacity(input.len() / 8 + 1);
    let mut quotes = QuoteState::default();
    // `_mm256_shuffle_epi8` looks up within each 16-byte half, so the
    // same 16-byte LUT fills both halves.
    let lo_v = broadcast_16(lut.lo);
    let hi_v = broadcast_16(lut.hi);
    let mut i = 0usize;
    while stripe::region_fits(i, STRIPE, input.len(), alphabet) {
        // SAFETY: `region_fits` bounds `i..i + 64` (+1 with digraphs).
        unsafe {
            let ptr = input.as_ptr().add(i);
            let mask = classify_nibble(ptr, lo_v, hi_v) as u64
                | (classify_nibble(ptr.add(CHUNK), lo_v, hi_v) as u64) << 32;
            finish_stripe(input, i, mask, alphabet, &mut quotes, &mut idx);
        }
        i += STRIPE;
    }
    stripe::epilogue(input, i, alphabet, &byte_lut, &mut quotes, &mut idx);
    idx
}

#[target_feature(enable = "avx2")]
fn scan_multi(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    let mut byte_lut = [false; 256];
    for &b in alphabet.singletons {
        byte_lut[b as usize] = true;
    }
    let mut idx = StructuralIndex::with_capacity(input.len() / 8 + 1);
    let mut quotes = QuoteState::default();
    let mut i = 0usize;
    while stripe::region_fits(i, STRIPE, input.len(), alphabet) {
        // SAFETY: `region_fits` bounds `i..i + 64` (+1 with digraphs).
        unsafe {
            let ptr = input.as_ptr().add(i);
            let mask = classify_multi(ptr, alphabet.singletons) as u64
                | (classify_multi(ptr.add(CHUNK), alphabet.singletons) as u64) << 32;
            finish_stripe(input, i, mask, alphabet, &mut quotes, &mut idx);
        }
        i += STRIPE;
    }
    stripe::epilogue(input, i, alphabet, &byte_lut, &mut quotes, &mut idx);
    idx
}

/// Mask out string bodies and compact one stripe's structural bytes.
///
/// # Safety
/// `input[i..i + 64]` is in bounds, plus one byte past it when the
/// alphabet has digraphs.
#[target_feature(enable = "avx2")]
#[inline]
unsafe fn finish_stripe(
    input: &[u8],
    i: usize,
    mut mask: u64,
    alphabet: &StructuralAlphabet,
    quotes: &mut QuoteState,
    idx: &mut StructuralIndex,
) {
    // SAFETY: per the contract above.
    unsafe {
        let ptr = input.as_ptr().add(i);
        if !alphabet.digraph_pairs.is_empty() {
            mask |= digraph_stripe(ptr, alphabet.digraph_pairs);
        }
        if !alphabet.quote_classes.is_empty() {
            let mut qmasks = [0u64; MAX_QUOTE_CLASSES];
            let bs = raw_quotes_and_bs(ptr, alphabet.quote_classes, &mut qmasks);
            mask &= !quotes.body(alphabet.quote_classes, qmasks, bs, STRIPE as u32);
        }
    }
    if mask != 0 {
        compaction::compact_stripe_tzcnt(mask, i as u32, input, &mut idx.positions, &mut idx.kinds);
    }
}

/// # Safety
/// `ptr..ptr + 32` is in bounds.
#[target_feature(enable = "avx2")]
#[inline]
unsafe fn classify_nibble(ptr: *const u8, lo_v: __m256i, hi_v: __m256i) -> u32 {
    // SAFETY: per the contract above.
    unsafe {
        let chunk = _mm256_loadu_si256(ptr.cast());
        let lo_mask = _mm256_set1_epi8(0x0F);
        let lo_n = _mm256_and_si256(chunk, lo_mask);
        let hi_n = _mm256_and_si256(_mm256_srli_epi16(chunk, 4), lo_mask);
        let matched = _mm256_and_si256(
            _mm256_shuffle_epi8(lo_v, lo_n),
            _mm256_shuffle_epi8(hi_v, hi_n),
        );
        // A lane matches iff any LUT bit survives. Compare against zero
        // and invert: a signed `> 0` test would drop singleton 7 (0x80).
        let none = _mm256_cmpeq_epi8(matched, _mm256_setzero_si256());
        !(_mm256_movemask_epi8(none) as u32)
    }
}

/// # Safety
/// `ptr..ptr + 32` is in bounds.
#[target_feature(enable = "avx2")]
#[inline]
unsafe fn classify_multi(ptr: *const u8, singletons: &[u8]) -> u32 {
    // SAFETY: per the contract above.
    unsafe {
        let chunk = _mm256_loadu_si256(ptr.cast());
        let mut acc = _mm256_setzero_si256();
        for &target in singletons {
            acc = _mm256_or_si256(
                acc,
                _mm256_cmpeq_epi8(chunk, _mm256_set1_epi8(target as i8)),
            );
        }
        _mm256_movemask_epi8(acc) as u32
    }
}

/// Digraph first-byte mask over one stripe.
///
/// # Safety
/// `ptr..ptr + 65` is in bounds (the second-byte compare reads one byte
/// past the stripe).
#[target_feature(enable = "avx2")]
#[inline]
unsafe fn digraph_stripe(ptr: *const u8, pairs: &[(u8, u8)]) -> u64 {
    let mut mask = 0u64;
    // SAFETY: per the contract above.
    unsafe {
        for &(first, second) in pairs {
            for k in 0..2 {
                let chunk = _mm256_loadu_si256(ptr.add(k * CHUNK).cast());
                let next = _mm256_loadu_si256(ptr.add(k * CHUNK + 1).cast());
                let f_eq = _mm256_cmpeq_epi8(chunk, _mm256_set1_epi8(first as i8));
                let s_eq = _mm256_cmpeq_epi8(next, _mm256_set1_epi8(second as i8));
                let m = _mm256_movemask_epi8(_mm256_and_si256(f_eq, s_eq)) as u32 as u64;
                mask |= m << (k * CHUNK);
            }
        }
    }
    mask
}

/// Per-class raw quote masks (into `out`) and the backslash mask (the
/// return value) over one stripe.
///
/// # Safety
/// `ptr..ptr + 64` is in bounds.
#[target_feature(enable = "avx2")]
#[inline]
unsafe fn raw_quotes_and_bs(
    ptr: *const u8,
    quotes: &[u8],
    out: &mut [u64; MAX_QUOTE_CLASSES],
) -> u64 {
    let mut bsmask = 0u64;
    // SAFETY: per the contract above.
    unsafe {
        for k in 0..2 {
            let chunk = _mm256_loadu_si256(ptr.add(k * CHUNK).cast());
            for (qi, &q) in quotes.iter().enumerate() {
                let eq = _mm256_cmpeq_epi8(chunk, _mm256_set1_epi8(q as i8));
                out[qi] |= (_mm256_movemask_epi8(eq) as u32 as u64) << (k * CHUNK);
            }
            let bs = _mm256_cmpeq_epi8(chunk, _mm256_set1_epi8(b'\\' as i8));
            bsmask |= (_mm256_movemask_epi8(bs) as u32 as u64) << (k * CHUNK);
        }
    }
    bsmask
}

#[target_feature(enable = "avx2")]
#[inline]
fn broadcast_16(lut: [u8; 16]) -> __m256i {
    // SAFETY: reads exactly the 16 bytes of `lut`.
    unsafe { _mm256_broadcastsi128_si256(_mm_loadu_si128(lut.as_ptr().cast())) }
}

// ─────────────────────────── stage 1 (LW3.PERF-1a) ───────────────────────────

/// Bitmask of the bytes of the 64-byte stripe at `ptr` equal to any of `set`.
///
/// # Safety
/// AVX2 is present; `ptr..ptr + 64` is readable.
#[target_feature(enable = "avx2")]
#[inline]
unsafe fn eq_set_stripe(ptr: *const u8, set: &[u8]) -> u64 {
    if set.is_empty() {
        return 0;
    }
    let mut mask = 0u64;
    // SAFETY: per the contract above.
    unsafe {
        for k in 0..2 {
            let chunk = _mm256_loadu_si256(ptr.add(k * CHUNK).cast());
            let mut acc = _mm256_setzero_si256();
            for &b in set {
                acc = _mm256_or_si256(acc, _mm256_cmpeq_epi8(chunk, _mm256_set1_epi8(b as i8)));
            }
            mask |= (_mm256_movemask_epi8(acc) as u32 as u64) << (k * CHUNK);
        }
    }
    mask
}

/// Bitmask of the positions of the stripe at `ptr` where `seq` (one or
/// two bytes) begins.
///
/// # Safety
/// AVX2 is present; `ptr..ptr + 65` is readable.
#[target_feature(enable = "avx2")]
#[inline]
unsafe fn seq_stripe(ptr: *const u8, seq: &[u8]) -> u64 {
    // SAFETY: per the contract above.
    unsafe {
        if seq.len() == 1 {
            eq_set_stripe(ptr, seq)
        } else {
            digraph_stripe(ptr, &[(seq[0], seq[1])])
        }
    }
}

/// Each byte's high nibble.
#[target_feature(enable = "avx2")]
#[inline]
fn high_nibbles(v: __m256i) -> __m256i {
    _mm256_and_si256(_mm256_srli_epi16::<4>(v), _mm256_set1_epi8(0x0F))
}

/// The fused UTF-8 validator's state (Keiser–Lemire lookup), 32 bytes a
/// step.
struct Utf8 {
    prev: __m256i,
    incomplete: __m256i,
    error: __m256i,
}

/// `[prev | input]` shifted right by `16 - N` bytes across the lane
/// boundary: each byte's `N`th predecessor.
macro_rules! prev_n {
    ($input:expr, $prev:expr, $n:literal) => {
        _mm256_alignr_epi8::<{ 16 - $n }>(
            $input,
            _mm256_permute2x128_si256::<0x21>($prev, $input),
        )
    };
}

impl Utf8 {
    /// # Safety
    /// AVX2 is present.
    #[target_feature(enable = "avx2")]
    #[inline]
    unsafe fn new() -> Self {
        Utf8 {
            prev: _mm256_setzero_si256(),
            incomplete: _mm256_setzero_si256(),
            error: _mm256_setzero_si256(),
        }
    }

    /// # Safety
    /// AVX2 is present.
    #[target_feature(enable = "avx2")]
    #[inline]
    unsafe fn step(&mut self, input: __m256i) {
        use crate::stage1::utf8::{BYTE_1_HIGH, BYTE_1_LOW, BYTE_2_HIGH, FOURTH, THIRD};
        let lo = _mm256_set1_epi8(0x0F);
        let prev1 = prev_n!(input, self.prev, 1);
        let sc = _mm256_and_si256(
            _mm256_and_si256(
                _mm256_shuffle_epi8(broadcast_16(BYTE_1_HIGH), high_nibbles(prev1)),
                _mm256_shuffle_epi8(broadcast_16(BYTE_1_LOW), _mm256_and_si256(prev1, lo)),
            ),
            _mm256_shuffle_epi8(broadcast_16(BYTE_2_HIGH), high_nibbles(input)),
        );
        let prev2 = prev_n!(input, self.prev, 2);
        let prev3 = prev_n!(input, self.prev, 3);
        let must = _mm256_and_si256(
            _mm256_or_si256(
                _mm256_subs_epu8(prev2, _mm256_set1_epi8(THIRD as i8)),
                _mm256_subs_epu8(prev3, _mm256_set1_epi8(FOURTH as i8)),
            ),
            _mm256_set1_epi8(0x80u8 as i8),
        );
        self.error = _mm256_or_si256(self.error, _mm256_xor_si256(must, sc));
        self.prev = input;
    }

    /// The block at `ptr`, its first `n` bytes kept and the rest zeroed.
    ///
    /// # Safety
    /// AVX2 is present; `ptr..ptr + 64` is readable.
    #[target_feature(enable = "avx2")]
    #[inline]
    unsafe fn block(&mut self, ptr: *const u8, n: usize) {
        // SAFETY: per the contract above; the mask loads read
        // `TAIL_MASK[64 - n + 32 k .. + 32]`, inside its 128 bytes.
        unsafe {
            let mut c = [
                _mm256_loadu_si256(ptr.cast()),
                _mm256_loadu_si256(ptr.add(32).cast()),
            ];
            if n < 64 {
                let mask = crate::stage1::TAIL_MASK.as_ptr().add(64 - n);
                for (k, v) in c.iter_mut().enumerate() {
                    *v = _mm256_and_si256(*v, _mm256_loadu_si256(mask.add(32 * k).cast()));
                }
            }
            if _mm256_movemask_epi8(_mm256_or_si256(c[0], c[1])) == 0 {
                self.error = _mm256_or_si256(self.error, self.incomplete);
                self.incomplete = _mm256_setzero_si256();
                self.prev = c[1];
                return;
            }
            self.step(c[0]);
            self.step(c[1]);
            // The last 16 bytes' cut-off thresholds; nothing in the first 16
            // can be cut off by the block's end.
            let max = _mm256_inserti128_si256::<1>(
                _mm256_set1_epi8(-1),
                _mm_loadu_si128(crate::stage1::utf8::INCOMPLETE_16.as_ptr().cast()),
            );
            self.incomplete = _mm256_subs_epu8(c[1], max);
        }
    }

    /// # Safety
    /// AVX2 is present.
    #[target_feature(enable = "avx2")]
    #[inline]
    unsafe fn valid(&self) -> bool {
        let e = _mm256_or_si256(self.error, self.incomplete);
        _mm256_testz_si256(e, e) == 1
    }
}

/// AVX2 stage 1 ([`crate::stage1`]).
///
/// # Safety
/// The running CPU supports AVX2 (`Tier::Avx2.is_supported()`).
#[target_feature(enable = "avx2")]
pub(crate) unsafe fn stage1(
    input: crate::PaddedSlice<'_>,
    spec: &crate::Stage1Spec,
) -> Result<crate::Stage1Index, crate::Stage1Error> {
    use crate::stage1::{MAX_COMMENT_CLASSES, Raw, drive, utf8_error};
    let alphabet = spec.alphabet();
    let shape = KernelShape::select(alphabet);
    let lut = NibbleLut::from_singletons(if shape == KernelShape::NibbleLut {
        alphabet.singletons
    } else {
        &[]
    });
    let lo_v = broadcast_16(lut.lo);
    let hi_v = broadcast_16(lut.hi);
    // SAFETY: the caller guarantees AVX2.
    let mut utf8 = unsafe { Utf8::new() };
    let out = drive(input, spec, |ptr, n| {
        let mut raw = Raw::default();
        // SAFETY: AVX2 per the caller; `drive`'s contract: 65 bytes are
        // readable at `ptr`.
        unsafe {
            raw.singles = match shape {
                KernelShape::Empty => 0,
                KernelShape::NibbleLut => {
                    classify_nibble(ptr, lo_v, hi_v) as u64
                        | (classify_nibble(ptr.add(CHUNK), lo_v, hi_v) as u64) << 32
                }
                KernelShape::WideLut | KernelShape::MultiCmp => {
                    classify_multi(ptr, alphabet.singletons) as u64
                        | (classify_multi(ptr.add(CHUNK), alphabet.singletons) as u64) << 32
                }
            };
            if !alphabet.digraph_pairs.is_empty() {
                raw.digraph = digraph_stripe(ptr, alphabet.digraph_pairs);
            }
            raw.bs = raw_quotes_and_bs(ptr, alphabet.quote_classes, &mut raw.quotes);
            raw.ws = eq_set_stripe(ptr, spec.whitespace());
            for (c, class) in spec.comments().iter().enumerate().take(MAX_COMMENT_CLASSES) {
                raw.open[c] = seq_stripe(ptr, class.open());
                raw.close[c] = seq_stripe(ptr, class.close());
            }
            utf8.block(ptr, n);
        }
        raw
    });
    // SAFETY: the caller guarantees AVX2.
    if unsafe { utf8.valid() } {
        Ok(out)
    } else {
        Err(utf8_error(input.bytes()))
    }
}

