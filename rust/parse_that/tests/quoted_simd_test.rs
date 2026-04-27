use parse_that::parsers::scan::quoted_simd::{escaped_mask, scan_quoted_string_simd};

fn scan(input: &str) -> Option<usize> {
    let bytes = input.as_bytes();
    assert_eq!(bytes[0], b'"');
    scan_quoted_string_simd(bytes, 1, b'"')
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
    assert_eq!(scan("\"\\u0041\""), Some(7));
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
    assert_eq!(scan_quoted_string_simd(b, 1, b'"'), scan_ref(b, 1));
}

#[test]
fn all_bs_odd() {
    let mut s = String::from("\"");
    for _ in 0..15 { s.push('\\'); }
    s.push_str("\"x\"");
    let b = s.as_bytes();
    assert_eq!(scan_quoted_string_simd(b, 1, b'"'), scan_ref(b, 1));
}

#[test]
fn two_chunks_bs() {
    let mut s = String::from("\"");
    for _ in 0..32 { s.push('\\'); }
    s.push('"');
    let b = s.as_bytes();
    assert_eq!(scan_quoted_string_simd(b, 1, b'"'), scan_ref(b, 1));
}

#[test]
fn two_chunks_bs_odd() {
    let mut s = String::from("\"");
    for _ in 0..31 { s.push('\\'); }
    s.push_str("\"x\"");
    let b = s.as_bytes();
    assert_eq!(scan_quoted_string_simd(b, 1, b'"'), scan_ref(b, 1));
}

// ── Cross-validation ─────────────────────────────────────────

#[test]
fn cross_validate_patterns() {
    for &pat in &[
        r#""simple""#,  r#""""#,  r#""\"""#,  r#""\\""#,
        r#""\\\"""#,  r#""\\\\""#,  r#""hello\"world""#,
        r#""a\nb\tc""#,  "\"\\u0041\\u0042\"",
        "\"hello\\\\\\\"end\"",
    ] {
        let b = pat.as_bytes();
        assert_eq!(
            scan_quoted_string_simd(b, 1, b'"'), scan_ref(b, 1),
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
                    scan_quoted_string_simd(b, 1, b'"'), scan_ref(b, 1),
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
