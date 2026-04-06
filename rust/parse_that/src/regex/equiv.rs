//! Byte equivalence class computation.
//!
//! Partitions the 256-byte alphabet into equivalence classes where all bytes
//! within a class behave identically across every NFA transition. This reduces
//! the DFA transition table from 256 entries per state to `num_classes` entries,
//! typically 5–20 for common patterns.

use super::byteset::ByteSet;

/// Compute byte equivalence classes from a set of ByteSets.
///
/// Two bytes are in the same class if and only if they have identical
/// membership across all input ByteSets. Returns a mapping from byte → class ID
/// and the total number of classes.
///
/// The class ID space is dense: IDs are 0..num_classes.
pub fn compute_byte_classes(byte_sets: &[ByteSet]) -> ([u8; 256], u16) {
    if byte_sets.is_empty() {
        // No transitions → all bytes are equivalent.
        return ([0u8; 256], 1);
    }

    // Build a signature for each byte: a bitvec of which ByteSets contain it.
    // Two bytes with the same signature are equivalent.
    //
    // For up to 64 ByteSets, the signature fits in a u64.
    // For more, we use a Vec<u64> signature.
    if byte_sets.len() <= 64 {
        compute_classes_small(byte_sets)
    } else {
        compute_classes_large(byte_sets)
    }
}

/// Fast path: ≤ 64 ByteSets → signature fits in a single u64.
fn compute_classes_small(byte_sets: &[ByteSet]) -> ([u8; 256], u16) {
    let mut signatures = [0u64; 256];

    for (i, bs) in byte_sets.iter().enumerate() {
        let bit = 1u64 << i;
        for b in bs.iter() {
            signatures[b as usize] |= bit;
        }
    }

    // Assign class IDs by deduplicating signatures.
    let mut classes = [0u8; 256];
    let mut sig_to_class: Vec<(u64, u8)> = Vec::with_capacity(32);
    let mut next_class: u8 = 0;

    for (b, &sig) in signatures.iter().enumerate() {
        match sig_to_class.iter().find(|(s, _)| *s == sig) {
            Some(&(_, cls)) => classes[b] = cls,
            None => {
                classes[b] = next_class;
                sig_to_class.push((sig, next_class));
                next_class = next_class.saturating_add(1);
            }
        }
    }

    (classes, next_class as u16)
}

/// General path: > 64 ByteSets → signature is a Vec<u64>.
fn compute_classes_large(byte_sets: &[ByteSet]) -> ([u8; 256], u16) {
    let num_words = (byte_sets.len() + 63) / 64;
    let mut signatures: Vec<Vec<u64>> = vec![vec![0u64; num_words]; 256];

    for (i, bs) in byte_sets.iter().enumerate() {
        let word = i / 64;
        let bit = 1u64 << (i % 64);
        for b in bs.iter() {
            signatures[b as usize][word] |= bit;
        }
    }

    let mut classes = [0u8; 256];
    let mut sig_to_class: Vec<(Vec<u64>, u8)> = Vec::with_capacity(32);
    let mut next_class: u8 = 0;

    for (b, sig) in signatures.iter().enumerate() {
        match sig_to_class.iter().find(|(s, _)| s == sig) {
            Some(&(_, cls)) => classes[b] = cls,
            None => {
                classes[b] = next_class;
                sig_to_class.push((sig.clone(), next_class));
                next_class = next_class.saturating_add(1);
            }
        }
    }

    (classes, next_class as u16)
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
