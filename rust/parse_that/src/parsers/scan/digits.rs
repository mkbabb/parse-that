// Digit / alphanumeric class scanners — AW-IV.W4.2.b consolidated.
//
// Hoisted helpers for the most common `[0-9]+` and `[a-zA-Z0-9]+`
// quantified character classes the BBNF backend would otherwise emit
// inline. The six span/parse/star/mut variants collapse to one
// generic `scan_class_while_mut` taking the byte-class LUT as a
// compile-time parameter plus a small dispatching shell for the
// i64/hex flavours that need accumulator state.
//
// LUT strategy: `.rodata`-resident `[bool; 256]` tables so the
// per-byte probe compiles to one load + one test. LLVM auto-
// vectorises the tight loop without explicit architecture cfgs.

use crate::state::{ParserState, Span};

// ── Byte-class LUTs ───────────────────────────────────────────────

/// Byte-class LUT for `[0-9]`.
pub static DIGIT_LUT: [bool; 256] = {
    let mut lut = [false; 256];
    let mut b = b'0';
    while b <= b'9' {
        lut[b as usize] = true;
        b += 1;
    }
    lut
};

/// Byte-class LUT for `[a-zA-Z0-9]`.
pub static ALNUM_LUT: [bool; 256] = {
    let mut lut = [false; 256];
    let mut b = b'0';
    while b <= b'9' {
        lut[b as usize] = true;
        b += 1;
    }
    let mut b = b'A';
    while b <= b'Z' {
        lut[b as usize] = true;
        b += 1;
    }
    let mut b = b'a';
    while b <= b'z' {
        lut[b as usize] = true;
        b += 1;
    }
    lut
};

/// Byte-class LUT for `[0-9a-fA-F]`.
pub static HEX_LUT: [bool; 256] = {
    let mut lut = [false; 256];
    let mut b = b'0';
    while b <= b'9' {
        lut[b as usize] = true;
        b += 1;
    }
    let mut b = b'A';
    while b <= b'F' {
        lut[b as usize] = true;
        b += 1;
    }
    let mut b = b'a';
    while b <= b'f' {
        lut[b as usize] = true;
        b += 1;
    }
    lut
};

// ── Generic class scanner ─────────────────────────────────────────

/// Advance `state.offset` past every byte that matches the class LUT.
/// Returns `(start, end)` where `start == state.offset` on entry and
/// `end == state.offset` on exit. The caller decides whether to treat
/// a zero-length run as success (Star) or failure (Plus).
#[inline(always)]
fn scan_class_while_mut(state: &mut ParserState<'_>, lut: &'static [bool; 256]) -> (usize, usize) {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    while i < len && lut[unsafe { *bytes.get_unchecked(i) } as usize] {
        i += 1;
    }
    state.offset = i;
    (start, i)
}

/// Scan one-or-more ASCII digits (`[0-9]+`). Advances `state.offset`
/// and returns the matched span on success; returns `None` if no
/// digits at the current offset.
#[inline(always)]
pub fn scan_digits_mut<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let (start, end) = scan_class_while_mut(state, &DIGIT_LUT);
    if end == start {
        return None;
    }
    Some(Span::new(start, end, state.src))
}

/// Scan zero-or-more ASCII digits (`[0-9]*`). Always succeeds; the
/// returned span may be empty.
#[inline(always)]
pub fn scan_digits_star_mut<'a>(state: &mut ParserState<'a>) -> Span<'a> {
    let (start, end) = scan_class_while_mut(state, &DIGIT_LUT);
    Span::new(start, end, state.src)
}

/// Scan one-or-more ASCII alphanumerics (`[a-zA-Z0-9]+`).
#[inline(always)]
pub fn scan_alnum_mut<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let (start, end) = scan_class_while_mut(state, &ALNUM_LUT);
    if end == start {
        return None;
    }
    Some(Span::new(start, end, state.src))
}

/// Scan one-or-more ASCII hex digits (`[0-9a-fA-F]+`).
#[inline(always)]
pub fn scan_hex_mut<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let (start, end) = scan_class_while_mut(state, &HEX_LUT);
    if end == start {
        return None;
    }
    Some(Span::new(start, end, state.src))
}

// ── Fused scan + accumulate (AV.0.3 scalar-payload capture) ──────

