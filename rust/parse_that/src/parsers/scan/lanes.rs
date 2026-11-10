//! 16-byte lane primitives for the scan kernels: one contract, two planes.
//!
//! Every scan kernel in this crate classifies input 16 bytes at a time and
//! reduces each chunk to a 16-bit mask (bit `i` is byte `i`). The kernels
//! are written once, over the three primitives here:
//!
//! - [`load`]: the first 16 bytes of a slice as a [`Chunk`];
//! - [`eq_mask`]: the bytes equal to one needle;
//! - [`NibbleLut::mask`]: the bytes in a set given as a nibble-LUT pair
//!   (`lo[b & 0xF] & hi[b >> 4] != 0`, the `pshufb`/`tbl` classifier).
//!
//! The default (stable) plane computes them with scalar loops over
//! `[u8; 16]`; that plane is the oracle. The opt-in `nightly` feature
//! computes them with `std::simd::u8x16` (portable SIMD). Both planes
//! return identical masks for every input, which `tests/lanes_test.rs`
//! checks exhaustively over the byte alphabet. `parse-that-simd`
//! (sk-v27 LW2.PERF-1) replaces the `nightly` plane with its runtime
//! dispatch table over `core::arch`.

#[cfg(feature = "nightly")]
mod plane {
    use std::simd::prelude::*;

    /// One 16-byte chunk of input.
    pub type Chunk = u8x16;

    #[inline(always)]
    pub fn load(bytes: &[u8]) -> Chunk {
        u8x16::from_slice(&bytes[..16])
    }

    #[inline(always)]
    pub fn to_array(chunk: Chunk) -> [u8; 16] {
        chunk.to_array()
    }

    #[inline(always)]
    pub fn eq_mask(chunk: Chunk, needle: u8) -> u16 {
        chunk.simd_eq(u8x16::splat(needle)).to_bitmask() as u16
    }

    /// A byte set as a nibble-LUT pair, prepared for this plane.
    #[derive(Clone, Copy, Debug)]
    pub struct NibbleLut {
        lo: u8x16,
        hi: u8x16,
    }

    impl NibbleLut {
        #[inline(always)]
        pub fn new(lo: &[u8; 16], hi: &[u8; 16]) -> Self {
            Self {
                lo: u8x16::from_array(*lo),
                hi: u8x16::from_array(*hi),
            }
        }

        #[inline(always)]
        pub fn mask(&self, chunk: Chunk) -> u16 {
            let lo_r = self.lo.swizzle_dyn(chunk & u8x16::splat(0x0F));
            let hi_r = self.hi.swizzle_dyn(chunk >> 4);
            (lo_r & hi_r).simd_ne(u8x16::splat(0)).to_bitmask() as u16
        }
    }
}

#[cfg(not(feature = "nightly"))]
mod plane {
    /// One 16-byte chunk of input.
    pub type Chunk = [u8; 16];

    #[inline(always)]
    pub fn load(bytes: &[u8]) -> Chunk {
        let mut chunk = [0u8; 16];
        chunk.copy_from_slice(&bytes[..16]);
        chunk
    }

    #[inline(always)]
    pub fn to_array(chunk: Chunk) -> [u8; 16] {
        chunk
    }

    #[inline(always)]
    pub fn eq_mask(chunk: Chunk, needle: u8) -> u16 {
        let mut mask = 0u16;
        for (i, &b) in chunk.iter().enumerate() {
            mask |= ((b == needle) as u16) << i;
        }
        mask
    }

    /// A byte set as a nibble-LUT pair, prepared for this plane.
    #[derive(Clone, Copy, Debug)]
    pub struct NibbleLut {
        lo: [u8; 16],
        hi: [u8; 16],
    }

    impl NibbleLut {
        #[inline(always)]
        pub fn new(lo: &[u8; 16], hi: &[u8; 16]) -> Self {
            Self { lo: *lo, hi: *hi }
        }

        #[inline(always)]
        pub fn mask(&self, chunk: Chunk) -> u16 {
            let mut mask = 0u16;
            for (i, &b) in chunk.iter().enumerate() {
                let hit = self.lo[(b & 0x0F) as usize] & self.hi[(b >> 4) as usize] != 0;
                mask |= (hit as u16) << i;
            }
            mask
        }
    }
}

pub use plane::{Chunk, NibbleLut, eq_mask, load, to_array};
