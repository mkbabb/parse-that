//! Scanner cluster (AW-IV.W4.2.b consolidated).
//!
//! Dispatch hierarchy:
//!
//! - [`find_first_of`] — single entry point that routes on target
//!   count. 1..=3 targets dispatch to `memchr::memchr[1,2,3]`; 4..=8
//!   targets dispatch to the unified nibble-LUT SIMD path; 9+ falls
//!   back to a 256-byte scalar LUT.
//! - [`find_first_of_nibble_lut`] — shared SIMD kernel for any
//!   pre-built `(lo_lut, hi_lut)` pair. Also exposed for callers that
//!   construct the LUTs once and reuse across many scans.
//! - [`trim_leading_whitespace_mut`] — single entry point for WS
//!   skipping; fuses the 3-tier acceleration (2-byte scalar probe,
//!   cached bitmap shift, scan-and-cache cold path) behind one public
//!   function. The prior `trim_leading_whitespace(&ParserState) ->
//!   usize` read-only variant collapses into this mutation path via
//!   a local offset snapshot.
//!
//! Pre-W4.2 the cluster carried six `find_first_of_*` variants
//! (`_3`, `_4`, `_nibble_lut`, plus the dispatcher) and four
//! `trim_leading_whitespace*` variants (`_with_set`, the read-only
//! span-returning one, `_mut`, and the private `_scan_and_cache`
//! cold path). W4.2 collapses those to one public dispatcher per
//! responsibility plus the shared SIMD kernels they all call into.

use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

use crate::state::ParserState;

use aho_corasick::{AhoCorasick, AhoCorasickBuilder, MatchKind, StartKind};

/// Global Aho-Corasick cache — avoids rebuilding automata on repeated parser construction.
/// Key is the sorted, joined pattern list.
pub fn cached_aho_corasick(patterns: &[&str]) -> Arc<AhoCorasick> {
    static CACHE: OnceLock<Mutex<HashMap<String, Arc<AhoCorasick>>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    let key = patterns.join("\x00");
    let mut map = cache.lock().unwrap();
    if let Some(ac) = map.get(&key) {
        return Arc::clone(ac);
    }
    let ac = Arc::new(
        AhoCorasickBuilder::new()
            .match_kind(MatchKind::LeftmostFirst)
            .start_kind(StartKind::Anchored)
            .build(patterns)
            .expect("failed to build aho-corasick automaton"),
    );
    map.insert(key, Arc::clone(&ac));
    ac
}

/// Global DFA cache — avoids recompiling the same pattern on repeated parser construction.
pub fn cached_dfa(pattern: &str) -> Arc<crate::regex::dfa::Dfa> {
    use std::sync::RwLock;
    static CACHE: OnceLock<RwLock<HashMap<String, Arc<crate::regex::dfa::Dfa>>>> = OnceLock::new();
    let cache = CACHE.get_or_init(|| RwLock::new(HashMap::new()));

    // Fast path: read-only lock for cache hit (no contention).
    {
        let map = cache.read().unwrap();
        if let Some(dfa) = map.get(pattern) {
            return Arc::clone(dfa);
        }
    }

    // Slow path: write lock for cache miss (rare after warmup).
    let mut map = cache.write().unwrap();
    // Double-check after acquiring write lock.
    if let Some(dfa) = map.get(pattern) {
        return Arc::clone(dfa);
    }
    let dfa = Arc::new(
        crate::regex::dfa::Dfa::compile(pattern)
            .unwrap_or_else(|| panic!("Failed to compile regex to DFA: {}", pattern)),
    );
    map.insert(pattern.to_owned(), Arc::clone(&dfa));
    dfa
}

// ── Whitespace byte set ──────────────────────────────────────────────────────

/// Default ASCII whitespace byte set: space, tab, newline, carriage return,
/// form feed.
pub const ASCII_WS: [u8; 5] = [b' ', b'\t', b'\n', b'\r', 0x0C];

