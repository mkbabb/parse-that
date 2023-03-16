use parse_that::parse::parsers::json::json_parser;
use parse_that::parse::parsers::json::JsonValue;

#[cfg(test)]
// write 5 unit tests for testing the json parser. Use data from the data/json directory.

mod tests {
    use std::fs;

    use super::*;

    #[test]
    fn test_json() {
        let json = r#"
            {
                "a": 1,
                "b": 2,
                "c": 3
            }
        "#;

        let map = json_parser().parse(json).unwrap();

        match map {
            JsonValue::Object(map) => {
                assert_eq!(map.len(), 3);
                assert_eq!(map.get("a").unwrap(), &JsonValue::Number(1.0));
                assert_eq!(map.get("b").unwrap(), &JsonValue::Number(2.0));
                assert_eq!(map.get("c").unwrap(), &JsonValue::Number(3.0));
            }
            _ => panic!("Expected JsonValue::Object"),
        }
    }

    #[test]
    fn test_json_file() {
        let json_file_path = "../data/json/data-l.json";
        let json_string = fs::read_to_string(json_file_path).unwrap();

        let map = json_parser().parse(&json_string).unwrap();

        match map {
            JsonValue::Object(map) => {
                assert_eq!(map.len(), 4784);
            }
            _ => panic!("Expected JsonValue::Object"),
        }
    }
}
