#[cfg(feature = "diagnostics")]
mod tests {
    use parse_that::*;

    /// Strip ANSI escape codes for comparison.
    fn strip_ansi(s: &str) -> String {
        let re = regex::Regex::new(r"\x1b\[[0-9;]*m").unwrap();
        re.replace_all(s, "").to_string()
    }

    #[test]
    fn test_expected_set_string_single() {
        let p = string("hello");
        let (result, state) = p.parse_return_state("xyz");
        assert!(result.is_none());
        assert!(state.expected.contains(&"\"hello\""));
    }

    #[test]
    fn test_expected_set_or_accumulates() {
        let p = string("a").or(string("b")).or(string("c"));
        let (result, state) = p.parse_return_state("xyz");
        assert!(result.is_none());
        assert!(
            state.expected.contains(&"\"a\""),
            "expected contains a: {:?}",
            state.expected
        );
        assert!(
            state.expected.contains(&"\"b\""),
            "expected contains b: {:?}",
            state.expected
        );
        assert!(
            state.expected.contains(&"\"c\""),
            "expected contains c: {:?}",
            state.expected
        );
    }

    #[test]
    fn test_expected_set_clears_on_advance() {
        // "a" succeeds at offset 0, then "b" fails at offset 1
        let p = string("a").then(string("b"));
        let (result, state) = p.parse_return_state("ax");
        assert!(result.is_none());
        assert!(
            state.expected.contains(&"\"b\""),
            "expected contains b: {:?}",
            state.expected
        );
        assert!(
            !state.expected.contains(&"\"a\""),
            "expected should not contain a: {:?}",
            state.expected
        );
    }

    #[test]
    fn test_expected_set_regex() {
        let p = regex(r"\d+");
        let (result, state) = p.parse_return_state("hello");
        assert!(result.is_none());
        assert!(
            !state.expected.is_empty(),
            "expected should have regex label"
        );
        assert!(
            state.expected[0].contains("\\d+"),
            "label should contain regex pattern: {:?}",
            state.expected
        );
    }

    #[test]
    fn test_expected_set_dispatch_byte() {
        let p = dispatch_byte(vec![(b'a', string("abc")), (b'b', string("bcd"))]);
        let (result, state) = p.parse_return_state("xyz");
        assert!(result.is_none());
        assert!(
            !state.expected.is_empty(),
            "dispatch should set expected on failure"
        );
        assert!(
            state.expected[0].contains("one of"),
            "label should be 'one of ...': {:?}",
            state.expected
        );
    }

    #[test]
    fn test_parse_or_error_populates_expected() {
        let p = string("a").or(string("b"));
        let err = p.parse_or_error("xyz").unwrap_err();
        assert!(
            !err.expected.is_empty(),
            "ParseError should have expected: {:?}",
            err.expected
        );
        assert!(err.expected.contains(&"\"a\"".to_string()));
        assert!(err.expected.contains(&"\"b\"".to_string()));
    }

    #[test]
    fn test_wrap_suggestion_unclosed() {
        let p = string("hello").wrap(string("["), string("]"));
        let (result, state) = p.parse_return_state("[hello");
        assert!(result.is_none());
        assert!(
            !state.suggestions.is_empty(),
            "wrap should add unclosed delimiter suggestion"
        );
        assert!(
            matches!(
                &state.suggestions[0].kind,
                state::SuggestionKind::UnclosedDelimiter { .. }
            ),
            "suggestion should be UnclosedDelimiter: {:?}",
            state.suggestions
        );
        assert!(
            !state.secondary_spans.is_empty(),
            "wrap should add secondary span"
        );
        assert!(
            state.secondary_spans[0].label.contains("opened here"),
            "secondary span should mention 'opened here': {:?}",
            state.secondary_spans
        );
    }

    #[test]
    fn test_eof_trailing_content_suggestion() {
        let p = string("hello").eof();
        let (result, state) = p.parse_return_state("hello world");
        assert!(result.is_none());
        assert!(
            state.expected.contains(&"<end of input>"),
            "eof should add expected label: {:?}",
            state.expected
        );
        assert!(
            !state.suggestions.is_empty(),
            "eof should add trailing content suggestion"
        );
    }

    #[test]
    fn test_column_number_first_line() {
        let state = ParserState::new("hello world");
        assert_eq!(state.get_column_number(), 0);
        assert_eq!(state.get_line_number(), 1);
    }