/// Scan one-or-more ASCII digits and accumulate the decimal value.
/// Returns `None` when no digits are present at the current offset.
///
/// Fuses the class LUT walk with `value * 10 + (b - b'0')` per byte;
/// LLVM schedules the LUT load and the MAD together.
#[inline(always)]
pub fn scan_digits_parse_i64_mut(state: &mut ParserState<'_>) -> Option<i64> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    let mut value: u64 = 0;
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if !DIGIT_LUT[b as usize] {
            break;
        }
        value = value.wrapping_mul(10).wrapping_add((b - b'0') as u64);
        i += 1;
    }
    if i == start {
        return None;
    }
    state.offset = i;
    Some(value as i64)
}

/// Scan one-or-more ASCII hex digits and accumulate the hex value.
#[inline(always)]
pub fn scan_hex_parse_i64_mut(state: &mut ParserState<'_>) -> Option<i64> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;
    let mut value: u64 = 0;
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if !HEX_LUT[b as usize] {
            break;
        }
        let d = match b {
            b'0'..=b'9' => b - b'0',
            b'a'..=b'f' => b - b'a' + 10,
            b'A'..=b'F' => b - b'A' + 10,
            _ => unreachable!(),
        };
        value = value.wrapping_shl(4).wrapping_add(d as u64);
        i += 1;
    }
    if i == start {
        return None;
    }
    state.offset = i;
    Some(value as i64)
}

// ── Byte-slice front-end helpers (AV.0.3 payload capture) ────────

/// Parse an `i64` from the numeric prefix of `bytes`, supporting
/// optional leading sign and optional `0x` / `0X` hex prefix. Stops
/// at the first non-digit byte; trailing `\w*` junk from regex tails
/// is ignored. Returns `None` when the prefix has no valid numeric
/// body. Overflow wraps silently (u64-accumulator semantics).
#[inline]
pub fn parse_i64_from_bytes(bytes: &[u8]) -> Option<i64> {
    let len = bytes.len();
    if len == 0 {
        return None;
    }
    let mut i = 0usize;
    let mut neg = false;
    let b0 = unsafe { *bytes.get_unchecked(0) };
    if b0 == b'-' {
        neg = true;
        i = 1;
    } else if b0 == b'+' {
        i = 1;
    }
    if i >= len {
        return None;
    }
    let hex_start = if i + 1 < len
        && unsafe { *bytes.get_unchecked(i) } == b'0'
        && matches!(unsafe { *bytes.get_unchecked(i + 1) }, b'x' | b'X')
    {
        Some(i + 2)
    } else {
        None
    };
    let mut value: u64 = 0;
    let digit_start = hex_start.unwrap_or(i);
    let mut j = digit_start;
    if hex_start.is_some() {
        while j < len {
            let b = unsafe { *bytes.get_unchecked(j) };
            if !HEX_LUT[b as usize] {
                break;
            }
            let d = match b {
                b'0'..=b'9' => b - b'0',
                b'a'..=b'f' => b - b'a' + 10,
                b'A'..=b'F' => b - b'A' + 10,
                _ => unreachable!(),
            };
            value = value.wrapping_shl(4).wrapping_add(d as u64);
            j += 1;
        }
    } else {
        while j < len {
            let b = unsafe { *bytes.get_unchecked(j) };
            if !DIGIT_LUT[b as usize] {
                break;
            }
            value = value.wrapping_mul(10).wrapping_add((b - b'0') as u64);
            j += 1;
        }
    }
    if j == digit_start {
        return None;
    }
    let signed = value as i64;
    Some(if neg { signed.wrapping_neg() } else { signed })
}

/// Parse an `f64` from the numeric prefix of `bytes`. Supports the
/// full `[sign]? digits ('.' digits)? ([eE] [sign]? digits)?` form;
/// trailing `\w*` junk is ignored. Delegates to
/// `fast_float2::parse_partial` for rounding correctness.
#[inline]
pub fn parse_f64_from_bytes(bytes: &[u8]) -> Option<f64> {
    if bytes.is_empty() {
        return None;
    }
    match fast_float2::parse_partial::<f64, _>(bytes) {
        Ok((v, consumed)) if consumed > 0 => Some(v),
        _ => None,
    }
}
