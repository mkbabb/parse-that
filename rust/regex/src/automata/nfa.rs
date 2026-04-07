//! Thompson NFA construction from bespoke HIR.
//!
//! Converts a `Hir` tree into a byte-level NFA with ε-transitions.
//! Unicode codepoint ranges are expanded into UTF-8 byte sequences
//! via `super::utf8::Utf8Sequences`, so the NFA operates entirely
//! on individual bytes — never on codepoints.

use smallvec::SmallVec;

use crate::sets::byteset::ByteSet;
use crate::hir::{CharClass, Hir, Look, Repetition};
use crate::utf8::Utf8Sequences;

/// NFA state identifier. `DEAD` is a sentinel for "no transition".
pub type StateId = u32;
pub const DEAD: StateId = u32::MAX;

/// An ε-transition with priority for greedy/lazy disambiguation.
/// Lower priority values are preferred during DFA construction.
#[derive(Clone, Copy, Debug)]
pub struct EpsilonEdge {
    pub target: StateId,
    pub priority: u8,
}

/// A single NFA state.
#[derive(Clone, Debug)]
pub struct NfaState {
    /// Byte-class transitions: if input byte ∈ ByteSet, transition to target.
    pub transitions: SmallVec<[(ByteSet, StateId); 2]>,
    /// ε-transitions ordered by priority (lower = preferred).
    pub epsilon: SmallVec<[EpsilonEdge; 4]>,
}

impl NfaState {
    fn new() -> Self {
        Self {
            transitions: SmallVec::new(),
            epsilon: SmallVec::new(),
        }
    }
}

/// A Thompson NFA: set of states with a single start and single accept state.
#[derive(Clone, Debug)]
pub struct Nfa {
    pub states: Vec<NfaState>,
    pub start: StateId,
    pub accept: StateId,
}

/// A fragment produced during NFA construction — start and accept of a sub-NFA.
#[derive(Clone, Copy)]
struct Fragment {
    start: StateId,
    accept: StateId,
}

impl Nfa {
    /// Build an NFA from a regex pattern string.
    ///
    /// Returns `None` if the pattern is invalid or uses unsupported features.
    pub fn from_pattern(pattern: &str) -> Option<Self> {
        let hir = crate::hir::parser::parse(pattern).ok()?;
        Self::from_hir(&hir)
    }

    /// Build an NFA from an already-parsed HIR.
    ///
    /// Returns `None` for unsupported HIR features.
    pub fn from_hir(hir: &Hir) -> Option<Self> {
        let mut builder = NfaBuilder {
            states: Vec::with_capacity(64),
        };
        let frag = builder.build_hir(hir)?;
        Some(Nfa {
            states: builder.states,
            start: frag.start,
            accept: frag.accept,
        })
    }

    /// Number of states.
    pub fn state_count(&self) -> usize {
        self.states.len()
    }

    /// Collect all distinct ByteSets used in transitions.
    /// Used for computing byte equivalence classes.
    pub fn transition_byte_sets(&self) -> Vec<ByteSet> {
        let mut sets = Vec::new();
        for state in &self.states {
            for (bs, _) in &state.transitions {
                if !bs.is_empty() {
                    sets.push(*bs);
                }
            }
        }
        sets
    }
}

struct NfaBuilder {
    states: Vec<NfaState>,
}

impl NfaBuilder {
    fn new_state(&mut self) -> StateId {
        let id = self.states.len() as StateId;
        self.states.push(NfaState::new());
        id
    }

    fn add_transition(&mut self, from: StateId, byte_set: ByteSet, to: StateId) {
        self.states[from as usize].transitions.push((byte_set, to));
    }

    fn add_epsilon(&mut self, from: StateId, to: StateId, priority: u8) {
        self.states[from as usize].epsilon.push(EpsilonEdge {
            target: to,
            priority,
        });
    }

    fn build_hir(&mut self, hir: &Hir) -> Option<Fragment> {
        match hir {
            Hir::Empty => {
                let s = self.new_state();
                Some(Fragment {
                    start: s,
                    accept: s,
                })
            }

            Hir::Literal(bytes) => self.build_literal(bytes),

            Hir::Class(class) => self.build_class(class),

            Hir::Look(look) => self.build_look(*look),

            Hir::Repetition(rep) => self.build_repetition(rep),

            Hir::Group(sub) => {
                // Capture/non-capturing groups are transparent.
                self.build_hir(sub)
            }

            Hir::Concat(subs) => self.build_concat(subs),

            Hir::Alternation(alts) => self.build_alternation(alts),
        }
    }

