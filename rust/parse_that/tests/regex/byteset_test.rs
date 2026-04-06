use parse_that::regex::byteset::ByteSet;

#[test]
fn empty_set() {
    let s = ByteSet::empty();
    assert!(s.is_empty());
    assert_eq!(s.len(), 0);
    assert!(!s.contains(0));
    assert!(!s.contains(255));
    assert_eq!(s.iter().count(), 0);
}

#[test]
fn full_set() {
    let s = ByteSet::full();
    assert!(!s.is_empty());
    assert_eq!(s.len(), 256);
    assert!(s.contains(0));
    assert!(s.contains(127));
    assert!(s.contains(255));
    assert_eq!(s.iter().count(), 256);
}

#[test]
fn ascii_set() {
    let s = ByteSet::ascii();
    assert_eq!(s.len(), 128);
    assert!(s.contains(0));
    assert!(s.contains(127));
    assert!(!s.contains(128));
    assert!(!s.contains(255));
}

#[test]
fn singleton() {
    let s = ByteSet::singleton(b'a');
    assert_eq!(s.len(), 1);
    assert!(s.contains(b'a'));
    assert!(!s.contains(b'b'));
    assert_eq!(s.iter().collect::<Vec<_>>(), vec![b'a']);
}

#[test]
fn range() {
    let s = ByteSet::range(b'a', b'z');
    assert_eq!(s.len(), 26);
    assert!(s.contains(b'a'));
    assert!(s.contains(b'z'));
    assert!(!s.contains(b'A'));
    assert!(!s.contains(b'a' - 1));
}

#[test]
fn range_boundary() {
    // Range spanning word boundary (0x3F = 63, 0x40 = 64).
    let s = ByteSet::range(60, 70);
    assert_eq!(s.len(), 11);
    for b in 60..=70 {
        assert!(s.contains(b), "should contain {}", b);
    }
    assert!(!s.contains(59));
    assert!(!s.contains(71));
}

#[test]
fn union_and_intersect() {
    let a = ByteSet::range(b'a', b'f');
    let b = ByteSet::range(b'd', b'k');
    let u = a.union(&b);
    assert_eq!(u.len(), 11); // a-k
    let i = a.intersect(&b);
    assert_eq!(i.len(), 3); // d-f
}

#[test]
fn negate() {
    let s = ByteSet::singleton(b'x');
    let n = s.negate();
    assert_eq!(n.len(), 255);
    assert!(!n.contains(b'x'));
    assert!(n.contains(b'y'));
}

#[test]
fn difference() {
    let a = ByteSet::range(b'a', b'z');
    let b = ByteSet::range(b'a', b'f');
    let d = a.difference(&b);
    assert_eq!(d.len(), 20); // g-z
    assert!(!d.contains(b'a'));
    assert!(d.contains(b'g'));
}

#[test]
fn disjoint() {
    let a = ByteSet::range(b'a', b'f');
    let b = ByteSet::range(b'g', b'z');
    assert!(a.is_disjoint(&b));
    let c = ByteSet::range(b'f', b'g');
    assert!(!a.is_disjoint(&c));
}

#[test]
fn insert_remove() {
    let mut s = ByteSet::empty();
    s.insert(42);
    assert!(s.contains(42));
    assert_eq!(s.len(), 1);
    s.remove(42);
    assert!(!s.contains(42));
    assert_eq!(s.len(), 0);
}

#[test]
fn iterator_ascending() {
    let s = ByteSet::range(250, 255);
    let v: Vec<u8> = s.iter().collect();
    assert_eq!(v, vec![250, 251, 252, 253, 254, 255]);
}

#[test]
fn exit_bytes() {
    // Set with all but 3 bytes → 3 exit bytes.
    let mut s = ByteSet::full();
    s.remove(b'"');
    s.remove(b'\\');
    s.remove(b'\n');
    let exits = s.negate();
    assert_eq!(exits.len(), 3);
    let eb = s.exit_bytes(8).unwrap();
    assert_eq!(eb.len(), 3);
    assert!(eb.contains(&b'"'));
    assert!(eb.contains(&b'\\'));
    assert!(eb.contains(&b'\n'));
}

#[test]
fn exit_bytes_over_limit() {
    let s = ByteSet::range(0, 100); // 101 bytes set → 155 exit bytes
    assert!(s.exit_bytes(8).is_none());
}

#[test]
fn exact_size_iterator() {
    let s = ByteSet::range(b'A', b'Z');
    let iter = s.iter();
    assert_eq!(iter.len(), 26);
}

#[test]
fn high_bytes_utf8_leading() {
    // UTF-8 leading bytes for 2-byte sequences: 0xC2–0xDF.
    let s = ByteSet::range(0xC2, 0xDF);
    assert_eq!(s.len(), 30);
    assert!(s.contains(0xC2));
    assert!(s.contains(0xDF));
    assert!(!s.contains(0xC1));
    assert!(!s.contains(0xE0));
}

#[test]
fn high_bytes_utf8_continuation() {
    // UTF-8 continuation bytes: 0x80–0xBF.
    let s = ByteSet::range(0x80, 0xBF);
    assert_eq!(s.len(), 64);
    assert!(s.contains(0x80));
    assert!(s.contains(0xBF));
    assert!(!s.contains(0x7F));
    assert!(!s.contains(0xC0));
}
