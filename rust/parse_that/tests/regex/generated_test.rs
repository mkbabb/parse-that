use parse_that::regex::{Hir, parse, parse_generated};

#[test]
fn direct_and_generated_literal_control() {
    assert_same_success("a");
}

#[test]
fn direct_and_generated_accept_literal_closing_bracket() {
    let expected = Hir::Literal(vec![b']']);
    let direct = parse("]");
    let generated = parse_generated("]");
    let both_accept_literal = matches!(&direct, Ok(hir) if hir == &expected)
        && matches!(&generated, Ok(hir) if hir == &expected);
    assert!(
        both_accept_literal,
        "closing bracket must be the same literal in both routes: direct={direct:?}; generated={generated:?}"
    );
}

#[test]
fn direct_and_generated_reject_malformed_patterns_with_the_same_diagnostic() {
    let patterns = [
        r"\q",
        r"[\q]",
        r"\x",
        r"\xG0",
        r"\u{}",
        r"\u{110000}",
        r"\p{}",
        r"\p{NoSuch}",
    ];
    let mut mismatches = Vec::new();

    for pattern in patterns {
        let direct = parse(pattern);
        let generated = parse_generated(pattern);
        match (&direct, &generated) {
            (Err(direct), Err(generated))
                if direct.offset == generated.offset && direct.message == generated.message => {}
            _ => mismatches.push(format!(
                "{pattern:?}: direct={direct:?}; generated={generated:?}"
            )),
        }
    }

    assert!(
        mismatches.is_empty(),
        "direct/generated diagnostic disagreements:\n{}",
        mismatches.join("\n")
    );
}

fn assert_same_success(pattern: &str) {
    let direct = parse(pattern).unwrap_or_else(|error| {
        panic!("direct parser rejected {pattern:?}: {error}");
    });
    let generated = parse_generated(pattern).unwrap_or_else(|error| {
        panic!("generated parser rejected {pattern:?}: {error}");
    });
    assert_eq!(direct, generated, "HIR disagreement for {pattern:?}");
}
