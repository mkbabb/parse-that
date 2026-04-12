// SIMD-accelerated quoted string scanner with escape-parity handling.
//
// Uses portable_simd (u8x16) to classify 16 bytes at a time. When a
// chunk contains backslashes, the escape parity of all 16 positions is
// resolved via bitwise arithmetic — no per-backslash branches.
//
// The escape-parity problem: a quote at position `i` is real iff the
// number of consecutive backslashes immediately preceding it is EVEN
// (including zero). Equivalently, position `i` is "escaped" iff it is
// immediately preceded by an odd-length backslash run.

use std::simd::prelude::*;

const CHUNK: usize = 16;
const MASK16: u32 = 0xFFFF;
const ODD_BITS: u32 = 0xAAAA; // bits 1, 3, 5, ...

/// SIMD-accelerated quoted string scanner.
///
/// Scans from `start` (the byte AFTER the opening quote) looking for the
/// closing `"`, handling `\`-escape sequences. Returns the byte offset
/// of the closing quote, or `None` if the string is unterminated.
///
/// This function only determines which quotes are real (not preceded by
/// an odd number of backslashes). It does NOT validate escape sequence
/// content (e.g. `\uXXXX`). Validation is the caller's job.
#[inline(always)]
pub fn scan_quoted_string_simd(bytes: &[u8], start: usize) -> Option<usize> {
    let mut pos = start;
    let len = bytes.len();

    // Carry: 1 if the previous chunk ended with an odd-length backslash
    // run (meaning the first byte of the next chunk is escaped).
    let mut carry: u32 = 0;

    let quote_splat = u8x16::splat(b'"');
    let bs_splat = u8x16::splat(b'\\');

    while pos + CHUNK <= len {
        let chunk = u8x16::from_slice(&bytes[pos..pos + CHUNK]);

        let quote_bits = chunk.simd_eq(quote_splat).to_bitmask() as u32;
        let bs_bits = chunk.simd_eq(bs_splat).to_bitmask() as u32;

        // ── Fast path: no backslashes, no carry from previous chunk ──
        if bs_bits == 0 && carry == 0 {
            if quote_bits != 0 {
                return Some(pos + quote_bits.trailing_zeros() as usize);
            }
            pos += CHUNK;
            continue;
        }

        // ── Compute escaped positions ────────────────────────────────
        let escaped = escaped_mask(bs_bits, &mut carry);

        // A quote is real iff its position is NOT escaped.
        let real_quotes = quote_bits & !escaped;

        if real_quotes != 0 {
            return Some(pos + real_quotes.trailing_zeros() as usize);
        }

        pos += CHUNK;
    }

    // ── Scalar tail for the last < 16 bytes ──────────────────────────
    scalar_tail(bytes, pos, carry != 0)
}

/// Compute a bitmask of "escaped" positions within a 16-byte chunk.
///
/// Bit `i` of the return value is 1 iff position `i` is immediately
/// preceded by an odd-length run of backslashes (possibly spanning from
/// the previous chunk via `carry`).
///
/// On entry, `*carry` is 1 if the previous chunk ended mid-odd-backslash-run.
/// On exit, `*carry` is updated for the next chunk.
#[inline(always)]
fn escaped_mask(bs_bits: u32, carry: &mut u32) -> u32 {
    if bs_bits == 0 {
        let escaped = *carry;
        *carry = 0;
        return escaped;
    }

    let carry_in = *carry;
    let odd_bs = odd_parity_backslashes(bs_bits, carry_in);

    // Position i is escaped iff position (i-1) is an odd-parity backslash.
    // Shift left by 1; carry_in fills bit 0 (previous chunk's last odd-bs
    // escapes our first byte).
    let escaped = ((odd_bs << 1) | carry_in) & MASK16;

    // Carry-out: 1 iff bit 15 is an odd-parity backslash.
    *carry = (odd_bs >> 15) & 1;

    escaped
}

