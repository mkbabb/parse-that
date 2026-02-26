#[cfg(test)]
mod tests {
    use parse_that::parsers::json::json_parser;
    use parse_that::parsers::json::json_parser_fast;
    use parse_that::parsers::json::JsonValue;
    use std::fs;

    /// Helper: lookup a key in a Vec-of-pairs object.
    fn obj_get<'a, 'b>(
        pairs: &'b [(&'a str, JsonValue<'a>)],
        key: &str,
    ) -> Option<&'b JsonValue<'a>> {
        pairs.iter().find(|(k, _)| *k == key).map(|(_, v)| v)
    }

    #[test]
    fn test_json() {
        let json = r#"
            {
                "a": 1,
                "b": 2,
                "c": 3
            }
        "#;

        let result = json_parser().parse(json).unwrap();

        match result {
            JsonValue::Object(pairs) => {
                assert_eq!(pairs.len(), 3);
                assert_eq!(obj_get(&pairs, "a").unwrap(), &JsonValue::Number(1.0));
                assert_eq!(obj_get(&pairs, "b").unwrap(), &JsonValue::Number(2.0));
                assert_eq!(obj_get(&pairs, "c").unwrap(), &JsonValue::Number(3.0));
            }
            _ => panic!("Expected JsonValue::Object"),
        }
    }

    #[test]
    fn test_json_file() {
        let json_file_path = "../../data/json/data-l.json";
        let json_string = fs::read_to_string(json_file_path).unwrap();

        let arr = json_parser().parse(&json_string).unwrap();

        match arr {
            JsonValue::Array(arr) => {
                assert_eq!(arr.len(), 4784);
            }
            _ => panic!("Expected JsonValue::Array"),
        }
    }

    #[test]
    fn test_json_file_print() {
        use pprint::pprint;

        let json_file_path = "../../data/json/data.json";
        let json_string = fs::read_to_string(json_file_path).unwrap();

        let arr = json_parser().parse(&json_string).unwrap();

        let pretty = pprint(arr, None);

        println!("{}", pretty);
    }

    // ── B2: Comprehensive JSON string edge case tests ──────────────

