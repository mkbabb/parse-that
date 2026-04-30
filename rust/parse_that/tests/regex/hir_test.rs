use parse_that::regex::hir::{ByteRange, CharClass, negate_byte_ranges};

#[test]
fn negate_empty() {
    let neg = negate_byte_ranges(&[]);
    assert_eq!(neg, vec![ByteRange::new(0, 255)]);
}

#[test]
fn negate_full() {
    let neg = negate_byte_ranges(&[ByteRange::new(0, 255)]);
    assert!(neg.is_empty());
}

#[test]
fn negate_middle() {
    // [a-z] → [0, 96] ∪ [123, 255]
    let neg = negate_byte_ranges(&[ByteRange::new(b'a', b'z')]);
    assert_eq!(
        neg,
        vec![ByteRange::new(0, b'a' - 1), ByteRange::new(b'z' + 1, 255),]
    );
}

#[test]
fn char_class_negated_flag() {
    let c = CharClass::Bytes {
        ranges: vec![ByteRange::new(b'a', b'z')],
        negated: true,
    };
    assert!(c.negated());
    let positive = c.to_positive_byte_ranges();
    assert!(positive.iter().any(|r| r.start == 0));
    assert!(!positive.iter().any(|r| r.start == b'a' && r.end == b'z'));
}
