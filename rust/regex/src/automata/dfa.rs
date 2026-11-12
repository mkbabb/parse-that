//! The DFA: regex-automata's anchored dense DFA, read into this crate's table.
//!
//! The determinizer and minimizer are `regex-automata`'s (OR-7 Route A): the
//! `Hir` is lowered node for node (`super::lower`), compiled by its Thompson
//! compiler into an NFA, and determinized into a dense DFA with
//! `MatchKind::LeftmostFirst`, anchored starts and minimization. That DFA is
//! then read, state by state, into the flat table this crate's consumers
//! walk, with two changes of form and none of meaning:
//!
//! - **Match timing.** regex-automata reports a match one transition late
//!   (a match state means a match ended *before* the byte just read). The
//!   table here marks acceptance at the position itself: a state accepts
//!   when a match ends where the walk stands. Where that depends on what
//!   follows (`$`, `\b`), the state carries the condition per byte class and
//!   at the end of the input ([`AcceptWhen`]).
//! - **Start states.** One start per look-behind context (none, `\n`, `\r`,
//!   a word byte, a non-word byte); state 0 is the start with no look-behind.
//!
//! States from which no acceptance is reachable are folded into `DEAD`.
//! The walk ([`Dfa::find_at`]) returns the end of the last acceptance before
//! the walk dies, which on this automaton is the leftmost-first match.

use std::collections::VecDeque;

use regex_automata::dfa::{Automaton, StartKind, dense};
use regex_automata::nfa::thompson;
use regex_automata::util::primitives::StateID as RaStateId;
use regex_automata::util::start;
use regex_automata::{Anchored, MatchKind};

use super::lower::{LowerError, lower};
use super::nfa::{DEAD, StateId};
use crate::hir::Hir;

/// Acceptance that depends on what follows the position (a look condition).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AcceptWhen {
    /// `classes[c]`: a match ends here when the next byte is in class `c`.
    pub classes: Vec<bool>,
    /// A match ends here when the position is the end of the input.
    pub eoi: bool,
}

/// A single DFA state.
#[derive(Clone, Debug)]
pub struct DfaState {
    /// Transitions indexed by equivalence class.
    /// `transitions[class]` = target StateId, or `DEAD` for no transition.
    pub transitions: Vec<StateId>,
    /// A match ends at this state's position whatever follows it.
    pub is_accept: bool,
    /// Present when this state accepts only under some of what may follow
    /// (some classes, or only at the end of the input). `None` for every
    /// state of a pattern without look conditions.
    pub accept_when: Option<AcceptWhen>,
}

impl DfaState {
    /// Whether a match ends at this state's position when the next byte is
    /// in class `class` (`None` = the end of the input).
    #[inline]
    pub fn accepts_before(&self, class: Option<usize>) -> bool {
        if self.is_accept {
            return true;
        }
        match (&self.accept_when, class) {
            (None, _) => false,
            (Some(w), None) => w.eoi,
            (Some(w), Some(c)) => w.classes[c],
        }
    }
}

/// The look-behind contexts a start state is chosen by: the byte before the
/// match's first position, or none at the start of the input.
pub const LOOK_BEHIND_KINDS: usize = 5;

/// Index into [`Dfa::starts`] for the byte before the start position.
#[inline]
pub fn look_behind_kind(prev: Option<u8>) -> usize {
    match prev {
        None => 0,
        Some(b'\n') => 1,
        Some(b'\r') => 2,
        Some(b) if b.is_ascii_alphanumeric() || b == b'_' => 3,
        Some(_) => 4,
    }
}

/// One representative byte per look-behind kind (kind 0 has none).
const LOOK_BEHIND_REPS: [Option<u8>; LOOK_BEHIND_KINDS] =
    [None, Some(b'\n'), Some(b'\r'), Some(b'a'), Some(b' ')];

/// Options for DFA construction.
#[derive(Clone, Debug)]
pub struct DfaOptions {
    /// Maximum DFA states before bailing (guards against exponential blowup).
    pub state_limit: usize,
    /// Whether the determinizer minimizes the DFA.
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

/// Why a pattern has no DFA.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum DfaError {
    /// The pattern does not parse.
    Parse(String),
    /// The `Hir` has no lowering (an assertion the determinizer is not given).
    Lower(LowerError),
    /// The determinizer refused or exceeded its size limits.
    Build(String),
    /// The DFA exceeds `DfaOptions::state_limit`.
    StateLimit(usize),
}

