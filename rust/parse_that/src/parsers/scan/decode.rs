// JSON string decode-to-arena.
//
// Scans a `"`-delimited JSON string from `bytes[start..]`, decoding all
// RFC 8259 escape sequences. Decoded content is either borrowed directly
// from the input (zero-copy, when no escapes are present) or written to
// a caller-supplied arena `Vec<u8>`.
//
// ## SIMD strategy (AV.4.3, simdjson stage-2 tape_builder pattern)
//
// One pass over the input: 16-byte stripes classified by SIMD into
// `quote_bits | bs_bits = stop_bits`. In escape-free mode the inner
// loop ticks one stripe per iteration with no per-byte branch — when
// every stripe arrives with `stop_bits == 0` we copy nothing (Borrowed
// path) or copy a full `u8x16` (Owned path) and continue. The first
// stripe carrying a real backslash forces owned mode; from there each
// escape-free run between escapes copies stripe-strided into the arena
// before scalar handling decodes the escape itself.

use std::simd::prelude::*;

use super::quoted_simd::odd_parity_backslashes;

const CHUNK: usize = 16;
const MASK16: u32 = 0xFFFF;

/// Payload for a decoded JSON string.
///
/// `Borrowed`: no escapes -- the string content (excluding quotes) can
/// be referenced directly from the input slice. Zero-copy.
///
/// `Owned`: contains escape sequences -- decoded UTF-8 bytes were
/// appended to the arena. The `arena_offset` and `len` identify the
/// slice within the arena.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StringPayload {
    Borrowed { start: u32, end: u32 },
    Owned { arena_offset: u32, len: u32 },
}

/// Decode a JSON string starting at `bytes[start]` (the opening `"`),
/// writing any escape-decoded bytes to `arena`.
///
/// Returns `(payload, end)` where `end` is the offset past the closing
/// quote. Returns `None` on malformed input (unterminated string,
/// invalid escape, bad surrogate pair).
///
/// The fused SIMD scan classifies escape and quote bytes in the same
/// `u8x16` stripe pass: an escape-free input takes the Borrowed path
/// without ever touching the arena; an escape-bearing input copies
/// each escape-free run between escapes 16 bytes at a time.
#[inline]
pub fn decode_json_string_to_arena(
    bytes: &[u8],
    start: usize,
    arena: &mut Vec<u8>,
) -> Option<(StringPayload, usize)> {
    if bytes.get(start) != Some(&b'"') {
        return None;
    }
    let content_start = start + 1;
    simd_scan_or_decode(bytes, content_start, arena)
}

/// Walk the input in 16-byte stripes looking for the first real stop
/// (closing `"` or unescaped `\`). On a real quote, return Borrowed.
/// On a real backslash, hand off to owned-mode escape decoding.
#[inline]
fn simd_scan_or_decode(
    bytes: &[u8],
    content_start: usize,
    arena: &mut Vec<u8>,
) -> Option<(StringPayload, usize)> {
    let len = bytes.len();
    let mut pos = content_start;
    let mut carry: u32 = 0;

    let quote_splat = u8x16::splat(b'"');
    let bs_splat = u8x16::splat(b'\\');

    while pos + CHUNK <= len {
        let chunk = u8x16::from_slice(unsafe { bytes.get_unchecked(pos..pos + CHUNK) });
        let quote_bits = chunk.simd_eq(quote_splat).to_bitmask() as u32;
        let bs_bits = chunk.simd_eq(bs_splat).to_bitmask() as u32;

        // Escape-free fast stripe: no backslash in stripe and no
        // pending carry from a previous odd-length backslash run.
        if (quote_bits | bs_bits) == 0 && carry == 0 {
            pos += CHUNK;
            continue;
        }

        // Resolve escape parity: which positions in this stripe are
        // preceded by an odd-length backslash run (and so are escaped).
        let escaped = if bs_bits == 0 {
            let e = carry;
            carry = 0;
            e
        } else {
            let odd = odd_parity_backslashes(bs_bits, carry);
            let e = ((odd << 1) | carry) & MASK16;
            carry = (odd >> 15) & 1;
            e
        };

        let real_quotes = quote_bits & !escaped;
        let real_bs = bs_bits & !escaped;
        let real_stops = real_quotes | real_bs;

        if real_stops == 0 {
            pos += CHUNK;
            continue;
        }

        let off = real_stops.trailing_zeros() as usize;
        let abs = pos + off;

        if (real_quotes >> off) & 1 == 1 {
            // Closing quote — clean Borrowed path.
            let payload = StringPayload::Borrowed {
                start: content_start as u32,
                end: abs as u32,
            };
            return Some((payload, abs + 1));
        }

        // First real backslash — switch to owned decode.
        return owned_decode(bytes, content_start, abs, arena);
    }

    // ── Scalar tail (< 16 bytes remaining) ──────────────────────────
    scalar_scan_or_decode(bytes, content_start, pos, carry != 0, arena)
}

