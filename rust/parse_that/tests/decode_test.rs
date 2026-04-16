use parse_that::parsers::scan::{StringPayload, decode_json_string_to_arena};

fn decode(input: &str) -> Option<(StringPayload, usize, Vec<u8>)> {
    let mut arena = Vec::new();
    let (payload, end) = decode_json_string_to_arena(input.as_bytes(), 0, &mut arena)?;
    Some((payload, end, arena))
}

fn decoded_str(input: &str) -> Option<String> {
    let (payload, _, arena) = decode(input)?;
    match payload {
        StringPayload::Borrowed { start, end } => {
            Some(String::from_utf8(input.as_bytes()[start as usize..end as usize].to_vec()).unwrap())
        }
        StringPayload::Owned { arena_offset, len } => {
            let slice = &arena[arena_offset as usize..(arena_offset + len) as usize];
            Some(String::from_utf8(slice.to_vec()).unwrap())
        }
    }
}

// ── Borrowed (zero-copy) paths ──────────────────────────────────────

#[test]
fn borrowed_simple() {
    let (payload, end, arena) = decode(r#""hello""#).unwrap();
    assert!(matches!(payload, StringPayload::Borrowed { .. }));
    assert_eq!(end, 7);
    assert!(arena.is_empty());
    assert_eq!(decoded_str(r#""hello""#).unwrap(), "hello");
}

#[test]
fn borrowed_empty() {
    let (payload, end, arena) = decode(r#""""#).unwrap();
    assert!(matches!(payload, StringPayload::Borrowed { start, end } if start == end));
    assert_eq!(end, 2);
    assert!(arena.is_empty());
    assert_eq!(decoded_str(r#""""#).unwrap(), "");
}

#[test]
fn borrowed_no_escapes_at_all() {
    let (payload, _end, arena) = decode(r#""no escapes at all""#).unwrap();
    assert!(matches!(payload, StringPayload::Borrowed { .. }));
    assert!(arena.is_empty());
    assert_eq!(decoded_str(r#""no escapes at all""#).unwrap(), "no escapes at all");
}

// ── Owned (decoded) paths ───────────────────────────────────────────

#[test]
fn owned_newline() {
    let (payload, end, _arena) = decode(r#""hello\nworld""#).unwrap();
    assert!(matches!(payload, StringPayload::Owned { .. }));
    assert_eq!(end, 14);
    assert_eq!(decoded_str(r#""hello\nworld""#).unwrap(), "hello\nworld");
}

#[test]
fn owned_all_simple_escapes() {
    let input = r#""a\"b\\c\/d\be\ff\ng\rh\ti""#;
    let result = decoded_str(input).unwrap();
    assert_eq!(result, "a\"b\\c/d\x08e\x0Cf\ng\rh\ti");
}

#[test]
fn owned_unicode_bmp() {
    // \u0041 = 'A'
    assert_eq!(decoded_str(r#""\u0041""#).unwrap(), "A");
}

#[test]
fn owned_unicode_multibyte() {
    // \u00E9 = 'e' (2-byte UTF-8)
    assert_eq!(decoded_str(r#""\u00E9""#).unwrap(), "\u{00E9}");
    // \u4E16 = '世' (3-byte UTF-8)
    assert_eq!(decoded_str(r#""\u4E16""#).unwrap(), "\u{4E16}");
}

#[test]
fn owned_surrogate_pair() {
    // \uD83D\uDE00 = U+1F600 = 😀
    let result = decoded_str(r#""\uD83D\uDE00""#).unwrap();
    assert_eq!(result, "\u{1F600}");
    assert_eq!(result, "😀");
}

#[test]
fn owned_mixed_content() {
    let result = decoded_str(r#""prefix\u0041suffix""#).unwrap();
    assert_eq!(result, "prefixAsuffix");
}

// ── Arena offset tracking ───────────────────────────────────────────

#[test]
fn arena_offset_respects_existing_data() {
    let mut arena = Vec::new();
    arena.extend_from_slice(b"pre-existing");
    let pre_len = arena.len();

    let input = r#""hello\nworld""#;
    let (payload, _end) =
        decode_json_string_to_arena(input.as_bytes(), 0, &mut arena).unwrap();

    match payload {
        StringPayload::Owned { arena_offset, len } => {
            assert_eq!(arena_offset as usize, pre_len);
            let decoded = &arena[arena_offset as usize..(arena_offset + len) as usize];
            assert_eq!(decoded, b"hello\nworld");
        }
        _ => panic!("Expected Owned payload"),
    }

    // Pre-existing data is untouched.
    assert_eq!(&arena[..pre_len], b"pre-existing");
}

// ── Error cases ─────────────────────────────────────────────────────

#[test]
fn error_no_opening_quote() {
    assert!(decode("hello").is_none());
}

#[test]
fn error_unterminated() {
    assert!(decode(r#""hello"#).is_none());
}

#[test]
fn error_lone_high_surrogate() {
    assert!(decode(r#""\uD83D""#).is_none());
}

#[test]
fn error_lone_low_surrogate() {
    assert!(decode(r#""\uDC00""#).is_none());
}

#[test]
fn error_invalid_escape() {
    assert!(decode(r#""\x41""#).is_none());
}

#[test]
fn error_truncated_unicode() {
    assert!(decode(r#""\u00""#).is_none());
}

// ── Multiple sequential decodes ─────────────────────────────────────

#[test]
fn sequential_decodes_share_arena() {
    let mut arena = Vec::new();

    let input1 = r#""first\n""#;
    let (p1, _) = decode_json_string_to_arena(input1.as_bytes(), 0, &mut arena).unwrap();

    let input2 = r#""second\t""#;
    let (p2, _) = decode_json_string_to_arena(input2.as_bytes(), 0, &mut arena).unwrap();

    // Both payloads reference non-overlapping slices in the same arena.
    match (p1, p2) {
        (
            StringPayload::Owned { arena_offset: o1, len: l1 },
            StringPayload::Owned { arena_offset: o2, len: l2 },
        ) => {
            assert_eq!(o2 as usize, (o1 + l1) as usize);
            let s1 = std::str::from_utf8(&arena[o1 as usize..(o1 + l1) as usize]).unwrap();
            let s2 = std::str::from_utf8(&arena[o2 as usize..(o2 + l2) as usize]).unwrap();
            assert_eq!(s1, "first\n");
            assert_eq!(s2, "second\t");
        }
        _ => panic!("Expected both Owned"),
    }
}

// ── Non-zero start offset ───────────────────────────────────────────

#[test]
fn non_zero_start_offset() {
    let input = b"   \"escaped\\n\"  ";
    let mut arena = Vec::new();
    let (payload, end) = decode_json_string_to_arena(input, 3, &mut arena).unwrap();
    assert_eq!(end, 14);
    match payload {
        StringPayload::Owned { arena_offset, len } => {
            let decoded = &arena[arena_offset as usize..(arena_offset + len) as usize];
            assert_eq!(decoded, b"escaped\n");
        }
        _ => panic!("Expected Owned"),
    }
}

// ─── SIMD stripe-boundary coverage (AV.4.3) ─────────────────────────
//
// The SIMD decoder operates on 16-byte stripes. These tests exercise
// every position where the simdjson-style stop-bit classifier must
// agree with scalar handling: stripe boundaries, sub-stripe tails,
// escape-parity carry across stripes, and long escape-free runs that
// the bulk SIMD store handles without per-byte branches.

/// Borrowed (no escapes), exactly one 16-byte stripe of content.
#[test]
fn simd_borrowed_exactly_one_stripe() {
    let input = format!("\"{}\"", "a".repeat(16));
    let s = decoded_str(&input).unwrap();
    assert_eq!(s, "a".repeat(16));
}

/// Borrowed string spanning two full stripes (32 content bytes).
#[test]
fn simd_borrowed_two_stripes() {
    let input = format!("\"{}\"", "x".repeat(32));
    let s = decoded_str(&input).unwrap();
    assert_eq!(s, "x".repeat(32));
}

/// Borrowed string longer than several stripes — exercises the
/// per-stripe fast loop (no carry, no stop) repeatedly.
#[test]
fn simd_borrowed_many_stripes() {
    for n in [33, 47, 63, 64, 65, 100, 256, 1023] {
        let input = format!("\"{}\"", "z".repeat(n));
        let s = decoded_str(&input).unwrap();
        assert_eq!(s, "z".repeat(n), "length {n}");
    }
}

/// Quote-only stripe with escape-free prefix lengths spanning every
/// position 0..=15 inside a stripe. The trailing-zeros computation
/// must locate the closing quote at every offset.
#[test]
fn simd_borrowed_close_quote_at_every_stripe_offset() {
    for prefix in 0..=15 {
        let input = format!("\"{}\"", "p".repeat(prefix));
        let s = decoded_str(&input).unwrap();
        assert_eq!(s, "p".repeat(prefix), "prefix {prefix}");
    }
}

/// Closing quote at the second-stripe boundary positions.
#[test]
fn simd_borrowed_close_quote_at_second_stripe_offset() {
    for prefix in 16..=31 {
        let input = format!("\"{}\"", "q".repeat(prefix));
        let s = decoded_str(&input).unwrap();
        assert_eq!(s, "q".repeat(prefix), "prefix {prefix}");
    }
}

/// Backslash at the very first content byte.
#[test]
fn simd_owned_escape_at_offset_zero() {
    let s = decoded_str(r#""\n""#).unwrap();
    assert_eq!(s, "\n");
}

/// Backslash at every position 0..=15 inside the first stripe.
#[test]
fn simd_owned_escape_at_every_stripe_offset() {
    for prefix in 0..=15 {
        let mut input = String::from("\"");
        input.push_str(&"a".repeat(prefix));
        input.push_str("\\nrest\"");
        let want = format!("{}\nrest", "a".repeat(prefix));
        let got = decoded_str(&input).unwrap();
        assert_eq!(got, want, "prefix {prefix}");
    }
}

/// Backslash straddling the 16-byte stripe boundary: the `\` is the
/// last byte of stripe 0; the escape body is the first byte of stripe 1.
#[test]
fn simd_owned_escape_spans_stripe_boundary() {
    // 15 bytes of 'a' + '\' + 'n' = `\n` lands at content offset 15.
    let mut input = String::from("\"");
    input.push_str(&"a".repeat(15));
    input.push_str("\\nmore\"");
    let want = format!("{}\nmore", "a".repeat(15));
    let got = decoded_str(&input).unwrap();
    assert_eq!(got, want);
}

/// Two backslashes (`\\`) straddling the stripe boundary — escape
/// parity carry must keep `\\` decoded as a single literal backslash
/// even when the second `\` lands in the next stripe.
#[test]
fn simd_owned_double_backslash_spans_stripe_boundary() {
    let mut input = String::from("\"");
    input.push_str(&"a".repeat(15));
    input.push_str("\\\\xrest\"");
    let want = format!("{}\\xrest", "a".repeat(15));
    let got = decoded_str(&input).unwrap();
    assert_eq!(got, want);
}

/// Closing quote at byte 16 (start of second stripe), no escapes.
#[test]
fn simd_borrowed_close_quote_at_stripe_one_start() {
    let input = format!("\"{}\"", "y".repeat(16));
    let s = decoded_str(&input).unwrap();
    assert_eq!(s, "y".repeat(16));
}

/// Long escape-free run ending in a single escape, then more
/// content — the SIMD bulk-copy loop must run many full stripes
/// before hitting the escape.
#[test]
fn simd_owned_long_run_then_escape() {
    let mut input = String::from("\"");
    input.push_str(&"a".repeat(64));
    input.push_str("\\n");
    input.push_str(&"b".repeat(64));
    input.push('"');
    let want = format!("{}\n{}", "a".repeat(64), "b".repeat(64));
    let got = decoded_str(&input).unwrap();
    assert_eq!(got, want);
}

/// All-escapes string: every other byte is a backslash — the SIMD
/// loop hits the slow path on every stripe.
#[test]
fn simd_owned_all_escapes_dense() {
    let input = r#""\n\t\r\n\t\r\n\t""#;
    let want = "\n\t\r\n\t\r\n\t";
    assert_eq!(decoded_str(input).unwrap(), want);
}

/// Escape immediately followed by closing quote (`"\n"`).
#[test]
fn simd_owned_escape_then_close() {
    assert_eq!(decoded_str(r#""x\n""#).unwrap(), "x\n");
}

/// `\"` (escaped quote) followed by real closing quote — escape-parity
/// must NOT swallow the real quote.
#[test]
fn simd_owned_escaped_quote_then_real_quote() {
    assert_eq!(decoded_str(r#""x\"y""#).unwrap(), "x\"y");
}

/// Escape-parity stress: 1-32 backslashes immediately before a quote.
/// Even count → real quote (Borrowed if no other escapes preceded).
/// Odd count → escaped quote (Owned, then loop continues).
#[test]
fn simd_escape_parity_runs_before_quote() {
    for n_bs in 0..=32 {
        let mut input = String::from("\"");
        for _ in 0..n_bs {
            input.push('\\');
        }
        if n_bs % 2 == 1 {
            input.push('"');
            input.push('z');
        }
        input.push('"');
        let mut arena = Vec::new();
        let result = decode_json_string_to_arena(input.as_bytes(), 0, &mut arena);
        assert!(result.is_some(), "n_bs={n_bs}: parse failed");
    }
}

/// UTF-8 multibyte content (no escapes). The SIMD classifier ignores
/// non-ASCII bytes; the result is Borrowed verbatim.
#[test]
fn simd_borrowed_utf8_multibyte_no_escapes() {
    let input = "\"café 世界 🚀\"";
    let s = decoded_str(input).unwrap();
    assert_eq!(s, "café 世界 🚀");
}

/// UTF-8 multibyte spanning a stripe boundary.
#[test]
fn simd_borrowed_utf8_across_stripe_boundary() {
    // 14 ASCII bytes + 2-byte 'é' lands across boundary at offset 15.
    let input = "\"aaaaaaaaaaaaaaéremainder\"";
    let s = decoded_str(input).unwrap();
    assert_eq!(s, "aaaaaaaaaaaaaaéremainder");
}

/// Large escape-bearing string: stresses the bulk-copy path inside
/// owned-mode decode across many stripes.
#[test]
fn simd_owned_large_with_periodic_escapes() {
    let chunk = "abcdefghijklmnop\\n"; // 16 plain + 1 escape
    let mut input = String::from("\"");
    for _ in 0..50 {
        input.push_str(chunk);
    }
    input.push('"');
    let mut want = String::new();
    for _ in 0..50 {
        want.push_str("abcdefghijklmnop\n");
    }
    let got = decoded_str(&input).unwrap();
    assert_eq!(got, want);
}

/// Surrogate pair across a stripe boundary — the 12-byte
/// `\uD83D\uDE00` straddles 16-byte stripes if we slide it.
#[test]
fn simd_owned_surrogate_pair_across_stripe_boundary() {
    for prefix in 0..=20 {
        let mut input = String::from("\"");
        input.push_str(&"x".repeat(prefix));
        input.push_str("\\uD83D\\uDE00 tail\"");
        let want = format!("{}{} tail", "x".repeat(prefix), "\u{1F600}");
        let got = decoded_str(&input).unwrap();
        assert_eq!(got, want, "prefix {prefix}");
    }
}

/// Cross-validate against a scalar reference implementation across a
/// generated grid of (prefix, escape, suffix) shapes — catches
/// classifier off-by-ones the curated cases miss.
#[test]
fn simd_cross_validate_grid() {
    fn scalar_decode(input: &str) -> Option<String> {
        let bytes = input.as_bytes();
        if bytes.first() != Some(&b'"') {
            return None;
        }
        let mut out = String::new();
        let mut i = 1;
        while i < bytes.len() {
            match bytes[i] {
                b'"' => return Some(out),
                b'\\' => {
                    i += 1;
                    if i >= bytes.len() { return None; }
                    match bytes[i] {
                        b'"' => out.push('"'),
                        b'\\' => out.push('\\'),
                        b'/' => out.push('/'),
                        b'b' => out.push('\u{08}'),
                        b'f' => out.push('\u{0C}'),
                        b'n' => out.push('\n'),
                        b'r' => out.push('\r'),
                        b't' => out.push('\t'),
                        _ => return None,
                    }
                    i += 1;
                }
                b => {
                    out.push(b as char);
                    i += 1;
                }
            }
        }
        None
    }

    for prefix_len in [0usize, 1, 7, 14, 15, 16, 17, 31, 32, 47, 63, 64, 65] {
        for escape in ["\\n", "\\t", "\\\"", "\\\\", "\\/"] {
            for suffix_len in [0usize, 1, 5, 14, 15, 16, 17, 31, 32, 33] {
                let mut input = String::from("\"");
                input.push_str(&"a".repeat(prefix_len));
                input.push_str(escape);
                input.push_str(&"b".repeat(suffix_len));
                input.push('"');

                let want = scalar_decode(&input).expect("scalar must decode");
                let got = decoded_str(&input).expect("simd must decode");
                assert_eq!(
                    got, want,
                    "prefix={prefix_len} escape={escape:?} suffix={suffix_len}"
                );
            }
        }
    }
}

/// Borrowed-mode tail decode: input where the closing quote lands in
/// the < 16-byte scalar tail (input total length not aligned to 16).
#[test]
fn simd_borrowed_close_quote_in_scalar_tail() {
    // 8-byte content guarantees the closing quote is in the tail.
    let input = r#""abcdefgh""#; // 10 bytes total
    let s = decoded_str(input).unwrap();
    assert_eq!(s, "abcdefgh");
}

/// Owned-mode tail decode: backslash lands in the < 16-byte tail.
#[test]
fn simd_owned_escape_in_scalar_tail() {
    let input = r#""abc\n""#; // 7 bytes total — first stripe straddles
    let s = decoded_str(input).unwrap();
    assert_eq!(s, "abc\n");
}

/// Owned-mode where the SIMD bulk-copy path resumes after an escape
/// and runs until the closing quote at a stripe boundary.
#[test]
fn simd_owned_escape_then_full_stripe_then_close() {
    let mut input = String::from("\"");
    input.push_str("\\n");
    input.push_str(&"x".repeat(16));
    input.push('"');
    let want = format!("\n{}", "x".repeat(16));
    let got = decoded_str(&input).unwrap();
    assert_eq!(got, want);
}

/// Pathological: closing quote at the *last* byte of a stripe, no
/// escapes — verifies the trailing_zeros math at the high end of the
/// stripe.
#[test]
fn simd_borrowed_close_quote_at_stripe_high_bit() {
    // 15 content bytes + closing quote at content offset 15 (the last
    // bit of the first stripe).
    let input = format!("\"{}\"", "h".repeat(15));
    let s = decoded_str(&input).unwrap();
    assert_eq!(s, "h".repeat(15));
}

/// Owned-mode with closing quote at stripe high bit after an escape.
#[test]
fn simd_owned_close_quote_at_stripe_high_bit() {
    let mut input = String::from("\"");
    input.push_str("\\n");
    input.push_str(&"k".repeat(13));
    input.push('"');
    let want = format!("\n{}", "k".repeat(13));
    let got = decoded_str(&input).unwrap();
    assert_eq!(got, want);
}
