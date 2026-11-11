//! `StructuralAlphabet` — the per-grammar configuration the SIMD
//! scanner consumes.
//!
//! A parser generator mines the alphabet from its grammar and emits
//! one `static` per grammar; the kernel picks its strategy from the
//! alphabet's cardinality ([`KernelShape`]).
//!
//! Held entirely as `&'static` slices so the type is `Copy` and lives
//! in `.rodata`; no allocation, no generic parameters.

/// Per-grammar structural-byte configuration consumed by the kernel.
///
/// The four fields drive the `KernelShape` selector below; the kernel
/// itself is data-driven from the same fields (no per-grammar code
/// branch — the `Shape` value picks the lowering, the data drives it).
#[derive(Debug, Clone, Copy)]
pub struct StructuralAlphabet {
    /// Sorted single-byte structural alphabet.
    /// Bytes that may terminate a scanner inner loop or open an
    /// Alt dispatch.
    pub singletons: &'static [u8],

    /// Bitset of digraph first-bytes. `digraph_mask[byte / 64] >>
    /// (byte % 64) & 1` is `1` iff `byte` is the first byte of any
    /// digraph in `digraph_pairs`.
    pub digraph_mask: [u64; 4],

    /// Two-byte digraphs: `(first, second)`. Detection logic OR'd
    /// into the structural mask via shifted-compare.
    pub digraph_pairs: &'static [(u8, u8)],

    /// Quote-class bytes. Toggle the in-string parity. Typical:
    /// `b'"'` for JSON, `b'\''` and `b'"'` for CSS, plus `b'`'`
    /// for some grammars.
    pub quote_classes: &'static [u8],
}

impl StructuralAlphabet {
    /// Empty alphabet — a kernel run on this picks the
    /// [`KernelShape::Empty`] lowering and produces an empty index.
    /// Useful as the `Default` and as a sentinel for grammars whose
    /// IR pass found no structural alphabet (set size out of window).
    pub const EMPTY: StructuralAlphabet = StructuralAlphabet {
        singletons: &[],
        digraph_mask: [0; 4],
        digraph_pairs: &[],
        quote_classes: &[],
    };

    /// Construct from a singleton slice. Auto-derives `digraph_mask`
    /// from `digraph_pairs`. Provided for tests + scaffolding; the
    /// emitter constructs the literal directly.
    pub const fn from_parts(
        singletons: &'static [u8],
        digraph_pairs: &'static [(u8, u8)],
        quote_classes: &'static [u8],
    ) -> Self {
        let mut mask = [0u64; 4];
        let mut i = 0;
        while i < digraph_pairs.len() {
            let b = digraph_pairs[i].0 as usize;
            mask[b >> 6] |= 1u64 << (b & 63);
            i += 1;
        }
        Self {
            singletons,
            digraph_mask: mask,
            digraph_pairs,
            quote_classes,
        }
    }

    /// `true` iff `byte` is the first byte of a digraph.
    #[inline]
    pub const fn digraph_first(&self, byte: u8) -> bool {
        (self.digraph_mask[(byte as usize) >> 6] >> ((byte as usize) & 63)) & 1 == 1
    }

    /// Build the 256-byte boolean LUT for the singletons. Used by
    /// the scalar reference + tail epilogues.
    pub fn byte_lut(&self) -> [bool; 256] {
        let mut lut = [false; 256];
        for &b in self.singletons {
            lut[b as usize] = true;
        }
        lut
    }
}

impl Default for StructuralAlphabet {
    fn default() -> Self {
        Self::EMPTY
    }
}

/// The kernel-lowering shape selected from the alphabet's cardinality.
///
/// See AW-III.W5 §5.2 for the cardinality table; the choice is
/// mechanical, never per-grammar.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum KernelShape {
    /// No structural bytes. Index is empty.
    Empty,
    /// `|singletons| <= 8` — single nibble-LUT collapse, one
    /// `vqtbl1q_u8` per 16-byte lane.
    NibbleLut,
    /// `9 <= |singletons| <= 16` — wide-LUT (membership bit per
    /// position; reads at most one swizzle per nibble).
    WideLut,
    /// `|singletons| > 16` — multi-pass `cmpeq` + OR-reduce.
    MultiCmp,
}

impl KernelShape {
    /// Decide the lowering shape for `alphabet`.
    pub fn select(alphabet: &StructuralAlphabet) -> Self {
        match alphabet.singletons.len() {
            0 => Self::Empty,
            1..=8 => Self::NibbleLut,
            9..=16 => Self::WideLut,
            _ => Self::MultiCmp,
        }
    }
}

