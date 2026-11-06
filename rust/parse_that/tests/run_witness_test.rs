use parse_that::{ParserState, Span, scan_digits_mut, sp_boxed, sp_string};

#[test]
fn span_parser_rejects_a_span_from_another_source() {
    let foreign = sp_boxed(|state: &mut ParserState<'static>| {
        state.offset += 1;
        Some(Span::new(0, 1, "X"))
    });
    let parser = foreign.wrap_span(sp_string("("), sp_string(")"));
    let mut state = ParserState::new("(a)");

    let result = parser.call(&mut state);

    assert!(
        result.is_none(),
        "a span from another source was silently re-anchored: {result:?}",
    );
}

#[test]
fn parser_state_rejects_incoherent_source_and_bytes() {
    let mut state = ParserState::new("é");
    state.src_bytes = b"1";

    let result = scan_digits_mut(&mut state);

    assert!(
        result.is_none(),
        "scanner produced a byte range that is not a UTF-8 boundary in state.src: {result:?}",
    );
    assert_eq!(
        state.offset, 0,
        "a rejected incoherent state must not advance"
    );
}

#[cfg(feature = "diagnostics")]
mod diagnostics {
    use std::panic::{AssertUnwindSafe, catch_unwind};
    use std::thread;

    use parse_that::{clear_collected_diagnostics, get_collected_diagnostics, regex, string};

    fn recovered_literal<'a>() -> parse_that::Parser<'a, &'a str> {
        string("ok").recover(regex(r"[^;]*;").map(|_| ()), "RECOVERED")
    }

    #[test]
    fn diagnostics_do_not_survive_the_invocation_that_created_them() {
        clear_collected_diagnostics();
        let parser = recovered_literal();
        assert_eq!(parser.parse("bad;"), Some("RECOVERED"));
        assert_eq!(parser.parse("ok"), Some("ok"));

        let stale = get_collected_diagnostics();
        clear_collected_diagnostics();

        assert!(
            stale.is_empty(),
            "a later successful invocation observed {} stale diagnostic(s)",
            stale.len(),
        );
    }

    #[test]
    fn diagnostics_are_cleared_when_an_invocation_unwinds() {
        clear_collected_diagnostics();
        let parser = recovered_literal()
            .map(|_| -> &'static str { panic!("intentional U.W0 unwind after recovery") });

        let unwind = catch_unwind(AssertUnwindSafe(|| parser.parse("bad;")));
        assert!(unwind.is_err(), "the witness must cross the unwind path");
        assert_eq!(string("ok").parse("ok"), Some("ok"));

        let stale = get_collected_diagnostics();
        clear_collected_diagnostics();

        assert!(
            stale.is_empty(),
            "an unwound invocation retained {} stale diagnostic(s)",
            stale.len(),
        );
    }

    #[test]
    fn diagnostic_collection_is_thread_isolated() {
        clear_collected_diagnostics();

        let worker_count = thread::spawn(|| {
            clear_collected_diagnostics();
            let parser = recovered_literal();
            assert_eq!(parser.parse("bad;"), Some("RECOVERED"));
            let count = get_collected_diagnostics().len();
            clear_collected_diagnostics();
            count
        })
        .join()
        .expect("diagnostic worker must not panic");

        assert_eq!(worker_count, 1, "worker should collect its own diagnostic");
        assert!(
            get_collected_diagnostics().is_empty(),
            "worker diagnostics leaked into the parent thread",
        );
    }
}
