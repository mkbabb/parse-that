//! DFA construction via subset (powerset) construction + Hopcroft minimization.
//!
//! Converts an NFA to a DFA by computing the ε-closure of NFA state sets,
//! then minimizes via Hopcroft's algorithm. The resulting DFA operates on
//! byte equivalence classes rather than raw bytes, reducing table size.

use std::collections::{BTreeSet, HashMap};

use super::nfa::{DEAD, Nfa, StateId};
use crate::sets::equiv::compute_byte_classes;

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
    /// Whether to enable Unicode mode in regex parsing.
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
        let parse_opts = crate::hir::ParseOptions {
            unicode: opts.unicode,
        };
        let hir = crate::parse_with(pattern, &parse_opts).ok()?;
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

    /// Anchored shortest (non-greedy) match at the given byte offset.
    /// Returns the end position of the first (shortest) match, or `None`.
    pub fn find_at_shortest(&self, bytes: &[u8], offset: usize) -> Option<usize> {
        let num_cls = self.num_classes as usize;
        let flat = &self.flat_transitions;
        let states = &self.states;
        let mut state: u32 = 0;
        let mut pos = offset;

        // If the start state is accepting, that's the shortest match (empty).
        if states[0].is_accept {
            return Some(pos);
        }

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
                return Some(pos); // first accept = shortest match
            }
        }

        None
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
        let Some(rep) = block_rep[block] else {
            continue;
        };
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
