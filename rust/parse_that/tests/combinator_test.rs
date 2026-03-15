#[cfg(test)]
mod tests {
    use parse_that::state::{ParserState, Span};
    use parse_that::*;

    // ── string / string_span ──────────────────────────────────

    #[test]
    fn test_string_match() {
        assert_eq!(string("hello").parse("hello world"), Some("hello"));
    }

    #[test]
    fn test_string_no_match() {
        assert_eq!(string("hello").parse("world"), None);
    }

    #[test]
    fn test_string_empty_pattern() {
        assert_eq!(string("").parse("anything"), Some(""));
    }

    #[test]
    fn test_string_span_match() {
        let span = string_span("abc").parse("abcdef").unwrap();
        assert_eq!(span.start, 0);
        assert_eq!(span.end, 3);
        assert_eq!(span.as_str(), "abc");
    }

    #[test]
    fn test_string_empty_input() {
        assert_eq!(string("a").parse(""), None);
    }

    #[test]
    fn test_string_utf8() {
        assert_eq!(string("日本").parse("日本語"), Some("日本"));
    }

    // ── regex / regex_span ────────────────────────────────────

    #[test]
    fn test_regex_digits() {
        assert_eq!(regex(r"\d+").parse("12345abc"), Some("12345"));
    }

    #[test]
    fn test_regex_no_match() {
        assert_eq!(regex(r"\d+").parse("abc"), None);
    }

    #[test]
    fn test_regex_span_match() {
        let span = regex_span(r"[a-z]+").parse("hello123").unwrap();
        assert_eq!(span.as_str(), "hello");
    }

    #[test]
    fn test_regex_empty_input() {
        assert_eq!(regex(r"\d+").parse(""), None);
    }

    // ── take_while_span ───────────────────────────────────────

    #[test]
    fn test_take_while_span_digits() {
        let span = take_while_span(|c| c.is_ascii_digit())
            .parse("123abc")
            .unwrap();
        assert_eq!(span.as_str(), "123");
    }

    #[test]
    fn test_take_while_span_no_match() {
        assert!(
            take_while_span(|c| c.is_ascii_digit())
                .parse("abc")
                .is_none()
        );
    }

    #[test]
    fn test_take_while_span_utf8() {
        let span = take_while_span(|c| !c.is_ascii())
            .parse("日本語abc")
            .unwrap();
        assert_eq!(span.as_str(), "日本語");
    }

    // ── next_span ─────────────────────────────────────────────

    #[test]
    fn test_next_span() {
        let span = next_span(3).parse("abcdef").unwrap();
        assert_eq!(span.as_str(), "abc");
    }

    #[test]
    fn test_next_span_empty_input() {
        assert!(next_span(1).parse("").is_none());
    }

    // ── any_span ──────────────────────────────────────────────

    #[test]
    fn test_any_span_keywords() {
        let span = any_span(&["true", "false", "null"]).parse("true!").unwrap();
        assert_eq!(span.as_str(), "true");
    }

    #[test]
    fn test_any_span_no_match() {
        assert!(any_span(&["true", "false"]).parse("null").is_none());
    }

    // ── then ──────────────────────────────────────────────────

    #[test]
    fn test_then_success() {
        let (a, b) = string("a").then(string("b")).parse("abc").unwrap();
        assert_eq!(a, "a");
        assert_eq!(b, "b");
    }

    #[test]
    fn test_then_first_fails() {
        assert!(string("x").then(string("b")).parse("abc").is_none());
    }

    #[test]
    fn test_then_second_fails() {
        assert!(string("a").then(string("x")).parse("abc").is_none());
    }

    // ── or ────────────────────────────────────────────────────

    #[test]
    fn test_or_first_matches() {
        assert_eq!((string("a") | string("b")).parse("abc"), Some("a"));
    }

    #[test]
    fn test_or_second_matches() {
        assert_eq!((string("a") | string("b")).parse("bcd"), Some("b"));
    }

    #[test]
    fn test_or_neither_matches() {
        assert!((string("a") | string("b")).parse("cde").is_none());
    }

    #[test]
    fn test_or_backtracking() {
        // First branch partially matches prefix but fails — must backtrack
        let p = string("ab").then(string("c")).map(|(a, _b)| a);
        let q = string("ab").then(string("d")).map(|(a, _b)| a);
        let parser = p.save_state() | q.save_state();
        assert_eq!(parser.parse("abd"), Some("ab"));
    }

    // ── map ───────────────────────────────────────────────────