/// Trim leading whitespace using a custom byte set.
///
/// Scans forward from `state.offset`, skipping any bytes present in
/// `ws_bytes`.  Advances the state offset past all matched whitespace.
/// Uses a 256-byte LUT for O(1) per-byte classification.
#[inline(always)]
pub fn trim_leading_whitespace_with_set(state: &mut ParserState<'_>, ws_bytes: &[u8]) {
    let bytes = state.src_bytes;
    let mut i = state.offset;
    let end = bytes.len();

    if i >= end {
        return;
    }

    // Build a 256-byte LUT for the custom set.
    let mut lut = [false; 256];
    for &b in ws_bytes {
        lut[b as usize] = true;
    }

    while i < end && lut[unsafe { *bytes.get_unchecked(i) } as usize] {
        i += 1;
    }

    state.offset = i;
}

/// Skip leading whitespace at `state.offset`. Three-tier acceleration:
///
/// 1. **Scalar 2-byte probe** — handles 0..=1 whitespace bytes (80%+
///    of calls).
/// 2. **Bitmap cache hit** — reuse a previously-populated 64-byte
///    window via `trailing_ones` when `state.offset` still falls
///    inside the cached range.
/// 3. **Scan-and-cache cold path** — scan up to 64 bytes, populate
///    the bitmap, advance. If the WS run fills the whole window,
///    recurse into the SIMD bulk loop via an inline tail.
#[inline(always)]
pub fn trim_leading_whitespace_mut(state: &mut ParserState<'_>) {
    let bytes = state.src_bytes;
    let offset = state.offset;
    let end = bytes.len();

    // ── Tier 1: scalar 2-byte probe ─────────────────────────────
    if offset >= end {
        return;
    }
    let b0 = unsafe { *bytes.get_unchecked(offset) };
    if !matches!(b0, b' ' | b'\t' | b'\n' | b'\r') {
        return;
    }
    if offset + 1 >= end {
        state.offset = offset + 1;
        return;
    }
    let b1 = unsafe { *bytes.get_unchecked(offset + 1) };
    if !matches!(b1, b' ' | b'\t' | b'\n' | b'\r') {
        state.offset = offset + 1;
        return;
    }

    // ── Tier 2: bitmap cache hit ────────────────────────────────
    let ws_start = state.ws_bitmap_start;
    if offset >= ws_start && offset - ws_start < 64 {
        let bit_offset = offset - ws_start;
        let shifted = state.ws_bitmap >> bit_offset;
        let ws_count = shifted.trailing_ones() as usize;
        let new_offset = offset + ws_count;
        if bit_offset + ws_count < 64 {
            state.offset = new_offset;
            return;
        }
        state.offset = new_offset;
        trim_leading_whitespace_scan_and_cache(state);
        return;
    }

    // ── Tier 3: scan + populate bitmap cache ────────────────────
    trim_leading_whitespace_scan_and_cache(state);
}

/// Cold path: scan up to 64 bytes from `state.offset`, populate the
/// bitmap cache, advance `state.offset` past all whitespace. If the
/// WS span exceeds 64 bytes, falls through to the SIMD bulk loop.
#[inline(never)]
fn trim_leading_whitespace_scan_and_cache(state: &mut ParserState<'_>) {
    let bytes = state.src_bytes;
    let offset = state.offset;
    let end = bytes.len();
    let window_len = 64.min(end.saturating_sub(offset));

    let mut bitmap: u64 = 0;
    {
        use std::simd::prelude::*;
        let window = &bytes[offset..offset + window_len];
        let mut i = 0;
        while i + 16 <= window_len {
            let chunk = u8x16::from_slice(&window[i..i + 16]);
            let mask = chunk.simd_eq(u8x16::splat(b' '))
                | chunk.simd_eq(u8x16::splat(b'\t'))
                | chunk.simd_eq(u8x16::splat(b'\n'))
                | chunk.simd_eq(u8x16::splat(b'\r'));
            let bits = mask.to_bitmask() as u64;
            bitmap |= bits << i;
            i += 16;
        }
        while i < window_len {
            let b = unsafe { *window.get_unchecked(i) };
            if matches!(b, b' ' | b'\t' | b'\n' | b'\r') {
                bitmap |= 1u64 << i;
            }
            i += 1;
        }
    }

    state.ws_bitmap = bitmap;
    state.ws_bitmap_start = offset;

    let ws_count = bitmap.trailing_ones() as usize;
    state.offset = offset + ws_count;

    // Entire window was WS — continue with the SIMD bulk loop for
    // the remaining bytes past the cached window.
    if ws_count >= window_len && state.offset < end {
        trim_leading_whitespace_bulk_simd(state);
    }
}

