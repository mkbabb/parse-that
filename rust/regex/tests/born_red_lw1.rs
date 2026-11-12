//! sk-v27 LW1.RX-2: born-RED tests for the regex engine's JS semantics.
//!
//! Every expected value below is an oracle answer, not an opinion: V8 and
//! JavaScriptCore agree on it, self-consistent across reps, in the LW1.RX-1
//! smoke corpus (`oracle/smoke.json`, case ids cited per test). Leaf
//! semantics are a sticky match at the start of the input (`y`), measured in
//! UTF-8 bytes.
//!
//! Each RED test is `#[ignore]`d with its reason and its curing unit, so the
//! default suite stays green and `cargo test -- --ignored` shows the REDs.
//! Removing an `#[ignore]` is part of the curing unit, never a separate edit.
//! The un-ignored tests pin behaviour that is right today and that a cure
//! must keep.

use parse_that_regex::algebra::pattern_is_superset;
use parse_that_regex::{Dfa, DfaOptions};

/// Sticky leaf match: bytes consumed from offset 0, as the Rust leaf reads it.
fn leaf(pattern: &str, input: &str) -> Option<usize> {
    Dfa::compile(pattern)?.find_at(input.as_bytes(), 0)
}

fn leaf_byte_mode(pattern: &str, input: &str) -> Option<usize> {
    let opts = DfaOptions {
        unicode: false,
        ..DfaOptions::default()
    };
    Dfa::compile_with(pattern, &opts)?.find_at(input.as_bytes(), 0)
}

// ── C1-1: lookahead and the end of a greedy run ────────────────────────────

/// Oracle `rx2-c1-1-neg-lookahead`: `/\d+(?!\.\d)/y` on `"12.5"` is `"1"`.
/// The greedy run backs off one digit so the lookahead holds. A DFA cannot
/// express this without the product construction (regex C1-1,
/// `end_unambiguous`).
#[test]
#[ignore = "born-RED LW1.RX-2 (C1-1): lookaround is rejected by the parser (\"invalid group syntax\"); cure LW3.RX-1"]
fn c1_1_negative_lookahead_backs_off_greedy_run() {
    assert_eq!(leaf(r"\d+(?!\.\d)", "12.5"), Some(1));
}

/// Oracle `rx2-c1-1-int`: the same leaf on `"12"` takes both digits.
#[test]
#[ignore = "born-RED LW1.RX-2 (C1-1): lookaround is rejected by the parser; cure LW3.RX-1"]
fn c1_1_negative_lookahead_full_run_when_unblocked() {
    assert_eq!(leaf(r"\d+(?!\.\d)", "12"), Some(2));
}

// ── Alternation: leftmost-first, as JS and PEG ordered choice ──────────────

/// Oracle `rx2-alt-a-ab`: `/a|ab/y` on `"ab"` is `"a"` (leftmost-first). The
/// grammar tier's `FuseAltRegexBranches` turns `Alt(/a/, /ab/)` into exactly
/// this pattern, and the Rust leaf runs it on a leftmost-longest DFA, so the
/// fused leaf consumes `"ab"` where the unfused ordered choice consumes `"a"`.
/// Cured at LW3.RX-1a/1c: the determinizer is regex-automata's
/// leftmost-first DFA, so the priority cut is in the table.
#[test]
fn alt_fusion_is_leftmost_first() {
    assert_eq!(leaf("a|ab", "ab"), Some(1));
}

/// Oracle `rx2-alt-ab-a`: with the longer branch first, both semantics agree.
#[test]
fn alt_longer_branch_first_agrees() {
    assert_eq!(leaf("ab|a", "ab"), Some(2));
}

// ── SupersetAbsorbAlt preconditions ────────────────────────────────────────

/// Oracle `rx2-absorb-e-acute-in-greek`: `/[α-ω]/uy` does not match `"é"`,
/// and `rx2-absorb-beta-in-e-acute`: `/[é]/uy` does not match `"β"`, so
/// neither branch of `Alt([é], [α-ω])` may be absorbed. The superset check
/// gets this pair right today; it stays as a guard. (PLAN §5 named this pair
/// as the RED witness; at the algebra layer it reads GREEN, and the defect it
/// stands for is witnessed by the two tests below.)
#[test]
fn superset_absorb_e_acute_greek_guard() {
    assert!(
        !pattern_is_superset("[α-ω]", "[é]"),
        "[α-ω] does not contain é"
    );
    assert!(
        !pattern_is_superset("[é]", "[α-ω]"),
        "[é] does not contain [α-ω]"
    );
}

/// Oracle `rx2-absorb-byte-collision`: `/[Ã©]/uy` does not match `"é"`. The
/// superset check reads both classes in byte mode, as sets of UTF-8 bytes:
/// `Ã` is C3 83 and `©` is C2 A9, so the byte set of `[Ã©]` holds both bytes
/// of `é` (C3 A9) and the check reports containment. `SupersetAbsorbAlt`
/// would then drop the `[é]` branch of `Alt([Ã©], [é])` and `"é"` would no
/// longer parse.
#[test]
#[ignore = "born-RED LW1.RX-2 (SupersetAbsorbAlt): containment is tested on UTF-8 byte sets, not scalar-value sets; cure LW2.RX-4 / LW4.RX-2"]
fn superset_absorb_compares_scalar_values() {
    assert!(
        !pattern_is_superset("[Ã©]", "[é]"),
        "[Ã©] does not contain é"
    );
}

