//! sk-v27 LW2.RX-1 (OR-7 spike): the harness both routes share.
//!
//! Both routes read the same front end, `parse_that_regex::parse`, and differ
//! only in the determinizer: Route A lowers the `Hir` into regex-syntax and
//! builds regex-automata's dense DFA (leftmost-first, anchored); Route B is
//! this crate's `Dfa` (leftmost-longest). So a fidelity difference between
//! the routes is a determinizer difference, and a failure both share is the
//! front end's.
//!
//! Modes:
//!   witness <leaves.tsv> <corpus.json>     write the oracle corpus
//!   run <leaves.tsv> <corpus.json> <out>   match every case on this route
//!
//! The corpus is deterministic: a fixed bank of strings, plus samples drawn
//! from each leaf's own `Hir` (lookaround groups removed first, so a
//! lookaround leaf still gets inputs near its language), each sample also
//! extended and cut. Inputs are valid Unicode scalar-value strings; every case
//! is a sticky match at offset 0 with the leaf's own flags.

#![allow(dead_code)]

use std::fmt::Write as _;
use std::time::Instant;

use parse_that_regex::hir::{CharClass, Hir};

pub struct Leaf {
    pub id: String,
    pub pattern: String,
    pub flags: String,
}

pub fn read_leaves(path: &str) -> Vec<Leaf> {
    let text = std::fs::read_to_string(path).expect("leaves.tsv");
    text.lines()
        .skip(1)
        .map(|line| {
            let c: Vec<&str> = line.split('\t').collect();
            Leaf {
                id: format!("{}#{}", c[0], c[1]),
                pattern: c[2].to_string(),
                flags: c[3].to_string(),
            }
        })
        .collect()
}

/// The pattern as both routes' front end reads it: ECMAScript `i` and `s`
/// become inline flags.
pub fn rust_pattern(leaf: &Leaf) -> String {
    let mut p = String::new();
    if leaf.flags.contains('i') {
        p.push_str("(?i)");
    }
    if leaf.flags.contains('s') {
        p.push_str("(?s)");
    }
    p + &leaf.pattern
}

/// Lookaround groups removed, respecting escapes and classes.
pub fn strip_lookaround(pattern: &str) -> String {
    let b = pattern.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    let mut in_class = false;
    while i < b.len() {
        match b[i] {
            b'\\' => {
                out.extend_from_slice(&b[i..(i + 2).min(b.len())]);
                i += 2;
            }
            b'[' if !in_class => {
                in_class = true;
                out.push(b'[');
                i += 1;
            }
            b']' if in_class => {
                in_class = false;
                out.push(b']');
                i += 1;
            }
            b'(' if !in_class
                && (b[i..].starts_with(b"(?=")
                    || b[i..].starts_with(b"(?!")
                    || b[i..].starts_with(b"(?<=")
                    || b[i..].starts_with(b"(?<!")) =>
            {
                // Skip to the matching close paren.
                let mut depth = 0;
                let mut cls = false;
                while i < b.len() {
                    match b[i] {
                        b'\\' => i += 1,
                        b'[' if !cls => cls = true,
                        b']' if cls => cls = false,
                        b'(' if !cls => depth += 1,
                        b')' if !cls => {
                            depth -= 1;
                            if depth == 0 {
                                i += 1;
                                break;
                            }
                        }
                        _ => {}
                    }
                    i += 1;
                }
            }
            c => {
                out.push(c);
                i += 1;
            }
        }
    }
    String::from_utf8(out).unwrap_or_default()
}

/// A tiny deterministic generator (SplitMix64).
pub struct Rng(u64);

impl Rng {
    pub fn new(seed: u64) -> Self {
        Rng(seed)
    }
    pub fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }
    pub fn below(&mut self, n: u64) -> u64 {
        if n == 0 { 0 } else { self.next() % n }
    }
}

