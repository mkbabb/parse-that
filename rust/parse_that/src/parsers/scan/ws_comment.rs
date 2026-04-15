// Whitespace + block comment scanners — SIMD bitmap inner loop.
//
// AU.2.7: the inner loop consumes a stripe-classified byte-set bitmap
// covering whitespace + `/` (the two bytes that continue the scan).
// Positions that are `/` are probed for `/*` digraph; the scan skips
// to `*/` via memchr(b'*'). No byte-at-a-time scalar inner loop —
// the short < 64-byte tail is a bounded scalar epilogue, not a
// separate "slow" function.
//
// The deleted `scan_ws_block_comments_slow` cold-path helper is
// subsumed: the main entry handles the hot short-circuit AND the
// bitmap inner loop in one body, no split.

use crate::state::{ParserState, Span};
use super::structural_bitmap::classify_stripe;
use std::simd::prelude::*;

/// Byte-class lookup table for ASCII whitespace only.
static WS_LUT: [bool; 256] = {
    let mut lut = [false; 256];
    lut[b' ' as usize] = true;
    lut[b'\t' as usize] = true;
    lut[b'\n' as usize] = true;
    lut[b'\r' as usize] = true;
    lut[0x0C] = true;
    lut
};

/// Nibble-LUT for {' ', '\t', '\n', '\r', '\x0C', '/'} — the six
/// bytes that continue the ws+comment scan.
const WS_SLASH_LO_LUT: [u8; 16] = build_ws_slash_lo();
const WS_SLASH_HI_LUT: [u8; 16] = build_ws_slash_hi();

const fn build_ws_slash_lo() -> [u8; 16] {
    let targets = [b' ', b'\t', b'\n', b'\r', 0x0C, b'/'];
    let mut lo = [0u8; 16];
    let mut i = 0;
    while i < targets.len() {
        let bit = 1u8 << i;
        lo[(targets[i] & 0x0F) as usize] |= bit;
        i += 1;
    }
    lo
}

const fn build_ws_slash_hi() -> [u8; 16] {
    let targets = [b' ', b'\t', b'\n', b'\r', 0x0C, b'/'];
    let mut hi = [0u8; 16];
    let mut i = 0;
    while i < targets.len() {
        let bit = 1u8 << i;
        hi[(targets[i] >> 4) as usize] |= bit;
        i += 1;
    }
    hi
}

#[inline(always)]
fn is_ws(b: u8) -> bool {
    WS_LUT[b as usize]
}

/// Scan whitespace and block comments: `(\s | /\*…\*/)*`. Always
/// succeeds (empty span on no-op).
///
/// Hot path: single-byte check short-circuits when the next byte is
/// neither whitespace nor `/`. On the no-op call sites (~300 in the
/// CSS L4 generated parser) this is one LUT load + one
/// well-predicted branch.
///
/// Long path: bitmap-driven. 64-byte stripes classified via the
/// ws/`/` nibble-LUT; each `/` hit probes `+1` for `*` and, if
/// positive, skips the block comment body via memchr.
#[inline(always)]
pub fn scan_ws_block_comments<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let start = state.offset;
    let len = state.end;

    if start >= len {
        return Some(Span::new(start, start, state.src));
    }

    let bytes = state.src_bytes;
    let b0 = unsafe { *bytes.get_unchecked(start) };
    if !is_ws(b0) && b0 != b'/' {
        return Some(Span::new(start, start, state.src));
    }

    // Hand the padded view to the stripe walker so it can read a full
    // 64-byte stripe over the tail without the per-chunk
    // `i + 64 <= len` guard. The padded region is NUL, which is
    // classified as non-ws / non-`/`, so a stripe that straddles the
    // end of the public input terminates the scan naturally at the
    // first padded byte — and the clamp in `scan_ws_bitmap_cold`
    // ensures the returned offset never exceeds `len`.
    let end = scan_ws_bitmap_cold(state.padded_bytes(), start, len);
    state.offset = end;
    Some(Span::new(start, end, state.src))
}

