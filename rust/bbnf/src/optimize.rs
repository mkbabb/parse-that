//! Left-recursion removal and left-factoring for BBNF grammars.
//!
//! Direct left-recursion elimination follows the standard algorithm:
//! For a rule `A = A α₁ | A α₂ | ... | β₁ | β₂ | ...`
//! Transform to:
//!   `A  = β₁ A' | β₂ A' | ...`
//!   `A' = α₁ A' | α₂ A' | ... | ε`
//!
//! This is opt-in via flag, matching the TypeScript design.

use std::borrow::Cow;

use crate::grammar::{Expression, Token, AST};
/// Remove all direct left-recursion from the grammar.
///
/// For each rule, if any alternative in its alternation starts with a reference
/// to itself, apply the standard left-recursion elimination algorithm.
///
/// This does NOT handle indirect left-recursion (A -> B -> A). For that,
/// the grammar would need to be topologically reordered first (which the
/// SCC analysis already provides).
pub fn remove_direct_left_recursion<'a>(ast: &AST<'a>) -> AST<'a> {
    let mut new_ast = AST::new();

    for (lhs, rhs) in ast {
        let lhs_name = match lhs {
            Expression::Nonterminal(token) => token.value.as_ref(),
            _ => {
                new_ast.insert(lhs.clone(), rhs.clone());
                continue;
            }
        };

        // Unwrap Rule to get the actual expression
        let (inner_expr, mapping_fn) = match rhs {
            Expression::Rule(inner, mapping) => (inner.as_ref(), mapping.clone()),
            other => (other, None),
        };

        // Only process alternations
        let alternatives = match inner_expr {
            Expression::Alternation(token) => &token.value,
            _ => {
                new_ast.insert(lhs.clone(), rhs.clone());
                continue;
            }
        };

        // Partition into left-recursive (alpha) and non-left-recursive (beta) alternatives
        let mut alphas: Vec<Expression<'a>> = Vec::new();
        let mut betas: Vec<Expression<'a>> = Vec::new();

        for alt in alternatives {
            if is_left_recursive(alt, lhs_name) {
                // Strip the leading self-reference
                if let Some(stripped) = strip_leading_nonterminal(alt, lhs_name) {
                    alphas.push(stripped);
                } else {
                    betas.push(alt.clone());
                }
            } else {
                betas.push(alt.clone());
            }
        }

        if alphas.is_empty() {
            // No left-recursion — keep original
            new_ast.insert(lhs.clone(), rhs.clone());
            continue;
        }

        // Create the tail rule name: A' (A_tail)
        let tail_name = format!("{}_tail", lhs_name);

        let tail_nt = Expression::Nonterminal(Token::new_without_span(Cow::Owned(tail_name.clone())));
        let tail_lhs = Expression::Nonterminal(Token::new_without_span(Cow::Owned(tail_name)));

        // A = β₁ A' | β₂ A' | ...
        let new_betas: Vec<Expression<'a>> = betas
            .into_iter()
            .map(|beta| {
                // β A'
                let token = Token::new_without_span(vec![beta, tail_nt.clone()]);
                Expression::Concatenation(Box::new(token))
            })
            .collect();

        let new_rhs = if new_betas.len() == 1 {
            new_betas.into_iter().next().unwrap()
        } else {
            Expression::Alternation(Box::new(Token::new_without_span(new_betas)))
        };

        new_ast.insert(
            lhs.clone(),
            Expression::Rule(Box::new(new_rhs), mapping_fn),
        );

        // A' = α₁ A' | α₂ A' | ... | ε
        let mut tail_alts: Vec<Expression<'a>> = alphas
            .into_iter()
            .map(|alpha| {
                let token = Token::new_without_span(vec![alpha, tail_nt.clone()]);
                Expression::Concatenation(Box::new(token))
            })
            .collect();

        // Add epsilon alternative
        tail_alts.push(Expression::Epsilon(Token::new_without_span(())));

        let tail_rhs = Expression::Alternation(Box::new(Token::new_without_span(tail_alts)));

        new_ast.insert(
            tail_lhs,
            Expression::Rule(Box::new(tail_rhs), None),
        );
    }

    new_ast
}

/// Check if an expression starts with a reference to the given nonterminal name.
fn is_left_recursive(expr: &Expression<'_>, name: &str) -> bool {
    match expr {
        Expression::Nonterminal(token) => token.value.as_ref() == name,
        Expression::Concatenation(token) => {
            if let Some(first) = token.value.first() {
                is_left_recursive(first, name)
            } else {
                false
            }
        }
        Expression::Group(inner) => is_left_recursive(&inner.value, name),
        _ => false,
    }
}

/// Strip the leading nonterminal reference from an expression.
/// For concatenation `[A, x, y]`, returns `Concatenation([x, y])` or just `x` if only one remains.
/// For bare `A`, returns `Epsilon`.
fn strip_leading_nonterminal<'a>(expr: &Expression<'a>, name: &str) -> Option<Expression<'a>> {
    match expr {
        Expression::Nonterminal(token) if token.value.as_ref() == name => {
            Some(Expression::Epsilon(Token::new_without_span(())))
        }
        Expression::Concatenation(token) => {
            let exprs = &token.value;
            if exprs.is_empty() {
                return None;
            }
            if !is_left_recursive(&exprs[0], name) {
                return None;
            }
            let rest: Vec<Expression<'a>> = exprs[1..].to_vec();
            if rest.is_empty() {
                Some(Expression::Epsilon(Token::new_without_span(())))
            } else if rest.len() == 1 {
                Some(rest.into_iter().next().unwrap())
            } else {
                Some(Expression::Concatenation(Box::new(Token::new_without_span(rest))))
            }
        }
        Expression::Group(inner) => strip_leading_nonterminal(&inner.value, name),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::borrow::Cow;
    use parse_that::Span;

    fn nt(name: &str) -> Expression<'_> {
        Expression::Nonterminal(Token::new(Cow::Borrowed(name), Span::new(0, 0, "")))
    }

    fn lit(value: &str) -> Expression<'_> {
        Expression::Literal(Token::new(Cow::Borrowed(value), Span::new(0, 0, "")))
    }

    #[test]
    fn test_no_left_recursion() {
        let mut ast = AST::new();
        let a = nt("A");
        let rhs = Expression::Rule(Box::new(lit("x")), None);
        ast.insert(a.clone(), rhs.clone());

        let result = remove_direct_left_recursion(&ast);
        assert_eq!(result.len(), 1);
        assert!(result.get(&a).is_some());
    }

    #[test]
    fn test_direct_left_recursion() {
        let mut ast = AST::new();
        let a = nt("A");

        // A = A "x" | "y"
        let alt1 = Expression::Concatenation(Box::new(Token::new_without_span(vec![
            nt("A"),
            lit("x"),
        ])));
        let alt2 = lit("y");
        let rhs = Expression::Rule(
            Box::new(Expression::Alternation(Box::new(Token::new_without_span(vec![alt1, alt2])))),
            None,
        );
        ast.insert(a.clone(), rhs);

        let result = remove_direct_left_recursion(&ast);
        // Should have 2 rules: A and A_tail
        assert_eq!(result.len(), 2);

        let tail = nt("A_tail");
        assert!(result.get(&tail).is_some());
    }
}
