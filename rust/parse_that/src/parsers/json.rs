use std::borrow::Cow;

use crate::parse::*;
use crate::span_parser::*;
use crate::state::{ParserState, Span};

use pprint::Pretty;

use super::scan::scan_json_number_f64;

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

// ── Monolithic JSON string scanner ────────────────────────────

/// Validate escape sequences in a JSON string body.
/// `bytes[content_start..content_end]` is the string content (between quotes).
/// Returns `true` iff all escape sequences are valid JSON.
#[inline(always)]
fn validate_json_escapes(bytes: &[u8], content_start: usize, content_end: usize) -> bool {
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

/// Core JSON string scanner with configurable span bounds.
///
/// Uses the SIMD escape-parity scanner to find the closing quote in bulk
/// (16 bytes at a time, branchless escape handling), then validates escape
/// sequences in a second pass when backslashes are present. Most JSON
/// strings contain zero escapes, so the SIMD path dominates.
///
/// When `include_quotes` is false, returns content between quotes (exclusive).
/// When `include_quotes` is true, returns full span including delimiters.
#[inline(always)]
fn quoted_string_scan_inner<'a>(
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
    let close_quote = super::scan::quoted_simd::scan_quoted_string_simd(
        bytes,
        content_start,
        b'"',
    )?;

    // Validate escape sequences between the quotes. This is a separate pass
    // but only touches backslash positions — for escape-free strings (the
    // common case), memchr finds no backslashes and we skip instantly.
    if memchr::memchr(b'\\', &bytes[content_start..close_quote]).is_some() {
        if !validate_json_escapes(bytes, content_start, close_quote) {
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

/// Scans a JSON string `"..."` with `\`-escape handling using SIMD (memchr2).
/// Returns the span of the *content* (between the quotes, exclusive of `"`).
#[inline(always)]
pub(crate) fn quoted_string_scan_content<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    quoted_string_scan_inner(state, false)
}

/// Scans a JSON string `"..."` with `\`-escape handling using SIMD (memchr2).
/// Returns the span including the quote delimiters (matches regex behavior).
#[inline(always)]
pub fn quoted_string_scan_full<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    quoted_string_scan_inner(state, true)
}

// ── JSON Value types and parsers ──────────────────────────────

#[derive(Pretty, Debug, Clone, PartialEq)]
pub enum JsonValue<'a> {
    #[pprint(rename = "null")]
    Null,
    Bool(bool),
    Number(f64),
    String(Cow<'a, str>),
    Array(Box<Vec<JsonValue<'a>>>),
    Object(Box<Vec<(Cow<'a, str>, JsonValue<'a>)>>),
}

pub fn json_value<'a>() -> Parser<'a, JsonValue<'a>> {
    // ── String parser using monolithic SIMD scanner ────────────
    // Returns raw spans (no unescape) — zero-copy.

    let json_string_content =
        || -> Parser<'a, Cow<'a, str>> { sp_json_string().map(|s| Cow::Borrowed(s.as_str())) };

    // ── Leaf values ───────────────────────────────────────────

    let json_null: Parser<'a, JsonValue<'a>> = sp_string("null").map(|_| JsonValue::Null);
    let json_true: Parser<'a, JsonValue<'a>> = sp_string("true").map(|_| JsonValue::Bool(true));
    let json_false: Parser<'a, JsonValue<'a>> = sp_string("false").map(|_| JsonValue::Bool(false));

    let json_number = || -> Parser<'a, JsonValue<'a>> {
        Parser::new(move |state: &mut ParserState<'a>| {
            let f = scan_json_number_f64(state)?;
            Some(JsonValue::Number(f))
        })
    };

    let json_string =
        || -> Parser<'a, JsonValue<'a>> { json_string_content().map(JsonValue::String) };

    // ── Array: hand-rolled loop inside a Parser for pre-allocated capacity ──

    let json_array = crate::lazy::lazy(|| {
        let value = json_value();
        let open = sp_string("[");
        let close = sp_string("]");
        let comma = sp_string(",").trim_whitespace();

        Parser::new(move |state: &mut ParserState<'a>| {
            open.call(state)?;
            crate::scanners::trim_leading_whitespace_mut(state);

            if close.call(state).is_some() {
                return Some(JsonValue::Array(Box::new(Vec::new())));
            }

            let mut items = Vec::with_capacity(4);
            loop {
                crate::scanners::trim_leading_whitespace_mut(state);
                items.push(value.call(state)?);
                crate::scanners::trim_leading_whitespace_mut(state);
                if comma.call(state).is_none() {
                    break;
                }
            }

            close.call(state)?;
            Some(JsonValue::Array(Box::new(items)))
        })
    });

    // ── Object: hand-rolled loop inside a Parser for pre-allocated capacity ──

    let json_object = crate::lazy::lazy(move || {
        let value = json_value();
        let key = json_string_content();
        let open = sp_string("{");
        let close = sp_string("}");
        let colon = sp_string(":").trim_whitespace();
        let comma = sp_string(",").trim_whitespace();

        Parser::new(move |state: &mut ParserState<'a>| {
            open.call(state)?;
            crate::scanners::trim_leading_whitespace_mut(state);

            if close.call(state).is_some() {
                return Some(JsonValue::Object(Box::new(Vec::new())));
            }

            let mut entries = Vec::with_capacity(4);
            loop {
                crate::scanners::trim_leading_whitespace_mut(state);
                let k = key.call(state)?;
                colon.call(state)?;
                let v = value.call(state)?;
                entries.push((k, v));
                crate::scanners::trim_leading_whitespace_mut(state);
                if comma.call(state).is_none() {
                    break;
                }
            }

            close.call(state)?;
            Some(JsonValue::Object(Box::new(entries)))
        })
    });

    // ── First-byte dispatch ───────────────────────────────────

    crate::leaf::dispatch_byte_multi(vec![
        (b"{" as &[u8], json_object),
        (b"[", json_array),
        (b"\"", json_string()),
        (b"t", json_true),
        (b"f", json_false),
        (b"n", json_null),
        (b"-0123456789", json_number()),
    ])
}

pub fn json_parser<'a>() -> Parser<'a, JsonValue<'a>> {
    json_value().trim_whitespace()
}
