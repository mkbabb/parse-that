use parse_that::kernel::{
    Input, RegexPlan, RegexPlanError, RegexTerminal, Run, Step, eof, literal, regex,
};

fn ascii_word_terminal() -> RegexTerminal<'static> {
    static BYTE_CLASSES: [u8; 256] = {
        let mut classes = [1_u8; 256];
        let mut byte = b'a';
        while byte <= b'z' {
            classes[byte as usize] = 0;
            byte += 1;
        }
        classes
    };
    static TRANSITIONS: [u32; 4] = [1, RegexPlan::DEAD, 1, RegexPlan::DEAD];
    static ACCEPTING: [bool; 2] = [false, true];

    let plan = RegexPlan::new(&BYTE_CLASSES, 2, 2, 0, &TRANSITIONS, &ACCEPTING)
        .expect("valid two-state ASCII word plan");
    RegexTerminal::new(plan)
}

#[test]
fn literal_and_eof_match_checked_spans() {
    let mut run = Run::new(Input::new(b"ab"));
    let literal_span = run
        .parse_prefix(|run| literal(run, b"ab"))
        .into_matched()
        .expect("literal match");
    assert_eq!(literal_span.as_bytes(), b"ab");

    let eof_span = eof(&mut run).into_matched().expect("EOF match");
    assert_eq!(eof_span.start(), 2);
    assert_eq!(eof_span.end(), 2);
}

#[test]
fn terminal_mismatch_does_not_advance_the_cursor() {
    let mut run = Run::new(Input::new(b"abc"));
    assert!(matches!(literal(&mut run, b"abd"), Step::Mismatch(_)));
    assert_eq!(run.cursor().offset(), 0);
}

#[test]
fn regex_terminal_uses_the_longest_accepting_prefix() {
    let terminal = ascii_word_terminal();
    let mut run = Run::new(Input::new(b"alpha42"));
    let span = regex(&mut run, &terminal)
        .into_matched()
        .expect("regex match");

    assert_eq!(span.as_bytes(), b"alpha");
    assert_eq!(run.cursor().offset(), 5);
}

#[test]
fn regex_returns_the_last_accept_before_a_nonaccepting_traversal() {
    static BYTE_CLASSES: [u8; 256] = {
        let mut classes = [2_u8; 256];
        classes[b'a' as usize] = 0;
        classes[b'b' as usize] = 1;
        classes
    };
    static TRANSITIONS: [u32; 9] = [
        1,
        RegexPlan::DEAD,
        RegexPlan::DEAD,
        RegexPlan::DEAD,
        2,
        RegexPlan::DEAD,
        RegexPlan::DEAD,
        RegexPlan::DEAD,
        RegexPlan::DEAD,
    ];
    static ACCEPTING: [bool; 3] = [false, true, false];
    static PLAN: RegexPlan<'static> =
        match RegexPlan::new(&BYTE_CLASSES, 3, 3, 0, &TRANSITIONS, &ACCEPTING) {
            Ok(plan) => plan,
            Err(_) => panic!("valid longest-prefix plan"),
        };

    let terminal = RegexTerminal::new(PLAN);
    let mut run = Run::new(Input::new(b"ab!"));
    let span = regex(&mut run, &terminal)
        .into_matched()
        .expect("earlier accepting state");
    assert_eq!(span.as_bytes(), b"a");
    assert_eq!(run.cursor().offset(), 1);
}

#[test]
fn regex_partial_traversal_without_an_accept_is_atomic() {
    static CLASSES: [u8; 256] = [0; 256];
    static TRANSITIONS: [u32; 2] = [1, RegexPlan::DEAD];
    static ACCEPTING: [bool; 2] = [false, false];
    static PLAN: RegexPlan<'static> =
        match RegexPlan::new(&CLASSES, 2, 1, 0, &TRANSITIONS, &ACCEPTING) {
            Ok(plan) => plan,
            Err(_) => panic!("valid nonaccepting plan"),
        };

    let terminal = RegexTerminal::new(PLAN);
    let mut run = Run::new(Input::new(b"x"));
    assert!(matches!(regex(&mut run, &terminal), Step::Mismatch(_)));
    assert_eq!(run.cursor().offset(), 0);
}

#[test]
fn regex_plan_rejects_malformed_tables_before_recognition() {
    let classes = [0_u8; 256];

    assert!(
        RegexPlan::new(&classes, 2, 1, 0, &[0], &[true]).is_err(),
        "transition table must be states × classes"
    );
    assert!(
        RegexPlan::new(&classes, 1, 1, 0, &[7], &[true]).is_err(),
        "transition target must name a state or DEAD"
    );

    let invalid_classes = [1_u8; 256];
    assert!(
        RegexPlan::new(&invalid_classes, 1, 1, 0, &[0], &[true]).is_err(),
        "every byte class must be in range"
    );
}

#[test]
fn regex_plan_accepts_exactly_256_byte_classes_and_rejects_257() {
    let classes = core::array::from_fn(|byte| byte as u8);
    let transitions_256 = [RegexPlan::DEAD; 256];
    let accepting = [true];

    assert!(
        RegexPlan::new(&classes, 1, 256, 0, &transitions_256, &accepting).is_ok(),
        "all 256 u8-representable byte classes are valid"
    );

    let transitions_257 = [RegexPlan::DEAD; 257];
    assert!(
        matches!(
            RegexPlan::new(&classes, 1, 257, 0, &transitions_257, &accepting),
            Err(RegexPlanError::ClassCount)
        ),
        "the runtime ABI must reject a class count the compiler cannot emit"
    );
}

#[test]
fn regex_plan_preserves_explicit_dimensions_and_start_state() {
    static CLASSES: [u8; 256] = [0; 256];
    static TRANSITIONS: [u32; 6] = [
        RegexPlan::DEAD,
        RegexPlan::DEAD,
        RegexPlan::DEAD,
        0,
        RegexPlan::DEAD,
        RegexPlan::DEAD,
    ];
    static ACCEPTING: [bool; 2] = [true, false];
    static PLAN: RegexPlan<'static> =
        match RegexPlan::new(&CLASSES, 2, 3, 1, &TRANSITIONS, &ACCEPTING) {
            Ok(plan) => plan,
            Err(_) => panic!("static plan must validate"),
        };

    let terminal = RegexTerminal::new(PLAN);
    let mut run = Run::new(Input::new(b"x"));
    let span = regex(&mut run, &terminal)
        .into_matched()
        .expect("non-zero start state and unused class column");
    assert_eq!(span.as_bytes(), b"x");

    let mut empty = Run::new(Input::new(b""));
    assert!(
        matches!(regex(&mut empty, &terminal), Step::Mismatch(_)),
        "acceptance is read from the explicit start state, not state zero"
    );

    static NULLABLE_ACCEPTING: [bool; 2] = [false, true];
    static NULLABLE_TRANSITIONS: [u32; 2] = [RegexPlan::DEAD, RegexPlan::DEAD];
    static NULLABLE_PLAN: RegexPlan<'static> = match RegexPlan::new(
        &CLASSES,
        2,
        1,
        1,
        &NULLABLE_TRANSITIONS,
        &NULLABLE_ACCEPTING,
    ) {
        Ok(plan) => plan,
        Err(_) => panic!("nullable static plan must validate"),
    };
    let nullable = RegexTerminal::new(NULLABLE_PLAN);
    assert!(
        matches!(
            regex(&mut Run::new(Input::new(b"")), &nullable),
            Step::Matched(_)
        ),
        "an accepting non-zero start state recognizes epsilon"
    );
}
