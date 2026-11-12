//! Regex engine for parser generators: HIR, NFA→DFA compilation, e-graph
//! simplification, structural classification.
//!
//! This crate is the regex engine parse-that and the parser generators built
//! on it share.
//! No dependencies on parser combinators or grammar infrastructure.
//!
//! ## Modules
//! - [`hir`] — High-level intermediate representation + hand-written parser
//! - [`automata`] — NFA construction, DFA compilation, acceleration detection
//! - [`sets`] — Byte set and character set data structures
//! - [`unicode`] — Unicode general-category property tables
//! - [`utf8`] — Codepoint range → UTF-8 byte sequence expansion
//! - [`lint`] — lints over a pattern's reading (`RX-NOU`)
//! - [`casefold`] — ECMAScript case canonicalization (generated UCD tables)

pub mod algebra;
pub mod automata;
#[rustfmt::skip]
mod case_tables;
pub mod casefold;
pub mod classify;
pub mod egraph;
pub mod first;
pub mod hir;
pub mod info;
pub mod lint;
pub mod path_lexer;
pub mod sets;
pub mod unicode;
pub mod utf8;

// Re-exports for convenience
pub use crate::hir::parser::{parse, parse_with};
pub use automata::accel::{AccelStrategy, StateAccel, detect_accel};
pub use automata::dfa::{AcceptWhen, Dfa, DfaError, DfaOptions, DfaState};
pub use automata::nfa::{DEAD, Nfa, StateId};
pub use classify::{RegexClass, classify_regex, classify_regex_from_hir};
pub use first::{regex_first_chars, regex_first_chars_from_hir};
pub use hir::{
    ByteRange, CharClass, CodepointRange, Hir, Look, ParseError, ParseOptions, Repetition,
};
pub use info::{EngineSet, QuantifiedClassInfo, RegexInfo};
pub use path_lexer::{PathLexError, PathToken, PathTokenKind, lex_path};
pub use sets::byteset::ByteSet;
pub use sets::charset::CharSet128;
