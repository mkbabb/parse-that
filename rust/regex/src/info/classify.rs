//! Structural classifiers over HIR: anchors, negated classes,
//! quantified classes, and `memchr` acceleration candidates.

use crate::hir::{CharClass, Hir, Repetition};
use crate::sets::charset::CharSet128;

use super::QuantifiedClassInfo;

// ── Acceleration candidate detection ────────────────────────────────────────

/// Find a single byte that must appear in every match, suitable for
/// `memchr`-based acceleration. Prefers the first literal byte if the
/// pattern starts with a fixed prefix; otherwise picks the first byte of
/// a fixed suffix. Returns `None` for wholly variable patterns.
pub(super) fn detect_accel_candidate(
    _hir: &Hir,
    literal_prefix: &Option<Vec<u8>>,
    literal_suffix: &Option<Vec<u8>>,
) -> Option<u8> {
    if let Some(prefix) = literal_prefix {
        if let Some(&b) = prefix.first() {
            return Some(b);
        }
    }
    if let Some(suffix) = literal_suffix {
        if let Some(&b) = suffix.first() {
            return Some(b);
        }
    }
    None
}

// ── Negated class detection ──────────────────────────────────────────────

/// Detect `[^XYZ]+` or `[^XYZ]*` patterns. Returns the positive-form CharSet128
/// (bytes that the negated class accepts).
pub(super) fn detect_negated_class(hir: &Hir) -> Option<CharSet128> {
    match hir {
        // Bare negated class: [^XYZ]
        Hir::Class(CharClass::Bytes { negated: true, .. }) => Some(class_to_charset_positive(hir)),

        // Quantified negated class: [^XYZ]+ or [^XYZ]*
        Hir::Repetition(Repetition { sub, .. }) => detect_negated_class(sub),

        // Concat starting with negated class
        Hir::Concat(seq) if !seq.is_empty() => detect_negated_class(&seq[0]),

        Hir::Group(sub) => detect_negated_class(sub),

        _ => None,
    }
}

/// Convert a CharClass to its positive-form CharSet128 (ASCII).
pub(super) fn class_to_charset_positive(hir: &Hir) -> CharSet128 {
    let mut cs = CharSet128::new();
    if let Hir::Class(class) = hir {
        let ranges = class.to_positive_byte_ranges();
        for r in &ranges {
            let lo = r.start;
            let hi = r.end.min(127);
            if lo <= hi {
                cs.add_range(lo, hi);
            }
        }
    }
    cs
}

// ── Quantified class detection ───────────────────────────────────────────

/// Detect patterns like `[a-z]+`, `\d*`, `[^"\\]+` — a quantified character class.
pub(super) fn detect_quantified_class(hir: &Hir) -> Option<QuantifiedClassInfo> {
    match hir {
        Hir::Repetition(Repetition {
            sub, min, max, ..
        }) => {
            if let Hir::Class(class) = sub.as_ref() {
                let negated = class.negated();
                let ranges = class.to_positive_byte_ranges();
                let mut chars = CharSet128::new();
                for r in &ranges {
                    let lo = r.start;
                    let hi = r.end.min(127);
                    if lo <= hi {
                        chars.add_range(lo, hi);
                    }
                }
                Some(QuantifiedClassInfo {
                    chars,
                    negated,
                    min: *min,
                    max: *max,
                })
            } else if let Hir::Group(inner) = sub.as_ref() {
                // Unwrap group around class
                if let Hir::Class(class) = inner.as_ref() {
                    let negated = class.negated();
                    let ranges = class.to_positive_byte_ranges();
                    let mut chars = CharSet128::new();
                    for r in &ranges {
                        let lo = r.start;
                        let hi = r.end.min(127);
                        if lo <= hi {
                            chars.add_range(lo, hi);
                        }
                    }
                    Some(QuantifiedClassInfo {
                        chars,
                        negated,
                        min: *min,
                        max: *max,
                    })
                } else {
                    None
                }
            } else {
                None
            }
        }

        // Concat where first element is a quantified class
        Hir::Concat(seq) if !seq.is_empty() => detect_quantified_class(&seq[0]),

        Hir::Group(sub) => detect_quantified_class(sub),

        _ => None,
    }
}

// ── Anchor detection ─────────────────────────────────────────────────────

pub(super) fn detect_anchored(hir: &Hir) -> bool {
    match hir {
        Hir::Look(crate::hir::Look::Start | crate::hir::Look::End) => true,

        Hir::Concat(seq) => {
            if let Some(first) = seq.first() {
                if matches!(first, Hir::Look(crate::hir::Look::Start)) {
                    return true;
                }
            }
            if let Some(last) = seq.last() {
                if matches!(last, Hir::Look(crate::hir::Look::End)) {
                    return true;
                }
            }
            false
        }

        Hir::Group(sub) => detect_anchored(sub),

        _ => false,
    }
}
