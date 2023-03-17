use crate::parse::{
    escaped_span, lazy, regex, regex_span, string, string_span, take_while_span, Parser,
    ParserSpan, Span,
};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub enum Comment<'a> {
    Line(&'a str),
    Block(&'a str),
}

#[derive(Debug, Clone)]
pub struct Comments<'a> {
    pub left: Comment<'a>,
    pub right: Comment<'a>,
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

    Epsilon(Token<'a, ()>),
    OptionalWhitespace,
}

#[derive(Debug, Clone)]
pub struct Token<'a, T> {
    pub value: T,
    pub span: Span<'a>,
    // pub comments: Option<Comments<'a>>,
}

#[derive(Debug, Clone)]
pub struct ProductionRule<'a> {
    name: Expression<'a>,
    expression: Expression<'a>,
}

pub type AST<'a> = HashMap<&'a str, ProductionRule<'a>>;

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

    fn line_comment() -> Parser<'a, Comment<'a>> {
        let not_newline = take_while_span(|c| c != '\n');
        let end = string_span("\r").opt_span().then_span(string_span("\n"));

        return not_newline
            .wrap_span(string_span("//"), end)
            .map(|s| Comment::Line(s.as_str()));
    }

    fn identifier() -> Parser<'a, Span<'a>> {
        regex_span(r#"[_a-zA-Z][_a-zA-Z0-9-]*"#).debug("identifier")
    }

    fn literal() -> Parser<'a, Expression<'a>> {
        let not_quote = take_while_span(|c| c != '"' && c != '\\');

        let string = (not_quote | escaped_span())
            .many_span(..)
            .wrap_span(string_span("\""), string_span("\""));

        return string.map(|s| {
            let token = Token {
                value: s.as_str(),
                span: s,
            };
            Expression::Literal(token)
        });
    }

    fn epsilon() -> Parser<'a, Expression<'a>> {
        string_span("epsilon").map(|s| {
            let token = Token { value: (), span: s };
            Expression::Epsilon(token)
        })
    }

    fn nonterminal() -> Parser<'a, Expression<'a>> {
        Self::identifier().map(|s| {
            let token = Token {
                value: s.as_str(),
                span: s,
            };
            Expression::Nonterminal(token)
        })
    }

    fn regex() -> Parser<'a, Expression<'a>> {
        let not_quote = take_while_span(|c| c != '"' && c != '\\');

        let string = (not_quote | escaped_span())
            .many_span(..)
            .wrap_span(string_span("\""), string_span("\""));

        string.map(|s| {
            let token = Token {
                value: regex::Regex::new(s.as_str()).unwrap(),
                span: s,
            };
            Expression::Regex(token)
        })
    }

    fn group() -> Parser<'a, Expression<'a>> {
        lazy(|| {
            Self::rhs()
                .trim_whitespace()
                .wrap(string("("), string(")"))
                .map_with_state(|expr, prev_offset, state| {
                    let token = Token {
                        value: expr,
                        span: Span::new(prev_offset, state.offset, state.src),
                    };
                    Expression::Group(Box::new(token))
                })
        })
    }

    fn optional_group() -> Parser<'a, Expression<'a>> {
        lazy(|| {
            Self::rhs()
                .trim_whitespace()
                .wrap(string("["), string("]"))
                .map_with_state(|expr, prev_offset, state| {
                    let token = Token {
                        value: expr,
                        span: Span::new(prev_offset, state.offset, state.src),
                    };
                    Expression::Optional(Box::new(token))
                })
        })
    }

    fn many_group() -> Parser<'a, Expression<'a>> {
        lazy(|| {
            Self::rhs()
                .trim_whitespace()
                .wrap(string("{"), string("}"))
                .map_with_state(|expr, prev_offset, state| {
                    let token = Token {
                        value: expr,
                        span: Span::new(prev_offset, state.offset, state.src),
                    };
                    Expression::Many(Box::new(token))
                })
        })
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
        let delim = string_span(",").trim_whitespace();

        Self::term()
            .sep_by(delim, ..)
            .map_with_state(|exprs, prev_offset, state| {
                if exprs.len() == 1 {
                    exprs.into_iter().next().unwrap()
                } else {
                    let token = Token {
                        value: exprs,
                        span: Span::new(prev_offset, state.offset, state.src),
                    };

                    Expression::Concatenation(Box::new(token))
                }
            })
            .debug("concatenation")
    }

    fn alternation() -> Parser<'a, Expression<'a>> {
        let delim = string_span("|").trim_whitespace();

        Self::concatenation()
            .sep_by(delim, ..)
            .map_with_state(|exprs, prev_offset, state| {
                if exprs.len() == 1 {
                    exprs.into_iter().next().unwrap()
                } else {
                    let token = Token {
                        value: exprs,
                        span: Span::new(prev_offset, state.offset, state.src),
                    };
                    Expression::Alteration(Box::new(token))
                }
            })
            .debug("alternation")
    }

    fn lhs() -> Parser<'a, Expression<'a>> {
        Self::nonterminal()
    }

    fn rhs() -> Parser<'a, Expression<'a>> {
        Self::alternation().debug("rhs")
    }

    fn production_rule() -> Parser<'a, ProductionRule<'a>> {
        let eq = string("=").trim_whitespace();
        let terminator = (string(";") | string("."))
            .debug("terminator")
            .trim_whitespace();

        Self::lhs()
            .skip(eq)
            .with(Self::rhs())
            .skip(terminator)
            .map(|(lhs, rhs)| ProductionRule {
                name: lhs,
                expression: rhs,
            })
    }

    pub fn grammar() -> Parser<'a, AST<'a>> {
        let comment = || Self::block_comment() | Self::line_comment();
        let rule = Self::production_rule();

        // let grammar = comment().opt().with(rule).with(comment().opt()).many(..);
        let grammar = rule.many(1..);
        
        return grammar
            .map(|rules| {
                rules
                    .into_iter()
                    .map(|rule| {
                        let Expression::Nonterminal(Token { value, span: _ }) = rule.name else {
                            unreachable!();
                        };
                        (value, rule)
                    })
                    .collect()
            })
            .debug("grammar");
    }
}
