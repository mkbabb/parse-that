use std::{
    cell::RefCell,
    collections::{HashMap, HashSet},
    rc::Rc,
};

use crate::grammar::*;

use proc_macro2::TokenStream;
use quote::{quote, ToTokens};
use syn::{parse_quote, Type};

use indexmap::IndexMap;

pub struct GeneratedParser<'a> {
    pub name: &'a str,
    pub ty: Type,
    pub parser: TokenStream,
}

pub fn generate_default_parsers<'a>() -> HashMap<&'a str, GeneratedParser<'a>> {
    let mut default_parsers = HashMap::new();

    default_parsers.insert(
        "NUMBER",
        GeneratedParser {
            name: "NUMBER",
            ty: parse_quote! { ::parse_that::Span<'a> },
            parser: quote! { ::parse_that::parsers::utils::number_span() },
        },
    );

    default_parsers.insert(
        "DOUBLE_QUOTED_STRING",
        GeneratedParser {
            name: "DOUBLE_QUOTED_STRING",
            ty: parse_quote! { ::parse_that::Span<'a> },
            parser: quote! { ::parse_that::parsers::utils::quoted_span(r#"""#) },
        },
    );

    default_parsers
}

fn get_inner_expression<'a, T>(inner_expr: &'a Box<Token<'a, T>>) -> &'a T {
    &inner_expr.as_ref().value
}

pub fn get_nonterminal_name<'a>(expr: &'a Expression<'a>) -> &'a str {
    if let Expression::Nonterminal(Token { value, .. }) = expr {
        value
    } else {
        panic!("Expected nonterminal");
    }
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
        false
    }
}

type Visitor<'a> = dyn FnMut(&'a Expression<'a>, &'a Expression<'a>) + 'a;

pub fn traverse_ast<'a>(ast: &'a AST, visitor: Option<&mut Visitor<'a>>) {
    fn visit<'a>(
        nonterminal: &'a Expression<'a>,
        expr: &'a Expression<'a>,
        visitor: &mut Visitor<'a>,
    ) {
        visitor(nonterminal, expr);

        match expr {
            Expression::Alternation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                for inner_expr in inner_exprs {
                    visit(nonterminal, inner_expr, visitor)
                }
            }
            Expression::Concatenation(inner_exprs) => {
                let inner_exprs = get_inner_expression(inner_exprs);
                for inner_expr in inner_exprs {
                    visit(nonterminal, inner_expr, visitor)
                }
            }

            Expression::Skip(left_expr, right_expr)
            | Expression::Next(left_expr, right_expr)
            | Expression::Minus(left_expr, right_expr) => {
                let left_expr = get_inner_expression(left_expr);
                let right_expr = get_inner_expression(right_expr);
                visit(nonterminal, left_expr, visitor);
                visit(nonterminal, right_expr, visitor);
            }

            Expression::Group(inner_expr)
            | Expression::Optional(inner_expr)
            | Expression::Many(inner_expr)
            | Expression::Many1(inner_expr)
            | Expression::OptionalWhitespace(inner_expr) => {
                let inner_expr = get_inner_expression(inner_expr);
                visit(nonterminal, inner_expr, visitor);
            }

            _ => {}
        }
    }

    let mut visitor_default = |_, _| {};
    let visitor = visitor.unwrap_or(&mut visitor_default);

    ast.into_iter().for_each(|(_, expr)| {
        let Expression::ProductionRule(lhs, rhs, ..) = expr else {
            return;
        };
        visit(lhs, rhs, visitor)
    });
}

pub type Dependencies<'a> = HashMap<Expression<'a>, HashSet<Expression<'a>>>;

