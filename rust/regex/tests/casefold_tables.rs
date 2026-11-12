//! sk-v27 LW3.RX-3: the generated case tables are the engine's only source
//! of Unicode case and space data, at the pinned Unicode version (OR-6).

use parse_that_regex::casefold::{SPACE_ZS, UNICODE_VERSION, equivalents};
use parse_that_regex::hir::merge_codepoint_ranges;
use parse_that_regex::hir::{CharClass, CodepointRange, Hir};
use parse_that_regex::parse;

#[test]
fn the_tables_are_at_the_pinned_unicode_version() {
    // node v24.22.3 ships ICU 78.3, Unicode 17.0 (OR-6).
    assert_eq!(UNICODE_VERSION, "17.0.0");
}

/// `\s` is WhiteSpace (TAB, VT, FF, ZWNBSP and every `Zs` scalar) plus
/// LineTerminator, with `Zs` from the generated tables.
#[test]
fn backslash_s_is_the_generated_space_set() {
    let mut want: Vec<CodepointRange> = SPACE_ZS
        .iter()
        .map(|&(lo, hi)| {
            CodepointRange::new(char::from_u32(lo).unwrap(), char::from_u32(hi).unwrap())
        })
        .collect();
    want.push(CodepointRange::new('\t', '\r'));
    want.push(CodepointRange::new('\u{2028}', '\u{2029}'));
    want.push(CodepointRange::new('\u{FEFF}', '\u{FEFF}'));
    let want = merge_codepoint_ranges(want);
    match parse(r"\s").expect("parses") {
        Hir::Class(CharClass::Unicode {
            ranges,
            negated: false,
        }) => assert_eq!(ranges, want),
        other => panic!("\\s is a scalar class, got {other:?}"),
    }
}

#[test]
fn canonicalization_differs_by_reading() {
    // u: simple case folding; KELVIN SIGN folds to k.
    assert_eq!(equivalents('k', true), vec!['K', 'k', '\u{212A}']);
    // non-u: toUppercase of one code unit, never a non-ASCII scalar to ASCII.
    assert_eq!(equivalents('k', false), vec!['K', 'k']);
    assert_eq!(equivalents('\u{17F}', false), vec!['\u{17F}']);
    assert_eq!(equivalents('\u{17F}', true), vec!['S', 's', '\u{17F}']);
}
