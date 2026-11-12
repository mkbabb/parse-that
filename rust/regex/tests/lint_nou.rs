//! sk-v27 LW3.RX-1d: the `RX-NOU` lint. A pattern written without `u`/`v`
//! is read with u/v semantics; the lint names the patterns whose reading
//! differs without the flag (a class that can match a surrogate code unit).

use parse_that_regex::lint::{RX_NOU, reads_differently_without_u};
use parse_that_regex::parse;

fn lints(pattern: &str) -> bool {
    reads_differently_without_u(&parse(pattern).expect("pattern parses"))
}

#[test]
fn the_id_is_general() {
    assert_eq!(RX_NOU, "RX-NOU");
}

#[test]
fn a_class_that_can_match_a_surrogate_unit_is_linted() {
    for pattern in [
        r#"[^"]"#,
        ".",
        r"\S",
        r"\W+",
        r"[\D]",
        r"[\u0080-￿]",
        "[😀]",
        r"[\u{10000}-\u{10FFFF}]",
        r#""(?:\\.|[^"\\])*""#,
        r"(?s).",
    ] {
        assert!(lints(pattern), "{pattern:?} reads differently without u");
    }
}

#[test]
fn a_pattern_that_reads_the_same_is_not_linted() {
    for pattern in [
        "abc",
        r"\d+",
        r"\w*",
        r"\s*",
        "[é]",
        r"[ ]",
        r"[a-zÀ-ÿ]+",
        "😀",
    ] {
        assert!(!lints(pattern), "{pattern:?} reads the same without u");
    }
}
