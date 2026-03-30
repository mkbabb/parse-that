//! Thompson NFA construction from regex-syntax HIR.
//!
//! Converts a `regex_syntax::hir::Hir` tree into a byte-level NFA with
//! ε-transitions. Unicode codepoint ranges are expanded into UTF-8 byte
//! sequences using `regex_syntax::utf8::Utf8Sequences`, so the NFA operates
//! entirely on individual bytes — never on codepoints.

use regex_syntax::hir::{Class, Hir, HirKind, Look, Repetition};
use regex_syntax::utf8::Utf8Sequences;
use smallvec::SmallVec;

use super::byteset::ByteSet;

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
    /// Returns `None` if the pattern is invalid, uses unsupported features
    /// (backreferences), or if regex-syntax cannot parse it.
    pub fn from_pattern(pattern: &str) -> Option<Self> {
        let hir = regex_syntax::ParserBuilder::new()
            .utf8(true)
            .unicode(true)
            .build()
            .parse(pattern)
            .ok()?;
        Self::from_hir(&hir)
    }

    /// Build an NFA from an already-parsed HIR.
    ///
    /// Returns `None` for unsupported HIR features (backreferences).
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
        match hir.kind() {
            HirKind::Empty => {
                let s = self.new_state();
                Some(Fragment {
                    start: s,
                    accept: s,
                })
            }

            HirKind::Literal(lit) => self.build_literal(&lit.0),

            HirKind::Class(class) => self.build_class(class),

            HirKind::Look(look) => self.build_look(*look),

            HirKind::Repetition(rep) => self.build_repetition(rep),

            HirKind::Capture(cap) => {
                // Ignore capture group boundaries — we only need Span (start, end).
                self.build_hir(&cap.sub)
            }

            HirKind::Concat(subs) => self.build_concat(subs),

            HirKind::Alternation(alts) => self.build_alternation(alts),
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

    fn build_class(&mut self, class: &Class) -> Option<Fragment> {
        match class {
            Class::Bytes(cb) => {
                let mut bs = ByteSet::empty();
                for range in cb.ranges() {
                    for b in range.start()..=range.end() {
                        bs.insert(b);
                    }
                }
                let start = self.new_state();
                let accept = self.new_state();
                self.add_transition(start, bs, accept);
                Some(Fragment { start, accept })
            }
            Class::Unicode(cu) => self.build_unicode_class(cu),
        }
    }

    /// Build NFA fragment for a Unicode character class.
    ///
    /// Uses `regex_syntax::utf8::Utf8Sequences` to convert codepoint ranges
    /// into byte-level NFA transitions. Each codepoint range may expand into
    /// multiple UTF-8 byte sequence paths through the NFA.
    fn build_unicode_class(
        &mut self,
        cu: &regex_syntax::hir::ClassUnicode,
    ) -> Option<Fragment> {
        let start = self.new_state();
        let accept = self.new_state();

        for range in cu.ranges() {
            let lo = range.start();
            let hi = range.end();

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
                let ranges = seq.as_slice();
                let mut current = start;
                for (i, byte_range) in ranges.iter().enumerate() {
                    let target = if i == ranges.len() - 1 {
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
        // We encode them as special marker states.
        // For now, we support start/end anchors. Word boundaries are
        // handled by flagging the state for the DFA driver.
        match look {
            Look::Start | Look::StartLF | Look::StartCRLF => {
                let s = self.new_state();
                Some(Fragment {
                    start: s,
                    accept: s,
                })
            }
            Look::End | Look::EndLF | Look::EndCRLF => {
                let s = self.new_state();
                Some(Fragment {
                    start: s,
                    accept: s,
                })
            }
            // Word boundaries and other complex assertions:
            // We can still build the NFA, but the DFA driver needs
            // special handling. For now, return None to fall back.
            Look::WordUnicode
            | Look::WordUnicodeNegate
            | Look::WordAscii
            | Look::WordAsciiNegate => {
                // TODO: word boundary support via DFA state flags.
                None
            }
            _ => None,
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
            // Empty alternation = always fails. Create a dead fragment.
            let start = self.new_state();
            let accept = self.new_state();
            // No transitions → never reaches accept.
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
        let max = rep.max; // None = unbounded
        let greedy = rep.greedy;

        match (min, max) {
            // `?` — optional
            (0, Some(1)) => self.build_optional(&rep.sub, greedy),

            // `*` — zero or more
            (0, None) => self.build_star(&rep.sub, greedy),

            // `+` — one or more
            (1, None) => self.build_plus(&rep.sub, greedy),

            // `{n}` — exactly n
            (n, Some(m)) if n == m => self.build_exact(&rep.sub, n),

            // `{n,}` — n or more
            (n, None) => self.build_at_least(&rep.sub, n, greedy),

            // `{n,m}` — between n and m
            (n, Some(m)) => self.build_bounded(&rep.sub, n, m, greedy),
        }
    }

    /// `sub?` — optional.
    fn build_optional(&mut self, sub: &Hir, greedy: bool) -> Option<Fragment> {
        let frag = self.build_hir(sub)?;
        let start = self.new_state();
        let accept = self.new_state();

        if greedy {
            // Greedy: prefer matching (priority 0), skip is fallback (priority 1).
            self.add_epsilon(start, frag.start, 0);
            self.add_epsilon(start, accept, 1);
        } else {
            // Lazy: prefer skipping (priority 0), match is fallback (priority 1).
            self.add_epsilon(start, accept, 0);
            self.add_epsilon(start, frag.start, 1);
        }
        self.add_epsilon(frag.accept, accept, 0);

        Some(Fragment { start, accept })
    }

    /// `sub*` — zero or more.
    fn build_star(&mut self, sub: &Hir, greedy: bool) -> Option<Fragment> {
        let frag = self.build_hir(sub)?;
        let start = self.new_state();
        let accept = self.new_state();

        if greedy {
            // Greedy: prefer looping, fallback to exit.
            self.add_epsilon(start, frag.start, 0);
            self.add_epsilon(start, accept, 1);
        } else {
            // Lazy: prefer exiting, fallback to looping.
            self.add_epsilon(start, accept, 0);
            self.add_epsilon(start, frag.start, 1);
        }
        self.add_epsilon(frag.accept, start, 0); // loop back

        Some(Fragment { start, accept })
    }

    /// `sub+` — one or more.
    fn build_plus(&mut self, sub: &Hir, greedy: bool) -> Option<Fragment> {
        let frag = self.build_hir(sub)?;
        let start = frag.start;
        let accept = self.new_state();

        if greedy {
            // After first match: prefer looping (priority 0), exit (priority 1).
            self.add_epsilon(frag.accept, frag.start, 0); // loop
            self.add_epsilon(frag.accept, accept, 1); // exit
        } else {
            // Lazy: prefer exiting (priority 0), looping (priority 1).
            self.add_epsilon(frag.accept, accept, 0); // exit
            self.add_epsilon(frag.accept, frag.start, 1); // loop
        }

        Some(Fragment { start, accept })
    }

    /// `sub{n}` — exactly n repetitions.
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

    /// `sub{n,}` — at least n repetitions.
    fn build_at_least(&mut self, sub: &Hir, n: u32, greedy: bool) -> Option<Fragment> {
        // Build n required copies, then a star.
        let required = self.build_exact(sub, n)?;
        let star = self.build_star(sub, greedy)?;
        self.add_epsilon(required.accept, star.start, 0);
        Some(Fragment {
            start: required.start,
            accept: star.accept,
        })
    }

    /// `sub{n,m}` — between n and m repetitions.
    fn build_bounded(&mut self, sub: &Hir, n: u32, m: u32, greedy: bool) -> Option<Fragment> {
        if m < n {
            return None;
        }
        // Build n required copies.
        let required = self.build_exact(sub, n)?;

        if n == m {
            return Some(required);
        }

        // Build (m - n) optional copies.
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn literal_pattern() {
        let nfa = Nfa::from_pattern("abc").unwrap();
        // 4 states: start + one per byte + implicit accept at end.
        assert!(nfa.state_count() >= 4);
    }

    #[test]
    fn char_class_ascii() {
        let nfa = Nfa::from_pattern("[a-z]").unwrap();
        // 2 states: start → [a-z] → accept.
        assert!(nfa.state_count() >= 2);
        // Check that the transition from start has a ByteSet covering a-z.
        let start_trans = &nfa.states[nfa.start as usize].transitions;
        assert_eq!(start_trans.len(), 1);
        let (bs, _) = &start_trans[0];
        assert!(bs.contains(b'a'));
        assert!(bs.contains(b'z'));
        assert!(!bs.contains(b'A'));
    }

    #[test]
    fn char_class_unicode() {
        // Latin Extended-A: U+0100–U+017F (2-byte UTF-8 sequences).
        let nfa = Nfa::from_pattern(r"[\u{0100}-\u{017F}]").unwrap();
        // Should have intermediate states for UTF-8 byte sequences.
        assert!(nfa.state_count() >= 3);
    }

    #[test]
    fn alternation() {
        // regex-syntax may optimize `a|b|c` into `[abc]`, so use longer branches.
        let nfa = Nfa::from_pattern("cat|dog|fox").unwrap();
        // Should have enough states for 3 branches.
        assert!(nfa.state_count() >= 7); // at least 3×2 + shared states
    }

    #[test]
    fn star_greedy() {
        let nfa = Nfa::from_pattern("a*").unwrap();
        assert!(nfa.state_count() >= 3);
    }

    #[test]
    fn plus_lazy() {
        let nfa = Nfa::from_pattern("a+?").unwrap();
        assert!(nfa.state_count() >= 2);
    }

    #[test]
    fn bounded_repetition() {
        let nfa = Nfa::from_pattern("[0-9]{3,5}").unwrap();
        assert!(nfa.state_count() >= 4); // At least 3 required + optional states.
    }

    #[test]
    fn concat() {
        let nfa = Nfa::from_pattern("[a-z][0-9]").unwrap();
        assert!(nfa.state_count() >= 3);
    }

    #[test]
    fn empty_pattern() {
        let nfa = Nfa::from_pattern("").unwrap();
        assert_eq!(nfa.start, nfa.accept);
    }

    #[test]
    fn dot_all() {
        // With dotall + unicode, `.` matches all codepoints.
        // The NFA expands this into UTF-8 byte sequences.
        // Verify via DFA matching instead of inspecting NFA structure.
        let nfa = Nfa::from_pattern("(?s).").unwrap();
        // Should have states for UTF-8 multi-byte paths.
        assert!(nfa.state_count() >= 2);
    }

    #[test]
    fn unicode_property() {
        // \p{L} — Unicode letter.
        let nfa = Nfa::from_pattern(r"\p{L}");
        // Should succeed (builds UTF-8 automata for all Unicode letters).
        assert!(nfa.is_some());
        let nfa = nfa.unwrap();
        // Should have many states due to UTF-8 expansion.
        assert!(nfa.state_count() > 10);
    }

    #[test]
    fn transition_byte_sets() {
        let nfa = Nfa::from_pattern("[a-z]+").unwrap();
        let sets = nfa.transition_byte_sets();
        assert!(!sets.is_empty());
        // At least one set covering a-z.
        assert!(sets.iter().any(|bs| bs.contains(b'a') && bs.contains(b'z')));
    }

    #[test]
    fn backreference_unsupported() {
        // Backreferences are not regular — should return None.
        // regex-syntax doesn't parse backreferences in default mode,
        // so this would be a parse error (returning None).
        let result = Nfa::from_pattern(r"(a)\1");
        assert!(result.is_none());
    }
}