    // ── Literal ──────────────────────────────────────────────────────

    fn build_literal(&mut self, bytes: &[u8]) -> Option<Fragment> {
        if bytes.is_empty() {
            let s = self.new_state();
            return Some(Fragment {
                start: s,
                accept: s,
            });
        }
        let start = self.new_state();
        let mut current = start;
        for &b in bytes {
            let next = self.new_state();
            self.add_transition(current, ByteSet::singleton(b), next);
            current = next;
        }
        Some(Fragment {
            start,
            accept: current,
        })
    }

    // ── Character class ──────────────────────────────────────────────

    fn build_class(&mut self, class: &CharClass) -> Option<Fragment> {
        match class {
            CharClass::Bytes { ranges, negated } => {
                let positive = if *negated {
                    crate::hir::negate_byte_ranges(ranges)
                } else {
                    ranges.clone()
                };
                let mut bs = ByteSet::empty();
                for range in &positive {
                    for b in range.start..=range.end {
                        bs.insert(b);
                    }
                }
                let start = self.new_state();
                let accept = self.new_state();
                self.add_transition(start, bs, accept);
                Some(Fragment { start, accept })
            }
            CharClass::Unicode { ranges, negated } => {
                let positive = if *negated {
                    crate::hir::negate_codepoint_ranges(ranges)
                } else {
                    ranges.clone()
                };
                self.build_unicode_class(&positive)
            }
        }
    }

    /// Build NFA fragment for Unicode codepoint ranges.
    ///
    /// Uses `Utf8Sequences` to convert codepoint ranges into byte-level NFA
    /// transitions. Each range may expand into multiple UTF-8 byte sequence
    /// paths through the NFA.
    fn build_unicode_class(
        &mut self,
        ranges: &[crate::hir::CodepointRange],
    ) -> Option<Fragment> {
        let start = self.new_state();
        let accept = self.new_state();

        for range in ranges {
            let lo = range.start;
            let hi = range.end;

            // Fast path: if entirely ASCII, emit a single byte-set transition.
            if hi <= '\x7F' {
                let mut bs = ByteSet::empty();
                for b in (lo as u8)..=(hi as u8) {
                    bs.insert(b);
                }
                self.add_transition(start, bs, accept);
                continue;
            }

            // General path: convert codepoint range to UTF-8 byte sequences.
            for seq in Utf8Sequences::new(lo, hi) {
                let byte_ranges = seq.as_slice();
                let mut current = start;
                for (i, byte_range) in byte_ranges.iter().enumerate() {
                    let target = if i == byte_ranges.len() - 1 {
                        accept
                    } else {
                        self.new_state()
                    };
                    let bs = ByteSet::range(byte_range.start, byte_range.end);
                    self.add_transition(current, bs, target);
                    current = target;
                }
            }
        }

        Some(Fragment { start, accept })
    }

    // ── Look-around assertions ──────────────────────────────────────

    fn build_look(&mut self, look: Look) -> Option<Fragment> {
        // Look assertions are zero-width: start == accept.
        match look {
            Look::Start | Look::StartLF | Look::StartCRLF
            | Look::End | Look::EndLF | Look::EndCRLF => {
                let s = self.new_state();
                Some(Fragment {
                    start: s,
                    accept: s,
                })
            }
        }
    }

    // ── Concatenation ────────────────────────────────────────────────

    fn build_concat(&mut self, subs: &[Hir]) -> Option<Fragment> {
        if subs.is_empty() {
            let s = self.new_state();
            return Some(Fragment {
                start: s,
                accept: s,
            });
        }

        let mut result = self.build_hir(&subs[0])?;
        for sub in &subs[1..] {
            let next = self.build_hir(sub)?;
            // Chain: result.accept → ε → next.start
            self.add_epsilon(result.accept, next.start, 0);
            result = Fragment {
                start: result.start,
                accept: next.accept,
            };
        }
        Some(result)
    }

    // ── Alternation ──────────────────────────────────────────────────

