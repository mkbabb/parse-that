//! Algebraic operations on regex HIR: superset checking, union computation.
//!
//! Pure HIR operations — no grammar IR dependency. The bbnf-ir pass calls
//! these for pattern simplification within Alt nodes.

mod superset;
mod union;

pub use superset::is_superset;
pub use union::try_union;

use crate::hir::{ByteRange, CharClass, Hir};
use crate::sets::byteset::ByteSet;

/// Extract the set of bytes matched by a single-char-class regex pattern.
///
/// Returns `None` if the pattern is not a simple char class (e.g., has
/// alternation, repetition beyond the top level, or negated classes).
pub fn extract_char_class_bytes(pattern: &str) -> Option<ByteSet> {
    let hir = crate::hir::parser::parse_with(
        pattern,
        &crate::hir::ParseOptions::byte_mode(),
    )
    .ok()?;
    hir_to_byteset(&hir)
}

/// Convert a ByteSet back to a character class pattern string.
pub fn byteset_to_pattern(bs: &ByteSet) -> String {
    let bytes: Vec<u8> = bs.iter().collect();
    let mut result = String::from("[");

    let mut i = 0;
    while i < bytes.len() {
        let start = bytes[i];
        let mut end = start;
        while i + 1 < bytes.len() && bytes[i + 1] == end + 1 {
            end = bytes[i + 1];
            i += 1;
        }

        if end - start >= 2 {
            result.push(start as char);
            result.push('-');
            result.push(end as char);
        } else if end > start {
            result.push(start as char);
            result.push(end as char);
        } else {
            result.push(start as char);
        }
        i += 1;
    }

    result.push(']');
    result
}

/// Extract the ByteSet from an HIR node (single char class or stripped repetition).
fn hir_to_byteset(hir: &Hir) -> Option<ByteSet> {
    match hir {
        Hir::Class(CharClass::Bytes { ranges, negated }) if !negated => {
            let mut bs = ByteSet::empty();
            for r in ranges {
                for b in r.start..=r.end {
                    bs.insert(b);
                }
            }
            Some(bs)
        }
        // Strip outer repetition: `[a-z]+` → `[a-z]`
        Hir::Repetition(rep) => hir_to_byteset(&rep.sub),
        // Single literal byte
        Hir::Literal(bytes) if bytes.len() == 1 => {
            let mut bs = ByteSet::empty();
            bs.insert(bytes[0]);
            Some(bs)
        }
        _ => None,
    }
}

/// Check if pattern a (string) contains pattern b (string) as a subset.
pub fn pattern_is_superset(a: &str, b: &str) -> bool {
    let a_bs = match extract_char_class_bytes(a) {
        Some(bs) => bs,
        None => return false,
    };
    let b_bs = match extract_char_class_bytes(b) {
        Some(bs) => bs,
        None => return false,
    };
    is_superset(&a_bs, &b_bs)
}

/// Try to compute the union of two char-class patterns.
/// Returns the merged pattern string, or None if patterns aren't simple char classes.
pub fn try_union_patterns(a: &str, b: &str) -> Option<String> {
    let a_bs = extract_char_class_bytes(a)?;
    let b_bs = extract_char_class_bytes(b)?;
    let merged = try_union(&a_bs, &b_bs);
    Some(byteset_to_pattern(&merged))
}