    #[test]
    fn test_column_number_after_newline() {
        let mut state = ParserState::new("line1\nline2");
        state.offset = 8; // "ne" into line2
        assert_eq!(state.get_column_number(), 2);
        assert_eq!(state.get_line_number(), 2);
    }

    #[test]
    fn test_format_expected_empty() {
        assert_eq!(debug::format_expected(&[]), "");
    }

    #[test]
    fn test_format_expected_single() {
        assert_eq!(debug::format_expected(&["\"hello\""]), "expected \"hello\"");
    }

    #[test]
    fn test_format_expected_two() {
        assert_eq!(
            debug::format_expected(&["\"a\"", "\"b\""]),
            "expected \"a\" or \"b\""
        );
    }

    #[test]
    fn test_format_expected_three_oxford_comma() {
        assert_eq!(
            debug::format_expected(&["\"a\"", "\"b\"", "\"c\""]),
            "expected \"a\", \"b\", or \"c\""
        );
    }

    #[test]
    fn test_state_print_ok() {
        let state = ParserState::new("hello world");
        let output = strip_ansi(&state_print(Ok(&state), "TEST", ""));
        assert!(
            output.contains("Ok"),
            "output should contain Ok: {}",
            output
        );
        assert!(
            output.contains("0"),
            "output should contain offset: {}",
            output
        );
    }

    #[test]
    fn test_state_print_done() {
        let mut state = ParserState::new("hello");
        state.offset = 5;
        let output = strip_ansi(&state_print(Ok(&state), "TEST", ""));
        assert!(
            output.contains("Done"),
            "output should contain Done: {}",
            output
        );
    }

    #[test]
    fn test_state_print_err() {
        let state = ParserState::new("hello");
        let output = strip_ansi(&state_print(Err(&state), "TEST", ""));
        assert!(
            output.contains("Err"),
            "output should contain Err: {}",
            output
        );
    }

    #[test]
    fn test_state_print_err_with_expected() {
        let mut state = ParserState::new("xyz");
        state.expected = vec!["\"a\"", "\"b\""];
        let output = strip_ansi(&state_print(Err(&state), "TEST", ""));
        assert!(
            output.contains("expected"),
            "output should contain expected: {}",
            output
        );
        assert!(
            output.contains("\"a\""),
            "output should contain a: {}",
            output
        );
    }

    #[test]
    fn test_summarize_line_short() {
        assert_eq!(debug::summarize_line("hello", 0), "hello");
    }

    #[test]
    fn test_summarize_line_long() {
        let long: String = "a".repeat(200);
        let result = debug::summarize_line(&long, 100);
        assert!(result.len() < 200);
        assert!(result.contains("..."));
    }

    #[test]
    fn test_add_cursor_single_line() {
        let state = ParserState::new("hello world");
        let output = strip_ansi(&debug::add_cursor(&state, "^", false));
        assert!(output.contains("hello world"));
        assert!(output.contains("^"));
        assert!(output.contains("1")); // line number
    }

    #[test]
    fn test_add_cursor_multiline() {
        let mut state = ParserState::new("line1\nline2\nline3");
        state.offset = 6; // start of "line2"
        let output = strip_ansi(&debug::add_cursor(&state, "^", false));
        assert!(output.contains("line1"));
        assert!(output.contains("line2"));
        assert!(output.contains("line3"));
    }

    #[test]
    fn test_span_parser_expected_string() {
        let p = sp_string("hello");
        let mut state = ParserState::new("xyz");
        let result = p.call(&mut state);
        assert!(result.is_none());
        assert!(
            state.expected.contains(&"\"hello\""),
            "sp_string should set expected: {:?}",
            state.expected
        );
    }

    #[test]
    fn test_span_parser_expected_regex() {
        let p = sp_regex(r"\d+");
        let mut state = ParserState::new("hello");
        let result = p.call(&mut state);
        assert!(result.is_none());
        assert!(
            !state.expected.is_empty(),
            "sp_regex should set expected: {:?}",
            state.expected
        );
    }

