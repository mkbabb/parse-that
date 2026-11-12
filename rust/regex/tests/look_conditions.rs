//! sk-v27 LW3.RX-1b: `^`, `$`, `\b` and `\B` are conditions of the
//! automaton, not empty strings.
//!
//! `oracle/anchors.json` (27 cases, sticky at the UTF-8 offset `at`) with the
//! V8 + JavaScriptCore answers in `oracle/anchors-answers.json` (both engines
//! agree on 27/27 x 2 reps). Every case must compile and give the oracle's
//! answer: `^` holds only where no byte precedes the start, `$` only at the
//! end of the input, and a word boundary reads the bytes on both sides.

use std::path::Path;

use parse_that_regex::Dfa;

fn oracle(name: &str) -> serde_json::Value {
    let path = Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/oracle")).join(name);
    serde_json::from_str(&std::fs::read_to_string(path).expect(name)).expect("json")
}

fn engine_pattern(pattern: &str, flags: &str) -> String {
    let mut p = String::new();
    if flags.contains('i') {
        p.push_str("(?i)");
    }
    if flags.contains('s') {
        p.push_str("(?s)");
    }
    p + pattern
}

#[test]
fn anchors_and_boundaries_reproduce_the_oracle() {
    let corpus = oracle("anchors.json");
    let answers = oracle("anchors-answers.json");
    let mut agreed = 0;
    let mut wrong = Vec::new();
    for case in corpus["cases"].as_array().expect("cases") {
        let id = case["id"].as_str().expect("id");
        let pattern = engine_pattern(
            case["pattern"].as_str().expect("pattern"),
            case["flags"].as_str().expect("flags"),
        );
        let input = case["input"].as_str().expect("input").as_bytes();
        let at = case["at"].as_u64().unwrap_or(0) as usize;
        let answer = &answers[id];
        let expected = match answer["status"].as_str() {
            Some("MATCH") => Some(answer["end8"].as_u64().expect("end8") as usize),
            Some("NO_MATCH") => None,
            other => panic!("{id}: oracle status {other:?}"),
        };
        match Dfa::compile(&pattern) {
            None => wrong.push(format!("{id}: {pattern} refused")),
            Some(dfa) => {
                let got = dfa.find_at(input, at);
                if got == expected {
                    agreed += 1;
                } else {
                    wrong.push(format!("{id}: {pattern} at {at}: oracle {expected:?}, engine {got:?}"));
                }
            }
        }
    }
    println!("anchors: {agreed} of {} agree", agreed + wrong.len());
    for w in &wrong {
        println!("DIFFER {w}");
    }
    assert!(wrong.is_empty(), "{} of the anchor cases differ", wrong.len());
}
