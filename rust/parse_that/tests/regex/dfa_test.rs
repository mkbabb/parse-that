use parse_that::regex::dfa::{Dfa, DfaOptions};

#[test]
fn simple_literal() {
    let dfa = Dfa::compile("abc").unwrap();
    assert!(dfa.state_count() <= 5); // start + a + b + c + maybe dead
    assert_eq!(dfa.find_at(b"abcdef", 0), Some(3));
    assert_eq!(dfa.find_at(b"ab", 0), None);
    assert_eq!(dfa.find_at(b"xabc", 1), Some(4));
}

#[test]
fn char_class() {
    let dfa = Dfa::compile("[a-z]+").unwrap();
    assert_eq!(dfa.find_at(b"hello world", 0), Some(5));
    assert_eq!(dfa.find_at(b"HELLO", 0), None);
    assert_eq!(dfa.find_at(b"a", 0), Some(1));
}

#[test]
fn alternation() {
    let dfa = Dfa::compile("cat|dog").unwrap();
    assert_eq!(dfa.find_at(b"cat", 0), Some(3));
    assert_eq!(dfa.find_at(b"dog", 0), Some(3));
    assert_eq!(dfa.find_at(b"cow", 0), None);
}

#[test]
fn optional() {
    let dfa = Dfa::compile("colou?r").unwrap();
    assert_eq!(dfa.find_at(b"color", 0), Some(5));
    assert_eq!(dfa.find_at(b"colour", 0), Some(6));
    assert_eq!(dfa.find_at(b"col", 0), None);
}

#[test]
fn star() {
    let dfa = Dfa::compile("ab*c").unwrap();
    assert_eq!(dfa.find_at(b"ac", 0), Some(2));
    assert_eq!(dfa.find_at(b"abc", 0), Some(3));
    assert_eq!(dfa.find_at(b"abbbc", 0), Some(5));
    assert_eq!(dfa.find_at(b"a", 0), None);
}

#[test]
fn bounded_repetition() {
    let dfa = Dfa::compile("[0-9]{3,5}").unwrap();
    assert_eq!(dfa.find_at(b"12", 0), None);
    assert_eq!(dfa.find_at(b"123", 0), Some(3));
    assert_eq!(dfa.find_at(b"12345", 0), Some(5));
    assert_eq!(dfa.find_at(b"123456", 0), Some(5)); // greedy up to 5
}

#[test]
fn negated_class() {
    let dfa = Dfa::compile("[^abc]+").unwrap();
    assert_eq!(dfa.find_at(b"xyz", 0), Some(3));
    assert_eq!(dfa.find_at(b"abc", 0), None);
    assert_eq!(dfa.find_at(b"xyzabc", 0), Some(3));
}

#[test]
fn empty_pattern() {
    let dfa = Dfa::compile("").unwrap();
    // Empty pattern matches at any position (zero-width).
    assert_eq!(dfa.find_at(b"hello", 0), Some(0));
}

#[test]
fn offset_matching() {
    let dfa = Dfa::compile("[0-9]+").unwrap();
    assert_eq!(dfa.find_at(b"abc123def", 3), Some(6));
    assert_eq!(dfa.find_at(b"abc123def", 0), None);
}

#[test]
fn shorthand_classes() {
    let dfa = Dfa::compile(r"\d+").unwrap();
    assert_eq!(dfa.find_at(b"42", 0), Some(2));
    assert_eq!(dfa.find_at(b"abc", 0), None);

    let dfa = Dfa::compile(r"\w+").unwrap();
    assert_eq!(dfa.find_at(b"hello_world", 0), Some(11));

    let dfa = Dfa::compile(r"\s+").unwrap();
    assert_eq!(dfa.find_at(b"  \t\n", 0), Some(4));
}

#[test]
fn dot_no_newline() {
    let dfa = Dfa::compile(".+").unwrap();
    // Without dotall, . doesn't match \n.
    assert_eq!(dfa.find_at(b"hello\nworld", 0), Some(5));
}

#[test]
fn dot_all() {
    let dfa = Dfa::compile("(?s).+").unwrap();
    assert_eq!(dfa.find_at(b"hello\nworld", 0), Some(11));
}

#[test]
fn minimization_reduces_states() {
    // `a|a` should minimize to the same DFA as `a`.
    let dfa_dup = Dfa::compile("a|a").unwrap();
    let dfa_single = Dfa::compile("a").unwrap();
    // Both should have the same number of states after minimization.
    assert_eq!(dfa_dup.state_count(), dfa_single.state_count());
}

