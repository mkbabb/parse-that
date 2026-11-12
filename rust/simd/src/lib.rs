//! `parse-that-simd`: SIMD structural-byte scanning kernels.
//!
//! # Role
//!
//! A parser that dispatches on a small set of structural bytes (brackets,
//! separators, quotes, two-byte digraphs such as `/*`) can find them all
//! in one pass and then jump between them, instead of reading every byte.
//! [`scan_structural`] builds that [`StructuralIndex`]: a dense list of
//! `(position, kind)` pairs for every structural byte outside a string
//! literal, under a per-grammar [`StructuralAlphabet`].
//!
//! This crate is the only `core::arch` code in parse-that. `parse_that`
//! re-exports it as `parse_that::scan`. It has no dependencies.
//!
//! # Architecture
//!
//! Per-arch kernels are sibling modules:
//!
//! - [`neon`] — aarch64 NEON; nibble-LUT + wide-LUT + `vextq_u8`
//!   digraph compare + 6-op shift-XOR (or PMULL64) parity.
//! - [`avx2`] — x86_64 AVX2; `_mm256_cmpeq_epi8` + `_mm256_movemask_epi8`
//!   + PCLMULQDQ parity.
//! - [`avx512`] — x86_64 AVX-512 F + BW + VBMI2; `_mm512_maskz_compress_epi8`
//!   for index compaction.
//! - [`wasm`] — wasm32 SIMD; `i8x16.swizzle` + `i8x16.bitmask`.
//! - [`scalar`] — portable fallback; correctness reference for
//!   `tests/fuzz.rs`.
//!
//! [`prim`] holds the block primitives (one 64- or 16-byte block
//! classified against caller data) that a scanner with its own loop
//! composes; each has a scalar oracle and a NEON body, selected by the
//! same tier decision.
//!
//! Helpers:
//!
//! - [`alphabet`] — `StructuralAlphabet` config + `KernelShape`
//!   selector + nibble-LUT / wide-LUT helpers.
//! - [`compaction`] — bitmap → `Vec<u32>` index compaction
//!   (`tzcnt` loop).
//! - [`parity`] — quote-state computation; CLMUL or shift-XOR.
//!
//! # Entry point
//!
//! [`scan_structural`] is the public API; it runs the best tier the CPU
//! supports ([`dispatch::selected_tier`], detected once). Every ISA tier
//! of the target architecture is compiled into a default build; kernel
//! bodies carry `#[target_feature]`, never `cfg(target_feature)`.
//! Output is byte-identical across all tiers (`tests/dispatch_tiers.rs`
//! holds every tier the host can run to [`scalar::scan`];
//! `tests/guard_page.rs` proves no tier reads past its input).

#![warn(missing_docs)]

pub mod alphabet;
pub mod compaction;
pub mod dispatch;
pub mod index;
pub mod padded;
pub mod parity;
pub mod prim;
pub mod scalar;
pub mod stage1;
#[cfg(any(
    target_arch = "aarch64",
    target_arch = "x86_64",
    all(target_arch = "wasm32", target_feature = "simd128")
))]
mod stripe;

#[cfg(target_arch = "aarch64")]
pub mod neon;

#[cfg(target_arch = "x86_64")]
pub mod avx2;

#[cfg(target_arch = "x86_64")]
pub mod avx512;

#[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
pub mod wasm;

pub use alphabet::{KernelShape, NibbleLut, StructuralAlphabet, WideLut};
pub use dispatch::{TIER_ENV, Tier, compiled_tiers, scan_with, selected_tier, stage1_with};
pub use index::{Stage1Index, StructuralIndex, next_structural_at_or_after};
pub use padded::{PADDING, PaddedInput, PaddedSlice};
pub use stage1::{CommentClass, MAX_COMMENT_CLASSES, Stage1Error, Stage1Spec, stage1};

/// Build the [`StructuralIndex`] for `input` under `alphabet`.
///
/// Runs the best tier the running CPU supports
/// ([`dispatch::selected_tier`]). Output is byte-identical across all
/// tiers.
///
/// A structural byte inside a string literal is not structural: here
/// the `,` and `:` inside `"a,b:c"` are skipped.
///
/// ```
/// use parse_that_simd::{StructuralAlphabet, scan_structural};
///
/// const JSON: StructuralAlphabet = StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\"");
/// let index = scan_structural(br#"{"a,b:c": [1, 2]}"#, &JSON);
/// assert_eq!(index.positions, [0, 8, 10, 12, 15, 16]);
/// assert_eq!(index.kinds, b"{:[,]}");
/// ```
pub fn scan_structural(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    dispatch::scan_selected(input, alphabet)
}
