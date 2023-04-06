use std::{
    cell::RefCell,
    collections::{HashMap, HashSet},
    rc::Rc,
};

use crate::grammar::*;
use pretty::Doc;
use proc_macro2::TokenStream;
use quote::{format_ident, quote, ToTokens};
use syn::{parse_quote, Type};

#[derive(Clone, Debug, Default)]
pub struct ParserAttributes {
    pub paths: Vec<std::path::PathBuf>,
    pub ignore_whitespace: bool,
    pub debug: bool,
    pub use_string: bool,
}

pub struct GeneratedNonterminalParser {
    pub name: String,
    pub ty: String,
    pub parser: String,
}

impl GeneratedNonterminalParser {
    pub fn new(name: impl Into<String>, ty: impl Into<String>, parser: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            ty: ty.into(),
            parser: parser.into(),
        }
    }
}

pub struct GeneratedGrammarAttributes<'a> {
    pub ast: &'a AST<'a>,

    pub deps: &'a Dependencies<'a>,
    pub non_acyclic_deps: &'a Dependencies<'a>,
    pub acyclic_deps: &'a Dependencies<'a>,
    pub ident: &'a syn::Ident,

    pub enum_ident: &'a syn::Ident,
    pub boxed_enum_type: &'a Type,

    pub parser_container_attrs: &'a ParserAttributes,
}

lazy_static::lazy_static! {
     static ref  DEFAULT_PARSERS: HashMap<&'static str, GeneratedNonterminalParser> = {
        let mut default_parsers = HashMap::new();

        let name = "LITERAL";
        default_parsers.insert(
            name,
            GeneratedNonterminalParser::new(
                name,
                "::parse_that::Span<'a>",
                "::parse_that::parse::string_span")
        );

        let name = "REGEX";
        default_parsers.insert(
            name,
            GeneratedNonterminalParser::new(
                name,
                "::parse_that::Span<'a>",
                "::parse_that::parse::regex_span")
        );

        let name = "NUMBER";
        default_parsers.insert(
            name,
            GeneratedNonterminalParser::new(
                name,
                "::parse_that::Span<'a>",
                "::parse_that::parsers::utils::number_span()",
            ),
        );

        let name = "DOUBLE_QUOTED_STRING";
        default_parsers.insert(
            name,
            GeneratedNonterminalParser::new(
                name,
                "::parse_that::Span<'a>",
                 r##":parse_that::parsers::utils::quoted_span(r#"""#)"##,
            ),
        );

        default_parsers
    };
}

fn get_inner_expression<'a, T>(inner_expr: &'a Box<Token<'a, T>>) -> &'a T {
    &inner_expr.as_ref().value
}

pub fn get_nonterminal_name<'a>(expr: &'a Expression<'a>) -> Option<&'a str> {
    if let Expression::Nonterminal(Token { value, .. }) = expr {
        Some(value)
    } else {
        None
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

pub fn calculate_non_acyclic_deps<'a>(
    deps: &'a Dependencies<'a>,
    acyclic_deps: &'a Dependencies,
) -> Dependencies<'a> {
    deps.iter()
        .filter(|(lhs, _)| !acyclic_deps.contains_key(*lhs))
        .map(|(lhs, deps)| (lhs.clone(), deps.clone()))
        .collect()
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
        let Some(name) = get_nonterminal_name(expr) else {
            continue;
        };
        if let Some(expr) = ast.get(name) {
            new_ast.insert(name.to_string(), expr.clone());
        }
    }

    new_ast
}

pub type TypeCache<'a> = HashMap<&'a Expression<'a>, Type>;

