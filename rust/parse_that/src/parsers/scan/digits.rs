// Digit / alphanumeric class scanners — Tranche W phase 5d.
//
// Hoisted helpers for the most common `[0-9]+` and `[a-zA-Z0-9]+`
// quantified character classes the BBNF backend would otherwise emit
// inline. The cargo-expand audit measured 86 duplicated
// `is_ascii_digit()` while-loops in the CSS L4 generated parser
// (~55,900 bytes of byte-equivalent code); routing them through these
// helpers collapses the duplication to a single helper definition +
// N call sites.
//
// Tranche Y.9: the per-byte predicate checks (`is_ascii_digit`,
// `is_ascii_alphanumeric`, `is_ascii_hexdigit`) collapse into
// `.rodata`-resident byte-class lookup tables. The LUT approach
// compiles to one memory load + one test per byte instead of the
// previous range-compare chain. LLVM can (and does) auto-vectorize
// the resulting tight loop when the target supports it. Explicit
// SIMD intrinsics would require per-architecture cfgs without
// measurably improving this shape, so we trust the compiler to
// emit AVX2/NEON on the platforms where it matters.

use crate::state::{ParserState, Span};

/// Byte-class LUT for `[0-9]`.
static DIGIT_LUT: [bool; 256] = {
    let mut lut = [false; 256];
    let mut b = b'0';
    while b <= b'9' {
        lut[b as usize] = true;
        b += 1;
    }
    lut
};

/// Byte-class LUT for `[a-zA-Z0-9]`.
static ALNUM_LUT: [bool; 256] = {
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
static HEX_LUT: [bool; 256] = {
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
        if !DIGIT_LUT[unsafe { *bytes.get_unchecked(i) } as usize] {
            break;
        }
        i += 1;
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
        if !DIGIT_LUT[unsafe { *bytes.get_unchecked(i) } as usize] {
            break;
        }
        i += 1;
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
        if !ALNUM_LUT[unsafe { *bytes.get_unchecked(i) } as usize] {
            break;
        }
        i += 1;
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
        if !HEX_LUT[unsafe { *bytes.get_unchecked(i) } as usize] {
            break;
        }
        i += 1;
    }
    if i == start {
        return None;
    }
    state.offset = i;
    Some(Span::new(start, i, state.src))
}

// ── AV.0.3 Bug 2b: scanner-to-payload i64 threading ──────────────
//
// The `*_parse_i64_mut` variants mirror the span-only scanners above
// but thread the accumulated integer value through as their return.
// Callers that want both the matched span AND the parsed scalar use
// these instead of `scan_digits_mut` / `scan_hex_mut` + a follow-up
// `i64::from_str` on the span text.
//
// Overflow policy: the accumulators are `u64` internally; on overflow
// the scanner continues consuming digits (so the span match stays
// coherent) but the returned `i64` value is undefined for inputs
// whose numeric value exceeds `i64::MAX`. BBNF's `int_lit -> i64`
// accepts any `[0-9]+` at the grammar level — the grammar author is
// responsible for staying within range, same as `i64::from_str`.

/// Scan one-or-more ASCII digits and accumulate the decimal value.
/// Advances `state.offset` to the end of the digit run and returns
/// the accumulated `i64`. Returns `None` when no digits are present
/// at the current offset.
///
/// Same byte-class LUT walk as `scan_digits_mut`, but folds each
/// digit into the accumulator during the walk. LLVM fuses the LUT
/// check and the `mantissa * 10 + d` step.
#[inline(always)]
pub fn scan_digits_parse_i64_mut<'a>(state: &mut ParserState<'a>) -> Option<i64> {
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

/// Parse an `i64` from the numeric prefix of `bytes`, accepting
/// optional leading sign (`+` / `-`), optional `0x` / `0X` hex
/// prefix, and a decimal or hex digit run. Stops at the first
/// non-digit byte; trailing junk (`\w*` tails from regex patterns
/// like `[0-9]+\w*`) is ignored.
///
/// Returns `None` when the prefix contains no valid numeric body
/// (e.g. a bare `-` with no following digit, or an empty slice).
/// Overflow wraps silently — consistent with
/// `scan_digits_parse_i64_mut`'s u64-accumulator semantics.
///
/// Consumed by bbnf-lang's rule-body scalar-payload capture step
/// (AV.0.3). The matched span is `state.src_bytes[__span_lo..__end]`
/// and may include a `\w*` junk tail from `int_lit`'s regex; this
/// helper extracts the numeric prefix without a second scan.
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
    // Hex prefix.
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

/// Parse an `f64` from the numeric prefix of `bytes` — supports the
/// full `[sign]? digits ('.' digits)? ([eE] [sign]? digits)?` form
/// accepted by BBNF's `float_lit` regex, with optional trailing
/// `\w*` junk that is ignored.
///
/// Returns `None` when the prefix contains no valid float body.
/// Delegates the actual float construction to `fast_float2::parse_partial`
/// which both handles rounding correctness and reports the consumed
/// prefix length.
///
/// Consumed by bbnf-lang's rule-body scalar-payload capture step for
/// `-> f64` rules (AV.0.3) — the span may include a `\w*` junk tail
/// from `float_lit`'s regex.
#[inline]
pub fn parse_f64_from_bytes(bytes: &[u8]) -> Option<f64> {
    if bytes.is_empty() {
        return None;
    }
    // fast_float2::parse_partial consumes as many bytes as form a
    // valid float prefix, returning (value, consumed). A zero-length
    // consumption is a parse failure.
    match fast_float2::parse_partial::<f64, _>(bytes) {
        Ok((v, consumed)) if consumed > 0 => Some(v),
        _ => None,
    }
}

/// Scan one-or-more ASCII hex digits and accumulate the hexadecimal
/// value. Advances `state.offset` to the end of the hex run and
/// returns the accumulated `i64`. Returns `None` when no hex digits
/// are present at the current offset.
#[inline(always)]
pub fn scan_hex_parse_i64_mut<'a>(state: &mut ParserState<'a>) -> Option<i64> {
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
            _ => unreachable!(), // LUT guard above guarantees hex class
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