    #[test]
    fn test_span_parser_wrap_suggestion() {
        let inner = sp_string("hello");
        let left = sp_string("[");
        let right = sp_string("]");
        let p = inner.wrap_span(left, right);
        let mut state = ParserState::new("[hello");
        let result = p.call(&mut state);
        assert!(result.is_none());
        assert!(
            !state.suggestions.is_empty(),
            "sp wrap should add suggestion: {:?}",
            state.suggestions
        );
    }

    // =========================================================================
    // CSS-grammar-based diagnostic tests
    // =========================================================================
    //
    // Hand-built CSS parsers using the combinator API, exercising the
    // diagnostics system (expected sets, suggestions, secondary spans,
    // line/column tracking, formatting helpers).

    // ── CSS parser helpers ─────────────────────────────────────────

    /// Optional whitespace — always succeeds.
    fn ws_opt<'a>() -> Parser<'a, ()> {
        regex(r"[ \t\n\r]*").map(|_| ())
    }

    /// CSS hex color: `#` followed by 3, 4, 6, or 8 hex digits.
    fn css_hex_color<'a>() -> Parser<'a, ()> {
        string("#").then(regex(r"[0-9a-fA-F]{3,8}")).map(|_| ())
    }

    /// CSS rgb() functional notation: `rgb(` r `,` g `,` b `)`.
    fn css_rgb<'a>() -> Parser<'a, ()> {
        let number = regex(r"\d{1,3}");
        let comma = string(",").trim_whitespace();
        number
            .skip(comma)
            .then(regex(r"\d{1,3}"))
            .skip(string(",").trim_whitespace())
            .then(regex(r"\d{1,3}"))
            .wrap(string("rgb("), string(")"))
            .map(|_| ())
    }

    /// CSS hsl() functional notation: `hsl(` h `,` s `%,` l `%)`.
    fn css_hsl<'a>() -> Parser<'a, ()> {
        let number = regex(r"\d{1,3}");
        let comma = string(",").trim_whitespace();
        let pct = regex(r"\d{1,3}%");
        number
            .skip(comma)
            .then(pct)
            .skip(string(",").trim_whitespace())
            .then(regex(r"\d{1,3}%"))
            .wrap(string("hsl("), string(")"))
            .map(|_| ())
    }

    /// Named CSS color keyword (a small representative set).
    fn css_named_color<'a>() -> Parser<'a, ()> {
        string("red")
            .or(string("green"))
            .or(string("blue"))
            .or(string("white"))
            .or(string("black"))
            .or(string("transparent"))
            .map(|_| ())
    }

    /// Any CSS color value (hex | rgb | hsl | named).
    fn css_color<'a>() -> Parser<'a, ()> {
        css_hex_color()
            .or(css_rgb())
            .or(css_hsl())
            .or(css_named_color())
    }

    /// CSS type selector (element name), e.g. `div`, `span`.
    fn css_type_selector<'a>() -> Parser<'a, ()> {
        regex(r"[a-zA-Z][a-zA-Z0-9-]*").map(|_| ())
    }

    /// CSS class selector: `.foo`
    fn css_class_selector<'a>() -> Parser<'a, ()> {
        string(".")
            .then(regex(r"[a-zA-Z_][a-zA-Z0-9_-]*"))
            .map(|_| ())
    }

    /// CSS ID selector: `#bar`
    fn css_id_selector<'a>() -> Parser<'a, ()> {
        string("#")
            .then(regex(r"[a-zA-Z_][a-zA-Z0-9_-]*"))
            .map(|_| ())
    }

    /// CSS attribute selector: `[attr=val]` or `[attr]`
    fn css_attr_selector<'a>() -> Parser<'a, ()> {
        let attr_name = regex(r"[a-zA-Z_][a-zA-Z0-9_-]*");
        let attr_value = string("=")
            .then(regex(r#"[^\]]*"#))
            .map(|_| ())
            .opt()
            .map(|_| ());
        attr_name
            .then(attr_value)
            .wrap(string("["), string("]"))
            .map(|_| ())
    }

    /// Any simple CSS selector.
    fn css_selector<'a>() -> Parser<'a, ()> {
        css_class_selector()
            .or(css_id_selector())
            .or(css_attr_selector())
            .or(css_type_selector())
    }

    /// CSS property name.
    fn css_property<'a>() -> Parser<'a, &'a str> {
        regex(r"[a-zA-Z-][a-zA-Z0-9-]*")
    }

    /// CSS value — simplified: any non-semicolon, non-brace sequence.
    fn css_value<'a>() -> Parser<'a, &'a str> {
        regex(r"[^;}\n]+")
    }