/// Owned-mode decode: append the escape-free prefix
/// [`content_start`..`first_bs`] in bulk, then SIMD-stride copy
/// escape-free runs interleaved with scalar escape handling.
#[inline]
fn owned_decode(
    bytes: &[u8],
    content_start: usize,
    first_bs: usize,
    arena: &mut Vec<u8>,
) -> Option<(StringPayload, usize)> {
    let arena_offset = arena.len() as u32;

    arena.extend_from_slice(unsafe { bytes.get_unchecked(content_start..first_bs) });

    let end_pos = match decode_escapes_simd(bytes, first_bs, arena) {
        Some(end) => end,
        None => {
            arena.truncate(arena_offset as usize);
            return None;
        }
    };

    let len = arena.len() as u32 - arena_offset;
    let payload = StringPayload::Owned { arena_offset, len };
    Some((payload, end_pos + 1))
}

/// Decode escape sequences and copy escape-free runs from `bytes[pos..]`
/// (where `pos` points at a `\`) until the closing quote. Appends to
/// `arena`. Returns the byte index of the closing quote, or `None` on
/// invalid input.
///
/// Inside the loop, escape-free 16-byte stripes copy through a
/// `u8x16` register store ([`store_chunk`]) — one `vst1q_u8` (NEON) /
/// `_mm_storeu_si128` (x86) per stripe with no per-byte branch.
/// Sub-stripe runs copy the prefix up to the next stop byte.
#[inline]
fn decode_escapes_simd(bytes: &[u8], mut pos: usize, arena: &mut Vec<u8>) -> Option<usize> {
    let len = bytes.len();
    let quote_splat = u8x16::splat(b'"');
    let bs_splat = u8x16::splat(b'\\');

    loop {
        // Peel any pending escape sequence(s) at `pos`.
        while pos < len && unsafe { *bytes.get_unchecked(pos) } == b'\\' {
            pos = decode_one_escape(bytes, pos, arena)?;
        }

        if pos >= len {
            return None;
        }

        // SIMD-stride copy escape-free bytes until next stop.
        while pos + CHUNK <= len {
            let chunk = u8x16::from_slice(unsafe { bytes.get_unchecked(pos..pos + CHUNK) });
            let quote_bits = chunk.simd_eq(quote_splat).to_bitmask() as u32;
            let bs_bits = chunk.simd_eq(bs_splat).to_bitmask() as u32;
            let stop_bits = quote_bits | bs_bits;

            if stop_bits == 0 {
                store_chunk(arena, chunk);
                pos += CHUNK;
                continue;
            }

            let off = stop_bits.trailing_zeros() as usize;

            if off > 0 {
                arena.extend_from_slice(unsafe { bytes.get_unchecked(pos..pos + off) });
            }
            let abs = pos + off;

            if (quote_bits >> off) & 1 == 1 {
                return Some(abs);
            }

            // Backslash at `abs` — break to outer loop, peel escape(s).
            pos = abs;
            break;
        }

        if pos + CHUNK > len {
            return scalar_decode_tail(bytes, pos, arena);
        }
    }
}

/// Append a `u8x16` register's contents to `arena` as a single 128-bit
/// store (`vst1q_u8` on NEON, `_mm_storeu_si128` on x86). Reserves
/// space if needed, then writes the lane bytes through a raw pointer
/// before bumping `len` — the register never round-trips through a
/// stack temporary.
#[inline(always)]
fn store_chunk(arena: &mut Vec<u8>, chunk: u8x16) {
    let old_len = arena.len();
    arena.reserve(CHUNK);
    unsafe {
        let dst = arena.as_mut_ptr().add(old_len);
        // u8x16 → [u8; 16] lowers to a single SIMD store at dst.
        std::ptr::write_unaligned(dst as *mut [u8; CHUNK], chunk.to_array());
        arena.set_len(old_len + CHUNK);
    }
}

/// Scalar drain when fewer than 16 bytes remain in owned-mode decode.
/// Walks per-byte, honouring escapes and stopping at the closing quote.
#[inline]
fn scalar_decode_tail(bytes: &[u8], mut pos: usize, arena: &mut Vec<u8>) -> Option<usize> {
    let len = bytes.len();
    while pos < len {
        let b = unsafe { *bytes.get_unchecked(pos) };
        if b == b'"' {
            return Some(pos);
        }
        if b == b'\\' {
            pos = decode_one_escape(bytes, pos, arena)?;
            continue;
        }
        arena.push(b);
        pos += 1;
    }
    None
}

