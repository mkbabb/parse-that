//! DFA/NFA state count estimation — heuristic cost inputs that avoid
//! full automaton construction.

use crate::hir::Hir;

/// Heuristic DFA state count estimate without full compilation.
///
/// Uses NFA state count as a proxy: for most practical patterns,
/// DFA states ≈ 2–4× NFA states. Returns `None` if NFA construction fails.
pub(super) fn estimate_dfa_size(hir: &Hir) -> Option<usize> {
    // Count NFA-like states from HIR structure.
    let nfa_estimate = estimate_nfa_states(hir);
    // Practical DFA states are typically 2-4x NFA states for non-pathological patterns.
    Some(nfa_estimate.saturating_mul(3))
}

fn estimate_nfa_states(hir: &Hir) -> usize {
    match hir {
        Hir::Empty => 1,
        Hir::Look(_) => 1,
        Hir::Literal(bytes) => bytes.len() + 1, // one state per byte + accept
        Hir::Class(_) => 2,                     // one transition state + accept
        Hir::Alternation(alts) => {
            2 + alts.iter().map(estimate_nfa_states).sum::<usize>() // split + join
        }
        Hir::Concat(seq) => seq.iter().map(estimate_nfa_states).sum::<usize>(),
        Hir::Repetition(rep) => {
            let sub = estimate_nfa_states(&rep.sub);
            match (rep.min, rep.max) {
                (0, None) => sub + 2,                          // Kleene star: ε-loop
                (1, None) => sub + 1,                          // Plus: body + loop-back
                (_, Some(m)) => sub * (m as usize).max(1) + 1, // Bounded: unroll
                _ => sub + 2,
            }
        }
        Hir::Group(sub) => estimate_nfa_states(sub),
    }
}
