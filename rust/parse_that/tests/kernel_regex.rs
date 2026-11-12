//! The kernel's regex terminal over `parse-that-regex` (sk-v27 LW3.COMP-1a).
//!
//! The kernel takes its regex plan from `parse-that-regex`: the compiled
//! automaton directly ([`RegexTerminal::from_dfa`]), or that automaton's
//! look-free table checked into the static [`RegexPlan`] form generated code
//! writes. These laws pin the engine the kernel reads at this lane's base:
//! leftmost-first, look conditions, u/v code-point semantics, and the frozen
//! Hir ABI fingerprint.

use std::alloc::{GlobalAlloc, Layout, System};
use std::cell::Cell;
use std::sync::atomic::{AtomicUsize, Ordering};

use parse_that::kernel::{
    Input, RegexPlan, RegexPlanError, RegexTerminal, Run, Span, Step, literal, regex,
};
use parse_that_regex::{DEAD, Dfa, DfaOptions};

// ── allocation counting, scoped to the measuring thread ─────────────────

struct CountingAllocator;

thread_local! {
    static COUNT_HERE: Cell<bool> = const { Cell::new(false) };
}
static ALLOCATIONS: AtomicUsize = AtomicUsize::new(0);

fn counting_here() -> bool {
    COUNT_HERE.try_with(Cell::get).unwrap_or(false)
}

unsafe impl GlobalAlloc for CountingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        if counting_here() {
            ALLOCATIONS.fetch_add(1, Ordering::Relaxed);
        }
        // SAFETY: this allocator delegates the request unchanged to System.
        unsafe { System.alloc(layout) }
    }

    unsafe fn alloc_zeroed(&self, layout: Layout) -> *mut u8 {
        if counting_here() {
            ALLOCATIONS.fetch_add(1, Ordering::Relaxed);
        }
        // SAFETY: this allocator delegates the request unchanged to System.
        unsafe { System.alloc_zeroed(layout) }
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        if counting_here() {
            ALLOCATIONS.fetch_add(1, Ordering::Relaxed);
        }
        // SAFETY: this allocator delegates the request unchanged to System.
        unsafe { System.realloc(ptr, layout, new_size) }
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        // SAFETY: `ptr` and `layout` came from this allocator's System
        // delegation.
        unsafe { System.dealloc(ptr, layout) }
    }
}

#[global_allocator]
static GLOBAL: CountingAllocator = CountingAllocator;

// ── helpers ─────────────────────────────────────────────────────────────

fn dfa(pattern: &str) -> Dfa {
    Dfa::try_compile_with(pattern, &DfaOptions::default())
        .unwrap_or_else(|e| panic!("{pattern:?} compiles: {e:?}"))
}

/// The kernel's step at `offset`, as (matched end or None, cursor after).
fn kernel_at(terminal: &RegexTerminal<'_>, bytes: &[u8], offset: usize) -> (Option<usize>, usize) {
    let mut run = Run::new(Input::new(bytes));
    if offset > 0 {
        let prefix = &bytes[..offset];
        let skipped = literal(&mut run, prefix).into_matched();
        assert!(skipped.is_some(), "the prefix re-reads itself");
    }
    match regex(&mut run, terminal) {
        Step::Matched(span) => {
            assert_eq!(span.start(), offset);
            assert_eq!(run.cursor().offset(), span.end());
            (Some(span.end()), run.cursor().offset())
        }
        Step::Mismatch(failure) => {
            assert_eq!(
                failure.at().offset(),
                offset,
                "a mismatch reports its start"
            );
            (None, run.cursor().offset())
        }
        Step::Fault(fault) => panic!("a regex terminal never faults: {fault:?}"),
    }
}

fn matched(terminal: &RegexTerminal<'_>, input: &[u8]) -> Option<Vec<u8>> {
    let mut run = Run::new(Input::new(input));
    regex(&mut run, terminal)
        .into_matched()
        .map(|span: Span<'_>| span.as_bytes().to_vec())
}

/// The static table form of a look-free automaton, as an emitter writes it.
struct Table {
    byte_classes: [u8; 256],
    transitions: Vec<u32>,
    accepting: Vec<bool>,
    states: usize,
    classes: usize,
}

impl Table {
    fn of(dfa: &Dfa) -> Self {
        assert!(!dfa.has_look, "the static form is look-free");
        Self {
            byte_classes: dfa.byte_classes,
            transitions: dfa.flat_transitions.clone(),
            accepting: dfa.states.iter().map(|s| s.is_accept).collect(),
            states: dfa.state_count(),
            classes: dfa.class_count(),
        }
    }

    fn plan(&self) -> RegexPlan<'_> {
        RegexPlan::new(
            &self.byte_classes,
            self.states,
            self.classes,
            0,
            &self.transitions,
            &self.accepting,
        )
        .expect("an engine table is a valid static plan")
    }
}

