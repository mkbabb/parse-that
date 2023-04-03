use std::{
    borrow::Borrow,
    collections::{HashMap, HashSet},
};

use crate::grammar::*;

use pretty::{Doc, PRINTER};
use proc_macro2::TokenStream;
use quote::{quote, ToTokens};
use syn::{parse_quote, Expr, Type};

use indexmap::{IndexMap, IndexSet};

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
    ) where
        'a: 'b,
    {
        before_visitor(name, expr);

        match expr {
            Expression::Nonterminal(_) => {}
            Expression::Alternation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                for inner_expr in inner_exprs {
                    visit(name, inner_expr, before_visitor, after_visitor)
                }
            }
            Expression::Concatenation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                for inner_expr in inner_exprs {
                    visit(name, inner_expr, before_visitor, after_visitor)
                }
            }

            Expression::Skip(left_expr, right_expr)
            | Expression::Next(left_expr, right_expr)
            | Expression::Minus(left_expr, right_expr) => {
                let left_expr = get_inner_expression(left_expr);
                let right_expr = get_inner_expression(right_expr);
                visit(name, left_expr, before_visitor, after_visitor);
                visit(name, right_expr, before_visitor, after_visitor);
            }

            Expression::Group(inner_expr)
            | Expression::Optional(inner_expr)
            | Expression::Many(inner_expr)
            | Expression::Many1(inner_expr)
            | Expression::OptionalWhitespace(inner_expr) => {
                let inner_expr = get_inner_expression(inner_expr);
                visit(name, inner_expr, before_visitor, after_visitor);
            }

            _ => {}
        }

        after_visitor(name, expr);
    }

    let mut before_visitor_default = |_, _| {};
    let mut after_visitor_default = |_, _| {};

    let before_visitor = before_visitor.unwrap_or(&mut before_visitor_default);
    let after_visitor = after_visitor.unwrap_or(&mut after_visitor_default);

    ast.into_iter().for_each(|(name, expr)| {
        let Expression::ProductionRule(_, rhs) = expr else {
            return;
        };
        visit(name, rhs, before_visitor, after_visitor)
    });
}

pub fn topological_sort<'a>(ast: &'a AST) -> (AST<'a>, HashMap<String, HashSet<String>>) {
    let mut deps = HashMap::new();

    let mut after_visitor = |name: &str, expr: &Expression| {
        let sub_deps = deps
            .entry(name.to_string())
            .or_insert_with(|| HashSet::new());

        match expr {
            Expression::Nonterminal(Token { value, .. }) => {
                sub_deps.insert(value.to_string());
            }
            _ => {}
        }
    };

    traverse_ast(ast, None, Some(&mut after_visitor));

    let mut order = deps
        .iter()
        .map(|(name, sub_deps)| {
            let len: usize = sub_deps
                .into_iter()
                .map(|sub_name| {
                    let sub_deps = deps.get(sub_name).unwrap();
                    sub_deps.len()
                })
                .sum();
            (name, len)
        })
        .collect::<Vec<_>>();
    order.sort_by(|(_, a), (_, b)| a.cmp(b));

    let mut new_ast = AST::new();
    for (name, _) in order {
        let expr = ast.get(name).unwrap();
        new_ast.insert(name.clone(), expr.clone());
    }

    (new_ast, deps)
}

