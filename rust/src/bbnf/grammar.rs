// use crate::parse::{ lazy, regex, string, Parser};
// use std::collections::HashMap;

// #[derive(Debug, Clone, PartialEq)]
// pub enum Expression {
//     Literal(String),
//     Nonterminal(String),
//     Group(Box<Expression>),
//     Regex(regex::Regex),
//     Optional(Box<Expression>),
//     Minus(Box<Expression>, Box<Expression>),
//     Many(Box<Expression>),
//     Many1(Box<Expression>),
//     Skip(Box<Expression>, Box<Expression>),
//     Next(Box<Expression>, Box<Expression>),
//     Concatenation(Vec<Expression>),
//     Alteration(Vec<Expression>),
//     Epsilon,
//     OptionalWhitespace,
// }

// #[derive(Debug, Clone, PartialEq)]
// pub struct ProductionRule {
//     name: String,
//     expression: Expression,
//     comment: (Vec<String>, Vec<String>),
// }

// pub type AST = HashMap<String, ProductionRule>;

// pub struct BBNFGrammar;

// impl BBNFGrammar {
//     pub fn grammar(input: &str) -> Result<AST, String> {
//         Parser::new(move |input| {
//             let (input, rules) = Self::production_rules().parse(input)?;
//             let (input, _) = eof().parse(input)?;
//             Ok((input, rules))
//         })
//         .parse(input)
//         .map(|(_, rules)| rules.into_iter().map(|rule| (rule.name.clone(), rule)).collect())
//     }

//     fn identifier() -> Parser<String> {
//         regex(r#"[_a-zA-Z][_a-zA-Z0-9-]*"#)
//     }

//     fn literal() -> Parser<Expression> {
//         (string("\"")
//             .then(regex(r#"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"#))
//             .then(string("\"")))
//             .map(|(_, s, _)| Expression::Literal(s))
//         | (string("'")
//             .then(regex(r#"(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*"#))
//             .then(string("'")))
//             .map(|(_, s, _)| Expression::Literal(s))
//     }

//     fn epsilon() -> Parser<Expression> {
//         string("epsilon").map(|_| Expression::Epsilon)
//     }

//     fn nonterminal() -> Parser<Expression> {
//         Self::identifier().map(Expression::Nonterminal)
//     }

//     fn group() -> Parser<Expression> {
//         string("(")
//             .skip_whitespace()
//             .then(Self::rhs())
//             .skip_whitespace()
//             .then(string(")"))
//             .map(|(_, expr, _)| Expression::Group(Box::new(expr)))
//     }

//     fn optional_group() -> Parser<Expression> {
//         string("[")
//             .skip_whitespace()
//             .then(Self::rhs())
//             .skip_whitespace()
//             .then(string("]"))
//             .map(|(_, expr, _)| {
//                 Expression::Optional(Box::new(Expression::Group(Box::new(expr))))
//             })
//     }

//     fn many_group() -> Parser<Expression> {
//         string("{")
//             .skip_whitespace()
//             .then(Self::rhs())
//             .skip_whitespace()
//             .then(string("}"))
//             .map(|(_, expr, _)| {
//                 Expression::Many(Box::new(Expression::Group(Box::new(expr))))
//             })
//     }

//     fn term() -> Parser<Expression> {
//         Self::epsilon()
//             | Self::group()
//             | Self::optional_group()
//             | Self::many_group()
//             | Self::nonterminal()
//             | Self::literal()
//             | Self::regex()
//     }

