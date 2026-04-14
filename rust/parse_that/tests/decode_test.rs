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
