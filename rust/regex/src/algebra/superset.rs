//! Superset checking: ByteSet A ⊇ ByteSet B.

use crate::sets::byteset::ByteSet;

/// Check if `a` is a superset of `b` (every byte in `b` is also in `a`).
pub fn is_superset(a: &ByteSet, b: &ByteSet) -> bool {
    b.iter().all(|byte| a.contains(byte))
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
