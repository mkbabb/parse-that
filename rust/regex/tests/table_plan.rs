//! External contract tests for the compile-owned/runtime-consumed table ABI.

use bbnf_regex::{
    ByteRange, CharClass, CodepointRange, DEAD_STATE, Hir, HirValidationError, RegexTablePlan,
    Repetition, TablePlanCompileError, TablePlanError, TablePlanOptions,
};
use std::fmt::Write as _;

fn byte_classes(class_count: u8) -> [u8; 256] {
    let mut classes = [0_u8; 256];
    for (byte, class) in classes.iter_mut().enumerate() {
        *class = (byte % usize::from(class_count)) as u8;
    }
    classes
}

fn bit_partition_pattern() -> String {
    let mut pattern = String::new();
    for bit in 0..8 {
        pattern.push('[');
        for byte in 0_u16..=255 {
            if byte & (1 << bit) != 0 {
                write!(pattern, r"\x{byte:02x}").expect("writing to String is infallible");
            }
        }
        pattern.push(']');
    }
    pattern
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
}

#[test]
fn merging_a_range_ending_at_ff_does_not_overflow() {
    let plan = RegexTablePlan::compile(r"[\x00-\xffa]")
        .expect("a full byte range followed by a redundant member is valid");
    assert_eq!(plan.class_count(), 1);
}

#[test]
fn all_256_byte_equivalence_classes_are_representable_on_the_large_set_path() {
    let mut pattern = String::new();
    for byte in 0_u16..=255 {
        if byte != 0 {
            pattern.push('|');
        }
        write!(pattern, r"\x{byte:02x}").expect("writing to String is infallible");
    }

    let plan = RegexTablePlan::compile(&pattern).expect("all byte alternatives compile");
    assert_eq!(plan.class_count(), 256);
    assert_eq!(
        plan.byte_classes()
            .iter()
            .copied()
            .collect::<std::collections::BTreeSet<_>>()
            .len(),
        256
    );
}

#[test]
fn all_256_byte_equivalence_classes_are_representable_on_the_small_set_path() {
    let plan =
        RegexTablePlan::compile(&bit_partition_pattern()).expect("eight sets encode every byte");
    assert_eq!(plan.class_count(), 256);
    assert_eq!(
        plan.byte_classes()
            .iter()
            .copied()
            .collect::<std::collections::BTreeSet<_>>()
            .len(),
        256
    );
}

#[test]
fn nfa_construction_obeys_its_own_pre_determinization_budget() {
    let error = RegexTablePlan::compile_with(
        "a{1000000}",
        TablePlanOptions {
            nfa_state_limit: 32,
            ..TablePlanOptions::default()
        },
    )
    .expect_err("a huge bounded repetition must stop during NFA construction");
    assert!(matches!(
        error,
        TablePlanCompileError::NfaStateLimitExceeded { limit: 32 }
    ));

    RegexTablePlan::compile("a").expect("a budget failure does not poison later compilation");
}

#[test]
fn textual_parser_rejects_extreme_group_depth_before_stack_exhaustion() {
    let pattern = format!("{}a{}", "(".repeat(20_000), ")".repeat(20_000));
    let error = RegexTablePlan::compile_with(
        &pattern,
        TablePlanOptions {
            nesting_limit: 64,
            ..TablePlanOptions::default()
        },
    )
    .expect_err("deep valid syntax must stop at the configured parser budget");

    match error {
        TablePlanCompileError::Parse(error) => {
            assert!(error.message.contains("64-level limit"));
            assert!(error.offset <= 65);
        }
        other => panic!("expected a typed parse error, got {other:?}"),
    }
}

