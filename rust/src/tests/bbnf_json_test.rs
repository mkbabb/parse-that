use bbnf_derive::Parser;
use parse_that::parse::*;

/// JSON grammar — exercises: literals, regex, alternation, concatenation,
/// optional, many, skip, next, wrapping, recursive nonterminals.
#[derive(Parser)]
#[parser(path = "../../grammar/json.bbnf")]
pub struct Json;

#[cfg(test)]
mod tests {
    use super::*;

    // ── Null ────────────────────────────────────────────────────────────

    #[test]
    fn parse_null() {
        let result = Json::value().parse("null").expect("parse failed");
        match result.as_ref() {
            JsonEnum::null(span) => {
                assert_eq!(span.as_str(), "null");
            }
            other => panic!("expected null, got {other:?}"),
        }
    }

    // ── Booleans ────────────────────────────────────────────────────────

    #[test]
    fn parse_true() {
        let result = Json::value().parse("true").expect("parse failed");
        match result.as_ref() {
            JsonEnum::bool(span) => {
                assert_eq!(span.as_str(), "true");
            }
            other => panic!("expected bool(true), got {other:?}"),
        }
    }

    #[test]
    fn parse_false() {
        let result = Json::value().parse("false").expect("parse failed");
        match result.as_ref() {
            JsonEnum::bool(span) => {
                assert_eq!(span.as_str(), "false");
            }
            other => panic!("expected bool(false), got {other:?}"),
        }
    }

    // ── Numbers ─────────────────────────────────────────────────────────

    #[test]
    fn parse_integer() {
        let result = Json::value().parse("42").expect("parse failed");
        match result.as_ref() {
            JsonEnum::number(span) => {
                assert_eq!(span.as_str(), "42");
            }
            other => panic!("expected number, got {other:?}"),
        }
    }

    #[test]
    fn parse_negative_number() {
        let result = Json::value().parse("-3.14").expect("parse failed");
        match result.as_ref() {
            JsonEnum::number(span) => {
                assert_eq!(span.as_str(), "-3.14");
            }
            other => panic!("expected number, got {other:?}"),
        }
    }

    #[test]
    fn parse_scientific_notation() {
        let result = Json::value().parse("1.5e10").expect("parse failed");
        match result.as_ref() {
            JsonEnum::number(span) => {
                assert_eq!(span.as_str(), "1.5e10");
            }
            other => panic!("expected number, got {other:?}"),
        }
    }

    // ── Strings ─────────────────────────────────────────────────────────

