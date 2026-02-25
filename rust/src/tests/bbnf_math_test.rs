use bbnf_derive::Parser;
use parse_that::parse::*;

/// Math grammar — exercises: concatenation, alternation, many (via {}),
/// regex, grouping, recursive nonterminals.
#[derive(Parser)]
#[parser(path = "../../grammar/math.bbnf", ignore_whitespace)]
pub struct Math;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_simple_number() {
        let result = Math::factor().parse("42").expect("parse failed");
        match &result {
            MathEnum::factor(inner) => match inner.as_ref() {
                MathEnum::number(span) => {
                    assert_eq!(span.as_str(), "42");
                }
                other => panic!("expected number, got {other:?}"),
            },
            other => panic!("expected factor, got {other:?}"),
        }
    }

    #[test]
    fn parse_decimal_number() {
        let result = Math::number().parse("3.14").expect("parse failed");
        match &result {
            MathEnum::number(span) => {
                assert_eq!(span.as_str(), "3.14");
            }
            other => panic!("expected number, got {other:?}"),
        }
    }

    #[test]
    fn parse_simple_addition() {
        Math::expr()
            .parse("1 + 2")
            .expect("failed to parse simple addition");
    }

    #[test]
    fn parse_simple_multiplication() {
        Math::term()
            .parse("3 * 4")
            .expect("failed to parse simple multiplication");
    }

    #[test]
    fn parse_expression_with_precedence() {
        Math::expr()
            .parse("1 + 2 * 3")
            .expect("failed to parse expression with precedence");
    }

    #[test]
    fn parse_parenthesized_expression() {
        Math::expr()
            .parse("( 1 + 2 ) * 3")
            .expect("failed to parse parenthesized expression");
    }

    #[test]
    fn parse_deeply_nested_parens() {
        Math::expr()
            .parse("( ( ( 1 ) ) )")
            .expect("failed to parse deeply nested parens");
    }

    #[test]
    fn parse_multi_term_expression() {
        Math::expr()
            .parse("1 + 2 - 3 + 4")
            .expect("failed to parse multi-term expression");
    }

    #[test]
    fn parse_mixed_operations() {
        Math::expr()
            .parse("1 + 2 * 3 - 4 / 2")
            .expect("failed to parse mixed operations");
    }

    #[test]
    fn reject_empty_input() {
        let result = Math::expr().parse("");
        assert!(result.is_none(), "should reject empty input");
    }

    #[test]
    fn parse_scientific_notation() {
        Math::expr()
            .parse("1.5e10 + 2")
            .expect("failed to parse scientific notation expression");
    }
}