/// SIMD bulk loop for WS runs that exceed the 64-byte cached window.
/// Processes 16 bytes per iteration until a non-WS byte is hit or
/// input ends.
#[inline(never)]
fn trim_leading_whitespace_bulk_simd(state: &mut ParserState<'_>) {
    use std::simd::prelude::*;
    let bytes = state.src_bytes;
    let mut i = state.offset;
    let end = bytes.len();
    while i + 16 <= end {
        let chunk = u8x16::from_slice(&bytes[i..i + 16]);
        let mask = chunk.simd_eq(u8x16::splat(b' '))
            | chunk.simd_eq(u8x16::splat(b'\t'))
            | chunk.simd_eq(u8x16::splat(b'\n'))
            | chunk.simd_eq(u8x16::splat(b'\r'));
        if mask.all() {
            i += 16;
            continue;
        }
        let first_non_ws = (!mask).to_bitmask().trailing_zeros() as usize;
        state.offset = i + first_non_ws;
        return;
    }
    while i < end {
        let b = unsafe { *bytes.get_unchecked(i) };
        if !matches!(b, b' ' | b'\t' | b'\n' | b'\r') {
            break;
        }
        i += 1;
    }
    state.offset = i;
}

// ── Nibble-LUT SIMD byte classification ─────────────────────────────────────
//
// Technique from simdjson: two 16-byte lookup tables indexed by the low and
// high nibbles of each input byte.  A byte matches if the AND of both lookups
// is non-zero.  Each target gets its own bit (up to 8), so cross-target
// nibble collisions don't cause false positives.
//
// On x86-64 this compiles to two VPSHUFB instructions per 16-byte chunk.
// On ARM it compiles to TBL.

/// Build nibble lookup tables for SIMD byte classification.
/// Supports up to 8 unique target bytes with zero false positives.
#[inline]
pub fn build_nibble_luts(targets: &[u8]) -> ([u8; 16], [u8; 16]) {
    debug_assert!(
        targets.len() <= 8,
        "nibble LUT supports at most 8 targets, got {}",
        targets.len()
    );
    let mut lo_lut = [0u8; 16];
    let mut hi_lut = [0u8; 16];
    let mut i = 0;
    while i < targets.len() {
        let bit = 1u8 << i;
        lo_lut[(targets[i] & 0x0F) as usize] |= bit;
        hi_lut[(targets[i] >> 4) as usize] |= bit;
        i += 1;
    }
    (lo_lut, hi_lut)
}

