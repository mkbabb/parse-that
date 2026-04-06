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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_bounded_repetition() {
        assert!(parse_generated("[0-9]{3,5}"), "should parse [0-9]{{3,5}}");
    }

    #[test]
    fn parse_quantifiers() {
        assert!(parse_generated("a*"));
        assert!(parse_generated("a+"));
        assert!(parse_generated("a?"));
        assert!(parse_generated("a*?"));
        assert!(parse_generated("a{3}"));
        assert!(parse_generated("a{3,}"));
        assert!(parse_generated("a{3,5}"));
    }

    #[test]
    fn parse_comprehensive_patterns() {
        let patterns = &[
            r"[a-z]+",
            r"\d+",
            r"(?s).",
            r"[a-zA-Z_][\w-]*",
            r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?",
            r#""(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*""#,
            r"(?s)(?:\s|/\*.*?\*/)*",
            r"[0-9a-fA-F]{3,8}",
            r"(?i)hello",
            "",
        ];
        for &p in patterns {
            assert!(parse_generated(p), "should parse {:?}", p);
        }
    }
}
