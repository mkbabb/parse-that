//! The kernel ABI's layout descriptor (sk-v27 LW3.COMP-4b).
//!
//! [`abi_descriptor`] writes the kernel's public contract as text: every
//! public enum matched without a wildcard, every struct destructured without
//! `..`, every field bound to its type, layouts by `size_of`/`align_of`. A
//! change to any of them changes the text, so `tests/kernel_abi.rs` reads it
//! against the block recorded in `KERNEL-ABI.md` and that block's digest.
//! A kernel ABI change is therefore an addendum there with a new version
//! line and a new digest.

use core::fmt::Write;
use core::mem::{align_of, size_of};

use super::input::EmptySourceId;
use super::{
    Cursor, Expected, Failure, Fault, Input, InputError, KERNEL_ABI, LABEL_CAPACITY, Label,
    ModuleResult, NoSink, RegexPlan, RegexPlanError, RegexTerminal, ResourceKind, Run, Span, Step,
};

fn layout<T>(out: &mut String, kind: &str, name: &str) {
    let _ = writeln!(
        out,
        "{kind} {name} size={} align={}",
        size_of::<T>(),
        align_of::<T>()
    );
}

fn line(out: &mut String, text: &str) {
    out.push_str("  ");
    out.push_str(text);
    out.push('\n');
}