/// Candidates for a negated class: the first one outside the class is used.
const NEG_POOL: &[char] = &[
    'a', 'Z', '0', '_', '-', ' ', '.', '(', ')', '"', '\'', '#', '/', '*', ',', ';', 'é', '€',
    '\u{A0}', 'ſ', '\u{212A}', '😀', '\n', '\t',
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

fn sample_into(hir: &Hir, rng: &mut Rng, out: &mut Vec<u8>, depth: u32) {
    if depth > 40 {
        return;
    }
    match hir {
        Hir::Empty | Hir::Look(_) => {}
        Hir::Literal(bytes) => out.extend_from_slice(bytes),
        Hir::Class(class) => {
            let pick = match class {
                CharClass::Bytes { ranges, negated: false } if !ranges.is_empty() => {
                    let r = ranges[rng.below(ranges.len() as u64) as usize];
                    let b = r.start as u64 + rng.below(r.end as u64 - r.start as u64 + 1);
                    if b < 0x80 { Some(b as u8 as char) } else { None }
                }
                CharClass::Unicode { ranges, negated: false } if !ranges.is_empty() => {
                    let r = ranges[rng.below(ranges.len() as u64) as usize];
                    let span = r.end as u64 - r.start as u64 + 1;
                    char::from_u32(r.start as u32 + rng.below(span) as u32)
                }
                _ => None,
            };
            let c = pick.or_else(|| {
                let start = rng.below(NEG_POOL.len() as u64) as usize;
                (0..NEG_POOL.len())
                    .map(|k| NEG_POOL[(start + k) % NEG_POOL.len()])
                    .find(|&c| class_has(class, c))
            });
            if let Some(c) = c {
                let mut buf = [0u8; 4];
                out.extend_from_slice(c.encode_utf8(&mut buf).as_bytes());
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

/// Fixed inputs every leaf sees.
pub const BANK: &[&str] = &[
    "", "a", "ab", "abc", "Z", "0", "12", "12.5", "-.5e-3", "+5", "1e3", "1/2", "#fff", "#fff;",
    "#ffffff ", "#fffg", "rgb(1 2 3)", "hsl(120deg 50% 50%)", "12.5px", "50%", "-webkit-foo",
    "--var-name:", "calc(1px + 2%)", "url(a.png)", "\"str\"", "'s'", "/* c */", "!important",
    "@media screen", "U+0025-00FF", "a1_b-c", "0x1F", "é", "É", "ſ", "\u{212A}", "😀", "\u{A0}",
    "\r\n", "\n", " \t", "ident(", "linear-gradient(red, blue)", "ease-in-out", "steps(4, end)",
    "cubic-bezier(0.1, 0.7, 1, 0.1)", "inherit", "none", "auto", "translateX(10px)",
];

const SUFFIXES: &[&str] = &["x", " ", "-", ".5", "(", "é", ";", "0"];

pub fn inputs_for(leaf: &Leaf, seed: u64) -> Vec<String> {
    let mut inputs: Vec<String> = BANK.iter().map(|s| s.to_string()).collect();
    let stripped = strip_lookaround(&rust_pattern(leaf));
    if let Ok(hir) = parse_that_regex::parse(&stripped) {
        let mut rng = Rng::new(seed);
        for _ in 0..8 {
            let mut bytes = Vec::new();
            sample_into(&hir, &mut rng, &mut bytes, 0);
            let Ok(s) = String::from_utf8(bytes) else { continue };
            for suffix in SUFFIXES {
                inputs.push(format!("{s}{suffix}"));
            }
            if let Some((cut, _)) = s.char_indices().last() {
                inputs.push(s[..cut].to_string());
            }
            inputs.push(format!("{s}{s}"));
            inputs.push(s);
        }
    }
    let mut seen = std::collections::HashSet::new();
    inputs.retain(|s| seen.insert(s.clone()));
    inputs
}

fn json_str(s: &str) -> String {
    let mut out = String::from("\"");
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// `witness` mode: the oracle corpus, one case per (leaf, input).
pub fn write_corpus(leaves: &[Leaf], out: &str) {
    let mut s = String::from(
        "{\"name\":\"sk-v27-LW2-RX1-or7\",\"note\":\"LW2.RX-1 OR-7 spike corpus: per leaf, the fixed bank plus samples of the leaf's own Hir (lookaround stripped), extended and cut; sticky at 0 with the leaf's flags.\",\"cases\":[\n",
    );
    let mut first = true;
    for (k, leaf) in leaves.iter().enumerate() {
        for (j, input) in inputs_for(leaf, 0x5EED_0000 + k as u64).iter().enumerate() {
            if !first {
                s.push_str(",\n");
            }
            first = false;
            let _ = write!(
                s,
                "{{\"id\":{},\"pattern\":{},\"flags\":{},\"input\":{}}}",
                json_str(&format!("{}|{j}", leaf.id)),
                json_str(&leaf.pattern),
                json_str(&leaf.flags),
                json_str(input)
            );
        }
    }
    s.push_str("\n]}\n");
    std::fs::write(out, s).expect("write corpus");
}

/// One route: compile a pattern, report states, match at offset 0.
pub trait Route {
    type Matcher;
    const NAME: &'static str;
    fn compile(&self, pattern: &str) -> Result<Self::Matcher, String>;
    fn states(&self, m: &Self::Matcher) -> usize;
    fn find(&self, m: &Self::Matcher, input: &[u8]) -> Option<usize>;
}

/// Reads the corpus back (the cases this harness wrote): (leaf id, input).
fn read_corpus(path: &str) -> Vec<(String, String)> {
    // The corpus is this harness's own output: one case per line.
    let text = std::fs::read_to_string(path).expect("corpus");
    let mut cases = Vec::new();
    for line in text.lines().filter(|l| l.starts_with("{\"id\":")) {
        let id = json_field(line, "\"id\":");
        let input = json_field(line, "\"input\":");
        cases.push((id, input));
    }
    cases
}

fn json_field(line: &str, key: &str) -> String {
    let start = line.find(key).expect("field") + key.len();
    let bytes = line[start..].as_bytes();
    assert_eq!(bytes[0], b'"');
    let mut out = String::new();
    let mut chars = line[start + 1..].chars();
    while let Some(c) = chars.next() {
        match c {
            '"' => break,
            '\\' => match chars.next() {
                Some('"') => out.push('"'),
                Some('\\') => out.push('\\'),
                Some('u') => {
                    let hex: String = chars.by_ref().take(4).collect();
                    out.push(char::from_u32(u32::from_str_radix(&hex, 16).expect("hex")).expect("char"));
                }
                other => panic!("unexpected escape {other:?}"),
            },
            c => out.push(c),
        }
    }
    out
}

/// `run` mode: per leaf, compile time (median of 7, µs), states and the
/// match length of every case.
pub fn run<R: Route>(route: &R, leaves: &[Leaf], corpus: &str, out: &str) {
    let cases = read_corpus(corpus);
    let mut s = String::new();
    let _ = write!(s, "{{\"route\":{},\"leaves\":[\n", json_str(R::NAME));
    for (k, leaf) in leaves.iter().enumerate() {
        if k > 0 {
            s.push_str(",\n");
        }
        let pattern = rust_pattern(leaf);
        let mut times = Vec::new();
        let mut compiled = None;
        let mut error = None;
        for _ in 0..7 {
            let t0 = Instant::now();
            match route.compile(&pattern) {
                Ok(m) => compiled = Some(m),
                Err(e) => error = Some(e),
            }
            times.push(t0.elapsed().as_nanos() as f64 / 1e3);
        }
        times.sort_by(|a, b| a.total_cmp(b));
        let prefix = format!("{}|", leaf.id);
        let _ = write!(s, "{{\"id\":{},\"compile_us\":{:.1}", json_str(&leaf.id), times[3]);
        match (&compiled, &error) {
            (Some(m), _) => {
                let _ = write!(s, ",\"states\":{},\"results\":{{", route.states(m));
                let mut first = true;
                for (id, input) in cases.iter().filter(|(id, _)| id.starts_with(&prefix)) {
                    if !first {
                        s.push(',');
                    }
                    first = false;
                    let r = route.find(m, input.as_bytes());
                    let _ = write!(
                        s,
                        "{}:{}",
                        json_str(id),
                        r.map_or("null".to_string(), |n| n.to_string())
                    );
                }
                s.push_str("}}");
            }
            (None, Some(e)) => {
                let _ = write!(s, ",\"error\":{}}}", json_str(e));
            }
            (None, None) => unreachable!(),
        }
    }
    s.push_str("\n]}\n");
    std::fs::write(out, s).expect("write results");
}

pub fn main_with<R: Route>(route: R) {
    let args: Vec<String> = std::env::args().collect();
    match args.get(1).map(String::as_str) {
        Some("witness") => write_corpus(&read_leaves(&args[2]), &args[3]),
        Some("run") => run(&route, &read_leaves(&args[2]), &args[3], &args[4]),
        _ => {
            eprintln!("usage: witness <leaves.tsv> <corpus.json> | run <leaves.tsv> <corpus.json> <out.json>");
            std::process::exit(2);
        }
    }
}
