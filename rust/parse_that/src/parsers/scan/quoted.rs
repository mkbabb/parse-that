// Quoted string scanners.
//
// Two families:
//
// 1. **Generic** (`scan_string_quoted`): accepts `"` or `'`, treats
//    `\` as an escape that skips the next byte, no escape-sequence
//    validation. Used for CSS-style quoted strings.
//
// 2. **Strict** (`scan_quoted_string_strict*`): only `"`-delimited,
//    enforces RFC 8259 escape grammar (`\"`, `\\`, `\/`, `\b`, `\f`,
//    `\n`, `\r`, `\t`, and `\uXXXX` with surrogate-pair validation).
//    Used for JSON-style quoted strings.

use super::quoted_simd::scan_quoted_string_simd;
use crate::state::{ParserState, Span};

// ── Configuration ─────────────────────────────────────────────────

/// Configuration controlling which quoted-string syntax is accepted.
pub struct QuotedStringConfig {
    /// Required opening (and closing) quote byte (e.g., `b'"'`).
    pub quote_char: u8,
    /// Validate escape sequences per RFC 8259 (`\"`, `\\`, `\/`,
    /// `\b`, `\f`, `\n`, `\r`, `\t`). When `false`, every byte
    /// after `\` is consumed without validation.
    pub allows_escapes: bool,
    /// Allow `\uXXXX` Unicode escape sequences with surrogate-pair
    /// validation. Requires `allows_escapes`.
    pub allows_u_escapes: bool,
}

/// Strict (`"`-delimited, RFC 8259 escape grammar) quoted-string config.
pub const STRICT_QUOTED_STRING_CONFIG: QuotedStringConfig = QuotedStringConfig {
    quote_char: b'"',
    allows_escapes: true,
    allows_u_escapes: true,
};

/// Generic quoted-string config: accepts `"` or `'` (caller dispatches
/// on the leading byte), no escape validation. The `quote_char` field
/// is unused for this config — `sp_quoted_string` routes it through the
/// generic `scan_string_quoted` scanner instead.
pub const GENERIC_QUOTED_STRING_CONFIG: QuotedStringConfig = QuotedStringConfig {
    quote_char: b'"',
    allows_escapes: false,
    allows_u_escapes: false,
};

// ── Generic quoted scanner ─────────────────────────────────────────

/// Scan a quoted string: "..." or '...' with \-escapes.
/// Returns span including quote delimiters.
///
/// Uses the SIMD escape-parity scanner (`scan_quoted_string_simd`) which
/// processes 16 bytes per iteration with carry-based backslash parity
/// tracking, replacing the previous `memchr2` + per-backslash-skip loop.
#[inline(always)]
pub fn scan_string_quoted<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    if start >= bytes.len() {
        return None;
    }

    let quote = unsafe { *bytes.get_unchecked(start) };
    if quote != b'"' && quote != b'\'' {
        return None;
    }

    // SIMD scan from byte after the opening quote.
    let close_pos = scan_quoted_string_simd(bytes, start + 1, quote)?;
    state.offset = close_pos + 1; // advance past the closing quote
    Some(Span::new(start, close_pos + 1, state.src))
}

// ── Strict (`"`-only, RFC 8259 escape) quoted scanners ─────────────

#[inline(always)]
fn decode_hex_nibble(b: u8) -> Option<u16> {
    match b {
        b'0'..=b'9' => Some((b - b'0') as u16),
        b'a'..=b'f' => Some((b - b'a' + 10) as u16),
        b'A'..=b'F' => Some((b - b'A' + 10) as u16),
        _ => None,
    }
}

#[inline(always)]
fn decode_hex4(bytes: &[u8], start: usize) -> Option<u16> {
    Some(
        (decode_hex_nibble(*bytes.get(start)?)? << 12)
            | (decode_hex_nibble(*bytes.get(start + 1)?)? << 8)
            | (decode_hex_nibble(*bytes.get(start + 2)?)? << 4)
            | decode_hex_nibble(*bytes.get(start + 3)?)?,
    )
}

/// Validate strict-escape sequences in a quoted string body.
/// `bytes[content_start..content_end]` is the string content (between quotes).
/// Returns `true` iff all escape sequences are valid per RFC 8259.
#[inline(always)]
pub fn validate_strict_escapes(bytes: &[u8], content_start: usize, content_end: usize) -> bool {
    let mut i = content_start;
    while i < content_end {
        if unsafe { *bytes.get_unchecked(i) } == b'\\' {
            i += 1;
            if i >= content_end {
                return false;
            }
            match unsafe { *bytes.get_unchecked(i) } {
                b'u' => {
                    if i + 4 >= content_end {
                        // May extend to closing quote position — check full bytes
                        if i + 4 >= bytes.len() {
                            return false;
                        }
                    }
                    let hi = match decode_hex4(bytes, i + 1) {
                        Some(v) => v,
                        None => return false,
                    };
                    i += 5;
                    if (0xD800..=0xDBFF).contains(&hi) {
                        if i + 5 < bytes.len() && bytes[i] == b'\\' && bytes[i + 1] == b'u' {
                            let lo = match decode_hex4(bytes, i + 2) {
                                Some(v) => v,
                                None => return false,
                            };
                            if !(0xDC00..=0xDFFF).contains(&lo) {
                                return false;
                            }
                            i += 6;
                        } else {
                            return false;
                        }
                    } else if (0xDC00..=0xDFFF).contains(&hi) {
                        return false;
                    }
                }
                b'"' | b'\\' | b'/' | b'b' | b'f' | b'n' | b'r' | b't' => {
                    i += 1;
                }
                _ => return false,
            }
        } else {
            i += 1;
        }
    }
    true
}

/// Core strict quoted-string scanner with configurable span bounds.
///
/// Uses the SIMD escape-parity scanner to find the closing quote in bulk
/// (16 bytes at a time, branchless escape handling), then validates escape
/// sequences in a second pass when backslashes are present. Most strict
/// strings contain zero escapes, so the SIMD path dominates.
///
/// When `include_quotes` is false, returns content between quotes (exclusive).
/// When `include_quotes` is true, returns full span including delimiters.
#[inline(always)]
fn scan_quoted_string_inner_strict<'a>(
    state: &mut ParserState<'a>,
    include_quotes: bool,
) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    if bytes.get(start) != Some(&b'"') {
        return None;
    }

    let content_start = start + 1;

    // SIMD path: find the closing quote handling escape parity in bulk.
    let close_quote = scan_quoted_string_simd(bytes, content_start, b'"')?;

    // Validate escape sequences between the quotes. This is a separate pass
    // but only touches backslash positions — for escape-free strings (the
    // common case), memchr finds no backslashes and we skip instantly.
    if memchr::memchr(b'\\', &bytes[content_start..close_quote]).is_some() {
        if !validate_strict_escapes(bytes, content_start, close_quote) {
            return None;
        }
    }

    let end = close_quote + 1; // past the closing quote
    state.offset = end;

    if include_quotes {
        Some(Span::new(start, end, state.src))
    } else {
        Some(Span::new(content_start, close_quote, state.src))
    }
}

/// Scan a strict quoted string `"..."` with `\`-escape validation using SIMD.
/// Returns the span of the *content* (between the quotes, exclusive of `"`).
#[inline(always)]
pub fn scan_quoted_string_content<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    scan_quoted_string_inner_strict(state, false)
}

/// Scan a strict quoted string `"..."` with `\`-escape validation using SIMD.
/// Returns the span including the quote delimiters (matches regex behavior).
#[inline(always)]
pub fn scan_quoted_string_strict<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    scan_quoted_string_inner_strict(state, true)
}