pub fn calculate_expression_type<'a, 'b>(
    expr: &'a Expression<'a>,
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    cache: &'b mut TypeCache<'a>,
) -> Type
where
    'a: 'b,
{
    fn get_and_parse_default_parser_ty<'a>(
        name: &str,
        grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    ) -> Option<Type> {
        let Some(GeneratedNonterminalParser { ty, ..}) = DEFAULT_PARSERS.get(name) else {
            return None;
        };
        let Ok(ty) = syn::parse_str::<Type>(ty) else {
            return None;
        };
        if grammar_attrs.parser_container_attrs.use_string && type_is_span(&ty) {
            Some(parse_quote! { &'a str })
        } else {
            Some(ty)
        }
    }

    if let Some(ty) = cache.get(expr) {
        return ty.clone();
    }

    let ty = match expr {
        Expression::Literal(_) => {
            get_and_parse_default_parser_ty("LITERAL", grammar_attrs).unwrap()
        }
        Expression::Regex(_) => get_and_parse_default_parser_ty("REGEX", grammar_attrs).unwrap(),
        Expression::Epsilon(_) => parse_quote!(()),
        Expression::Nonterminal(Token { value, .. }) => {
            if let Some(ty) = get_and_parse_default_parser_ty(value, grammar_attrs) {
                ty
            } else {
                grammar_attrs.boxed_enum_type.clone()
            }
        }
        Expression::Group(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            calculate_expression_type(inner_expr, grammar_attrs, cache)
        }

        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_type = calculate_expression_type(inner_expr, grammar_attrs, cache);

            if type_is_span(&inner_type) {
                return inner_type;
            }
            parse_quote!(Option<#inner_type>)
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            calculate_expression_type(inner_expr, grammar_attrs, cache)
        }
        Expression::Many(inner_expr) | Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_type = calculate_expression_type(inner_expr, grammar_attrs, cache);

            if type_is_span(&inner_type) {
                return inner_type;
            }
            parse_quote!(Vec<#inner_type>)
        }
        Expression::Skip(left_expr, _) => {
            let left_expr = get_inner_expression(left_expr);
            let left_type = calculate_expression_type(left_expr, grammar_attrs, cache);
            return left_type;
        }

        Expression::Next(_, right_expr) => {
            let right_expr = get_inner_expression(right_expr);
            let right_type = calculate_expression_type(right_expr, grammar_attrs, cache);
            return right_type;
        }
        Expression::Minus(left_expr, _) => {
            let left_expr = get_inner_expression(left_expr);
            let left_type = calculate_expression_type(left_expr, grammar_attrs, cache);
            return left_type;
        }

        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);

            let tys = inner_exprs
                .iter()
                .map(|expr| calculate_expression_type(expr, grammar_attrs, cache))
                .collect::<Vec<_>>();

            let mut span_counter = 0;
            let mut non_span_counter = 0;

            let mut new_tys = Vec::new();

            for ty in tys.iter() {
                if type_is_span(ty) {
                    span_counter += 1;
                    non_span_counter = 0;
                } else {
                    span_counter = 0;
                    non_span_counter += 1;
                }

                if span_counter == 1 {
                    new_tys.push(parse_quote!(::parse_that::Span<'a>));
                } else if non_span_counter > 0 {
                    new_tys.push(ty.clone());
                }
            }

            if new_tys.len() == 1 {
                return new_tys[0].clone();
            }

            parse_quote!((#(#new_tys),*))
        }

        Expression::Alternation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);

            let tys = inner_exprs
                .iter()
                .map(|expr| calculate_expression_type(expr, grammar_attrs, cache))
                .collect::<Vec<_>>();

            let is_all_span = tys.iter().all(type_is_span);
            let is_all_same = tys
                .iter()
                .all(|ty| ty.to_token_stream().to_string() == tys[0].to_token_stream().to_string());

            if is_all_span || is_all_same {
                tys[0].clone()
            } else {
                grammar_attrs.boxed_enum_type.clone()
            }
        }

        Expression::ProductionRule(_, rhs, mapper_fn) => {
            if let Some(box Expression::MappingFn(Token { value, .. })) = mapper_fn {
                let Ok(mapper_fn) = syn::parse_str::<syn::ExprClosure>(value) else {
                    panic!("Mapper expression must be a closure");
                };
                let syn::ReturnType::Type(_, ty) = &mapper_fn.output else {
                    panic!("Mapper expression must have a return type");
                };
                return ty.as_ref().clone();
            }

            calculate_expression_type(rhs, grammar_attrs, cache)
        }

        _ => panic!("Unimplemented expression type {:?}", expr),
    };

    cache.insert(expr, ty.clone());
    ty
}

pub fn calculate_nonterminal_types<'a>(
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
) -> (TypeCache<'a>, TypeCache<'a>) {
    struct Caches<'a> {
        cache: TypeCache<'a>,
        boxed_types_cache: TypeCache<'a>,
    }

    fn box_deps_types<'a>(
        lhs: &'a Expression<'a>,
        grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
        Caches {
            cache,
            boxed_types_cache,
        }: &mut Caches<'a>,
    ) {
        if grammar_attrs.acyclic_deps.contains_key(lhs) {
            return;
        }
        let Some(deps) = grammar_attrs.deps.get(lhs) else {
            return;
        };

        for dep in deps
            .iter()
            .filter(|dep| grammar_attrs.acyclic_deps.contains_key(*dep))
        {
            if boxed_types_cache.contains_key(dep) {
                continue;
            }

            if let Some(ty) = cache.get(dep) {
                if let Some(_sub_deps) = grammar_attrs.acyclic_deps.get(dep) {
                    boxed_types_cache.insert(dep, ty.clone());
                    cache.insert(dep, grammar_attrs.boxed_enum_type.clone());
                }
            }
        }
    }

    fn reset_boxed_types(
        Caches {
            cache,
            boxed_types_cache,
        }: &mut Caches,
    ) {
        for (expr, ty) in boxed_types_cache.iter() {
            cache.insert(expr, ty.clone());
        }
        boxed_types_cache.clear();
    }

    let mut caches = Caches {
        cache: TypeCache::new(),
        boxed_types_cache: TypeCache::new(),
    };

    let mut generated_types = TypeCache::new();

    loop {
        let t_generated_types: HashMap<_, _> = grammar_attrs
            .ast
            .iter()
            .map(|(_, expr)| {
                let Expression::ProductionRule(lhs, ..) = expr else {
                    panic!("Expected production rule");
                };

                box_deps_types(lhs, grammar_attrs, &mut caches);

                let ty = calculate_expression_type(expr, grammar_attrs, &mut caches.cache);

                reset_boxed_types(&mut caches);

                (lhs.as_ref(), ty)
            })
            .collect();

        let changed = t_generated_types.iter().all(|(k, v)| {
            if let Some(v2) = generated_types.get(k) {
                v.to_token_stream().to_string() == v2.to_token_stream().to_string()
            } else {
                false
            }
        });
        if changed {
            return (t_generated_types, caches.cache);
        }

        generated_types = t_generated_types;
        caches.cache = generated_types
            .iter()
            .filter(|(expr, _)| grammar_attrs.acyclic_deps.contains_key(*expr))
            .map(|(expr, ty)| (*expr, ty.clone()))
            .collect();
    }
}

