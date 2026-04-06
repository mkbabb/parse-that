//! Bespoke regex engine: parsing, NFA→DFA compilation, SIMD-accelerated matching.
//!
//! - **hir** — High-level intermediate representation (Hir, CharClass, ByteRange, etc.)
//! - **parser** — Regex pattern parser producing Hir
//! - **utf8** — Codepoint range → UTF-8 byte sequence expansion
//! - **nfa** — Thompson NFA construction from Hir
//! - **dfa** — DFA subset construction + Hopcroft minimization
//! - **accel** — Self-loop state acceleration (memchr, SIMD nibble LUT)
//! - **byteset** — Byte set operations for transition predicates
//! - **equiv** — Byte equivalence class computation

pub mod accel;
pub mod byteset;
pub mod dfa;
pub mod equiv;
pub mod hir;
pub mod nfa;
pub mod parser;
pub mod utf8;

pub use accel::{AccelStrategy, StateAccel, detect_accel};
pub use byteset::ByteSet;
pub use dfa::{Dfa, DfaOptions, DfaState};
pub use hir::{ByteRange, CharClass, CodepointRange, Hir, Look, ParseError, ParseOptions, Repetition};
pub use nfa::{Nfa, StateId, DEAD};
pub use parser::{parse, parse_with};
