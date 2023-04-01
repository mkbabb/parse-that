use std::collections::{HashMap, HashSet};

use crate::grammar::*;

use pretty::{Doc, PRINTER};
use proc_macro2::TokenStream;
use quote::{quote, ToTokens};
use syn::{parse_quote, Expr, Type};

pub fn topological_sort<'a>(ast: &'a AST) -> AST<'a> {
    let mut order = Vec::new();
    let mut vistied = HashSet::new();

    fn visit<'a>(
        name: &'a str,
        expr: &'a Expression<'a>,
        ast: &'a AST,
        order: &mut Vec<&'a str>,
        vistied: &mut HashSet<&'a str>,
    ) {
        if vistied.contains(name) {
            return;
        }
        vistied.insert(name);

        match expr {
            Expression::Nonterminal(Token { value, .. }) => {
                let expr = ast
                    .get(value)
                    .expect(&format!(r#""{}"" not found in ast"#, value));
                visit(value, expr, ast, order, vistied);
            }
            Expression::Alternation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                for inner_expr in inner_exprs {
                    visit(name, inner_expr, ast, order, vistied);
                }
            }
            Expression::Concatenation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                for inner_expr in inner_exprs {
                    visit(name, inner_expr, ast, order, vistied);
                }
            }

            Expression::Skip(left_expr, right_expr)
            | Expression::Next(left_expr, right_expr)
            | Expression::Minus(left_expr, right_expr) => {
                let left_expr = get_inner_expression(left_expr);
                let right_expr = get_inner_expression(right_expr);
                visit(name, left_expr, ast, order, vistied);
                visit(name, right_expr, ast, order, vistied);
            }

            Expression::Group(inner_expr)
            | Expression::Optional(inner_expr)
            | Expression::Many(inner_expr)
            | Expression::Many1(inner_expr)
            | Expression::OptionalWhitespace(inner_expr) => {
                let inner_expr = get_inner_expression(inner_expr);
                visit(name, inner_expr, ast, order, vistied);
            }

            _ => {}
        }

        order.push(name);
    }

    ast.into_iter().for_each(|(name, expr)| {
        let Expression::ProductionRule(_, rhs) = expr else {
            return;
        };
        visit(name, rhs, ast, &mut order, &mut vistied);
    });

    let mut new_ast = AST::new();
    for name in order {
        let expr = ast
            .get(name)
            .expect(&format!(r#""{}"" not found in ast"#, name));
        new_ast.insert(name, expr.clone());
    }
    new_ast
}

fn get_inner_expression<'a, T>(inner_expr: &'a Box<Token<'a, T>>) -> &'a T {
    &inner_expr.as_ref().value
}

pub fn calculate_nonterminal_types<'a>(
    ast: &'a AST,
    boxed_enum_ident: &Type,
) -> HashMap<&'a str, Type> {
    fn recurse<'a, 'b>(
        expr: &'a Expression<'a>,
        ast: &'a AST,
        boxed_enum_ident: &Type,
        nonterminal_types: &'b mut HashMap<&'a str, Type>,
        cache: &'b mut HashMap<&'a Expression<'a>, Type>,
    ) -> Type
    where
        'a: 'b,
    {
        if let Some(ty) = cache.get(expr) {
            return ty.clone();
        }

        let ty = match expr {
            Expression::Literal(_) => parse_quote!(parse_that::Span<'a>),
            Expression::Nonterminal(_) => boxed_enum_ident.clone(),
            Expression::Regex(_) => parse_quote!(parse_that::Span<'a>),
            Expression::Group(inner_expr) => {
                let inner_expr = get_inner_expression(inner_expr);
                recurse(inner_expr, ast, boxed_enum_ident, nonterminal_types, cache)
            }
            Expression::Optional(inner_expr) => {
                let inner_expr = get_inner_expression(inner_expr);
                let inner_type =
                    recurse(inner_expr, ast, boxed_enum_ident, nonterminal_types, cache);
                parse_quote!(Option<#inner_type>)
            }
            Expression::OptionalWhitespace(inner_expr) => {
                let inner_expr = get_inner_expression(inner_expr);
                recurse(inner_expr, ast, boxed_enum_ident, nonterminal_types, cache)
            }
            Expression::Many(inner_expr) | Expression::Many1(inner_expr) => {
                let inner_expr = get_inner_expression(inner_expr);
                let inner_type =
                    recurse(inner_expr, ast, boxed_enum_ident, nonterminal_types, cache);
                parse_quote!(Vec<#inner_type>)
            }

            Expression::Skip(left_expr, _) => {
                let left_expr = get_inner_expression(left_expr);
                let left_type = recurse(left_expr, ast, boxed_enum_ident, nonterminal_types, cache);
                return left_type;
            }
            Expression::Next(_, right_expr) => {
                let right_expr = get_inner_expression(right_expr);
                let right_type =
                    recurse(right_expr, ast, boxed_enum_ident, nonterminal_types, cache);
                return right_type;
            }
            Expression::Minus(left_expr, _) => {
                let left_expr = get_inner_expression(left_expr);
                let left_type = recurse(left_expr, ast, boxed_enum_ident, nonterminal_types, cache);
                return left_type;
            }
            Expression::Concatenation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                inner_exprs
                    .iter()
                    .map(|expr| recurse(expr, ast, boxed_enum_ident, nonterminal_types, cache))
                    .fold(None, |acc, ty| match acc {
                        None => Some(ty),
                        Some(acc) => Some(parse_quote!((#acc, #ty))),
                    })
                    .unwrap()
            }
            Expression::Alternation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                let mut ty: Option<Type> = None;

                for inner_expr in inner_exprs {
                    let new_ty =
                        recurse(inner_expr, ast, boxed_enum_ident, nonterminal_types, cache);
                    match &ty {
                        None => ty = Some(new_ty),
                        Some(ty) => {
                            if !quote!(#ty).to_string().eq(&quote!(#new_ty).to_string()) {
                                return boxed_enum_ident.clone();
                            }
                        }
                    }
                }

                ty.unwrap()
            }
            Expression::ProductionRule(_, rhs) => {
                recurse(rhs, ast, boxed_enum_ident, nonterminal_types, cache)
            }
            _ => panic!("Unimplemented expression type"),
        };
        cache.insert(expr, ty.clone());
        ty
    }

    let mut nonterminal_types = HashMap::new();
    let mut cache = HashMap::new();

    for (name, expr) in ast {
        let ty = recurse(
            expr,
            ast,
            boxed_enum_ident,
            &mut nonterminal_types,
            &mut cache,
        );
        nonterminal_types.insert(name, ty);
    }

    nonterminal_types
}

pub fn generate_parser_from_ast(expr: &Expression) -> proc_macro2::TokenStream {
    let parser_match = match expr {
        Expression::Literal(token) => {
            let value = token.value;
            quote! { string_span(#value) }
        }
        Expression::Nonterminal(token) => {
            let ident = syn::Ident::new(token.value, proc_macro2::Span::call_site());
            quote! { Self::#ident() }
        }
        Expression::Regex(token) => {
            let regex_str = token.value;
            quote! { regex_span(#regex_str) }
        }
        Expression::Group(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_parser = generate_parser_from_ast(inner_expr);
            quote! { #inner_parser }
        }
        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_parser = generate_parser_from_ast(inner_expr);
            quote! { #inner_parser.opt() }
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_parser = generate_parser_from_ast(inner_expr);
            quote! { #inner_parser.trim_whitespace() }
        }
        Expression::Many(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_parser = generate_parser_from_ast(inner_expr);
            quote! { #inner_parser.many(..) }
        }
        Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_parser = generate_parser_from_ast(inner_expr);
            quote! { #inner_parser.many(..1) }
        }
        Expression::Skip(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser = generate_parser_from_ast(left_expr);
            let right_parser = generate_parser_from_ast(right_expr);

            quote! { #left_parser.skip(#right_parser) }
        }
        Expression::Next(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser = generate_parser_from_ast(left_expr);
            let right_parser = generate_parser_from_ast(right_expr);

            quote! { #left_parser.then(#right_parser) }
        }
        Expression::Minus(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser = generate_parser_from_ast(left_expr);
            let right_parser = generate_parser_from_ast(right_expr);
            quote! { #left_parser.not(#right_parser) }
        }
        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            inner_exprs
                .iter()
                .map(generate_parser_from_ast)
                .fold(None, |acc, parser| match acc {
                    None => Some(parser),
                    Some(acc) => Some(quote! { #acc.with( #parser ) }),
                })
                .unwrap()
        }
        Expression::Alternation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            let parser = inner_exprs
                .iter()
                .map(generate_parser_from_ast)
                .fold(None, |acc, parser| match acc {
                    None => Some(parser),
                    Some(acc) => Some(quote! { #acc.or( #parser )  }),
                })
                .unwrap();

            quote! { #parser }
        }

        Expression::ProductionRule(_lhs, rhs) => generate_parser_from_ast(rhs),

        _ => unimplemented!("Expression not implemented: {:?}", expr),
    };

    return TokenStream::from(parser_match);
}