pub fn box_generated_parser(
    expr: &Expression,
    parser: &proc_macro2::TokenStream,
    enum_ident: &syn::Ident,
) -> proc_macro2::TokenStream {
    let Some(name) = get_nonterminal_name(expr) else {
        return parser.clone();
    };
    let ident = format_ident!("{}", name);

    quote! {
        #parser.map(|x| Box::new( #enum_ident::#ident( x ) ) )
    }
}

pub fn format_parser(
    expr: &Expression,
    parser: &proc_macro2::TokenStream,
    parser_container_attrs: &ParserAttributes,
) -> proc_macro2::TokenStream {
    let mut parser = parser.clone();

    if parser_container_attrs.ignore_whitespace {
        parser = quote! {
            #parser.trim_whitespace()
        };
    }
    if parser_container_attrs.debug {
        let Some(name) = get_nonterminal_name(expr) else {
            panic!("Expected nonterminal name");
        };
        parser = quote! {
            #parser.debug(#name)
        };
    }

    parser
}

pub type GeneratedParserCache<'a> = HashMap<&'a Expression<'a>, proc_macro2::TokenStream>;
pub type InlineCache<'a, 'b> = HashMap<&'a Expression<'a>, &'b Expression<'a>>;

pub struct CacheBundle<'a, 'b>
where
    'a: 'b,
{
    pub parser_cache: Rc<RefCell<GeneratedParserCache<'a>>>,
    pub type_cache: Rc<RefCell<TypeCache<'a>>>,

    pub inline_cache: Rc<RefCell<InlineCache<'a, 'b>>>,
}

