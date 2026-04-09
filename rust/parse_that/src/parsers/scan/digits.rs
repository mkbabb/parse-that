// Digit / alphanumeric class scanners — Tranche W phase 5d.
//
// Hoisted helpers for the most common `[0-9]+` and `[a-zA-Z0-9]+`
// quantified character classes the BBNF backend would otherwise emit
// inline. The cargo-expand audit measured 86 duplicated
// `is_ascii_digit()` while-loops in the CSS L4 generated parser
// (~55,900 bytes of byte-equivalent code); routing them through these
// helpers collapses the duplication to a single helper definition +
// N call sites.

use crate::state::{ParserState, Span};

/// Scan one-or-more ASCII digits (`[0-9]+`). Advances `state.offset`
/// and returns the matched span on success; returns `None` if no
/// digits at the current offset.
#[inline(always)]
pub fn scan_digits_mut<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_digit() {
            i += 1;
        } else {
            break;
        }
    }
    if i == start {
        return None;
    }
    state.offset = i;
    Some(Span::new(start, i, state.src))
}

/// Scan zero-or-more ASCII digits (`[0-9]*`). Always succeeds; the
/// returned span may be empty.
#[inline(always)]
pub fn scan_digits_star_mut<'a>(state: &mut ParserState<'a>) -> Span<'a> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_digit() {
            i += 1;
        } else {
            break;
        }
    }
    state.offset = i;
    Span::new(start, i, state.src)
}

/// Scan one-or-more ASCII alphanumerics (`[a-zA-Z0-9]+`). Advances
/// `state.offset` and returns the matched span on success; returns
/// `None` if no alphanumerics at the current offset.
#[inline(always)]
pub fn scan_alnum_mut<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_alphanumeric() {
            i += 1;
        } else {
            break;
        }
    }
    if i == start {
        return None;
    }
    state.offset = i;
    Some(Span::new(start, i, state.src))
}

/// Scan one-or-more ASCII hex digits (`[0-9a-fA-F]+`). Advances
/// `state.offset` and returns the matched span on success; returns
/// `None` if no hex digits at the current offset.
#[inline(always)]
pub fn scan_hex_mut<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_hexdigit() {
            i += 1;
        } else {
            break;
        }
    }
    if i == start {
        return None;
    }
    state.offset = i;
    Some(Span::new(start, i, state.src))
}
