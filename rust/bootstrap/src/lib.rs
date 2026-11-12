//! Bootstrap diagnostic crate: thin re-export of `parse_that::regex`'s
//! self-hosted parser surface, preserving the `regex_parse` divan bench.
//!
//! Earlier, this crate carried a derive attribute on a `RegexParser`
//! marker; `cargo expand -p regex-bootstrap` was post-processed by
//! `scripts/bootstrap-regex.sh` into `parse_that/src/regex/generated.rs`.
//!
//! The derive host is retired upstream (the parser generator's proc-macro
//! crate is gone). The generator's regen step emits the regex parser, which
//! lives directly in `parse_that::regex::generated`. This crate retires its
//! derive-host role and re-exports the canonical surface so
//! `benches/regex_parse.rs` (and any external consumer of
//! `regex_bootstrap::parse_generated`) keeps resolving without a registry
//! edge.
//!
//! The generator's own bootstrap crate is the same shape: one re-export of
//! its emitted parser.

pub use parse_that::regex::generated::{RegexParser, parse_generated};

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