/// Shared nibble-LUT pair (lo, hi) for `<=8` singletons.
/// Built once per scan from the alphabet; the kernels use it
/// directly inside the stripe loop.
#[derive(Debug, Clone, Copy)]
pub struct NibbleLut {
    /// Per-low-nibble bitmask: bit `i` set iff singleton `i`'s
    /// low nibble equals this index.
    pub lo: [u8; 16],
    /// Per-high-nibble bitmask: bit `i` set iff singleton `i`'s
    /// high nibble equals this index.
    pub hi: [u8; 16],
}

impl NibbleLut {
    /// Encode `singletons` (must have `len <= 8`) into `(lo, hi)` via
    /// the per-bit nibble-LUT pattern. Each singleton occupies a
    /// unique bit; `lo[low_nibble] |= 1 << i`, `hi[high_nibble] |=
    /// 1 << i`.
    pub fn from_singletons(singletons: &[u8]) -> Self {
        debug_assert!(singletons.len() <= 8, "nibble-LUT supports <= 8 targets");
        let mut lo = [0u8; 16];
        let mut hi = [0u8; 16];
        for (i, &b) in singletons.iter().enumerate() {
            let bit = 1u8 << (i & 7);
            lo[(b & 0x0F) as usize] |= bit;
            hi[(b >> 4) as usize] |= bit;
        }
        Self { lo, hi }
    }

    /// Build the equivalent 256-byte boolean LUT — used by scalar
    /// fallbacks and tail epilogues for byte classification.
    pub fn expand(&self) -> [bool; 256] {
        let mut lut = [false; 256];
        for b in 0u16..256 {
            let lo = self.lo[(b & 0x0F) as usize];
            let hi = self.hi[(b >> 4) as usize];
            lut[b as usize] = lo & hi != 0;
        }
        lut
    }
}

/// Wide-LUT for `9..=16` singletons. One bit per singleton, packed
/// into the same `(lo, hi)` shape but wider — the high byte holds
/// indices 8..16. Used by `WideLut` kernels.
///
/// The encoding is identical to the `<=8` path; we lift the 8-bit
/// cap by allowing `1 << i` to wrap into the top nibble of each LUT
/// entry. NEON `vqtbl2q_u8` (paired-table lookup) reads both in one
/// shot.
#[derive(Debug, Clone, Copy)]
pub struct WideLut {
    /// Low-byte / low-nibble bitmask (singletons 0..8, low nibble).
    pub lo_lo: [u8; 16],
    /// Low-byte / high-nibble bitmask (singletons 0..8, high nibble).
    pub hi_lo: [u8; 16],
    /// High-byte / low-nibble bitmask (singletons 8..16, low nibble).
    pub lo_hi: [u8; 16],
    /// High-byte / high-nibble bitmask (singletons 8..16, high nibble).
    pub hi_hi: [u8; 16],
}

impl WideLut {
    /// Build the wide-LUT from a set of `<= 16` singletons.
    pub fn from_singletons(singletons: &[u8]) -> Self {
        debug_assert!(singletons.len() <= 16, "wide-LUT supports <= 16 targets");
        let mut lo_lo = [0u8; 16];
        let mut hi_lo = [0u8; 16];
        let mut lo_hi = [0u8; 16];
        let mut hi_hi = [0u8; 16];
        for (i, &b) in singletons.iter().enumerate() {
            let bit = 1u8 << (i & 7);
            if i < 8 {
                lo_lo[(b & 0x0F) as usize] |= bit;
                hi_lo[(b >> 4) as usize] |= bit;
            } else {
                lo_hi[(b & 0x0F) as usize] |= bit;
                hi_hi[(b >> 4) as usize] |= bit;
            }
        }
        Self {
            lo_lo,
            hi_lo,
            lo_hi,
            hi_hi,
        }
    }

    /// Build the equivalent 256-byte boolean LUT. For tails / scalar.
    pub fn expand(&self) -> [bool; 256] {
        let mut lut = [false; 256];
        for b in 0u16..256 {
            let lo_lo = self.lo_lo[(b & 0x0F) as usize];
            let hi_lo = self.hi_lo[(b >> 4) as usize];
            let lo_hi = self.lo_hi[(b & 0x0F) as usize];
            let hi_hi = self.hi_hi[(b >> 4) as usize];
            lut[b as usize] = (lo_lo & hi_lo) != 0 || (lo_hi & hi_hi) != 0;
        }
        lut
    }
}