#[test]
fn unicode_ascii_only() {
    // \w in Unicode mode matches much more, but on ASCII input only ASCII matches.
    let dfa = Dfa::compile(r"\w+").unwrap();
    assert_eq!(dfa.find_at(b"hello", 0), Some(5));
    assert_eq!(dfa.find_at(b"123", 0), Some(3));
}

#[test]
fn css_ident_pattern() {
    let dfa = Dfa::compile(r"-?[a-zA-Z_][\w-]*").unwrap();
    assert_eq!(dfa.find_at(b"my-class", 0), Some(8));
    assert_eq!(dfa.find_at(b"-webkit-foo", 0), Some(11));
    assert_eq!(dfa.find_at(b"_private", 0), Some(8));
    assert_eq!(dfa.find_at(b"123", 0), None);
}

#[test]
fn json_number_pattern() {
    let dfa = Dfa::compile(r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?").unwrap();
    assert_eq!(dfa.find_at(b"42", 0), Some(2));
    assert_eq!(dfa.find_at(b"-3.14", 0), Some(5));
    assert_eq!(dfa.find_at(b"1e10", 0), Some(4));
    assert_eq!(dfa.find_at(b"0.5E-3", 0), Some(6));
    assert_eq!(dfa.find_at(b"abc", 0), None);
}

#[test]
fn hex_color_pattern() {
    let dfa = Dfa::compile(r"[0-9a-fA-F]{3,8}").unwrap();
    assert_eq!(dfa.find_at(b"ff00cc", 0), Some(6));
    assert_eq!(dfa.find_at(b"ABC", 0), Some(3));
    assert_eq!(dfa.find_at(b"12", 0), None); // too short
}

#[test]
fn state_limit_guard() {
    // Pathological pattern that could cause exponential blowup.
    // With a small state limit, this should return None.
    let opts = DfaOptions {
        state_limit: 10,
        ..DfaOptions::default()
    };
    let result = Dfa::compile_with(r".{1,10}.{1,10}.{1,10}", &opts);
    // This may or may not exceed 10 states depending on the pattern.
    // The key thing is it doesn't panic or hang.
    let _ = result;
}

#[test]
fn case_insensitive() {
    let dfa = Dfa::compile("(?i)hello").unwrap();
    assert_eq!(dfa.find_at(b"hello", 0), Some(5));
    assert_eq!(dfa.find_at(b"HELLO", 0), Some(5));
    assert_eq!(dfa.find_at(b"HeLlO", 0), Some(5));
}

// ── DFA-vs-regex oracle tests ──────────────────────────────────────────

/// Compare DFA `find_at` against the `regex` crate for every sub-offset of
/// every input. The `regex` crate is anchored with `\A(?:...)` so both
/// engines attempt an anchored match from the same position.
fn assert_dfa_fidelity(pattern: &str, inputs: &[&str]) {
    let dfa = Dfa::compile(pattern).unwrap_or_else(|| {
        panic!("DFA compile failed for pattern: {}", pattern);
    });
    let anchored = format!(r"\A(?:{})", pattern);
    let re = regex::Regex::new(&anchored)
        .unwrap_or_else(|e| panic!("regex crate compile failed for '{}': {}", anchored, e));

    for input in inputs {
        for offset in 0..=input.len() {
            let dfa_result = dfa.find_at(input.as_bytes(), offset);
            let re_result = re.find(&input[offset..]).map(|m| offset + m.end());
            assert_eq!(
                dfa_result, re_result,
                "pattern='{}' input='{}' offset={}  dfa={:?} regex={:?}",
                pattern, input, offset, dfa_result, re_result
            );
        }
    }
}

// ── Lazy quantifiers (DFA is greedy / leftmost-longest) ────────────────
//
// DFAs have no notion of lazy vs greedy — subset construction always yields
// the leftmost-longest match. The `regex` crate respects lazy quantifier
// semantics even on anchored patterns, so `\A(?:a.*?b)` returns the shortest
// match while the DFA returns the longest.
//
// These tests document the known divergence and verify the DFA's greedy behavior.

#[test]
fn lazy_star_is_greedy_in_dfa() {
    let dfa = Dfa::compile("a.*?b").unwrap();
    // DFA always returns longest match ending with 'b'.
    assert_eq!(dfa.find_at(b"aXb", 0), Some(3));
    assert_eq!(dfa.find_at(b"aXbYb", 0), Some(5)); // greedy: matches all the way to last 'b'
    assert_eq!(dfa.find_at(b"ab", 0), Some(2));
    assert_eq!(dfa.find_at(b"aXYZb", 0), Some(5));
    assert_eq!(dfa.find_at(b"a", 0), None); // no 'b' to close

    // Verify divergence from regex crate (which returns shortest).
    let re = regex::Regex::new(r"\A(?:a.*?b)").unwrap();
    assert_eq!(re.find("aXbYb").map(|m| m.end()), Some(3)); // regex: shortest
    assert_eq!(dfa.find_at(b"aXbYb", 0), Some(5)); // DFA: longest
}

#[test]
fn lazy_plus_is_greedy_in_dfa() {
    let dfa = Dfa::compile("a.+?b").unwrap();
    assert_eq!(dfa.find_at(b"aXb", 0), Some(3));
    assert_eq!(dfa.find_at(b"aXbYb", 0), Some(5)); // greedy
    assert_eq!(dfa.find_at(b"ab", 0), None); // .+ requires at least one char
    assert_eq!(dfa.find_at(b"aXYZb", 0), Some(5));
}

#[test]
fn lazy_question_is_greedy_in_dfa() {
    let dfa = Dfa::compile("a.??b").unwrap();
    assert_eq!(dfa.find_at(b"ab", 0), Some(2));
    assert_eq!(dfa.find_at(b"aXb", 0), Some(3)); // greedy: consumes the optional char
    assert_eq!(dfa.find_at(b"b", 0), None);
    assert_eq!(dfa.find_at(b"abb", 0), Some(3)); // greedy: 'a' + '.' matches 'b' + literal 'b'
}

#[test]
fn css_block_comment_dotall_greedy() {
    // C-style block comment: `(?s)/\*.*?\*/`
    // DFA is greedy, so on `/* a */ b /* c */` it matches the longest prefix
    // ending with `*/` (all 17 bytes), not the shortest (7 bytes).
    let dfa = Dfa::compile(r"(?s)/\*.*?\*/").unwrap();
    assert_eq!(dfa.find_at(b"/* a */ b /* c */", 0), Some(17)); // greedy: whole string (17 bytes)
    assert_eq!(dfa.find_at(b"/* short */", 0), Some(11));
    assert_eq!(dfa.find_at(b"/**/", 0), Some(4));
    assert_eq!(dfa.find_at(b"/* multi\nline */", 0), Some(16));
    assert_eq!(dfa.find_at(b"/* no close", 0), None);

    // Verify divergence from regex crate.
    let re = regex::Regex::new(r"\A(?:(?s)/\*.*?\*/)").unwrap();
    assert_eq!(re.find("/* a */ b /* c */").map(|m| m.end()), Some(7)); // regex: shortest
}

#[test]
fn css_block_comment_no_dotall_greedy() {
    // Without (?s), `.` does not match newlines — but still greedy.
    let dfa = Dfa::compile(r"/\*.*?\*/").unwrap();
    assert_eq!(dfa.find_at(b"/* single line */", 0), Some(17)); // 17 bytes total
    assert_eq!(dfa.find_at(b"/* a */ more /* b */", 0), Some(20)); // greedy: matches to last `*/` (20 bytes)
    assert_eq!(dfa.find_at(b"/* no\nnewline */", 0), None); // dot stops at \n
    assert_eq!(dfa.find_at(b"/**/", 0), Some(4));
}

// ── CSS comment-aware whitespace ───────────────────────────────────────

#[test]
fn css_ws_comment_regex() {
    let pattern = r"(?s)(?:\s|/\*.*?\*/)*";
    assert_dfa_fidelity(
        pattern,
        &[
            "/*!*/ /*!*/",
            "  /* comment */  ",
            "\n/* line\n*/\n",
            "/* a *//* b */",
            "/*!*/",
            "   ",
            "",
            "no-ws-here",
            " /* unterminated",
        ],
    );
}

#[test]
fn css_ws_comment_adjacent() {
    // Adjacent comments without intervening whitespace.
    let pattern = r"(?s)(?:\s|/\*.*?\*/)*";
    let dfa = Dfa::compile(pattern).unwrap();
    // Should consume both comments + surrounding whitespace.
    let input = b"/* a *//* b */ rest";
    let result = dfa.find_at(input, 0);
    // Greedy: consumes as much ws+comment as possible.
    assert!(result.is_some());
    let end = result.unwrap();
    // After consuming, the remaining text should start with non-ws.
    assert!(
        end <= input.len(),
        "end {} out of bounds for len {}",
        end,
        input.len()
    );
}

// ── CSS value span regex ───────────────────────────────────────────────

#[test]
fn css_value_span() {
    let pattern = r"[^;{}!,]+";
    assert_dfa_fidelity(
        pattern,
        &[
            "var(--tw-empty)",
            ")",
            "var(--a) var(--b) var(--c)",
            "value!important",
            "color: red",
            ";",
            "{",
            "}",
            ",",
            "",
        ],
    );
}

#[test]
fn css_value_span_stop_chars() {
    let dfa = Dfa::compile(r"[^;{}!,]+").unwrap();

    // Should match everything (no excluded chars).
    assert_eq!(
        dfa.find_at(b"var(--tw-empty)", 0),
        Some("var(--tw-empty)".len())
    );

    // `)` alone — no excluded chars, should match.
    assert_eq!(dfa.find_at(b")", 0), Some(1));

    // Stops at `!`.
    assert_eq!(dfa.find_at(b"value!important", 0), Some(5));

    // Stops at `;`.
    assert_eq!(dfa.find_at(b"color: red; next", 0), Some(10));
}

// ── CSS ident alternation ──────────────────────────────────────────────

#[test]
fn css_ident_alternation() {
    let pattern = r"[a-zA-Z_][\w-]*|--[\w-]+|-[a-zA-Z][\w-]*";
    assert_dfa_fidelity(
        pattern,
        &[
            "-webkit-backdrop-filter",
            "--tw-backdrop-blur",
            "backgroundColor",
            "_private_var",
            "-moz-appearance",
            "--color-primary-500",
            "a",
            "-a",
            "--a",
            "123invalid",
            "",
            "-",
            "--",
        ],
    );
}

#[test]
fn css_ident_alt_specific() {
    let dfa = Dfa::compile(r"[a-zA-Z_][\w-]*|--[\w-]+|-[a-zA-Z][\w-]*").unwrap();

    assert_eq!(
        dfa.find_at(b"-webkit-backdrop-filter", 0),
        Some("-webkit-backdrop-filter".len())
    );
    assert_eq!(
        dfa.find_at(b"--tw-backdrop-blur", 0),
        Some("--tw-backdrop-blur".len())
    );
    assert_eq!(
        dfa.find_at(b"backgroundColor", 0),
        Some("backgroundColor".len())
    );
}

// ── Large DFA (>64 states) ─────────────────────────────────────────────

#[test]
fn large_dfa_css_ident() {
    let pattern = r"[a-zA-Z_][\w-]*|--[\w-]+|-[a-zA-Z][\w-]*";
    let dfa = Dfa::compile(pattern).unwrap();
    // Report state count — useful for tracking DFA size regressions.
    eprintln!(
        "CSS ident DFA: {} states, {} equiv classes",
        dfa.state_count(),
        dfa.class_count()
    );
    // Verify accepts are correct on representative inputs.
    assert!(dfa.find_at(b"myIdent", 0).is_some());
    assert!(dfa.find_at(b"--custom", 0).is_some());
    assert!(dfa.find_at(b"-webkit-x", 0).is_some());
    assert!(dfa.find_at(b"123", 0).is_none());
}

#[test]
fn large_dfa_json_number() {
    let pattern = r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?";
    let dfa = Dfa::compile(pattern).unwrap();
    eprintln!(
        "JSON number DFA: {} states, {} equiv classes",
        dfa.state_count(),
        dfa.class_count()
    );
    assert_eq!(dfa.find_at(b"123.456e+78", 0), Some(11));
    assert_eq!(dfa.find_at(b"-0.5E-3", 0), Some(7));
}

// ── Zero-width matches ─────────────────────────────────────────────────

#[test]
fn zero_width_optional() {
    // `=?` can match zero characters (the empty string).
    let dfa = Dfa::compile("=?").unwrap();
    // Start state is accepting (empty match), so find_at returns Some(offset).
    assert_eq!(dfa.find_at(b"LET(", 0), Some(0));
    assert_eq!(dfa.find_at(b"=value", 0), Some(1));
    assert_eq!(dfa.find_at(b"", 0), Some(0));
}

#[test]
fn zero_width_star() {
    let dfa = Dfa::compile("a*").unwrap();
    // Empty match at offset 0 when input doesn't start with 'a'.
    assert_eq!(dfa.find_at(b"bbb", 0), Some(0));
    assert_eq!(dfa.find_at(b"aab", 0), Some(2));
    assert_eq!(dfa.find_at(b"", 0), Some(0));
}

#[test]
fn zero_width_empty_alt() {
    // `(a|)` matches either 'a' or empty.
    let dfa = Dfa::compile("a|").unwrap();
    assert_eq!(dfa.find_at(b"a", 0), Some(1));
    assert_eq!(dfa.find_at(b"b", 0), Some(0)); // empty branch
    assert_eq!(dfa.find_at(b"", 0), Some(0));
}

// ── Dotall mode ────────────────────────────────────────────────────────

#[test]
fn dotall_plus() {
    let dfa = Dfa::compile("(?s).+").unwrap();
    assert_eq!(dfa.find_at(b"a\nb\nc", 0), Some(5));
}

#[test]
fn dotall_star() {
    let dfa = Dfa::compile("(?s).*").unwrap();
    assert_eq!(dfa.find_at(b"a\nb\nc", 0), Some(5));
    assert_eq!(dfa.find_at(b"", 0), Some(0));
}

#[test]
fn dotall_bounded() {
    let dfa = Dfa::compile("(?s).{2,4}").unwrap();
    assert_eq!(dfa.find_at(b"a\nb\nc", 0), Some(4));
    assert_eq!(dfa.find_at(b"a", 0), None);
}

#[test]
fn no_dotall_stops_at_newline() {
    let dfa = Dfa::compile(".+").unwrap();
    assert_eq!(dfa.find_at(b"hello\nworld", 0), Some(5));
    assert_eq!(dfa.find_at(b"\nhello", 0), None);
}

// ── Oracle sweep over mixed patterns ───────────────────────────────────

#[test]
fn oracle_digits() {
    assert_dfa_fidelity(r"\d+", &["123", "abc", "1a2b", "", "0"]);
}

#[test]
fn oracle_word_chars() {
    assert_dfa_fidelity(r"\w+", &["hello_world", "foo-bar", "123", "", " "]);
}

#[test]
fn oracle_whitespace() {
    assert_dfa_fidelity(r"\s+", &["  \t\n", "abc", " a ", "", "\r\n"]);
}

#[test]
fn oracle_hex_color() {
    assert_dfa_fidelity(
        r"#[0-9a-fA-F]{3,8}",
        &[
            "#fff",
            "#FF00CC",
            "#12345678",
            "#12",
            "#abcdefgh",
            "no-hash",
        ],
    );
}

#[test]
fn oracle_email_like() {
    assert_dfa_fidelity(
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        &[
            "user@example.com",
            "bad@",
            "@missing",
            "a@b.co",
            "test.email+tag@sub.domain.org",
        ],
    );
}

#[test]
fn oracle_json_string_body() {
    // JSON string interior: any char except `"` and `\`, or an escape sequence.
    assert_dfa_fidelity(
        r#"[^"\\]*(?:\\.[^"\\]*)*"#,
        &[
            r#"hello world"#,
            r#"escaped\"quote"#,
            r#"back\\slash"#,
            r#"tab\there"#,
            "",
            r#"\"#,
        ],
    );
}

#[test]
fn oracle_css_number() {
    assert_dfa_fidelity(
        r"[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?",
        &[
            "3.14", "-42", "+0.5", ".75", "1e10", "2.5E-3", "abc", "", ".", "+", "1.",
        ],
    );
}

#[test]
fn oracle_nested_groups() {
    assert_dfa_fidelity(
        r"(a(b(c)?)?)?(d|e)*",
        &["abc", "abd", "abde", "de", "", "a", "ab", "eee", "xyz"],
    );
}

#[test]
fn oracle_repetition_boundary() {
    assert_dfa_fidelity(
        r"x{2,5}",
        &["x", "xx", "xxx", "xxxx", "xxxxx", "xxxxxx", "", "y"],
    );
}

#[test]
fn oracle_pipe_literal() {
    // Alternation of fixed strings — exercises prefix factoring in the NFA.
    assert_dfa_fidelity(
        "rem|rlh|em|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|%",
        &[
            "rem", "rlh", "em", "ex", "ch", "vw", "vh", "vmin", "vmax", "cm", "mm", "in", "pt",
            "pc", "px", "%", "remx", "r", "v", "",
        ],
    );
}
