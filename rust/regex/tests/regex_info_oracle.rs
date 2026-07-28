//! SK-V26 pre-prune oracle carried across the direct-HIR clean cut.
//!
//! The fixture is intentionally split into three independent contracts:
//!
//! - `language`: parse/compile acceptance plus the bounded prefix fingerprint
//!   sealed before e-graph removal;
//! - `soundness`: facts that may affect recognition or typed conversion;
//! - `planner`: performance-only estimates and engine-selection hints.
//!
//! A planner change must therefore be reviewed as planner drift. It cannot
//! silently bless a language or soundness change (or vice versa).

use std::collections::BTreeSet;
use std::fmt::Write as _;

use bbnf_regex::classify::{ClassRangeInfo, RegexClass};
use bbnf_regex::hir::{CharClass, Hir, ParseOptions};
use bbnf_regex::{DEAD_STATE, RegexInfo, RegexTablePlan, TablePlanOptions};

const CASES: &str = include_str!("fixtures/skv26/W1-REGEX-CASES.tsv");
const SNAPSHOT: &str = include_str!("fixtures/skv26/W1-REGEX-ORACLE.tsv");

#[derive(Debug)]
struct Case {
    id: String,
    pattern_sha256: String,
    pattern: String,
}

fn decode_hex(encoded: &str) -> Vec<u8> {
    assert!(
        encoded.len().is_multiple_of(2),
        "hex fixture has odd length"
    );
    encoded
        .as_bytes()
        .chunks_exact(2)
        .map(|pair| {
            let pair = std::str::from_utf8(pair).expect("hex is ASCII");
            u8::from_str_radix(pair, 16).expect("fixture contains valid hex")
        })
        .collect()
}

fn encode_hex(bytes: &[u8]) -> String {
    let mut encoded = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        write!(encoded, "{byte:02x}").expect("writing to String is infallible");
    }
    encoded
}

fn cases() -> Vec<Case> {
    let mut rows = CASES
        .lines()
        .filter(|line| !line.is_empty() && !line.starts_with('#'));
    assert_eq!(
        rows.next(),
        Some("case_id\tpattern_sha256\toccurrence_count\toccurrence_ids\tpattern_utf8_hex")
    );
    rows.map(|line| {
        let columns: Vec<_> = line.split('\t').collect();
        assert_eq!(columns.len(), 5, "malformed corpus row: {line}");
        Case {
            id: columns[0].to_owned(),
            pattern_sha256: columns[1].to_owned(),
            pattern: String::from_utf8(decode_hex(columns[4]))
                .expect("BBNF regex terminal is UTF-8"),
        }
    })
    .collect()
}

fn bool_digit(value: bool) -> char {
    if value { '1' } else { '0' }
}

fn option_usize(value: Option<usize>) -> String {
    value.map_or_else(|| "*".to_owned(), |value| value.to_string())
}

fn option_u32(value: Option<u32>) -> String {
    value.map_or_else(|| "*".to_owned(), |value| value.to_string())
}

fn option_byte(value: Option<u8>) -> String {
    value.map_or_else(|| "-".to_owned(), |value| format!("{value:02x}"))
}

fn option_bytes(value: &Option<Vec<u8>>) -> String {
    value
        .as_ref()
        .map_or_else(|| "-".to_owned(), |bytes| encode_hex(bytes))
}

fn class_range(info: &ClassRangeInfo) -> String {
    format!(
        "{:016x}:{:016x}:{}:{}:{}",
        info.chars.bits[0],
        info.chars.bits[1],
        bool_digit(info.negated),
        info.min,
        option_u32(info.max)
    )
}

