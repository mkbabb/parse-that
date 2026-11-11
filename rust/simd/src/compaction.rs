//! Bitmap → `Vec<u32>` index compaction.
//!
//! The SIMD kernels produce a 64-bit mask per 64-byte stripe, with
//! bit `i` set iff input byte `stripe_base + i` is structural. The
//! driver consumes a `StructuralIndex { positions, kinds }` —
//! per-stripe dense `Vec<u32>` of byte offsets + per-stripe `Vec<u8>`
//! of byte values. Compaction is the bridge.
//!
//! The strategy is a `tzcnt` loop: one CTZ and one push per structural
//! byte, `mask &= mask - 1` clearing the low bit. It is arch-neutral
//! and branch-predicts well at the densities of real grammars (JSON
//! citm about 7 %, CSS bootstrap about 12 %).

/// Compact one 64-bit `mask` into `out_positions` + `out_kinds`,
/// reading the source bytes from `bytes[stripe_base..]`. Default
/// `tzcnt`-loop; arch-neutral.
#[inline]
pub fn compact_stripe_tzcnt(
    mask: u64,
    stripe_base: u32,
    bytes: &[u8],
    out_positions: &mut Vec<u32>,
    out_kinds: &mut Vec<u8>,
) {
    let mut m = mask;
    while m != 0 {
        let bit = m.trailing_zeros();
        let pos = stripe_base + bit;
        // SAFETY: stripe_base + bit < stripe_base + 64 <= bytes.len()
        // by stripe-bound contract — caller ensures the stripe was
        // classified within `bytes`.
        let kind = unsafe { *bytes.get_unchecked(pos as usize) };
        out_positions.push(pos);
        out_kinds.push(kind);
        m &= m - 1;
    }
}

/// Reserve enough capacity in `positions` + `kinds` for `additional`
/// new structural bytes. Called per-stripe by the kernel when the
/// stripe mask popcount is non-zero.
#[inline]
pub fn reserve(positions: &mut Vec<u32>, kinds: &mut Vec<u8>, additional: usize) {
    positions.reserve(additional);
    kinds.reserve(additional);
}
