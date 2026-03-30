// Generalized monolithic scanners — language-agnostic, no regex, no vtable.
//
// These are the canonical implementations. Language-specific modules
// (css/scan.rs, json.rs) re-export under domain-prefixed names.

use crate::state::{ParserState, Span};

// ── Identifier scanner ─────────────────────────────────────────

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

// ── Whitespace + block comment scanner ──────────────────────────

/// Scan whitespace and block comments: (\s | /\*...\*/)*
/// Always succeeds (returns empty span if no ws/comments).
#[inline(always)]
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

// ── Block comment scanner ───────────────────────────────────────

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

// ── Balanced delimiter scanner ──────────────────────────────────

/// Configuration for balanced structural scanning.
///
/// The union of `{open, close, quotes[..], terminators[..]}` forms the target
/// set for SIMD byte classification.  Must total ≤ 8 unique bytes.
pub struct BalancedScanConfig {
    /// Byte that increases nesting depth (e.g., `(` or `{`).
    pub open: u8,
    /// Byte that decreases nesting depth (e.g., `)` or `}`).
    pub close: u8,
    /// Quote bytes that toggle string-skipping mode (e.g., `"`, `'`).
    pub quotes: &'static [u8],
    /// Escape byte inside quotes (e.g., `\`).
    pub escape: u8,
    /// Bytes that terminate scanning at depth 0 (e.g., `;`, `{`, `}`).
    pub terminators: &'static [u8],
}

/// Scan forward to find a depth-0 terminator, respecting nesting and quotes.
/// Returns offset of the terminator (relative to start of `bytes`).
///
/// Uses SIMD (nibble LUT + `swizzle_dyn`) to skip data bytes between structural
/// characters, and `memchr2` for SIMD-accelerated string skipping.
#[inline(always)]
pub fn scan_balanced(bytes: &[u8], config: &BalancedScanConfig) -> usize {
    use crate::leaf::{build_nibble_luts, find_first_of_nibble_lut};

    // Pre-build nibble LUTs for all structural bytes (done once per call).
    let mut structural = [0u8; 8];
    let mut n = 0;
    structural[n] = config.open;
    n += 1;
    structural[n] = config.close;
    n += 1;
    for &q in config.quotes {
        structural[n] = q;
        n += 1;
    }
    for &t in config.terminators {
        structural[n] = t;
        n += 1;
    }
    debug_assert!(n <= 8, "scan_balanced: too many structural bytes for nibble LUT");
    let (lo_lut, hi_lut) = build_nibble_luts(&structural[..n]);

    let len = bytes.len();
    let mut i = 0;
    let mut depth: u32 = 0;

    while i < len {
        // SIMD: skip data bytes, find next structural byte
        match find_first_of_nibble_lut(&bytes[i..], &lo_lut, &hi_lut) {
            None => return len,
            Some((pos, b)) => {
                i += pos;
                if b == config.open {
                    depth += 1;
                    i += 1;
                } else if b == config.close {
                    if depth > 0 {
                        depth -= 1;
                    }
                    i += 1;
                } else if config.quotes.contains(&b) {
                    // Skip quoted string — memchr2 for SIMD-accelerated scanning
                    i += 1;
                    loop {
                        match bytes.get(i..) {
                            Some(rem) if !rem.is_empty() => {
                                match memchr::memchr2(b, config.escape, rem) {
                                    None => {
                                        i = len;
                                        break;
                                    }
                                    Some(p) => {
                                        i += p;
                                        if unsafe { *bytes.get_unchecked(i) } == b {
                                            i += 1;
                                            break;
                                        }
                                        // Escape: skip next byte
                                        i += 2;
                                        if i >= len {
                                            i = len;
                                            break;
                                        }
                                    }
                                }
                            }
                            _ => {
                                i = len;
                                break;
                            }
                        }
                    }
                } else {
                    // Terminator byte
                    if depth == 0 {
                        return i;
                    }
                    i += 1;
                }
            }
        }
    }

    len
}

/// CSS-specific balanced scanner: tracks `()` nesting, skips `""`/`''` strings,
/// terminates at depth-0 `;`, `{`, or `}`.
#[inline(always)]
pub fn scan_balanced_end(bytes: &[u8]) -> usize {
    static CSS_CONFIG: BalancedScanConfig = BalancedScanConfig {
        open: b'(',
        close: b')',
        quotes: &[b'"', b'\''],
        escape: b'\\',
        terminators: &[b';', b'{', b'}'],
    };
    scan_balanced(bytes, &CSS_CONFIG)
}