fn regex_class(class: &RegexClass) -> String {
    match class {
        RegexClass::Numeric {
            allows_sign,
            allows_fraction,
            allows_exponent,
            reject_leading_zero,
            allow_leading_dot,
        } => format!(
            "numeric:{}{}{}{}{}",
            bool_digit(*allows_sign),
            bool_digit(*allows_fraction),
            bool_digit(*allows_exponent),
            bool_digit(*reject_leading_zero),
            bool_digit(*allow_leading_dot)
        ),
        RegexClass::QuotedString {
            quote_char,
            allows_escapes,
            allows_u_escapes,
        } => format!(
            "quoted:{quote_char:02x}:{}:{}",
            bool_digit(*allows_escapes),
            bool_digit(*allows_u_escapes)
        ),
        RegexClass::HexDigits => "hex".to_owned(),
        RegexClass::Identifier {
            allows_leading_dash,
            allows_double_dash_prefix,
        } => format!(
            "identifier:{}:{}",
            bool_digit(*allows_leading_dash),
            bool_digit(*allows_double_dash_prefix)
        ),
        RegexClass::WhitespaceWithBlockComment => "whitespace-block-comment".to_owned(),
        RegexClass::CharClassQuantified(info) => {
            format!("quantified:{}", class_range(info))
        }
        RegexClass::PrefixThenClass { prefix, tail } => {
            format!("prefix:{}:{}", encode_hex(prefix), class_range(tail))
        }
        RegexClass::AccelDriven(byte) => format!("accel:{byte:02x}"),
        RegexClass::Unknown => "unknown".to_owned(),
    }
}

fn quantified(info: &Option<bbnf_regex::QuantifiedClassInfo>) -> String {
    info.as_ref().map_or_else(
        || "-".to_owned(),
        |info| {
            format!(
                "{:016x}:{:016x}:{}:{}:{}",
                info.chars.bits[0],
                info.chars.bits[1],
                bool_digit(info.negated),
                info.min,
                option_u32(info.max)
            )
        },
    )
}

fn soundness(info: &RegexInfo) -> String {
    let negated = info.negated_class.map_or_else(
        || "-".to_owned(),
        |set| format!("{:016x}:{:016x}", set.bits[0], set.bits[1]),
    );
    format!(
        "class={};first={:016x}:{:016x};nullable={};must_consume={};width={}:{};\
         prefix={};suffix={};negated={};quantified={};anchored={}",
        regex_class(&info.classification),
        info.first_chars.bits[0],
        info.first_chars.bits[1],
        bool_digit(info.nullable),
        bool_digit(info.must_consume),
        info.min_match_len,
        option_usize(info.max_match_len),
        option_bytes(&info.literal_prefix),
        option_bytes(&info.literal_suffix),
        negated,
        quantified(&info.quantified_class),
        bool_digit(info.is_anchored),
    )
}

fn planner(info: &RegexInfo) -> String {
    format!(
        "hir_nodes={};one_pass={};dfa_states={};accel={};walkable={};engines={:04x}",
        info.hir_size_estimate,
        bool_digit(info.one_pass_eligible),
        option_usize(info.dfa_size_estimate),
        option_byte(info.accel_candidate),
        bool_digit(info.hir_walkable),
        info.feasible_engines.bits(),
    )
}

fn gather_probe_material(
    hir: &Hir,
    alphabet: &mut BTreeSet<u8>,
    literal_probes: &mut BTreeSet<Vec<u8>>,
) {
    match hir {
        Hir::Empty | Hir::Look(_) => {}
        Hir::Literal(bytes) => {
            alphabet.extend(bytes);
            literal_probes.insert(bytes.clone());
        }
        Hir::Class(CharClass::Bytes { ranges, .. }) => {
            for range in ranges {
                for byte in [
                    range.start.saturating_sub(1),
                    range.start,
                    range.end,
                    range.end.saturating_add(1),
                ] {
                    alphabet.insert(byte);
                }
            }
        }
        Hir::Class(CharClass::Unicode { ranges, .. }) => {
            for range in ranges {
                for character in [range.start, range.end] {
                    let mut encoded = [0_u8; 4];
                    let bytes = character.encode_utf8(&mut encoded).as_bytes().to_vec();
                    alphabet.extend(&bytes);
                    literal_probes.insert(bytes);
                }
            }
        }
        Hir::Repetition(repetition) => {
            gather_probe_material(&repetition.sub, alphabet, literal_probes);
        }
        Hir::Group(sub) => gather_probe_material(sub, alphabet, literal_probes),
        Hir::Concat(children) | Hir::Alternation(children) => {
            for child in children {
                gather_probe_material(child, alphabet, literal_probes);
            }
        }
    }
}