pub fn calculate_ast_deps<'a>(ast: &'a AST<'a>) -> Dependencies<'a> {
    let deps = Rc::new(RefCell::new(HashMap::new()));

    let mut visitor = {
        let deps = deps.clone();

        move |nonterminal: &'a Expression, expr: &'a Expression| {
            let mut deps = deps.borrow_mut();
            let sub_deps = deps.entry(nonterminal.clone()).or_insert(HashSet::new());

            if let Expression::Nonterminal(_) = expr {
                sub_deps.insert(expr.clone());
            }
        }
    };

    traverse_ast(ast, Some(&mut visitor));

    deps.take()
}

pub fn topological_sort<'a>(ast: &AST<'a>, deps: &Dependencies<'a>) -> AST<'a> {
    let mut order = deps
        .iter()
        .map(|(expr, sub_deps)| {
            let len: usize = sub_deps
                .iter()
                .map(|sub_name| {
                    if let Some(sub_deps) = deps.get(sub_name) {
                        return sub_deps.len();
                    }
                    0
                })
                .sum();
            (expr, len)
        })
        .collect::<Vec<_>>();
    order.sort_by(|(_, a), (_, b)| a.cmp(b));

    let mut new_ast = AST::new();
    for (expr, _) in order {
        let name = get_nonterminal_name(expr);
        if let Some(expr) = ast.get(name) {
            new_ast.insert(name.to_string(), expr.clone());
        }
    }

    new_ast
}