    /// CSS declaration: `property: value;`
    fn css_declaration<'a>() -> Parser<'a, ()> {
        css_property()
            .skip(string(":").trim_whitespace())
            .then(css_value())
            .skip(string(";"))
            .map(|_| ())
    }

    /// CSS rule: `selector { declarations }`
    fn css_rule<'a>() -> Parser<'a, ()> {
        css_selector()
            .skip(ws_opt())
            .then(
                css_declaration()
                    .trim_whitespace()
                    .many(0..)
                    .wrap(string("{"), string("}")),
            )
            .map(|_| ())
    }

    // ── Test: expected set accumulation ────────────────────────────

    #[test]
    fn test_css_color_dispatch_failure_lists_alternatives() {
        // Failing to match any color branch should accumulate all alternatives.
        let p = css_color();
        let (result, state) = p.parse_return_state("???");
        assert!(result.is_none());
        // We expect labels from hex (#), rgb(, hsl(, and named colors
        assert!(
            state.expected.len() >= 4,
            "color parser should accumulate at least 4 expected labels, got: {:?}",
            state.expected
        );
    }

    #[test]
    fn test_css_selector_failure_lists_alternatives() {
        // Completely invalid selector start character.
        let p = css_selector();
        let (result, state) = p.parse_return_state("999");
        assert!(result.is_none());
        // Should have labels from class (.),  id (#), attribute ([), type selector (regex)
        assert!(
            !state.expected.is_empty(),
            "selector parser should set expected labels, got empty"
        );
    }

    #[test]
    fn test_css_color_oxford_comma_four_plus_alternatives() {
        // Ensure format_expected produces Oxford comma with many alternatives.
        let labels: Vec<&str> = vec!["\"#\"", "\"rgb(\"", "\"hsl(\"", "\"red\""];
        let formatted = debug::format_expected(&labels);
        assert!(
            formatted.contains(", or "),
            "4+ alternatives should use Oxford comma: {}",
            formatted
        );
        assert!(
            formatted.starts_with("expected "),
            "format should start with 'expected': {}",
            formatted
        );
    }

    #[test]
    fn test_css_named_color_all_branches_in_expected() {
        let p = css_named_color();
        let (result, state) = p.parse_return_state("???");
        assert!(result.is_none());
        // Each named color sets its own label
        assert!(
            state.expected.contains(&"\"red\""),
            "expected should contain red: {:?}",
            state.expected
        );
        assert!(
            state.expected.contains(&"\"green\""),
            "expected should contain green: {:?}",
            state.expected
        );
        assert!(
            state.expected.contains(&"\"blue\""),
            "expected should contain blue: {:?}",
            state.expected
        );
        assert!(
            state.expected.contains(&"\"white\""),
            "expected should contain white: {:?}",
            state.expected
        );
        assert!(
            state.expected.contains(&"\"black\""),
            "expected should contain black: {:?}",
            state.expected
        );
        assert!(
            state.expected.contains(&"\"transparent\""),
            "expected should contain transparent: {:?}",
            state.expected
        );
    }

    #[test]
    fn test_css_format_expected_six_named_colors() {
        let labels: Vec<&str> = vec![
            "\"red\"",
            "\"green\"",
            "\"blue\"",
            "\"white\"",
            "\"black\"",
            "\"transparent\"",
        ];
        let formatted = debug::format_expected(&labels);
        assert!(
            formatted.contains(", or \"transparent\""),
            "last item should be preceded by Oxford comma: {}",
            formatted
        );
    }

    // ── Test: unclosed delimiter detection ────────────────────────

    #[test]
    fn test_css_rgb_unclosed_paren() {
        // `rgb(255, 0, 128` — missing closing `)`.
        let p = css_rgb();
        let (result, state) = p.parse_return_state("rgb(255, 0, 128");
        assert!(result.is_none());
        assert!(
            !state.suggestions.is_empty(),
            "unclosed rgb( should produce a suggestion: {:?}",
            state.suggestions
        );
        let has_unclosed = state.suggestions.iter().any(|s| {
            matches!(
                &s.kind,
                state::SuggestionKind::UnclosedDelimiter { delimiter, .. } if delimiter == "rgb("
            )
        });
        assert!(
            has_unclosed,
            "suggestion should reference 'rgb(' as delimiter: {:?}",
            state.suggestions
        );
        // Secondary span should mention "opened here"
        assert!(
            state
                .secondary_spans
                .iter()
                .any(|s| s.label.contains("opened here")),
            "secondary span should mention opened here: {:?}",
            state.secondary_spans
        );
    }

