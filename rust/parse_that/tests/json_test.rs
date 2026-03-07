#[cfg(test)]
mod tests {
    use parse_that::parsers::json::JsonValue;
    use parse_that::parsers::json::json_parser;
    use std::borrow::Cow;
    use std::fs;

    /// Helper: lookup a key in a Vec-of-pairs object.
    fn obj_get<'a, 'b>(
        pairs: &'b [(Cow<'a, str>, JsonValue<'a>)],
        key: &str,
    ) -> Option<&'b JsonValue<'a>> {
        pairs
            .iter()
            .find(|(k, _)| k.as_ref() == key)
            .map(|(_, v)| v)
    }

    // ── Combinator path tests ───────────────────────────────────────

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
        use pprint::{Printer, pprint};

        let json_file_path = "../../data/json/data.json";
        let json_string = fs::read_to_string(json_file_path).unwrap();

        let arr = json_parser().parse(&json_string).unwrap();

        let pretty = pprint(arr, Printer::default());

        println!("{}", pretty);
    }

    // ── String edge case tests (combinator path — raw spans) ────────

    #[test]
    fn test_string_basic_escapes() {
        let cases = vec![
            r#""\"""#, r#""\\""#, r#""\/""#, r#""\b""#, r#""\n""#, r#""\r""#, r#""\t""#,
        ];

        let parser = json_parser();
        for input in &cases {
            let result = parser.parse(input);
            assert!(result.is_some(), "Failed to parse string: {}", input);
            match result.unwrap() {
                JsonValue::String(s) => {
                    // Combinator path returns raw span — just verify it parsed
                    assert!(!s.is_empty());
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
                // Combinator path returns raw span
                assert_eq!(s.as_ref(), r"\u0041");
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
            JsonValue::String(s) => assert_eq!(s.as_ref(), ""),
            other => panic!("Expected String, got {:?}", other),
        }
    }

    #[test]
    fn test_string_nested_escapes() {
        let input = r#""\\\"""#;
        let result = json_parser().parse(input);
        assert!(result.is_some(), "Failed to parse nested escapes");
    }

    #[test]
    fn test_string_only_escapes() {
        let input = r#""\n\t\r""#;
        let result = json_parser().parse(input);
        assert!(result.is_some(), "Failed to parse string with only escapes");
    }

    #[test]
    fn test_string_with_forward_slash_escape() {
        let input = r#""http:\/\/example.com""#;
        let result = json_parser().parse(input);
        assert!(result.is_some(), "Failed to parse string with \\/ escapes");
    }

    #[test]
    fn test_string_surrogate_pair_edges() {
        let valid = r#""\uD834\uDD1E""#;
        assert!(
            json_parser().parse(valid).is_some(),
            "Valid surrogate pair should parse"
        );

        let lone_high = r#""\uD834x""#;
        assert!(
            json_parser().parse(lone_high).is_none(),
            "Lone high surrogate should fail"
        );

        let lone_low = r#""\uDD1E""#;
        assert!(
            json_parser().parse(lone_low).is_none(),
            "Lone low surrogate should fail"
        );
    }

    #[test]
    fn test_malformed_unterminated_string() {
        let input = r#""hello"#;
        let result = json_parser().parse(input);
        assert!(result.is_none(), "Should reject unterminated string");
    }

    #[test]
    fn test_malformed_truncated_unicode() {
        let input = r#""\u00""#;
        let result = json_parser().parse(input);
        assert!(result.is_none(), "Should reject truncated \\uXX");
    }

    #[test]
    fn test_malformed_unicode_at_end() {
        let input = r#""\u""#;
        let result = json_parser().parse(input);
        assert!(result.is_none(), "Should reject \\u with no hex digits");
    }

    #[test]
    fn test_malformed_backslash_at_end() {
        let input = "\"\\";
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
        assert_eq!(
            json_parser().parse("false").unwrap(),
            JsonValue::Bool(false)
        );
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

    #[test]
    fn test_single_element_containers() {
        match json_parser().parse("[42]").unwrap() {
            JsonValue::Array(arr) => {
                assert_eq!(arr.len(), 1);
                assert_eq!(arr[0], JsonValue::Number(42.0));
            }
            other => panic!("Expected Array, got {:?}", other),
        }
        match json_parser().parse(r#"{"x": true}"#).unwrap() {
            JsonValue::Object(pairs) => {
                assert_eq!(pairs.len(), 1);
                assert_eq!(pairs[0].0.as_ref(), "x");
                assert_eq!(pairs[0].1, JsonValue::Bool(true));
            }
            other => panic!("Expected Object, got {:?}", other),
        }
    }

    #[test]
    fn test_whitespace_variants() {
        assert!(json_parser().parse("{\t\"a\"\t:\t1\t}").is_some());
        assert!(json_parser().parse("{\r\n\"a\"\r\n:\r\n1\r\n}").is_some());
        assert!(json_parser().parse(" \t\r\n null \t\r\n ").is_some());
    }

    #[test]
    fn test_number_edge_cases() {
        let parser = json_parser();
        assert_eq!(parser.parse("1.5e-10").unwrap(), JsonValue::Number(1.5e-10));
        assert_eq!(parser.parse("1.5e+10").unwrap(), JsonValue::Number(1.5e10));
        assert_eq!(parser.parse("1.0").unwrap(), JsonValue::Number(1.0));
    }

    #[test]
    fn test_integer_values() {
        let parser = json_parser();
        assert_eq!(parser.parse("42").unwrap(), JsonValue::Number(42.0));
        assert_eq!(parser.parse("-100").unwrap(), JsonValue::Number(-100.0));
        assert_eq!(parser.parse("0").unwrap(), JsonValue::Number(0.0));
    }

    #[test]
    fn test_large_numeric_literals_match_serde_f64() {
        let parser = json_parser();
        let cases = [
            "9007199254740991",
            "9007199254740992",
            "12345678901234567890",
            "-9223372036854775808",
            "18446744073709551615",
        ];

        for input in cases {
            let ours = parser.parse(input).unwrap();
            let theirs: serde_json::Value = serde_json::from_str(input).unwrap();
            let serde_num = theirs.as_f64().expect("number should convert to f64");
            match ours {
                JsonValue::Number(n) => assert_eq!(n, serde_num, "Mismatch for {input}"),
                other => panic!("Expected number for {input}, got {:?}", other),
            }
        }
    }

    // ── Structural comparison helpers ───────────────────────────────

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
                // Combinator path returns raw spans — skip string content comparison
            }
            (JsonValue::Array(a), serde_json::Value::Array(b)) => {
                assert_eq!(a.len(), b.len(), "Array length mismatch");
                for (ai, bi) in a.iter().zip(b.iter()) {
                    compare_structure(ai, bi);
                }
            }
            (JsonValue::Object(a), serde_json::Value::Object(b)) => {
                assert_eq!(a.len(), b.len(), "Object key count mismatch");
                for (key, val) in a.iter() {
                    let serde_val = b.get(key.as_ref()).unwrap_or_else(|| {
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

    // ── Combinator equivalence tests with serde_json ──────────────

    fn test_equivalence_for_file(filename: &str) {
        let path = format!("../../data/json/{}", filename);
        let data =
            fs::read_to_string(&path).unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));

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

    // ── RFC 8259 leading-zero rejection ──────────────────────────────

    #[test]
    fn test_leading_zero_rejected() {
        // RFC 8259: "007" should parse as just "0", not "007"
        let parser = json_parser();
        let mut state = parse_that::state::ParserState::new("007");
        let result = parser.call(&mut state);
        assert!(result.is_some());
        match result.unwrap() {
            JsonValue::Number(n) => {
                assert_eq!(n, 0.0);
                assert_eq!(state.offset, 1); // consumed only "0"
            }
            other => panic!("expected Number, got {:?}", other),
        }
    }

    #[test]
    fn test_leading_zero_standalone() {
        // "0" alone is valid
        let parser = json_parser();
        let mut state = parse_that::state::ParserState::new("0");
        let result = parser.call(&mut state);
        assert!(result.is_some());
        match result.unwrap() {
            JsonValue::Number(n) => assert_eq!(n, 0.0),
            other => panic!("expected Number, got {:?}", other),
        }
    }

    #[test]
    fn test_leading_zero_decimal() {
        // "0.5" is valid (leading zero followed by decimal)
        let parser = json_parser();
        let mut state = parse_that::state::ParserState::new("0.5");
        let result = parser.call(&mut state);
        assert!(result.is_some());
        match result.unwrap() {
            JsonValue::Number(n) => {
                assert_eq!(n, 0.5);
                assert_eq!(state.offset, 3); // consumed all "0.5"
            }
            other => panic!("expected Number, got {:?}", other),
        }
    }
}