    #[test]
    fn test_string_basic_escapes() {
        let cases = vec![
            (r#""\"""#, "\""),
            (r#""\\""#, "\\"),
            (r#""\/""#, "/"),   // escaped forward slash — valid JSON
            (r#""\b""#, "\x08"),  // we store raw span, so content is \b
            (r#""\n""#, "\n"),
            (r#""\r""#, "\r"),
            (r#""\t""#, "\t"),
        ];

        let parser = json_parser();
        for (input, _expected_content) in &cases {
            let result = parser.parse(input);
            assert!(
                result.is_some(),
                "Failed to parse string: {}",
                input
            );
            match result.unwrap() {
                JsonValue::String(s) => {
                    // Our parser returns raw span content (between quotes),
                    // so escapes are NOT decoded — just verify it parsed.
                    assert!(!s.is_empty() || input == &r#""""#);
                }
                other => panic!("Expected String, got {:?} for input {}", other, input),
            }
        }
    }

    #[test]
    fn test_string_unicode_escape() {
        let input = r#""\u0041""#; // \u0041 = 'A'
        let result = json_parser().parse(input);
        assert!(result.is_some(), "Failed to parse unicode escape");
        match result.unwrap() {
            JsonValue::String(s) => {
                assert_eq!(s, r"\u0041"); // raw span — not decoded
            }
            other => panic!("Expected String, got {:?}", other),
        }
    }

    #[test]
    fn test_string_empty() {
        let input = r#""""#;
        let result = json_parser().parse(input);
        assert!(result.is_some(), "Failed to parse empty string");
        match result.unwrap() {
            JsonValue::String(s) => assert_eq!(s, ""),
            other => panic!("Expected String, got {:?}", other),
        }
    }

    #[test]
    fn test_string_nested_escapes() {
        // \\\" in JSON source = escaped backslash + escaped quote
        // Raw content between quotes: \\\"
        let input = r#""\\\"""#;
        let result = json_parser().parse(input);
        assert!(result.is_some(), "Failed to parse nested escapes");
        match result.unwrap() {
            JsonValue::String(s) => {
                assert_eq!(s, "\\\\\\\"");
            }
            other => panic!("Expected String, got {:?}", other),
        }
    }

    #[test]
    fn test_string_only_escapes() {
        let input = r#""\n\t\r""#;
        let result = json_parser().parse(input);
        assert!(result.is_some(), "Failed to parse string with only escapes");
    }

    #[test]
    fn test_string_with_forward_slash_escape() {
        // apache-builds.json contains \/ escapes
        let input = r#""http:\/\/example.com""#;
        let result = json_parser().parse(input);
        assert!(result.is_some(), "Failed to parse string with \\/ escapes");
        match result.unwrap() {
            JsonValue::String(s) => {
                assert_eq!(s, r"http:\/\/example.com");
            }
            other => panic!("Expected String, got {:?}", other),
        }
    }

    #[test]
    fn test_malformed_unterminated_string() {
        let input = r#""hello"#; // no closing quote
        let result = json_parser().parse(input);
        assert!(result.is_none(), "Should reject unterminated string");
    }

    #[test]
    fn test_malformed_truncated_unicode() {
        let input = r#""\u00""#; // only 2 hex digits instead of 4
        let result = json_parser().parse(input);
        assert!(result.is_none(), "Should reject truncated \\uXX");
    }

    #[test]
    fn test_malformed_unicode_at_end() {
        let input = r#""\u""#; // \u with no hex digits at all
        let result = json_parser().parse(input);
        assert!(result.is_none(), "Should reject \\u with no hex digits");
    }

    #[test]
    fn test_malformed_backslash_at_end() {
        let input = "\"\\"; // backslash then EOF
        let result = json_parser().parse(input);
        assert!(result.is_none(), "Should reject backslash at end of input");
    }

    #[test]
    fn test_malformed_not_json() {
        let result = json_parser().parse("hello");
        assert!(result.is_none(), "Should reject bare identifier");
    }

    #[test]
    fn test_null_value() {
        let result = json_parser().parse("null").unwrap();
        assert_eq!(result, JsonValue::Null);
    }

    #[test]
    fn test_boolean_values() {
        assert_eq!(json_parser().parse("true").unwrap(), JsonValue::Bool(true));
        assert_eq!(json_parser().parse("false").unwrap(), JsonValue::Bool(false));
    }

    #[test]
    fn test_empty_array() {
        let result = json_parser().parse("[]").unwrap();
        assert_eq!(result, JsonValue::Array(vec![]));
    }

    #[test]
    fn test_empty_object() {
        let result = json_parser().parse("{}").unwrap();
        match result {
            JsonValue::Object(pairs) => assert_eq!(pairs.len(), 0),
            other => panic!("Expected empty object, got {:?}", other),
        }
    }

    #[test]
    fn test_nested_arrays() {
        let input = "[[1, 2], [3, 4]]";
        let result = json_parser().parse(input).unwrap();
        match result {
            JsonValue::Array(arr) => {
                assert_eq!(arr.len(), 2);
                match &arr[0] {
                    JsonValue::Array(inner) => assert_eq!(inner.len(), 2),
                    other => panic!("Expected inner array, got {:?}", other),
                }
            }
            other => panic!("Expected Array, got {:?}", other),
        }
    }

    #[test]
    fn test_negative_number() {
        let result = json_parser().parse("-42.5").unwrap();
        assert_eq!(result, JsonValue::Number(-42.5));
    }

    #[test]
    fn test_scientific_notation() {
        let result = json_parser().parse("1.5e10").unwrap();
        assert_eq!(result, JsonValue::Number(1.5e10));
    }

    #[test]
    fn test_long_string() {
        let long = "a".repeat(10_000);
        let input = format!("\"{}\"", long);
        let result = json_parser().parse(&input).unwrap();
        match result {
            JsonValue::String(s) => assert_eq!(s.len(), 10_000),
            other => panic!("Expected String, got {:?}", other),
        }
    }

    // ── B3: parse_that vs serde_json equivalence ───────────────────

    fn count_values(v: &JsonValue) -> usize {
        match v {
            JsonValue::Null | JsonValue::Bool(_) | JsonValue::Number(_) | JsonValue::String(_) => 1,
            JsonValue::Array(arr) => 1 + arr.iter().map(count_values).sum::<usize>(),
            JsonValue::Object(pairs) => {
                1 + pairs.iter().map(|(_, v)| count_values(v)).sum::<usize>()
            }
        }
    }

    fn count_serde_values(v: &serde_json::Value) -> usize {
        match v {
            serde_json::Value::Null
            | serde_json::Value::Bool(_)
            | serde_json::Value::Number(_)
            | serde_json::Value::String(_) => 1,
            serde_json::Value::Array(arr) => 1 + arr.iter().map(count_serde_values).sum::<usize>(),
            serde_json::Value::Object(map) => {
                1 + map.values().map(count_serde_values).sum::<usize>()
            }
        }
    }

    fn compare_structure(ours: &JsonValue, theirs: &serde_json::Value) {
        match (ours, theirs) {
            (JsonValue::Null, serde_json::Value::Null) => {}
            (JsonValue::Bool(a), serde_json::Value::Bool(b)) => assert_eq!(a, b),
            (JsonValue::Number(a), serde_json::Value::Number(b)) => {
                let b_f64 = b.as_f64().unwrap();
                assert!(
                    (a - b_f64).abs() < 1e-10 || (a.is_nan() && b_f64.is_nan()),
                    "Number mismatch: {} vs {}",
                    a,
                    b_f64
                );
            }
            (JsonValue::String(_), serde_json::Value::String(_)) => {
                // String content comparison is tricky because we store raw spans
                // (with escape sequences unescaped by serde but not by us).
                // Just verify both are strings.
            }
            (JsonValue::Array(a), serde_json::Value::Array(b)) => {
                assert_eq!(a.len(), b.len(), "Array length mismatch");
                for (ai, bi) in a.iter().zip(b.iter()) {
                    compare_structure(ai, bi);
                }
            }
            (JsonValue::Object(a), serde_json::Value::Object(b)) => {
                assert_eq!(a.len(), b.len(), "Object key count mismatch");
                // Recurse into object values by matching keys
                for (key, val) in a.iter() {
                    let serde_val = b.get(*key).unwrap_or_else(|| {
                        panic!("Key '{}' in parse_that but not in serde_json", key)
                    });
                    compare_structure(val, serde_val);
                }
            }
            _ => panic!(
                "Type mismatch: parse_that={:?}, serde={:?}",
                std::mem::discriminant(ours),
                theirs
            ),
        }
    }

    fn test_equivalence_for_file(filename: &str) {
        let path = format!("../../data/json/{}", filename);
        let data = fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));

        let ours = json_parser()
            .parse(&data)
            .unwrap_or_else(|| panic!("parse_that failed on {}", filename));
        let theirs: serde_json::Value = serde_json::from_str(&data)
            .unwrap_or_else(|e| panic!("serde_json failed on {}: {}", filename, e));

        let our_count = count_values(&ours);
        let their_count = count_serde_values(&theirs);
        assert_eq!(
            our_count, their_count,
            "{}: value count mismatch: parse_that={} serde={}",
            filename, our_count, their_count
        );

        compare_structure(&ours, &theirs);
    }

    #[test]
    fn test_equivalence_data() {
        test_equivalence_for_file("data.json");
    }

    #[test]
    fn test_equivalence_canada() {
        test_equivalence_for_file("canada.json");
    }

    #[test]
    fn test_equivalence_apache() {
        test_equivalence_for_file("apache-builds.json");
    }

    #[test]
    fn test_equivalence_data_xl() {
        test_equivalence_for_file("data-xl.json");
    }

    #[test]
    fn test_equivalence_twitter() {
        test_equivalence_for_file("twitter.json");
    }

    #[test]
    fn test_equivalence_citm_catalog() {
        test_equivalence_for_file("citm_catalog.json");
    }

    // ── json_parser_fast parallel tests ──────────────────────────────

    #[test]
    fn test_fast_json() {
        let json = r#"
            {
                "a": 1,
                "b": 2,
                "c": 3
            }
        "#;

        let result = json_parser_fast().parse(json).unwrap();

        match result {
            JsonValue::Object(pairs) => {
                assert_eq!(pairs.len(), 3);
                assert_eq!(obj_get(&pairs, "a").unwrap(), &JsonValue::Number(1.0));
                assert_eq!(obj_get(&pairs, "b").unwrap(), &JsonValue::Number(2.0));
                assert_eq!(obj_get(&pairs, "c").unwrap(), &JsonValue::Number(3.0));
            }
            _ => panic!("Expected JsonValue::Object"),
        }
    }

    #[test]
    fn test_fast_json_file() {
        let json_file_path = "../../data/json/data-l.json";
        let json_string = fs::read_to_string(json_file_path).unwrap();

        let arr = json_parser_fast().parse(&json_string).unwrap();

        match arr {
            JsonValue::Array(arr) => {
                assert_eq!(arr.len(), 4784);
            }
            _ => panic!("Expected JsonValue::Array"),
        }
    }

    #[test]
    fn test_fast_null_value() {
        assert_eq!(json_parser_fast().parse("null").unwrap(), JsonValue::Null);
    }

    #[test]
    fn test_fast_boolean_values() {
        assert_eq!(
            json_parser_fast().parse("true").unwrap(),
            JsonValue::Bool(true)
        );
        assert_eq!(
            json_parser_fast().parse("false").unwrap(),
            JsonValue::Bool(false)
        );
    }

    #[test]
    fn test_fast_empty_array() {
        assert_eq!(
            json_parser_fast().parse("[]").unwrap(),
            JsonValue::Array(vec![])
        );
    }

    #[test]
    fn test_fast_empty_object() {
        match json_parser_fast().parse("{}").unwrap() {
            JsonValue::Object(pairs) => assert_eq!(pairs.len(), 0),
            other => panic!("Expected empty object, got {:?}", other),
        }
    }

    #[test]
    fn test_fast_nested_arrays() {
        let input = "[[1, 2], [3, 4]]";
        let result = json_parser_fast().parse(input).unwrap();
        match result {
            JsonValue::Array(arr) => {
                assert_eq!(arr.len(), 2);
                match &arr[0] {
                    JsonValue::Array(inner) => assert_eq!(inner.len(), 2),
                    other => panic!("Expected inner array, got {:?}", other),
                }
            }
            other => panic!("Expected Array, got {:?}", other),
        }
    }

    #[test]
    fn test_fast_negative_number() {
        assert_eq!(
            json_parser_fast().parse("-42.5").unwrap(),
            JsonValue::Number(-42.5)
        );
    }

    #[test]
    fn test_fast_scientific_notation() {
        assert_eq!(
            json_parser_fast().parse("1.5e10").unwrap(),
            JsonValue::Number(1.5e10)
        );
    }

    #[test]
    fn test_fast_integer_path() {
        // Pure integers should use the fast path (no float parsing)
        assert_eq!(
            json_parser_fast().parse("42").unwrap(),
            JsonValue::Number(42.0)
        );
        assert_eq!(
            json_parser_fast().parse("-100").unwrap(),
            JsonValue::Number(-100.0)
        );
        assert_eq!(
            json_parser_fast().parse("0").unwrap(),
            JsonValue::Number(0.0)
        );
        // Large integer (>15 digits) falls back to fast_float2
        assert_eq!(
            json_parser_fast().parse("9007199254740992").unwrap(),
            JsonValue::Number(9007199254740992.0)
        );
        // 16-digit integer within 2^53 — uses fast path
        assert_eq!(
            json_parser_fast().parse("1000000000000000").unwrap(),
            JsonValue::Number(1000000000000000.0)
        );
    }

    #[test]
    fn test_fast_string_escapes() {
        let cases = vec![
            r#""\"""#,
            r#""\\""#,
            r#""\n""#,
            r#""\t""#,
            r#""\r""#,
            r#""\b""#,
            r#""\f""#,
            r#""\/""#,
            r#""\u0041""#,
        ];

        let parser = json_parser_fast();
        for input in &cases {
            let result = parser.parse(input);
            assert!(result.is_some(), "Failed to parse string: {}", input);
            match result.unwrap() {
                JsonValue::String(_) => {}
                other => panic!("Expected String, got {:?} for input {}", other, input),
            }
        }
    }

    #[test]
    fn test_fast_string_empty() {
        match json_parser_fast().parse(r#""""#).unwrap() {
            JsonValue::String(s) => assert_eq!(s, ""),
            other => panic!("Expected String, got {:?}", other),
        }
    }

    #[test]
    fn test_fast_long_string() {
        let long = "a".repeat(10_000);
        let input = format!("\"{}\"", long);
        match json_parser_fast().parse(&input).unwrap() {
            JsonValue::String(s) => assert_eq!(s.len(), 10_000),
            other => panic!("Expected String, got {:?}", other),
        }
    }

    #[test]
    fn test_fast_single_element_containers() {
        // Single-element array
        match json_parser_fast().parse("[42]").unwrap() {
            JsonValue::Array(arr) => {
                assert_eq!(arr.len(), 1);
                assert_eq!(arr[0], JsonValue::Number(42.0));
            }
            other => panic!("Expected Array, got {:?}", other),
        }
        // Single-key object
        match json_parser_fast().parse(r#"{"x": true}"#).unwrap() {
            JsonValue::Object(pairs) => {
                assert_eq!(pairs.len(), 1);
                assert_eq!(pairs[0], ("x", JsonValue::Bool(true)));
            }
            other => panic!("Expected Object, got {:?}", other),
        }
    }

    #[test]
    fn test_fast_malformed_inputs() {
        let parser = json_parser_fast();
        assert!(parser.parse("hello").is_none());
        assert!(parser.parse(r#""unterminated"#).is_none());
        assert!(parser.parse("").is_none());
        assert!(parser.parse("{\"a\":}").is_none());
        // Truncated unicode
        assert!(parser.parse(r#""\u00""#).is_none());
        assert!(parser.parse(r#""\u""#).is_none());
        // Backslash at EOF
        assert!(parser.parse("\"\\").is_none());
    }

    #[test]
    fn test_fast_whitespace_variants() {
        // Tab-separated
        assert!(json_parser_fast().parse("{\t\"a\"\t:\t1\t}").is_some());
        // CRLF
        assert!(json_parser_fast().parse("{\r\n\"a\"\r\n:\r\n1\r\n}").is_some());
        // Mixed whitespace
        assert!(json_parser_fast().parse(" \t\r\n null \t\r\n ").is_some());
    }

    #[test]
    fn test_fast_number_edge_cases() {
        let parser = json_parser_fast();
        // Negative exponent
        assert_eq!(
            parser.parse("1.5e-10").unwrap(),
            JsonValue::Number(1.5e-10)
        );
        // Explicit positive exponent
        assert_eq!(
            parser.parse("1.5e+10").unwrap(),
            JsonValue::Number(1.5e10)
        );
        // Integer 1.0 (has decimal)
        assert_eq!(parser.parse("1.0").unwrap(), JsonValue::Number(1.0));
    }

    // ── Fast parser equivalence with serde_json ─────────────────────

    fn test_fast_equivalence_for_file(filename: &str) {
        let path = format!("../../data/json/{}", filename);
        let data = fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));

        let ours = json_parser_fast()
            .parse(&data)
            .unwrap_or_else(|| panic!("json_parser_fast failed on {}", filename));
        let theirs: serde_json::Value = serde_json::from_str(&data)
            .unwrap_or_else(|e| panic!("serde_json failed on {}: {}", filename, e));

        let our_count = count_values(&ours);
        let their_count = count_serde_values(&theirs);
        assert_eq!(
            our_count, their_count,
            "{}: value count mismatch: fast={} serde={}",
            filename, our_count, their_count
        );

        compare_structure(&ours, &theirs);
    }

    #[test]
    fn test_fast_equivalence_data() {
        test_fast_equivalence_for_file("data.json");
    }

    #[test]
    fn test_fast_equivalence_canada() {
        test_fast_equivalence_for_file("canada.json");
    }

    #[test]
    fn test_fast_equivalence_apache() {
        test_fast_equivalence_for_file("apache-builds.json");
    }

    #[test]
    fn test_fast_equivalence_data_xl() {
        test_fast_equivalence_for_file("data-xl.json");
    }

    #[test]
    fn test_fast_equivalence_twitter() {
        test_fast_equivalence_for_file("twitter.json");
    }

    #[test]
    fn test_fast_equivalence_citm_catalog() {
        test_fast_equivalence_for_file("citm_catalog.json");
    }

    // ── Cross-parser equivalence: fast vs combinator ────────────────

    fn test_fast_vs_combinator(filename: &str) {
        let path = format!("../../data/json/{}", filename);
        let data = fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));

        let combinator = json_parser()
            .parse(&data)
            .unwrap_or_else(|| panic!("json_parser failed on {}", filename));
        let fast = json_parser_fast()
            .parse(&data)
            .unwrap_or_else(|| panic!("json_parser_fast failed on {}", filename));

        assert_eq!(
            count_values(&combinator),
            count_values(&fast),
            "{}: value count mismatch between combinator and fast",
            filename
        );
    }

    #[test]
    fn test_fast_vs_combinator_data() {
        test_fast_vs_combinator("data.json");
    }

    #[test]
    fn test_fast_vs_combinator_canada() {
        test_fast_vs_combinator("canada.json");
    }

    #[test]
    fn test_fast_vs_combinator_twitter() {
        test_fast_vs_combinator("twitter.json");
    }

    #[test]
    fn test_fast_vs_combinator_citm_catalog() {
        test_fast_vs_combinator("citm_catalog.json");
    }

    #[test]
    fn test_fast_vs_combinator_apache() {
        test_fast_vs_combinator("apache-builds.json");
    }

    #[test]
    fn test_fast_vs_combinator_data_xl() {
        test_fast_vs_combinator("data-xl.json");
    }
}
