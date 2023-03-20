use crate::{
    parse::{
        any_span, escaped_span, lazy, string, string_span, take_while_span, Parser, ParserSpan,
        ParserState, Span,
    },
    pretty::Doc,
};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub enum Comment<'a> {
    Line(&'a str),
    Block(&'a str),
}

#[derive(Debug, Clone)]
pub struct Comments<'a> {
    pub left: Option<Comment<'a>>,
    pub right: Option<Comment<'a>>,
}

type TokenExpression<'a, T = Expression<'a>> = Box<Token<'a, T>>;

#[derive(Debug)]
pub enum Expression<'a> {
    Literal(Token<'a, &'a str>),
    Nonterminal(Token<'a, &'a str>),
    Regex(Token<'a, regex::Regex>),

    Group(TokenExpression<'a>),
    Optional(TokenExpression<'a>),
    Many(TokenExpression<'a>),
    Many1(TokenExpression<'a>),

    Skip(TokenExpression<'a>, TokenExpression<'a>),
    Next(TokenExpression<'a>, TokenExpression<'a>),
    Minus(TokenExpression<'a>, TokenExpression<'a>),

    Concatenation(TokenExpression<'a, Vec<Expression<'a>>>),
    Alteration(TokenExpression<'a, Vec<Expression<'a>>>),

    ProductionRule(Box<Expression<'a>>, Box<Expression<'a>>),

    Epsilon(Token<'a, ()>),
    OptionalWhitespace,
}

#[derive(Debug)]
pub struct Token<'a, T> {
    pub value: T,
    pub span: Span<'a>,
    pub comments: Option<Comments<'a>>,
}

impl<'a, T> Token<'a, T> {
    pub fn new(value: T, span: Span<'a>) -> Self {
        Self {
            value,
            span,
            comments: None,
        }
    }
}

pub type AST<'a> = HashMap<&'a str, Expression<'a>>;

pub fn set_expression_comments<'a>(expr: &mut Expression<'a>, comments: Comments<'a>) {
    match expr {
        Expression::Literal(token) | Expression::Nonterminal(token) => {
            token.comments = Some(comments)
        }

        Expression::Regex(token) => token.comments = Some(comments),

        Expression::Epsilon(token) => token.comments = Some(comments),

        Expression::Group(token)
        | Expression::Optional(token)
        | Expression::Many(token)
        | Expression::Many1(token)
        | Expression::Skip(token, _)
        | Expression::Next(token, _)
        | Expression::Minus(token, _) => token.comments = Some(comments),

        Expression::Concatenation(token) | Expression::Alteration(token) => {
            token.comments = Some(comments)
        }

        _ => {}
    }
}

fn map_factor<'a>(
    factor: (Expression<'a>, Option<Span<'a>>),
    prev_offset: usize,
    state: &mut ParserState<'a>,
) -> Expression<'a> {
    match factor {
        (expr, Some(op)) => {
            let token = Token::new(expr, Span::new(prev_offset, state.offset, state.src));
            match op.as_str() {
                "?w" => Expression::OptionalWhitespace,
                "*" => Expression::Many(Box::new(token)),
                "+" => Expression::Many1(Box::new(token)),
                "?" => Expression::Optional(Box::new(token)),
                _ => unreachable!(
                    "unhandled factor: {:?}, {:?}",
                    op.as_str(),
                    token.span.as_str()
                ),
            }
        }
        (expr, _) => expr,
    }
}

fn reduce_binary_expression<'a>(
    expr: (Expression<'a>, Vec<(Span<'a>, Expression<'a>)>),
    prev_offset: usize,
    state: &mut ParserState<'a>,
) -> Expression<'a> {
    let (left, right) = expr;

    if right.is_empty() {
        return left;
    }

    right.into_iter().fold(left, |acc, (op, right)| {
        let acc_token = Token::new(acc, Span::new(prev_offset, state.offset, state.src));
        let right_token = Token::new(right, Span::new(prev_offset, state.offset, state.src));

        match op.as_str() {
            "<<" => Expression::Skip(Box::new(acc_token), Box::new(right_token)),
            ">>" => Expression::Skip(Box::new(right_token), Box::new(acc_token)),
            "-" => Expression::Minus(Box::new(acc_token), Box::new(right_token)),
            _ => unreachable!(),
        }
    })
}

pub struct BBNFGrammar<'a> {
    _marker: std::marker::PhantomData<&'a ()>,
}

impl<'a> BBNFGrammar<'a> {
    fn block_comment() -> Parser<'a, Comment<'a>> {
        let not_comment = take_while_span(|c| c != '*' && c != '/');

        let comment = not_comment.many_span(1..);

        comment
            .wrap_span(string_span("/*"), string_span("*/"))
            .trim_whitespace()
            .map(|s| Comment::Block(s.as_str()))
            .debug("block")
    }

    fn line_comment() -> Parser<'a, Comment<'a>> {
        let not_newline = take_while_span(|c| c != '\n');
        let end = string_span("\r").opt_span().then_span(string_span("\n"));

        not_newline
            .wrap_span(string_span("//"), end)
            .map(|s| Comment::Line(s.as_str()))
    }

