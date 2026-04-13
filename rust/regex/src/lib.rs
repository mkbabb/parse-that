//! Bespoke regex engine: HIR, NFA→DFA compilation, structural classification.
//!
//! This crate provides the pure regex engine used by parse-that and bbnf.
//! No dependencies on parser combinators or grammar infrastructure.
//!
//! ## Modules
//! - [`hir`] — High-level intermediate representation + hand-written parser
//! - [`automata`] — NFA construction, DFA compilation, acceleration detection
//! - [`sets`] — Byte set and character set data structures
//! - [`unicode`] — Unicode general-category property tables
//! - [`utf8`] — Codepoint range → UTF-8 byte sequence expansion

pub mod algebra;
pub mod automata;
pub mod classify;
pub mod egraph;
pub mod first;
pub mod hir;
pub mod info;
pub mod sets;
pub mod unicode;
pub mod utf8;

// Re-exports for convenience
pub use automata::accel::{AccelStrategy, StateAccel, detect_accel};
pub use automata::dfa::{Dfa, DfaOptions, DfaState};
pub use automata::nfa::{Nfa, StateId, DEAD};
pub use hir::{ByteRange, CharClass, CodepointRange, Hir, Look, ParseError, ParseOptions, Repetition};
pub use crate::hir::parser::{parse, parse_with};
pub use sets::byteset::ByteSet;
pub use sets::charset::CharSet128;
pub use classify::{RegexClass, classify_regex, classify_regex_from_hir};
pub use first::{regex_first_chars, regex_first_chars_from_hir};
pub use info::{EngineSet, QuantifiedClassInfo, RegexInfo};
