//! Union computation: ByteSet A ∪ ByteSet B.

use crate::sets::byteset::ByteSet;

/// Compute the union of two byte sets.
pub fn try_union(a: &ByteSet, b: &ByteSet) -> ByteSet {
    a.union(b)
}
