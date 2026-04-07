//! FIRST set extraction from regex patterns via bespoke regex HIR.
//!
//! Uses `CharSet128` (128-bit ASCII bitset) for the IR crate.

use crate::hir::{CharClass, Hir};

use crate::sets::charset::CharSet128;

/// Extract the set of possible first bytes from a regex pattern.
///
/// Returns `None` for patterns containing wildcards (`.`) or unsupported constructs
/// whose FIRST set cannot be usefully constrained.
pub fn regex_first_chars(pattern: &str) -> Option<CharSet128> {
    let hir = crate::hir::parser::parse_with(pattern, &crate::hir::ParseOptions::byte_mode())
        .ok()?;
    first_chars_from_hir(&hir)
}

/// Threshold: if a class covers this many or more of the 128 ASCII slots,
/// treat it as "any byte" and return `None` (equivalent to the old `.` bail-out).
const WILDCARD_THRESHOLD: usize = 126;

fn first_chars_from_hir(hir: &Hir) -> Option<CharSet128> {
    match hir {
        Hir::Empty => Some(CharSet128::new()),

        Hir::Literal(bytes) => {
            let mut cs = CharSet128::new();
            if let Some(&b) = bytes.first() {
                cs.add(b);
            }
            Some(cs)
        }

        Hir::Class(class) => {
            let cs = class_to_charset(class);
            if cs.len() >= WILDCARD_THRESHOLD {
                None // wildcard-like class (e.g. `.`)
            } else {
                Some(cs)
            }
        }

        Hir::Alternation(alts) => {
            let mut cs = CharSet128::new();
            for alt in alts {
                cs.union(&first_chars_from_hir(alt)?);
            }
            Some(cs)
        }

        Hir::Concat(seq) => {
            if seq.is_empty() {
                return Some(CharSet128::new());
            }
            let first = first_chars_from_hir(&seq[0])?;
            if is_nullable(&seq[0]) {
                let mut cs = first;
                if seq.len() > 1 {
                    if let Some(next) = first_chars_from_hir(&seq[1]) {
                        cs.union(&next);
                    }
                }
                Some(cs)
            } else {
                Some(first)
            }
        }

        Hir::Repetition(rep) => first_chars_from_hir(&rep.sub),

        Hir::Group(sub) => first_chars_from_hir(sub),

        Hir::Look(_) => Some(CharSet128::new()),
    }
}

fn class_to_charset(class: &CharClass) -> CharSet128 {
    let mut cs = CharSet128::new();
    match class {
        CharClass::Bytes { ranges, negated } => {
            if *negated {
                // Negated class: add all ASCII bytes NOT covered by the ranges.
                // First, build the positive set, then complement within 0..=127.
                let mut positive = CharSet128::new();
                for range in ranges {
                    let lo = range.start;
                    let hi = range.end.min(127);
                    if lo <= hi {
                        positive.add_range(lo, hi);
                    }
                }
                for b in 0..=127u8 {
                    if !positive.has(b) {
                        cs.add(b);
                    }
                }
            } else {
                for range in ranges {
                    let lo = range.start;
                    let hi = range.end.min(127);
                    if lo <= hi {
                        cs.add_range(lo, hi);
                    }
                }
            }
        }
        CharClass::Unicode { ranges, negated } => {
            if *negated {
                // Negated Unicode class: complement within ASCII range.
                let mut positive = CharSet128::new();
                for range in ranges {
                    let start = range.start as u32;
                    let end = range.end as u32;
                    let lo = start.min(127) as u8;
                    let hi = end.min(127) as u8;
                    if lo <= hi {
                        positive.add_range(lo, hi);
                    }
                }
                for b in 0..=127u8 {
                    if !positive.has(b) {
                        cs.add(b);
                    }
                }
            } else {
                for range in ranges {
                    let start = range.start as u32;
                    let end = range.end as u32;
                    let lo = start.min(127) as u8;
                    let hi = end.min(127) as u8;
                    if lo <= hi {
                        cs.add_range(lo, hi);
                    }
                }
            }
        }
    }
    cs
}

fn is_nullable(hir: &Hir) -> bool {
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