/// Scalar fallback for the last < 16 bytes of the borrowed-mode pass.
/// Mirrors the SIMD loop's behaviour: real quote → Borrowed; real
/// backslash → handoff to owned decode.
#[inline]
fn scalar_scan_or_decode(
    bytes: &[u8],
    content_start: usize,
    mut pos: usize,
    mut byte0_escaped: bool,
    arena: &mut Vec<u8>,
) -> Option<(StringPayload, usize)> {
    let len = bytes.len();
    while pos < len {
        if byte0_escaped {
            byte0_escaped = false;
            pos += 1;
            continue;
        }
        let b = unsafe { *bytes.get_unchecked(pos) };
        if b == b'"' {
            let payload = StringPayload::Borrowed {
                start: content_start as u32,
                end: pos as u32,
            };
            return Some((payload, pos + 1));
        }
        if b == b'\\' {
            return owned_decode(bytes, content_start, pos, arena);
        }
        pos += 1;
    }
    None
}

/// Handle one escape sequence at `bytes[pos]` (which is `\`). Appends
/// the decoded bytes to `arena` and returns the position past the
/// escape. Surrogate pairs consume both halves.
#[inline]
fn decode_one_escape(bytes: &[u8], pos: usize, arena: &mut Vec<u8>) -> Option<usize> {
    debug_assert_eq!(bytes.get(pos), Some(&b'\\'));
    let len = bytes.len();
    if pos + 1 >= len {
        return None;
    }
    match unsafe { *bytes.get_unchecked(pos + 1) } {
        b'"' => { arena.push(b'"'); Some(pos + 2) }
        b'\\' => { arena.push(b'\\'); Some(pos + 2) }
        b'/' => { arena.push(b'/'); Some(pos + 2) }
        b'b' => { arena.push(0x08); Some(pos + 2) }
        b'f' => { arena.push(0x0C); Some(pos + 2) }
        b'n' => { arena.push(0x0A); Some(pos + 2) }
        b'r' => { arena.push(0x0D); Some(pos + 2) }
        b't' => { arena.push(0x09); Some(pos + 2) }
        b'u' => {
            let hi = decode_hex4(bytes, pos + 2)?;
            let mut next = pos + 6;

            let codepoint = if (0xD800..=0xDBFF).contains(&hi) {
                if next + 5 < len
                    && unsafe { *bytes.get_unchecked(next) } == b'\\'
                    && unsafe { *bytes.get_unchecked(next + 1) } == b'u'
                {
                    let lo = decode_hex4(bytes, next + 2)?;
                    if !(0xDC00..=0xDFFF).contains(&lo) {
                        return None;
                    }
                    next += 6;
                    0x10000 + ((hi as u32 - 0xD800) << 10) + (lo as u32 - 0xDC00)
                } else {
                    return None;
                }
            } else if (0xDC00..=0xDFFF).contains(&hi) {
                return None;
            } else {
                hi as u32
            };

            encode_utf8(codepoint, arena);
            Some(next)
        }
        _ => None,
    }
}

/// Decode four hex digits from `bytes[start..start+4]` into a `u16`.
#[inline(always)]
fn decode_hex4(bytes: &[u8], start: usize) -> Option<u16> {
    Some(
        (decode_hex_nibble(*bytes.get(start)?)? << 12)
            | (decode_hex_nibble(*bytes.get(start + 1)?)? << 8)
            | (decode_hex_nibble(*bytes.get(start + 2)?)? << 4)
            | decode_hex_nibble(*bytes.get(start + 3)?)?,
    )
}

#[inline(always)]
fn decode_hex_nibble(b: u8) -> Option<u16> {
    match b {
        b'0'..=b'9' => Some((b - b'0') as u16),
        b'a'..=b'f' => Some((b - b'a' + 10) as u16),
        b'A'..=b'F' => Some((b - b'A' + 10) as u16),
        _ => None,
    }
}

/// Encode a Unicode codepoint as UTF-8, appending bytes to `arena`.
#[inline(always)]
fn encode_utf8(cp: u32, arena: &mut Vec<u8>) {
    if cp < 0x80 {
        arena.push(cp as u8);
    } else if cp < 0x800 {
        arena.push(0xC0 | (cp >> 6) as u8);
        arena.push(0x80 | (cp & 0x3F) as u8);
    } else if cp < 0x10000 {
        arena.push(0xE0 | (cp >> 12) as u8);
        arena.push(0x80 | ((cp >> 6) & 0x3F) as u8);
        arena.push(0x80 | (cp & 0x3F) as u8);
    } else {
        arena.push(0xF0 | (cp >> 18) as u8);
        arena.push(0x80 | ((cp >> 12) & 0x3F) as u8);
        arena.push(0x80 | ((cp >> 6) & 0x3F) as u8);
        arena.push(0x80 | (cp & 0x3F) as u8);
    }
}