pub fn calculate_nonterminal_generated_parsers<'a, 'b>(
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    parser_container_attrs: &ParserAttributes,
    type_cache: &'b mut TypeCache<'a>,
    max_inline_iterations: usize,
) -> GeneratedParserCache<'a>
where
    'a: 'b,
{
    // fn box_deps_parsers<'a>(
    //     lhs: &'a Expression<'a>,
    //     grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    //     Caches {
    //         cache,
    //         boxed_parsers_cache,
    //         type_cache,
    //         boxed_types_cache,
    //         ..
    //     }: &mut Caches<'a, '_>,
    // ) {
    //     if grammar_attrs.acyclic_deps.contains_key(lhs) {
    //         return;
    //     }

    //     let Some(deps) = grammar_attrs.deps.get(lhs) else {
    //         return;
    //     };

    //     for dep in deps
    //         .iter()
    //         .filter(|dep| grammar_attrs.acyclic_deps.contains_key(*dep))
    //     {
    //         if boxed_parsers_cache.contains_key(dep) {
    //             continue;
    //         }

    //         if let Some(parser) = cache.get(dep) {
    //             if let Some(_sub_deps) = grammar_attrs.acyclic_deps.get(dep) {
    //                 let boxed_parser = box_generated_parser(dep, parser, grammar_attrs.enum_ident);

    //                 boxed_parsers_cache.insert(dep, parser.clone());
    //                 cache.insert(dep, boxed_parser);

    //                 if let Some(boxed_type) = type_cache.get(dep) {
    //                     boxed_types_cache.insert(dep, boxed_type.clone());
    //                     type_cache.insert(dep, grammar_attrs.boxed_enum_type.clone());
    //                 }
    //             }
    //         }
    //     }
    // }

    // fn box_non_acyclic_deps_parsers<'a>(
    //     grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    //     Caches {
    //         cache,
    //         boxed_parsers_cache,
    //         ..
    //     }: &mut Caches<'a, '_>,
    // ) {
    //     for dep in grammar_attrs.non_acyclic_deps.keys() {
    //         if let Some(parser) = cache.get(dep) {
    //             let boxed_parser = box_generated_parser(dep, parser, grammar_attrs.enum_ident);
    //             boxed_parsers_cache.insert(dep, parser.clone());
    //             cache.insert(dep boxed_parser);
    //         }
    //     }
    // }

    // fn reset_boxed_parsers(
    //     Caches {
    //         cache,
    //         boxed_parsers_cache,
    //         type_cache,
    //         boxed_types_cache,
    //         ..
    //     }: &mut Caches<'_, '_>,
    // ) {
    //     for (expr, parser) in boxed_parsers_cache.iter() {
    //         cache.insert(expr, parser.clone());
    //     }
    //     boxed_parsers_cache.clear();

    //     for (expr, ty) in boxed_types_cache.iter() {
    //         type_cache.insert(expr, ty.clone());
    //     }
    //     boxed_types_cache.clear();
    // }

    // let mut caches = Caches {
    //     cache: HashMap::new(),
    //     // boxed_parsers_cache: GeneratedParserCache::new(),

    //     // type_cache,
    //     // boxed_types_cache: TypeCache::new(),
    // };

    // let mut parser_cache = HashMap::new();
    // let mut type_cache = type_cache.clone();

    // let mut inline_cache = HashMap::new();

    let cache = CacheBundle {
        parser_cache: Rc::new(RefCell::new(HashMap::new())),
        type_cache: Rc::new(RefCell::new(type_cache.clone())),
        inline_cache: Rc::new(RefCell::new(HashMap::new())),
    };

    let mut generated_parsers = GeneratedParserCache::new();
    let mut i = 0;
    let mut do_recursive_inlining = false;

    let tmp: HashMap<_, _> = grammar_attrs
        .ast
        .iter()
        .map(|(_, expr)| {
            let Expression::ProductionRule(lhs, rhs, ..) = expr else {
            panic!("Expected production rule");
        };

            (lhs.as_ref().clone(), rhs.as_ref().clone())
        })
        .collect();

    for (k, v) in tmp.iter() {
        cache.inline_cache.borrow_mut().insert(k, v);
    }

    loop {
        let t_generated_parsers: HashMap<_, _> = grammar_attrs
            .ast
            .iter()
            .map(|(_, expr)| {
                let Expression::ProductionRule(lhs, ..) = expr else {
                    panic!("Expected production rule");
                };

                // if do_recursive_inlining {
                //     box_non_acyclic_deps_parsers(grammar_attrs, &mut caches);
                // }
                // box_deps_parsers(lhs, grammar_attrs, &mut caches);

                // inline_cache.remove(expr);
                // inline_cache.remove(lhs.as_ref());

                let parser = calculate_parser_from_expression(expr, grammar_attrs, &cache);

                // if let Some(deps) = grammar_attrs.acyclic_deps.get(lhs) {
                //     for dep in deps {
                //         inline_cache.remove(dep);
                //     }
                // }

                // reset_boxed_parsers(&mut caches);

                (lhs.as_ref(), parser)
            })
            .collect();

        let not_changed = t_generated_parsers.iter().all(|(k, v)| {
            if let Some(v2) = generated_parsers.get(k) {
                v.to_string() == v2.to_string()
            } else {
                false
            }
        });

        if not_changed {
            break;
        }

        // if not_changed {
        //     do_recursive_inlining = true;
        // }
        // if do_recursive_inlining {
        //     i += 1;
        // }
        // if i == max_inline_iterations {
        //     break;
        // }

        //     generated_parsers = t_generated_parsers;
        //     caches.cache = generated_parsers
        //         .iter()
        //         .filter(|(expr, _)| {
        //             do_recursive_inlining || grammar_attrs.acyclic_deps.contains_key(*expr)
        //         })
        //         .map(|(expr, parser)| (*expr, format_parser(expr, parser, parser_container_attrs)))
        //         .collect();

        //     i += 1;
    }

    generated_parsers
}

