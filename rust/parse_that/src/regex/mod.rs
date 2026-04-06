//! Bespoke regex engine: parsing, NFA→DFA compilation, SIMD-accelerated matching.
//!
//! - **hir** — High-level intermediate representation (Hir, CharClass, ByteRange, etc.)
//! - **unicode** — Unicode general-category property tables
//! - **parser** — Hand-written recursive descent regex parser (primary API)
//! - **generated** — Auto-generated slab parser from bootstrap/regex.bbnf
//! - **host** — Semantic fold: generated AST → Hir
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
pub mod generated;
pub mod hir;
pub mod host;
pub mod nfa;
pub mod parser;
pub mod unicode;
pub mod utf8;

pub use accel::{AccelStrategy, StateAccel, detect_accel};
pub use byteset::ByteSet;
pub use dfa::{Dfa, DfaOptions, DfaState};
pub use hir::{ByteRange, CharClass, CodepointRange, Hir, Look, ParseError, ParseOptions, Repetition};
pub use nfa::{Nfa, StateId, DEAD};
pub use parser::{parse, parse_with};

/// Parse a regex pattern using the self-hosted generated parser + host fold.
///
/// This is the self-hosted path: generated parser (from bootstrap/regex.bbnf)
/// produces a typed AST, then `host::lower` folds it into `Hir`.
///
/// Available for benchmarking and verification against the primary `parse()`.
pub fn parse_generated(pattern: &str) -> Result<Hir, ParseError> {
    parse_generated_with(pattern, &ParseOptions::default())
}

/// Self-hosted parse with explicit options.
pub fn parse_generated_with(pattern: &str, opts: &ParseOptions) -> Result<Hir, ParseError> {
    let ctx = generated::__RegexParserEnumCtx::with_capacity(pattern.len().max(64));
    let parser_fn = generated::RegexParser::regex();
    let (result, state) = parser_fn.parse_return_state_with_context(pattern, &ctx);
    let ast = result.ok_or_else(|| ParseError {
        message: format!("regex parse failed at offset {}", state.offset),
        offset: state.offset,
    })?;
    if state.offset < pattern.len() {
        return Err(ParseError {
            message: format!(
                "unexpected character '{}' at position {}",
                pattern.as_bytes()[state.offset] as char,
                state.offset
            ),
            offset: state.offset,
        });
    }
    host::lower(&ast, pattern, opts)
}
