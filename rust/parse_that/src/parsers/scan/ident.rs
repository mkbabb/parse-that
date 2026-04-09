// Identifier scanner — plain idents, vendor prefixes, CSS custom properties.

use crate::state::{ParserState, Span};

/// Scan an identifier: -?[a-zA-Z_][\w-]* | --[\w-]+
/// Handles plain idents, vendor-prefixed (-webkit-), and custom properties (--var).
/// Returns None if no ident at current offset.
#[inline(always)]
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