/// SIMD nibble-LUT byte scanner: find first occurrence of any target byte
/// in `haystack` using two 16-byte lookup tables + `swizzle_dyn` (vpshufb/tbl).
///
/// Processes 16 bytes per iteration.  The `lo_lut`/`hi_lut` must be pre-built
/// via [`build_nibble_luts`].
///
/// Marked `#[inline(never)]` to prevent SIMD code from bloating I-cache when
/// inlined into hot scanner loops.
#[inline(never)]
pub fn find_first_of_nibble_lut(
    haystack: &[u8],
    lo_lut: &[u8; 16],
    hi_lut: &[u8; 16],
) -> Option<(usize, u8)> {
    use std::simd::prelude::*;

    let lo = u8x16::from_array(*lo_lut);
    let hi = u8x16::from_array(*hi_lut);
    let lo_mask = u8x16::splat(0x0F);

    let len = haystack.len();
    let mut i = 0;

    // SIMD: 16 bytes at a time
    while i + 16 <= len {
        let chunk = u8x16::from_slice(&haystack[i..i + 16]);
        let lo_nibbles = chunk & lo_mask;
        let hi_nibbles = chunk >> 4;
        let lo_result = lo.swizzle_dyn(lo_nibbles);
        let hi_result = hi.swizzle_dyn(hi_nibbles);
        let matched = lo_result & hi_result;
        let is_match = matched.simd_ne(u8x16::splat(0));
        if is_match.any() {
            let pos = is_match.to_bitmask().trailing_zeros() as usize;
            let idx = i + pos;
            return Some((idx, unsafe { *haystack.get_unchecked(idx) }));
        }
        i += 16;
    }

    // Scalar tail
    while i < len {
        let b = unsafe { *haystack.get_unchecked(i) };
        if lo_lut[(b & 0x0F) as usize] & hi_lut[(b >> 4) as usize] != 0 {
            return Some((i, b));
        }
        i += 1;
    }

    None
}

/// Find the first occurrence of any target byte in `haystack`.
/// Returns `(position, byte_found)`.
///
/// Auto-dispatches based on target count:
/// - 1–3 targets: `memchr::memchr[1,2,3]` (hardware-accelerated AVX2/SSE2).
/// - 4–8 targets: the shared nibble-LUT SIMD kernel above.
/// - 9+ targets: 256-byte scalar LUT.
///
/// Callers should pass deduplicated targets for best performance.
#[inline]
pub fn find_first_of(haystack: &[u8], targets: &[u8]) -> Option<(usize, u8)> {
    match targets.len() {
        0 => None,
        1 => {
            let p = memchr::memchr(targets[0], haystack)?;
            Some((p, unsafe { *haystack.get_unchecked(p) }))
        }
        2 => {
            let p = memchr::memchr2(targets[0], targets[1], haystack)?;
            Some((p, unsafe { *haystack.get_unchecked(p) }))
        }
        3 => {
            let p = memchr::memchr3(targets[0], targets[1], targets[2], haystack)?;
            Some((p, unsafe { *haystack.get_unchecked(p) }))
        }
        4..=8 => {
            // The 4-byte SIMD equality-splat path collapses into the
            // nibble-LUT path — the per-chunk SIMD cost is dominated
            // by the two PSHUFB / TBL lookups, not the mask
            // construction, so keeping a specialised `_4` kernel
            // produced no measurable benefit over the unified LUT.
            let (lo_lut, hi_lut) = build_nibble_luts(targets);
            find_first_of_nibble_lut(haystack, &lo_lut, &hi_lut)
        }
        _ => {
            let mut lut = [false; 256];
            let mut j = 0;
            while j < targets.len() {
                lut[targets[j] as usize] = true;
                j += 1;
            }
            let mut i = 0;
            let len = haystack.len();
            while i < len {
                let b = unsafe { *haystack.get_unchecked(i) };
                if lut[b as usize] {
                    return Some((i, b));
                }
                i += 1;
            }
            None
        }
    }
}

/// Find the first occurrence of any of 3 target bytes in `haystack`.
/// Specialisation kept as a public alias because
/// `emit/backend/kernels/balanced_wrap.rs` inlines a per-site call
/// that hard-codes three pivots at codegen time; routing every
/// 3-target scan through `find_first_of` would re-dispatch on
/// `targets.len()` at runtime.
#[inline(always)]
pub fn find_first_of_3(haystack: &[u8], b0: u8, b1: u8, b2: u8) -> Option<(usize, u8)> {
    let p = memchr::memchr3(b0, b1, b2, haystack)?;
    Some((p, unsafe { *haystack.get_unchecked(p) }))
}
