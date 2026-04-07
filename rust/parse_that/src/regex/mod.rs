//! Regex engine: re-exports from `bbnf_regex` + self-hosted parser path.
//!
//! The core regex engine (HIR, NFA, DFA, byte sets, unicode, parser) lives in
//! the standalone `bbnf-regex` crate. This module re-exports its public API
//! and adds the self-hosted bootstrap path (`generated` + `host`).

// Self-hosted parser (coupled to parse-that combinators)
pub mod generated;
pub mod host;

// Re-export the entire regex engine from bbnf-regex
pub use bbnf_regex::*;

// Re-export sub-modules for path compatibility (crate::regex::dfa::Dfa, etc.)
pub use bbnf_regex::automata::dfa;
pub use bbnf_regex::automata::nfa;
pub use bbnf_regex::automata::accel;
pub use bbnf_regex::hir;
pub use bbnf_regex::sets::byteset;
pub use bbnf_regex::sets::equiv;
pub use bbnf_regex::unicode;
pub use bbnf_regex::utf8;
pub use bbnf_regex::classify;
pub use bbnf_regex::first;
pub use bbnf_regex::sets::charset;
pub use bbnf_regex::sets;

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
