//! Bootstrap crate: generates a self-hosted regex parser from regex.bbnf.
//!
//! This crate is a permanent workspace member used solely for code generation.
//! It is never published — it exists only to produce `generated.rs`.
//!
//! Regenerate: `scripts/bootstrap-regex.sh`

use bbnf_derive::Parser;

#[derive(Parser)]
#[parser(path = "regex.bbnf", slab)]
pub struct RegexParser;

/// Parse a regex pattern using the generated parser.
/// Returns `true` if the parse consumed the entire input.
pub fn parse_generated(pattern: &str) -> bool {
    let ctx = __RegexParserEnumCtx::with_capacity(pattern.len().max(64));
    let parser = RegexParser::regex();
    let (result, state) = parser.parse_return_state_with_context(pattern, &ctx);
    result.is_some() && state.offset >= pattern.len()
}
