// Whitespace + block comment scanners — SIMD bitmap inner loop.
//
// AU.2.7: the inner loop consumes a stripe-classified byte-set bitmap
// covering whitespace + `/` (the only two bytes that continue the
// scan). Positions that are `/` are probed for `/*` digraph; the
// scan skips to `*/` via a single SIMD structural walk for `*`. All
// "byte-at-a-time" scalar inner loops are gone — the short-tail
// scalar epilogue in structural_bitmap handles < 64 bytes without a
// per-byte classification branch.
//
// The deleted `scan_ws_block_comments_slow` cold-path helper is
// subsumed: the main entry handles the hot short-circuit + the
// bitmap inner loop in one body, no split.

use crate::state::{ParserState, Span};
use super::structural_bitmap::{classify_stripe, expand_byte_lut};
use std::simd::prelude::*;

/// Byte-class lookup table for the ws/`/` set — whitespace + `/`.
static WS_LUT: [bool; 256] = {
    let mut lut = [false; 256];
    lut[b' ' as usize] = true;
    lut[b'\t' as usize] = true;
    lut[b'\n' as usize] = true;
    lut[b'\r' as usize] = true;
    lut[0x0C] = true;
    lut
};

/// Nibble-LUT for the set {' ', '\t', '\n', '\r', '\x0C', '/'} —
/// six bytes, within the 8-target nibble-LUT window. Precomputed
/// at crate init; reused across every call.
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
/// neither whitespace nor `/` (the only two bytes that could
/// continue the scan). On the no-op call sites (~300 in the CSS L4
/// generated parser) this is one LUT load + one well-predicted
/// branch.
///
/// Long path: bitmap-driven. Classifies the remaining input into
/// 64-byte stripes using the ws/`/` nibble-LUT; CTZ-iterates each
/// stripe's mask. A `/` hit probes the next byte for `*` and, if
/// positive, jumps to the next `*/` closing digraph via a second
/// nibble-LUT scan for `*`.
#[inline(always)]
pub fn scan_ws_block_comments<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();

    if start >= len {
        return Some(Span::new(start, start, state.src));
    }

    let b0 = unsafe { *bytes.get_unchecked(start) };
    if !is_ws(b0) && b0 != b'/' {
        return Some(Span::new(start, start, state.src));
    }

    // Cold path: outlined so the no-op hot path stays minimal.
    let end = scan_ws_bitmap_cold(bytes, start, len);
    state.offset = end;
    Some(Span::new(start, end, state.src))
}

#[cold]
#[inline(never)]
fn scan_ws_bitmap_cold(bytes: &[u8], start: usize, len: usize) -> usize {
    let lo_v = u8x16::from_array(WS_SLASH_LO_LUT);
    let hi_v = u8x16::from_array(WS_SLASH_HI_LUT);
    let byte_lut = expand_byte_lut(&WS_SLASH_LO_LUT, &WS_SLASH_HI_LUT);

    let mut i = start;
    'outer: loop {
        // Bitmap inner loop: walk whitespace + `/` in stripe units,
        // break when a non-structural byte appears.
        while i + 64 <= len {
            let mask = classify_stripe(bytes, i, lo_v, hi_v);
            if mask == u64::MAX {
                // All 64 bytes are ws or `/` — advance, but we still
                // need to probe each `/` for `*`. Fall through to
                // the hit-handling block below via a zero-trailing
                // count of the inverted mask.
            }
            let inv = !mask;
            if inv == 0 {
                // Every byte qualifies — but `/` positions must be
                // probed for `*`. Walk `/` positions in this stripe
                // via a dedicated slash-only mask derived from the
                // raw bytes.
                let slash_mask = slash_mask_stripe(bytes, i);
                if process_slashes(bytes, i, slash_mask, len, &mut i) {
                    continue 'outer;
                }
                // No `/*` in this stripe — advance a full stripe.
                i += 64;
                continue;
            }
            // `inv != 0`: a non-structural (non-ws, non-`/`) byte
            // exists within this stripe. CTZ gives the offset.
            let non_ws_rel = inv.trailing_zeros() as usize;
            // But a `/` before that position may start a comment.
            // Mask the slash positions strictly before the non-ws.
            let slash_mask = slash_mask_stripe(bytes, i)
                & ((1u64 << non_ws_rel) - 1);
            if slash_mask != 0 {
                if process_slashes(bytes, i, slash_mask, len, &mut i) {
                    continue 'outer;
                }
            }
            // No `/*` before the non-ws — advance and stop.
            i += non_ws_rel;
            return i;
        }

        // Short-tail epilogue (< 64 bytes remaining).
        while i < len {
            let b = unsafe { *bytes.get_unchecked(i) };
            if !byte_lut[b as usize] {
                return i;
            }
            if b == b'/' {
                if i + 1 < len && unsafe { *bytes.get_unchecked(i + 1) } == b'*' {
                    i = skip_block_comment_tail(bytes, i + 2, len);
                    continue;
                }
                // `/` not followed by `*` — this ends the ws scan.
                return i;
            }
            i += 1;
        }
        return i;
    }
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

/// For every `/` in `slash_mask` (relative to `base`), probe the
/// next byte for `*`. If `/*`, skip the comment and set `*offset`
/// past it, returning true (caller should `continue 'outer`). If
/// any `/` is NOT followed by `*`, set `*offset` to that `/` and
/// return true (caller returns the current position). Returns
/// false only when every `/` in the stripe is followed by `*` but
/// the comment body extends past this stripe (rare; caller
/// continues scanning from the advanced offset).
#[inline(always)]
fn process_slashes(
    bytes: &[u8],
    base: usize,
    slash_mask: u64,
    len: usize,
    offset: &mut usize,
) -> bool {
    if slash_mask != 0 {
        let bit = slash_mask.trailing_zeros() as usize;
        let slash_pos = base + bit;

        if slash_pos + 1 < len {
            let next = unsafe { *bytes.get_unchecked(slash_pos + 1) };
            if next == b'*' {
                *offset = skip_block_comment_tail(bytes, slash_pos + 2, len);
                return true;
            } else {
                // `/` without `*` — ws scan terminates here.
                *offset = slash_pos;
                return true;
            }
        } else {
            // `/` at end of input — terminates.
            *offset = slash_pos;
            return true;
        }
    }
    false
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
/// delimiters.
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
    if end == len && (len < 2 || unsafe { *bytes.get_unchecked(len - 1) } != b'/'
        || unsafe { *bytes.get_unchecked(len - 2) } != b'*')
    {
        // Unterminated.
        return None;
    }
    state.offset = end;
    Some(Span::new(start, end, state.src))
}