pub fn calculate_acyclic_deps(
    deps: &HashMap<String, HashSet<String>>,
) -> HashMap<String, HashSet<String>> {
    fn is_acyclic(
        name: &str,
        deps: &HashMap<String, HashSet<String>>,
        visited: &mut HashSet<String>,
    ) -> bool {
        if visited.contains(name) {
            return false;
        }

        visited.insert(name.to_string());

        if let Some(sub_deps) = deps.get(name) {
            for sub_name in sub_deps {
                if !is_acyclic(sub_name, deps, visited) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    deps.iter()
        .filter(|(name, _)| {
            let mut visited = HashSet::new();
            is_acyclic(name, deps, &mut visited)
        })
        .map(|(name, sub_deps)| (name.clone(), sub_deps.clone()))
        .collect()
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

            let tys = inner_exprs
                .into_iter()
                .map(|expr| calculate_parser_type(expr, boxed_enum_ident, cache))
                .collect::<Vec<_>>();

            if tys.iter().all(type_is_span) {
                return tys[0].clone();
            } else if tys
                .iter()
                .all(|ty| ty.to_token_stream().to_string() == tys[0].to_token_stream().to_string())
            {
                return tys[0].clone();
            } else {
                parse_quote!(#boxed_enum_ident)
            }
        }

        Expression::ProductionRule(_, rhs) => calculate_parser_type(rhs, boxed_enum_ident, cache),

        _ => panic!("Unimplemented expression type"),
    };
    cache.insert(expr, ty.clone());
    ty
}

pub type NonterminalTypes = IndexMap<String, Type>;

pub fn needs_boxing(name: &str, deps: &HashMap<String, HashSet<String>>) -> bool {
    if let Some(_) = deps.get(name) {
        if deps.values().any(|v| v.contains(name)) {
            return true;
        }
    }
    false
}

pub const MAX_AST_ITERATIONS: usize = 100;

pub fn calculate_nonterminal_types<'a>(
    ast: &'a AST,
    acyclic_deps: &HashMap<String, HashSet<String>>,
    boxed_enum_ident: &Type,
) -> (HashMap<String, Type>, HashMap<&'a Expression<'a>, Type>) {
    let mut generated_types: HashMap<&Expression, Type> = HashMap::new();
    let mut cache = HashMap::new();

    let mut counter = 0;

    while counter < MAX_AST_ITERATIONS {
        let t_generated_types: HashMap<_, _> = ast
            .into_iter()
            .map(|(_, expr)| {
                let ty = calculate_parser_type(expr, boxed_enum_ident, &mut cache);
                let Expression::ProductionRule(lhs, _) = expr else {
                    panic!("Expected production rule");
                };
                (lhs.as_ref(), ty)
            })
            .collect();

        cache = t_generated_types
            .iter()
            .filter(|(expr, _)| {
                if let Expression::Nonterminal(Token { value: name, .. }) = expr {
                    return acyclic_deps.contains_key(name.to_owned())
                        && needs_boxing(name, acyclic_deps);
                }
                false
            })
            .map(|(expr, ty)| (expr.clone(), ty.clone()))
            .collect();

        if t_generated_types.iter().all(|(k, v)| {
            if let Some(v2) = generated_types.get(k) {
                return v.to_token_stream().to_string() == v2.to_token_stream().to_string();
            } else {
                return false;
            }
        }) {
            break;
        } else {
            generated_types = t_generated_types;
        }

        counter += 1;
    }

    let generated_types = generated_types
        .into_iter()
        .map(|(k, v)| {
            let Expression::Nonterminal(Token { value: name, .. }) = k else {
                panic!("Expected nonterminal");
            };
            (name.to_string(), v.clone())
        })
        .collect();

    (generated_types, cache)
}

pub fn check_for_sep_by<'a, 'b>(
    expr: &'a Expression<'a>,
    boxed_enum_ident: &Type,
    cache: &'b mut HashMap<&'a Expression<'a>, TokenStream>,
    type_cache: &'b mut HashMap<&'a Expression<'a>, Type>,
) -> Option<TokenStream>
where
    'a: 'b,
{
    match expr {
        Expression::Group(box Token { value, .. }) => {
            check_for_sep_by(value, boxed_enum_ident, cache, type_cache)
        }
        Expression::Skip(
            left_expr,
            box Token {
                value: Expression::Optional(right_expr),
                ..
            },
        ) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser =
                generate_parser_from_ast(left_expr, boxed_enum_ident, cache, type_cache);
            let right_parser =
                generate_parser_from_ast(right_expr, boxed_enum_ident, cache, type_cache);

            let left_type = calculate_parser_type(left_expr, boxed_enum_ident, type_cache);
            let right_type = calculate_parser_type(right_expr, boxed_enum_ident, type_cache);

            if type_is_span(&left_type) && type_is_span(&right_type) {
                return Some(quote! {
                    #left_parser.sep_by_span(#right_parser, ..)
                });
            } else {
                return Some(quote! {
                    #left_parser.sep_by(#right_parser, ..)
                });
            }
        }
        _ => None,
    }
}

pub fn check_for_wrapped<'a, 'b>(
    left_expr: &'a Expression<'a>,
    right_expr: &'a Expression<'a>,
    boxed_enum_ident: &Type,
    cache: &'b mut HashMap<&'a Expression<'a>, TokenStream>,
    type_cache: &'b mut HashMap<&'a Expression<'a>, Type>,
) -> Option<TokenStream>
where
    'a: 'b,
{
    match left_expr {
        Expression::Group(box Token { value, .. }) => {
            check_for_wrapped(left_expr, value, boxed_enum_ident, cache, type_cache)
        }
        Expression::Next(left_expr, middle_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let middle_expr = get_inner_expression(middle_expr);

            let left_parser =
                generate_parser_from_ast(left_expr, boxed_enum_ident, cache, type_cache);
            let middle_parser =
                generate_parser_from_ast(middle_expr, boxed_enum_ident, cache, type_cache);
            let right_parser =
                generate_parser_from_ast(right_expr, boxed_enum_ident, cache, type_cache);

            let left_type = calculate_parser_type(left_expr, boxed_enum_ident, type_cache);
            let middle_type = calculate_parser_type(middle_expr, boxed_enum_ident, type_cache);
            let right_type = calculate_parser_type(right_expr, boxed_enum_ident, type_cache);

            if type_is_span(&left_type) && type_is_span(&middle_type) && type_is_span(&right_type) {
                return Some(quote! {
                    #middle_parser.wrap_span(#left_parser, #right_parser)
                });
            } else {
                return Some(quote! {
                    #middle_parser.wrap(#left_parser, #right_parser)
                });
            }
        }
        _ => None,
    }
}

