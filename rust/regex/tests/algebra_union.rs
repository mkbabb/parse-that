//! Tranche O — extracted from `regex/src/algebra/union.rs`.
//! Pure-function tests over `algebra::try_union`.

use bbnf_regex::ByteSet;
use bbnf_regex::algebra::try_union;

#[test]
fn union_disjoint() {
    let mut a = ByteSet::empty();
    for b in b'a'..=b'c' {
        a.insert(b);
    }

    let mut b = ByteSet::empty();
    for b_byte in b'd'..=b'f' {
        b.insert(b_byte);
    }

    let merged = try_union(&a, &b);
    for b in b'a'..=b'f' {
        assert!(merged.contains(b));
    }
}