/// Compute which backslashes in `bs_bits` have odd parity within their
/// respective runs, accounting for `carry_in` from the previous chunk.
///
/// A backslash at odd parity (1st, 3rd, 5th, ... from its run start)
/// escapes the byte that follows it.
///
/// ## Algorithm
///
/// For each contiguous run of backslashes, odd-parity positions are at
/// offsets 0, 2, 4, ... from the run start. We enumerate runs (at most
/// 8 in a 16-bit mask) and build the result mask.
///
/// When `carry_in = 1`, the previous chunk ended mid-odd-backslash-run,
/// so the first byte of this chunk continues that run. The continuation
/// shifts parity: offset 0 from this chunk's perspective is offset
/// (even) from the extended run's start, so the odd-parity positions
/// within the continuation are at odd offsets (1, 3, 5, ...) from bit 0.
#[inline(always)]
fn odd_parity_backslashes(bs_bits: u32, carry_in: u32) -> u32 {
    let mut odd = 0u32;
    let mut i = 0u32;

    // Handle carry-continuation: if carry_in = 1 and bit 0 is a backslash,
    // the first run continues from the previous chunk with inverted parity.
    if carry_in == 1 && (bs_bits & 1) != 0 {
        let run_len = (!bs_bits).trailing_zeros().min(16);
        let run_mask = if run_len >= 16 { MASK16 } else { (1u32 << run_len) - 1 };
        // Previous chunk's last backslash was odd (carry=1), so bit 0 is
        // even, bit 1 is odd, bit 2 is even, ... → odd at ODD indices.
        odd |= run_mask & ODD_BITS;
        i = run_len;
    }

    // Process remaining runs (fresh starts, no carry influence).
    while i < 16 {
        if (bs_bits >> i) & 1 == 0 {
            i += 1;
            continue;
        }
        let shifted = bs_bits >> i;
        let run_len = (!shifted).trailing_zeros().min(16 - i);
        let run_mask = if run_len >= 32 { u32::MAX } else { (1u32 << run_len) - 1 };
        // Odd-parity positions are at offsets 0, 2, 4, ... from run start.
        odd |= (run_mask & 0x5555) << i;
        i += run_len;
    }

    odd & MASK16
}

/// Scalar fallback for the tail bytes (< 16 remaining).
#[inline(always)]
fn scalar_tail(bytes: &[u8], mut pos: usize, byte0_escaped: bool) -> Option<usize> {
    let len = bytes.len();

    if byte0_escaped && pos < len {
        pos += 1; // skip the escaped byte
    }

    while pos < len {
        let b = unsafe { *bytes.get_unchecked(pos) };
        if b == b'"' {
            return Some(pos);
        }
        if b == b'\\' {
            pos += 1;
            if pos >= len {
                return None;
            }
            pos += 1;
            continue;
        }
        pos += 1;
    }

    None
}

