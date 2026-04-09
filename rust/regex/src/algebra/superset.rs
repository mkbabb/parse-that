//! Superset checking: ByteSet A ⊇ ByteSet B.

use crate::sets::byteset::ByteSet;

/// Check if `a` is a superset of `b` (every byte in `b` is also in `a`).
pub fn is_superset(a: &ByteSet, b: &ByteSet) -> bool {
    b.iter().all(|byte| a.contains(byte))
}