/// Outlined cold-path SIMD bitmap walker. Returns the offset of the
/// first byte that is NOT whitespace and is NOT part of a
/// `/*…*/` block comment — i.e., where the ws scan terminates.
///
/// `bytes` is the padded view from [`crate::state::ParserState::padded_bytes`]:
/// the first `len` bytes mirror the public input; the next
/// [`crate::state::INPUT_PAD_BYTES`] bytes are NUL. NUL classifies as
/// neither ws nor `/`, so any stripe read that straddles the end of
/// the public input terminates the scan naturally; the returned
/// offset is clamped to `len` before it escapes the walker.
#[cold]
#[inline(never)]
fn scan_ws_bitmap_cold(bytes: &[u8], start: usize, len: usize) -> usize {
    let lo_v = u8x16::from_array(WS_SLASH_LO_LUT);
    let hi_v = u8x16::from_array(WS_SLASH_HI_LUT);

    let mut i = start;

    // Stripe-aligned bitmap walk. The padded-view guarantee means
    // `i + 64` is always in-bounds whenever `i <= len`, so the loop
    // can walk over the logical end and rely on the NUL classification
    // to terminate. Every `return` site clamps to `len` so padded
    // positions never escape.
    while i < len {
        let mask = classify_stripe(bytes, i, lo_v, hi_v);
        let inv = !mask;
        if inv != 0 {
            // First non-(ws|`/`) byte in this stripe. May fall in the
            // padded region when the final stripe straddles `len`.
            let non_ws_rel = inv.trailing_zeros() as usize;
            let non_ws_abs = (i + non_ws_rel).min(len);
            // A `/` before the non-ws may open a block comment.
            let slash_mask = slash_mask_stripe(bytes, i)
                & ((1u64 << non_ws_rel) - 1);
            if slash_mask != 0 {
                let slash_rel = slash_mask.trailing_zeros() as usize;
                let slash_abs = i + slash_rel;
                if slash_abs >= len {
                    return len;
                }
                if slash_abs + 1 < len
                    && unsafe { *bytes.get_unchecked(slash_abs + 1) } == b'*'
                {
                    // Block comment opens — skip body and restart.
                    i = skip_block_comment_tail(bytes, slash_abs + 2, len);
                    continue;
                }
                // `/` without `*` — ws scan terminates at `/`.
                return slash_abs;
            }
            // No `/` before the non-ws — scan terminates at non_ws_abs.
            return non_ws_abs;
        }
        // Entire stripe is ws or `/` (in the public region — padded
        // NUL bytes are non-ws so `inv != 0` above handles them).
        // Probe each `/` for `*`.
        let mut slash_mask = slash_mask_stripe(bytes, i);
        let mut stripe_consumed = false;
        while slash_mask != 0 {
            let bit = slash_mask.trailing_zeros() as usize;
            let slash_abs = i + bit;
            slash_mask &= !(1u64 << bit);
            if slash_abs >= len {
                return len;
            }
            if slash_abs + 1 < len
                && unsafe { *bytes.get_unchecked(slash_abs + 1) } == b'*'
            {
                // Block comment opens — skip body; i jumps past `*/`.
                i = skip_block_comment_tail(bytes, slash_abs + 2, len);
                stripe_consumed = true;
                break;
            }
            // `/` not followed by `*` inside an all-ws stripe —
            // scan terminates at this `/`.
            return slash_abs;
        }
        if !stripe_consumed {
            // Full stripe is ws; advance by the stripe width. The
            // next iteration's stripe read is still in-bounds on the
            // padded view even when `i + 64` exceeds `len`.
            i += 64;
        }
    }
    len
}

/// Bitmask of positions where byte == `/` within a 64-byte stripe.
#[inline(always)]
fn slash_mask_stripe(bytes: &[u8], offset: usize) -> u64 {
    let mut mask: u64 = 0;
    for k in 0..4 {
        let chunk = u8x16::from_slice(unsafe {
            bytes.get_unchecked(offset + k * 16..offset + k * 16 + 16)
        });
        let m = chunk.simd_eq(u8x16::splat(b'/')).to_bitmask() as u64;
        mask |= m << (k * 16);
    }
    mask
}

/// Skip the body of a block comment starting at `start` (just past
/// the opening `/*`). Returns the offset just past the closing
/// `*/`, or `len` if the comment is unterminated.
#[inline(always)]
fn skip_block_comment_tail(bytes: &[u8], start: usize, len: usize) -> usize {
    let mut i = start;
    loop {
        match memchr::memchr(b'*', unsafe { bytes.get_unchecked(i..len) }) {
            None => return len,
            Some(pos) => {
                i += pos + 1;
                if i < len && unsafe { *bytes.get_unchecked(i) } == b'/' {
                    return i + 1;
                }
            }
        }
    }
}

/// Scan a block comment: `/\*…\*/`. Returns span including the
/// delimiters. Returns `None` when input does NOT start with `/*`.
#[inline(always)]
pub fn scan_block_comment<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();

    if start + 1 >= len {
        return None;
    }
    if unsafe { *bytes.get_unchecked(start) } != b'/'
        || unsafe { *bytes.get_unchecked(start + 1) } != b'*'
    {
        return None;
    }

    let end = skip_block_comment_tail(bytes, start + 2, len);
    // skip_block_comment_tail returns `len` on unterminated. A
    // proper terminated comment ends with `/`; the sentinel is
    // `end == len` AND (len < 2 OR bytes[len-1] != '/').
    if end == len
        && (len < 2
            || unsafe { *bytes.get_unchecked(len - 1) } != b'/'
            || len < 2
            || unsafe { *bytes.get_unchecked(len - 2) } != b'*')
    {
        return None;
    }
    state.offset = end;
    Some(Span::new(start, end, state.src))
}