// pub fn check_for_sep_by<'a, 'b>(
//     expr: &'a Expression<'a>,
//     grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
//     cache: &'b mut GeneratedParserCache<'a>,
//     type_cache: &'b mut TypeCache<'a>,
// ) -> Option<TokenStream>
// where
//     'a: 'b,
// {
//     match expr {
//         Expression::Group(box Token { value, .. }) => {
//             check_for_sep_by(value, grammar_attrs, cache, type_cache)
//         }
//         Expression::Skip(
//             left_expr,
//             box Token {
//                 value: Expression::Optional(right_expr),
//                 ..
//             },
//         ) => {
//             let left_expr = get_inner_expression(left_expr);
//             let right_expr = get_inner_expression(right_expr);

//             let left_parser =
//                 calculate_parser_from_expression(left_expr, grammar_attrs, cache, type_cache);
//             let right_parser =
//                 calculate_parser_from_expression(right_expr, grammar_attrs, cache, type_cache);

//             let left_type = calculate_expression_type(left_expr, grammar_attrs, type_cache);
//             let right_type = calculate_expression_type(right_expr, grammar_attrs, type_cache);

//             if type_is_span(&left_type) && type_is_span(&right_type) {
//                 Some(quote! {
//                     #left_parser.sep_by_span(#right_parser, ..)
//                 })
//             } else {
//                 Some(quote! {
//                     #left_parser.sep_by(#right_parser, ..)
//                 })
//             }
//         }
//         _ => None,
//     }
// }

// pub fn check_for_wrapped<'a, 'b>(
//     left_expr: &'a Expression<'a>,
//     right_expr: &'a Expression<'a>,
//     grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
//     cache: &'b mut GeneratedParserCache<'a>,
//     type_cache: &'b mut TypeCache<'a>,
// ) -> Option<TokenStream>
// where
//     'a: 'b,
// {
//     match left_expr {
//         Expression::Group(box Token { value, .. }) => {
//             check_for_wrapped(left_expr, value, grammar_attrs, cache, type_cache)
//         }
//         Expression::Next(left_expr, middle_expr) => {
//             let left_expr = get_inner_expression(left_expr);
//             let middle_expr = get_inner_expression(middle_expr);

