//! sk-v27 LW3.COMP-1b-RB: the compile budgets a table-plan caller sets.
//!
//! A caller that turns untrusted patterns into tables (a grammar compiler)
//! bounds two things the engine did not: how deep groups nest when the
//! pattern is parsed, so a hostile pattern is refused instead of exhausting
//! the stack, and how many NFA states the determinizer is given. Each bound
//! accepts its exact cap and refuses one past it, with a typed reason.

use parse_that_regex::{Dfa, DfaError, DfaOptions, ParseOptions, parse_with_nesting_limit};

fn byte_mode() -> ParseOptions {
    ParseOptions { unicode: false }
}

#[test]
fn group_nesting_accepts_the_cap_and_refuses_one_past_it() {
    let opts = byte_mode();
    // Three nested groups: depth 3.
    assert!(parse_with_nesting_limit("((a)(?:b)((?i:c)))", &opts, 3).is_ok());
    let err = parse_with_nesting_limit("((a)(?:b)((?i:c)))", &opts, 2).unwrap_err();
    assert!(err.message.contains("nesting"), "{err}");
    // Sibling groups do not add depth.
    assert!(parse_with_nesting_limit("(a)(b)(c)(d)", &opts, 1).is_ok());
    // A pattern with no group reads at limit 0.
    assert!(parse_with_nesting_limit("[a-z]+", &opts, 0).is_ok());
    assert!(parse_with_nesting_limit("(a)", &opts, 0).is_err());
}

#[test]
fn a_hostile_nesting_depth_is_refused_not_a_stack_overflow() {
    let opts = byte_mode();
    let depth = 200_000;
    let pattern = format!("{}a{}", "(".repeat(depth), ")".repeat(depth));
    let err = parse_with_nesting_limit(&pattern, &opts, 256).unwrap_err();
    assert!(err.message.contains("nesting"), "{err}");
    // The refusal names the offset of the group that crossed the cap.
    assert_eq!(err.offset, 256);
}

#[test]
fn nfa_states_accept_the_cap_and_refuse_one_past_it() {
    let opts = DfaOptions {
        unicode: false,
        ..DfaOptions::default()
    };
    let hir = parse_with_nesting_limit("(ab|cd)*e", &byte_mode(), 256).unwrap();
    let states = Dfa::nfa_state_count(&hir).unwrap();
    assert!(states > 1);
    let at_cap = Dfa::from_hir_with_nfa_limit(&hir, &opts, states).unwrap();
    let unbounded = Dfa::from_hir(&hir, &opts).unwrap();
    assert_eq!(at_cap.flat_transitions, unbounded.flat_transitions);
    assert_eq!(at_cap.byte_classes, unbounded.byte_classes);
    match Dfa::from_hir_with_nfa_limit(&hir, &opts, states - 1) {
        Err(DfaError::NfaStateLimit(limit)) => assert_eq!(limit, states - 1),
        other => panic!("expected NfaStateLimit, got {other:?}"),
    }
}
