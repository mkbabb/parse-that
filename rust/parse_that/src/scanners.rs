use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

use crate::state::{ParserState, Span};

use aho_corasick::{AhoCorasick, AhoCorasickBuilder, Anchored, Input, MatchKind, StartKind};

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

#[inline(always)]
pub fn trim_leading_whitespace(state: &ParserState<'_>) -> usize {
    let bytes = state.src_bytes;
    let mut i = state.offset;
    let end = bytes.len();

    // Fast path: first byte is not whitespace (most common case)
    if i >= end
        || !matches!(
            unsafe { *bytes.get_unchecked(i) },
            b' ' | b'\t' | b'\n' | b'\r'
        )
    {
        return 0;
    }

    i += 1; // we know the first byte is whitespace

    // SIMD: process 16 bytes at a time for longer spans
    {
        use std::simd::prelude::*;
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
            return i + first_non_ws - state.offset;
        }
    }

    // Scalar tail
    while i < end {
        match unsafe { *bytes.get_unchecked(i) } {
            b' ' | b'\t' | b'\n' | b'\r' => i += 1,
            _ => break,
        }
    }
    i - state.offset
}

/// Skip leading whitespace with 3-tier acceleration:
///
/// 1. **Scalar 2-byte check** — handles 0-1 whitespace chars (80%+ of calls).
/// 2. **Bitmap cache hit** — if offset falls within a previously scanned 64-byte
///    window, uses bit manipulation to find the first non-WS byte with zero
///    re-scanning.
/// 3. **Scan + populate** — scans up to 64 bytes, populates the bitmap cache,
///    then uses it. Falls through to SIMD/scalar for spans > 64 bytes.
#[inline(always)]
pub fn trim_leading_whitespace_mut(state: &mut ParserState<'_>) {
    let bytes = state.src_bytes;
    let offset = state.offset;
    let end = bytes.len();

    // ── Tier 1: scalar 2-byte check (handles 80%+ of calls) ────────────
    if offset >= end {
        return;
    }
    let b0 = unsafe { *bytes.get_unchecked(offset) };
    if !matches!(b0, b' ' | b'\t' | b'\n' | b'\r') {
        return;
    }
    // First byte is WS — check second
    if offset + 1 >= end {
        state.offset = offset + 1;
        return;
    }
    let b1 = unsafe { *bytes.get_unchecked(offset + 1) };
    if !matches!(b1, b' ' | b'\t' | b'\n' | b'\r') {
        state.offset = offset + 1;
        return;
    }

    // ── 2+ whitespace bytes — try bitmap cache ─────────────────────────
    let ws_start = state.ws_bitmap_start;

    // Tier 2: bitmap cache hit — offset is within the cached 64-byte window.
    if offset >= ws_start && offset - ws_start < 64 {
        let bit_offset = offset - ws_start;
        // Shift out bits below our position, then count trailing ones
        // (each 1-bit = whitespace byte)
        let shifted = state.ws_bitmap >> bit_offset;
        let ws_count = shifted.trailing_ones() as usize;
        let new_offset = offset + ws_count;

        // If the run doesn't reach the window boundary, we have the exact answer
        if bit_offset + ws_count < 64 {
            state.offset = new_offset;
            return;
        }
        // Run extends to window edge — fall through to rescan from new_offset
        state.offset = new_offset;
        trim_leading_whitespace_scan_and_cache(state);
        return;
    }

    // ── Tier 3: scan + populate bitmap cache ───────────────────────────
    // We already know offset and offset+1 are WS, so start scanning from offset
    trim_leading_whitespace_scan_and_cache(state);
}