fn probes(pattern: &str, hir: &Hir) -> Vec<Vec<u8>> {
    const BASELINE: &[u8] = &[
        0, 9, 10, 13, 32, 33, 34, 35, 36, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 57, 58, 59,
        60, 61, 62, 63, 64, 65, 70, 90, 91, 92, 93, 94, 95, 96, 97, 102, 122, 123, 124, 125, 126,
        127, 128, 191, 194, 195, 224, 239, 240, 255,
    ];

    let mut alphabet = BTreeSet::from_iter(BASELINE.iter().copied());
    alphabet.extend(pattern.as_bytes());
    let mut literal_probes = BTreeSet::new();
    gather_probe_material(hir, &mut alphabet, &mut literal_probes);

    let alphabet: Vec<_> = alphabet.into_iter().take(64).collect();
    let reduced: Vec<_> = alphabet.iter().copied().take(14).collect();
    let mut probes = BTreeSet::new();
    probes.insert(Vec::new());
    probes.extend(literal_probes.iter().cloned());
    for literal in &literal_probes {
        let mut with_noise = literal.clone();
        with_noise.push(0);
        probes.insert(with_noise);
    }
    for byte in 0_u16..=255 {
        probes.insert(vec![byte as u8]);
    }
    for &left in &alphabet {
        for &right in &alphabet {
            probes.insert(vec![left, right]);
        }
    }
    for &first in &reduced {
        for &second in &reduced {
            for &third in &reduced {
                probes.insert(vec![first, second, third]);
            }
        }
    }
    probes.into_iter().collect()
}

#[derive(Clone, Copy)]
struct Fnv1a64(u64);

impl Fnv1a64 {
    fn new() -> Self {
        Self(0xcbf2_9ce4_8422_2325)
    }

    fn write(&mut self, bytes: &[u8]) {
        for byte in bytes {
            self.0 ^= u64::from(*byte);
            self.0 = self.0.wrapping_mul(0x0000_0100_0000_01b3);
        }
    }
}

fn find_at(plan: &RegexTablePlan, bytes: &[u8]) -> Option<usize> {
    let mut state = plan.start_state();
    let mut position = 0;
    let mut last_accept = plan.accepting()[state as usize].then_some(0);
    while position < bytes.len() {
        let class = plan.byte_classes()[bytes[position] as usize] as usize;
        let next = plan.transitions()[state as usize * plan.class_count() as usize + class];
        if next == DEAD_STATE {
            break;
        }
        state = next;
        position += 1;
        if plan.accepting()[state as usize] {
            last_accept = Some(position);
        }
    }
    last_accept
}

fn language(case: &Case, raw: &Hir) -> String {
    match RegexTablePlan::from_hir(raw, TablePlanOptions::default()) {
        Ok(plan) => {
            // The old oracle column names are retained so the immutable
            // pre-prune fixture remains byte-for-byte evidence. Current
            // matching is performed only by this test-local interpreter over
            // the compile-owned plan; bbnf-regex has no runtime matcher.
            let probes = probes(&case.pattern, raw);
            let mut fingerprint = Fnv1a64::new();
            for probe in &probes {
                let raw_end = find_at(&plan, probe);
                fingerprint.write(&(probe.len() as u64).to_le_bytes());
                fingerprint.write(probe);
                fingerprint.write(&(raw_end.map_or(u64::MAX, |end| end as u64)).to_le_bytes());
            }
            format!(
                "parse=1;raw_dfa=1;canonical_dfa=1;probes={};prefix_fingerprint=fnv1a64:{:016x}",
                probes.len(),
                fingerprint.0
            )
        }
        Err(_) => "parse=1;raw_dfa=0;canonical_dfa=0;probes=0;prefix_fingerprint=-".to_owned(),
    }
}

