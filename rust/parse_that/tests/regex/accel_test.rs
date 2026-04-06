use parse_that::regex::accel::{detect_accel, AccelStrategy};
use parse_that::regex::dfa::{Dfa, DfaOptions};

#[test]
fn no_accel_for_non_looping() {
    // Simple literal "abc" — no self-loops.
    let dfa = Dfa::compile("abc").unwrap();
    let accels = detect_accel(&dfa);
    assert!(accels.iter().all(|a| matches!(a.strategy, AccelStrategy::None)));
}

#[test]
fn memchr_for_negated_class() {
    // [^\n]+ — self-loops on everything except \n.
    // With Unicode mode, the DFA may have extra states for UTF-8 handling,
    // but the main looping state should have memchr-level acceleration.
    let opts = DfaOptions {
        unicode: false, // ASCII mode for simpler DFA.
        ..DfaOptions::default()
    };
    let dfa = Dfa::compile_with(r"[^\n]+", &opts).unwrap();
    let accels = detect_accel(&dfa);
    let has_accel = accels.iter().any(|a| {
        matches!(
            a.strategy,
            AccelStrategy::Memchr1(_)
                | AccelStrategy::Memchr2(_, _)
                | AccelStrategy::Memchr3(_, _, _)
        )
    });
    assert!(has_accel, "Expected memchr acceleration for [^\\n]+, got: {:?}",
        accels.iter().map(|a| format!("{:?}", a.strategy)).collect::<Vec<_>>());
}

#[test]
fn memchr2_for_json_string() {
    // [^"\\]+ — loops on everything except " and \.
    let opts = DfaOptions {
        unicode: false,
        ..DfaOptions::default()
    };
    let dfa = Dfa::compile_with(r#"[^"\\]+"#, &opts).unwrap();
    let accels = detect_accel(&dfa);
    let has_memchr = accels.iter().any(|a| {
        matches!(
            a.strategy,
            AccelStrategy::Memchr1(_)
                | AccelStrategy::Memchr2(_, _)
                | AccelStrategy::Memchr3(_, _, _)
        )
    });
    assert!(has_memchr, "Expected memchr acceleration for [^\"\\\\]+, got: {:?}",
        accels.iter().map(|a| format!("{:?}", a.strategy)).collect::<Vec<_>>());
}

#[test]
fn accel_for_wider_negated_class() {
    // [^abcde]+ — 5 exit bytes.
    let opts = DfaOptions {
        unicode: false,
        ..DfaOptions::default()
    };
    let dfa = Dfa::compile_with(r"[^abcde]+", &opts).unwrap();
    let accels = detect_accel(&dfa);
    let has_accel = accels.iter().any(|a| !matches!(a.strategy, AccelStrategy::None));
    assert!(has_accel, "Expected some acceleration for [^abcde]+, got: {:?}",
        accels.iter().map(|a| format!("{:?}", a.strategy)).collect::<Vec<_>>());
}
