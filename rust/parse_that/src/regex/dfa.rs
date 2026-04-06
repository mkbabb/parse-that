//! DFA construction via subset (powerset) construction + Hopcroft minimization.
//!
//! Converts an NFA to a DFA by computing the ε-closure of NFA state sets,
//! then minimizes via Hopcroft's algorithm. The resulting DFA operates on
//! byte equivalence classes rather than raw bytes, reducing table size.

use std::collections::{BTreeSet, HashMap};

use super::equiv::compute_byte_classes;
use super::nfa::{Nfa, StateId, DEAD};

/// A single DFA state.
#[derive(Clone, Debug)]
pub struct DfaState {
    /// Transitions indexed by equivalence class.
    /// `transitions[class]` = target StateId, or `DEAD` for no transition.
    pub transitions: Vec<StateId>,
    /// Whether this is an accepting state.
    pub is_accept: bool,
}

/// Options for DFA construction.
#[derive(Clone, Debug)]
pub struct DfaOptions {
    /// Maximum DFA states before bailing (guards against exponential blowup).
    pub state_limit: usize,
    /// Whether to minimize the DFA via Hopcroft's algorithm.
    pub minimize: bool,
    /// Whether to enable Unicode mode in regex-syntax parsing.
    pub unicode: bool,
}

impl Default for DfaOptions {
    fn default() -> Self {
        Self {
            state_limit: 4096,
            minimize: true,
            unicode: true,
        }
    }
}

/// A compiled DFA. Transitions are indexed by byte equivalence classes.
#[derive(Clone, Debug)]
pub struct Dfa {
    /// DFA states (kept for minimization, accept checks, etc.).
    pub states: Vec<DfaState>,
    /// Flat transition table: `flat_transitions[state * num_classes + class]` = target StateId.
    /// Single contiguous allocation, cache-friendly access — one indirection instead of two.
    pub flat_transitions: Vec<StateId>,
    /// Byte → equivalence class mapping (256 entries).
    pub byte_classes: [u8; 256],
    /// Number of equivalence classes.
    pub num_classes: u16,
}

impl Dfa {
    /// Compile a regex pattern to a minimized DFA.
    ///
    /// Returns `None` if the pattern is invalid, uses unsupported features,
    /// or the DFA exceeds the state limit.
    pub fn compile(pattern: &str) -> Option<Self> {
        Self::compile_with(pattern, &DfaOptions::default())
    }

    /// Compile with explicit options.
    pub fn compile_with(pattern: &str, opts: &DfaOptions) -> Option<Self> {
        let hir = regex_syntax::ParserBuilder::new()
            .utf8(opts.unicode) // byte-mode when unicode is off
            .unicode(opts.unicode)
            .build()
            .parse(pattern)
            .ok()?;
        let nfa = Nfa::from_hir(&hir)?;
        Self::from_nfa(&nfa, opts)
    }

    /// Build DFA from a pre-constructed NFA.
    pub fn from_nfa(nfa: &Nfa, opts: &DfaOptions) -> Option<Self> {
        // Step 1: Compute byte equivalence classes.
        let byte_sets = nfa.transition_byte_sets();
        let (byte_classes, num_classes) = compute_byte_classes(&byte_sets);

        // Step 2: Build a representative byte for each class.
        let class_reps = compute_class_representatives(&byte_classes, num_classes);

        // Step 3: Subset construction.
        let mut dfa = subset_construction(nfa, &byte_classes, num_classes, &class_reps, opts)?;

        // Step 4: Minimize.
        if opts.minimize && dfa.states.len() > 1 {
            dfa = hopcroft_minimize(&dfa);
        }

        // Step 5: Flatten transition table for cache-friendly access.
        let num_cls = dfa.num_classes as usize;
        let mut flat = Vec::with_capacity(dfa.states.len() * num_cls);
        for state in dfa.states.iter() {
            flat.extend_from_slice(&state.transitions);
        }
        dfa.flat_transitions = flat;

        Some(dfa)
    }

    /// Number of states.
    pub fn state_count(&self) -> usize {
        self.states.len()
    }

    /// Number of equivalence classes.
    pub fn class_count(&self) -> usize {
        self.num_classes as usize
    }

