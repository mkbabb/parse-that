//! The parse-that recognition kernel.
//!
//! Generated parsers call these direct operations. The kernel deliberately
//! owns neither a parser graph nor grammar-specific state. It is additive:
//! the combinator runtime at the crate root is unchanged beside it.
//!
//! Regex terminals take their plan from `parse-that-regex`: either a checked
//! borrowed table ([`RegexPlan`], the form generated code writes as statics)
//! or that crate's compiled automaton ([`RegexTerminal::from_dfa`]), whose
//! walk is leftmost-first and reads look conditions and u/v semantics as the
//! engine compiled them.

#[doc(hidden)]
pub mod abi;
mod control;
mod input;
mod module;
mod outcome;
mod run;
mod terminal;
mod transaction;

pub use control::{choice, difference, label, repeat, sequence};
pub use input::{Cursor, Input, InputError, Span};
pub use module::ModuleResult;
pub use outcome::{
    Expected, ExpectedIter, Failure, Fault, LABEL_CAPACITY, Label, ResourceKind, Step,
};
pub use run::Run;
pub use terminal::{RegexPlan, RegexPlanError, RegexTerminal, eof, literal, regex};
pub use transaction::{EventSink, NoSink};

/// Compile-time identity of the selected generated-parser kernel contract.
///
/// Consumers may assert this integer in const context so an older
/// dependency cannot silently satisfy a newer generated-control boundary.
///
/// ABI 4 (sk-v27 LW3.COMP-4b): [`Failure`] carries the furthest cursor and
/// the sorted, deduplicated expected-label set at it; see `KERNEL-ABI.md`.
pub const KERNEL_ABI: u32 = 4;
