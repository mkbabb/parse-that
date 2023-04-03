use std::collections::{HashMap, HashSet};

use crate::grammar::*;

use pretty::{Doc, PRINTER};
use proc_macro2::TokenStream;
use quote::{quote, ToTokens};
use syn::{parse_quote, Expr, Type};

pub fn topological_sort<'a>(ast: &'a AST) -> AST<'a> {
    let mut order = Vec::new();

    let mut after_visitor = |name: &str, _| {
        order.push(name.to_owned());
    };
    traverse_ast(ast, None, Some(&mut after_visitor));

    let mut new_ast = AST::new();
    for name in order {
        if let Some((key, expr)) = ast.get_key_value(&name) {
            new_ast.insert(key.to_string(), expr.clone());
        }
    }

    new_ast
}

type Visitor<'a> = dyn FnMut(&'a str, &'a Expression<'a>) + 'a;

pub fn traverse_ast<'a>(
    ast: &'a AST,
    before_visitor: Option<&mut Visitor<'a>>,
    after_visitor: Option<&mut Visitor<'a>>,
) {
    fn visit<'a, 'b>(
        name: &'a str,
        expr: &'a Expression<'a>,
        before_visitor: &mut Visitor<'a>,
        after_visitor: &mut Visitor<'a>,
        visited: &'b mut HashSet<&'a str>,
    ) where
        'a: 'b,
    {
        if visited.contains(name) {
            return;
        }
        visited.insert(name);

        before_visitor(name, expr);

        match expr {
            Expression::Nonterminal(_) => {}
            Expression::Alternation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                for inner_expr in inner_exprs {
                    visit(name, inner_expr, before_visitor, after_visitor, visited)
                }
            }
            Expression::Concatenation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                for inner_expr in inner_exprs {
                    visit(name, inner_expr, before_visitor, after_visitor, visited)
                }
            }

            Expression::Skip(left_expr, right_expr)
            | Expression::Next(left_expr, right_expr)
            | Expression::Minus(left_expr, right_expr) => {
                let left_expr = get_inner_expression(left_expr);
                let right_expr = get_inner_expression(right_expr);
                visit(name, left_expr, before_visitor, after_visitor, visited);
                visit(name, right_expr, before_visitor, after_visitor, visited);
            }

            Expression::Group(inner_expr)
            | Expression::Optional(inner_expr)
            | Expression::Many(inner_expr)
            | Expression::Many1(inner_expr)
            | Expression::OptionalWhitespace(inner_expr) => {
                let inner_expr = get_inner_expression(inner_expr);
                visit(name, inner_expr, before_visitor, after_visitor, visited);
            }

            _ => {}
        }

        after_visitor(name, expr);
    }

    let mut before_visitor_default = |_, _| {};
    let mut after_visitor_default = |_, _| {};

    let before_visitor = before_visitor.unwrap_or(&mut before_visitor_default);
    let after_visitor = after_visitor.unwrap_or(&mut after_visitor_default);

    let mut visited = HashSet::new();
    ast.into_iter().for_each(|(name, expr)| {
        let Expression::ProductionRule(_, rhs) = expr else {
            return;
        };
        visit(name, rhs, before_visitor, after_visitor, &mut visited)
    });
}

fn get_inner_expression<'a, T>(inner_expr: &'a Box<Token<'a, T>>) -> &'a T {
    &inner_expr.as_ref().value
}

fn type_is_span(ty: &Type) -> bool {
    if let Type::Path(type_path) = ty {
        if type_path.path.segments.len() < 2 {
            return false;
        }
        let first_segment = &type_path.path.segments[0];
        let second_segment = &type_path.path.segments[1];

        first_segment.ident == "parse_that" && second_segment.ident == "Span"
    } else {
        return false;
    }
}

