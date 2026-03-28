// Generalized monolithic scanners — language-agnostic, no regex, no vtable.
//
// These are the canonical implementations. Language-specific modules
// (css/scan.rs, json.rs) re-export under domain-prefixed names.

use crate::state::{ParserState, Span};

// ── Identifier scanner ─────────────────────────────────────────

/// Scan an identifier: -?[a-zA-Z_][\w-]* | --[\w-]+
/// Handles plain idents, vendor-prefixed (-webkit-), and custom properties (--var).
/// Returns None if no ident at current offset.
pub fn scan_ident<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
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

// ── Whitespace + block comment scanner ──────────────────────────

/// Scan whitespace and block comments: (\s | /\*...\*/)*
/// Always succeeds (returns empty span if no ws/comments).
pub fn scan_ws_block_comments<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
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

// ── Quoted string scanner ───────────────────────────────────────

/// Scan a quoted string: "..." or '...' with \-escapes.
/// Returns span including quote delimiters.
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
                // backslash: skip next byte
                i += 1;
                if i >= bytes.len() {
                    return None;
                }
                i += 1; // skip the escaped character
            }
        }
    }
}

// ── Block comment scanner ───────────────────────────────────────

/// Scan a block comment: /\*...\*/
/// Returns span including the delimiters.
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

// ── Balanced delimiter scanner ──────────────────────────────────

/// Scan from the current offset to find the end of a balanced value.
/// Returns the number of bytes scanned (relative offset to the terminator).
/// Terminates at depth-0 `;`, `{`, or `}` — NOT inside `()`, `""`, or `''`.
///
/// Handles nested parentheses, quoted strings with escapes, and balanced brackets.
pub fn scan_balanced_end(bytes: &[u8]) -> usize {
    let len = bytes.len();
    let mut i = 0;
    let mut paren_depth: u32 = 0;

    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        match b {
            b'(' => {
                paren_depth += 1;
                i += 1;
            }
            b')' => {
                if paren_depth > 0 {
                    paren_depth -= 1;
                }
                i += 1;
            }
            b'"' => {
                // Skip double-quoted string
                i += 1;
                while i < len {
                    let c = unsafe { *bytes.get_unchecked(i) };
                    if c == b'"' {
                        i += 1;
                        break;
                    }
                    if c == b'\\' {
                        i += 1; // skip escaped char
                    }
                    i += 1;
                }
            }
            b'\'' => {
                // Skip single-quoted string
                i += 1;
                while i < len {
                    let c = unsafe { *bytes.get_unchecked(i) };
                    if c == b'\'' {
                        i += 1;
                        break;
                    }
                    if c == b'\\' {
                        i += 1;
                    }
                    i += 1;
                }
            }
            b';' | b'{' | b'}' if paren_depth == 0 => {
                return i;
            }
            _ => {
                i += 1;
            }
        }
    }
    len // No terminator found — return full length
}