    #[test]
    fn test_css_rule_unclosed_brace() {
        // `div { color: red; ` — missing `}`.
        let input = "div{ color: red; ";
        let p = css_rule();
        let (result, state) = p.parse_return_state(input);
        assert!(result.is_none());
        let has_unclosed = state.suggestions.iter().any(|s| {
            matches!(
                &s.kind,
                state::SuggestionKind::UnclosedDelimiter { delimiter, .. } if delimiter == "{"
            )
        });
        assert!(
            has_unclosed,
            "unclosed {{ should produce UnclosedDelimiter suggestion: {:?}",
            state.suggestions
        );
        // The suggestion message should mention the matching close
        let suggestion_msg = state
            .suggestions
            .iter()
            .find(|s| matches!(&s.kind, state::SuggestionKind::UnclosedDelimiter { .. }))
            .map(|s| s.message.as_str())
            .unwrap_or("");
        assert!(
            suggestion_msg.contains("}"),
            "suggestion should mention closing }}: {}",
            suggestion_msg
        );
    }

    #[test]
    fn test_css_attr_selector_unclosed_bracket() {
        // `[attr=val` — missing `]`.
        let p = css_attr_selector();
        let (result, state) = p.parse_return_state("[attr=val");
        assert!(result.is_none());
        let has_unclosed = state.suggestions.iter().any(|s| {
            matches!(
                &s.kind,
                state::SuggestionKind::UnclosedDelimiter { delimiter, .. } if delimiter == "["
            )
        });
        assert!(
            has_unclosed,
            "unclosed [ should produce UnclosedDelimiter: {:?}",
            state.suggestions
        );
        // Suggestion message should mention `]`
        let msg = state
            .suggestions
            .iter()
            .find(|s| matches!(&s.kind, state::SuggestionKind::UnclosedDelimiter { .. }))
            .unwrap();
        assert!(
            msg.message.contains("]"),
            "suggestion should mention ]: {}",
            msg.message
        );
    }

    #[test]
    fn test_css_hsl_unclosed_paren() {
        let p = css_hsl();
        let (result, state) = p.parse_return_state("hsl(120, 50%, 50%");
        assert!(result.is_none());
        let has_unclosed = state.suggestions.iter().any(|s| {
            matches!(
                &s.kind,
                state::SuggestionKind::UnclosedDelimiter { delimiter, .. } if delimiter == "hsl("
            )
        });
        assert!(
            has_unclosed,
            "unclosed hsl( should produce UnclosedDelimiter: {:?}",
            state.suggestions
        );
    }

    // ── Test: furthest offset tracking ────────────────────────────

    #[test]
    fn test_css_rgb_error_deep_in_parse() {
        // `rgb(255, 0, )` — the third component is missing.
        let p = css_rgb();
        let (result, state) = p.parse_return_state("rgb(255, 0, )");
        assert!(result.is_none());
        // The parser should have advanced past `rgb(255, 0, ` before failing,
        // so furthest_offset or offset should be deep into the string.
        let furthest = state.furthest_offset.max(state.offset);
        assert!(
            furthest >= 12,
            "furthest offset should be past 'rgb(255, 0, ' (>=12), got {}",
            furthest
        );
    }

    #[test]
    fn test_css_declaration_error_after_colon() {
        // `color: ;` — value is empty (regex won't match `;`).
        let p = css_declaration();
        let (result, state) = p.parse_return_state("color: ;");
        assert!(result.is_none());
        // The parser should advance past "color:" and whitespace before failing.
        let furthest = state.furthest_offset.max(state.offset);
        assert!(
            furthest >= 6,
            "furthest offset should be past 'color:' (>=6), got {}",
            furthest
        );
    }

