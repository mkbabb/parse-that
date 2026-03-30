//! Bespoke regex engine: NFA→DFA compilation with SIMD-accelerated matching.
//!
//! Compiles regex patterns to guaranteed-linear-time DFAs with:
//! - First-class Unicode support via UTF-8 byte automata
//! - Byte equivalence classes for compact transition tables
//! - Self-loop state acceleration (memchr, SIMD nibble LUT)
//! - Hopcroft DFA minimization
//!
//! Designed as a compile-time regex compiler for parser generators (bbnf-lang)
//! and as a runtime regex engine for parse-that's SpanParser.

pub mod accel;
pub mod byteset;
pub mod dfa;
pub mod equiv;
pub mod nfa;

pub use accel::{AccelStrategy, StateAccel, detect_accel};
pub use byteset::ByteSet;
pub use dfa::{Dfa, DfaOptions, DfaState};
pub use nfa::{Nfa, StateId, DEAD};
