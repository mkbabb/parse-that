#[cfg(feature = "diagnostics")]
mod tests {
    use parse_that::*;

    /// Strip ANSI escape codes for comparison.
    fn strip_ansi(s: &str) -> String {
        let re = regex::Regex::new(r"\x1b\[[0-9;]*m").unwrap();
        re.replace_all(s, "").to_string()
    }

    // ── CSS parser helpers ─────────────────────────────────────────

    fn ws_opt<'a>() -> Parser<'a, ()> {
        regex(r"[ \t\n\r]*").map(|_| ())
    }

    fn ident<'a>() -> Parser<'a, &'a str> {
        regex(r"[a-zA-Z_][a-zA-Z0-9_-]*")
    }

    fn css_number<'a>() -> Parser<'a, &'a str> {
        regex(r"-?(?:0|[1-9]\d*)(?:\.\d+)?")
    }

    fn css_dimension<'a>() -> Parser<'a, &'a str> {
        css_number()
            .skip(
                string("px")
                    .or(string("em"))
                    .or(string("rem"))
                    .or(string("%"))
                    .or(string("vh"))
                    .or(string("vw"))
                    .or(string("s"))
                    .or(string("ms"))
                    .or(string("deg")),
            )
            .map(|_| "dim")
    }

    fn css_string<'a>() -> Parser<'a, &'a str> {
        regex(r#""[^"]*""#).or(regex(r"'[^']*'"))
    }

    fn css_function_call<'a>() -> Parser<'a, &'a str> {
        ident()
            .skip(regex(r"[^)]*").wrap(string("("), string(")")))
            .map(|_| "fn")
    }

    fn css_value<'a>() -> Parser<'a, &'a str> {
        css_dimension()
            .or(css_function_call())
            .or(css_number())
            .or(css_string())
            .or(ident())
    }

    fn css_value_list<'a>() -> Parser<'a, Vec<&'a str>> {
        css_value().sep_by(ws_opt(), 1..)
    }

    // Sync parser: skip to next ; (not consuming } which marks block end)
    fn decl_sync<'a>() -> Parser<'a, ()> {
        regex(r"[^;{}]*;").map(|_| ())
    }

    fn declaration<'a>() -> Parser<'a, &'a str> {
        ident()
            .skip(string(":").trim_whitespace())
            .skip(css_value_list())
            .skip(string(";").trim_whitespace())
    }

    fn recovered_declaration<'a>() -> Parser<'a, &'a str> {
        declaration()
            .trim_whitespace()
            .recover(decl_sync(), "RECOVERED")
    }

    fn declaration_block<'a>() -> Parser<'a, Vec<&'a str>> {
        recovered_declaration()
            .many(0..)
            .trim_whitespace()
            .wrap(string("{"), string("}"))
    }

    fn selector<'a>() -> Parser<'a, &'a str> {
        string(".")
            .next(ident())
            .or(string("#").next(ident()))
            .or(string(":").next(ident()))
            .or(ident())
    }

    fn selector_list<'a>() -> Parser<'a, Vec<&'a str>> {
        selector().sep_by(regex(r"\s*,\s*").map(|_| ()), 1..)
    }

    fn css_rule<'a>() -> Parser<'a, (Vec<&'a str>, Vec<&'a str>)> {
        selector_list().skip(ws_opt()).then(declaration_block())
    }

    fn rule_sync<'a>() -> Parser<'a, ()> {
        regex(r"[^}]*}").map(|_| ())
    }

    fn recovered_rule<'a>() -> Parser<'a, (Vec<&'a str>, Vec<&'a str>)> {
        css_rule().recover(rule_sync(), (vec!["RECOVERED"], vec![]))
    }

    fn css_comment<'a>() -> Parser<'a, ()> {
        regex(r"(?s)/\*.*?\*/").map(|_| ())
    }

    fn ignorable<'a>() -> Parser<'a, ()> {
        regex(r"\s+").map(|_| ()).or(css_comment())
    }

    fn stylesheet<'a>() -> Parser<'a, Vec<(Vec<&'a str>, Vec<&'a str>)>> {
        ignorable().many(0..).next(
            recovered_rule()
                .skip(ignorable().many(0..))
                .many(0..),
        )
    }

    // ═════════════════════════════════════════════════════════════════
    // Tests
    // ═════════════════════════════════════════════════════════════════

    // ── Basic recover() tests ────────────────────────────────────

    #[test]
    fn test_recover_returns_normal_on_success() {
        clear_collected_diagnostics();
        let p = string("hello").recover(regex(r"[^;]*;").map(|_| ()), "RECOVERED");
        let (result, _) = p.parse_return_state("hello");
        assert!(result.is_some());
        assert_eq!(result.unwrap(), "hello");
        assert_eq!(get_collected_diagnostics().len(), 0);
    }

    #[test]
    fn test_recover_returns_sentinel_on_failure() {
        clear_collected_diagnostics();
        let p = string("hello").recover(regex(r"[^;]*;").map(|_| ()), "RECOVERED");
        let (result, _) = p.parse_return_state("xyz123;");
        assert!(result.is_some());
        assert_eq!(result.unwrap(), "RECOVERED");
        assert_eq!(get_collected_diagnostics().len(), 1);
    }

    #[test]
    fn test_recover_gives_up_if_sync_fails() {
        clear_collected_diagnostics();
        let p = string("hello").recover(regex(r"[^;]*;").map(|_| ()), "RECOVERED");
        let (result, _) = p.parse_return_state("xyz");
        assert!(result.is_none(), "should fail if sync also fails");
        assert_eq!(
            get_collected_diagnostics().len(),
            0,
            "should not collect diagnostic when sync fails"
        );
    }

    // ── Declaration recovery tests ───────────────────────────────

    #[test]
    fn test_recover_declaration_missing_value() {
        clear_collected_diagnostics();
        let p = recovered_declaration().many(0..);
        let (result, state) = p.parse_return_state("color: ; font-size: 16px;");
        assert!(result.is_some());
        let decls = result.unwrap();
        assert_eq!(decls.len(), 2, "should have 2 declarations, got {:?}", decls);
        assert_eq!(decls[0], "RECOVERED");
        assert_eq!(decls[1], "font-size");
        assert_eq!(get_collected_diagnostics().len(), 1);
        let _ = state;
    }

    #[test]
    fn test_recover_declaration_missing_colon() {
        clear_collected_diagnostics();
        let p = recovered_declaration().many(0..);
        let (result, _) = p.parse_return_state("width 100%; max-width: 960px;");
        assert!(result.is_some());
        let decls = result.unwrap();
        assert_eq!(decls.len(), 2);
        assert_eq!(decls[0], "RECOVERED");
        assert_eq!(decls[1], "max-width");
        assert_eq!(get_collected_diagnostics().len(), 1);
    }

    #[test]
    fn test_recover_multiple_bad_declarations() {
        clear_collected_diagnostics();
        let p = recovered_declaration().many(0..);
        let (result, _) = p.parse_return_state("color: ; width 100%; font-size: 16px;");
        assert!(result.is_some());
        let decls = result.unwrap();
        assert_eq!(decls.len(), 3);
        assert_eq!(decls[0], "RECOVERED");
        assert_eq!(decls[1], "RECOVERED");
        assert_eq!(decls[2], "font-size");
        assert_eq!(get_collected_diagnostics().len(), 2);
    }

    // ── Complex CSS file test ───────────────────────────────────

    #[test]
    fn test_complex_css_file_collects_diagnostics() {
        clear_collected_diagnostics();
        let css_content = include_str!("../../../grammar/tests/css/complex-errors.css");
        let p = stylesheet();
        let (result, _) = p.parse_return_state(css_content);
        assert!(result.is_some(), "stylesheet should parse with recovery");

        let diagnostics = get_collected_diagnostics();
        assert!(
            diagnostics.len() >= 3,
            "should collect at least 3 diagnostics, got {}",
            diagnostics.len()
        );

        // Print diagnostics for visual inspection
        let output = format_all_diagnostics(&diagnostics, css_content);
        eprintln!("\n{}\n", output);
    }

    #[test]
    fn test_complex_css_file_parses_success_rule() {
        clear_collected_diagnostics();
        let css_content = include_str!("../../../grammar/tests/css/complex-errors.css");
        let p = stylesheet();
        let (result, _) = p.parse_return_state(css_content);
        assert!(result.is_some());

        let rules = result.unwrap();
        let valid_rules: Vec<_> = rules
            .iter()
            .filter(|(selectors, _)| selectors[0] != "RECOVERED")
            .collect();
        assert!(
            !valid_rules.is_empty(),
            "should have at least one valid rule parsed"
        );

        let has_success = valid_rules
            .iter()
            .any(|(selectors, _)| selectors.iter().any(|s| *s == "success"));
        assert!(has_success, "should have parsed the .success rule");
    }

    #[test]
    fn test_diagnostics_have_valid_line_numbers() {
        clear_collected_diagnostics();
        let css_content = include_str!("../../../grammar/tests/css/complex-errors.css");
        let p = stylesheet();
        let _ = p.parse_return_state(css_content);

        let diagnostics = get_collected_diagnostics();
        for d in &diagnostics {
            assert!(d.line > 0, "line should be positive, got {}", d.line);
        }
    }

    #[test]
    fn test_individual_diagnostics_format_correctly() {
        clear_collected_diagnostics();
        let css_content = include_str!("../../../grammar/tests/css/complex-errors.css");
        let p = stylesheet();
        let _ = p.parse_return_state(css_content);

        let diagnostics = get_collected_diagnostics();
        assert!(!diagnostics.is_empty());
        for d in &diagnostics {
            let formatted = strip_ansi(&format_diagnostic(d, css_content));
            assert!(
                formatted.contains("Err"),
                "formatted diagnostic should contain 'Err': {}",
                formatted
            );
            assert!(
                formatted.contains("|"),
                "formatted diagnostic should contain pipe: {}",
                formatted
            );
        }
    }

    // ── Format helpers tests ─────────────────────────────────────

    #[test]
    fn test_format_all_diagnostics_summary() {
        clear_collected_diagnostics();
        let sync = regex(r"[^;]*;").map(|_| ());
        let p = string("hello").recover(sync, "RECOVERED");

        let _ = p.parse_return_state("xyz;");
        let _ = p.parse_return_state("abc;");

        let diagnostics = get_collected_diagnostics();
        assert_eq!(diagnostics.len(), 2);

        let output = strip_ansi(&format_all_diagnostics(&diagnostics, "xyz; abc;"));
        assert!(
            output.contains("2 errors found"),
            "should contain summary line: {}",
            output
        );
    }

    #[test]
    fn test_format_all_diagnostics_empty() {
        assert_eq!(format_all_diagnostics(&[], ""), "");
    }

    #[test]
    fn test_format_all_diagnostics_single() {
        clear_collected_diagnostics();
        let sync = regex(r"[^;]*;").map(|_| ());
        let p = string("hello").recover(sync, "RECOVERED");
        let _ = p.parse_return_state("xyz;");

        let diagnostics = get_collected_diagnostics();
        let output = strip_ansi(&format_all_diagnostics(&diagnostics, "xyz;"));
        assert!(
            output.contains("1 error found"),
            "should say '1 error found': {}",
            output
        );
    }
}
