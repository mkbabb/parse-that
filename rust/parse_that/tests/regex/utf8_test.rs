use parse_that::regex::utf8::Utf8Sequences;

#[test]
fn ascii_range() {
    let seqs: Vec<_> = Utf8Sequences::new('a', 'z').collect();
    assert_eq!(seqs.len(), 1);
    assert_eq!(seqs[0].as_slice().len(), 1);
    assert_eq!(seqs[0].as_slice()[0].start, b'a');
    assert_eq!(seqs[0].as_slice()[0].end, b'z');
}

#[test]
fn single_char() {
    let seqs: Vec<_> = Utf8Sequences::new('A', 'A').collect();
    assert_eq!(seqs.len(), 1);
    assert_eq!(seqs[0].as_slice().len(), 1);
    assert_eq!(seqs[0].as_slice()[0].start, b'A');
    assert_eq!(seqs[0].as_slice()[0].end, b'A');
}

#[test]
fn two_byte_range() {
    // U+0080 to U+00FF — all 2-byte UTF-8.
    let seqs: Vec<_> = Utf8Sequences::new('\u{0080}', '\u{00FF}').collect();
    assert!(!seqs.is_empty());
    for seq in &seqs {
        assert_eq!(seq.as_slice().len(), 2, "Expected 2-byte sequences");
    }
}

#[test]
fn cross_boundary() {
    // U+007F to U+0080 — crosses 1-byte to 2-byte boundary.
    let seqs: Vec<_> = Utf8Sequences::new('\u{007F}', '\u{0080}').collect();
    // Should produce sequences of different lengths.
    let lengths: Vec<usize> = seqs.iter().map(|s| s.as_slice().len()).collect();
    assert!(lengths.contains(&1), "Should contain 1-byte sequence");
    assert!(lengths.contains(&2), "Should contain 2-byte sequence");
}

#[test]
fn latin_extended_a() {
    // U+0100 to U+017F — all 2-byte UTF-8.
    let seqs: Vec<_> = Utf8Sequences::new('\u{0100}', '\u{017F}').collect();
    assert!(!seqs.is_empty());
    for seq in &seqs {
        assert_eq!(seq.as_slice().len(), 2);
    }
}

#[test]
fn surrogate_skip() {
    // U+D000 to U+E000 — spans the surrogate gap.
    let seqs: Vec<_> = Utf8Sequences::new('\u{D000}', '\u{E000}').collect();
    // Should produce sequences that skip D800..DFFF.
    assert!(!seqs.is_empty());
}

#[test]
fn four_byte() {
    // U+10000 to U+10005 — 4-byte UTF-8.
    let seqs: Vec<_> = Utf8Sequences::new('\u{10000}', '\u{10005}').collect();
    assert!(!seqs.is_empty());
    for seq in &seqs {
        assert_eq!(seq.as_slice().len(), 4);
    }
}

#[test]
fn full_unicode() {
    // '\0' to max — should not panic.
    let seqs: Vec<_> = Utf8Sequences::new('\0', '\u{10FFFF}').collect();
    assert!(!seqs.is_empty());
}

#[test]
fn roundtrip_ascii() {
    // Every ASCII byte should be reachable via the sequences for ['\0', '\x7F'].
    let seqs: Vec<_> = Utf8Sequences::new('\0', '\x7F').collect();
    assert_eq!(seqs.len(), 1);
    let s = &seqs[0];
    assert_eq!(s.as_slice().len(), 1);
    assert_eq!(s.as_slice()[0].start, 0);
    assert_eq!(s.as_slice()[0].end, 127);
}