/// Bind every field of every public kernel value type by name and type, and
/// every variant of every public enum, so the compiler refuses this function
/// when one of them changes without the descriptor below changing too.
#[allow(dead_code, clippy::too_many_arguments)]
fn shape_witness<'i>(
    input: Input<'i>,
    cursor: Cursor<'i>,
    span: Span<'i>,
    failure: Failure<'i>,
    label: Label,
    expected: Expected,
    fault: Fault<'i>,
    kind: ResourceKind,
    step: Step<'i, ()>,
    input_error: InputError,
    plan_error: RegexPlanError,
) {
    let Input::<'i> {
        bytes: _bytes,
        empty_source_id: _empty,
    }: Input<'i> = input;
    let _: (&'i [u8], Option<EmptySourceId>) = (_bytes, _empty);
    let Cursor::<'i> {
        source: _source,
        empty_source_id: _empty,
        offset: _offset,
    } = cursor;
    let _: (&'i [u8], Option<EmptySourceId>, usize) = (_source, _empty, _offset);
    let Span::<'i> {
        bytes: _bytes,
        empty_source_id: _empty,
        start: _start,
        end: _end,
    } = span;
    let _: (&'i [u8], Option<EmptySourceId>, usize, usize) = (_bytes, _empty, _start, _end);
    let Failure::<'i> {
        at: _at,
        expected: _expected,
    } = failure;
    let _: (Cursor<'i>, Expected) = (_at, _expected);
    let Label(_id) = label;
    let _: u16 = _id;
    let Expected { words: _words } = expected;
    let _: [u64; LABEL_CAPACITY / 64] = _words;
    match fault {
        Fault::StalledRepeat { at } => {
            let _: Cursor<'i> = at;
        }
        Fault::ForeignOutcome { at } => {
            let _: Cursor<'i> = at;
        }
        Fault::FullParseAfterProgress { at } => {
            let _: Cursor<'i> = at;
        }
        Fault::ResourceLimit { at, kind, limit } => {
            let _: (Cursor<'i>, ResourceKind, usize) = (at, kind, limit);
        }
    }
    match kind {
        ResourceKind::InputBytes
        | ResourceKind::Nesting
        | ResourceKind::Work
        | ResourceKind::Events => {}
    }
    match step {
        Step::Matched(value) => {
            let () = value;
        }
        Step::Mismatch(failure) => {
            let _: Failure<'i> = failure;
        }
        Step::Fault(fault) => {
            let _: Fault<'i> = fault;
        }
    }
    match input_error {
        InputError::OutOfBounds { offset, len } => {
            let _: (usize, usize) = (offset, len);
        }
        InputError::ForeignCursor => {}
        InputError::ReversedSpan { start, end } => {
            let _: (usize, usize) = (start, end);
        }
    }
    match plan_error {
        RegexPlanError::ClassCount
        | RegexPlanError::StateShape
        | RegexPlanError::ByteClass
        | RegexPlanError::TransitionShape
        | RegexPlanError::TransitionTarget => {}
    }
}

/// The kernel ABI descriptor: the text `KERNEL-ABI.md` records.
#[doc(hidden)]
pub fn abi_descriptor() -> String {
    let mut out = String::new();
    let _ = writeln!(out, "parse_that::kernel ABI {KERNEL_ABI} (sk-v27 LW3.COMP-4b)");
    let _ = writeln!(out, "const KERNEL_ABI = {KERNEL_ABI}");
    let _ = writeln!(out, "const LABEL_CAPACITY = {LABEL_CAPACITY}");
    let _ = writeln!(out, "const RegexPlan::DEAD = {:#x}", RegexPlan::DEAD);

    layout::<Input<'_>>(&mut out, "struct", "Input");
    line(&mut out, "bytes: &[u8]");
    line(&mut out, "empty_source_id: Option<EmptySourceId>");
    layout::<Cursor<'_>>(&mut out, "struct", "Cursor");
    line(&mut out, "source: &[u8]");
    line(&mut out, "empty_source_id: Option<EmptySourceId>");
    line(&mut out, "offset: usize");
    layout::<Span<'_>>(&mut out, "struct", "Span");
    line(&mut out, "bytes: &[u8]");
    line(&mut out, "empty_source_id: Option<EmptySourceId>");
    line(&mut out, "start: usize");
    line(&mut out, "end: usize");
    layout::<Label>(&mut out, "struct", "Label");
    line(&mut out, "0: u16 (an id into the module's label table, < LABEL_CAPACITY)");
    layout::<Expected>(&mut out, "struct", "Expected");
    line(&mut out, "words: [u64; LABEL_CAPACITY / 64] (bit i = label id i)");
    layout::<Failure<'_>>(&mut out, "struct", "Failure");
    line(&mut out, "at: Cursor");
    line(&mut out, "expected: Expected");
    layout::<Fault<'_>>(&mut out, "enum", "Fault");
    line(&mut out, "StalledRepeat { at: Cursor }");
    line(&mut out, "ForeignOutcome { at: Cursor }");
    line(&mut out, "FullParseAfterProgress { at: Cursor }");
    line(&mut out, "ResourceLimit { at: Cursor, kind: ResourceKind, limit: usize }");
    layout::<ResourceKind>(&mut out, "enum", "ResourceKind");
    line(&mut out, "InputBytes");
    line(&mut out, "Nesting");
    line(&mut out, "Work");
    line(&mut out, "Events");
    layout::<Step<'_, ()>>(&mut out, "enum", "Step<()>");
    layout::<Step<'_, usize>>(&mut out, "enum", "Step<usize>");
    layout::<Step<'_, Span<'_>>>(&mut out, "enum", "Step<Span>");
    line(&mut out, "Matched(T)");
    line(&mut out, "Mismatch(Failure)");
    line(&mut out, "Fault(Fault)");
    layout::<InputError>(&mut out, "enum", "InputError");
    line(&mut out, "OutOfBounds { offset: usize, len: usize }");
    line(&mut out, "ForeignCursor");
    line(&mut out, "ReversedSpan { start: usize, end: usize }");
    layout::<RegexPlan<'_>>(&mut out, "struct", "RegexPlan");
    layout::<RegexPlanError>(&mut out, "enum", "RegexPlanError");
    line(&mut out, "ClassCount");
    line(&mut out, "StateShape");
    line(&mut out, "ByteClass");
    line(&mut out, "TransitionShape");
    line(&mut out, "TransitionTarget");
    layout::<RegexTerminal<'_>>(&mut out, "struct", "RegexTerminal");
    layout::<Run<'_, NoSink>>(&mut out, "struct", "Run<NoSink>");
    layout::<NoSink>(&mut out, "struct", "NoSink");
    layout::<ModuleResult<'_, NoSink>>(&mut out, "struct", "ModuleResult<NoSink>");
    out
}

/// FNV-1a 64 of `text`'s bytes.
#[doc(hidden)]
pub const fn fnv1a64(text: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    let mut i = 0;
    while i < text.len() {
        hash ^= text[i] as u64;
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
        i += 1;
    }
    hash
}