    #[test]
    fn test_map_transform() {
        let p = regex(r"\d+").map(|s: &str| s.parse::<i32>().unwrap());
        assert_eq!(p.parse("42abc"), Some(42));
    }

    #[test]
    fn test_map_failure_propagates() {
        let p = regex(r"\d+").map(|s: &str| s.parse::<i32>().unwrap());
        assert!(p.parse("abc").is_none());
    }

    // ── opt ───────────────────────────────────────────────────

    #[test]
    fn test_opt_some() {
        assert_eq!(string("a").opt().parse("abc"), Some(Some("a")));
    }

    #[test]
    fn test_opt_none() {
        assert_eq!(string("x").opt().parse("abc"), Some(None));
    }

    // ── many ──────────────────────────────────────────────────

    #[test]
    fn test_many_unbounded() {
        let p = string("a").many(..);
        assert_eq!(p.parse("aaab"), Some(vec!["a", "a", "a"]));
    }

    #[test]
    fn test_many_with_min() {
        let p = string("a").many(2..);
        assert!(p.parse("ab").is_none());
        assert_eq!(p.parse("aab"), Some(vec!["a", "a"]));
    }

    #[test]
    fn test_many_with_max() {
        // ..=2 → Included(2) → upper_bound = 3, so many(..2) limits to 2
        let p = string("a").many(..2);
        assert_eq!(p.parse("aaab"), Some(vec!["a", "a"]));
    }

    #[test]
    fn test_many_zero_matches() {
        let p = string("x").many(..);
        assert_eq!(p.parse("abc"), Some(vec![]));
    }

    // ── sep_by ────────────────────────────────────────────────

    #[test]
    fn test_sep_by() {
        let p = regex(r"\d+").sep_by(string(","), 1..);
        let result = p.parse("1,2,3end").unwrap();
        assert_eq!(result, vec!["1", "2", "3"]);
    }

    #[test]
    fn test_sep_by_single() {
        let p = regex(r"\d+").sep_by(string(","), 1..);
        assert_eq!(p.parse("42"), Some(vec!["42"]));
    }

    #[test]
    fn test_sep_by_min_not_met() {
        let p = regex(r"\d+").sep_by(string(","), 2..);
        assert!(p.parse("42").is_none());
    }

    // ── skip / next ───────────────────────────────────────────

    #[test]
    fn test_skip() {
        let p = string("a").skip(string("b"));
        assert_eq!(p.parse("abc"), Some("a"));
    }

    #[test]
    fn test_next_combinator() {
        let p = string("a").next(string("b"));
        assert_eq!(p.parse("abc"), Some("b"));
    }

    // ── wrap ──────────────────────────────────────────────────

    #[test]
    fn test_wrap() {
        let p = regex(r"\d+").wrap(string("("), string(")"));
        assert_eq!(p.parse("(42)rest"), Some("42"));
    }

    #[test]
    fn test_wrap_missing_right() {
        let p = regex(r"\d+").wrap(string("("), string(")"));
        assert!(p.parse("(42rest").is_none());
    }

    // ── not / negate ──────────────────────────────────────────

    #[test]
    fn test_not_success() {
        let p = string("a").not(string("b"));
        assert_eq!(p.parse("ac"), Some("a"));
    }

    #[test]
    fn test_not_failure() {
        let p = string("a").not(string("b"));
        assert!(p.parse("ab").is_none());
    }

    #[test]
    fn test_negate_success() {
        let p = string("x").negate();
        assert_eq!(p.parse("abc"), Some(()));
    }

    #[test]
    fn test_negate_failure() {
        let p = string("a").negate();
        assert!(p.parse("abc").is_none());
    }

    // ── look_ahead ────────────────────────────────────────────

    #[test]
    fn test_look_ahead_success() {
        let p = string("a").look_ahead(string("b"));
        let (result, state) = p.parse_return_state("abc");
        assert_eq!(result, Some("a"));
        // look_ahead should not consume 'b'
        assert_eq!(state.offset, 1);
    }

    #[test]
    fn test_look_ahead_failure() {
        let p = string("a").look_ahead(string("x"));
        assert!(p.parse("abc").is_none());
    }

    // ── trim_whitespace ───────────────────────────────────────

    #[test]
    fn test_trim_whitespace() {
        let p = string("hello").trim_whitespace();
        assert_eq!(p.parse("  hello  "), Some("hello"));
    }

    #[test]
    fn test_trim_whitespace_no_ws() {
        let p = string("hello").trim_whitespace();
        assert_eq!(p.parse("hello"), Some("hello"));
    }