const PATTERNS: &[&str] = &[
    r"[a-z]+",
    r"a|ab",
    r"ab|a",
    r"(a|ab)(c|bcd)",
    r"a*?b",
    r"a+?",
    r"-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?",
    r#""(?:[^"\\]|\\.)*""#,
    r"[ \t\n\r]*",
    r"(?:/\*[^*]*\*+(?:[^/*][^*]*\*+)*/)",
    r".",
    r"[^a]",
    r"\w+\b",
    r"\bfoo\b",
    r"a$",
    r"^a",
    r"x\B",
];

const INPUTS: &[&[u8]] = &[
    b"",
    b"a",
    b"ab",
    b"abcd",
    b"abc",
    b"aaab",
    b"alpha42",
    b"-12.5e+3,",
    b"0123",
    b"\"a\\\"b\" tail",
    b" \t\n x",
    b"/* c ** d */ e",
    "é".as_bytes(),
    "日本".as_bytes(),
    b"\xff\xfe",
    b"foo bar",
    b"food",
    b" foo",
    b"a\n",
    b"xy",
    b"x",
];

// ── laws ────────────────────────────────────────────────────────────────

#[test]
fn engine_terminal_is_leftmost_first() {
    let first = dfa("a|ab");
    let terminal = RegexTerminal::from_dfa(&first).expect("checked automaton");
    assert_eq!(matched(&terminal, b"ab").as_deref(), Some(&b"a"[..]));

    let second = dfa("ab|a");
    let terminal = RegexTerminal::from_dfa(&second).expect("checked automaton");
    assert_eq!(matched(&terminal, b"ab").as_deref(), Some(&b"ab"[..]));

    let lazy = dfa("a+?");
    let terminal = RegexTerminal::from_dfa(&lazy).expect("checked automaton");
    assert_eq!(matched(&terminal, b"aaa").as_deref(), Some(&b"a"[..]));
}

#[test]
fn engine_terminal_reads_look_ahead_conditions() {
    let word_end = dfa(r"a\b");
    let terminal = RegexTerminal::from_dfa(&word_end).expect("checked automaton");
    assert_eq!(matched(&terminal, b"a b").as_deref(), Some(&b"a"[..]));
    assert_eq!(matched(&terminal, b"ab"), None);
    assert_eq!(matched(&terminal, b"a").as_deref(), Some(&b"a"[..]));

    let at_end = dfa("a$");
    let terminal = RegexTerminal::from_dfa(&at_end).expect("checked automaton");
    assert_eq!(matched(&terminal, b"a").as_deref(), Some(&b"a"[..]));
    assert_eq!(matched(&terminal, b"ab"), None);
}

#[test]
fn engine_terminal_reads_look_behind_from_the_whole_input() {
    let boundary = dfa(r"\bx");
    let terminal = RegexTerminal::from_dfa(&boundary).expect("checked automaton");
    assert_eq!(kernel_at(&terminal, b"ax", 1), (None, 1));
    assert_eq!(kernel_at(&terminal, b" x", 1), (Some(2), 2));
    assert_eq!(kernel_at(&terminal, b"x", 0), (Some(1), 1));
}

#[test]
fn engine_terminal_reads_code_points_in_unicode_mode() {
    let any = dfa(".");
    let terminal = RegexTerminal::from_dfa(&any).expect("checked automaton");
    assert_eq!(
        matched(&terminal, "é".as_bytes()).as_deref(),
        Some("é".as_bytes())
    );
    assert_eq!(
        matched(&terminal, "日本".as_bytes()).as_deref(),
        Some("日".as_bytes())
    );
    assert_eq!(
        matched(&terminal, b"\xff"),
        None,
        "an invalid byte is no code point"
    );
}

#[test]
fn engine_terminal_equals_the_engine_walk_everywhere() {
    let mut cells = 0usize;
    for pattern in PATTERNS {
        let automaton = dfa(pattern);
        let terminal = RegexTerminal::from_dfa(&automaton).expect("checked automaton");
        for input in INPUTS {
            for offset in 0..=input.len() {
                let want = automaton.find_at(input, offset);
                let (got, cursor) = kernel_at(&terminal, input, offset);
                assert_eq!(got, want, "{pattern:?} on {input:?} at {offset}");
                assert_eq!(cursor, want.unwrap_or(offset), "a mismatch is atomic");
                cells += 1;
            }
        }
    }
    assert!(cells > 1_000, "the differential reads {cells} cells");
}

