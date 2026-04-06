use parse_that::regex::byteset::ByteSet;
use parse_that::regex::equiv::compute_byte_classes;

#[test]
fn no_byte_sets() {
    let (classes, num) = compute_byte_classes(&[]);
    assert_eq!(num, 1);
    // All bytes map to class 0.
    assert!(classes.iter().all(|&c| c == 0));
}

#[test]
fn single_range() {
    let bs = ByteSet::range(b'a', b'z');
    let (classes, num) = compute_byte_classes(&[bs]);
    // Two equivalence classes: {a-z} and {everything else}.
    assert_eq!(num, 2);
    // All a-z should have the same class.
    let az_class = classes[b'a' as usize];
    for b in b'a'..=b'z' {
        assert_eq!(classes[b as usize], az_class);
    }
    // Something outside should have a different class.
    assert_ne!(classes[b'A' as usize], az_class);
}

#[test]
fn two_disjoint_ranges() {
    let digits = ByteSet::range(b'0', b'9');
    let alpha = ByteSet::range(b'a', b'z');
    let (classes, num) = compute_byte_classes(&[digits, alpha]);
    // Three classes: {0-9}, {a-z}, {everything else}.
    assert_eq!(num, 3);
}

#[test]
fn overlapping_ranges() {
    let az = ByteSet::range(b'a', b'z');
    let af = ByteSet::range(b'a', b'f');
    let (classes, num) = compute_byte_classes(&[az, af]);
    // Three classes: {a-f} (in both), {g-z} (only in az), {rest} (neither).
    assert_eq!(num, 3);
    // a and f should be in the same class.
    assert_eq!(classes[b'a' as usize], classes[b'f' as usize]);
    // g and z should be in the same class.
    assert_eq!(classes[b'g' as usize], classes[b'z' as usize]);
    // But a-f and g-z should differ.
    assert_ne!(classes[b'a' as usize], classes[b'g' as usize]);
}

#[test]
fn utf8_leading_bytes() {
    // Simulate UTF-8: leading bytes 0xC2-0xDF and continuation 0x80-0xBF.
    let leading = ByteSet::range(0xC2, 0xDF);
    let continuation = ByteSet::range(0x80, 0xBF);
    let (classes, num) = compute_byte_classes(&[leading, continuation]);
    // Three classes: {leading only}, {continuation only}, {neither}.
    assert_eq!(num, 3);
}

#[test]
fn word_char_classes() {
    // \w = [0-9A-Za-z_] → many sub-ranges.
    let mut bs = ByteSet::empty();
    for b in b'0'..=b'9' {
        bs.insert(b);
    }
    for b in b'A'..=b'Z' {
        bs.insert(b);
    }
    for b in b'a'..=b'z' {
        bs.insert(b);
    }
    bs.insert(b'_');
    let (classes, num) = compute_byte_classes(&[bs]);
    // Two classes: word chars and non-word chars.
    assert_eq!(num, 2);
}
