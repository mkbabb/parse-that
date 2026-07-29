use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

use parse_that::{
    EventSink, Input, RegexPlan, RegexTerminal, Run, Span, Step, choice, literal, regex, repeat,
    sequence,
};

struct CountingAllocator;

static COUNTING: AtomicBool = AtomicBool::new(false);
static ALLOCATIONS: AtomicUsize = AtomicUsize::new(0);

unsafe impl GlobalAlloc for CountingAllocator {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        if COUNTING.load(Ordering::Relaxed) {
            ALLOCATIONS.fetch_add(1, Ordering::Relaxed);
        }
        // SAFETY: this allocator delegates the request unchanged to System.
        unsafe { System.alloc(layout) }
    }

    unsafe fn alloc_zeroed(&self, layout: Layout) -> *mut u8 {
        if COUNTING.load(Ordering::Relaxed) {
            ALLOCATIONS.fetch_add(1, Ordering::Relaxed);
        }
        // SAFETY: this allocator delegates the request unchanged to System.
        unsafe { System.alloc_zeroed(layout) }
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        if COUNTING.load(Ordering::Relaxed) {
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

fn ascii_word_terminal() -> RegexTerminal<'static> {
    static BYTE_CLASSES: [u8; 256] = {
        let mut classes = [1_u8; 256];
        let mut byte = b'a';
        while byte <= b'z' {
            classes[byte as usize] = 0;
            byte += 1;
        }
        classes
    };
    static TRANSITIONS: [u32; 4] = [1, RegexPlan::DEAD, 1, RegexPlan::DEAD];
    static ACCEPTING: [bool; 2] = [false, true];

    let plan = RegexPlan::new(&BYTE_CLASSES, 2, 2, 0, &TRANSITIONS, &ACCEPTING)
        .expect("valid static regex plan");
    RegexTerminal::new(plan)
}

fn word_then_digits<'i>(run: &mut Run<'i>, terminal: &RegexTerminal<'_>) -> Step<'i, Span<'i>> {
    sequence(run, |run| match regex(run, terminal) {
        Step::Matched(_) => literal(run, b"42"),
        Step::Mismatch(failure) => Step::Mismatch(failure),
        Step::Fault(fault) => Step::Fault(fault),
    })
}

#[derive(Clone, Copy)]
struct ScalarEvent {
    _start: usize,
    _end: usize,
}

fn eventful_word_then_digits<'i, S>(
    run: &mut Run<'i, S>,
    terminal: &RegexTerminal<'_>,
) -> Step<'i, Span<'i>>
where
    S: EventSink<Event = ScalarEvent>,
{
    let span = match regex(run, terminal) {
        Step::Matched(span) => span,
        Step::Mismatch(failure) => return Step::Mismatch(failure),
        Step::Fault(fault) => return Step::Fault(fault),
    };
    run.emit_with(|| ScalarEvent {
        _start: span.start(),
        _end: span.end(),
    });
    literal(run, b"42")
}

fn assert_no_sink_recognition_borrows_input_and_performs_zero_allocations() {
    let terminal = ascii_word_terminal();
    let bytes = b"alpha42";
    let input = Input::new(bytes);

    // Warm any process-global machinery before opening the measured region.
    let mut warm = Run::new(input);
    assert!(matches!(
        warm.parse_full(|run| word_then_digits(run, &terminal)),
        Step::Matched(_)
    ));

    ALLOCATIONS.store(0, Ordering::SeqCst);
    COUNTING.store(true, Ordering::SeqCst);

    let mut run = Run::new(input);
    let outcome = run.parse_full(|run| word_then_digits(run, &terminal));
    std::hint::black_box(&outcome);

    COUNTING.store(false, Ordering::SeqCst);
    let allocations = ALLOCATIONS.load(Ordering::SeqCst);

    assert!(matches!(outcome, Step::Matched(_)));
    assert_eq!(run.cursor().offset(), input.len());
    assert_eq!(allocations, 0, "recognition allocated");
    assert_eq!(input.bytes().as_ptr(), bytes.as_ptr());
}

