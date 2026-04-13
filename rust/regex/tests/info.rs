//! Tranche O — extracted from `regex/src/info.rs`.
//! End-to-end tests over `RegexInfo::analyze`.

use bbnf_regex::classify::RegexClass;
use bbnf_regex::info::RegexInfo;

#[test]
fn test_simple_literal() {
    let info = RegexInfo::analyze("hello").unwrap();
    assert!(!info.nullable);
    assert!(info.must_consume);
    assert_eq!(info.min_match_len, 5);
    assert_eq!(info.max_match_len, Some(5));
    assert_eq!(info.literal_prefix, Some(b"hello".to_vec()));
    assert_eq!(info.literal_suffix, Some(b"hello".to_vec()));
    assert!(info.one_pass_eligible);
}

#[test]
fn test_nullable_pattern() {
    let info = RegexInfo::analyze("[a-z]*").unwrap();
    assert!(info.nullable);
    assert!(!info.must_consume);
    assert_eq!(info.min_match_len, 0);
    assert_eq!(info.max_match_len, None);
}

#[test]
fn test_negated_class() {
    let info = RegexInfo::analyze(r#"[^"\\]+"#).unwrap();
    assert!(info.negated_class.is_some());
    assert!(info.quantified_class.is_some());
    let qc = info.quantified_class.unwrap();
    assert!(qc.negated);
    assert_eq!(qc.min, 1);
    assert_eq!(qc.max, None);
}

#[test]
fn test_json_number_classification() {
    let info =
        RegexInfo::analyze(r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?").unwrap();
    assert!(matches!(
        info.classification,
        RegexClass::Numeric {
            allows_sign: true,
            allows_fraction: true,
            allows_exponent: true,
            reject_leading_zero: true,
            allow_leading_dot: false,
        }
    ));
    assert!(!info.nullable);
    assert!(info.must_consume);
}

#[test]
fn test_anchored() {
    let info = RegexInfo::analyze(r"^hello").unwrap();
    assert!(info.is_anchored);
}

#[test]
fn test_alternation_one_pass() {
    // Disjoint FIRST sets → one-pass eligible
    let info = RegexInfo::analyze(r"[a-z]+|[0-9]+").unwrap();
    assert!(info.one_pass_eligible);

    // Overlapping FIRST sets → not one-pass
    let info = RegexInfo::analyze(r"abc|abd").unwrap();
    assert!(!info.one_pass_eligible);
}

#[test]
fn test_width_bounds() {
    let info = RegexInfo::analyze(r"[a-z]{2,5}").unwrap();
    assert_eq!(info.min_match_len, 2);
    assert_eq!(info.max_match_len, Some(5));
}

// ── Identifier dialect coverage (AQ.7.1) ─────────────────────────────────
//
// Verifies that the parameterized `RegexClass::Identifier` correctly
// distinguishes the three CSS dialects:
// - bare ident: `[a-zA-Z_][\w-]*` (no flags)
// - vendor prefix: `-?[a-zA-Z_][\w-]*` (allows_leading_dash)
// - custom-property fold: `-?[a-zA-Z_][\w-]*|--[\w-]+` (both flags)

#[test]
fn test_identifier_bare() {
    let info = RegexInfo::analyze(r"[a-zA-Z_][\w-]*").unwrap();
    assert!(matches!(
        info.classification,
        RegexClass::Identifier {
            allows_leading_dash: false,
            allows_double_dash_prefix: false,
        }
    ));
}

#[test]
fn test_identifier_vendor_prefix() {
    let info = RegexInfo::analyze(r"-?[a-zA-Z_][\w-]*").unwrap();
    assert!(matches!(
        info.classification,
        RegexClass::Identifier {
            allows_leading_dash: true,
            allows_double_dash_prefix: false,
        }
    ));
}

#[test]
fn test_identifier_custom_property_fold() {
    // The CSS `propertyName` shape: vendor-prefix branch + `--` custom
    // property branch in a single alternation. The HIR parser may
    // materialize the `--` prefix as two separate single-byte literals
    // (`-` then `-`) rather than a single two-byte literal; the
    // classifier walks adjacent leading literals to recognize either
    // shape.
    let info = RegexInfo::analyze(r"-?[a-zA-Z_][\w-]*|--[\w-]+").unwrap();
    assert!(matches!(
        info.classification,
        RegexClass::Identifier {
            allows_leading_dash: true,
            allows_double_dash_prefix: true,
        }
    ));
}

#[test]
fn test_identifier_double_dash_only() {
    // Just the custom-property branch on its own is a `PrefixThenClass`,
    // not an Identifier — the lone `--` literal is a fixed prefix
    // followed by `[\w-]+`. Verify it does NOT classify as Identifier.
    let info = RegexInfo::analyze(r"--[\w-]+").unwrap();
    assert!(!matches!(info.classification, RegexClass::Identifier { .. }));
}
