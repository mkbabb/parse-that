extern crate parse_that;

use parse_that::parsers::utils::escaped_span;
use parse_that::{
    any_span, lazy, next_span, string, string_span, take_while_span, Parser, ParserFlat,
    ParserSpan, ParserState, Span,
};

extern crate pretty;
use pretty::{Doc, Pretty};

use indexmap::IndexMap;

#[derive(Pretty, Debug, Clone, Copy, Eq, PartialEq)]
pub enum Comment<'a> {
    Line(&'a str),
    Block(&'a str),
}

#[derive(Pretty, Debug, Clone, Copy, Eq, PartialEq)]
pub struct Comments<'a> {
    pub left: Option<Comment<'a>>,
    pub right: Option<Comment<'a>>,
}

type TokenExpression<'a, T = Expression<'a>> = Box<Token<'a, T>>;

#[derive(Pretty, Debug, Clone, Eq, PartialEq, Hash)]
pub enum Expression<'a> {
    Literal(Token<'a, &'a str>),
    Nonterminal(Token<'a, &'a str>),

    Regex(Token<'a, &'a str>),

    MappingFn(Token<'a, String>),
    MappedExpression((TokenExpression<'a>, TokenExpression<'a>)),

    DebugExpression((TokenExpression<'a>, String)),

    Group(TokenExpression<'a>),
    Optional(TokenExpression<'a>),
    OptionalWhitespace(TokenExpression<'a>),

    Many(TokenExpression<'a>),
    Many1(TokenExpression<'a>),

    Skip(TokenExpression<'a>, TokenExpression<'a>),
    Next(TokenExpression<'a>, TokenExpression<'a>),
    Minus(TokenExpression<'a>, TokenExpression<'a>),

    Concatenation(TokenExpression<'a, Vec<Expression<'a>>>),
    Alternation(TokenExpression<'a, Vec<Expression<'a>>>),

    Rule(Box<Expression<'a>>, Option<Box<Expression<'a>>>),

    ProductionRule(Box<Expression<'a>>, Box<Expression<'a>>),

    Epsilon(Token<'a, ()>),
}

#[derive(Pretty, Debug, Clone, Copy, Eq)]
pub struct Token<'a, T> {
    pub value: T,

    #[pretty(skip)]
    pub span: Span<'a>,
    #[pretty(skip)]
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

    pub fn new_without_span(value: T) -> Self {
        Self {
            value,
            span: Span::new(0, 0, ""),
            comments: None,
        }
    }
}

pub type AST<'a> = IndexMap<Expression<'a>, Expression<'a>>;

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

        Expression::Concatenation(token) | Expression::Alternation(token) => {
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
                "*" => Expression::Many(Box::new(token)),
                "+" => Expression::Many1(Box::new(token)),
                "?w" => Expression::OptionalWhitespace(Box::new(token)),
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
            ">>" => Expression::Next(Box::new(acc_token), Box::new(right_token)),
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
            .many_span(1..)
            .map(|s| Comment::Block(s.as_str()))
    }

    fn line_comment() -> Parser<'a, Comment<'a>> {
        let not_newline = take_while_span(|c| c != '\n');
        let end = string_span("\r").opt_span().then_span(string_span("\n"));

        not_newline
            .wrap_span(string_span("//"), end)
            .many_span(1..)
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
        let quoted = |quote: &'a str| {
            let not_quote = take_while_span(|c| c != quote.chars().next().unwrap() && c != '\\');
            (not_quote | escaped_span())
                .many_span(..)
                .wrap_span(string_span(quote), string_span(quote))
        };

        (quoted("\"") | quoted("'") | quoted("`")).map(|s| {
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
            match regex::Regex::new(s.as_str()) {
                Ok(_) => {}
                Err(e) => panic!("invalid regex: {:?}, {:?}", s.as_str(), e),
            }
            let token = Token::new(s.as_str(), s);
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
            expr
        })
    }

    fn factor() -> Parser<'a, Expression<'a>> {
        Self::trim_comment(
            Self::term()
                .then(any_span(&["?w", "*", "+", "?"]).trim_whitespace().opt())
                .map_with_state(map_factor),
            Self::block_comment().opt(),
        )
    }

    fn binary_factor() -> Parser<'a, Expression<'a>> {
        Self::factor()
            .then(
                any_span(&["<<", ">>", "-"])
                    .trim_whitespace()
                    .then(Self::factor())
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
                    Expression::Alternation(Box::new(token))
                }
            })
    }

    fn lhs() -> Parser<'a, Expression<'a>> {
        Self::nonterminal()
    }

    fn rhs() -> Parser<'a, Expression<'a>> {
        Self::alternation()
    }

    fn mapping_fn() -> Parser<'a, Option<Box<Expression<'a>>>> {
        let lhs = string_span(";").skip(Self::lhs().trim_whitespace().skip(string_span("=")));
        let not_lhs = next_span(1).look_ahead(lhs.negate());

        string_span("=>")
            .trim_whitespace()
            .next(not_lhs.many_span(..).then_span(next_span(1)))
            .map(|s| {
                let token = Token::new(s.as_str().to_string(), s);
                match syn::parse_str::<syn::ExprClosure>(s.as_str()) {
                    Ok(_) => {}
                    Err(e) => panic!("invalid mapper expression: {:?}, {:?}", s.as_str(), e),
                }

                Box::new(Expression::MappingFn(token))
            })
            .opt()
    }

    fn production_rule() -> Parser<'a, Expression<'a>> {
        let comment = Self::block_comment() | Self::line_comment();
        let eq = string("=").trim_whitespace();

        let terminator = (any_span(&[";", "."])).trim_whitespace();

        let production_rule = Self::lhs()
            .skip(eq)
            .then(Self::rhs())
            .then_flat(Self::mapping_fn())
            .skip(terminator)
            .map(|(lhs, rhs, mapping_fn)| {
                Expression::ProductionRule(
                    lhs.into(),
                    Expression::Rule(Box::new(rhs), mapping_fn).into(),
                )
            });

        Self::trim_comment(production_rule, comment.opt())
    }

    pub fn grammar() -> Parser<'a, AST<'a>> {
        let rule = Self::production_rule().trim_whitespace().many(..);

        return rule.trim_whitespace().map(|rules| {
            rules
                .into_iter()
                .map(|expr| match expr {
                    Expression::ProductionRule(lhs, rhs) => (*lhs, *rhs),
                    _ => unreachable!(),
                })
                .collect()
        });
    }
}

impl<'a, T: PartialEq> PartialEq for Token<'a, T> {
    fn eq(&self, other: &Self) -> bool {
        self.value == other.value
    }
}
impl<'a, T: std::hash::Hash> std::hash::Hash for Token<'a, T> {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.value.hash(state);
    }
}