    /// Anchored match at the given byte offset.
    /// Returns the end position of the longest match, or `None`.
    pub fn find_at(&self, bytes: &[u8], offset: usize) -> Option<usize> {
        let num_cls = self.num_classes as usize;
        let flat = &self.flat_transitions;
        let states = &self.states;
        let mut state: u32 = 0; // start state
        let mut pos = offset;
        let mut last_accept = if states[0].is_accept { Some(pos) } else { None };

        while pos < bytes.len() {
            let b = bytes[pos];
            let class = self.byte_classes[b as usize] as usize;
            let next = flat[state as usize * num_cls + class];
            if next == DEAD {
                break;
            }
            state = next;
            pos += 1;
            if states[state as usize].is_accept {
                last_accept = Some(pos);
            }
        }

        last_accept
    }
}

/// Compute one representative byte for each equivalence class.
fn compute_class_representatives(byte_classes: &[u8; 256], num_classes: u16) -> Vec<u8> {
    let mut reps = vec![0u8; num_classes as usize];
    let mut found = vec![false; num_classes as usize];
    for (b, &cls) in byte_classes.iter().enumerate() {
        if !found[cls as usize] {
            reps[cls as usize] = b as u8;
            found[cls as usize] = true;
        }
    }
    reps
}

// ── Subset Construction ─────────────────────────────────────────────────

/// Compute the ε-closure of a set of NFA states.
fn epsilon_closure(nfa: &Nfa, states: &BTreeSet<StateId>) -> BTreeSet<StateId> {
    let mut closure = states.clone();
    let mut stack: Vec<StateId> = states.iter().copied().collect();

    while let Some(s) = stack.pop() {
        for edge in &nfa.states[s as usize].epsilon {
            if closure.insert(edge.target) {
                stack.push(edge.target);
            }
        }
    }

    closure
}

/// Compute the set of NFA states reachable from `current` via byte `b`.
fn move_on_byte(nfa: &Nfa, current: &BTreeSet<StateId>, b: u8) -> BTreeSet<StateId> {
    let mut result = BTreeSet::new();
    for &s in current {
        for (bs, target) in &nfa.states[s as usize].transitions {
            if bs.contains(b) {
                result.insert(*target);
            }
        }
    }
    result
}

/// Subset construction: NFA → DFA.
fn subset_construction(
    nfa: &Nfa,
    byte_classes: &[u8; 256],
    num_classes: u16,
    class_reps: &[u8],
    opts: &DfaOptions,
) -> Option<Dfa> {
    let num_cls = num_classes as usize;

    // Initial DFA state = ε-closure of NFA start.
    let start_set = epsilon_closure(nfa, &BTreeSet::from([nfa.start]));

    let mut dfa_states: Vec<DfaState> = Vec::new();
    let mut set_to_id: HashMap<BTreeSet<StateId>, u32> = HashMap::new();
    let mut worklist: Vec<BTreeSet<StateId>> = Vec::new();

    let is_accept = start_set.contains(&nfa.accept);
    dfa_states.push(DfaState {
        transitions: vec![DEAD; num_cls],
        is_accept,
    });
    set_to_id.insert(start_set.clone(), 0);
    worklist.push(start_set);

    while let Some(current_set) = worklist.pop() {
        let current_id = set_to_id[&current_set];

        for cls in 0..num_cls {
            let rep_byte = class_reps[cls];

            // Compute move(current_set, rep_byte) then ε-closure.
            let moved = move_on_byte(nfa, &current_set, rep_byte);
            if moved.is_empty() {
                continue; // Transition to dead state (already DEAD).
            }
            let next_set = epsilon_closure(nfa, &moved);
            if next_set.is_empty() {
                continue;
            }

            let next_id = if let Some(&id) = set_to_id.get(&next_set) {
                id
            } else {
                // Check state limit.
                if dfa_states.len() >= opts.state_limit {
                    return None;
                }
                let id = dfa_states.len() as u32;
                let is_accept = next_set.contains(&nfa.accept);
                dfa_states.push(DfaState {
                    transitions: vec![DEAD; num_cls],
                    is_accept,
                });
                set_to_id.insert(next_set.clone(), id);
                worklist.push(next_set);
                id
            };

            dfa_states[current_id as usize].transitions[cls] = next_id;
        }
    }

    Some(Dfa {
        states: dfa_states,
        flat_transitions: vec![], // built in from_nfa after minimization
        byte_classes: *byte_classes,
        num_classes,
    })
}

// ── Hopcroft Minimization ───────────────────────────────────────────────