/// Cold path: scan up to 64 bytes from `state.offset`, populate the bitmap
/// cache, advance offset past all whitespace. If the WS span exceeds 64 bytes,
/// falls through to the SIMD bulk scanner.
#[inline(never)]
fn trim_leading_whitespace_scan_and_cache(state: &mut ParserState<'_>) {
    let bytes = state.src_bytes;
    let offset = state.offset;
    let end = bytes.len();
    let window_len = 64.min(end.saturating_sub(offset));

    // Build bitmap for this 64-byte window
    let mut bitmap: u64 = 0;
    let window = &bytes[offset..offset + window_len];

    // Process 8 bytes at a time for bitmap construction
    let mut i = 0;
    while i + 8 <= window_len {
        let mut byte_bits: u64 = 0;
        let mut j = 0;
        while j < 8 {
            let b = unsafe { *window.get_unchecked(i + j) };
            if matches!(b, b' ' | b'\t' | b'\n' | b'\r') {
                byte_bits |= 1u64 << (i + j);
            }
            j += 1;
        }
        bitmap |= byte_bits;
        i += 8;
    }
    // Scalar tail for remaining bytes
    while i < window_len {
        let b = unsafe { *window.get_unchecked(i) };
        if matches!(b, b' ' | b'\t' | b'\n' | b'\r') {
            bitmap |= 1u64 << i;
        }
        i += 1;
    }

    state.ws_bitmap = bitmap;
    state.ws_bitmap_start = offset;

    let ws_count = bitmap.trailing_ones() as usize;
    let new_offset = offset + ws_count;

    if ws_count < window_len {
        // Found a non-WS byte within the window — done
        state.offset = new_offset;
        return;
    }

    // Entire 64-byte window was whitespace — continue with SIMD bulk scan
    state.offset = new_offset;
    let n = trim_leading_whitespace(state);
    state.offset += n;
}

/// Find the first occurrence of any of 4 target bytes in `haystack`.
/// Returns `(position, byte_found)`. Uses SIMD to scan 16 bytes per iteration.
///
/// Used by delimiter-scan codegen to replace 2 sequential `memchr` calls
/// (find delimiter, then find pivot within range) with a single pass that
/// classifies all structural bytes simultaneously.
#[inline(always)]
pub fn find_first_of_4(haystack: &[u8], b0: u8, b1: u8, b2: u8, b3: u8) -> Option<(usize, u8)> {
    use std::simd::prelude::*;

    let v0 = u8x16::splat(b0);
    let v1 = u8x16::splat(b1);
    let v2 = u8x16::splat(b2);
    let v3 = u8x16::splat(b3);

    let len = haystack.len();
    let mut i = 0;

    // SIMD: 16 bytes at a time.
    while i + 16 <= len {
        let chunk = u8x16::from_slice(&haystack[i..]);
        let mask = chunk.simd_eq(v0)
            | chunk.simd_eq(v1)
            | chunk.simd_eq(v2)
            | chunk.simd_eq(v3);
        if mask.any() {
            let pos = mask.to_bitmask().trailing_zeros() as usize;
            let idx = i + pos;
            return Some((idx, unsafe { *haystack.get_unchecked(idx) }));
        }
        i += 16;
    }

    // Scalar tail.
    while i < len {
        let b = unsafe { *haystack.get_unchecked(i) };
        if b == b0 || b == b1 || b == b2 || b == b3 {
            return Some((i, b));
        }
        i += 1;
    }

    None
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
/// Auto-dispatches to the optimal strategy based on target count:
/// - 1–3: `memchr` (hardware-accelerated AVX2/SSE2)
/// - 4:   SIMD `u8x16` parallel equality (4 splat + OR)
/// - 5–8: nibble LUT + `swizzle_dyn` (2 VPSHUFB per 16 bytes)
/// - 9+:  256-byte scalar LUT
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
        4 => find_first_of_4(haystack, targets[0], targets[1], targets[2], targets[3]),
        5..=8 => {
            let (lo_lut, hi_lut) = build_nibble_luts(targets);
            find_first_of_nibble_lut(haystack, &lo_lut, &hi_lut)
        }
        _ => {
            // 9+ targets: 256-byte scalar LUT
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
/// Returns `(position, byte_found)`. Uses SIMD to scan 16 bytes per iteration.
#[inline(always)]
pub fn find_first_of_3(haystack: &[u8], b0: u8, b1: u8, b2: u8) -> Option<(usize, u8)> {
    use std::simd::prelude::*;

    let v0 = u8x16::splat(b0);
    let v1 = u8x16::splat(b1);
    let v2 = u8x16::splat(b2);

    let len = haystack.len();
    let mut i = 0;

    while i + 16 <= len {
        let chunk = u8x16::from_slice(&haystack[i..]);
        let mask = chunk.simd_eq(v0) | chunk.simd_eq(v1) | chunk.simd_eq(v2);
        if mask.any() {
            let pos = mask.to_bitmask().trailing_zeros() as usize;
            let idx = i + pos;
            return Some((idx, unsafe { *haystack.get_unchecked(idx) }));
        }
        i += 16;
    }

    while i < len {
        let b = unsafe { *haystack.get_unchecked(i) };
        if b == b0 || b == b1 || b == b2 {
            return Some((i, b));
        }
        i += 1;
    }

    None
}

