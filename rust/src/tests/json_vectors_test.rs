/// Shared JSON test vectors — reads from grammar/tests/json/*.jsonl
/// and verifies both BBNF-derived and handwritten parsers agree.
use bbnf_derive::Parser;
use parse_that::parse::*;

#[derive(Parser)]
#[parser(path = "../../grammar/json.bbnf")]
pub struct JsonVec;

#[cfg(test)]
mod tests {
    use super::*;
    use parse_that::parsers::json::json_value;
    use std::fs;
    use std::path::Path;

    fn read_vectors(filename: &str) -> Vec<String> {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../grammar/tests/json")
            .join(filename);
        let content = fs::read_to_string(&path)
            .unwrap_or_else(|_| panic!("Could not read {}", path.display()));
        content
            .lines()
            .filter(|line| !line.trim().is_empty())
            .map(|s| s.to_string())
            .collect()
    }

    #[test]
    fn bbnf_parses_valid_vectors() {
        let vectors = read_vectors("valid.jsonl");
        for (i, input) in vectors.iter().enumerate() {
            let result = JsonVec::value().parse(input);
            assert!(
                result.is_some(),
                "BBNF failed to parse valid vector #{}: {:?}",
                i + 1,
                input
            );
        }
    }

    #[test]
    fn handwritten_parses_valid_vectors() {
        let vectors = read_vectors("valid.jsonl");
        for (i, input) in vectors.iter().enumerate() {
            let result = json_value().parse(input);
            assert!(
                result.is_some(),
                "Handwritten parser failed to parse valid vector #{}: {:?}",
                i + 1,
                input
            );
        }
    }

    #[test]
    fn bbnf_rejects_invalid_vectors() {
        let vectors = read_vectors("invalid.jsonl");
        for (i, input) in vectors.iter().enumerate() {
            let result = JsonVec::value().parse(input);
            assert!(
                result.is_none(),
                "BBNF should reject invalid vector #{}: {:?}",
                i + 1,
                input
            );
        }
    }

    #[test]
    fn handwritten_rejects_invalid_vectors() {
        let vectors = read_vectors("invalid.jsonl");
        for (i, input) in vectors.iter().enumerate() {
            let result = json_value().parse(input);
            assert!(
                result.is_none(),
                "Handwritten parser should reject invalid vector #{}: {:?}",
                i + 1,
                input
            );
        }
    }
}
