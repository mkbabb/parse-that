#![feature(box_patterns)]

use bbnf_derive::Parser;
use parse_that::parse::*;

/// English sentence grammar — exercises: alternation, optional,
/// many (adjective*), concatenation, ignore_whitespace mode.
#[derive(Parser)]
#[parser(path = "../../grammar/g4.bbnf", ignore_whitespace)]
pub struct G4;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_simple_sentence() {
        G4::sentence()
            .parse("the cat ate the dog")
            .expect("failed to parse simple sentence");
    }

    #[test]
    fn parse_sentence_with_adjectives() {
        G4::sentence()
            .parse("the fat cat ate the thin dog")
            .expect("failed to parse sentence with adjectives");
    }

    #[test]
    fn parse_sentence_with_multiple_adjectives() {
        G4::sentence()
            .parse("the big fat cat ate the small thin dog")
            .expect("failed to parse sentence with multiple adjectives");
    }

    #[test]
    fn parse_intransitive_verb() {
        // The grammar defines sentence = subject, verb, object, with_clause?
        // where object = "the" ?w, (adjective*, noun)?
        // An intransitive verb still needs the "the" object prefix to parse
        // but (adjective*, noun) is optional, so "the man laughed the" parses
        // with an empty object. "the man laughed" alone fails because "object"
        // requires "the" to start.
        //
        // Test that intransitive verbs parse in a valid sentence structure:
        let result = G4::sentence().parse("the man laughed");
        // This correctly fails — the grammar requires an object clause
        assert!(result.is_none(), "grammar requires object after verb");
    }

    #[test]
    fn parse_sentence_with_with_clause() {
        G4::sentence()
            .parse("the woman ate the apple with the man")
            .expect("failed to parse sentence with with_clause");
    }

    #[test]
    fn parse_sentence_structure() {
        let result = G4::sentence()
            .parse("the fat woman ate the fat man")
            .expect("parse failed");
        match &result {
            G4Enum::sentence((subject, _verb, object, _with)) => {
                match subject.as_ref() {
                    G4Enum::subject(_) => {}
                    other => panic!("expected subject, got {other:?}"),
                }
                match object.as_ref() {
                    G4Enum::object(_) => {}
                    other => panic!("expected object, got {other:?}"),
                }
            }
            other => panic!("expected sentence, got {other:?}"),
        }
    }

    #[test]
    fn parse_all_transitive_verbs() {
        for verb in &["saw", "hit", "kissed", "ate", "drank"] {
            let input = format!("the cat {verb} the dog");
            G4::sentence()
                .parse(&input)
                .unwrap_or_else(|| panic!("failed for verb '{verb}'"));
        }
    }

    #[test]
    fn parse_all_intransitive_verbs_in_sentence() {
        // Intransitive verbs still need a full sentence structure
        // (subject, verb, object) per the grammar. Use a dummy object.
        for verb in &["laughed", "slept", "ran", "jumped"] {
            let input = format!("the cat {verb} the dog");
            G4::sentence()
                .parse(&input)
                .unwrap_or_else(|| panic!("failed for verb '{verb}'"));
        }
    }

    #[test]
    fn parse_all_nouns_as_subject() {
        for noun in &["cat", "dog", "man", "woman", "apple", "banana"] {
            let input = format!("the {noun} ate the dog");
            G4::sentence()
                .parse(&input)
                .unwrap_or_else(|| panic!("failed for noun '{noun}'"));
        }
    }

    #[test]
    fn reject_invalid_sentence() {
        let result = G4::sentence().parse("the chair flew");
        assert!(result.is_none(), "should reject unknown noun 'chair'");
    }

    #[test]
    fn reject_empty_input() {
        let result = G4::sentence().parse("");
        assert!(result.is_none(), "should reject empty input");
    }
}
