// Quoted string scanner.

use super::quoted_simd::scan_quoted_string_simd;
use crate::state::{ParserState, Span};

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