    // ── save_state ────────────────────────────────────────────

    #[test]
    fn test_save_state_success() {
        let p = string("a").then(string("b")).save_state();
        let result = p.parse("abc");
        assert!(result.is_some());
    }

    #[test]
    fn test_save_state_backtrack() {
        let p = string("a").then(string("x")).save_state();
        let (result, state) = p.parse_return_state("abc");
        assert!(result.is_none());
        assert_eq!(state.offset, 0); // should backtrack
    }

    // ── eof ───────────────────────────────────────────────────

    #[test]
    fn test_eof_at_end() {
        let p = string("abc").eof();
        assert_eq!(p.parse("abc"), Some("abc"));
    }

    #[test]
    fn test_eof_not_at_end() {
        let p = string("ab").eof();
        assert!(p.parse("abc").is_none());
    }

    // ── lazy ──────────────────────────────────────────────────

    #[test]
    fn test_lazy_basic() {
        let p = lazy(|| string("hello"));
        assert_eq!(p.parse("hello world"), Some("hello"));
    }

    // ── epsilon ───────────────────────────────────────────────

    #[test]
    fn test_epsilon() {
        assert_eq!(epsilon().parse("anything"), Some(()));
        assert_eq!(epsilon().parse(""), Some(()));
    }

    // ── ParserSpan trait ──────────────────────────────────────

    #[test]
    fn test_span_then() {
        let p = string_span("ab").then_span(string_span("cd"));
        let span = p.parse("abcdef").unwrap();
        assert_eq!(span.as_str(), "abcd");
    }

    #[test]
    fn test_span_opt() {
        let p = string_span("x").opt_span();
        let span = p.parse("abc").unwrap();
        assert_eq!(span.start, span.end); // empty span
    }

    #[test]
    fn test_span_many() {
        let p = string_span("a").many_span(..);
        let span = p.parse("aaab").unwrap();
        assert_eq!(span.as_str(), "aaa");
    }

    #[test]
    fn test_span_sep_by() {
        let p = regex_span(r"\d+").sep_by_span(string_span(","), 1..);
        let span = p.parse("1,2,3end").unwrap();
        assert_eq!(span.as_str(), "1,2,3");
    }

    #[test]
    fn test_span_wrap() {
        let p = regex_span(r"\d+").wrap_span(string_span("("), string_span(")"));
        let span = p.parse("(42)rest").unwrap();
        assert_eq!(span.as_str(), "42");
    }

    // ── ParserFlat trait (tuple flattening) ───────────────────

    #[test]
    fn test_flat_then() {
        let p: Parser<(_, _, _)> = ParserFlat::then(string("a").then(string("b")), string("c"));
        let (a, b, c) = p.parse("abcd").unwrap();
        assert_eq!((a, b, c), ("a", "b", "c"));
    }

    // ── Operator overloads ────────────────────────────────────

    #[test]
    fn test_bitor_operator() {
        let p = string("a") | string("b");
        assert_eq!(p.parse("bcd"), Some("b"));
    }

    #[test]
    fn test_add_operator() {
        let p = string("a") + string("b");
        assert_eq!(p.parse("abc"), Some(("a", "b")));
    }

    // ── parse_or_error ────────────────────────────────────────

    #[test]
    fn test_parse_or_error_success() {
        let result = string("hello").parse_or_error("hello");
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_or_error_failure() {
        let result = string("hello").parse_or_error("world");
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.offset, 0);
    }

    // ── SpanParser tests ──────────────────────────────────────