pub fn calculate_acyclic_deps<'a>(deps: &'a Dependencies<'a>) -> Dependencies<'a> {
    fn is_acyclic<'a, 'b>(
        expr: &'a Expression,
        deps: &'a Dependencies<'a>,
        visited: &'b mut HashSet<&'a Expression<'a>>,
    ) -> bool
    where
        'a: 'b,
    {
        if visited.contains(expr) {
            return false;
        }

        visited.insert(expr);

        if let Some(sub_deps) = deps.get(expr) {
            for sub_name in sub_deps {
                if !is_acyclic(sub_name, deps, visited) {
                    return false;
                }
            }
            true
        } else {
            true
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
    default_parsers: &'a HashMap<&'a str, GeneratedParser<'a>>,
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
        Expression::Nonterminal(Token { value, .. }) => {
            if let Some(parser) = default_parsers.get(value) {
                return parser.ty.clone();
            }
            parse_quote!(#boxed_enum_ident)
        }
        Expression::Regex(_) => parse_quote!(::parse_that::Span<'a>),

        Expression::Group(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            calculate_parser_type(inner_expr, boxed_enum_ident, default_parsers, cache)
        }

        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_type =
                calculate_parser_type(inner_expr, boxed_enum_ident, default_parsers, cache);

            if type_is_span(&inner_type) {
                return inner_type;
            }
            parse_quote!(Option<#inner_type>)
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            calculate_parser_type(inner_expr, boxed_enum_ident, default_parsers, cache)
        }
        Expression::Many(inner_expr) | Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_type =
                calculate_parser_type(inner_expr, boxed_enum_ident, default_parsers, cache);

            if type_is_span(&inner_type) {
                return inner_type;
            }
            parse_quote!(Vec<#inner_type>)
        }
        Expression::Skip(left_expr, _) => {
            let left_expr = get_inner_expression(left_expr);
            let left_type =
                calculate_parser_type(left_expr, boxed_enum_ident, default_parsers, cache);
            return left_type;
        }

        Expression::Next(_, right_expr) => {
            let right_expr = get_inner_expression(right_expr);
            let right_type =
                calculate_parser_type(right_expr, boxed_enum_ident, default_parsers, cache);
            return right_type;
        }
        Expression::Minus(left_expr, _) => {
            let left_expr = get_inner_expression(left_expr);
            let left_type =
                calculate_parser_type(left_expr, boxed_enum_ident, default_parsers, cache);
            return left_type;
        }

        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);

            let tys = inner_exprs
                .iter()
                .map(|expr| calculate_parser_type(expr, boxed_enum_ident, default_parsers, cache))
                .collect::<Vec<_>>();

            if tys.iter().all(type_is_span) || tys.len() == 1 {
                return tys[0].clone();
            }
            parse_quote!((#(#tys),*))
        }

        Expression::Alternation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);

            let tys = inner_exprs
                .iter()
                .map(|expr| calculate_parser_type(expr, boxed_enum_ident, default_parsers, cache))
                .collect::<Vec<_>>();

            let is_all_span = tys.iter().all(type_is_span);
            let is_all_same = tys
                .iter()
                .all(|ty| ty.to_token_stream().to_string() == tys[0].to_token_stream().to_string());

            if is_all_span || is_all_same {
                return tys[0].clone();
            } else {
                parse_quote!(#boxed_enum_ident)
            }
        }

        Expression::ProductionRule(_, rhs, mapper_expr) => {
            if let Some(box Expression::MapperExpression(Token { value, .. })) = mapper_expr {
                let parsed = syn::parse_str::<syn::ExprClosure>(value).unwrap();
                let syn::ReturnType::Type(_, ty) = &parsed.output  else {
                    panic!("Mapper expression must have a return type");
                };

                return ty.as_ref().clone();
            }
            calculate_parser_type(rhs, boxed_enum_ident, default_parsers, cache)
        }

        _ => panic!("Unimplemented expression type"),
    };
    cache.insert(expr, ty.clone());
    ty
}

pub type NonterminalTypeMap = IndexMap<String, Type>;

pub const MAX_AST_ITERATIONS: usize = 1000;

pub fn needs_boxing(expr: &Expression, deps: &Dependencies) -> bool {
    if let Some(_sub_deps) = deps.get(expr) {
        if deps.values().any(|v| v.contains(expr)) {
            return true;
        }
    }
    false
}

pub fn calculate_nonterminal_types<'a>(
    ast: &'a AST,
    deps: &'a Dependencies<'a>,
    acyclic_deps: &'a Dependencies<'a>,
    boxed_enum_ident: &Type,
    default_parsers: &'a HashMap<&'a str, GeneratedParser<'a>>,
) -> (HashMap<String, Type>, HashMap<&'a Expression<'a>, Type>) {
    let mut generated_types: HashMap<&Expression, Type> = HashMap::new();
    let mut cache: HashMap<&Expression, Type> = HashMap::new();

    loop {
        let t_generated_types: HashMap<_, _> = ast
            .iter()
            .map(|(_, expr)| {
                let Expression::ProductionRule(lhs, ..) = expr else {
                    panic!("Expected production rule");
                };

                let mut boxed_types = HashMap::new();

                if !acyclic_deps.contains_key(lhs) {
                    if let Some(deps) = deps.get(lhs) {
                        for dep in deps.iter().filter(|dep| acyclic_deps.contains_key(*dep)) {
                            if boxed_types.contains_key(dep) {
                                continue;
                            }

                            if let Some(ty) = cache.get(dep) {
                                if let Some(_sub_deps) = acyclic_deps.get(dep) {
                                    boxed_types.insert(dep, ty.clone());
                                    cache.insert(dep, boxed_enum_ident.clone());
                                }
                            }
                        }
                    }
                }

                let ty = calculate_parser_type(expr, boxed_enum_ident, default_parsers, &mut cache);

                for (expr, ty) in boxed_types {
                    cache.insert(expr, ty);
                }

                (lhs.as_ref(), ty)
            })
            .collect();

        cache = t_generated_types
            .iter()
            .filter(|(expr, _)| acyclic_deps.contains_key(*expr))
            .map(|(expr, ty)| (*expr, ty.clone()))
            .collect();

        if t_generated_types.iter().all(|(k, v)| {
            if let Some(v2) = generated_types.get(k) {
                v.to_token_stream().to_string() == v2.to_token_stream().to_string()
            } else {
                false
            }
        }) {
            break;
        } else {
            generated_types = t_generated_types;
        }
    }

    let generated_types = generated_types
        .into_iter()
        .map(|(k, v)| (get_nonterminal_name(k).to_owned(), v))
        .collect();

    (generated_types, cache)
}

pub fn check_for_sep_by<'a, 'b>(
    expr: &'a Expression<'a>,
    boxed_enum_ident: &Type,
    default_parsers: &'a HashMap<&'a str, GeneratedParser<'a>>,
    cache: &'b mut HashMap<&'a Expression<'a>, TokenStream>,
    type_cache: &'b mut HashMap<&'a Expression<'a>, Type>,
) -> Option<TokenStream>
where
    'a: 'b,
{
    match expr {
        Expression::Group(box Token { value, .. }) => {
            check_for_sep_by(value, boxed_enum_ident, default_parsers, cache, type_cache)
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

            let left_parser = generate_parser_from_ast(
                left_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let right_parser = generate_parser_from_ast(
                right_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );

            let left_type =
                calculate_parser_type(left_expr, boxed_enum_ident, default_parsers, type_cache);
            let right_type =
                calculate_parser_type(right_expr, boxed_enum_ident, default_parsers, type_cache);

            if type_is_span(&left_type) && type_is_span(&right_type) {
                Some(quote! {
                    #left_parser.sep_by_span(#right_parser, ..)
                })
            } else {
                Some(quote! {
                    #left_parser.sep_by(#right_parser, ..)
                })
            }
        }
        _ => None,
    }
}

pub fn check_for_wrapped<'a, 'b>(
    left_expr: &'a Expression<'a>,
    right_expr: &'a Expression<'a>,
    boxed_enum_ident: &Type,
    default_parsers: &'a HashMap<&'a str, GeneratedParser<'a>>,
    cache: &'b mut HashMap<&'a Expression<'a>, TokenStream>,
    type_cache: &'b mut HashMap<&'a Expression<'a>, Type>,
) -> Option<TokenStream>
where
    'a: 'b,
{
    match left_expr {
        Expression::Group(box Token { value, .. }) => check_for_wrapped(
            left_expr,
            value,
            boxed_enum_ident,
            default_parsers,
            cache,
            type_cache,
        ),
        Expression::Next(left_expr, middle_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let middle_expr = get_inner_expression(middle_expr);

            let left_parser = generate_parser_from_ast(
                left_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let middle_parser = generate_parser_from_ast(
                middle_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let right_parser = generate_parser_from_ast(
                right_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );

            let left_type =
                calculate_parser_type(left_expr, boxed_enum_ident, default_parsers, type_cache);
            let middle_type =
                calculate_parser_type(middle_expr, boxed_enum_ident, default_parsers, type_cache);
            let right_type =
                calculate_parser_type(right_expr, boxed_enum_ident, default_parsers, type_cache);

            if type_is_span(&left_type) && type_is_span(&middle_type) && type_is_span(&right_type) {
                Some(quote! {
                    #middle_parser.wrap_span(#left_parser, #right_parser)
                })
            } else {
                Some(quote! {
                    #middle_parser.wrap(#left_parser, #right_parser)
                })
            }
        }
        _ => None,
    }
}

pub fn check_for_any_span(exprs: &[Expression]) -> Option<TokenStream> {
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

        Some(quote! {
            ::parse_that::any_span(&[#(#literal_arr),*])
        })
    } else {
        None
    }
}

pub fn generate_parser_from_ast<'a, 'b>(
    expr: &'a Expression<'a>,
    boxed_enum_ident: &Type,
    default_parsers: &'a HashMap<&'a str, GeneratedParser<'a>>,
    cache: &'b mut HashMap<&'a Expression<'a>, TokenStream>,
    type_cache: &'b mut HashMap<&'a Expression<'a>, Type>,
) -> TokenStream
where
    'a: 'b,
{
    if let Some(parser) = cache.get(expr) {
        return parser.clone();
    }

    match expr {
        Expression::Literal(token) => {
            let value = token.value;
            quote! { ::parse_that::string_span(#value) }
        }
        Expression::Nonterminal(Token { value, .. }) => {
            if let Some(parser) = default_parsers.get(value) {
                return parser.parser.clone();
            }
            let ident = syn::Ident::new(value, proc_macro2::Span::call_site());
            quote! { Self::#ident() }
        }
        Expression::Regex(token) => {
            let regex_str = token.value;
            quote! { ::parse_that::regex_span(#regex_str) }
        }
        Expression::Group(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            generate_parser_from_ast(
                inner_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            )
        }
        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = generate_parser_from_ast(
                inner_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let ty =
                calculate_parser_type(inner_expr, boxed_enum_ident, default_parsers, type_cache);

            if type_is_span(&ty) {
                return quote! { #parser.opt_span() };
            }
            quote! { #parser.opt() }
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = generate_parser_from_ast(
                inner_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );

            quote! { #parser.trim_whitespace() }
        }
        Expression::Many(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);

            if let Some(parser) = check_for_sep_by(
                inner_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            ) {
                return parser;
            }

            let parser = generate_parser_from_ast(
                inner_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let ty =
                calculate_parser_type(inner_expr, boxed_enum_ident, default_parsers, type_cache);

            if type_is_span(&ty) {
                return quote! { #parser.many_span(..) };
            }
            quote! { #parser.many(..) }
        }
        Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = generate_parser_from_ast(
                inner_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let ty =
                calculate_parser_type(inner_expr, boxed_enum_ident, default_parsers, type_cache);

            if type_is_span(&ty) {
                return quote! { #parser.many_span(1..) };
            }
            quote! { #parser.many(1..) }
        }
        Expression::Skip(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            if let Some(parser) = check_for_wrapped(
                left_expr,
                right_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            ) {
                return parser;
            }

            let left_parser = generate_parser_from_ast(
                left_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let right_parser = generate_parser_from_ast(
                right_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );

            quote! { #left_parser.skip(#right_parser) }
        }
        Expression::Next(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser = generate_parser_from_ast(
                left_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let right_parser = generate_parser_from_ast(
                right_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );

            quote! { #left_parser.next(#right_parser) }
        }

        Expression::Minus(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);

            let left_parser = generate_parser_from_ast(
                left_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );
            let right_parser = generate_parser_from_ast(
                right_expr,
                boxed_enum_ident,
                default_parsers,
                cache,
                type_cache,
            );

            quote! { #left_parser.not(#right_parser) }
        }

        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            let ty = calculate_parser_type(expr, boxed_enum_ident, default_parsers, type_cache);
            let is_span = type_is_span(&ty);

            let mut acc = None;
            for (n, parser) in inner_exprs
                .iter()
                .map(|expr| {
                    generate_parser_from_ast(
                        expr,
                        boxed_enum_ident,
                        default_parsers,
                        cache,
                        type_cache,
                    )
                })
                .enumerate()
            {
                acc = match acc {
                    None => Some(parser),
                    Some(acc) => {
                        if is_span {
                            Some(quote! { #acc.then_span( #parser ) })
                        } else if n > 1 {
                            Some(quote! { #acc.then_flat( #parser ) })
                        } else {
                            Some(quote! { #acc.then( #parser ) })
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
                .map(|expr| {
                    generate_parser_from_ast(
                        expr,
                        boxed_enum_ident,
                        default_parsers,
                        cache,
                        type_cache,
                    )
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

        Expression::ProductionRule(_lhs, rhs, mapper_expr) => {
            let parser =
                generate_parser_from_ast(rhs, boxed_enum_ident, default_parsers, cache, type_cache);

            if let Some(box Expression::MapperExpression(Token { value, .. })) = mapper_expr {
                let parsed = syn::parse_str::<syn::ExprClosure>(value).unwrap();
                quote! { #parser.map(#parsed) }
            } else {
                parser
            }
        }

        _ => unimplemented!("Expression not implemented: {:?}", expr),
    }
}