//             let left_parser =
//                 calculate_parser_from_expression(left_expr, grammar_attrs, cache, type_cache);
//             let middle_parser =
//                 calculate_parser_from_expression(middle_expr, grammar_attrs, cache, type_cache);
//             let right_parser =
//                 calculate_parser_from_expression(right_expr, grammar_attrs, cache, type_cache);

//             let left_type = calculate_expression_type(left_expr, grammar_attrs, type_cache);
//             let middle_type = calculate_expression_type(middle_expr, grammar_attrs, type_cache);
//             let right_type = calculate_expression_type(right_expr, grammar_attrs, type_cache);

//             if type_is_span(&left_type) && type_is_span(&middle_type) && type_is_span(&right_type) {
//                 Some(quote! {
//                     #middle_parser.wrap_span(#left_parser, #right_parser)
//                 })
//             } else {
//                 Some(quote! {
//                     #middle_parser.wrap(#left_parser, #right_parser)
//                 })
//             }
//         }
//         _ => None,
//     }
// }

// pub fn check_for_any_span(exprs: &[Expression]) -> Option<TokenStream> {
//     let all_literals = exprs
//         .iter()
//         .all(|expr| matches!(expr, Expression::Literal(_)));

//     if all_literals {
//         let literal_arr = exprs
//             .iter()
//             .map(|expr| {
//                 if let Expression::Literal(token) = expr {
//                     token.value
//                 } else {
//                     panic!("Expected literal");
//                 }
//             })
//             .collect::<Vec<_>>();

//         Some(quote! {
//             ::parse_that::any_span(&[#(#literal_arr),*])
//         })
//     } else {
//         None
//     }
// }

// pub fn calculate_concatenation_expression<'a>(
//     inner_exprs: &'a [Expression<'a>],
//     grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
//     cache: &mut GeneratedParserCache<'a>,
//     type_cache: &mut TypeCache<'a>,
//     inline_cache: &'_ TmpCache<'a>,
// ) -> TokenStream {
//     let tys = inner_exprs
//         .iter()
//         .map(|expr| calculate_expression_type(expr, grammar_attrs, type_cache))
//         .collect::<Vec<_>>();

//     let mut chains: Vec<(bool, Vec<TokenStream>)> = Vec::new();

//     for (parser, ty) in inner_exprs
//         .iter()
//         .map(|expr| {
//             calculate_parser_from_expression(expr, grammar_attrs, cache, type_cache, inline_cache)
//         })
//         .zip(tys.iter())
//     {
//         let is_span = type_is_span(ty);

//         if let Some((last_is_span, last_chain)) = chains.last_mut() {
//             if is_span && *last_is_span {
//                 last_chain.push(parser);
//                 continue;
//             }
//         }
//         chains.push((is_span, vec![parser]));
//     }

//     let mut acc = None;
//     for (n, (_, chain)) in chains.iter().enumerate() {
//         let chain_acc = chain.iter().fold(None, |acc, parser| match acc {
//             None => Some(parser.clone()),
//             Some(acc) => Some(quote! { #acc.then_span(#parser) }),
//         });

//         acc = match acc {
//             None => chain_acc,
//             Some(acc) => {
//                 if n > 1 {
//                     Some(quote! { #acc.then_flat(#chain_acc) })
//                 } else {
//                     Some(quote! { #acc.then(#chain_acc) })
//                 }
//             }
//         };
//     }
//     acc.unwrap()
// }

