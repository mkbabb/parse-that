//! Cross-crate laws for the checked compile-time/runtime table seam.
//!
//! These tests deliberately execute `RegexTablePlan` through parse-that
//! rather than maintaining a second table interpreter in bbnf-regex.

use std::fmt::Write as _;

use bbnf_regex::{DEAD_STATE, RegexTablePlan};
use parse_that::{Input, RegexPlan, RegexTerminal, Run, Step, regex};

const _: () = assert!(parse_that::KERNEL_ABI == 3);

fn recognized_prefix(plan: &RegexTablePlan, input: &[u8]) -> Option<usize> {
    let runtime_plan = RegexPlan::new(
        plan.byte_classes(),
        plan.state_count() as usize,
        plan.class_count() as usize,
        plan.start_state() as usize,
        plan.transitions(),
        plan.accepting(),
    )
    .expect("bbnf-regex must emit the parse-that table ABI");
    let terminal = RegexTerminal::new(runtime_plan);
    let mut run = Run::new(Input::new(input));

    match run.parse_prefix(|run| regex(run, &terminal)) {
        Step::Matched(span) => {
            assert_eq!(run.cursor().offset(), span.end());
            Some(span.end())
        }
        Step::Mismatch(failure) => {
            assert_eq!(run.cursor().offset(), 0);
            assert_eq!(failure.at().offset(), 0);
            None
        }
        Step::Fault(fault) => panic!("checked emitted plan faulted at {fault:?}"),
    }
}

#[test]
fn emitted_table_executes_longest_prefix_and_mismatch_laws() {
    let plan = RegexTablePlan::compile("[a-c]+").expect("supported byte regex");

    assert_eq!(recognized_prefix(&plan, b"abcx"), Some(3));
    assert_eq!(recognized_prefix(&plan, b"xabc"), None);
}

#[test]
fn emitted_nullable_table_accepts_without_consumption() {
    let plan = RegexTablePlan::compile("a*").expect("nullable regex compiles");

    assert_eq!(recognized_prefix(&plan, b""), Some(0));
    assert_eq!(recognized_prefix(&plan, b"bbb"), Some(0));
    assert_eq!(recognized_prefix(&plan, b"aaab"), Some(3));
}

#[test]
fn emitted_table_preserves_an_explicit_nonzero_start_state() {
    let plan =
        RegexTablePlan::from_parts([0; 256], 2, 1, 1, vec![DEAD_STATE, 0], vec![true, false])
            .expect("alternate compiler plan is checked");

    assert_eq!(recognized_prefix(&plan, b"x"), Some(1));
}

#[test]
fn emitted_table_with_all_256_classes_executes_without_truncation() {
    let mut pattern = String::new();
    for byte in 0_u16..=255 {
        if byte != 0 {
            pattern.push('|');
        }
        write!(pattern, r"\x{byte:02x}").expect("writing to String is infallible");
    }
    let plan = RegexTablePlan::compile(&pattern).expect("all byte alternatives compile");

    assert_eq!(plan.class_count(), 256);
    for byte in 0_u8..=255 {
        assert_eq!(recognized_prefix(&plan, &[byte]), Some(1));
    }
}

#[test]
fn emitted_byte_word_table_does_not_claim_unicode_word_semantics() {
    let plan = RegexTablePlan::compile(r"\w+").expect("ASCII word regex compiles");

    assert_eq!(recognized_prefix(&plan, b"alpha_42!"), Some(8));
    assert_eq!(recognized_prefix(&plan, "é".as_bytes()), None);
}

#[test]
fn explicit_unicode_escape_has_exact_utf8_byte_execution_semantics() {
    let plan = RegexTablePlan::compile(r"\u{e9}").expect("explicit codepoint escape compiles");

    assert_eq!(recognized_prefix(&plan, "é!".as_bytes()), Some(2));
    assert_eq!(recognized_prefix(&plan, &[0xe9]), None);
}

#[test]
fn normalized_negated_byte_and_unicode_ranges_execute_as_complements() {
    let bytes = RegexTablePlan::compile(r"[^a-fm-z]+").expect("normalized byte complement");
    assert_eq!(recognized_prefix(&bytes, b"g!"), Some(2));
    assert_eq!(recognized_prefix(&bytes, b"a!"), None);
    assert_eq!(recognized_prefix(&bytes, b"m!"), None);

    let unicode = RegexTablePlan::compile(r"[^\u{e9}]+").expect("normalized codepoint complement");
    assert_eq!(recognized_prefix(&unicode, b"a!"), Some(2));
    assert_eq!(recognized_prefix(&unicode, "é!".as_bytes()), None);

    let redundant = RegexTablePlan::compile(r"[^\u{61}-\u{7a}\u{62}]+")
        .expect("textual Unicode overlaps canonicalize before validation");
    assert_eq!(recognized_prefix(&redundant, b"!"), Some(1));
    assert_eq!(recognized_prefix(&redundant, b"b!"), None);
    assert_eq!(recognized_prefix(&redundant, b"z!"), None);
}
