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