    #[test]
    fn test_css_expected_only_at_furthest_point() {
        // When the parser backtracks, earlier expected labels are cleared.
        // `rgb(255, 0, )` should NOT contain `"rgb("` in expected —
        // the error is deeper in the input.
        let p = css_rgb();
        let (result, state) = p.parse_return_state("rgb(255, 0, )");
        assert!(result.is_none());
        // The expected set should be about the missing third number,
        // not the initial "rgb(" string.
        assert!(
            !state.expected.contains(&"\"rgb(\""),
            "expected should not contain 'rgb(' (that succeeded earlier): {:?}",
            state.expected
        );
    }

    #[test]
    fn test_css_furthest_offset_with_alternation() {
        // Parse color where first branch advances furthest.
        // `rgb(255, OOPS` — rgb( matches, then partial parse.
        let p = css_color();
        let (result, state) = p.parse_return_state("rgb(255, OOPS");
        assert!(result.is_none());
        let furthest = state.furthest_offset.max(state.offset);
        assert!(
            furthest >= 9,
            "furthest offset should reflect deep parse into rgb(), got {}",
            furthest
        );
    }

    // ── Test: multiline source context ────────────────────────────

    #[test]
    fn test_css_multiline_error_on_inner_line() {
        // Multi-line CSS with the error on line 2.
        let input = "div {\n  color: ;\n}";
        // Parse just a declaration on the problematic line.
        let p = css_declaration();
        // Advance past "div {\n  " manually by starting from that substring.
        let inner = &input[8..]; // "color: ;\n}"
        let (result, state) = p.parse_return_state(inner);
        assert!(result.is_none());
        // Verify we can get line/column info.
        let line = state.get_line_number();
        let col = state.get_column_number();
        assert!(line >= 1, "line number should be at least 1, got {}", line);
        assert!(
            col <= inner.len(),
            "column should be within the input, got {}",
            col
        );
    }

    #[test]
    fn test_css_multiline_add_cursor_contains_lines() {
        let input = "body {\n  color: red;\n  font-size: ;\n  margin: 0;\n}";
        let mut state = ParserState::new(input);
        // Point to "font-size: ;" — the semicolon right after the space, offset=33.
        state.offset = 33; // the ';' in 'font-size: ;'
        let output = strip_ansi(&debug::add_cursor(&state, "^^^", true));
        // Should contain line numbers and surrounding context.
        assert!(
            output.contains("font-size"),
            "cursor output should contain the error line: {}",
            output
        );
    }

    #[test]
    fn test_css_multiline_line_number_tracking() {
        let input = "h1 {\n  color: red;\n  background: blue;\n  font-weight: ;\n}";
        let mut state = ParserState::new(input);
        // Point to the empty value on line 4 (after "font-weight: ").
        // "h1 {\n  color: red;\n  background: blue;\n  font-weight: " = 55 chars
        state.offset = 53;
        assert_eq!(state.get_line_number(), 4, "should be on line 4");
    }

    // ── Test: long line truncation ────────────────────────────────

    #[test]
    fn test_css_long_property_value_truncated() {
        // A 200+ character line simulating a long CSS value.
        let long_value = "x".repeat(200);
        let line = format!("color: {};", long_value);
        let result = debug::summarize_line(&line, 100);
        assert!(
            result.len() < line.len(),
            "summarized line should be shorter than original ({} vs {})",
            result.len(),
            line.len()
        );
        assert!(
            result.contains("..."),
            "truncated line should contain ellipsis: {}",
            result
        );
    }

    #[test]
    fn test_css_long_selector_line_truncated() {
        // A very long selector chain.
        let selector = (0..50)
            .map(|i| format!(".class{}", i))
            .collect::<Vec<_>>()
            .join(" ");
        let line = format!("{} {{ }}", selector);
        let result = debug::summarize_line(&line, 50);
        assert!(
            result.contains("..."),
            "long selector line should be truncated: {}",
            result
        );
    }

    #[test]
    fn test_css_long_line_cursor_still_works() {
        // Even with truncation, add_cursor should not panic.
        let long_value = "y".repeat(250);
        let input = format!("p {{ content: {}; }}", long_value);
        let mut state = ParserState::new(&input);
        state.offset = 15; // somewhere in the middle
        // Should not panic and should produce output.
        let output = strip_ansi(&debug::add_cursor(&state, "^", true));
        assert!(!output.is_empty(), "cursor output should not be empty");
    }

    // ── Test: EOF / trailing content ──────────────────────────────