    #[test]
    fn test_sp_string_match() {
        let p = sp_string("hello");
        let mut state = ParserState::new("hello world");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.as_str(), "hello");
        assert_eq!(state.offset, 5);
    }

    #[test]
    fn test_sp_string_no_match() {
        let p = sp_string("hello");
        let mut state = ParserState::new("world");
        assert!(p.call(&mut state).is_none());
        assert_eq!(state.offset, 0);
    }

    #[test]
    fn test_sp_take_while_byte() {
        let p = sp_take_while_byte(|b| b.is_ascii_digit());
        let mut state = ParserState::new("12345abc");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.as_str(), "12345");
    }

    #[test]
    fn test_sp_take_while_byte_no_match() {
        let p = sp_take_while_byte(|b| b.is_ascii_digit());
        let mut state = ParserState::new("abc");
        assert!(p.call(&mut state).is_none());
    }

    #[test]
    fn test_sp_seq_flattening() {
        // a.then_span(b).then_span(c) should flatten to Seq([a,b,c])
        let p = sp_string("a")
            .then_span(sp_string("b"))
            .then_span(sp_string("c"));
        let mut state = ParserState::new("abcdef");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.as_str(), "abc");
        assert_eq!(state.offset, 3);
    }

    #[test]
    fn test_sp_oneof_flattening() {
        let p = sp_string("a") | sp_string("b") | sp_string("c");
        let mut state = ParserState::new("bcd");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.as_str(), "b");
    }

    #[test]
    fn test_sp_many() {
        let p = sp_string("ab").many_span(..);
        let mut state = ParserState::new("abababc");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.as_str(), "ababab");
    }

    #[test]
    fn test_sp_sep_by() {
        let p = sp_take_while_byte(|b| b.is_ascii_digit()).sep_by_span(sp_string(","), 1..);
        let mut state = ParserState::new("1,2,3end");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.as_str(), "1,2,3");
    }

    #[test]
    fn test_sp_wrap() {
        let p =
            sp_take_while_byte(|b| b.is_ascii_digit()).wrap_span(sp_string("("), sp_string(")"));
        let mut state = ParserState::new("(42)rest");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.as_str(), "42");
    }

    #[test]
    fn test_sp_opt() {
        let p = sp_string("x").opt_span();
        let mut state = ParserState::new("abc");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.start, span.end); // empty
    }

    #[test]
    fn test_sp_trim_whitespace() {
        let p = sp_string("hello").trim_whitespace();
        let mut state = ParserState::new("  hello  rest");
        let span = p.call(&mut state).unwrap();
        assert_eq!(span.as_str(), "hello");
        assert_eq!(state.offset, 9); // consumed trailing ws too
    }

    #[test]
    fn test_sp_bridge_map() {
        let p: Parser<i32> =
            sp_take_while_byte(|b| b.is_ascii_digit()).map(|s| s.as_str().parse().unwrap());
        assert_eq!(p.parse("42abc"), Some(42));
    }

    #[test]
    fn test_sp_bridge_into_parser() {
        let p: Parser<Span> = sp_string("hello").into_parser();
        let span = p.parse("hello world").unwrap();
        assert_eq!(span.as_str(), "hello");
    }

    // ── number_span_fast tests ────────────────────────────────

    #[test]
    fn test_number_span_fast_integer() {
        let p = number_span_fast_parser();
        assert_eq!(p.parse("42").unwrap().as_str(), "42");
    }

    #[test]
    fn test_number_span_fast_negative() {
        let p = number_span_fast_parser();
        assert_eq!(p.parse("-42").unwrap().as_str(), "-42");
    }

    #[test]
    fn test_number_span_fast_float() {
        let p = number_span_fast_parser();
        assert_eq!(p.parse("3.14").unwrap().as_str(), "3.14");
    }

    #[test]
    fn test_number_span_fast_exponent() {
        let p = number_span_fast_parser();
        assert_eq!(p.parse("1e10").unwrap().as_str(), "1e10");
    }

    #[test]
    fn test_number_span_fast_neg_exponent() {
        let p = number_span_fast_parser();
        assert_eq!(p.parse("1.5e-3").unwrap().as_str(), "1.5e-3");
    }

    #[test]
    fn test_number_span_fast_big_exponent() {
        let p = number_span_fast_parser();
        assert_eq!(p.parse("1e308").unwrap().as_str(), "1e308");
    }

    #[test]
    fn test_number_span_fast_zero() {
        let p = number_span_fast_parser();
        assert_eq!(p.parse("0").unwrap().as_str(), "0");
    }

    #[test]
    fn test_number_span_fast_neg_zero() {
        let p = number_span_fast_parser();
        assert_eq!(p.parse("-0").unwrap().as_str(), "-0");
    }

    #[test]
    fn test_number_span_fast_no_match() {
        let p = number_span_fast_parser();
        assert!(p.parse("abc").is_none());
    }

    #[test]
    fn test_number_span_fast_empty() {
        let p = number_span_fast_parser();
        assert!(p.parse("").is_none());
    }

    #[test]
    fn test_number_span_fast_just_minus() {
        let p = number_span_fast_parser();
        assert!(p.parse("-").is_none());
    }

    // ── one_of / dispatch_byte tests ──────────────────────────

    #[test]
    fn test_one_of() {
        let p = one_of(vec![string("a"), string("b"), string("c")]);
        assert_eq!(p.parse("bcd"), Some("b"));
        assert_eq!(p.parse("cde"), Some("c"));
        assert!(p.parse("xyz").is_none());
    }

    #[test]
    fn test_dispatch_byte() {
        let p = dispatch_byte(vec![(b'a', string("alpha")), (b'b', string("beta"))]);
        assert_eq!(p.parse("alpha"), Some("alpha"));
        assert_eq!(p.parse("beta"), Some("beta"));
        assert!(p.parse("other").is_none());
        assert!(p.parse("xyz").is_none());
    }

    #[test]
    fn test_dispatch_byte_no_fallback() {
        let p: Parser<&str> = dispatch_byte(vec![(b'x', string("x"))]);
        assert_eq!(p.parse("x"), Some("x"));
        assert!(p.parse("y").is_none());
    }

    // ── take_while_byte_span tests ────────────────────────────

    #[test]
    fn test_take_while_byte_span_digits() {
        let p = take_while_byte_span(|b| b.is_ascii_digit());
        let span = p.parse("123abc").unwrap();
        assert_eq!(span.as_str(), "123");
    }

    #[test]
    fn test_take_while_byte_span_no_match() {
        let p = take_while_byte_span(|b| b.is_ascii_digit());
        assert!(p.parse("abc").is_none());
    }

    // ── take_until_any_span tests ──────────────────────────────

    fn naive_take_until_any<'a>(input: &'a str, excluded: &[u8]) -> Option<&'a str> {
        let bytes = input.as_bytes();
        let mut i = 0usize;
        while i < bytes.len() && !excluded.contains(&bytes[i]) {
            i += 1;
        }
        if i == 0 { None } else { Some(&input[..i]) }
    }

    #[test]
    fn test_take_until_any_equivalence_specialization_sizes() {
        let cases: [(&'static [u8], &str); 4] = [
            (b",", "alpha,beta"),
            (b",;", "alpha;beta"),
            (b",;!", "alpha!beta"),
            (b",;!?", "alpha?beta"),
        ];

        for (excluded, input) in cases {
            let expected = naive_take_until_any(input, excluded).unwrap();

            let got_leaf = take_until_any_span(excluded).parse(input).unwrap();
            assert_eq!(got_leaf.as_str(), expected);

            let mut state = ParserState::new(input);
            let got_span = sp_take_until_any(excluded).call(&mut state).unwrap();
            assert_eq!(got_span.as_str(), expected);
        }
    }

    fn next_rand(seed: &mut u64) -> u64 {
        *seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1);
        *seed
    }

    #[test]
    fn test_take_until_any_randomized_equivalence() {
        let mut seed = 0xD1CE_BAAD_1234_5678u64;

        for _ in 0..500 {
            let len = (next_rand(&mut seed) % 64 + 1) as usize;
            let mut input_bytes = Vec::with_capacity(len);
            for _ in 0..len {
                let b = 32u8 + (next_rand(&mut seed) % 95) as u8;
                input_bytes.push(b);
            }
            let input = String::from_utf8(input_bytes).unwrap();

            let excluded_count = (next_rand(&mut seed) % 6) as usize;
            let mut excluded = Vec::with_capacity(excluded_count);
            while excluded.len() < excluded_count {
                let b = 32u8 + (next_rand(&mut seed) % 95) as u8;
                if !excluded.contains(&b) {
                    excluded.push(b);
                }
            }

            let expected = naive_take_until_any(&input, &excluded).map(str::to_string);
            let excluded_static: &'static [u8] = Box::leak(excluded.into_boxed_slice());

            let got_leaf = take_until_any_span(excluded_static)
                .parse(&input)
                .map(|s| s.as_str().to_string());
            assert_eq!(got_leaf, expected);

            let mut state = ParserState::new(&input);
            let got_span = sp_take_until_any(excluded_static)
                .call(&mut state)
                .map(|s| s.as_str().to_string());
            assert_eq!(got_span, expected);
        }
    }

    fn gen_json_number(seed: &mut u64) -> String {
        let mut out = String::new();
        if next_rand(seed) % 2 == 0 {
            out.push('-');
        }

        if next_rand(seed) % 10 == 0 {
            out.push('0');
        } else {
            out.push((b'1' + (next_rand(seed) % 9) as u8) as char);
            let extra_int = (next_rand(seed) % 12) as usize;
            for _ in 0..extra_int {
                out.push((b'0' + (next_rand(seed) % 10) as u8) as char);
            }
        }

        if next_rand(seed) % 3 == 0 {
            out.push('.');
            let frac_len = (next_rand(seed) % 6 + 1) as usize;
            for _ in 0..frac_len {
                out.push((b'0' + (next_rand(seed) % 10) as u8) as char);
            }
        }

        if next_rand(seed) % 3 == 0 {
            out.push(if next_rand(seed) % 2 == 0 { 'e' } else { 'E' });
            match next_rand(seed) % 3 {
                0 => out.push('+'),
                1 => out.push('-'),
                _ => {}
            }
            let exp_len = (next_rand(seed) % 3 + 1) as usize;
            for _ in 0..exp_len {
                out.push((b'0' + (next_rand(seed) % 10) as u8) as char);
            }
        }

        out
    }

    #[test]
    fn test_number_span_fast_randomized_boundaries() {
        let mut seed = 0xA11C_E5E5_7788_99AAu64;
        let suffixes = [",", "]", "}", " ", "\n", "x", "abc"];

        for _ in 0..1000 {
            let number = gen_json_number(&mut seed);
            let suffix = suffixes[(next_rand(&mut seed) as usize) % suffixes.len()];
            let input = format!("{number}{suffix}");
            let parser = number_span_fast_parser();
            let span = parser.parse(&input).unwrap();
            assert_eq!(span.as_str(), number);
        }
    }

    // ── chain ─────────────────────────────────────────────────────────────

    #[test]
    fn chain_basic() {
        // Parse a keyword, then choose a continuation parser based on the value.
        let parser = (string("int") | string("str")).chain(|tag: &str| match tag {
            "int" => regex(r"\d+"),
            "str" => regex(r"[a-z]+"),
            _ => unreachable!(),
        });

        assert_eq!(parser.parse("int42"), Some("42"));
        assert_eq!(parser.parse("strhello"), Some("hello"));
        // Wrong continuation content fails:
        assert_eq!(parser.parse("inthello"), None);
    }

    #[test]
    fn chain_state_advances() {
        // Verify the chained parser runs from where the first left off.
        let parser = string("ab").chain(|_: &str| string("cd"));

        let mut state = ParserState::new("abcd");
        let result = parser.call(&mut state);
        assert_eq!(result, Some("cd"));
        assert_eq!(state.offset, 4);
    }

    #[test]
    fn chain_failure_propagates() {
        // First parser fails → entire chain fails.
        let parser = string("MISSING").chain(|_: &str| string("anything"));

        assert_eq!(parser.parse("hello"), None);
    }

    #[test]
    fn chain_second_failure() {
        // First parser succeeds, chained parser fails.
        let parser = string("ok").chain(|_: &str| string("NOPE"));

        assert_eq!(parser.parse("okwrong"), None);
    }

    // ── memoize ──────────────────────────────────────────────────

    #[test]
    fn memoize_basic_hit() {
        let p = string("hello").memoize();
        // First call populates cache, second returns cached value.
        assert_eq!(p.parse("hello"), Some("hello"));
        assert_eq!(p.parse("hello"), Some("hello"));
    }

    #[test]
    fn memoize_failure_cached() {
        let p = string("hello").memoize();
        // Failure is also cached — second call returns None without re-parsing.
        assert!(p.parse("world").is_none());
        assert!(p.parse("world").is_none());
    }

    #[test]
    fn memoize_offset_restored() {
        // Verify that memoize restores the correct end offset on cache hit.
        let p = string("ab").memoize().then(string("cd"));
        assert_eq!(p.parse("abcd"), Some(("ab", "cd")));
        // Second parse should work identically via cache.
        assert_eq!(p.parse("abcd"), Some(("ab", "cd")));
    }

    #[test]
    fn memoize_different_offsets() {
        // Two calls at different offsets cache independently.
        let inner = regex(r"[a-z]+").memoize();
        let p = inner.sep_by(string(","), 1..);
        let result = p.parse("abc,def,ghi").unwrap();
        assert_eq!(result, vec!["abc", "def", "ghi"]);
    }

    #[test]
    fn memoize_with_alternation() {
        // Memoized parser in alternation avoids redundant re-parsing.
        let word = regex(r"[a-z]+").memoize();
        let p = word.then(string("!")).map(|(w, _)| w).save_state()
            | regex(r"[a-z]+").then(string("?")).map(|(w, _)| w).save_state();
        // First branch fails (no !), second succeeds — word is parsed twice
        // at offset 0 but the memoized version caches the first attempt.
        assert_eq!(p.parse("hello?"), Some("hello"));
    }
}