pub fn calculate_parser_type<'a, 'b>(
    expr: &'a Expression<'a>,
    boxed_enum_ident: &Type,
    cache: &'b mut HashMap<&'a Expression<'a>, Type>,
) -> Type
where
    'a: 'b,
{
    if let Some(ty) = cache.get(expr) {
        return ty.clone();
    }

    let ty = match expr {
        Expression::Literal(_) => parse_quote!(::parse_that::Span<'a>),
        Expression::Nonterminal(_) => boxed_enum_ident.clone(),
        Expression::Regex(_) => parse_quote!(::parse_that::Span<'a>),

        Expression::Group(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            calculate_parser_type(inner_expr, boxed_enum_ident, cache)
        }

        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_type = calculate_parser_type(inner_expr, boxed_enum_ident, cache);

            if type_is_span(&inner_type) {
                return inner_type;
            }
            parse_quote!(Option<#inner_type>)
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            calculate_parser_type(inner_expr, boxed_enum_ident, cache)
        }
        Expression::Many(inner_expr) | Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_type = calculate_parser_type(inner_expr, boxed_enum_ident, cache);

            if type_is_span(&inner_type) {
                return inner_type;
            }
            parse_quote!(Vec<#inner_type>)
        }
        Expression::Skip(left_expr, _) => {
            let left_expr = get_inner_expression(left_expr);
            let left_type = calculate_parser_type(left_expr, boxed_enum_ident, cache);
            return left_type;
        }

        Expression::Next(_, right_expr) => {
            let right_expr = get_inner_expression(right_expr);
            let right_type = calculate_parser_type(right_expr, boxed_enum_ident, cache);
            return right_type;
        }
        Expression::Minus(left_expr, _) => {
            let left_expr = get_inner_expression(left_expr);
            let left_type = calculate_parser_type(left_expr, boxed_enum_ident, cache);
            return left_type;
        }

        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);

            let tys = inner_exprs
                .into_iter()
                .map(|expr| calculate_parser_type(expr, boxed_enum_ident, cache))
                .collect::<Vec<_>>();

            if tys.iter().all(type_is_span) || tys.len() == 1 {
                return tys[0].clone();
            }
            parse_quote!((#(#tys),*))
        }

        Expression::Alternation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            let mut ty = None;

            for inner_expr in inner_exprs {
                let new_ty = calculate_parser_type(inner_expr, boxed_enum_ident, cache);
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

        Expression::ProductionRule(_, rhs) => calculate_parser_type(rhs, boxed_enum_ident, cache),

        _ => panic!("Unimplemented expression type"),
    };
    cache.insert(expr, ty.clone());
    ty
}

pub fn calculate_nonterminal_types<'a>(
    ast: &'a AST,
    boxed_enum_ident: &Type,
) -> HashMap<String, Type> {
    let mut cache = HashMap::new();
    ast.into_iter()
        .map(|(name, expr)| {
            (
                name.to_string(),
                calculate_parser_type(expr, boxed_enum_ident, &mut cache),
            )
        })
        .collect()
}

pub fn generate_parser_from_ast<'a, 'b>(
    expr: &'a Expression<'a>,
    boxed_enum_ident: &Type,
    nonterminal_types: &HashMap<String, Type>,
    cache: &'b mut HashMap<&'a Expression<'a>, Type>,
) -> TokenStream
where
    'a: 'b,
{
    match expr {
        Expression::Literal(token) => {
            let value = token.value;
            quote! { ::parse_that::string_span(#value) }
        }
        Expression::Nonterminal(token) => {
            let ident = syn::Ident::new(token.value, proc_macro2::Span::call_site());
            quote! { Self::#ident() }
        }
        Expression::Regex(token) => {
            let regex_str = token.value;
            quote! { ::parse_that::regex_span(#regex_str) }
        }
        Expression::Group(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            generate_parser_from_ast(inner_expr, boxed_enum_ident, nonterminal_types, cache)
        }
        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser =
                generate_parser_from_ast(inner_expr, boxed_enum_ident, nonterminal_types, cache);
            let ty = calculate_parser_type(inner_expr, boxed_enum_ident, cache);

            if type_is_span(&ty) {
                return quote! { #parser.opt_span() };
            }
            quote! { #parser.opt() }
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser =
                generate_parser_from_ast(inner_expr, boxed_enum_ident, nonterminal_types, cache);

            quote! { #parser.trim_whitespace() }
        }
        Expression::Many(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser =
                generate_parser_from_ast(inner_expr, boxed_enum_ident, nonterminal_types, cache);
            let ty = calculate_parser_type(inner_expr, boxed_enum_ident, cache);

            if type_is_span(&ty) {
                return quote! { #parser.many_span(..) };
            }
            quote! { #parser.many(..) }
        }
        Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser =
                generate_parser_from_ast(inner_expr, boxed_enum_ident, nonterminal_types, cache);
            let ty = calculate_parser_type(inner_expr, boxed_enum_ident, cache);

            if type_is_span(&ty) {
                return quote! { #parser.many_span(1..) };
            }
            quote! { #parser.many(1..) }
        }
        Expression::Skip(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser =
                generate_parser_from_ast(left_expr, boxed_enum_ident, nonterminal_types, cache);
            let right_parser =
                generate_parser_from_ast(right_expr, boxed_enum_ident, nonterminal_types, cache);

            quote! { #left_parser.skip(#right_parser) }
        }
        Expression::Next(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser =
                generate_parser_from_ast(left_expr, boxed_enum_ident, nonterminal_types, cache);
            let right_parser =
                generate_parser_from_ast(right_expr, boxed_enum_ident, nonterminal_types, cache);

            quote! { #left_parser.next(#right_parser) }
        }

        Expression::Minus(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser =
                generate_parser_from_ast(left_expr, boxed_enum_ident, nonterminal_types, cache);
            let right_parser =
                generate_parser_from_ast(right_expr, boxed_enum_ident, nonterminal_types, cache);

            quote! { #left_parser.not(#right_parser) }
        }

        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            let ty = calculate_parser_type(expr, boxed_enum_ident, cache);
            let is_span = type_is_span(&ty);

            let mut acc = None;
            for (n, parser) in inner_exprs
                .iter()
                .map(|parser| {
                    generate_parser_from_ast(parser, boxed_enum_ident, nonterminal_types, cache)
                })
                .enumerate()
            {
                acc = match acc {
                    None => Some(parser),
                    Some(acc) => {
                        if is_span {
                            Some(quote! { #acc.then_span( #parser ) })
                        } else {
                            if n > 1 {
                                Some(quote! { #acc.then_flat( #parser ) })
                            } else {
                                Some(quote! { #acc.then( #parser ) })
                            }
                        }
                    }
                }
            }
            acc.unwrap()
        }
        Expression::Alternation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            let parser = inner_exprs
                .iter()
                .map(|parser| {
                    generate_parser_from_ast(parser, boxed_enum_ident, nonterminal_types, cache)
                })
                .fold(None, |acc, parser| match acc {
                    None => Some(parser),
                    Some(acc) => Some(quote! { #acc | #parser  }),
                })
                .unwrap();

            if inner_exprs.len() > 1 {
                quote! { ( #parser ) }
            } else {
                parser
            }
        }

        Expression::ProductionRule(_lhs, rhs) => {
            generate_parser_from_ast(rhs, boxed_enum_ident, nonterminal_types, cache)
        }

        _ => unimplemented!("Expression not implemented: {:?}", expr),
    }
}
