//! The legacy runtime's expected set under `diagnostics` (sk-v27 LW3.COMP-4b):
//! `ParserState::expected`, and so `ParseError::expected`, is sorted by the
//! labels' bytes and holds each label once, by construction.
#![cfg(feature = "diagnostics")]

use parse_that::*;

fn expected_of<'a>(parser: Parser<'a, &'a str>, input: &'a str) -> Vec<String> {
    let error = parser
        .parse_or_error(input)
        .expect_err("the input is rejected");
    error.expected
}

#[test]
fn failure_reports_sorted_expected_set() {
    let forward = expected_of(string("a").or(string("b")), "x");
    let backward = expected_of(string("b").or(string("a")), "x");
    assert_eq!(forward, vec!["\"a\"".to_string(), "\"b\"".to_string()]);
    assert_eq!(backward, forward);
}

#[test]
fn a_label_met_twice_is_kept_once_in_order() {
    let twice = expected_of(
        string("c").or(string("a")).or(string("c")).or(string("b")),
        "x",
    );
    assert_eq!(
        twice,
        vec![
            "\"a\"".to_string(),
            "\"b\"".to_string(),
            "\"c\"".to_string()
        ]
    );
}

#[test]
fn the_state_set_is_sorted_as_it_grows() {
    let p = string("d").or(string("b")).or(string("c")).or(string("a"));
    let (result, state) = p.parse_return_state("x");
    assert!(result.is_none());
    let seen: Vec<&str> = state.expected.iter().copied().collect();
    let mut sorted = seen.clone();
    sorted.sort_unstable();
    sorted.dedup();
    assert_eq!(seen, sorted);
    assert_eq!(seen.len(), 4);
}
