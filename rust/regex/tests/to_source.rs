//! sk-v27 LW2.RX-3: `Hir::to_source` as the parser's round-trip oracle.
//!
//! Law 1 (here): for every pattern the parser accepts, among the 171 leaves
//! of `oracle/leaves.tsv` and the patterns of `oracle/smoke.json`,
//! `parse(hir.to_source(flags)) == hir`. The printed text is read back with
//! no inline flags: case folding and dot-all are already in the `Hir`.
//!
//! Law 2 (`oracle/law.mjs`): V8 and JavaScriptCore give the same answer for
//! the source and for the printed text on every smoke input.
//! `print_smoke_corpus` writes the printed corpus that law reads.
//!
//! A leaf's ECMAScript flags reach the parser as an inline prefix: `i` as
//! `(?i)`, `s` as `(?s)`. A pattern the parser rejects has no `Hir`, so it is
//! counted and named, not printed.

use std::path::Path;

use parse_that_regex::parse;

struct Case {
    id: String,
    pattern: String,
    flags: String,
}

fn oracle_dir() -> &'static Path {
    Path::new(concat!(env!("CARGO_MANIFEST_DIR"), "/oracle"))
}

fn leaves() -> Vec<Case> {
    let text = std::fs::read_to_string(oracle_dir().join("leaves.tsv")).expect("leaves.tsv");
    text.lines()
        .skip(1)
        .map(|line| {
            let cols: Vec<&str> = line.split('\t').collect();
            Case {
                id: format!("{}#{}", cols[0], cols[1]),
                pattern: cols[2].to_string(),
                flags: cols[3].to_string(),
            }
        })
        .collect()
}

fn smoke() -> serde_json::Value {
    let text = std::fs::read_to_string(oracle_dir().join("smoke.json")).expect("smoke.json");
    serde_json::from_str(&text).expect("smoke.json is JSON")
}

fn smoke_cases(doc: &serde_json::Value) -> Vec<Case> {
    doc["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .map(|c| Case {
            id: c["id"].as_str().expect("id").to_string(),
            pattern: c["pattern"].as_str().expect("pattern").to_string(),
            flags: c["flags"].as_str().unwrap_or("").to_string(),
        })
        .collect()
}

fn with_flags(case: &Case) -> String {
    let mut prefix = String::new();
    if case.flags.contains('i') {
        prefix.push_str("(?i)");
    }
    if case.flags.contains('s') {
        prefix.push_str("(?s)");
    }
    prefix + &case.pattern
}

#[test]
fn round_trip_every_accepted_pattern() {
    let doc = smoke();
    let mut cases = leaves();
    assert_eq!(cases.len(), 171, "115 value.js leaves plus the sk-v24 56");
    cases.extend(smoke_cases(&doc));

    let mut accepted = 0;
    let mut rejected = Vec::new();
    let mut broken = Vec::new();
    for case in &cases {
        let Ok(hir) = parse(&with_flags(case)) else {
            rejected.push(case.id.as_str());
            continue;
        };
        accepted += 1;
        let printed = hir.to_source(&case.flags);
        match parse(&printed) {
            Ok(again) if again == hir => {}
            Ok(again) => broken.push(format!(
                "{}: {:?} printed {:?} reads back as a different Hir\n  {hir:?}\n  {again:?}",
                case.id, case.pattern, printed
            )),
            Err(err) => broken.push(format!(
                "{}: {:?} printed {:?} does not parse: {err}",
                case.id, case.pattern, printed
            )),
        }
    }
    eprintln!(
        "rx3 round trip: {} patterns, {accepted} accepted, {} rejected, {} broken",
        cases.len(),
        rejected.len(),
        broken.len()
    );
    eprintln!("rx3 rejected: {rejected:?}");
    assert!(broken.is_empty(), "{}", broken.join("\n"));
}

/// Writes the smoke corpus with each accepted pattern replaced by its printed
/// text (rejected patterns are left out) to `$RX3_PRINTED`. Runs only when
/// that variable is set.
#[test]
fn print_smoke_corpus() {
    let Ok(out) = std::env::var("RX3_PRINTED") else {
        return;
    };
    let doc = smoke();
    let mut printed_cases = Vec::new();
    for c in doc["cases"].as_array().expect("cases") {
        let case = Case {
            id: c["id"].as_str().expect("id").to_string(),
            pattern: c["pattern"].as_str().expect("pattern").to_string(),
            flags: c["flags"].as_str().unwrap_or("").to_string(),
        };
        if let Ok(hir) = parse(&with_flags(&case)) {
            let mut printed = c.clone();
            printed["pattern"] = serde_json::Value::String(hir.to_source(&case.flags));
            printed_cases.push(printed);
        }
    }
    let corpus = serde_json::json!({
        "name": "sk-v27-LW2-RX3-printed",
        "note": "LW2.RX-3: the smoke corpus with every accepted pattern replaced by Hir::to_source of its parse; rejected patterns are absent.",
        "cases": printed_cases,
    });
    std::fs::write(
        out,
        serde_json::to_string_pretty(&corpus).expect("json") + "\n",
    )
    .expect("write printed corpus");
}
