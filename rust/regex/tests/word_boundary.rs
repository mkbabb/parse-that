//! sk-v27 A-9 (S12-P4-2), before LW2.RX-2 takes the Hir fingerprint: `\b`
//! and `\B` outside a class are the ECMAScript word-boundary assertions over
//! the ASCII word set, never backspace; inside a class `\b` is backspace.
//!
//! The expected values are the V8+JSC oracle's (`oracle/wordboundary.json`,
//! answers in `oracle/wordboundary-answers.json`, both engines agreeing on
//! 15/15 cases ×2 reps). The in-house byte DFA carries no look-behind, so it
//! must refuse a pattern with a word boundary; where it compiles a pattern,
//! its answer must equal the oracle's. It never reads `\b` as empty.

use std::path::Path;

use parse_that_regex::automata::dfa::Dfa;
use parse_that_regex::hir::{ByteRange, CharClass, Hir, Look};
use parse_that_regex::parse;

fn oracle(name: &str) -> serde_json::Value {
    let path = Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/oracle")).join(name);
    serde_json::from_str(&std::fs::read_to_string(path).expect(name)).expect("json")
}

#[test]
fn word_boundary_outside_a_class_is_an_assertion() {
    assert_eq!(
        parse(r"\bfoo").expect(r"\bfoo parses"),
        Hir::Concat(vec![
            Hir::Look(Look::WordBoundary),
            Hir::Literal(b"f".to_vec()),
            Hir::Literal(b"o".to_vec()),
            Hir::Literal(b"o".to_vec())
        ])
    );
    assert_eq!(
        parse(r"\B").expect(r"\B parses"),
        Hir::Look(Look::NotWordBoundary)
    );
    assert_eq!(
        parse(r"a\Bb").expect(r"a\Bb parses"),
        Hir::Concat(vec![
            Hir::Literal(b"a".to_vec()),
            Hir::Look(Look::NotWordBoundary),
            Hir::Literal(b"b".to_vec())
        ])
    );
}

#[test]
fn backspace_inside_a_class_is_unchanged() {
    assert_eq!(
        parse(r"[\b]").expect(r"[\b] parses"),
        Hir::Class(CharClass::Bytes {
            ranges: vec![ByteRange::new(0x08, 0x08)],
            negated: false,
        })
    );
}

#[test]
fn word_boundary_round_trips_through_to_source() {
    for pattern in [
        r"\bfoo",
        r"foo\b",
        r"a\Bb",
        r"\b_9\b",
        r"(?:\b|x)+",
        r"[\b]\B",
    ] {
        let hir = parse(pattern).expect(pattern);
        let printed = hir.to_source("");
        let again = parse(&printed).unwrap_or_else(|e| panic!("{pattern} printed {printed}: {e}"));
        assert_eq!(again, hir, "{pattern} printed {printed}");
    }
}

#[test]
fn byte_dfa_refuses_or_agrees_with_the_oracle() {
    let corpus = oracle("wordboundary.json");
    let answers = oracle("wordboundary-answers.json");
    let mut refused = 0;
    let mut agreed = 0;
    for case in corpus["cases"].as_array().expect("cases") {
        let id = case["id"].as_str().expect("id");
        let pattern = case["pattern"].as_str().expect("pattern");
        let input = case["input"].as_str().expect("input").as_bytes();
        let at = case["at"].as_u64().unwrap_or(0) as usize;
        let answer = &answers[id];
        let expected = match answer["status"].as_str() {
            Some("MATCH") => Some(answer["end8"].as_u64().expect("end8") as usize),
            Some("NO_MATCH") => None,
            other => panic!("{id}: oracle status {other:?}"),
        };
        let has_look = matches!(
            parse(pattern),
            Ok(ref h) if format!("{h:?}").contains("WordBoundary")
        );
        match Dfa::compile(pattern) {
            None => {
                assert!(has_look, "{id}: {pattern} refused without a word boundary");
                refused += 1;
            }
            Some(dfa) => {
                assert!(
                    !has_look,
                    "{id}: {pattern} compiled a word boundary as empty"
                );
                assert_eq!(dfa.find_at(input, at), expected, "{id}: {pattern}");
                agreed += 1;
            }
        }
    }
    assert_eq!((refused, agreed), (13, 2));
}