fn assert_source_identity_creation_performs_zero_allocations() {
    let left_bytes = [];
    let right_bytes = [];

    ALLOCATIONS.store(0, Ordering::SeqCst);
    COUNTING.store(true, Ordering::SeqCst);

    let left = Input::new(&left_bytes);
    let right = Input::new(&right_bytes);
    std::hint::black_box((left, right));

    COUNTING.store(false, Ordering::SeqCst);
    assert_eq!(ALLOCATIONS.load(Ordering::SeqCst), 0);
    assert_ne!(left.start(), right.start());
}

fn assert_no_sink_erases_event_construction_without_allocating() {
    let terminal = ascii_word_terminal();
    let input = Input::new(b"alpha42");
    let mut warm = Run::discarding::<ScalarEvent>(input);
    assert!(matches!(
        warm.parse_full(|run| eventful_word_then_digits(run, &terminal)),
        Step::Matched(_)
    ));

    ALLOCATIONS.store(0, Ordering::SeqCst);
    COUNTING.store(true, Ordering::SeqCst);

    let mut run = Run::discarding::<ScalarEvent>(input);
    let outcome = run.parse_full(|run| eventful_word_then_digits(run, &terminal));
    std::hint::black_box(&outcome);

    COUNTING.store(false, Ordering::SeqCst);
    assert!(matches!(outcome, Step::Matched(_)));
    assert_eq!(ALLOCATIONS.load(Ordering::SeqCst), 0);
}

fn assert_parse_module_with_no_sink_performs_zero_allocations() {
    let terminal = ascii_word_terminal();
    let input = Input::new(b"alpha42");

    let warm = Run::new(input).parse_module(|run| word_then_digits(run, &terminal));
    assert!(matches!(warm.outcome(), Step::Matched(_)));

    ALLOCATIONS.store(0, Ordering::SeqCst);
    COUNTING.store(true, Ordering::SeqCst);

    let result = Run::new(input).parse_module(|run| word_then_digits(run, &terminal));
    std::hint::black_box(&result);

    COUNTING.store(false, Ordering::SeqCst);
    let allocations = ALLOCATIONS.load(Ordering::SeqCst);

    assert!(matches!(result.outcome(), Step::Matched(_)));
    assert_eq!(result.input().start(), input.start());
    assert_eq!(allocations, 0, "consuming module parse allocated");
}

fn assert_mismatch_choice_and_fault_paths_allocate_nothing() {
    let input = Input::new(b"a");
    let mut mismatch = Run::new(input);
    let mut alternative = Run::new(input);
    let mut fault = Run::new(input);

    ALLOCATIONS.store(0, Ordering::SeqCst);
    COUNTING.store(true, Ordering::SeqCst);

    let mismatch_outcome = mismatch.parse_prefix(|run| literal(run, b"z"));
    let alternative_outcome = alternative
        .parse_full(|run| choice(run, |run| literal(run, b"z"), |run| literal(run, b"a")));
    let fault_outcome = fault.parse_prefix(|run| repeat(run, 0, None, |run| literal(run, b"")));
    std::hint::black_box((&mismatch_outcome, &alternative_outcome, &fault_outcome));

    COUNTING.store(false, Ordering::SeqCst);
    assert!(matches!(mismatch_outcome, Step::Mismatch(_)));
    assert!(matches!(alternative_outcome, Step::Matched(_)));
    assert!(matches!(fault_outcome, Step::Fault(_)));
    assert_eq!(ALLOCATIONS.load(Ordering::SeqCst), 0);
}

#[test]
fn kernel_allocation_laws() {
    // One test owns the process-global counting window. Parallel test workers
    // would otherwise contaminate allocator evidence while waiting to run.
    assert_source_identity_creation_performs_zero_allocations();
    assert_no_sink_recognition_borrows_input_and_performs_zero_allocations();
    assert_no_sink_erases_event_construction_without_allocating();
    assert_parse_module_with_no_sink_performs_zero_allocations();
    assert_mismatch_choice_and_fault_paths_allocate_nothing();
}
