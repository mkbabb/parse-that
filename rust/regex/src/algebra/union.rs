//! Union computation: ByteSet A ∪ ByteSet B.

use crate::sets::byteset::ByteSet;

/// Compute the union of two byte sets.
pub fn try_union(a: &ByteSet, b: &ByteSet) -> ByteSet {
    a.union(b)
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
