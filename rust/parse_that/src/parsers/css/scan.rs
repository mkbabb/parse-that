// Monolithic CSS scanners (no regex, no vtable) and leaf token wrappers.

use crate::span_parser::*;
use crate::state::{ParserState, Span};

// ── Monolithic scanners ─────────────────────────────────────

/// Scan a CSS identifier: -?[a-zA-Z_][\w-]* | --[\w-]+
/// Returns None if no ident at current offset.
pub(crate) fn css_ident_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    if start >= len {
        return None;
    }

    let mut i = start;
    let b0 = unsafe { *bytes.get_unchecked(i) };

    if b0 == b'-' {
        i += 1;
        if i >= len {
            return None;
        }
        let b1 = unsafe { *bytes.get_unchecked(i) };
        if b1 == b'-' {
            // Custom property: --[\w-]+
            i += 1;
            while i < len {
                let b = unsafe { *bytes.get_unchecked(i) };
                if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
                    i += 1;
                } else {
                    break;
                }
            }
            if i == start + 2 {
                return None; // just "--" with no continuation
            }
            state.offset = i;
            return Some(Span::new(start, i, state.src));
        }
        // -[a-zA-Z_]...
        if !(b1.is_ascii_alphabetic() || b1 == b'_') {
            return None;
        }
        i += 1;
    } else if b0.is_ascii_alphabetic() || b0 == b'_' {
        i += 1;
    } else {
        return None;
    }

    // Continue with [a-zA-Z0-9_-]*
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
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

/// Scan CSS whitespace and comments: (\s | /\*...\*/)*
/// Always succeeds (returns empty span if no ws/comments).
pub(crate) fn css_ws_comment_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;

    loop {
        // Skip ASCII whitespace
        while i < len {
            let b = unsafe { *bytes.get_unchecked(i) };
            if b == b' ' || b == b'\t' || b == b'\n' || b == b'\r' || b == 0x0C {
                i += 1;
            } else {
                break;
            }
        }

        // Check for block comment /*...*/
        if i + 1 < len
            && unsafe { *bytes.get_unchecked(i) } == b'/'
            && unsafe { *bytes.get_unchecked(i + 1) } == b'*'
        {
            i += 2;
            // Scan for */
            loop {
                match memchr::memchr(b'*', bytes.get(i..)?) {
                    None => {
                        // Unterminated comment — consume rest
                        i = len;
                        break;
                    }
                    Some(pos) => {
                        i += pos + 1;
                        if i < len && unsafe { *bytes.get_unchecked(i) } == b'/' {
                            i += 1;
                            break;
                        }
                    }
                }
            }
            continue; // Check for more ws/comments after this comment
        }

        break;
    }

    state.offset = i;
    Some(Span::new(start, i, state.src))
}

/// Scan a CSS quoted string: "..." or '...' with \-escapes.
/// Returns span including quote delimiters.
pub(crate) fn css_string_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    if start >= bytes.len() {
        return None;
    }

    let quote = unsafe { *bytes.get_unchecked(start) };
    if quote != b'"' && quote != b'\'' {
        return None;
    }

    let mut i = start + 1;
    loop {
        // SIMD scan for quote or backslash
        match memchr::memchr2(quote, b'\\', bytes.get(i..)?) {
            None => return None, // unterminated string
            Some(pos) => {
                i += pos;
                if unsafe { *bytes.get_unchecked(i) } == quote {
                    i += 1; // consume closing quote
                    state.offset = i;
                    return Some(Span::new(start, i, state.src));
                }
                // backslash: skip next byte (CSS escapes are simpler than JSON)
                i += 1;
                if i >= bytes.len() {
                    return None;
                }
                i += 1; // skip the escaped character
            }
        }
    }
}

/// Scan a CSS block comment: /\*...\*/
/// Returns span including the delimiters.
pub(crate) fn css_block_comment_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
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

    let mut i = start + 2;
    loop {
        match memchr::memchr(b'*', bytes.get(i..)?) {
            None => return None, // unterminated comment
            Some(pos) => {
                i += pos + 1;
                if i < len && unsafe { *bytes.get_unchecked(i) } == b'/' {
                    i += 1;
                    state.offset = i;
                    return Some(Span::new(start, i, state.src));
                }
            }
        }
    }
}

// ── Leaf token parsers (SpanParser wrappers) ────────────────

pub(super) fn css_ident<'a>() -> SpanParser<'a> {
    sp_css_ident()
}

pub(super) fn css_string<'a>() -> SpanParser<'a> {
    sp_css_string()
}

pub(super) fn css_comment<'a>() -> SpanParser<'a> {
    sp_css_block_comment()
}

pub(super) fn css_ws<'a>() -> SpanParser<'a> {
    sp_css_ws_comment()
}

// Number + dimension parsing

pub(super) fn css_number_span<'a>() -> SpanParser<'a> {
    sp_json_number()
}