/// Oracles `rx2-absorb-e-acute-in-e-acute` and `rx2-union-greek-on-beta`:
/// `[é]` matches `"é"` and `[α-ω]` matches `"β"`. `UnionMergeAlt` replaces
/// `Alt([é], [α-ω])` by `try_union_patterns`'s single class, which must match
/// both. It is built from the UTF-8 byte set, printing each byte as a Latin-1
/// char, so the merged class names different scalars.
#[test]
#[ignore = "born-RED LW1.RX-2 (UnionMergeAlt): the union is printed from UTF-8 bytes as Latin-1 chars; cure LW2.RX-4 / LW4.RX-2"]
fn union_merge_keeps_both_branches_languages() {
    let merged = parse_that_regex::algebra::try_union_patterns("[é]", "[α-ω]");
    let merged = merged.expect("both are single classes");
    assert_eq!(
        leaf(&merged, "é"),
        Some(2),
        "merged {merged:?} must match é"
    );
    assert_eq!(
        leaf(&merged, "β"),
        Some(2),
        "merged {merged:?} must match β"
    );
    assert_eq!(
        leaf(&merged, "Ã"),
        None,
        "merged {merged:?} must not match Ã"
    );
}

/// Oracles `rx2-absorb-order-run-first` (3 bytes) and
/// `rx2-absorb-order-class-first` (1 byte): `[a-z]` contains `[a-c]` as a set,
/// but `[a-c]+` is not absorbed by `[a-z]`, because the two consume different
/// lengths. The check strips the outer repetition before comparing, so it
/// licenses dropping `[a-c]+` from `Alt([a-c]+, [a-z])`, which changes the
/// parse of `"abc"` from 3 bytes to 1 (regex C2-1, the `L_cut` certificate).
#[test]
#[ignore = "born-RED LW1.RX-2 (SupersetAbsorbAlt, C2-1): repetition is stripped before the containment test; cure LW2.RX-4"]
fn superset_absorb_requires_equal_consumption() {
    assert_eq!(leaf("[a-c]+|[a-z]", "abc"), Some(3), "the oracle parse");
    assert!(
        !pattern_is_superset("[a-z]", "[a-c]+"),
        "[a-z] must not absorb [a-c]+: lengths differ"
    );
}

/// Single-scalar ASCII classes: containment is sound and stays.
#[test]
fn superset_absorb_ascii_single_class_holds() {
    assert!(pattern_is_superset("[a-z]", "[a-c]"));
    assert!(!pattern_is_superset("[a-c]", "[a-z]"));
}

// ── Case folding: Kelvin sign, long s, Latin-1 ─────────────────────────────

/// Oracles `rx2-kelvin-k-iu` and `rx2-kelvin-K-iu`: under `/iu` (simple case
/// folding) `k` and `K` match U+212A KELVIN SIGN (3 UTF-8 bytes), and
/// `rx2-kelvin-sign-iu-on-k`: U+212A matches `k`.
#[test]
#[ignore = "born-RED LW1.RX-2 (Kelvin /iu): case folding is ASCII-only; cure LW3.RX-1 (u/v semantics)"]
fn kelvin_folds_under_iu() {
    assert_eq!(leaf("(?i)k", "\u{212A}"), Some(3));
    assert_eq!(leaf("(?i)K", "\u{212A}"), Some(3));
    assert_eq!(leaf("(?i)\u{212A}", "k"), Some(1));
}

/// Oracle `rx2-long-s-iu-on-s`: U+017F LATIN SMALL LETTER LONG S matches `s`
/// under `/iu`.
#[test]
#[ignore = "born-RED LW1.RX-2 (fold /iu): case folding is ASCII-only; cure LW3.RX-1"]
fn long_s_folds_under_iu() {
    assert_eq!(leaf("(?i)\u{17F}", "s"), Some(1));
}

/// Oracles `rx2-e-acute-i-on-E-acute` and `rx2-e-acute-iu-on-E-acute`: `é`
/// matches `É` under both `/i` and `/iu`.
#[test]
#[ignore = "born-RED LW1.RX-2 (fold, non-ASCII): case folding is ASCII-only; cure LW3.RX-1"]
fn latin1_folds_under_i_and_iu() {
    assert_eq!(leaf("(?i)é", "É"), Some(2));
    assert_eq!(leaf_byte_mode("(?i)é", "É"), Some(2));
}

/// Oracles `rx2-kelvin-k-i` and `rx2-long-s-i-on-s`: without `u`, JS
/// canonicalises through `toUpperCase`, so `k` does not match U+212A and
/// U+017F does not match `s`. The engine has no JS non-`u` mode yet; byte
/// mode is the nearest, and it agrees today. A cure that adds Unicode folding
/// must keep this.
#[test]
fn kelvin_does_not_fold_without_u() {
    assert_eq!(leaf_byte_mode("(?i)k", "\u{212A}"), None);
    assert_eq!(leaf_byte_mode("(?i)\u{17F}", "s"), None);
}
