//! sk-v27 LW3.RX-1a / RX-1d: the oracle leaf corpus read through the engine.
//!
//! `oracle/leaf-corpus.json` holds 171 leaves (115 from value.js's grammars,
//! 56 from the sk-v24 corpus) and 21,722 cases, each a sticky match at offset
//! 0 with the leaf's own flags, answered by V8 and JavaScriptCore agreeing
//! (two reps each). Each case also carries the answer for the leaf read with
//! `u` (the canonical reading; ECMAScript non-`u` leaves are read as `u`,
//! OR-1). The DFA tier is the 133 leaves without lookaround; the lookaround
//! tier is never pooled with it (C1-9).
//!
//! Every case is classed by rule, in this order, never by hand:
//!
//! - **ENCODING-EXCLUDED**: the leaf's own (non-`u`) oracle match ends inside
//!   a surrogate pair, which has no UTF-8 image.
//! - **AGREE**: the engine gives the leaf's own oracle answer.
//! - **DIALECT-EXCLUDED**: the leaf has no `u`/`v` flag, the oracle's answer
//!   for the leaf read with `u` differs from its non-`u` answer, and the
//!   engine gives the `u` answer (the engine reads every leaf as `u`; the
//!   leaf is linted `RX-NOU`).
//! - **ENGINE**: anything else. The gate is 0 ENGINE cases.
//!
//! A SPEC-AMBIGUITY case is not compared (the corpus has none).

use std::path::Path;

use parse_that_regex::Dfa;

/// DFA-tier leaves whose divergence a later unit owns. Empty since
/// LW3.RX-1d; the list may only shrink.
const OWED: &[&str] = &[];

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

#[derive(Default)]
struct Verdict {
    id: String,
    tier: String,
    engine: bool,
    compared: usize,
    differing: usize,
    encoding: usize,
    dialect: usize,
    first: Option<String>,
}

enum Want {
    End(Option<usize>),
    Encoding,
    Ambiguous,
    Syntax,
}

fn want(v: &serde_json::Value) -> Want {
    match v {
        serde_json::Value::Null => Want::End(None),
        serde_json::Value::Number(n) => Want::End(Some(n.as_u64().expect("end8") as usize)),
        serde_json::Value::String(s) if s == "ENC" => Want::Encoding,
        serde_json::Value::String(s) if s == "AMB" => Want::Ambiguous,
        serde_json::Value::String(s) if s == "SYN" => Want::Syntax,
        other => panic!("answer {other:?}"),
    }
}

fn read_corpus() -> Vec<Verdict> {
    let path = Path::new(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/oracle/leaf-corpus.json"
    ));
    let doc: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(path).expect("leaf-corpus.json"))
            .expect("json");
    let mut out = Vec::new();
    for leaf in doc["leaves"].as_array().expect("leaves") {
        let flags = leaf["flags"].as_str().expect("flags");
        let non_u = !flags.contains('u') && !flags.contains('v');
        let pattern = engine_pattern(leaf["pattern"].as_str().expect("pattern"), flags);
        let mut v = Verdict {
            id: leaf["id"].as_str().expect("id").to_string(),
            tier: leaf["tier"].as_str().expect("tier").to_string(),
            ..Verdict::default()
        };
        let Some(dfa) = Dfa::compile(&pattern) else {
            // Every leaf of the corpus compiles under the oracle.
            v.engine = true;
            v.first = Some("refused".into());
            out.push(v);
            continue;
        };
        for (k, case) in leaf["cases"].as_array().expect("cases").iter().enumerate() {
            let input = case[0].as_str().expect("input");
            let own = match want(&case[1]) {
                Want::End(e) => e,
                Want::Encoding => {
                    v.encoding += 1;
                    continue;
                }
                Want::Ambiguous => continue,
                Want::Syntax => panic!("{}: case {k}: the leaf is valid JS", v.id),
            };
            v.compared += 1;
            let got = dfa.find_at(input.as_bytes(), 0);
            if got == own {
                continue;
            }
            if non_u
                && let Some(u) = case.get(2)
                && let Want::End(u_end) = want(u)
                && u_end != own
                && got == u_end
            {
                v.dialect += 1;
                continue;
            }
            v.differing += 1;
            v.engine = true;
            if v.first.is_none() {
                v.first = Some(format!("case {k} {input:?}: oracle {own:?} engine {got:?}"));
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
    let encoding: usize = dfa.iter().map(|v| v.encoding).sum();
    let dialect: usize = dfa.iter().map(|v| v.dialect).sum();
    println!(
        "oracle leaf corpus, DFA tier: {} leaves, AGREE {agree}, ENGINE {}; cases compared {cases}, ENGINE {differing}, DIALECT-EXCLUDED {dialect}, ENCODING-EXCLUDED {encoding}",
        dfa.len(),
        dfa.len() - agree
    );
    for v in dfa.iter().filter(|v| v.dialect > 0) {
        println!("DIALECT {} ({} cases)", v.id, v.dialect);
    }
    let mut unowned = Vec::new();
    for v in dfa.iter().filter(|v| v.engine) {
        let owed = OWED.contains(&v.id.as_str());
        println!(
            "ENGINE {} ({} of {} cases){} first: {}",
            v.id,
            v.differing,
            v.compared,
            if owed { " [owed]" } else { "" },
            v.first.as_deref().unwrap_or("-")
        );
        if !owed {
            unowned.push(v.id.clone());
        }
    }
    assert!(unowned.is_empty(), "ENGINE leaves no unit owns: {unowned:?}");
    assert_eq!(agree, 133 - OWED.len());
}
