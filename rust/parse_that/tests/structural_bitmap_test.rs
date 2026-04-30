use parse_that::ParserState;
use parse_that::parsers::scan::{NibbleBitmapIter, find_next_structural_from};

fn lut_for(targets: &[u8]) -> ([u8; 16], [u8; 16]) {
    let mut lo = [0u8; 16];
    let mut hi = [0u8; 16];
    for (i, &b) in targets.iter().enumerate() {
        assert!(i < 8, "nibble-LUT supports <= 8 targets");
        let bit = 1u8 << i;
        lo[(b & 0x0F) as usize] |= bit;
        hi[(b >> 4) as usize] |= bit;
    }
    (lo, hi)
}

/// Wrap a test input in a `ParserState` so we can borrow a
/// `PaddedView`. The `ParserState::new` path is the canonical
/// constructor that populates the 64-byte trailing zero pad.
fn padded_view_owner(input: &str) -> ParserState<'_> {
    ParserState::new(input)
}

#[test]
fn find_next_basic() {
    let owner = padded_view_owner("   hello, world! {wow}   ");
    let (lo, hi) = lut_for(&[b',', b'{', b'}']);
    let r = find_next_structural_from(owner.padded(), 0, &lo, &hi);
    assert_eq!(r, Some((8, b',')));
    let r2 = find_next_structural_from(owner.padded(), 9, &lo, &hi);
    assert_eq!(r2, Some((17, b'{')));
}

#[test]
fn find_next_tail_only() {
    let owner = padded_view_owner("  !");
    let (lo, hi) = lut_for(&[b'!']);
    let r = find_next_structural_from(owner.padded(), 0, &lo, &hi);
    assert_eq!(r, Some((2, b'!')));
}

#[test]
fn find_next_none() {
    let owner = padded_view_owner("abcdefg");
    let (lo, hi) = lut_for(&[b',', b'{']);
    let r = find_next_structural_from(owner.padded(), 0, &lo, &hi);
    assert_eq!(r, None);
}

#[test]
fn iter_basic() {
    let input = b"{abc,xyz:1,qq}";
    let (lo, hi) = lut_for(&[b'{', b'}', b',', b':']);
    let mut it = NibbleBitmapIter::new(input, 0, &lo, &hi);
    let mut got = Vec::new();
    while let Some((pos, b)) = it.next() {
        got.push((pos, b));
    }
    assert_eq!(
        got,
        vec![(0, b'{'), (4, b','), (8, b':'), (10, b','), (13, b'}'),]
    );
}

#[test]
fn iter_across_stripe() {
    let mut s = String::new();
    s.push_str("{");
    s.push_str(&"a".repeat(70));
    s.push_str(",b}");
    let bytes = s.as_bytes();
    let (lo, hi) = lut_for(&[b'{', b'}', b',']);
    let mut it = NibbleBitmapIter::new(bytes, 0, &lo, &hi);
    let mut got = Vec::new();
    while let Some((pos, b)) = it.next() {
        got.push((pos, b));
    }
    assert_eq!(got, vec![(0, b'{'), (71, b','), (73, b'}'),]);
}

#[test]
fn iter_set_offset_skips_forward() {
    let input = b"{a,b,c,d}";
    let (lo, hi) = lut_for(&[b',']);
    let mut it = NibbleBitmapIter::new(input, 0, &lo, &hi);
    let first = it.next();
    assert_eq!(first, Some((2, b',')));
    it.set_offset(6);
    let next = it.next();
    assert_eq!(next, Some((6, b',')));
}
