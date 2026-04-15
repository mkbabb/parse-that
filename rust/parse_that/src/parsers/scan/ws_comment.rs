// Whitespace + block comment scanners — tiered SIMD inner loop.
//
// Grammar-driven profiling on CSS bootstrap/normalize/tailwind shows
// whitespace runs skew tiny: 84–100% of runs are ≤ 4 bytes, and 63%
// are exactly one byte (`\n` between declarations). A 64-byte stripe
// kernel is overkill for these runs; the per-call overhead (4 ×
// `u8x16` classify, AND, to_bitmask, CTZ) dominates the 1–3 byte
// advance.
//
// Tiered fast path:
//   1. Inline single-byte short-circuit — bails the no-op WS sites
//      (~300 in the CSS L4 generated parser).
//   2. Inline 16-byte SIMD chunk — classifies one `u8x16`, CTZ
//      finds the terminating byte. Resolves every run ≤ 16 bytes,
//      which covers ~100% of CSS and essentially all JSON WS.
//   3. Cold 64-byte stripe walker — only reached when a 16-byte
//      chunk is entirely WS or contains a comment opener. Handles
//      long runs and block-comment bodies.

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

/// Classify one `u8x16` chunk against the WS|`/` byte set. Returns a
/// 16-bit mask with bit `i` set iff `chunk[i]` is WS or `/`.
#[inline(always)]
fn classify_ws_slash_16(chunk: u8x16) -> u16 {
    let lo = u8x16::from_array(WS_SLASH_LO_LUT);
    let hi = u8x16::from_array(WS_SLASH_HI_LUT);
    let lo_mask = u8x16::splat(0x0F);
    let lo_n = chunk & lo_mask;
    let hi_n = chunk >> 4;
    let lo_r = lo.swizzle_dyn(lo_n);
    let hi_r = hi.swizzle_dyn(hi_n);
    let matched = lo_r & hi_r;
    matched.simd_ne(u8x16::splat(0)).to_bitmask() as u16
}

/// Scan whitespace and block comments: `(\s | /\*…\*/)*`. Always
/// succeeds (empty span on no-op).
///
/// Tier 1 (inline, ~300 call sites): single-byte LUT + branch. Bails
/// immediately when the next byte is neither WS nor `/`.
///
/// Tier 2 (inline, ~25k WS hits in CSS bootstrap): one 16-byte SIMD
/// classify. If any bit in the mask is clear AND the first `/` (if
/// any) is not followed by `*`, CTZ-advance to the terminator and
/// return — no cold call. Resolves all runs ≤ 16 bytes.
///
/// Tier 3 (cold): 64-byte stripe walker for long runs and block
/// comments.
#[inline(always)]
pub fn scan_ws_block_comments<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let start = state.offset;
    let len = state.end;

    if start >= len {
        return Some(Span::new(start, start, state.src));
    }

    let padded = state.padded_bytes();
    let b0 = unsafe { *padded.get_unchecked(start) };
    if !is_ws(b0) && b0 != b'/' {
        return Some(Span::new(start, start, state.src));
    }

    // Tier 2: one 16-byte chunk classify. The padded view guarantees
    // `start + 16` is in-bounds; NUL padding classifies as non-WS so
    // stripes that straddle the public end terminate naturally.
    let chunk = u8x16::from_slice(unsafe {
        padded.get_unchecked(start..start + 16)
    });
    let ws_slash_mask = classify_ws_slash_16(chunk);
    let non_ws_mask = !ws_slash_mask & 0xFFFFu16;

    if non_ws_mask != 0 {
        // Some byte in the chunk is neither WS nor `/`. If there is
        // no earlier `/` the scan terminates at that byte. A `/`
        // before the terminator may open a block comment (cold path).
        let non_ws_rel = non_ws_mask.trailing_zeros() as usize;
        let slash_mask = slash_mask_16(chunk) & ((1u16 << non_ws_rel) - 1);
        if slash_mask == 0 {
            let end = (start + non_ws_rel).min(len);
            state.offset = end;
            return Some(Span::new(start, end, state.src));
        }
        // `/` before terminator — cold path handles the `/*` probe
        // so that the hot path stays branch-free.
        let end = scan_ws_bitmap_cold(padded, start, len);
        state.offset = end;
        return Some(Span::new(start, end, state.src));
    }

    // Tier 3: the whole 16-byte chunk is WS or `/`. The run may be
    // long, or this may be a `/*…*/` comment. Delegate to the stripe
    // walker.
    let end = scan_ws_bitmap_cold(padded, start, len);
    state.offset = end;
    Some(Span::new(start, end, state.src))
}

/// Bitmask of positions where byte == `/` within a 16-byte chunk.
#[inline(always)]
fn slash_mask_16(chunk: u8x16) -> u16 {
    chunk.simd_eq(u8x16::splat(b'/')).to_bitmask() as u16
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