// pub fn calculate_alternation_expression<'a>(
//     inner_exprs: &'a [Expression<'a>],
//     grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
//     cache: &mut GeneratedParserCache<'a>,
//     type_cache: &mut TypeCache<'a>,
//     inline_cache: &'_ TmpCache<'a>,
// ) -> TokenStream {
//     // if let Some(parser) = check_for_any_span(inner_exprs) {
//     //     return map_span_if_needed(parser, true, grammar_attrs);
//     // }
//     let parser = inner_exprs
//         .iter()
//         .map(|expr| {
//             calculate_parser_from_expression(expr, grammar_attrs, cache, type_cache, inline_cache)
//         })
//         .fold(None, |acc, parser| match acc {
//             None => Some(parser),
//             Some(acc) => Some(quote! { #acc | #parser  }),
//         })
//         .unwrap();

//     if inner_exprs.len() > 1 {
//         quote! { ( #parser ) }
//     } else {
//         parser
//     }
// }

pub fn map_span_if_needed<'a>(
    parser: TokenStream,
    is_span: bool,
    GeneratedGrammarAttributes {
        parser_container_attrs,
        ..
    }: &'a GeneratedGrammarAttributes<'a>,
) -> TokenStream {
    if parser_container_attrs.use_string && is_span {
        quote! { #parser.map(|x| x.as_str()) }
    } else {
        parser
    }
}

pub fn calculate_parser_from_expression<'a, 'b>(
    expr: &'a Expression<'a>,
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    cache: &'a CacheBundle<'a, 'b>,
) -> TokenStream
where
    'a: 'b,
{
    fn get_and_parse_default_parser<'a>(
        name: &str,
        args: Option<TokenStream>,
        grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    ) -> Option<TokenStream> {
        let Some(GeneratedNonterminalParser {parser, ty,  ..}) = DEFAULT_PARSERS.get(name) else {
            return None;
        };
        let Ok(ty) = syn::parse_str::<syn::Type>(ty) else {
            return None;
        };

        let parser = syn::parse_str::<syn::Expr>(parser)
            .unwrap()
            .to_token_stream();
        let parser = if let Some(args) = args {
            quote! { #parser(#args) }
        } else {
            parser
        };

        Some(map_span_if_needed(parser, type_is_span(&ty), grammar_attrs))
    }

    if let Some(parser) = cache.parser_cache.borrow().get(expr) {
        return parser.clone();
    }

    if let Some(cached_expr) = cache.inline_cache.borrow().get(expr) {
        return calculate_parser_from_expression(cached_expr, grammar_attrs, cache);
    }

    let parser = match expr {
        Expression::Literal(Token { value, .. }) => {
            get_and_parse_default_parser("LITERAL", Some(quote! {#value}), grammar_attrs).unwrap()
        }
        Expression::Regex(Token { value, .. }) => {
            get_and_parse_default_parser("LITERAL", Some(quote! {#value}), grammar_attrs).unwrap()
        }
        Expression::Nonterminal(Token { value, .. }) => {
            if let Some(parser) = get_and_parse_default_parser(value, None, grammar_attrs) {
                parser
            } else {
                let ident = format_ident!("{}", value);
                quote! { Self::#ident() }
            }
        }
        _ => panic!("Invalid expression: {:?}", expr),
        Expression::Epsilon(_) => quote! { ::parse_that::parse::epsilon() },
        // Expression::MappedExpression((inner_expr, mapper_fn)) => {
        //     let inner_expr = get_inner_expression(inner_expr);
        //     let mapper_fn = get_inner_expression(mapper_fn);

        //     let parser = calculate_parser_from_expression(
        //         inner_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );

        //     if let Expression::MappingFn(Token { value, .. }) = mapper_fn {
        //         let Ok(mapper_fn) = syn::parse_str::<syn::ExprClosure>(value) else  {
        //         panic!("Invalid mapper expression: {}", value);
        //     };
        //         quote! { #parser.map(#mapper_fn) }
        //     } else {
        //         parser
        //     }
        // }

        // Expression::Group(inner_expr) => {
        //     let inner_expr = get_inner_expression(inner_expr);
        //     calculate_parser_from_expression(
        //         inner_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     )
        // }
        // Expression::Optional(inner_expr) => {
        //     let inner_expr = get_inner_expression(inner_expr);
        //     let parser = calculate_parser_from_expression(
        //         inner_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );
        //     let ty = calculate_expression_type(inner_expr, grammar_attrs, type_cache);

        //     if type_is_span(&ty) {
        //         return quote! { #parser.opt_span() };
        //     }
        //     quote! { #parser.opt() }
        // }
        // Expression::OptionalWhitespace(inner_expr) => {
        //     let inner_expr = get_inner_expression(inner_expr);
        //     let parser = calculate_parser_from_expression(
        //         inner_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );

        //     quote! { #parser.trim_whitespace() }
        // }
        // Expression::Many(inner_expr) => {
        //     let inner_expr = get_inner_expression(inner_expr);

        //     // if let Some(parser) = check_for_sep_by(inner_expr, grammar_attrs, cache, type_cache, inline_cache) {
        //     //     return parser;
        //     // }

        //     let parser = calculate_parser_from_expression(
        //         inner_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );
        //     let ty = calculate_expression_type(inner_expr, grammar_attrs, type_cache);

        //     if type_is_span(&ty) {
        //         return quote! { #parser.many_span(..) };
        //     }
        //     quote! { #parser.many(..) }
        // }
        // Expression::Many1(inner_expr) => {
        //     let inner_expr = get_inner_expression(inner_expr);
        //     let parser = calculate_parser_from_expression(
        //         inner_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );
        //     let ty = calculate_expression_type(inner_expr, grammar_attrs, type_cache);

        //     if type_is_span(&ty) {
        //         return quote! { #parser.many_span(1..) };
        //     }
        //     quote! { #parser.many(1..) }
        // }
        // Expression::Skip(left_expr, right_expr) => {
        //     let left_expr = get_inner_expression(left_expr);
        //     let right_expr = get_inner_expression(right_expr);

        //     // if let Some(parser) =
        //     //     check_for_wrapped(left_expr, right_expr, grammar_attrs, cache, type_cache, inline_cache)
        //     // {
        //     //     return parser;
        //     // }

        //     let left_parser = calculate_parser_from_expression(
        //         left_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );
        //     let right_parser = calculate_parser_from_expression(
        //         right_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );

        //     quote! { #left_parser.skip(#right_parser) }
        // }
        // Expression::Next(left_expr, right_expr) => {
        //     let left_expr = get_inner_expression(left_expr);
        //     let right_expr = get_inner_expression(right_expr);

        //     let left_parser = calculate_parser_from_expression(
        //         left_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );
        //     let right_parser = calculate_parser_from_expression(
        //         right_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );

        //     quote! { #left_parser.next(#right_parser) }
        // }
        // Expression::Minus(left_expr, right_expr) => {
        //     let left_expr = get_inner_expression(left_expr);
        //     let right_expr = get_inner_expression(right_expr);

        //     let left_parser = calculate_parser_from_expression(
        //         left_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );
        //     let right_parser = calculate_parser_from_expression(
        //         right_expr,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     );

        //     quote! { #left_parser.not(#right_parser) }
        // }
        // Expression::Concatenation(inner_exprs) => {
        //     let inner_exprs = get_inner_expression(inner_exprs);
        //     calculate_concatenation_expression(
        //         inner_exprs,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     )
        // }
        // Expression::Alternation(inner_exprs) => {
        //     let inner_exprs = get_inner_expression(inner_exprs);
        //     calculate_alternation_expression(
        //         inner_exprs,
        //         grammar_attrs,
        //         cache,
        //         type_cache,
        //         inline_cache,
        //     )
        // }
        //     Expression::ProductionRule(_lhs, rhs, mapper_fn) => {
        //         let parser =
        //             calculate_parser_from_expression(rhs, grammar_attrs, cache, type_cache, inline_cache);

        //         if let Some(box Expression::MappingFn(Token { value, .. })) = mapper_fn {
        //             let Ok(mapper_fn) = syn::parse_str::<syn::ExprClosure>(value) else  {
        //                 panic!("Invalid mapper expression: {}", value);
        //             };
        //             quote! { #parser.map(#mapper_fn) }
        //         } else {
        //             parser
        //         }
        //     }
        //     _ => unimplemented!("Expression not implemented: {:?}", expr),
    };

    cache.parser_cache.borrow_mut().insert(expr, parser.clone());
    parser
}
