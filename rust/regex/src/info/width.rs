//! Match-width computation, HIR node counting, and the `is_nullable`
//! monotone property.

use crate::hir::{CharClass, Hir, Repetition};

// ── Nullable ─────────────────────────────────────────────────────────────

/// Whether a HIR node can match the empty string.
pub fn is_nullable(hir: &Hir) -> bool {
    match hir {
        Hir::Empty => true,
        Hir::Literal(_) => false,
        Hir::Class(_) => false,
        Hir::Alternation(alts) => alts.iter().any(is_nullable),
        Hir::Concat(seq) => seq.iter().all(is_nullable),
        Hir::Repetition(rep) => rep.min == 0,
        Hir::Group(sub) => is_nullable(sub),
        Hir::Look(_) => true,
    }
}

// ── Match width ──────────────────────────────────────────────────────────

/// Compute (min_match_len, max_match_len) for a HIR node.
///
/// `max_match_len` is `None` for unbounded patterns (e.g., `a+`, `.*`).
pub(super) fn compute_match_width(hir: &Hir) -> (usize, Option<usize>) {
    match hir {
        Hir::Empty | Hir::Look(_) => (0, Some(0)),

        Hir::Literal(bytes) => {
            let n = bytes.len();
            (n, Some(n))
        }

        Hir::Class(class) => {
            let (lo, hi) = class_byte_width(class);
            (lo, Some(hi))
        }

        Hir::Alternation(alts) => {
            if alts.is_empty() {
                return (0, Some(0));
            }
            let mut min_lo = usize::MAX;
            let mut max_hi: Option<usize> = Some(0);
            for alt in alts {
                let (lo, hi) = compute_match_width(alt);
                min_lo = min_lo.min(lo);
                max_hi = match (max_hi, hi) {
                    (Some(a), Some(b)) => Some(a.max(b)),
                    _ => None,
                };
            }
            (min_lo, max_hi)
        }

        Hir::Concat(seq) => {
            let mut total_lo: usize = 0;
            let mut total_hi: Option<usize> = Some(0);
            for child in seq {
                let (lo, hi) = compute_match_width(child);
                total_lo = total_lo.saturating_add(lo);
                total_hi = match (total_hi, hi) {
                    (Some(a), Some(b)) => a.checked_add(b),
                    _ => None,
                };
            }
            (total_lo, total_hi)
        }

        Hir::Repetition(Repetition {
            sub, min, max, ..
        }) => {
            let (sub_lo, sub_hi) = compute_match_width(sub);
            let rep_lo = (*min as usize).saturating_mul(sub_lo);
            let rep_hi = match (max, sub_hi) {
                (Some(m), Some(h)) => (*m as usize).checked_mul(h),
                (Some(0), _) => Some(0),
                _ => None, // unbounded repetition
            };
            (rep_lo, rep_hi)
        }

        Hir::Group(sub) => compute_match_width(sub),
    }
}

/// Byte width range for a character class.
fn class_byte_width(class: &CharClass) -> (usize, usize) {
    match class {
        CharClass::Bytes { .. } => (1, 1),
        CharClass::Unicode { ranges, negated } => {
            // Unicode classes can match multi-byte UTF-8 sequences.
            let effective = if *negated {
                // Negated: at least 1 byte (ASCII), up to 4 bytes (non-BMP complement).
                return (1, 4);
            } else {
                ranges
            };
            if effective.is_empty() {
                return (0, 0);
            }
            let min_cp = effective.first().unwrap().start as u32;
            let max_cp = effective.last().unwrap().end as u32;
            let lo = utf8_len(min_cp);
            let hi = utf8_len(max_cp);
            (lo, hi)
        }
    }
}

fn utf8_len(cp: u32) -> usize {
    if cp <= 0x7F {
        1
    } else if cp <= 0x7FF {
        2
    } else if cp <= 0xFFFF {
        3
    } else {
        4
    }
}

// ── HIR node counting ────────────────────────────────────────────────────

pub(super) fn count_hir_nodes(hir: &Hir) -> usize {
    match hir {
        Hir::Empty | Hir::Literal(_) | Hir::Class(_) | Hir::Look(_) => 1,
        Hir::Repetition(rep) => 1 + count_hir_nodes(&rep.sub),
        Hir::Group(sub) => 1 + count_hir_nodes(sub),
        Hir::Concat(seq) => 1 + seq.iter().map(count_hir_nodes).sum::<usize>(),
        Hir::Alternation(alts) => 1 + alts.iter().map(count_hir_nodes).sum::<usize>(),
    }
}