/// A compiled DFA. Transitions are indexed by byte equivalence classes.
#[derive(Clone, Debug)]
pub struct Dfa {
    /// DFA states. State 0 is the start with no look-behind.
    pub states: Vec<DfaState>,
    /// Flat transition table: `flat_transitions[state * num_classes + class]` = target StateId.
    /// Single contiguous allocation, cache-friendly access — one indirection instead of two.
    pub flat_transitions: Vec<StateId>,
    /// Byte → equivalence class mapping (256 entries).
    pub byte_classes: [u8; 256],
    /// Number of equivalence classes.
    pub num_classes: u16,
    /// Start state per look-behind kind ([`look_behind_kind`]); `starts[0] == 0`.
    pub starts: [StateId; LOOK_BEHIND_KINDS],
    /// Whether any state's acceptance depends on what follows, or the start
    /// depends on what precedes: the walk then reads look context.
    pub has_look: bool,
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
        Self::try_compile_with(pattern, opts).ok()
    }

    /// Compile with explicit options, naming the reason on refusal.
    pub fn try_compile_with(pattern: &str, opts: &DfaOptions) -> Result<Self, DfaError> {
        let parse_opts = crate::hir::ParseOptions {
            unicode: opts.unicode,
        };
        let hir =
            crate::parse_with(pattern, &parse_opts).map_err(|e| DfaError::Parse(e.to_string()))?;
        Self::from_hir(&hir, opts)
    }

    /// Build the DFA of an already-parsed `Hir`.
    pub fn from_hir(hir: &Hir, opts: &DfaOptions) -> Result<Self, DfaError> {
        let lowered = lower(hir).map_err(DfaError::Lower)?;
        let nfa = thompson::Compiler::new()
            .configure(
                thompson::Config::new()
                    .utf8(false)
                    .which_captures(thompson::WhichCaptures::None),
            )
            .build_from_hir(&lowered)
            .map_err(|e| DfaError::Build(e.to_string()))?;
        let ra = dense::Builder::new()
            .configure(
                dense::Config::new()
                    .match_kind(MatchKind::LeftmostFirst)
                    .start_kind(StartKind::Anchored)
                    .minimize(opts.minimize),
            )
            .build_from_nfa(&nfa)
            .map_err(|e| DfaError::Build(e.to_string()))?;
        read_dense(&ra, opts.state_limit)
    }

    /// Number of states.
    pub fn state_count(&self) -> usize {
        self.states.len()
    }

    /// Number of equivalence classes.
    pub fn class_count(&self) -> usize {
        self.num_classes as usize
    }

    /// The start state for a match beginning at `offset` of `bytes`.
    #[inline]
    pub fn start_at(&self, bytes: &[u8], offset: usize) -> StateId {
        let prev = if offset == 0 {
            None
        } else {
            bytes.get(offset - 1).copied()
        };
        self.starts[look_behind_kind(prev)]
    }

    /// Anchored (sticky) match at `offset` of `bytes`: the end of the
    /// leftmost-first match, or `None`. Look-behind is read from
    /// `bytes[offset - 1]`, so pass the whole input, not a suffix.
    pub fn find_at(&self, bytes: &[u8], offset: usize) -> Option<usize> {
        if self.has_look {
            return self.find_at_look(bytes, offset);
        }
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

    /// The walk with look conditions: acceptance is read before each byte
    /// (and at the end of the input), the start by the byte before `offset`.
    fn find_at_look(&self, bytes: &[u8], offset: usize) -> Option<usize> {
        let num_cls = self.num_classes as usize;
        let mut state = self.start_at(bytes, offset);
        let mut pos = offset;
        let mut last_accept = None;
        loop {
            let st = &self.states[state as usize];
            if pos >= bytes.len() {
                if st.accepts_before(None) {
                    last_accept = Some(pos);
                }
                return last_accept;
            }
            let class = self.byte_classes[bytes[pos] as usize] as usize;
            if st.accepts_before(Some(class)) {
                last_accept = Some(pos);
            }
            let next = self.flat_transitions[state as usize * num_cls + class];
            if next == DEAD {
                return last_accept;
            }
            state = next;
            pos += 1;
        }
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

// ── Reading regex-automata's dense DFA ───────────────────────────────────

/// Read an anchored, leftmost-first dense DFA into this crate's table.
fn read_dense(ra: &dense::DFA<Vec<u32>>, state_limit: usize) -> Result<Dfa, DfaError> {
    let classes = ra.byte_classes();
    // The last class of regex-automata's alphabet is end-of-input.
    let num_cls = classes.alphabet_len() - 1;
    let mut byte_classes = [0u8; 256];
    let mut reps: Vec<Option<u8>> = vec![None; num_cls];
    for b in 0..=255u8 {
        let c = classes.get(b);
        byte_classes[b as usize] = c;
        reps[c as usize].get_or_insert(b);
    }
    let reps: Vec<u8> = reps
        .into_iter()
        .map(|r| r.expect("every byte class has a member"))
        .collect();

    // Breadth-first from the starts; the start with no look-behind is 0.
    let mut ids: std::collections::HashMap<RaStateId, StateId> = Default::default();
    let mut order: Vec<RaStateId> = Vec::new();
    let mut queue: VecDeque<RaStateId> = VecDeque::new();
    let mut ra_starts = [RaStateId::ZERO; LOOK_BEHIND_KINDS];
    for (k, lb) in LOOK_BEHIND_REPS.iter().enumerate() {
        let config = start::Config::new()
            .anchored(Anchored::Yes)
            .look_behind(*lb);
        let s = ra
            .start_state(&config)
            .map_err(|e| DfaError::Build(e.to_string()))?;
        ra_starts[k] = s;
        if let std::collections::hash_map::Entry::Vacant(e) = ids.entry(s) {
            e.insert(order.len() as StateId);
            order.push(s);
            queue.push_back(s);
        }
    }
    // Raw table over regex-automata states (dead states map to DEAD).
    let mut raw_next: Vec<Vec<StateId>> = Vec::new();
    let mut raw_accept: Vec<(Vec<bool>, bool)> = Vec::new();
    while let Some(s) = queue.pop_front() {
        let mut next = vec![DEAD; num_cls];
        let mut acc = vec![false; num_cls];
        for (c, &b) in reps.iter().enumerate() {
            let t = ra.next_state(s, b);
            if ra.is_quit_state(t) {
                return Err(DfaError::Build(format!("quit on byte {b:#04x}")));
            }
            acc[c] = ra.is_match_state(t);
            if ra.is_dead_state(t) {
                continue;
            }
            let id = match ids.get(&t) {
                Some(&id) => id,
                None => {
                    let id = order.len() as StateId;
                    if order.len() >= state_limit.saturating_mul(4).max(64) {
                        return Err(DfaError::StateLimit(order.len()));
                    }
                    ids.insert(t, id);
                    order.push(t);
                    queue.push_back(t);
                    id
                }
            };
            next[c] = id;
        }
        let eoi = ra.is_match_state(ra.next_eoi_state(s));
        raw_next.push(next);
        raw_accept.push((acc, eoi));
    }
    let n = order.len();

    // Fold states from which no acceptance is reachable into DEAD (the
    // regex-automata states that only carry a delayed match, among them).
    let accepts_somewhere: Vec<bool> = raw_accept
        .iter()
        .map(|(acc, eoi)| *eoi || acc.iter().any(|&a| a))
        .collect();
    let mut live = accepts_somewhere.clone();
    let mut changed = true;
    while changed {
        changed = false;
        for s in 0..n {
            if !live[s] && raw_next[s].iter().any(|&t| t != DEAD && live[t as usize]) {
                live[s] = true;
                changed = true;
            }
        }
    }
    let is_start = |s: usize| ra_starts.iter().any(|&r| ids[&r] as usize == s);
    let mut new_id = vec![DEAD; n];
    let mut kept = 0u32;
    for s in 0..n {
        if live[s] || is_start(s) {
            new_id[s] = kept;
            kept += 1;
        }
    }
    if kept as usize > state_limit {
        return Err(DfaError::StateLimit(kept as usize));
    }

    let mut states = Vec::with_capacity(kept as usize);
    let mut has_look = false;
    for s in 0..n {
        if new_id[s] == DEAD {
            continue;
        }
        let transitions: Vec<StateId> = raw_next[s]
            .iter()
            .map(|&t| {
                if t == DEAD || !live[t as usize] {
                    DEAD
                } else {
                    new_id[t as usize]
                }
            })
            .collect();
        let (acc, eoi) = &raw_accept[s];
        let all = *eoi && acc.iter().all(|&a| a);
        let none = !*eoi && acc.iter().all(|&a| !a);
        let accept_when = if all || none {
            None
        } else {
            has_look = true;
            Some(AcceptWhen {
                classes: acc.clone(),
                eoi: *eoi,
            })
        };
        states.push(DfaState {
            transitions,
            is_accept: all,
            accept_when,
        });
    }
    let mut starts = [0 as StateId; LOOK_BEHIND_KINDS];
    for k in 0..LOOK_BEHIND_KINDS {
        starts[k] = new_id[ids[&ra_starts[k]] as usize];
    }
    debug_assert_eq!(starts[0], 0);
    if starts.iter().any(|&s| s != starts[0]) {
        has_look = true;
    }

    let mut flat = Vec::with_capacity(states.len() * num_cls);
    for state in &states {
        flat.extend_from_slice(&state.transitions);
    }
    Ok(Dfa {
        states,
        flat_transitions: flat,
        byte_classes,
        num_classes: num_cls as u16,
        starts,
        has_look,
    })
}
