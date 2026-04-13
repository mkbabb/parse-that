// Whitespace + block comment scanners.

use crate::state::{ParserState, Span};

/// Byte-class lookup table for the CSS whitespace set.
///
/// Tranche Y.7 replaces the 5-way scalar `b == b' ' || b == b'\t' ||
/// b == b'\n' || b == b'\r' || b == 0x0C` compare chain with a
/// single memory load. On CSS Tailwind (3.6 MB, ~15ms parse time,
/// post-W profile attributed 12.03% self-time to
/// `scan_ws_block_comments`'s scalar inner loop), the LUT lookup
/// compiles to `mov al, [WS_LUT + rdx] ; test al, al ; jz ...` —
/// one load + one test instead of five compares + four branches.
///
/// The LUT is placed in `.rodata` and shared across all calls.
static WS_LUT: [bool; 256] = {
    let mut lut = [false; 256];
    lut[b' ' as usize] = true;
    lut[b'\t' as usize] = true;
    lut[b'\n' as usize] = true;
    lut[b'\r' as usize] = true;
    lut[0x0C] = true;
    lut
};

/// Inline the LUT check — one instruction, no branch predictor cost.
#[inline(always)]
fn is_ascii_ws_no_vtab(b: u8) -> bool {
    WS_LUT[b as usize]
}

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
    // Single LUT load + one branch vs the previous 5-way compare
    // chain. On the no-op call sites (~300 in the generated CSS
    // parser) this is one instruction + one well-predicted branch.
    if start < len {
        let b = unsafe { *bytes.get_unchecked(start) };
        if !is_ascii_ws_no_vtab(b) && b != b'/' {
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
        // Tranche Y.7: skip ASCII whitespace via byte-class LUT.
        // The LUT collapses the previous 5-way compare chain into
        // one memory load per byte. On 8-byte unrolled loads LLVM
        // vectorizes the read without needing explicit intrinsics.
        while i < len {
            let b = unsafe { *bytes.get_unchecked(i) };
            if !is_ascii_ws_no_vtab(b) {
                break;
            }
            i += 1;
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