    fn identifier() -> Parser<'a, Span<'a>> {
        let first_part = take_while_span(|c| c.is_alphabetic() || c == '_');
        let rest_part =
            take_while_span(|c| c.is_alphanumeric() || c == '_' || c == '-' || c == '.')
                .many_span(..);
        first_part.then_span(rest_part)
    }

    fn literal() -> Parser<'a, Expression<'a>> {
        let not_quote = take_while_span(|c| c != '"' && c != '\\');

        let string = (not_quote | escaped_span())
            .many_span(..)
            .wrap_span(string_span("\""), string_span("\""));

        string.map(|s| {
            let token = Token::new(s.as_str(), s);
            Expression::Literal(token)
        })
    }

    fn epsilon() -> Parser<'a, Expression<'a>> {
        string_span("epsilon").map(|s| {
            let token = Token::new((), s);
            Expression::Epsilon(token)
        })
    }

    fn nonterminal() -> Parser<'a, Expression<'a>> {
        Self::identifier().map(|s| {
            let token = Token::new(s.as_str(), s);
            Expression::Nonterminal(token)
        })
    }

    fn regex() -> Parser<'a, Expression<'a>> {
        let not_slash = take_while_span(|c| c != '/');

        let escaped_span = string_span(r"\").then_span(string_span("/"));

        let string = (escaped_span | not_slash)
            .many_span(..)
            .wrap_span(string_span("/"), string_span("/"));

        string.map(|s| {
            let token = Token::new(regex::Regex::new(s.as_str()).unwrap(), s);
            Expression::Regex(token)
        })
    }

    fn group() -> Parser<'a, Expression<'a>> {
        lazy(|| {
            Self::rhs()
                .trim_whitespace()
                .wrap(string_span("("), string_span(")"))
                .map_with_state(|expr, prev_offset, state| {
                    let token = Token::new(expr, Span::new(prev_offset, state.offset, state.src));
                    Expression::Group(Box::new(token))
                })
        })
    }

    fn optional_group() -> Parser<'a, Expression<'a>> {
        lazy(|| {
            Self::rhs()
                .trim_whitespace()
                .wrap(string_span("["), string_span("]"))
                .map_with_state(|expr, prev_offset, state| {
                    let token = Token::new(expr, Span::new(prev_offset, state.offset, state.src));
                    Expression::Optional(Box::new(token))
                })
        })
    }

    fn many_group() -> Parser<'a, Expression<'a>> {
        lazy(|| {
            Self::rhs()
                .trim_whitespace()
                .wrap(string_span("{"), string_span("}"))
                .map_with_state(|expr, prev_offset, state| {
                    let token = Token::new(expr, Span::new(prev_offset, state.offset, state.src));
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

    fn trim_comment(
        p: Parser<'a, Expression<'a>>,
        comment_parser: Parser<'a, Option<Comment<'a>>>,
    ) -> Parser<'a, Expression<'a>> {
        p.trim_keep(comment_parser).map(|(left, mut expr, right)| {
            if left.is_some() || right.is_some() {
                let comments = Comments { left, right };
                set_expression_comments(&mut expr, comments);
            }
            return expr;
        })
    }

    fn factor() -> Parser<'a, Expression<'a>> {
        Self::trim_comment(
            Self::term()
                .with(any_span(&["?w", "*", "+", "?"]).trim_whitespace().opt())
                .map_with_state(map_factor),
            Self::block_comment().opt(),
        )
    }

    fn binary_factor() -> Parser<'a, Expression<'a>> {
        Self::factor()
            .with(
                any_span(&["<<", ">>", "-"])
                    .trim_whitespace()
                    .with(Self::factor())
                    .many(..),
            )
            .map_with_state(reduce_binary_expression)
    }

    fn concatenation() -> Parser<'a, Expression<'a>> {
        let delim = string_span(",").trim_whitespace();

        Self::binary_factor()
            .sep_by(delim, ..)
            .map_with_state(|exprs, prev_offset, state| {
                if exprs.len() == 1 {
                    exprs.into_iter().next().unwrap()
                } else {
                    let token = Token::new(exprs, Span::new(prev_offset, state.offset, state.src));
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
                    let token = Token::new(exprs, Span::new(prev_offset, state.offset, state.src));
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

    fn production_rule() -> Parser<'a, Expression<'a>> {
        let comment = Self::block_comment() | Self::line_comment();
        let eq = string("=").trim_whitespace();
        let terminator = (any_span(&[";", "."])).trim_whitespace();

        let production_rule = Self::lhs()
            .skip(eq)
            .with(Self::rhs())
            .skip(terminator)
            .map(|(lhs, rhs)| Expression::ProductionRule(Box::new(lhs), Box::new(rhs)));

        Self::trim_comment(production_rule, comment.opt())
    }

    pub fn grammar() -> Parser<'a, AST<'a>> {
        let rule = Self::production_rule().trim_whitespace().many(..);

        return rule
            .trim_whitespace()
            .map(|rules| {
                rules
                    .into_iter()
                    .map(|rule| {
                        let Expression::ProductionRule(
                           box Expression::Nonterminal(lhs), _
                        ) = &rule else {
                            unreachable!();
                        };

                        (lhs.value, rule)
                    })
                    .collect()
            })
            .debug("grammar");
    }
}