pub fn check_for_any_span<'a>(exprs: &Vec<Expression>) -> Option<TokenStream> {
    let all_literals = exprs
        .iter()
        .all(|expr| matches!(expr, Expression::Literal(_)));

    if all_literals {
        let literal_arr = exprs
            .iter()
            .map(|expr| {
                if let Expression::Literal(token) = expr {
                    token.value
                } else {
                    panic!("Expected literal");
                }
            })
            .collect::<Vec<_>>();

        return Some(quote! {
            ::parse_that::any_span(&[#(#literal_arr),*])
        });
    } else {
        return None;
    }
}

pub fn generate_parser_from_ast<'a, 'b>(
    expr: &'a Expression<'a>,
    boxed_enum_ident: &Type,
    cache: &'b mut HashMap<&'a Expression<'a>, TokenStream>,
    type_cache: &'b mut HashMap<&'a Expression<'a>, Type>,
) -> TokenStream
where
    'a: 'b,
{
    if let Some(parser) = cache.get(expr) {
        return quote! {
            #parser
        };
    }

    match expr {
        Expression::Literal(token) => {
            let value = token.value;
            quote! { ::parse_that::string_span(#value) }
        }
        Expression::Nonterminal(Token { value, .. }) => {
            let ident = syn::Ident::new(value, proc_macro2::Span::call_site());
            quote! { Self::#ident() }
        }
        Expression::Regex(token) => {
            let regex_str = token.value;
            quote! { ::parse_that::regex_span(#regex_str) }
        }
        Expression::Group(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            generate_parser_from_ast(inner_expr, boxed_enum_ident, cache, type_cache)
        }
        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = generate_parser_from_ast(inner_expr, boxed_enum_ident, cache, type_cache);
            let ty = calculate_parser_type(inner_expr, boxed_enum_ident, type_cache);

            if type_is_span(&ty) {
                return quote! { #parser.opt_span() };
            }
            quote! { #parser.opt() }
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = generate_parser_from_ast(inner_expr, boxed_enum_ident, cache, type_cache);

            quote! { #parser.trim_whitespace() }
        }
        Expression::Many(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);

            if let Some(parser) = check_for_sep_by(inner_expr, boxed_enum_ident, cache, type_cache)
            {
                return parser;
            }

            let parser = generate_parser_from_ast(inner_expr, boxed_enum_ident, cache, type_cache);
            let ty = calculate_parser_type(inner_expr, boxed_enum_ident, type_cache);

            if type_is_span(&ty) {
                return quote! { #parser.many_span(..) };
            }
            quote! { #parser.many(..) }
        }
        Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = generate_parser_from_ast(inner_expr, boxed_enum_ident, cache, type_cache);
            let ty = calculate_parser_type(inner_expr, boxed_enum_ident, type_cache);

            if type_is_span(&ty) {
                return quote! { #parser.many_span(1..) };
            }
            quote! { #parser.many(1..) }
        }
        Expression::Skip(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            if let Some(parser) =
                check_for_wrapped(left_expr, right_expr, boxed_enum_ident, cache, type_cache)
            {
                return parser;
            }

            let left_parser =
                generate_parser_from_ast(left_expr, boxed_enum_ident, cache, type_cache);
            let right_parser =
                generate_parser_from_ast(right_expr, boxed_enum_ident, cache, type_cache);

            quote! { #left_parser.skip(#right_parser) }
        }
        Expression::Next(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser =
                generate_parser_from_ast(left_expr, boxed_enum_ident, cache, type_cache);
            let right_parser =
                generate_parser_from_ast(right_expr, boxed_enum_ident, cache, type_cache);

            quote! { #left_parser.next(#right_parser) }
        }

        Expression::Minus(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser =
                generate_parser_from_ast(left_expr, boxed_enum_ident, cache, type_cache);
            let right_parser =
                generate_parser_from_ast(right_expr, boxed_enum_ident, cache, type_cache);

            quote! { #left_parser.not(#right_parser) }
        }

        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            let ty = calculate_parser_type(expr, boxed_enum_ident, type_cache);
            let is_span = type_is_span(&ty);

            let mut acc = None;
            for (n, parser) in inner_exprs
                .iter()
                .map(|parser| generate_parser_from_ast(parser, boxed_enum_ident, cache, type_cache))
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

            if let Some(parser) = check_for_any_span(inner_exprs) {
                return parser;
            }

            let parser = inner_exprs
                .iter()
                .map(|parser| generate_parser_from_ast(parser, boxed_enum_ident, cache, type_cache))
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
            generate_parser_from_ast(rhs, boxed_enum_ident, cache, type_cache)
        }

        _ => unimplemented!("Expression not implemented: {:?}", expr),
    }
}
