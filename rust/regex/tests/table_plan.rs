//! External contract tests for the compile-owned/runtime-consumed table ABI.

use bbnf_regex::{
    DEAD_STATE, RegexTablePlan, TablePlanCompileError, TablePlanError, TablePlanOptions,
};

fn byte_classes(class_count: u8) -> [u8; 256] {
    let mut classes = [0_u8; 256];
    for (byte, class) in classes.iter_mut().enumerate() {
        *class = (byte % usize::from(class_count)) as u8;
    }
    classes
}

fn longest_prefix(plan: &RegexTablePlan, input: &[u8]) -> Option<usize> {
    let mut state = plan.start_state();
    let mut position = 0;
    let mut accepted = plan.accepting()[state as usize].then_some(0);
    while position < input.len() {
        let class = plan.byte_classes()[input[position] as usize] as usize;
        let next = plan.transitions()[state as usize * plan.class_count() as usize + class];
        if next == DEAD_STATE {
            break;
        }
        state = next;
        position += 1;
        if plan.accepting()[state as usize] {
            accepted = Some(position);
        }
    }
    accepted
}

#[test]
fn compiled_plan_is_complete_checked_emission_data() {
    let plan = RegexTablePlan::compile("[a-c]+").expect("supported byte regex");

    assert!(plan.state_count() >= 2);
    assert!(plan.class_count() >= 2);
    assert_eq!(plan.start_state(), 0);
    assert_eq!(plan.byte_classes().len(), 256);
    assert_eq!(
        plan.transitions().len(),
        plan.state_count() as usize * plan.class_count() as usize
    );
    assert_eq!(plan.accepting().len(), plan.state_count() as usize);
    assert_eq!(longest_prefix(&plan, b"abcx"), Some(3));
    assert_eq!(longest_prefix(&plan, b"xabc"), None);
}

#[test]
fn checked_constructor_rejects_every_out_of_domain_axis() {
    assert_eq!(
        RegexTablePlan::from_parts([0; 256], 0, 1, 0, Vec::new(), Vec::new()),
        Err(TablePlanError::EmptyStates)
    );
    assert_eq!(
        RegexTablePlan::from_parts([0; 256], 1, 0, 0, Vec::new(), vec![false]),
        Err(TablePlanError::EmptyClasses)
    );
    assert_eq!(
        RegexTablePlan::from_parts([0; 256], 1, 257, 0, vec![DEAD_STATE; 257], vec![false],),
        Err(TablePlanError::TooManyClasses { class_count: 257 })
    );
    assert_eq!(
        RegexTablePlan::from_parts([0; 256], 2, 1, 0, vec![0, 0], vec![false]),
        Err(TablePlanError::StateCountMismatch {
            declared: 2,
            accepting: 1,
        })
    );
    assert_eq!(
        RegexTablePlan::from_parts([0; 256], 1, 1, 1, vec![0], vec![false]),
        Err(TablePlanError::StartStateOutOfRange {
            start_state: 1,
            state_count: 1,
        })
    );

    let mut invalid_class = [0_u8; 256];
    invalid_class[255] = 1;
    assert_eq!(
        RegexTablePlan::from_parts(invalid_class, 1, 1, 0, vec![0], vec![false]),
        Err(TablePlanError::ByteClassOutOfRange {
            byte: 255,
            class: 1,
            class_count: 1,
        })
    );
    assert_eq!(
        RegexTablePlan::from_parts([0; 256], 2, 1, 0, vec![0], vec![false; 2]),
        Err(TablePlanError::TransitionTableLength {
            expected: 2,
            actual: 1,
        })
    );
    assert_eq!(
        RegexTablePlan::from_parts([0; 256], 2, 1, 0, vec![DEAD_STATE, 2], vec![false; 2]),
        Err(TablePlanError::TransitionTargetOutOfRange {
            index: 1,
            target: 2,
            state_count: 2,
        })
    );
}

#[test]
fn dead_sentinel_is_valid_but_not_a_state() {
    let plan = RegexTablePlan::from_parts([0; 256], 1, 1, 0, vec![DEAD_STATE], vec![true])
        .expect("dead transitions are part of the ABI");
    assert_eq!(plan.transitions(), &[DEAD_STATE]);
}

#[test]
fn stable_serialization_round_trips_through_validation() {
    let plan = RegexTablePlan::compile(r#"[^"\\]+"#).expect("supported regex");
    let encoded = plan.to_bytes();
    let decoded = RegexTablePlan::from_bytes(&encoded).expect("valid encoding");
    assert_eq!(decoded, plan);

    let mut bad_magic = encoded.clone();
    bad_magic[0] ^= 0xff;
    assert_eq!(
        RegexTablePlan::from_bytes(&bad_magic),
        Err(TablePlanError::BadMagic)
    );

    let mut reserved = encoded.clone();
    reserved[14] = 1;
    assert_eq!(
        RegexTablePlan::from_bytes(&reserved),
        Err(TablePlanError::InvalidReservedBits(1))
    );

    let mut invalid_accept = encoded.clone();
    invalid_accept[20 + 256] = 2;
    assert_eq!(
        RegexTablePlan::from_bytes(&invalid_accept),
        Err(TablePlanError::InvalidAcceptByte { state: 0, value: 2 })
    );

    let mut trailing = encoded;
    trailing.push(0);
    assert!(matches!(
        RegexTablePlan::from_bytes(&trailing),
        Err(TablePlanError::EncodedLength { .. })
    ));
}

#[test]
fn assertions_fail_closed_instead_of_becoming_empty_transitions() {
    assert!(matches!(
        RegexTablePlan::compile("^value"),
        Err(TablePlanCompileError::UnsupportedLook(_))
    ));
}

#[test]
fn caller_controls_the_determinization_limit() {
    let error = RegexTablePlan::compile_with(
        "a",
        TablePlanOptions {
            state_limit: 1,
            ..TablePlanOptions::default()
        },
    )
    .expect_err("one state cannot represent a nonempty literal");
    assert!(matches!(
        error,
        TablePlanCompileError::StateLimitExceeded { limit: 1 }
    ));

    assert!(matches!(
        RegexTablePlan::compile_with(
            "",
            TablePlanOptions {
                state_limit: 0,
                ..TablePlanOptions::default()
            }
        ),
        Err(TablePlanCompileError::StateLimitExceeded { limit: 0 })
    ));
}

#[test]
fn alternate_compilers_may_supply_nonzero_start_states() {
    let plan = RegexTablePlan::from_parts(
        byte_classes(1),
        2,
        1,
        1,
        vec![DEAD_STATE, 0],
        vec![true, false],
    )
    .expect("start state is explicit, not assumed");
    assert_eq!(plan.start_state(), 1);
    assert_eq!(longest_prefix(&plan, b"x"), Some(1));
}
