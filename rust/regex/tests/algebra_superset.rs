//! Tranche O — extracted from `regex/src/algebra/superset.rs`.
//! Pure-function tests over `algebra::is_superset`.

use bbnf_regex::ByteSet;
use bbnf_regex::algebra::is_superset;

#[test]
fn superset_basic() {
    let mut a = ByteSet::empty();
    for b in b'a'..=b'z' {
        a.insert(b);
    }

    let mut b = ByteSet::empty();
    for b_byte in b'a'..=b'c' {
        b.insert(b_byte);
    }

    assert!(is_superset(&a, &b));
    assert!(!is_superset(&b, &a));
}

#[test]
fn superset_equal() {
    let mut a = ByteSet::empty();
    for b in b'0'..=b'9' {
        a.insert(b);
    }
    assert!(is_superset(&a, &a));
}
