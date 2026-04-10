// Whitespace + block comment scanners.

use crate::state::{ParserState, Span};

/// Scan whitespace and block comments: (\s | /\*...\*/)*
/// Always succeeds (returns empty span if no ws/comments).
///
/// Whitespace set: `{' ', \t, \n, \f, \r}` (NOT `\v`).
///
/// Hot path is a single-byte check: if the next byte is neither
/// whitespace nor `/` (potential comment start), return an empty
/// span immediately without entering the loop. This eliminates
/// the outer loop bookkeeping at every no-op call site (~300 in
/// the generated CSS parser) at the cost of a single extra
/// compare on the cold side.
#[inline(always)]
pub fn scan_ws_block_comments<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();

    // Fast-return for the common "no whitespace, no comment" case.
    // Single load + handful of compares at the call site, skipping
    // the outer loop bookkeeping.
    if start < len {
        let b = unsafe { *bytes.get_unchecked(start) };
        if b != b' '
            && b != b'\t'
            && b != b'\n'
            && b != b'\r'
            && b != 0x0C
            && b != b'/'
        {
            return Some(Span::new(start, start, state.src));
        }
    } else {
        return Some(Span::new(start, start, state.src));
    }

    // Cold path: outlined so the caller site stays minimal.
    scan_ws_block_comments_slow(state, start, bytes, len)
}

/// Outlined slow path for `scan_ws_block_comments`. Called only
/// when the first byte at the current offset is whitespace or
/// the `/` of a potential `/*...*/` block comment.
#[cold]
#[inline(never)]
fn scan_ws_block_comments_slow<'a>(
    state: &mut ParserState<'a>,
    start: usize,
    bytes: &'a [u8],
    len: usize,
) -> Option<Span<'a>> {
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

/// Scan a block comment: /\*...\*/
/// Returns span including the delimiters.
#[inline(always)]
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
