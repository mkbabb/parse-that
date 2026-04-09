//! One-pass eligibility (disjoint-FIRST alternation) and HIR walkability
//! — two recursive predicates that share a common "walk every sub-node"
//! shape.

use crate::hir::Hir;
use crate::sets::charset::CharSet128;

// ── HIR walkability check ───────────────────────────────────────────────────

/// Whether the HIR walker can compile this pattern to inline byte operations.
///
/// Returns `false` for patterns containing constructs the walker doesn't
/// handle: lazy quantifiers outside `.*?literal`, Unicode properties beyond
/// ASCII, backreferences, or non-anchor look-around.
///
/// This is a conservative check used to skip the HIR-emit probe at backends
/// that can cache `RegexInfo`. The actual walker may succeed or fail
/// independently; a `true` here is a necessary (not sufficient) condition.
pub(super) fn is_hir_walkable(hir: &Hir) -> bool {
    match hir {
        Hir::Empty | Hir::Literal(_) | Hir::Class(_) => true,
        Hir::Look(_) => true, // anchors are fine
        Hir::Repetition(rep) => {
            // Greedy only — lazy repetitions are only handled as part of
            // the `.*?literal` special case in the walker.
            rep.greedy && is_hir_walkable(&rep.sub)
        }
        Hir::Group(sub) => is_hir_walkable(sub),
        Hir::Concat(seq) => seq.iter().all(is_hir_walkable),
        Hir::Alternation(alts) => alts.iter().all(is_hir_walkable),
    }
}

// ── One-pass eligibility ─────────────────────────────────────────────────

/// Check if the pattern can be matched in a single left-to-right pass
/// without backtracking. True when no alternation has overlapping FIRST sets.
pub(super) fn check_one_pass_eligible(hir: &Hir) -> bool {
    match hir {
        Hir::Empty | Hir::Literal(_) | Hir::Class(_) | Hir::Look(_) => true,

        Hir::Alternation(alts) => {
            // Check pairwise FIRST set disjointness.
            let firsts: Vec<Option<CharSet128>> =
                alts.iter().map(|a| first_chars_of_hir(a)).collect();
            for i in 0..firsts.len() {
                for j in (i + 1)..firsts.len() {
                    match (&firsts[i], &firsts[j]) {
                        (Some(a), Some(b)) => {
                            if !a.is_disjoint(b) {
                                return false;
                            }
                        }
                        // If either is None (wildcard), they overlap.
                        _ => return false,
                    }
                }
            }
            // Also check children recursively.
            alts.iter().all(check_one_pass_eligible)
        }

        Hir::Concat(seq) => seq.iter().all(check_one_pass_eligible),
        Hir::Repetition(rep) => check_one_pass_eligible(&rep.sub),
        Hir::Group(sub) => check_one_pass_eligible(sub),
    }
}

/// FIRST chars for a single HIR node (used internally for one-pass check).
fn first_chars_of_hir(hir: &Hir) -> Option<CharSet128> {
    crate::first::regex_first_chars_from_hir(hir)
}
