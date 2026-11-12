//! sk-v27 LW3.RX-1d: a generated corpus over the DFA-tier leaves, and its
//! comparison with the V8 + JavaScriptCore oracle.
//!
//! Modes:
//!   generate <leaf-corpus.json> <cases-per-leaf> <seed> <out.json> <out-u.json>
//!       Per DFA-tier leaf, inputs sampled from the leaf's own `Hir` (each
//!       sample also cut, doubled, extended, and spiced with non-ASCII
//!       scalars: NBSP, the other `\s` members, Latin-1, astral), written as
//!       an oracle corpus twice: with the leaf's flags, and with `u` added
//!       to a leaf without `u`/`v` (the canonical reading).
//!   compare <out.json> <answers.json> <answers-u.json>
//!       Runs every case through the engine and classes it by the rule of
//!       `tests/oracle_leaf_corpus.rs` (ENCODING-EXCLUDED, AGREE,
//!       DIALECT-EXCLUDED, ENGINE). Exit 0 only with 0 ENGINE cases.
//!   fold-generate <cases> <seed> <out.json>
//!       LW3.RX-3: a case-folding corpus. Each case is one scalar `c` as a
//!       pattern (escaped when it is syntax) under `i` or `iu`, on an input
//!       scalar `d`: half the `d` are drawn from `c`'s case class in either
//!       canonicalization, the rest at random (BMP and astral).
//!   fold-compare <out.json> <answers.json>
//!       The engine reads `iu` in Unicode mode and `i` in byte mode (the
//!       non-u canonicalization); every case with an oracle answer must
//!       equal it (a SPEC-AMBIGUITY case, V8 and JSC disagreeing, is listed
//!       and not compared). Exit 0 only with 0 differing cases.
//!
//!
//! Inputs are valid Unicode scalar-value strings; a case is a sticky match
//! at offset 0. The generator is deterministic (SplitMix64 from the seed).

use std::collections::{BTreeMap, HashSet};
use std::fmt::Write as _;

use parse_that_regex::Dfa;
use parse_that_regex::hir::{CharClass, Hir};

struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }
    fn below(&mut self, n: u64) -> u64 {
        if n == 0 { 0 } else { self.next() % n }
    }
}

/// Scalars that separate the u and non-u readings, and the `\s` set.
const SPICE: &[char] = &[
    '\u{A0}',
    '\u{1680}',
    '\u{2000}',
    '\u{2028}',
    '\u{2029}',
    '\u{202F}',
    '\u{205F}',
    '\u{3000}',
    '\u{FEFF}',
    '\u{0B}',
    '\u{0C}',
    '\r',
    '\n',
    '\t',
    ' ',
    'é',
    'É',
    'ſ',
    '\u{212A}',
    'ß',
    'Ω',
    '€',
    '😀',
    '\u{10000}',
    '\u{10FFFF}',
    '\u{FFFF}',
    '\u{80}',
    '\u{FF}',
    'a',
    'Z',
    '0',
    '_',
    '-',
    '.',
    '(',
    ')',
    '"',
    '\'',
    '\\',
    '/',
    '*',
    ';',
    ',',
    '#',
    '%',
    '@',
    '!',
];

fn class_has(class: &CharClass, c: char) -> bool {
    let positive = match class {
        CharClass::Bytes { ranges, .. } => {
            let mut buf = [0u8; 4];
            let first = c.encode_utf8(&mut buf).as_bytes()[0];
            ranges.iter().any(|r| r.start <= first && first <= r.end)
        }
        CharClass::Unicode { ranges, .. } => ranges.iter().any(|r| r.start <= c && c <= r.end),
    };
    positive != class.negated()
}