    fn build_alternation(&mut self, alts: &[Hir]) -> Option<Fragment> {
        if alts.is_empty() {
            let start = self.new_state();
            let accept = self.new_state();
            return Some(Fragment { start, accept });
        }
        if alts.len() == 1 {
            return self.build_hir(&alts[0]);
        }

        let start = self.new_state();
        let accept = self.new_state();

        for (i, alt) in alts.iter().enumerate() {
            let frag = self.build_hir(alt)?;
            // Priority = index → leftmost-first semantics.
            self.add_epsilon(start, frag.start, i as u8);
            self.add_epsilon(frag.accept, accept, 0);
        }

        Some(Fragment { start, accept })
    }

    // ── Repetition ──────────────────────────────────────────────────

    fn build_repetition(&mut self, rep: &Repetition) -> Option<Fragment> {
        let min = rep.min;
        let max = rep.max;
        let greedy = rep.greedy;

        match (min, max) {
            (0, Some(1)) => self.build_optional(&rep.sub, greedy),
            (0, None) => self.build_star(&rep.sub, greedy),
            (1, None) => self.build_plus(&rep.sub, greedy),
            (n, Some(m)) if n == m => self.build_exact(&rep.sub, n),
            (n, None) => self.build_at_least(&rep.sub, n, greedy),
            (n, Some(m)) => self.build_bounded(&rep.sub, n, m, greedy),
        }
    }

    fn build_optional(&mut self, sub: &Hir, greedy: bool) -> Option<Fragment> {
        let frag = self.build_hir(sub)?;
        let start = self.new_state();
        let accept = self.new_state();

        if greedy {
            self.add_epsilon(start, frag.start, 0);
            self.add_epsilon(start, accept, 1);
        } else {
            self.add_epsilon(start, accept, 0);
            self.add_epsilon(start, frag.start, 1);
        }
        self.add_epsilon(frag.accept, accept, 0);

        Some(Fragment { start, accept })
    }

    fn build_star(&mut self, sub: &Hir, greedy: bool) -> Option<Fragment> {
        let frag = self.build_hir(sub)?;
        let start = self.new_state();
        let accept = self.new_state();

        if greedy {
            self.add_epsilon(start, frag.start, 0);
            self.add_epsilon(start, accept, 1);
        } else {
            self.add_epsilon(start, accept, 0);
            self.add_epsilon(start, frag.start, 1);
        }
        self.add_epsilon(frag.accept, start, 0);

        Some(Fragment { start, accept })
    }

    fn build_plus(&mut self, sub: &Hir, greedy: bool) -> Option<Fragment> {
        let frag = self.build_hir(sub)?;
        let start = frag.start;
        let accept = self.new_state();

        if greedy {
            self.add_epsilon(frag.accept, frag.start, 0);
            self.add_epsilon(frag.accept, accept, 1);
        } else {
            self.add_epsilon(frag.accept, accept, 0);
            self.add_epsilon(frag.accept, frag.start, 1);
        }

        Some(Fragment { start, accept })
    }

    fn build_exact(&mut self, sub: &Hir, n: u32) -> Option<Fragment> {
        if n == 0 {
            let s = self.new_state();
            return Some(Fragment {
                start: s,
                accept: s,
            });
        }
        let mut result = self.build_hir(sub)?;
        for _ in 1..n {
            let next = self.build_hir(sub)?;
            self.add_epsilon(result.accept, next.start, 0);
            result = Fragment {
                start: result.start,
                accept: next.accept,
            };
        }
        Some(result)
    }

    fn build_at_least(&mut self, sub: &Hir, n: u32, greedy: bool) -> Option<Fragment> {
        let required = self.build_exact(sub, n)?;
        let star = self.build_star(sub, greedy)?;
        self.add_epsilon(required.accept, star.start, 0);
        Some(Fragment {
            start: required.start,
            accept: star.accept,
        })
    }

    fn build_bounded(&mut self, sub: &Hir, n: u32, m: u32, greedy: bool) -> Option<Fragment> {
        if m < n {
            return None;
        }
        let required = self.build_exact(sub, n)?;

        if n == m {
            return Some(required);
        }

        let mut current_accept = required.accept;
        let final_accept = self.new_state();

        for _ in 0..(m - n) {
            let opt = self.build_hir(sub)?;
            if greedy {
                self.add_epsilon(current_accept, opt.start, 0);
                self.add_epsilon(current_accept, final_accept, 1);
            } else {
                self.add_epsilon(current_accept, final_accept, 0);
                self.add_epsilon(current_accept, opt.start, 1);
            }
            current_accept = opt.accept;
        }
        self.add_epsilon(current_accept, final_accept, 0);

        Some(Fragment {
            start: required.start,
            accept: final_accept,
        })
    }
}

