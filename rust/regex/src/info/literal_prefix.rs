//! Fixed-byte prefix and suffix extraction from HIR.

use crate::hir::Hir;

use super::width::compute_match_width;

/// Extract fixed byte prefix from the pattern.
pub(super) fn extract_literal_prefix(hir: &Hir) -> Option<Vec<u8>> {
    match hir {
        Hir::Literal(bytes) => Some(bytes.clone()),

        Hir::Concat(seq) => {
            let mut prefix = Vec::new();
            for child in seq {
                match child {
                    Hir::Literal(bytes) => prefix.extend_from_slice(bytes),
                    Hir::Group(sub) => {
                        if let Some(p) = extract_literal_prefix(sub) {
                            prefix.extend_from_slice(&p);
                            if p.len() < compute_match_width(sub).0 {
                                break; // sub has more than just a literal
                            }
                        } else {
                            break;
                        }
                    }
                    _ => break,
                }
            }
            if prefix.is_empty() {
                None
            } else {
                Some(prefix)
            }
        }

        Hir::Group(sub) => extract_literal_prefix(sub),

        _ => None,
    }
}

/// Extract fixed byte suffix from the pattern.
pub(super) fn extract_literal_suffix(hir: &Hir) -> Option<Vec<u8>> {
    match hir {
        Hir::Literal(bytes) => Some(bytes.clone()),

        Hir::Concat(seq) => {
            let mut suffix = Vec::new();
            for child in seq.iter().rev() {
                match child {
                    Hir::Literal(bytes) => {
                        let mut b = bytes.clone();
                        b.extend_from_slice(&suffix);
                        suffix = b;
                    }
                    Hir::Group(sub) => {
                        if let Some(s) = extract_literal_suffix(sub) {
                            let mut b = s;
                            b.extend_from_slice(&suffix);
                            suffix = b;
                            if compute_match_width(sub).0
                                > extract_literal_suffix(sub).map_or(0, |s| s.len())
                            {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    _ => break,
                }
            }
            if suffix.is_empty() {
                None
            } else {
                Some(suffix)
            }
        }

        Hir::Group(sub) => extract_literal_suffix(sub),

        _ => None,
    }
}