    #[test]
    fn parse_empty_string() {
        let result = Json::value().parse(r#""""#).expect("parse failed");
        match result.as_ref() {
            JsonEnum::string(span) => {
                // The json.bbnf string regex captures surrounding quotes
                assert_eq!(span.as_str(), r#""""#);
            }
            other => panic!("expected string, got {other:?}"),
        }
    }

    #[test]
    fn parse_string_with_content() {
        let result = Json::value().parse(r#""hello""#).expect("parse failed");
        match result.as_ref() {
            JsonEnum::string(span) => {
                // The json.bbnf string regex captures surrounding quotes
                assert_eq!(span.as_str(), r#""hello""#);
            }
            other => panic!("expected string, got {other:?}"),
        }
    }

    // ── Arrays ──────────────────────────────────────────────────────────

    #[test]
    fn parse_empty_array() {
        let result = Json::value().parse("[]").expect("parse failed");
        match result.as_ref() {
            JsonEnum::array(items) => {
                assert_eq!(items.len(), 0);
            }
            other => panic!("expected array, got {other:?}"),
        }
    }

    #[test]
    fn parse_array_of_numbers() {
        let result = Json::value().parse("[1, 2, 3]").expect("parse failed");
        match result.as_ref() {
            JsonEnum::array(items) => {
                assert_eq!(items.len(), 3);
                for (i, item) in items.iter().enumerate() {
                    match item.as_ref() {
                        JsonEnum::number(span) => {
                            assert_eq!(span.as_str(), &(i + 1).to_string());
                        }
                        other => panic!("expected number at index {i}, got {other:?}"),
                    }
                }
            }
            other => panic!("expected array, got {other:?}"),
        }
    }

    #[test]
    fn parse_nested_array() {
        let result = Json::value().parse("[[1, 2], [3]]").expect("parse failed");
        match result.as_ref() {
            JsonEnum::array(items) => {
                assert_eq!(items.len(), 2);
                match items[0].as_ref() {
                    JsonEnum::array(arr) => assert_eq!(arr.len(), 2),
                    other => panic!("expected inner array, got {other:?}"),
                }
                match items[1].as_ref() {
                    JsonEnum::array(arr) => assert_eq!(arr.len(), 1),
                    other => panic!("expected inner array, got {other:?}"),
                }
            }
            other => panic!("expected array, got {other:?}"),
        }
    }

    // ── Objects ──────────────────────────────────────────────────────────

    #[test]
    fn parse_empty_object() {
        let result = Json::value().parse("{}").expect("parse failed");
        match result.as_ref() {
            JsonEnum::object(pairs) => {
                assert_eq!(pairs.len(), 0);
            }
            other => panic!("expected object, got {other:?}"),
        }
    }

    #[test]
    fn parse_simple_object() {
        let result = Json::value()
            .parse(r#"{"a": 1, "b": 2}"#)
            .expect("parse failed");
        match result.as_ref() {
            JsonEnum::object(pairs) => {
                assert_eq!(pairs.len(), 2);

                match pairs[0].as_ref() {
                    JsonEnum::pair((key_span, val)) => {
                        // Phase E: key is Span directly (string is span-eligible)
                        assert_eq!(key_span.as_str(), r#""a""#);
                        match val.as_ref() {
                            JsonEnum::number(n) => {
                                assert_eq!(n.as_str(), "1");
                            }
                            other => panic!("expected number value, got {other:?}"),
                        }
                    }
                    other => panic!("expected pair, got {other:?}"),
                }
            }
            other => panic!("expected object, got {other:?}"),
        }
    }

    #[test]
    fn parse_nested_object() {
        let input = r#"{"outer": {"inner": true}}"#;
        let result = Json::value().parse(input).expect("parse failed");
        match result.as_ref() {
            JsonEnum::object(pairs) => {
                assert_eq!(pairs.len(), 1);
                match pairs[0].as_ref() {
                    // Phase E: key is Span directly (string is span-eligible)
                    JsonEnum::pair((_key_span, val)) => match val.as_ref() {
                        JsonEnum::object(inner_pairs) => {
                            assert_eq!(inner_pairs.len(), 1);
                            match inner_pairs[0].as_ref() {
                                JsonEnum::pair((inner_key_span, inner_val)) => {
                                    assert_eq!(inner_key_span.as_str(), r#""inner""#);
                                    match inner_val.as_ref() {
                                        JsonEnum::bool(b) => {
                                            assert_eq!(b.as_str(), "true");
                                        }
                                        other => panic!(
                                            "expected bool value, got {other:?}"
                                        ),
                                    }
                                }
                                other => panic!("expected pair, got {other:?}"),
                            }
                        }
                        other => panic!("expected inner object, got {other:?}"),
                    },
                    other => panic!("expected pair, got {other:?}"),
                }
            }
            other => panic!("expected object, got {other:?}"),
        }
    }

    // ── Mixed / complex ─────────────────────────────────────────────────

    #[test]
    fn parse_mixed_array() {
        let input = r#"[1, "two", true, null]"#;
        let result = Json::value().parse(input).expect("parse failed");
        match result.as_ref() {
            JsonEnum::array(items) => {
                assert_eq!(items.len(), 4);

                match items[0].as_ref() {
                    JsonEnum::number(n) => assert_eq!(n.as_str(), "1"),
                    other => panic!("expected number, got {other:?}"),
                }
                match items[1].as_ref() {
                    JsonEnum::string(s) => assert_eq!(s.as_str(), r#""two""#),
                    other => panic!("expected string, got {other:?}"),
                }
                match items[2].as_ref() {
                    JsonEnum::bool(b) => assert_eq!(b.as_str(), "true"),
                    other => panic!("expected bool, got {other:?}"),
                }
                match items[3].as_ref() {
                    JsonEnum::null(n) => assert_eq!(n.as_str(), "null"),
                    other => panic!("expected null, got {other:?}"),
                }
            }
            other => panic!("expected array, got {other:?}"),
        }
    }

    // ── Failure cases ───────────────────────────────────────────────────

    #[test]
    fn reject_invalid_json() {
        let result = Json::value().parse("{invalid}");
        assert!(result.is_none(), "should reject invalid JSON");
    }

    #[test]
    fn parse_trailing_comma_in_object() {
        // The grammar allows optional trailing comma after each pair
        let result = Json::value().parse(r#"{"a": 1,}"#);
        assert!(result.is_some(), "grammar allows trailing comma");
    }

    // ── File-based tests ────────────────────────────────────────────────

    #[test]
    fn parse_json_file() {
        let json_file = "../../data/json/data.json";
        if let Ok(json_string) = std::fs::read_to_string(json_file) {
            Json::value()
                .parse(&json_string)
                .expect("failed to parse data.json");
        }
        // Skip if file doesn't exist (CI environments)
    }
}
