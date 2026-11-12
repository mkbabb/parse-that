//! sk-v27 LW3.RX-1a: the oracle leaf corpus read through the engine.
//!
//! `oracle/leaf-corpus.json` holds 171 leaves (115 from value.js's grammars,
//! 56 from the sk-v24 corpus) and 21,722 cases, each a sticky match at offset
//! 0 with the leaf's own flags, answered by V8 and JavaScriptCore agreeing
//! (two reps each). The DFA tier is the 133 leaves without lookaround; the
//! lookaround tier is never pooled with it (C1-9).
//!
//! Per leaf the verdict is ENGINE when any compared case differs or the
//! engine refuses a pattern the oracle compiles, else AGREE. A case whose
//! oracle match ends inside a surrogate pair (non-`u`, astral input) has no
//! UTF-8 image and is not compared (ENCODING-EXCLUDED); a SPEC-AMBIGUITY
//! case is not compared either (the corpus has none).
//!
//! The leaves still owed by a later unit are named here with their owner;
//! the test fails on an ENGINE leaf that is not named and on a named leaf
//! that now agrees (the list may only shrink).

use std::path::Path;

use parse_that_regex::Dfa;

/// DFA-tier leaves whose divergence belongs to the front end's u/v
/// semantics (LW3.RX-1d): `\s` without U+00A0 (11 leaves) and the non-`u`
/// class and negated-class readings of leaf #8.
const OWED_TO_RX1D: &[&str] = &[
    "value.js@8d7bb5b8#8",
    "value.js@8d7bb5b8#10",
    "value.js@8d7bb5b8#13",
    "value.js@8d7bb5b8#17",
    "value.js@8d7bb5b8#59",
    "value.js@8d7bb5b8#60",
    "value.js@8d7bb5b8#69",
    "value.js@8d7bb5b8#70",
    "value.js@8d7bb5b8#73",
    "value.js@8d7bb5b8#86",
    "value.js@8d7bb5b8#89",
    "sk-v24-56#50",
];

/// The pattern as the engine's front end reads it: ECMAScript `i` and `s`
/// become inline flags.
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

struct Verdict {
    id: String,
    tier: String,
    engine: bool,
    compared: usize,
    differing: usize,
    excluded: usize,
    first: Option<String>,
}

fn read_corpus() -> Vec<Verdict> {
    let path = Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/oracle/leaf-corpus.json"));
    let doc: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(path).expect("leaf-corpus.json"))
            .expect("json");
    let mut out = Vec::new();
    for leaf in doc["leaves"].as_array().expect("leaves") {
        let id = leaf["id"].as_str().expect("id").to_string();
        let tier = leaf["tier"].as_str().expect("tier").to_string();
        let pattern = engine_pattern(
            leaf["pattern"].as_str().expect("pattern"),
            leaf["flags"].as_str().expect("flags"),
        );
        let dfa = Dfa::compile(&pattern);
        let mut v = Verdict {
            id,
            tier,
            engine: false,
            compared: 0,
            differing: 0,
            excluded: 0,
            first: None,
        };
        let Some(dfa) = dfa else {
            // Every leaf of the corpus compiles under the oracle.
            v.engine = true;
            v.first = Some("refused".into());
            out.push(v);
            continue;
        };
        for (k, case) in leaf["cases"].as_array().expect("cases").iter().enumerate() {
            let input = case[0].as_str().expect("input");
            let want = match &case[1] {
                serde_json::Value::Null => None,
                serde_json::Value::Number(n) => Some(n.as_u64().expect("end8") as usize),
                serde_json::Value::String(s) if s == "ENC" || s == "AMB" => {
                    v.excluded += 1;
                    continue;
                }
                other => panic!("{}: case {k}: answer {other:?}", v.id),
            };
            v.compared += 1;
            let got = dfa.find_at(input.as_bytes(), 0);
            if got != want {
                v.differing += 1;
                v.engine = true;
                if v.first.is_none() {
                    v.first = Some(format!("case {k} {input:?}: oracle {want:?} engine {got:?}"));
                }
            }
        }
        out.push(v);
    }
    out
}

#[test]
fn dfa_tier_agrees_with_v8_and_jsc() {
    let verdicts = read_corpus();
    let dfa: Vec<&Verdict> = verdicts.iter().filter(|v| v.tier == "DFA").collect();
    assert_eq!(dfa.len(), 133, "the DFA tier is 133 leaves");
    let agree = dfa.iter().filter(|v| !v.engine).count();
    let cases: usize = dfa.iter().map(|v| v.compared).sum();
    let differing: usize = dfa.iter().map(|v| v.differing).sum();
    let excluded: usize = dfa.iter().map(|v| v.excluded).sum();
    println!(
        "oracle leaf corpus, DFA tier: {} leaves, AGREE {agree}, ENGINE {}; cases compared {cases}, differing {differing}, not compared {excluded}",
        dfa.len(),
        dfa.len() - agree
    );
    let mut unowned = Vec::new();
    for v in dfa.iter().filter(|v| v.engine) {
        let owed = OWED_TO_RX1D.contains(&v.id.as_str());
        println!(
            "ENGINE {} ({} of {} cases){} first: {}",
            v.id,
            v.differing,
            v.compared,
            if owed { " [owed: LW3.RX-1d]" } else { "" },
            v.first.as_deref().unwrap_or("-")
        );
        if !owed {
            unowned.push(v.id.clone());
        }
    }
    let stale: Vec<&&str> = OWED_TO_RX1D
        .iter()
        .filter(|id| dfa.iter().any(|v| v.id == **id && !v.engine))
        .collect();
    assert!(
        unowned.is_empty(),
        "ENGINE leaves no unit owns: {unowned:?}"
    );
    assert!(
        stale.is_empty(),
        "named as owed but now AGREE (shrink the list): {stale:?}"
    );
    assert!(agree >= 133 - OWED_TO_RX1D.len());
}