#[test]
fn static_table_from_the_engine_equals_the_engine() {
    let mut planned = 0usize;
    for pattern in PATTERNS {
        let automaton = dfa(pattern);
        if automaton.has_look {
            continue;
        }
        let table = Table::of(&automaton);
        let static_terminal = RegexTerminal::new(table.plan());
        let engine_terminal = RegexTerminal::from_dfa(&automaton).expect("checked automaton");
        for input in INPUTS {
            for offset in 0..=input.len() {
                assert_eq!(
                    kernel_at(&static_terminal, input, offset),
                    kernel_at(&engine_terminal, input, offset),
                    "{pattern:?} on {input:?} at {offset}"
                );
            }
        }
        planned += 1;
    }
    assert!(planned >= 10, "{planned} look-free patterns were planned");
}

#[test]
fn engine_terminal_refuses_a_malformed_automaton() {
    let good = dfa("[a-z]+");
    assert!(RegexTerminal::from_dfa(&good).is_ok());

    let mut no_classes = good.clone();
    no_classes.num_classes = 0;
    assert_eq!(
        RegexTerminal::from_dfa(&no_classes).err(),
        Some(RegexPlanError::ClassCount)
    );

    let mut too_many_classes = good.clone();
    too_many_classes.num_classes = 257;
    assert_eq!(
        RegexTerminal::from_dfa(&too_many_classes).err(),
        Some(RegexPlanError::ClassCount)
    );

    let mut no_states = good.clone();
    no_states.states.clear();
    assert_eq!(
        RegexTerminal::from_dfa(&no_states).err(),
        Some(RegexPlanError::StateShape)
    );

    let mut moved_start = good.clone();
    moved_start.starts[0] = 1;
    assert_eq!(
        RegexTerminal::from_dfa(&moved_start).err(),
        Some(RegexPlanError::StateShape),
        "the look-free walk begins at state 0"
    );

    let mut stray_start = good.clone();
    stray_start.starts[3] = stray_start.states.len() as u32;
    assert_eq!(
        RegexTerminal::from_dfa(&stray_start).err(),
        Some(RegexPlanError::StateShape)
    );

    let mut short_table = good.clone();
    short_table.flat_transitions.pop();
    assert_eq!(
        RegexTerminal::from_dfa(&short_table).err(),
        Some(RegexPlanError::TransitionShape)
    );

    let mut stray_class = good.clone();
    stray_class.byte_classes[b'q' as usize] = stray_class.num_classes as u8;
    assert_eq!(
        RegexTerminal::from_dfa(&stray_class).err(),
        Some(RegexPlanError::ByteClass)
    );

    let mut stray_target = good.clone();
    stray_target.flat_transitions[0] = stray_target.states.len() as u32;
    assert_eq!(
        RegexTerminal::from_dfa(&stray_target).err(),
        Some(RegexPlanError::TransitionTarget)
    );
    let mut dead_target = good.clone();
    dead_target.flat_transitions[0] = DEAD;
    assert!(
        RegexTerminal::from_dfa(&dead_target).is_ok(),
        "DEAD is a target"
    );

    let mut look = dfa(r"a\b");
    assert!(RegexTerminal::from_dfa(&look).is_ok());
    let row = look
        .states
        .iter_mut()
        .find_map(|s| s.accept_when.as_mut())
        .expect("a look pattern has a conditional state");
    row.classes.pop();
    assert_eq!(
        RegexTerminal::from_dfa(&look).err(),
        Some(RegexPlanError::StateShape)
    );
}

#[test]
fn engine_terminal_recognition_performs_zero_allocations() {
    let word = dfa("[a-z]+");
    let boundary = dfa(r"[a-z]+\b");
    let digits = dfa("[0-9]+");
    let word = RegexTerminal::from_dfa(&word).expect("checked automaton");
    let boundary = RegexTerminal::from_dfa(&boundary).expect("checked automaton");
    let digits = RegexTerminal::from_dfa(&digits).expect("checked automaton");
    let bytes = b"alpha42 beta";
    let input = Input::new(bytes);

    COUNT_HERE.with(|c| c.set(true));
    let before = ALLOCATIONS.load(Ordering::Relaxed);
    let mut run = Run::new(input);
    let first = regex(&mut run, &word);
    let second = regex(&mut run, &digits);
    let mismatch = regex(&mut run, &boundary);
    let after = ALLOCATIONS.load(Ordering::Relaxed);
    COUNT_HERE.with(|c| c.set(false));

    assert!(matches!(first, Step::Matched(_)));
    assert!(matches!(second, Step::Matched(_)));
    assert!(matches!(mismatch, Step::Mismatch(_)));
    assert_eq!(after - before, 0, "the engine path allocates nothing");
}

#[test]
fn kernel_pins_the_regex_hir_abi_it_was_built_against() {
    const ABI_HIR: &str = include_str!("../../regex/ABI-HIR.md");
    assert!(
        ABI_HIR.contains("FNV-1a 64 of the block: `0x0c587e007f6ccf7d`"),
        "parse-that-regex's frozen Hir ABI moved: re-read the kernel's regex laws against it"
    );
}
