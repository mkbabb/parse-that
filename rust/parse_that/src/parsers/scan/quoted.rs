// Quoted string scanner.

use crate::state::{ParserState, Span};

/// Scan a quoted string: "..." or '...' with \-escapes.
/// Returns span including quote delimiters.
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
