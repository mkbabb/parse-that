//! Compile-time regex authority: HIR analysis and checked table-plan emission.
//!
//! This crate parses and analyzes regexes for BBNF compilation. It emits
//! immutable tables for generated parsers but does not own runtime matching.
//! It has no dependency on parse-that or grammar infrastructure.
//!
//! ## Modules
//! - [`hir`] — High-level intermediate representation + hand-written parser
//! - [`table_plan`] — sealed HIR→DFA table-plan compilation boundary
//! - [`sets`] — Byte set and character set data structures
//! - [`unicode`] — Unicode general-category property tables
//! - [`utf8`] — Codepoint range → UTF-8 byte sequence expansion

pub mod algebra;
mod automata;
pub mod classify;
pub mod first;
pub mod hir;
pub mod info;
pub mod sets;
pub mod table_plan;
pub mod unicode;
pub mod utf8;

// Re-exports for convenience
pub use crate::hir::parser::{parse, parse_with};
pub use classify::{RegexClass, classify_regex, classify_regex_from_hir};
pub use first::{regex_first_chars, regex_first_chars_from_hir};
pub use hir::{
    ByteRange, CharClass, CodepointRange, Hir, Look, ParseError, ParseOptions, Repetition,
};
pub use info::{EngineSet, QuantifiedClassInfo, RegexInfo};
pub use sets::byteset::ByteSet;
pub use sets::charset::CharSet128;
pub use table_plan::{
    DEAD_STATE, HirValidationError, RegexTablePlan, TablePlanCompileError, TablePlanError,
    TablePlanOptions,
};