    #[test]
    fn test_css_declaration_trailing_garbage_eof() {
        // Parse a valid declaration then check for EOF — trailing content triggers diagnostic.
        let p = css_declaration().eof();
        let (result, state) = p.parse_return_state("color: red; GARBAGE");
        assert!(result.is_none());
        assert!(
            state.expected.contains(&"<end of input>"),
            "eof should add <end of input> label: {:?}",
            state.expected
        );
        let has_trailing = state
            .suggestions
            .iter()
            .any(|s| matches!(&s.kind, state::SuggestionKind::TrailingContent { .. }));
        assert!(
            has_trailing,
            "eof should produce TrailingContent suggestion: {:?}",
            state.suggestions
        );
    }

    #[test]
    fn test_css_color_trailing_content() {
        let p = css_color().eof();
        let (result, state) = p.parse_return_state("red EXTRA");
        assert!(result.is_none());
        assert!(
            state.expected.contains(&"<end of input>"),
            "expected should contain eof label: {:?}",
            state.expected
        );
    }

    #[test]
    fn test_css_hex_color_no_trailing() {
        // Valid hex color with nothing after — should succeed with eof.
        let p = css_hex_color().eof();
        let (result, _state) = p.parse_return_state("#ff00aa");
        assert!(result.is_some(), "valid hex color with eof should succeed");
    }

    // ── Test: ParseError integration ──────────────────────────────

    #[test]
    fn test_css_color_parse_or_error_expected_set() {
        let p = css_color();
        let err = p.parse_or_error("???").unwrap_err();
        assert!(
            !err.expected.is_empty(),
            "ParseError should have expected labels for color failure: {:?}",
            err.expected
        );
        assert_eq!(err.offset, 0, "error offset should be 0 for total failure");
        assert_eq!(err.line, 1, "error line should be 1");
        assert_eq!(err.column, 0, "error column should be 0");
    }

    #[test]
    fn test_css_selector_parse_or_error_line_col() {
        let p = css_selector();
        let err = p.parse_or_error("999").unwrap_err();
        assert_eq!(err.line, 1);
        assert_eq!(err.column, 0);
        assert!(
            !err.expected.is_empty(),
            "ParseError expected should be populated: {:?}",
            err.expected
        );
    }

    #[test]
    fn test_css_declaration_parse_or_error_deep_failure() {
        // `color: ;` — fails deep into the parse after consuming "color: ".
        // The sequential `.then()` combinator does not backtrack, so offset
        // reflects the deepest point reached before failure.
        let p = css_declaration();
        let err = p.parse_or_error("color: ;").unwrap_err();
        // offset should be past "color: " (at least 7) since the property
        // and colon matched before the value regex failed.
        let deepest = err.offset.max(err.furthest_offset);
        assert!(
            deepest >= 7,
            "deepest parse point should be past 'color: ' (>=7), got offset={}, furthest={}",
            err.offset,
            err.furthest_offset
        );
    }

    #[test]
    fn test_css_rule_parse_or_error_success() {
        let p = css_rule();
        let result = p.parse_or_error("div{color: red;}");
        assert!(
            result.is_ok(),
            "valid CSS rule should parse successfully: {:?}",
            result.err()
        );
    }

    // ── Test: dispatch_byte with CSS-like dispatch ────────────────

    #[test]
    fn test_css_color_byte_dispatch_failure() {
        // Build a dispatch_byte for color start bytes: '#', 'r' (rgb/red), 'h' (hsl), etc.
        let p = dispatch_byte(vec![
            (b'#', css_hex_color()),
            (b'r', css_rgb().or(string("red").map(|_| ()))),
            (b'h', css_hsl()),
        ]);
        let (result, state) = p.parse_return_state("???");
        assert!(result.is_none());
        assert!(
            !state.expected.is_empty(),
            "dispatch_byte should set expected on no-match"
        );
        assert!(
            state.expected[0].contains("one of"),
            "dispatch label should be 'one of ...': {:?}",
            state.expected
        );
    }

    // ── Test: nested delimiter diagnostics ─────────────────────────