fn snapshot() -> String {
    let cases = cases();
    let mut output = String::from(
        "# schema=skv26-regex-info-oracle-v1\n\
         # language=parser acceptance and bounded raw-HIR/canonical-HIR prefix equivalence\n\
         # soundness=classification,FIRST,nullability,progress,width,prefix/suffix,class,anchor\n\
         # planner=HIR/DFA estimates,one-pass,acceleration,walkability,feasible engines\n\
         case_id\tpattern_sha256\tlanguage\tsoundness\tplanner\n",
    );

    for case in cases {
        let parsed = bbnf_regex::parse_with(&case.pattern, &ParseOptions::byte_mode());
        match parsed {
            Ok(raw) => {
                let info = RegexInfo::analyze(&case.pattern)
                    .unwrap_or_else(|| panic!("{} parsed but RegexInfo rejected", case.id));
                writeln!(
                    output,
                    "{}\t{}\t{}\t{}\t{}",
                    case.id,
                    case.pattern_sha256,
                    language(&case, &raw),
                    soundness(&info),
                    planner(&info),
                )
                .expect("writing to String is infallible");
            }
            Err(error) => {
                assert!(
                    RegexInfo::analyze(&case.pattern).is_none(),
                    "{} raw parser rejected but RegexInfo accepted",
                    case.id
                );
                writeln!(
                    output,
                    "{}\t{}\tparse=0;raw_dfa=0;canonical_dfa=0;probes=0;\
                     prefix_fingerprint=-;error_offset={}\t-\t-",
                    case.id, case.pattern_sha256, error.offset,
                )
                .expect("writing to String is infallible");
            }
        }
    }
    output
}

#[test]
fn regex_info_pre_prune_oracle() {
    let actual = snapshot();
    let actual_rows: Vec<_> = actual
        .lines()
        .filter(|line| line.starts_with('C'))
        .collect();
    let expected_rows: Vec<_> = SNAPSHOT
        .lines()
        .filter(|line| line.starts_with('C'))
        .collect();
    assert_eq!(actual_rows.len(), expected_rows.len(), "oracle row count");

    let mut soundness_drift = Vec::new();
    let mut planner_drift = Vec::new();
    for (actual, expected) in actual_rows.iter().zip(&expected_rows) {
        let actual: Vec<_> = actual.split('\t').collect();
        let expected: Vec<_> = expected.split('\t').collect();
        assert_eq!(actual.len(), 5);
        assert_eq!(expected.len(), 5);
        assert_eq!(
            &actual[..3],
            &expected[..3],
            "{} language drifted from the pre-prune seal",
            expected[0]
        );
        if actual[3] != expected[3] {
            let actual_fields: Vec<_> = actual[3].split(';').collect();
            let expected_fields: Vec<_> = expected[3].split(';').collect();
            assert_eq!(actual_fields.len(), expected_fields.len());
            for (actual_field, expected_field) in actual_fields.iter().zip(&expected_fields) {
                if !actual_field.starts_with("first=") {
                    assert_eq!(
                        actual_field, expected_field,
                        "{} non-FIRST soundness drift",
                        actual[0]
                    );
                }
            }
            soundness_drift.push((
                actual[0],
                actual_fields
                    .iter()
                    .find(|field| field.starts_with("first="))
                    .copied()
                    .unwrap(),
                expected_fields
                    .iter()
                    .find(|field| field.starts_with("first="))
                    .copied()
                    .unwrap(),
            ));
        }
        if actual[4] != expected[4] {
            planner_drift.push((actual[0], actual[4], expected[4]));
        }
    }
    assert_eq!(
        soundness_drift,
        vec![
            (
                "C0015",
                "first=03ff400000000000:0000002000000020",
                "first=03ff400000000000:0000000000000000",
            ),
            (
                "C0028",
                "first=03ff280000000000:0000400000000000",
                "first=03ff280000000000:0000000000000000",
            ),
            (
                "C0062",
                "first=03ff280000000000:0000400000000000",
                "first=03ff280000000000:0000000000000000",
            ),
        ],
        "only the classified all-nullable-prefix FIRST corrections may differ"
    );
    assert_eq!(
        planner_drift,
        vec![(
            "C0034",
            "hir_nodes=8;one_pass=1;dfa_states=36;accel=-;walkable=1;engines=0070",
            "hir_nodes=6;one_pass=1;dfa_states=33;accel=-;walkable=1;engines=0070",
        )],
        "only the documented raw-HIR planner estimate may differ"
    );
}