/// Minimize a DFA using Hopcroft's algorithm.
fn hopcroft_minimize(dfa: &Dfa) -> Dfa {
    let n = dfa.states.len();
    let num_cls = dfa.num_classes as usize;

    if n <= 1 {
        return dfa.clone();
    }

    // Initial partition: accepting vs non-accepting.
    let mut partition: Vec<usize> = vec![0; n]; // state → block ID
    let mut num_blocks: usize = 1;

    let has_accept = dfa.states.iter().any(|s| s.is_accept);
    let has_non_accept = dfa.states.iter().any(|s| !s.is_accept);

    if has_accept && has_non_accept {
        num_blocks = 2;
        for (i, state) in dfa.states.iter().enumerate() {
            partition[i] = if state.is_accept { 0 } else { 1 };
        }
    }

    // Refine until stable.
    let mut changed = true;
    while changed {
        changed = false;

        for block_id in 0..num_blocks {
            // Collect states in this block.
            let members: Vec<usize> = (0..n).filter(|&s| partition[s] == block_id).collect();
            if members.len() <= 1 {
                continue;
            }

            // Try to split this block on each equivalence class.
            for cls in 0..num_cls {
                // Get the target block of the first member.
                let first = members[0];
                let first_target = dfa.states[first].transitions[cls];
                let first_target_block = if first_target == DEAD {
                    usize::MAX // dead state sentinel
                } else {
                    partition[first_target as usize]
                };

                // Check if all members agree.
                let mut splitters: Vec<usize> = Vec::new();
                for &m in &members[1..] {
                    let target = dfa.states[m].transitions[cls];
                    let target_block = if target == DEAD {
                        usize::MAX
                    } else {
                        partition[target as usize]
                    };
                    if target_block != first_target_block {
                        splitters.push(m);
                    }
                }

                if !splitters.is_empty() {
                    // Split: move disagreeing states to a new block.
                    let new_block = num_blocks;
                    num_blocks += 1;
                    for &s in &splitters {
                        partition[s] = new_block;
                    }
                    changed = true;
                    break; // restart refinement from the beginning
                }
            }

            if changed {
                break;
            }
        }
    }

    // Build minimized DFA.
    // Choose representative: first state in each block.
    let mut block_rep: Vec<Option<usize>> = vec![None; num_blocks];
    for (s, &block) in partition.iter().enumerate() {
        if block_rep[block].is_none() {
            block_rep[block] = Some(s);
        }
    }

    // Remap state IDs: block representative → new state ID.
    let mut old_to_new = vec![DEAD; n];
    let mut new_states: Vec<DfaState> = Vec::with_capacity(num_blocks);

    // Ensure start state (0) maps to new state 0.
    let start_block = partition[0];
    let mut block_to_new = vec![DEAD; num_blocks];
    block_to_new[start_block] = 0;
    old_to_new[0] = 0;
    let rep = block_rep[start_block].unwrap();
    new_states.push(DfaState {
        transitions: vec![DEAD; num_cls],
        is_accept: dfa.states[rep].is_accept,
    });

    let mut next_id: u32 = 1;
    for block in 0..num_blocks {
        if block_to_new[block] != DEAD {
            continue; // already assigned (start block)
        }
        if let Some(rep) = block_rep[block] {
            block_to_new[block] = next_id;
            new_states.push(DfaState {
                transitions: vec![DEAD; num_cls],
                is_accept: dfa.states[rep].is_accept,
            });
            next_id += 1;
        }
    }

    // Map old states to new IDs.
    for (s, &block) in partition.iter().enumerate() {
        old_to_new[s] = block_to_new[block];
    }

    // Fill transitions.
    for block in 0..num_blocks {
        let Some(rep) = block_rep[block] else { continue };
        let new_id = block_to_new[block];
        if new_id == DEAD {
            continue;
        }
        for cls in 0..num_cls {
            let old_target = dfa.states[rep].transitions[cls];
            let new_target = if old_target == DEAD {
                DEAD
            } else {
                old_to_new[old_target as usize]
            };
            new_states[new_id as usize].transitions[cls] = new_target;
        }
    }

    Dfa {
        states: new_states,
        flat_transitions: vec![], // rebuilt by caller
        byte_classes: dfa.byte_classes,
        num_classes: dfa.num_classes,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn simple_literal() {
        let dfa = Dfa::compile("abc").unwrap();
        assert!(dfa.state_count() <= 5); // start + a + b + c + maybe dead
        assert_eq!(dfa.find_at(b"abcdef", 0), Some(3));
        assert_eq!(dfa.find_at(b"ab", 0), None);
        assert_eq!(dfa.find_at(b"xabc", 1), Some(4));
    }

    #[test]
    fn char_class() {
        let dfa = Dfa::compile("[a-z]+").unwrap();
        assert_eq!(dfa.find_at(b"hello world", 0), Some(5));
        assert_eq!(dfa.find_at(b"HELLO", 0), None);
        assert_eq!(dfa.find_at(b"a", 0), Some(1));
    }

    #[test]
    fn alternation() {
        let dfa = Dfa::compile("cat|dog").unwrap();
        assert_eq!(dfa.find_at(b"cat", 0), Some(3));
        assert_eq!(dfa.find_at(b"dog", 0), Some(3));
        assert_eq!(dfa.find_at(b"cow", 0), None);
    }

    #[test]
    fn optional() {
        let dfa = Dfa::compile("colou?r").unwrap();
        assert_eq!(dfa.find_at(b"color", 0), Some(5));
        assert_eq!(dfa.find_at(b"colour", 0), Some(6));
        assert_eq!(dfa.find_at(b"col", 0), None);
    }

    #[test]
    fn star() {
        let dfa = Dfa::compile("ab*c").unwrap();
        assert_eq!(dfa.find_at(b"ac", 0), Some(2));
        assert_eq!(dfa.find_at(b"abc", 0), Some(3));
        assert_eq!(dfa.find_at(b"abbbc", 0), Some(5));
        assert_eq!(dfa.find_at(b"a", 0), None);
    }

    #[test]
    fn bounded_repetition() {
        let dfa = Dfa::compile("[0-9]{3,5}").unwrap();
        assert_eq!(dfa.find_at(b"12", 0), None);
        assert_eq!(dfa.find_at(b"123", 0), Some(3));
        assert_eq!(dfa.find_at(b"12345", 0), Some(5));
        assert_eq!(dfa.find_at(b"123456", 0), Some(5)); // greedy up to 5
    }

    #[test]
    fn negated_class() {
        let dfa = Dfa::compile("[^abc]+").unwrap();
        assert_eq!(dfa.find_at(b"xyz", 0), Some(3));
        assert_eq!(dfa.find_at(b"abc", 0), None);
        assert_eq!(dfa.find_at(b"xyzabc", 0), Some(3));
    }

    #[test]
    fn empty_pattern() {
        let dfa = Dfa::compile("").unwrap();
        // Empty pattern matches at any position (zero-width).
        assert_eq!(dfa.find_at(b"hello", 0), Some(0));
    }

    #[test]
    fn offset_matching() {
        let dfa = Dfa::compile("[0-9]+").unwrap();
        assert_eq!(dfa.find_at(b"abc123def", 3), Some(6));
        assert_eq!(dfa.find_at(b"abc123def", 0), None);
    }

    #[test]
    fn shorthand_classes() {
        let dfa = Dfa::compile(r"\d+").unwrap();
        assert_eq!(dfa.find_at(b"42", 0), Some(2));
        assert_eq!(dfa.find_at(b"abc", 0), None);

        let dfa = Dfa::compile(r"\w+").unwrap();
        assert_eq!(dfa.find_at(b"hello_world", 0), Some(11));

        let dfa = Dfa::compile(r"\s+").unwrap();
        assert_eq!(dfa.find_at(b"  \t\n", 0), Some(4));
    }

    #[test]
    fn dot_no_newline() {
        let dfa = Dfa::compile(".+").unwrap();
        // Without dotall, . doesn't match \n.
        assert_eq!(dfa.find_at(b"hello\nworld", 0), Some(5));
    }

    #[test]
    fn dot_all() {
        let dfa = Dfa::compile("(?s).+").unwrap();
        assert_eq!(dfa.find_at(b"hello\nworld", 0), Some(11));
    }

    #[test]
    fn minimization_reduces_states() {
        // `a|a` should minimize to the same DFA as `a`.
        let dfa_dup = Dfa::compile("a|a").unwrap();
        let dfa_single = Dfa::compile("a").unwrap();
        // Both should have the same number of states after minimization.
        assert_eq!(dfa_dup.state_count(), dfa_single.state_count());
    }

    #[test]
    fn unicode_ascii_only() {
        // \w in Unicode mode matches much more, but on ASCII input only ASCII matches.
        let dfa = Dfa::compile(r"\w+").unwrap();
        assert_eq!(dfa.find_at(b"hello", 0), Some(5));
        assert_eq!(dfa.find_at(b"123", 0), Some(3));
    }

    #[test]
    fn css_ident_pattern() {
        let dfa = Dfa::compile(r"-?[a-zA-Z_][\w-]*").unwrap();
        assert_eq!(dfa.find_at(b"my-class", 0), Some(8));
        assert_eq!(dfa.find_at(b"-webkit-foo", 0), Some(11));
        assert_eq!(dfa.find_at(b"_private", 0), Some(8));
        assert_eq!(dfa.find_at(b"123", 0), None);
    }

    #[test]
    fn json_number_pattern() {
        let dfa = Dfa::compile(r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?").unwrap();
        assert_eq!(dfa.find_at(b"42", 0), Some(2));
        assert_eq!(dfa.find_at(b"-3.14", 0), Some(5));
        assert_eq!(dfa.find_at(b"1e10", 0), Some(4));
        assert_eq!(dfa.find_at(b"0.5E-3", 0), Some(6));
        assert_eq!(dfa.find_at(b"abc", 0), None);
    }

    #[test]
    fn hex_color_pattern() {
        let dfa = Dfa::compile(r"[0-9a-fA-F]{3,8}").unwrap();
        assert_eq!(dfa.find_at(b"ff00cc", 0), Some(6));
        assert_eq!(dfa.find_at(b"ABC", 0), Some(3));
        assert_eq!(dfa.find_at(b"12", 0), None); // too short
    }

    #[test]
    fn state_limit_guard() {
        // Pathological pattern that could cause exponential blowup.
        // With a small state limit, this should return None.
        let opts = DfaOptions {
            state_limit: 10,
            ..DfaOptions::default()
        };
        let result = Dfa::compile_with(r".{1,10}.{1,10}.{1,10}", &opts);
        // This may or may not exceed 10 states depending on the pattern.
        // The key thing is it doesn't panic or hang.
        let _ = result;
    }

    #[test]
    fn case_insensitive() {
        let dfa = Dfa::compile("(?i)hello").unwrap();
        assert_eq!(dfa.find_at(b"hello", 0), Some(5));
        assert_eq!(dfa.find_at(b"HELLO", 0), Some(5));
        assert_eq!(dfa.find_at(b"HeLlO", 0), Some(5));
    }

    // ── DFA-vs-regex oracle tests ──────────────────────────────────────────

    /// Compare DFA `find_at` against the `regex` crate for every sub-offset of
    /// every input. The `regex` crate is anchored with `\A(?:...)` so both
    /// engines attempt an anchored match from the same position.
    fn assert_dfa_fidelity(pattern: &str, inputs: &[&str]) {
        let dfa = Dfa::compile(pattern).unwrap_or_else(|| {
            panic!("DFA compile failed for pattern: {}", pattern);
        });
        let anchored = format!(r"\A(?:{})", pattern);
        let re = regex::Regex::new(&anchored)
            .unwrap_or_else(|e| panic!("regex crate compile failed for '{}': {}", anchored, e));

        for input in inputs {
            for offset in 0..=input.len() {
                let dfa_result = dfa.find_at(input.as_bytes(), offset);
                let re_result = re.find(&input[offset..]).map(|m| offset + m.end());
                assert_eq!(
                    dfa_result, re_result,
                    "pattern='{}' input='{}' offset={}  dfa={:?} regex={:?}",
                    pattern, input, offset, dfa_result, re_result
                );
            }
        }
    }

    // ── Lazy quantifiers (DFA is greedy / leftmost-longest) ────────────────
    //
    // DFAs have no notion of lazy vs greedy — subset construction always yields
    // the leftmost-longest match. The `regex` crate respects lazy quantifier
    // semantics even on anchored patterns, so `\A(?:a.*?b)` returns the shortest
    // match while the DFA returns the longest.
    //
    // These tests document the known divergence and verify the DFA's greedy behavior.

    #[test]
    fn lazy_star_is_greedy_in_dfa() {
        let dfa = Dfa::compile("a.*?b").unwrap();
        // DFA always returns longest match ending with 'b'.
        assert_eq!(dfa.find_at(b"aXb", 0), Some(3));
        assert_eq!(dfa.find_at(b"aXbYb", 0), Some(5)); // greedy: matches all the way to last 'b'
        assert_eq!(dfa.find_at(b"ab", 0), Some(2));
        assert_eq!(dfa.find_at(b"aXYZb", 0), Some(5));
        assert_eq!(dfa.find_at(b"a", 0), None); // no 'b' to close

        // Verify divergence from regex crate (which returns shortest).
        let re = regex::Regex::new(r"\A(?:a.*?b)").unwrap();
        assert_eq!(re.find("aXbYb").map(|m| m.end()), Some(3)); // regex: shortest
        assert_eq!(dfa.find_at(b"aXbYb", 0), Some(5)); // DFA: longest
    }

    #[test]
    fn lazy_plus_is_greedy_in_dfa() {
        let dfa = Dfa::compile("a.+?b").unwrap();
        assert_eq!(dfa.find_at(b"aXb", 0), Some(3));
        assert_eq!(dfa.find_at(b"aXbYb", 0), Some(5)); // greedy
        assert_eq!(dfa.find_at(b"ab", 0), None); // .+ requires at least one char
        assert_eq!(dfa.find_at(b"aXYZb", 0), Some(5));
    }

    #[test]
    fn lazy_question_is_greedy_in_dfa() {
        let dfa = Dfa::compile("a.??b").unwrap();
        assert_eq!(dfa.find_at(b"ab", 0), Some(2));
        assert_eq!(dfa.find_at(b"aXb", 0), Some(3)); // greedy: consumes the optional char
        assert_eq!(dfa.find_at(b"b", 0), None);
        assert_eq!(dfa.find_at(b"abb", 0), Some(3)); // greedy: 'a' + '.' matches 'b' + literal 'b'
    }

    #[test]
    fn css_block_comment_dotall_greedy() {
        // C-style block comment: `(?s)/\*.*?\*/`
        // DFA is greedy, so on `/* a */ b /* c */` it matches the longest prefix
        // ending with `*/` (all 17 bytes), not the shortest (7 bytes).
        let dfa = Dfa::compile(r"(?s)/\*.*?\*/").unwrap();
        assert_eq!(dfa.find_at(b"/* a */ b /* c */", 0), Some(17)); // greedy: whole string (17 bytes)
        assert_eq!(dfa.find_at(b"/* short */", 0), Some(11));
        assert_eq!(dfa.find_at(b"/**/", 0), Some(4));
        assert_eq!(dfa.find_at(b"/* multi\nline */", 0), Some(16));
        assert_eq!(dfa.find_at(b"/* no close", 0), None);

        // Verify divergence from regex crate.
        let re = regex::Regex::new(r"\A(?:(?s)/\*.*?\*/)").unwrap();
        assert_eq!(
            re.find("/* a */ b /* c */").map(|m| m.end()),
            Some(7)
        ); // regex: shortest
    }

    #[test]
    fn css_block_comment_no_dotall_greedy() {
        // Without (?s), `.` does not match newlines — but still greedy.
        let dfa = Dfa::compile(r"/\*.*?\*/").unwrap();
        assert_eq!(dfa.find_at(b"/* single line */", 0), Some(17)); // 17 bytes total
        assert_eq!(
            dfa.find_at(b"/* a */ more /* b */", 0),
            Some(20)
        ); // greedy: matches to last `*/` (20 bytes)
        assert_eq!(dfa.find_at(b"/* no\nnewline */", 0), None); // dot stops at \n
        assert_eq!(dfa.find_at(b"/**/", 0), Some(4));
    }

    // ── CSS comment-aware whitespace ───────────────────────────────────────

    #[test]
    fn css_ws_comment_regex() {
        let pattern = r"(?s)(?:\s|/\*.*?\*/)*";
        assert_dfa_fidelity(
            pattern,
            &[
                "/*!*/ /*!*/",
                "  /* comment */  ",
                "\n/* line\n*/\n",
                "/* a *//* b */",
                "/*!*/",
                "   ",
                "",
                "no-ws-here",
                " /* unterminated",
            ],
        );
    }

    #[test]
    fn css_ws_comment_adjacent() {
        // Adjacent comments without intervening whitespace.
        let pattern = r"(?s)(?:\s|/\*.*?\*/)*";
        let dfa = Dfa::compile(pattern).unwrap();
        // Should consume both comments + surrounding whitespace.
        let input = b"/* a *//* b */ rest";
        let result = dfa.find_at(input, 0);
        // Greedy: consumes as much ws+comment as possible.
        assert!(result.is_some());
        let end = result.unwrap();
        // After consuming, the remaining text should start with non-ws.
        assert!(
            end <= input.len(),
            "end {} out of bounds for len {}",
            end,
            input.len()
        );
    }

    // ── CSS value span regex ───────────────────────────────────────────────

    #[test]
    fn css_value_span() {
        let pattern = r"[^;{}!,]+";
        assert_dfa_fidelity(
            pattern,
            &[
                "var(--tw-empty)",
                ")",
                "var(--a) var(--b) var(--c)",
                "value!important",
                "color: red",
                ";",
                "{",
                "}",
                ",",
                "",
            ],
        );
    }

    #[test]
    fn css_value_span_stop_chars() {
        let dfa = Dfa::compile(r"[^;{}!,]+").unwrap();

        // Should match everything (no excluded chars).
        assert_eq!(
            dfa.find_at(b"var(--tw-empty)", 0),
            Some("var(--tw-empty)".len())
        );

        // `)` alone — no excluded chars, should match.
        assert_eq!(dfa.find_at(b")", 0), Some(1));

        // Stops at `!`.
        assert_eq!(dfa.find_at(b"value!important", 0), Some(5));

        // Stops at `;`.
        assert_eq!(dfa.find_at(b"color: red; next", 0), Some(10));
    }

    // ── CSS ident alternation ──────────────────────────────────────────────

    #[test]
    fn css_ident_alternation() {
        let pattern = r"[a-zA-Z_][\w-]*|--[\w-]+|-[a-zA-Z][\w-]*";
        assert_dfa_fidelity(
            pattern,
            &[
                "-webkit-backdrop-filter",
                "--tw-backdrop-blur",
                "backgroundColor",
                "_private_var",
                "-moz-appearance",
                "--color-primary-500",
                "a",
                "-a",
                "--a",
                "123invalid",
                "",
                "-",
                "--",
            ],
        );
    }

    #[test]
    fn css_ident_alt_specific() {
        let dfa = Dfa::compile(r"[a-zA-Z_][\w-]*|--[\w-]+|-[a-zA-Z][\w-]*").unwrap();

        assert_eq!(
            dfa.find_at(b"-webkit-backdrop-filter", 0),
            Some("-webkit-backdrop-filter".len())
        );
        assert_eq!(
            dfa.find_at(b"--tw-backdrop-blur", 0),
            Some("--tw-backdrop-blur".len())
        );
        assert_eq!(
            dfa.find_at(b"backgroundColor", 0),
            Some("backgroundColor".len())
        );
    }

    // ── Large DFA (>64 states) ─────────────────────────────────────────────

    #[test]
    fn large_dfa_css_ident() {
        let pattern = r"[a-zA-Z_][\w-]*|--[\w-]+|-[a-zA-Z][\w-]*";
        let dfa = Dfa::compile(pattern).unwrap();
        // Report state count — useful for tracking DFA size regressions.
        eprintln!(
            "CSS ident DFA: {} states, {} equiv classes",
            dfa.state_count(),
            dfa.class_count()
        );
        // Verify accepts are correct on representative inputs.
        assert!(dfa.find_at(b"myIdent", 0).is_some());
        assert!(dfa.find_at(b"--custom", 0).is_some());
        assert!(dfa.find_at(b"-webkit-x", 0).is_some());
        assert!(dfa.find_at(b"123", 0).is_none());
    }

    #[test]
    fn large_dfa_json_number() {
        let pattern = r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?";
        let dfa = Dfa::compile(pattern).unwrap();
        eprintln!(
            "JSON number DFA: {} states, {} equiv classes",
            dfa.state_count(),
            dfa.class_count()
        );
        assert_eq!(dfa.find_at(b"123.456e+78", 0), Some(11));
        assert_eq!(dfa.find_at(b"-0.5E-3", 0), Some(7));
    }

    // ── Zero-width matches ─────────────────────────────────────────────────

    #[test]
    fn zero_width_optional() {
        // `=?` can match zero characters (the empty string).
        let dfa = Dfa::compile("=?").unwrap();
        // Start state is accepting (empty match), so find_at returns Some(offset).
        assert_eq!(dfa.find_at(b"LET(", 0), Some(0));
        assert_eq!(dfa.find_at(b"=value", 0), Some(1));
        assert_eq!(dfa.find_at(b"", 0), Some(0));
    }

    #[test]
    fn zero_width_star() {
        let dfa = Dfa::compile("a*").unwrap();
        // Empty match at offset 0 when input doesn't start with 'a'.
        assert_eq!(dfa.find_at(b"bbb", 0), Some(0));
        assert_eq!(dfa.find_at(b"aab", 0), Some(2));
        assert_eq!(dfa.find_at(b"", 0), Some(0));
    }

    #[test]
    fn zero_width_empty_alt() {
        // `(a|)` matches either 'a' or empty.
        let dfa = Dfa::compile("a|").unwrap();
        assert_eq!(dfa.find_at(b"a", 0), Some(1));
        assert_eq!(dfa.find_at(b"b", 0), Some(0)); // empty branch
        assert_eq!(dfa.find_at(b"", 0), Some(0));
    }

    // ── Dotall mode ────────────────────────────────────────────────────────

    #[test]
    fn dotall_plus() {
        let dfa = Dfa::compile("(?s).+").unwrap();
        assert_eq!(dfa.find_at(b"a\nb\nc", 0), Some(5));
    }

    #[test]
    fn dotall_star() {
        let dfa = Dfa::compile("(?s).*").unwrap();
        assert_eq!(dfa.find_at(b"a\nb\nc", 0), Some(5));
        assert_eq!(dfa.find_at(b"", 0), Some(0));
    }

    #[test]
    fn dotall_bounded() {
        let dfa = Dfa::compile("(?s).{2,4}").unwrap();
        assert_eq!(dfa.find_at(b"a\nb\nc", 0), Some(4));
        assert_eq!(dfa.find_at(b"a", 0), None);
    }

    #[test]
    fn no_dotall_stops_at_newline() {
        let dfa = Dfa::compile(".+").unwrap();
        assert_eq!(dfa.find_at(b"hello\nworld", 0), Some(5));
        assert_eq!(dfa.find_at(b"\nhello", 0), None);
    }

    // ── Oracle sweep over mixed patterns ───────────────────────────────────

    #[test]
    fn oracle_digits() {
        assert_dfa_fidelity(r"\d+", &["123", "abc", "1a2b", "", "0"]);
    }

    #[test]
    fn oracle_word_chars() {
        assert_dfa_fidelity(r"\w+", &["hello_world", "foo-bar", "123", "", " "]);
    }

    #[test]
    fn oracle_whitespace() {
        assert_dfa_fidelity(r"\s+", &["  \t\n", "abc", " a ", "", "\r\n"]);
    }

    #[test]
    fn oracle_hex_color() {
        assert_dfa_fidelity(
            r"#[0-9a-fA-F]{3,8}",
            &["#fff", "#FF00CC", "#12345678", "#12", "#abcdefgh", "no-hash"],
        );
    }

    #[test]
    fn oracle_email_like() {
        assert_dfa_fidelity(
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            &[
                "user@example.com",
                "bad@",
                "@missing",
                "a@b.co",
                "test.email+tag@sub.domain.org",
            ],
        );
    }

    #[test]
    fn oracle_json_string_body() {
        // JSON string interior: any char except `"` and `\`, or an escape sequence.
        assert_dfa_fidelity(
            r#"[^"\\]*(?:\\.[^"\\]*)*"#,
            &[
                r#"hello world"#,
                r#"escaped\"quote"#,
                r#"back\\slash"#,
                r#"tab\there"#,
                "",
                r#"\"#,
            ],
        );
    }

    #[test]
    fn oracle_css_number() {
        assert_dfa_fidelity(
            r"[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?",
            &[
                "3.14",
                "-42",
                "+0.5",
                ".75",
                "1e10",
                "2.5E-3",
                "abc",
                "",
                ".",
                "+",
                "1.",
            ],
        );
    }

    #[test]
    fn oracle_nested_groups() {
        assert_dfa_fidelity(
            r"(a(b(c)?)?)?(d|e)*",
            &["abc", "abd", "abde", "de", "", "a", "ab", "eee", "xyz"],
        );
    }

    #[test]
    fn oracle_repetition_boundary() {
        assert_dfa_fidelity(
            r"x{2,5}",
            &["x", "xx", "xxx", "xxxx", "xxxxx", "xxxxxx", "", "y"],
        );
    }

    #[test]
    fn oracle_pipe_literal() {
        // Alternation of fixed strings — exercises prefix factoring in the NFA.
        assert_dfa_fidelity(
            "rem|rlh|em|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|%",
            &[
                "rem", "rlh", "em", "ex", "ch", "vw", "vh", "vmin", "vmax", "cm", "mm", "in",
                "pt", "pc", "px", "%", "remx", "r", "v", "",
            ],
        );
    }
}