    #[test]
    fn test_css_nested_unclosed_only_innermost() {
        // `div { color: rgb(255, 0, 128 }` — the rgb( is unclosed.
        // The outer {} wrapping the declaration body handles the brace.
        // We test that the inner rgb( unclosed is detected.
        let p = css_rgb();
        let (result, state) = p.parse_return_state("rgb(255, 0, 128");
        assert!(result.is_none());
        let unclosed_delimiters: Vec<_> = state
            .suggestions
            .iter()
            .filter(|s| matches!(&s.kind, state::SuggestionKind::UnclosedDelimiter { .. }))
            .collect();
        assert!(
            !unclosed_delimiters.is_empty(),
            "should have at least one unclosed delimiter suggestion"
        );
    }

    // ── Test: secondary span offset correctness ───────────────────

    #[test]
    fn test_css_secondary_span_offset_at_opener() {
        let p = css_attr_selector();
        let (result, state) = p.parse_return_state("[data-value=foo");
        assert!(result.is_none());
        // The secondary span should point at offset 0 where `[` was opened.
        assert!(
            !state.secondary_spans.is_empty(),
            "should have secondary span for unclosed ["
        );
        assert_eq!(
            state.secondary_spans[0].offset, 0,
            "secondary span should point at offset 0 (the opening bracket)"
        );
    }

    #[test]
    fn test_css_rgb_secondary_span_offset() {
        let p = css_rgb();
        let (result, state) = p.parse_return_state("rgb(100, 200, 50");
        assert!(result.is_none());
        assert!(
            !state.secondary_spans.is_empty(),
            "should have secondary span for unclosed rgb("
        );
        // The opening `rgb(` starts at offset 0.
        assert_eq!(
            state.secondary_spans[0].offset, 0,
            "secondary span should point at offset 0 (the opening 'rgb(')"
        );
        assert!(
            state.secondary_spans[0].label.contains("opened here"),
            "secondary span label should say 'opened here': {}",
            state.secondary_spans[0].label
        );
    }

    // ── Test: format_expected edge cases ──────────────────────────

    #[test]
    fn test_css_format_expected_exactly_two() {
        let formatted = debug::format_expected(&["\"#\"", "\"red\""]);
        assert_eq!(
            formatted, "expected \"#\" or \"red\"",
            "two items should use 'or' without comma"
        );
    }

    // ── Test: state_print with CSS errors ─────────────────────────

    #[test]
    fn test_css_state_print_shows_expected_colors() {
        let mut state = ParserState::new("???");
        state.expected = vec!["\"#\"", "\"rgb(\"", "\"hsl(\"", "\"red\""];
        let output = strip_ansi(&state_print(Err(&state), "CSS_COLOR", ""));
        assert!(
            output.contains("expected"),
            "state_print should include expected message: {}",
            output
        );
        assert!(
            output.contains("CSS_COLOR"),
            "state_print should include parser name: {}",
            output
        );
    }

    #[test]
    fn test_css_state_print_shows_suggestions() {
        let mut state = ParserState::new("rgb(255, 0, 128");
        state.offset = 15;
        state.suggestions = vec![state::Suggestion {
            kind: state::SuggestionKind::UnclosedDelimiter {
                delimiter: "rgb(".to_string(),
                open_offset: 0,
            },
            message: "close the delimiter with matching `)`".to_string(),
        }];
        state.secondary_spans = vec![state::SecondarySpan {
            offset: 0,
            label: "unclosed `rgb(` opened here".to_string(),
        }];
        let output = strip_ansi(&state_print(Err(&state), "CSS_RGB", ""));
        assert!(
            output.contains("close the delimiter"),
            "state_print should show suggestion message: {}",
            output
        );
    }

    // ── Test: complete CSS rule parsing success ────────────────────

    #[test]
    fn test_css_full_rule_parses_successfully() {
        let p = css_rule();
        let (result, state) = p.parse_return_state("div{color: red;}");
        assert!(
            result.is_some(),
            "valid CSS rule should parse, offset: {}, expected: {:?}",
            state.offset,
            state.expected
        );
    }

    #[test]
    fn test_css_full_rule_with_class_selector() {
        let p = css_rule();
        let (result, state) = p.parse_return_state(".container{margin: 0 auto;}");
        assert!(
            result.is_some(),
            "CSS rule with class selector should parse, offset: {}, expected: {:?}",
            state.offset,
            state.expected
        );
    }

    #[test]
    fn test_css_multiple_declarations() {
        let p = css_rule();
        let input = "p{color: red;font-size: 16px;}";
        let (result, _state) = p.parse_return_state(input);
        assert!(result.is_some(), "multiple declarations should parse");
    }
}
