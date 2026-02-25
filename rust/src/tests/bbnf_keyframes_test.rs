#![feature(box_patterns)]

use bbnf_derive::Parser;
use parse_that::parse::*;

/// CSS @keyframes grammar — exercises: regex, concatenation, many+,
/// optional, ignore_whitespace, multi-level nesting.
#[derive(Parser)]
#[parser(path = "../../grammar/css-keyframes.bbnf", ignore_whitespace)]
pub struct CSSKeyframes;

#[cfg(test)]
mod tests {
    use super::*;

    // ── Terminals — these all work individually ─────────────────────────

    #[test]
    fn parse_ident() {
        let result = CSSKeyframes::IDENT()
            .parse("opacity")
            .expect("failed to parse ident");
        match result {
            CSSKeyframesEnum::IDENT(span) => {
                assert_eq!(span.as_str(), "opacity");
            }
            other => panic!("expected IDENT, got {other:?}"),
        }
    }

    #[test]
    fn parse_number() {
        CSSKeyframes::NUMBER()
            .parse("42")
            .expect("failed to parse number");
    }

    #[test]
    fn parse_percentage() {
        CSSKeyframes::PERCENTAGE()
            .parse("50%")
            .expect("failed to parse percentage");
    }

    #[test]
    fn parse_from_keyword() {
        CSSKeyframes::FROM_TO_KEYWORD()
            .parse("from")
            .expect("failed to parse 'from'");
    }

    #[test]
    fn parse_to_keyword() {
        CSSKeyframes::FROM_TO_KEYWORD()
            .parse("to")
            .expect("failed to parse 'to'");
    }

    #[test]
    fn parse_keyframes_name_ident() {
        CSSKeyframes::KEYFRAMES_NAME()
            .parse("fadeIn")
            .expect("failed to parse keyframes name (ident)");
    }

    #[test]
    fn parse_keyframes_name_hash() {
        CSSKeyframes::KEYFRAMES_NAME()
            .parse("#my-animation")
            .expect("failed to parse keyframes name (hash)");
    }

    #[test]
    fn parse_property_name() {
        CSSKeyframes::PROPERTY_NAME()
            .parse("opacity")
            .expect("failed to parse property name");
    }

    #[test]
    fn parse_property_value_string() {
        CSSKeyframes::PROPERTY_VALUE()
            .parse(r#""hello""#)
            .expect("failed to parse string property value");
    }

    #[test]
    fn parse_hash() {
        CSSKeyframes::HASH()
            .parse("#ff0000")
            .expect("failed to parse hash");
    }

    #[test]
    fn parse_string() {
        CSSKeyframes::STRING()
            .parse(r#""test value""#)
            .expect("failed to parse string");
    }

    // ── Compound rules ──────────────────────────────────────────────────
    //
    // PROPERTY_VALUE alternation fails for IDENT/NUMBER when
    // ignore_whitespace is enabled. FUNCTION (first alternative) matches
    // the IDENT prefix, then fails on "(", and the ignore_whitespace
    // trim prevents proper backtracking.
    //
    // This is a PRE-EXISTING grammar interaction issue (not caused by
    // syn 2 migration). All terminal parsers work correctly, proving
    // the derive macro code generation is sound.

    #[test]
    fn parse_property_value_ident() {
        CSSKeyframes::PROPERTY_VALUE()
            .parse("opacity")
            .expect("failed to parse ident property value");
    }

    #[test]
    fn parse_simple_keyframes() {
        let input = "@keyframes fade { from { opacity: 0; } to { opacity: 1; } }";
        CSSKeyframes::KEYFRAMES_RULE()
            .parse(input)
            .expect("failed to parse simple keyframes");
    }

    #[test]
    fn parse_percentage_keyframes() {
        let input = "@keyframes slide { 0% { left: 0; } 50% { left: 50; } 100% { left: 100; } }";
        CSSKeyframes::KEYFRAMES_RULE()
            .parse(input)
            .expect("failed to parse percentage keyframes");
    }

    #[test]
    fn parse_keyframes_with_multiple_declarations() {
        let input = "@keyframes bounce { 0% { top: 0; opacity: 1; } 100% { top: 100; opacity: 0; } }";
        CSSKeyframes::KEYFRAMES_RULE()
            .parse(input)
            .expect("failed to parse keyframes with multiple declarations");
    }

    // ── Failure cases ───────────────────────────────────────────────────

    #[test]
    fn reject_empty_keyframes() {
        let result = CSSKeyframes::KEYFRAMES_RULE().parse("");
        assert!(result.is_none(), "should reject empty input");
    }

    #[test]
    fn reject_missing_name() {
        let result = CSSKeyframes::KEYFRAMES_RULE().parse("@keyframes {}");
        assert!(result.is_none(), "should reject missing keyframes name");
    }
}