#[test]
fn public_hir_entry_validates_ranges_repetition_bounds_and_depth() {
    let options = TablePlanOptions {
        nesting_limit: 8,
        ..TablePlanOptions::default()
    };
    let invalid = [
        (
            Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(b'z', b'a')],
                negated: false,
            }),
            HirValidationError::ReversedByteRange {
                start: b'z',
                end: b'a',
            },
        ),
        (
            Hir::Class(CharClass::Unicode {
                ranges: vec![CodepointRange::new('z', 'a')],
                negated: false,
            }),
            HirValidationError::ReversedCodepointRange {
                start: 'z',
                end: 'a',
            },
        ),
        (
            Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(b'm', b'z'), ByteRange::new(b'a', b'f')],
                negated: true,
            }),
            HirValidationError::UnsortedOrOverlappingByteRanges {
                previous_end: b'z',
                next_start: b'a',
            },
        ),
        (
            Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(b'a', b'm'), ByteRange::new(b'f', b'z')],
                negated: true,
            }),
            HirValidationError::UnsortedOrOverlappingByteRanges {
                previous_end: b'm',
                next_start: b'f',
            },
        ),
        (
            Hir::Class(CharClass::Unicode {
                ranges: vec![CodepointRange::new('m', 'z'), CodepointRange::new('a', 'f')],
                negated: true,
            }),
            HirValidationError::UnsortedOrOverlappingCodepointRanges {
                previous_end: 'z',
                next_start: 'a',
            },
        ),
        (
            Hir::Class(CharClass::Unicode {
                ranges: vec![CodepointRange::new('a', 'm'), CodepointRange::new('f', 'z')],
                negated: true,
            }),
            HirValidationError::UnsortedOrOverlappingCodepointRanges {
                previous_end: 'm',
                next_start: 'f',
            },
        ),
        (
            Hir::Repetition(Repetition {
                sub: Box::new(Hir::Literal(vec![b'a'])),
                min: 2,
                max: Some(1),
                greedy: true,
            }),
            HirValidationError::RepetitionBounds {
                minimum: 2,
                maximum: 1,
            },
        ),
    ];

    for (hir, expected) in invalid {
        assert!(matches!(
            RegexTablePlan::from_hir(&hir, options),
            Err(TablePlanCompileError::InvalidHir(actual)) if actual == expected
        ));
    }

    let mut deep = Hir::Literal(vec![b'a']);
    for _ in 0..10 {
        deep = Hir::Group(Box::new(deep));
    }
    assert!(matches!(
        RegexTablePlan::from_hir(&deep, options),
        Err(TablePlanCompileError::InvalidHir(
            HirValidationError::NestingLimitExceeded { limit: 8 }
        ))
    ));
}

#[test]
fn reversed_character_class_ranges_are_parse_errors_not_empty_languages() {
    for pattern in [r"[z-a]", r"[\xff-\x00]", r"[\u{10ffff}-\u{0}]"] {
        let error =
            RegexTablePlan::compile(pattern).expect_err("a reversed range is invalid regex syntax");
        assert!(
            matches!(error, TablePlanCompileError::Parse(_)),
            "{pattern} returned {error:?}"
        );
    }
}

#[test]
fn textual_unicode_classes_canonicalize_redundant_and_overlapping_ranges() {
    for pattern in [
        r"[\u{61}-\u{7a}\u{62}]",
        r"[^\u{61}-\u{7a}\u{62}]",
        r"[\u{61}-\u{6d}\u{66}-\u{7a}]",
    ] {
        RegexTablePlan::compile(pattern)
            .unwrap_or_else(|error| panic!("{pattern} must canonicalize: {error}"));
    }
}

#[test]
fn table_compilation_has_one_byte_oriented_syntax_policy() {
    let plan = RegexTablePlan::compile(r"\w+").expect("ASCII word syntax compiles");
    assert_eq!(
        plan.byte_classes()[b'_' as usize],
        plan.byte_classes()[b'a' as usize]
    );
    assert_ne!(
        plan.byte_classes()[b'a' as usize],
        plan.byte_classes()[0xc3]
    );
    assert!(matches!(
        RegexTablePlan::compile("[é]"),
        Err(TablePlanCompileError::NonAsciiPattern { offset: 1 })
    ));

    RegexTablePlan::compile(r"\u{e9}")
        .expect("an explicit codepoint escape has unambiguous UTF-8 byte semantics");
}