fn sample_into(hir: &Hir, rng: &mut Rng, out: &mut String, depth: u32) {
    if depth > 40 || out.len() > 200 {
        return;
    }
    match hir {
        Hir::Empty | Hir::Look(_) => {}
        Hir::Literal(bytes) => {
            if let Ok(s) = std::str::from_utf8(bytes) {
                out.push_str(s);
            }
        }
        Hir::Class(class) => {
            let pick = match class {
                CharClass::Bytes {
                    ranges,
                    negated: false,
                } if !ranges.is_empty() => {
                    let r = ranges[rng.below(ranges.len() as u64) as usize];
                    let b = r.start as u64 + rng.below(r.end as u64 - r.start as u64 + 1);
                    if b < 0x80 {
                        Some(b as u8 as char)
                    } else {
                        None
                    }
                }
                CharClass::Unicode {
                    ranges,
                    negated: false,
                } if !ranges.is_empty() => {
                    let r = ranges[rng.below(ranges.len() as u64) as usize];
                    let span = r.end as u64 - r.start as u64 + 1;
                    char::from_u32(r.start as u32 + rng.below(span) as u32)
                }
                _ => None,
            };
            let c = pick.or_else(|| {
                let start = rng.below(SPICE.len() as u64) as usize;
                (0..SPICE.len())
                    .map(|k| SPICE[(start + k) % SPICE.len()])
                    .find(|&c| class_has(class, c))
            });
            if let Some(c) = c {
                out.push(c);
            }
        }
        Hir::Repetition(rep) => {
            let extra = match rep.max {
                Some(max) => (max - rep.min).min(3) as u64,
                None => 3,
            };
            let n = rep.min.min(6) as u64 + rng.below(extra + 1);
            for _ in 0..n {
                sample_into(&rep.sub, rng, out, depth + 1);
            }
        }
        Hir::Group(sub) => sample_into(sub, rng, out, depth + 1),
        Hir::Concat(items) => {
            for item in items {
                sample_into(item, rng, out, depth + 1);
            }
        }
        Hir::Alternation(branches) => {
            let k = rng.below(branches.len() as u64) as usize;
            sample_into(&branches[k], rng, out, depth + 1);
        }
    }
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

/// Spice one sample: a SPICE scalar inserted, appended or substituted.
fn spiced(s: &str, rng: &mut Rng) -> String {
    let chars: Vec<char> = s.chars().collect();
    let c = SPICE[rng.below(SPICE.len() as u64) as usize];
    let at = rng.below(chars.len() as u64 + 1) as usize;
    let mut v = chars.clone();
    match rng.below(3) {
        0 => v.insert(at, c),
        1 if at < v.len() => v[at] = c,
        _ => v.push(c),
    }
    v.into_iter().collect()
}

fn json_str(s: &str) -> String {
    let mut out = String::from("\"");
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            c if (c as u32) < 0x20 || c == '\u{2028}' || c == '\u{2029}' => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

fn read_json(path: &str) -> serde_json::Value {
    serde_json::from_str(&std::fs::read_to_string(path).expect(path)).expect("json")
}

fn generate(leaf_corpus: &str, per_leaf: usize, seed: u64, out: &str, out_u: &str) {
    let doc = read_json(leaf_corpus);
    let mut a = String::from(
        "{\"name\":\"sk-v27-LW3-RX1d-generated\",\"note\":\"LW3.RX-1d generated corpus over the DFA tier, sticky at 0, the leaf's flags.\",\"cases\":[\n",
    );
    let mut b = String::from(
        "{\"name\":\"sk-v27-LW3-RX1d-generated-u\",\"note\":\"LW3.RX-1d generated corpus, u added to every leaf without u/v.\",\"cases\":[\n",
    );
    let mut first = true;
    let mut total = 0usize;
    for (li, leaf) in doc["leaves"].as_array().expect("leaves").iter().enumerate() {
        if leaf["tier"] != "DFA" {
            continue;
        }
        let id = leaf["id"].as_str().unwrap();
        let pattern = leaf["pattern"].as_str().unwrap();
        let flags = leaf["flags"].as_str().unwrap();
        let flags_u = if flags.contains('u') || flags.contains('v') {
            flags.to_string()
        } else {
            format!("{flags}u")
        };
        let Ok(hir) = parse_that_regex::parse(&engine_pattern(pattern, flags)) else {
            continue;
        };
        let mut rng = Rng(seed ^ ((li as u64 + 1) << 32));
        let mut seen = HashSet::new();
        let mut inputs = Vec::new();
        let mut tries = 0;
        while inputs.len() < per_leaf && tries < per_leaf * 20 {
            tries += 1;
            let mut s = String::new();
            sample_into(&hir, &mut rng, &mut s, 0);
            let variant = match rng.below(6) {
                0 => s.clone(),
                1 => spiced(&s, &mut rng),
                2 => format!("{s}{s}"),
                3 => s
                    .chars()
                    .take(s.chars().count().saturating_sub(1))
                    .collect(),
                4 => spiced(&spiced(&s, &mut rng), &mut rng),
                _ => {
                    let c = SPICE[rng.below(SPICE.len() as u64) as usize];
                    format!("{c}{s}")
                }
            };
            if seen.insert(variant.clone()) {
                inputs.push(variant);
            }
        }
        for (j, input) in inputs.iter().enumerate() {
            let sep = if first { "" } else { ",\n" };
            first = false;
            let cid = json_str(&format!("{id}|g{j}"));
            let _ = write!(
                a,
                "{sep}{{\"id\":{cid},\"pattern\":{},\"flags\":{},\"input\":{}}}",
                json_str(pattern),
                json_str(flags),
                json_str(input)
            );
            let _ = write!(
                b,
                "{sep}{{\"id\":{cid},\"pattern\":{},\"flags\":{},\"input\":{}}}",
                json_str(pattern),
                json_str(&flags_u),
                json_str(input)
            );
            total += 1;
        }
    }
    a.push_str("\n]}\n");
    b.push_str("\n]}\n");
    std::fs::write(out, a).expect("write");
    std::fs::write(out_u, b).expect("write");
    println!("generated {total} cases");
}

fn status(ans: &serde_json::Value) -> (&str, Option<usize>) {
    let st = ans["status"].as_str().unwrap_or("?");
    (st, ans["end8"].as_u64().map(|n| n as usize))
}

fn compare(corpus: &str, answers: &str, answers_u: &str) -> bool {
    let corpus = read_json(corpus);
    let answers = read_json(answers);
    let answers_u = read_json(answers_u);
    let mut dfas: BTreeMap<String, Option<Dfa>> = BTreeMap::new();
    let (mut agree, mut enc, mut dialect, mut engine, mut amb) = (0, 0, 0, 0, 0);
    let mut by_leaf: BTreeMap<String, (usize, String)> = BTreeMap::new();
    for case in corpus["cases"].as_array().expect("cases") {
        let id = case["id"].as_str().unwrap();
        let leaf = id.rsplit_once('|').unwrap().0.to_string();
        let pattern = case["pattern"].as_str().unwrap();
        let flags = case["flags"].as_str().unwrap();
        let non_u = !flags.contains('u') && !flags.contains('v');
        let input = case["input"].as_str().unwrap();
        let dfa = dfas
            .entry(leaf.clone())
            .or_insert_with(|| Dfa::compile(&engine_pattern(pattern, flags)));
        let (st, end) = status(&answers[id]);
        let own = match st {
            "MATCH" if end.is_none() => {
                enc += 1;
                continue;
            }
            "MATCH" => end,
            "NO_MATCH" => None,
            "SPEC-AMBIGUITY" => {
                amb += 1;
                continue;
            }
            other => panic!("{id}: oracle status {other}"),
        };
        let got = dfa.as_ref().and_then(|d| d.find_at(input.as_bytes(), 0));
        if dfa.is_some() && got == own {
            agree += 1;
            continue;
        }
        let (ust, uend) = status(&answers_u[id]);
        let u_end = match ust {
            "MATCH" => uend.map(Some),
            "NO_MATCH" => Some(None),
            _ => None,
        };
        if non_u && dfa.is_some() && u_end.is_some_and(|u| u != own && u == got) {
            dialect += 1;
            continue;
        }
        engine += 1;
        let e = by_leaf.entry(leaf).or_insert((0, String::new()));
        if e.0 == 0 {
            e.1 = format!("{input:?}: oracle {own:?} engine {got:?}");
        }
        e.0 += 1;
    }
    println!(
        "generated corpus: {} cases; AGREE {agree}; DIALECT-EXCLUDED {dialect}; ENCODING-EXCLUDED {enc}; SPEC-AMBIGUITY {amb}; ENGINE {engine}",
        agree + dialect + enc + amb + engine
    );
    for (leaf, (n, first)) in &by_leaf {
        println!("ENGINE {leaf} ({n} cases) first: {first}");
    }
    engine == 0
}

fn random_scalar(rng: &mut Rng) -> char {
    loop {
        let cp = match rng.below(4) {
            0 => rng.below(0x250) as u32,
            1 => rng.below(0x3000) as u32,
            2 => rng.below(0x10000) as u32,
            _ => rng.below(0x110000) as u32,
        };
        if let Some(c) = char::from_u32(cp)
            && !c.is_control()
        {
            return c;
        }
    }
}

fn pattern_of(c: char) -> String {
    if "\\^$.|?*+()[]{}/".contains(c) {
        format!("\\{c}")
    } else {
        c.to_string()
    }
}

fn fold_generate(n: usize, seed: u64, out: &str) {
    let mut rng = Rng(seed);
    let mut s = String::from(
        "{\"name\":\"sk-v27-LW3-RX3-fold\",\"note\":\"LW3.RX-3 case-folding corpus: one scalar under i or iu on one scalar.\",\"cases\":[\n",
    );
    // Seeds rich in case classes: Latin, Greek, Cyrillic, the specials.
    let specials = [
        'k',
        'K',
        '\u{212A}',
        's',
        'S',
        '\u{17F}',
        'é',
        'É',
        'ß',
        '\u{1E9E}',
        'µ',
        'Μ',
        'μ',
        'ı',
        'İ',
        'i',
        'I',
        'ǅ',
        'Ω',
        '\u{2126}',
        'ω',
        'σ',
        'ς',
        'Σ',
        '\u{10400}',
        '\u{10428}',
    ];
    for k in 0..n {
        let c = if rng.below(4) == 0 {
            specials[rng.below(specials.len() as u64) as usize]
        } else {
            random_scalar(&mut rng)
        };
        let unicode = rng.below(2) == 0;
        let d = if rng.below(2) == 0 {
            let eq = parse_that_regex::casefold::equivalents(c, rng.below(2) == 0);
            eq[rng.below(eq.len() as u64) as usize]
        } else {
            random_scalar(&mut rng)
        };
        let sep = if k == 0 { "" } else { ",\n" };
        let _ = write!(
            s,
            "{sep}{{\"id\":\"f{k}\",\"pattern\":{},\"flags\":\"{}\",\"input\":{}}}",
            json_str(&pattern_of(c)),
            if unicode { "iu" } else { "i" },
            json_str(&d.to_string())
        );
    }
    s.push_str("\n]}\n");
    std::fs::write(out, s).expect("write");
    println!("fold corpus: {n} cases");
}

fn fold_compare(corpus: &str, answers: &str) -> bool {
    let corpus = read_json(corpus);
    let answers = read_json(answers);
    let (mut agree, mut differ, mut amb) = (0, 0, 0);
    for case in corpus["cases"].as_array().expect("cases") {
        let id = case["id"].as_str().unwrap();
        let unicode = case["flags"].as_str().unwrap().contains('u');
        let pattern = format!("(?i){}", case["pattern"].as_str().unwrap());
        let input = case["input"].as_str().unwrap();
        let (st, end) = status(&answers[id]);
        let want = match st {
            "MATCH" => end,
            "NO_MATCH" => None,
            "SPEC-AMBIGUITY" => {
                // V8 and JSC disagree: no oracle answer, so not compared
                // (the leaf corpus's rule); each is listed.
                amb += 1;
                println!(
                    "SPEC-AMBIGUITY {id} /{}/{} on {input:?}",
                    case["pattern"].as_str().unwrap(),
                    case["flags"].as_str().unwrap()
                );
                continue;
            }
            other => panic!("{id}: {other}"),
        };
        let opts = parse_that_regex::DfaOptions {
            unicode,
            ..parse_that_regex::DfaOptions::default()
        };
        let got = Dfa::compile_with(&pattern, &opts).and_then(|d| d.find_at(input.as_bytes(), 0));
        if got == want {
            agree += 1;
        } else {
            differ += 1;
            if differ <= 20 {
                println!(
                    "DIFFER {id} /{}/{} on {input:?}: oracle {want:?} engine {got:?}",
                    case["pattern"].as_str().unwrap(),
                    case["flags"].as_str().unwrap()
                );
            }
        }
    }
    println!(
        "fold corpus: {} cases; agree {agree}; differ {differ}; spec-ambiguity {amb}",
        agree + differ + amb
    );
    differ == 0
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    match args.get(1).map(String::as_str) {
        Some("generate") => generate(
            &args[2],
            args[3].parse().expect("cases per leaf"),
            args[4].parse().expect("seed"),
            &args[5],
            &args[6],
        ),
        Some("fold-generate") => fold_generate(
            args[2].parse().expect("cases"),
            args[3].parse().expect("seed"),
            &args[4],
        ),
        Some("fold-compare") => {
            if !fold_compare(&args[2], &args[3]) {
                std::process::exit(1);
            }
        }
        Some("compare") => {
            if !compare(&args[2], &args[3], &args[4]) {
                std::process::exit(1);
            }
        }
        _ => {
            eprintln!(
                "usage: generate <leaf-corpus.json> <per-leaf> <seed> <out.json> <out-u.json> | compare <out.json> <answers.json> <answers-u.json> | fold-generate <cases> <seed> <out.json> | fold-compare <out.json> <answers.json>"
            );
            std::process::exit(2);
        }
    }
}
