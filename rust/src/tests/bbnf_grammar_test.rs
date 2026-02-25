use bbnf::BBNFGrammar;

/// Tests for the BBNF grammar parser itself — verifying that .bbnf files
/// are correctly parsed into ASTs with the expected nonterminals.
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_json_grammar() {
        let grammar = include_str!("../../../grammar/json.bbnf");
        let ast = BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse json.bbnf");

        // json.bbnf defines: null, bool, number, comma, colon, chargerge,
        // charger, charge, char, stringge, string, array, pair, object, value
        assert!(ast.len() >= 10, "expected >= 10 rules, got {}", ast.len());
    }

    #[test]
    fn parse_g4_grammar() {
        let grammar = include_str!("../../../grammar/g4.bbnf");
        let ast = BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse g4.bbnf");

        // g4.bbnf defines: sentence, subject, object, verb,
        // transitive_verb, intransitive_verb, noun, adjective, with_clause
        assert!(ast.len() >= 8, "expected >= 8 rules, got {}", ast.len());
    }

    #[test]
    fn parse_css_keyframes_grammar() {
        let grammar = include_str!("../../../grammar/css-keyframes.bbnf");
        let ast = BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse css-keyframes.bbnf");

        // css-keyframes.bbnf defines many rules (COMMA, VENDOR_PREFIX, IDENT, etc.)
        assert!(ast.len() >= 15, "expected >= 15 rules, got {}", ast.len());
    }

    #[test]
    fn parse_math_grammar() {
        let grammar = include_str!("../../../grammar/math.bbnf");
        BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse math.bbnf");
    }

    #[test]
    fn parse_css_color_grammar() {
        let grammar = include_str!("../../../grammar/css-color.bbnf");
        BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse css-color.bbnf");
    }

    #[test]
    fn parse_css_value_unit_grammar() {
        let grammar = include_str!("../../../grammar/css-value-unit.bbnf");
        BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse css-value-unit.bbnf");
    }

    #[test]
    fn parse_ebnf_grammar() {
        let grammar = include_str!("../../../grammar/ebnf.bbnf");
        BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse ebnf.bbnf");
    }

    #[test]
    fn parse_bbnf_self_grammar() {
        let grammar = include_str!("../../../grammar/bbnf.bbnf");
        BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse bbnf.bbnf (self-grammar)");
    }

    #[test]
    fn parse_emoji_grammar() {
        let grammar = include_str!("../../../grammar/emoji.bbnf");
        BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse emoji.bbnf");
    }

    #[test]
    fn parse_regex_grammar() {
        let grammar = include_str!("../../../grammar/regex.bbnf");
        BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse regex.bbnf");
    }

    #[test]
    fn parse_ss_grammar() {
        let grammar = include_str!("../../../grammar/sS.bbnf");
        BBNFGrammar::grammar()
            .parse(grammar)
            .expect("failed to parse sS.bbnf");
    }

    #[test]
    fn reject_empty_grammar() {
        // Empty string should parse as an empty grammar (0 rules), not fail
        let result = BBNFGrammar::grammar().parse("");
        assert!(
            result.is_some(),
            "empty input produces an empty grammar"
        );
        let ast = result.unwrap();
        assert_eq!(ast.len(), 0, "empty grammar has 0 rules");
    }

    #[test]
    fn invalid_input_produces_no_rules() {
        // The grammar parser is lenient — it may parse partial input.
        // Invalid syntax should either fail or produce fewer rules than expected.
        let result = BBNFGrammar::grammar().parse("@@@ not valid {{{");
        match result {
            None => {} // parser rejected it — fine
            Some(ast) => {
                // parser accepted but shouldn't have found real rules
                assert_eq!(ast.len(), 0, "invalid input should produce 0 rules");
            }
        }
    }

    #[test]
    fn parse_minimal_rule() {
        let ast = BBNFGrammar::grammar()
            .parse(r#"foo = "bar" ;"#)
            .expect("failed to parse minimal rule");
        assert_eq!(ast.len(), 1, "expected 1 rule, got {}", ast.len());
    }

    #[test]
    fn parse_alternation_rule() {
        BBNFGrammar::grammar()
            .parse(r#"choice = "a" | "b" | "c" ;"#)
            .expect("failed to parse alternation rule");
    }

    #[test]
    fn parse_regex_rule() {
        BBNFGrammar::grammar()
            .parse(r#"number = /[0-9]+/ ;"#)
            .expect("failed to parse regex rule");
    }

    #[test]
    fn parse_optional_rule() {
        BBNFGrammar::grammar()
            .parse(r#"maybe = "x" ? ;"#)
            .expect("failed to parse optional rule");
    }

    #[test]
    fn parse_many_rule() {
        BBNFGrammar::grammar()
            .parse(r#"items = "x" * ;"#)
            .expect("failed to parse many rule");
    }

    #[test]
    fn parse_many1_rule() {
        BBNFGrammar::grammar()
            .parse(r#"items = "x" + ;"#)
            .expect("failed to parse many1 rule");
    }

    #[test]
    fn parse_skip_next_operators() {
        BBNFGrammar::grammar()
            .parse(r#"wrapped = "(" >> "content" << ")" ;"#)
            .expect("failed to parse skip/next");
    }

    #[test]
    fn parse_concatenation() {
        BBNFGrammar::grammar()
            .parse(r#"pair = "key" , "value" ;"#)
            .expect("failed to parse concatenation");
    }

    #[test]
    fn parse_optional_whitespace() {
        BBNFGrammar::grammar()
            .parse(r#"spaced = "a" ?w ;"#)
            .expect("failed to parse optional whitespace");
    }

    #[test]
    fn parse_nonterminal_reference() {
        let ast = BBNFGrammar::grammar()
            .parse(
                r#"
                bar = "x" ;
                foo = bar ;
            "#,
            )
            .expect("failed to parse nonterminal reference");
        assert_eq!(ast.len(), 2, "expected 2 rules, got {}", ast.len());
    }

    #[test]
    fn parse_multiple_rules() {
        let ast = BBNFGrammar::grammar()
            .parse(
                r#"
                a = "1" ;
                b = "2" ;
                c = a | b ;
            "#,
            )
            .expect("failed to parse multiple rules");
        assert_eq!(ast.len(), 3, "expected 3 rules, got {}", ast.len());
    }
}
