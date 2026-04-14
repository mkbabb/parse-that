// JSON string decode-to-arena.
//
// Scans a `"`-delimited JSON string from `bytes[start..]`, decoding all
// RFC 8259 escape sequences. Decoded content is either borrowed directly
// from the input (zero-copy, when no escapes are present) or written to
// a caller-supplied arena `Vec<u8>`.

use super::quoted_simd::scan_quoted_string_simd;

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
/// **Fast path**: uses `memchr` to locate the first backslash. If none
/// is found before the closing quote, returns `Borrowed` with zero
/// arena writes.
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

    // Find the closing quote via the SIMD scanner (handles escape parity).
    let close_quote = scan_quoted_string_simd(bytes, content_start, b'"')?;
    let end = close_quote + 1;

    // Fast path: no backslash before the closing quote => zero-copy borrow.
    let content = &bytes[content_start..close_quote];
    match memchr::memchr(b'\\', content) {
        None => {
            let payload = StringPayload::Borrowed {
                start: content_start as u32,
                end: close_quote as u32,
            };
            Some((payload, end))
        }
        Some(first_bs) => {
            // Slow path: decode escapes into arena.
            let arena_offset = arena.len() as u32;

            // Copy the prefix before the first backslash.
            arena.extend_from_slice(&content[..first_bs]);

            // Decode from the first backslash onward.
            let ok = decode_escapes(bytes, content_start + first_bs, close_quote, arena);
            if !ok {
                // Roll back partial arena writes.
                arena.truncate(arena_offset as usize);
                return None;
            }

            let len = arena.len() as u32 - arena_offset;
            let payload = StringPayload::Owned { arena_offset, len };
            Some((payload, end))
        }
    }
}

/// Decode escape sequences from `bytes[pos..end]` (where `pos` points
/// at the first `\`), appending decoded UTF-8 to `arena`.
///
/// Returns `true` on success, `false` on any invalid escape.
#[inline]
fn decode_escapes(bytes: &[u8], mut pos: usize, end: usize, arena: &mut Vec<u8>) -> bool {
    while pos < end {
        let b = unsafe { *bytes.get_unchecked(pos) };
        if b != b'\\' {
            // Scan forward to next backslash or end -- bulk copy.
            let run_start = pos;
            pos += 1;
            while pos < end && unsafe { *bytes.get_unchecked(pos) } != b'\\' {
                pos += 1;
            }
            arena.extend_from_slice(&bytes[run_start..pos]);
            continue;
        }

        // Backslash at `pos`.
        pos += 1;
        if pos >= end {
            return false;
        }

        match unsafe { *bytes.get_unchecked(pos) } {
            b'"' => { arena.push(b'"'); pos += 1; }
            b'\\' => { arena.push(b'\\'); pos += 1; }
            b'/' => { arena.push(b'/'); pos += 1; }
            b'b' => { arena.push(0x08); pos += 1; }
            b'f' => { arena.push(0x0C); pos += 1; }
            b'n' => { arena.push(0x0A); pos += 1; }
            b'r' => { arena.push(0x0D); pos += 1; }
            b't' => { arena.push(0x09); pos += 1; }
            b'u' => {
                pos += 1;
                let Some(hi) = decode_hex4(bytes, pos) else { return false; };
                pos += 4;

                let codepoint = if (0xD800..=0xDBFF).contains(&hi) {
                    // High surrogate -- must be followed by \uDC00..DFFF.
                    if pos + 5 < bytes.len()
                        && bytes.get(pos) == Some(&b'\\')
                        && bytes.get(pos + 1) == Some(&b'u')
                    {
                        let Some(lo) = decode_hex4(bytes, pos + 2) else { return false; };
                        if !(0xDC00..=0xDFFF).contains(&lo) {
                            return false;
                        }
                        pos += 6;
                        // Combine surrogate pair.
                        0x10000 + ((hi as u32 - 0xD800) << 10) + (lo as u32 - 0xDC00)
                    } else {
                        return false;
                    }
                } else if (0xDC00..=0xDFFF).contains(&hi) {
                    // Lone low surrogate is invalid.
                    return false;
                } else {
                    hi as u32
                };

                // Encode codepoint as UTF-8.
                encode_utf8(codepoint, arena);
            }
            _ => return false,
        }
    }
    true
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
