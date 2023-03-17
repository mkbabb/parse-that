use crate::parse::{
    escaped_span, lazy, regex, string, string_span, take_while_span, Parser, ParserSpan, Span,
};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub enum Comment<'a> {
    Line(&'a str),
    Block(&'a str),
}

#[derive(Debug, Clone)]
pub struct Comments<'a> {
    pub left: Vec<Comment<'a>>,
    pub right: Vec<Comment<'a>>,
}

impl<'a> Default for Comments<'a> {
    fn default() -> Self {
        Comments {
            left: vec![],
            right: vec![],
        }
    }
}

type TokenExpression<'a, T = Expression<'a>> = Box<Token<'a, T>>;

#[derive(Debug, Clone)]
pub enum Expression<'a> {
    Literal(Token<'a, &'a str>),
    Nonterminal(Token<'a, &'a str>),
    Group(TokenExpression<'a>),
    Regex(Token<'a, regex::Regex>),
    Optional(TokenExpression<'a>),
    Minus(TokenExpression<'a>),
    Many(TokenExpression<'a>),
    Many1(TokenExpression<'a>),
    Skip(TokenExpression<'a>, TokenExpression<'a>),
    Next(TokenExpression<'a>, TokenExpression<'a>),
    Concatenation(TokenExpression<'a, Vec<Expression<'a>>>),
    Alteration(TokenExpression<'a, Vec<Expression<'a>>>),

    Epsilon,
    OptionalWhitespace,
}

#[derive(Debug, Clone)]
pub struct Token<'a, T> {
    pub value: T,
    pub span: Span<'a>,
    // pub comments: Comments<'a>,
}

#[derive(Debug, Clone)]
pub struct ProductionRule<'a> {
    name: Expression<'a>,
    expression: Expression<'a>,
}

pub type AST<'a> = HashMap<String, ProductionRule<'a>>;

pub struct BBNFGrammar<'a> {
    _marker: std::marker::PhantomData<&'a ()>,
}

impl<'a> BBNFGrammar<'a> {
    fn block_comment() -> Parser<'a, Comment<'a>> {
        let not_star = take_while_span(|c| c != '*');
        let not_slash = take_while_span(|c| c != '/');

        let comment = (not_star | not_slash).many_span(..);

        return comment
            .wrap_span(string_span("/*"), string_span("*/"))
            .map(|s| Comment::Block(s.as_str()));
    }

    fn identifier() -> Parser<'a, &'a str> {
        regex(r#"[_a-zA-Z][_a-zA-Z0-9-]*"#)
    }

    fn literal() -> Parser<'a, Expression<'a>> {
        let not_quote = take_while_span(|c| c != '"' && c != '\\');

        let string = (not_quote | escaped_span())
            .many_span(..)
            .wrap_span(string_span("\""), string_span("\""));

        return string.map(|s| Expression::Literal(s.as_str()));
    }

    fn epsilon() -> Parser<'a, Expression<'a>> {
        string("epsilon").map(|_| Expression::Epsilon)
    }

    fn nonterminal() -> Parser<'a, Expression<'a>> {
        Self::identifier().map(Expression::Nonterminal)
    }

    fn regex() -> Parser<'a, Expression<'a>> {
        let not_quote = take_while_span(|c| c != '"' && c != '\\');

        let string = (not_quote | escaped_span())
            .many_span(..)
            .wrap_span(string_span("\""), string_span("\""));

        return string.map(|s| Expression::Regex(regex::Regex::new(s.as_str()).unwrap()));
    }

    fn group() -> Parser<'a, Expression<'a>> {
        Self::rhs()
            .trim_whitespace()
            .wrap(string("("), string(")"))
            .map(|expr| Expression::Group(Box::new(expr)))
    }

    fn optional_group() -> Parser<'a, Expression<'a>> {
        Self::rhs()
            .trim_whitespace()
            .wrap(string("["), string("]"))
            .map(|expr| Expression::Optional(Box::new(Expression::Group(Box::new(expr)))))
    }

    fn many_group() -> Parser<'a, Expression<'a>> {
        Self::rhs()
            .trim_whitespace()
            .wrap(string("{"), string("}"))
            .map(|expr| Expression::Many(Box::new(Expression::Group(Box::new(expr)))))
    }

    fn term() -> Parser<'a, Expression<'a>> {
        Self::epsilon()
            | Self::group()
            | Self::optional_group()
            | Self::many_group()
            | Self::nonterminal()
            | Self::literal()
            | Self::regex()
    }

    fn concatenation() -> Parser<'a, Expression<'a>> {
        Self::term().sep_by(string(" "), ..).map(|exprs| {
            if exprs.len() == 1 {
                exprs.into_iter().next().unwrap()
            } else {
                Expression::Concatenation(exprs)
            }
        })
    }

    fn alternation() -> Parser<'a, Expression<'a>> {
        Self::concatenation().sep_by(string("|"), ..).map(|exprs| {
            if exprs.len() == 1 {
                exprs.into_iter().next().unwrap()
            } else {
                Expression::Alteration(exprs)
            }
        })
    }

    fn lhs() -> Parser<'a, Expression<'a>> {
        Self::nonterminal()
    }

    fn rhs() -> Parser<'a, Expression<'a>> {
        Self::alternation()
    }

    fn production_rule() -> Parser<'a, ProductionRule<'a>> {
        let eq = string("=").trim_whitespace();
        let terminator = (string(";") | string(".")).trim_whitespace();

        Self::lhs()
            .skip(eq)
            .with(Self::rhs())
            .skip(terminator)
            .map(|(lhs, rhs)| ProductionRule {
                name: lhs,
                expression: rhs,
                comment: (vec![], vec![]),
            })
    }
}