// ── Tests ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn scan(input: &str) -> Option<usize> {
        let bytes = input.as_bytes();
        assert_eq!(bytes[0], b'"');
        scan_quoted_string_simd(bytes, 1)
    }

    fn scan_ref(bytes: &[u8], start: usize) -> Option<usize> {
        let mut i = start;
        while i < bytes.len() {
            if bytes[i] == b'"' {
                return Some(i);
            }
            if bytes[i] == b'\\' {
                i += 1;
                if i >= bytes.len() {
                    return None;
                }
                i += 1;
                continue;
            }
            i += 1;
        }
        None
    }

    // ── Basic ────────────────────────────────────────────────────

    #[test]
    fn empty_string() { assert_eq!(scan(r#""""#), Some(1)); }

    #[test]
    fn simple_string() { assert_eq!(scan(r#""hello""#), Some(6)); }

    #[test]
    fn escaped_quote() {
        let input = r#""hello\"world""#;
        assert_eq!(scan(input), Some(input.len() - 1));
    }

    #[test]
    fn escaped_backslash_then_quote() {
        assert_eq!(scan(r#""hello\\""#), Some(8));
    }

    #[test]
    fn escaped_backslash_escaped_quote() {
        let input = r#""hello\\\"end""#;
        assert_eq!(scan(input), Some(input.len() - 1));
    }

    #[test]
    fn unicode_escape() {
        assert_eq!(scan(r#""\u0041""#), Some(7));
    }

    #[test]
    fn only_escapes() {
        let input = r#""\n\t\r""#;
        assert_eq!(scan(input), Some(input.len() - 1));
    }

    #[test]
    fn unterminated() { assert_eq!(scan("\"hello"), None); }

    #[test]
    fn unterminated_backslash() { assert_eq!(scan("\"hello\\"), None); }

    // ── Backslash parity ─────────────────────────────────────────

    #[test]
    fn bs1_before_quote() {
        let input = "\"\\\"x\"";
        assert_eq!(scan(input), Some(input.len() - 1));
    }

    #[test]
    fn bs2_before_quote() {
        assert_eq!(scan("\"\\\\\""), Some(3));
    }

    #[test]
    fn bs3_before_quote() {
        let input = "\"\\\\\\\"x\"";
        assert_eq!(scan(input), Some(input.len() - 1));
    }

    #[test]
    fn bs4_before_quote() {
        assert_eq!(scan("\"\\\\\\\\\""), Some(5));
    }

    // ── Chunk boundary ───────────────────────────────────────────

    #[test]
    fn long_no_escapes() {
        let input = format!("\"{}\"", "a".repeat(100));
        assert_eq!(scan(&input), Some(input.len() - 1));
    }

    #[test]
    fn long_with_escapes() {
        let content = format!("{}\\\"{}",
            "a".repeat(50), "b".repeat(50));
        let input = format!("\"{}\"", content);
        assert_eq!(scan(&input), Some(input.len() - 1));
    }

    #[test]
    fn escape_at_chunk_boundary() {
        let mut s = String::from("\"");
        s.push_str(&"a".repeat(14));
        s.push_str("\\n\"");
        assert_eq!(scan(&s), Some(s.len() - 1));
    }

    #[test]
    fn run_spanning_chunks() {
        let mut s = String::from("\"");
        s.push_str(&"a".repeat(13));
        s.push_str("\\\\\\\\\\x\""); // 5 bs, x, "
        assert_eq!(scan(&s), Some(s.len() - 1));
    }

    #[test]
    fn even_run_spanning_then_quote() {
        let mut s = String::from("\"");
        s.push_str(&"a".repeat(14));
        s.push_str("\\\\\\\\\""); // 4 bs, "
        assert_eq!(scan(&s), Some(s.len() - 1));
    }

    #[test]
    fn odd_run_spanning_then_quote() {
        let mut s = String::from("\"");
        s.push_str(&"a".repeat(14));
        s.push_str("\\\\\\\"y\""); // 3 bs, escaped ", y, real "
        assert_eq!(scan(&s), Some(s.len() - 1));
    }

    #[test]
    fn exactly_16_byte_content() {
        let input = format!("\"{}\"", "x".repeat(16));
        assert_eq!(scan(&input), Some(17));
    }

    // ── Full-chunk stress ────────────────────────────────────────

    #[test]
    fn all_bs_even() {
        let mut s = String::from("\"");
        for _ in 0..16 { s.push('\\'); }
        s.push('"');
        let b = s.as_bytes();
        assert_eq!(scan_quoted_string_simd(b, 1), scan_ref(b, 1));
    }

    #[test]
    fn all_bs_odd() {
        let mut s = String::from("\"");
        for _ in 0..15 { s.push('\\'); }
        s.push_str("\"x\"");
        let b = s.as_bytes();
        assert_eq!(scan_quoted_string_simd(b, 1), scan_ref(b, 1));
    }

    #[test]
    fn two_chunks_bs() {
        let mut s = String::from("\"");
        for _ in 0..32 { s.push('\\'); }
        s.push('"');
        let b = s.as_bytes();
        assert_eq!(scan_quoted_string_simd(b, 1), scan_ref(b, 1));
    }

    #[test]
    fn two_chunks_bs_odd() {
        let mut s = String::from("\"");
        for _ in 0..31 { s.push('\\'); }
        s.push_str("\"x\"");
        let b = s.as_bytes();
        assert_eq!(scan_quoted_string_simd(b, 1), scan_ref(b, 1));
    }

    // ── Cross-validation ─────────────────────────────────────────

    #[test]
    fn cross_validate_patterns() {
        for &pat in &[
            r#""simple""#,  r#""""#,  r#""\"""#,  r#""\\""#,
            r#""\\\"""#,  r#""\\\\""#,  r#""hello\"world""#,
            r#""a\nb\tc""#,  r#""\u0041\u0042""#,
            "\"hello\\\\\\\"end\"",
        ] {
            let b = pat.as_bytes();
            assert_eq!(
                scan_quoted_string_simd(b, 1), scan_ref(b, 1),
                "Mismatch for {:?}", pat
            );
        }
    }

    #[test]
    fn cross_validate_generated() {
        for n_prefix in [0,1,5,14,15,16,20,31,32,48,63,64] {
            for n_bs in 0..=10 {
                for has_post in [false, true] {
                    let mut s = String::from("\"");
                    s.push_str(&"a".repeat(n_prefix));
                    for _ in 0..n_bs { s.push('\\'); }
                    if has_post && n_bs % 2 == 1 {
                        s.push('"');
                        s.push('x');
                    }
                    s.push('"');
                    let b = s.as_bytes();
                    assert_eq!(
                        scan_quoted_string_simd(b, 1), scan_ref(b, 1),
                        "prefix={n_prefix}, bs={n_bs}, post={has_post}"
                    );
                }
            }
        }
    }

    // ── escaped_mask unit tests ──────────────────────────────────

    #[test]
    fn em_no_bs()          { let mut c=0; assert_eq!(escaped_mask(0,&mut c),0); assert_eq!(c,0); }
    #[test]
    fn em_no_bs_carry()    { let mut c=1; assert_eq!(escaped_mask(0,&mut c),1); assert_eq!(c,0); }
    #[test]
    fn em_1bs()            { let mut c=0; assert_eq!(escaped_mask(0b1,&mut c),0b10);   assert_eq!(c,0); }
    #[test]
    fn em_2bs()            { let mut c=0; assert_eq!(escaped_mask(0b11,&mut c),0b10);  assert_eq!(c,0); }
    #[test]
    fn em_3bs()            { let mut c=0; assert_eq!(escaped_mask(0b111,&mut c),0b1010); assert_eq!(c,0); }
    #[test]
    fn em_carry_1bs()      { let mut c=1; assert_eq!(escaped_mask(0b1,&mut c),0b01);   assert_eq!(c,0); }
    #[test]
    fn em_carry_2bs()      { let mut c=1; assert_eq!(escaped_mask(0b11,&mut c),0b101); assert_eq!(c,0); }
}
