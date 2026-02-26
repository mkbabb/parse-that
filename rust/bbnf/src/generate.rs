use crate::grammar::*;
use crate::analysis::{FirstSets, build_dispatch_table};
use proc_macro2::TokenStream;
use quote::{format_ident, quote, ToTokens};
use std::{
    cell::RefCell,
    collections::{HashMap, HashSet},
    rc::Rc,
};
use syn::{parse_quote, Type};

#[derive(Clone, Debug, Default)]
pub struct ParserAttributes {
    pub paths: Vec<std::path::PathBuf>,
    pub ignore_whitespace: bool,
    pub debug: bool,
    pub use_string: bool,
    pub remove_left_recursion: bool,
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

    pub first_sets: Option<&'a FirstSets<'a>>,

    pub ref_counts: Option<&'a HashMap<&'a Expression<'a>, usize>>,
    pub aliases: Option<&'a HashMap<&'a Expression<'a>, &'a Expression<'a>>>,

    /// Rules whose enum variant is elided — their parser returns the inner
    /// variant directly instead of wrapping in `Enum::rule_name(Box<...>)`.
    pub transparent_rules: Option<&'a HashSet<String>>,

    /// Rules whose body can be expressed entirely as a `SpanParser` (no
    /// recursion, no heterogeneous output). Dual methods are generated:
    /// `rule_sp() -> SpanParser` and `rule() -> Parser<Enum>`.
    pub span_eligible_rules: Option<&'a HashSet<String>>,

    pub ident: &'a syn::Ident,
    pub enum_ident: &'a syn::Ident,

    pub enum_type: &'a Type,
    pub boxed_enum_type: &'a Type,

    pub parser_container_attrs: &'a ParserAttributes,
}

static DEFAULT_PARSERS: std::sync::LazyLock<HashMap<&'static str, GeneratedNonterminalParser>> =
    std::sync::LazyLock::new(|| {
        let mut default_parsers = HashMap::new();
        let name = "LITERAL";
        default_parsers.insert(
            name,
            GeneratedNonterminalParser::new(name, "::parse_that::Span<'a>", "::parse_that::parse::string_span"),
        );
        let name = "REGEX";
        default_parsers.insert(
            name,
            GeneratedNonterminalParser::new(name, "::parse_that::Span<'a>", "::parse_that::parse::regex_span"),
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
                r##"::parse_that::parsers::utils::quoted_span(r#"""#)"##,
            ),
        );
        default_parsers
    });

fn get_inner_expression<'a, T>(inner_expr: &'a Token<'a, T>) -> &'a T {
    &inner_expr.value
}

pub fn get_nonterminal_name<'a>(expr: &'a Expression<'a>) -> Option<&'a str> {
    if let Expression::Nonterminal(Token { value, .. }) = expr {
        Some(value)
    } else {
        None
    }
}

fn is_transparent_rule(name: &str, grammar_attrs: &GeneratedGrammarAttributes) -> bool {
    grammar_attrs
        .transparent_rules
        .map_or(false, |set| set.contains(name))
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
            Expression::Rule(rhs, _) => {
                visit(nonterminal, rhs, visitor);
            }
            _ => {}
        }
    }

    let mut visitor_default = |_, _| {};
    let visitor = visitor.unwrap_or(&mut visitor_default);
    ast.into_iter()
        .for_each(|(lhs, rhs)| visit(lhs, rhs, visitor));
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

pub type TypeCache<'a> = HashMap<&'a Expression<'a>, Type>;

pub fn calculate_expression_type<'a>(
    expr: &'a Expression<'a>,
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    cache_bundle: &'a CacheBundle<'a, '_, '_>,
) -> Type {
    fn get_and_parse_default_parser_ty<'a>(
        name: &str,
        grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    ) -> Option<Type> {
        let GeneratedNonterminalParser { ty, .. } = DEFAULT_PARSERS.get(name)?;
        let Ok(ty) = syn:: parse_str::< Type >(ty) else {
            return None;
        };
        if grammar_attrs.parser_container_attrs.use_string && type_is_span(&ty) {
            Some(parse_quote! {
                & 'a str
            })
        } else {
            Some(ty)
        }
    }

    if let Some(ty) = cache_bundle.type_cache.borrow_mut().get(expr) {
        return ty.clone();
    }
    if let Some(cached_expr) = cache_bundle.inline_cache.borrow().get(expr) {
        return calculate_expression_type(cached_expr, grammar_attrs, cache_bundle);
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
            calculate_expression_type(inner_expr, grammar_attrs, cache_bundle)
        }
        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_type = calculate_expression_type(inner_expr, grammar_attrs, cache_bundle);
            if type_is_span(&inner_type) {
                return inner_type;
            }
            parse_quote!(Option < #inner_type >)
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            calculate_expression_type(inner_expr, grammar_attrs, cache_bundle)
        }
        Expression::Many(inner_expr) | Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let inner_type = calculate_expression_type(inner_expr, grammar_attrs, cache_bundle);
            if type_is_span(&inner_type) {
                return inner_type;
            }
            parse_quote!(Vec < #inner_type >)
        }
        Expression::Skip(left_expr, _) => {
            let left_expr = get_inner_expression(left_expr);
            let left_type = calculate_expression_type(left_expr, grammar_attrs, cache_bundle);
            return left_type;
        }
        Expression::Next(_, right_expr) => {
            let right_expr = get_inner_expression(right_expr);
            let right_type = calculate_expression_type(right_expr, grammar_attrs, cache_bundle);
            return right_type;
        }
        Expression::Minus(left_expr, _) => {
            let left_expr = get_inner_expression(left_expr);
            let left_type = calculate_expression_type(left_expr, grammar_attrs, cache_bundle);
            return left_type;
        }
        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            let tys = inner_exprs
                .iter()
                .map(|expr| calculate_expression_type(expr, grammar_attrs, cache_bundle))
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
            parse_quote!((#(#new_tys), *))
        }
        Expression::Alternation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            let tys = inner_exprs
                .iter()
                .map(|expr| calculate_expression_type(expr, grammar_attrs, cache_bundle))
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
        Expression::Rule(rhs, mapping_fn) => {
            if let Some(inner) = mapping_fn {
                if let Expression::MappingFn(Token { value, .. }) = inner.as_ref() {
                    let Ok(mapping_fn) = syn:: parse_str::< syn:: ExprClosure >(value) else {
                        panic!("Mapper expression must be a closure");
                    };
                    let syn:: ReturnType:: Type(_, ty) =& mapping_fn.output else {
                        panic!("Mapper expression must have a return type");
                    };
                    ty.as_ref().clone()
                } else {
                    calculate_expression_type(rhs, grammar_attrs, cache_bundle)
                }
            } else {
                calculate_expression_type(rhs, grammar_attrs, cache_bundle)
            }
        }
        _ => panic!("Unimplemented expression type {:?}", expr),
    };
    cache_bundle
        .type_cache
        .borrow_mut()
        .insert(expr, ty.clone());
    ty
}

pub fn calculate_nonterminal_types<'a>(
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
) -> TypeCache<'a> {
    let cache_bundle = CacheBundle {
        parser_cache: Rc::new(RefCell::new(HashMap::new())),
        type_cache: Rc::new(RefCell::new(HashMap::new())),
        inline_cache: Rc::new(RefCell::new(HashMap::new())),
    };
    grammar_attrs
        .ast
        .iter()
        .filter(|(lhs, _)| grammar_attrs.acyclic_deps.contains_key(lhs))
        .for_each(|(lhs, rhs)| {
            cache_bundle.inline_cache.borrow_mut().insert(lhs, rhs);
        });
    grammar_attrs
        .ast
        .iter()
        .map(|(lhs, rhs)| {
            if !grammar_attrs.acyclic_deps.contains_key(lhs) {
                if let Some(deps) = grammar_attrs.deps.get(lhs) {
                    for dep in deps
                        .iter()
                        .filter(|dep| grammar_attrs.acyclic_deps.contains_key(dep))
                    {
                        cache_bundle
                            .type_cache
                            .borrow_mut()
                            .insert(dep, grammar_attrs.boxed_enum_type.clone());
                    }
                }
                // Maybe this change needs to be rolled back via a cache after calculating the
                // type.
            }
            let ty = calculate_expression_type(rhs, grammar_attrs, &cache_bundle);
            (lhs, ty)
        })
        .collect()
}

pub fn map_generated_parser<'a, 'b>(
    name: &str,
    expr: &Expression<'a>,
    enum_ident: &syn::Ident,
) -> Expression<'b>
where
    'a: 'b,
{
    let ident = format_ident!("{}", name);
    let expr_token = Token::new_without_span(expr.clone());
    let mapping_fn = format!("|x| {enum_ident}::{ident}( x ) ");
    let mapping_fn_token = Token::new_without_span(Expression::MappingFn(Token::new_without_span(
        mapping_fn.into(),
    )));

    Expression::MappedExpression((expr_token.into(), mapping_fn_token.into()))
}

pub fn box_generated_parser<'a, 'b>(
    name: &str,
    expr: &Expression<'a>,
    enum_ident: &syn::Ident,
) -> Expression<'b>
where
    'a: 'b,
{
    let ident = format_ident!("{}", name);
    let expr_token = Token::new_without_span(expr.clone());
    let mapping_fn = format!("|x| {enum_ident}::{ident}(Box::new(x)) ");
    let mapping_fn_token = Token::new_without_span(Expression::MappingFn(Token::new_without_span(
        mapping_fn.into(),
    )));

    Expression::MappedExpression((expr_token.into(), mapping_fn_token.into()))
}

pub fn box_generated_parser2<'a, 'b>(
    name: &str,
    expr: &Expression<'a>,
    enum_ident: &syn::Ident,
) -> Expression<'b>
where
    'a: 'b,
{
    let ident = format_ident!("{}", name);
    let expr_token = Token::new_without_span(expr.clone());
    let mapping_fn = format!("|x| Box::new({enum_ident}::{ident}(x)) ");
    let mapping_fn_token = Token::new_without_span(Expression::MappingFn(Token::new_without_span(
        mapping_fn.into(),
    )));

    Expression::MappedExpression((expr_token.into(), mapping_fn_token.into()))
}

pub fn format_parser<'a, 'b>(
    name: &str,
    expr: &'a Expression<'a>,
    parser_container_attrs: &ParserAttributes,
) -> Expression<'b>
where
    'a: 'b,
{
    let mut expr = expr.clone();
    if parser_container_attrs.ignore_whitespace {
        expr = Expression::OptionalWhitespace(Token::new_without_span(expr).into());
    }
    if parser_container_attrs.debug {
        expr = Expression::DebugExpression((Token::new_without_span(expr).into(), name.into()));
    }
    expr
}

pub type GeneratedParserCache<'a> = HashMap<&'a Expression<'a>, proc_macro2::TokenStream>;
pub type InlineCache<'a, 'b> = HashMap<&'a Expression<'a>, &'b Expression<'a>>;

pub struct CacheBundle<'a, 'b, 'c>
where
    'a: 'b,
    'a: 'c,
    'b: 'c,
{
    pub parser_cache: Rc<RefCell<GeneratedParserCache<'c>>>,
    pub type_cache: Rc<RefCell<TypeCache<'c>>>,
    pub inline_cache: Rc<RefCell<InlineCache<'a, 'b>>>,
}

pub fn calculate_acyclic_deps_degree<'a>(
    acyclic_deps: &'a Dependencies<'a>,
) -> HashMap<&'a Expression<'a>, usize> {
    fn recurse<'a, 'b>(
        expr: &'a Expression<'a>,
        acyclic_deps: &'a Dependencies<'a>,
        degree_map: &'b mut HashMap<&'a Expression<'a>, usize>,
    ) -> usize
    where
        'a: 'b,
    {
        if let Some(degree) = degree_map.get(expr) {
            return *degree;
        }
        let Some(deps) = acyclic_deps.get(expr) else {
            return 0;
        };
        let sum = deps
            .iter()
            .map(|dep| recurse(dep, acyclic_deps, degree_map))
            .sum::<usize>()
            + 1;
        degree_map.insert(expr, sum);
        sum
    }

    let mut degree_map = HashMap::new();
    acyclic_deps.keys().for_each(|expr| {
        recurse(expr, acyclic_deps, &mut degree_map);
    });
    degree_map
}

pub fn calculate_non_acyclic_deps_degree<'a, 'b>(
    non_acyclic_deps: &'a Dependencies<'a>,
    acyclic_deps_degree: &'b mut HashMap<&'a Expression<'a>, usize>,
) where
    'a: 'b,
{
    fn recurse<'a, 'b>(
        expr: &'a Expression<'a>,
        non_acyclic_deps: &'a Dependencies<'a>,
        acyclic_deps_degree: &'b mut HashMap<&'a Expression<'a>, usize>,
    ) -> usize
    where
        'a: 'b,
    {
        if let Some(degree) = acyclic_deps_degree.get(expr) {
            *degree
        } else {
            let Some(deps) = non_acyclic_deps.get(expr) else {
                return 0;
            };
            acyclic_deps_degree.insert(expr, 0);
            let max = deps
                .iter()
                .map(|dep| recurse(dep, non_acyclic_deps, acyclic_deps_degree))
                .max()
                .unwrap_or(0)
                + 1;
            acyclic_deps_degree.insert(expr, max);
            max
        }
    }

    non_acyclic_deps.keys().for_each(|expr| {
        recurse(expr, non_acyclic_deps, acyclic_deps_degree);
    });
}

pub fn calculate_nonterminal_generated_parsers<'a>(
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    type_cache: &'a TypeCache<'a>,
) -> GeneratedParserCache<'a> {
    let cache_bundle = CacheBundle {
        parser_cache: Rc::new(RefCell::new(GeneratedParserCache::new())),
        type_cache: Rc::new(RefCell::new(type_cache.clone())),
        inline_cache: Rc::new(RefCell::new(InlineCache::new())),
    };
    let mut acyclic_deps_degree = calculate_acyclic_deps_degree(grammar_attrs.acyclic_deps);
    calculate_non_acyclic_deps_degree(grammar_attrs.deps, &mut acyclic_deps_degree);

    let formatted = grammar_attrs
        .ast
        .iter()
        .map(|(lhs, rhs)| {
            let rhs = match get_nonterminal_name(lhs) {
                Some(name) => {
                    
                    format_parser(name, rhs, grammar_attrs.parser_container_attrs)
                }
                None => rhs.clone(),
            };
            (lhs.clone(), rhs)
        })
        .collect::<HashMap<_, _>>();

    let mapped: HashMap<_, _> = grammar_attrs
        .ast
        .iter()
        .map(|(lhs, rhs)| {
            let rhs = match get_nonterminal_name(lhs) {
                Some(name) => {
                    let formatted_expr = formatted.get(lhs).unwrap_or(rhs);
                    // Phase B: Transparent rules skip the enum variant wrapper.
                    // The alternation branches already produce the correct inner type.
                    if is_transparent_rule(name, grammar_attrs) {
                        formatted_expr.clone()
                    } else {
                        map_generated_parser(name, formatted_expr, grammar_attrs.enum_ident)
                    }
                }
                None => rhs.clone(),
            };
            (lhs.clone(), rhs)
        })
        .collect();

    let _boxed: HashMap<_, _> = grammar_attrs
        .ast
        .iter()
        .map(|(lhs, rhs)| {
            let rhs = match get_nonterminal_name(lhs) {
                Some(name) => {
                    let formatted_expr = formatted.get(lhs).unwrap_or(rhs);
                    if is_transparent_rule(name, grammar_attrs) {
                        formatted_expr.clone()
                    } else {
                        box_generated_parser(name, formatted_expr, grammar_attrs.enum_ident)
                    }
                }
                None => rhs.clone(),
            };
            (lhs.clone(), rhs)
        })
        .collect();

    let boxed2: HashMap<_, _> = grammar_attrs
        .ast
        .iter()
        .map(|(lhs, rhs)| {
            let rhs = match get_nonterminal_name(lhs) {
                Some(name) => {
                    let formatted_expr = formatted.get(lhs).unwrap_or(rhs);
                    if is_transparent_rule(name, grammar_attrs) {
                        formatted_expr.clone()
                    } else {
                        box_generated_parser2(name, formatted_expr, grammar_attrs.enum_ident)
                    }
                }
                None => rhs.clone(),
            };
            (lhs.clone(), rhs)
        })
        .collect();

    formatted
        .iter()
        .filter(|(lhs, _)| grammar_attrs.acyclic_deps.contains_key(lhs))
        .for_each(|(lhs, rhs)| {
            cache_bundle.inline_cache.borrow_mut().insert(lhs, rhs);
        });

    let generate = |recursive_inline: bool| {
        grammar_attrs
            .ast
            .iter()
            .filter_map(|(lhs, rhs)| {
                let is_acyclic = grammar_attrs.acyclic_deps.contains_key(lhs);

                if !is_acyclic {
                    grammar_attrs
                        .deps
                        .get(lhs)
                        .unwrap()
                        .iter()
                        .filter(|dep| grammar_attrs.acyclic_deps.contains_key(dep))
                        .for_each(|dep| {
                            let rhs = boxed2.get(dep).unwrap_or(dep);
                            cache_bundle.inline_cache.borrow_mut().insert(dep, rhs);
                            cache_bundle
                                .type_cache
                                .borrow_mut()
                                .insert(dep, grammar_attrs.boxed_enum_type.clone());
                        });
                } else if recursive_inline {
                    return None;
                }

                let max_depth = *acyclic_deps_degree.get(lhs).unwrap_or(&1);

                let rhs = mapped.get(lhs).unwrap_or(rhs);

                let parser = calculate_parser_from_expression(
                    rhs,
                    grammar_attrs,
                    &cache_bundle,
                    max_depth,
                    0,
                );
                Some((lhs, parser))
            })
            .collect()
    };
    let mut acyclic_generated_parsers: HashMap<_, _> = generate(false);
    *cache_bundle.parser_cache.borrow_mut() = acyclic_generated_parsers.clone();

    grammar_attrs.ast.iter().for_each(|(lhs, rhs)| {
        let is_acyclic = grammar_attrs.acyclic_deps.contains_key(lhs);

        if !is_acyclic {
            let rhs = boxed2.get(lhs).unwrap_or(rhs);

            acyclic_generated_parsers.remove(lhs);
            cache_bundle.parser_cache.borrow_mut().remove(lhs);
            cache_bundle.inline_cache.borrow_mut().insert(lhs, rhs);
        } else {
            let tmp = cache_bundle.parser_cache.borrow().get(lhs).map(|parser| {
                quote! { #parser.map(Box::new) }
            });
            if let Some(parser) = tmp {
                cache_bundle.parser_cache.borrow_mut().insert(lhs, parser);
            }
        }
    });

    let mut generated_parsers = generate(true);
    generated_parsers.extend(acyclic_generated_parsers);

    generated_parsers
}

/// Phase 1.4: Detect `literal >> many/many1(regex) << literal` and fuse into a single `sp_regex()`.
///
/// Handles both AST shapes:
///   Shape A: Next(Literal_L, Skip(Many/Many1(Regex), Literal_R))
///   Shape B: Skip(Next(Literal_L, Many/Many1(Regex)), Literal_R)
pub fn check_for_regex_coalesce<'a>(
    expr: &'a Expression<'a>,
) -> Option<TokenStream> {
    let (left_lit, pattern, quantifier, right_lit) = match expr {
        // Shape A: next(literal, skip(many(regex), literal))
        Expression::Next(left_token, right_token) => {
            let left = get_inner_expression(left_token);
            let right = get_inner_expression(right_token);
            match (left, right) {
                (Expression::Literal(l_tok), Expression::Skip(middle_token, end_token)) => {
                    let middle = get_inner_expression(middle_token);
                    let end = get_inner_expression(end_token);
                    match (middle, end) {
                        (Expression::Many(inner_token), Expression::Literal(r_tok)) => {
                            let inner = get_inner_expression(inner_token);
                            if let Expression::Regex(re_tok) = inner {
                                (l_tok.value.as_ref(), re_tok.value.as_ref(), "*", r_tok.value.as_ref())
                            } else {
                                return None;
                            }
                        }
                        (Expression::Many1(inner_token), Expression::Literal(r_tok)) => {
                            let inner = get_inner_expression(inner_token);
                            if let Expression::Regex(re_tok) = inner {
                                (l_tok.value.as_ref(), re_tok.value.as_ref(), "+", r_tok.value.as_ref())
                            } else {
                                return None;
                            }
                        }
                        _ => return None,
                    }
                }
                _ => return None,
            }
        }
        // Shape B: skip(next(literal, many(regex)), literal)
        Expression::Skip(left_token, right_token) => {
            let left = get_inner_expression(left_token);
            let right = get_inner_expression(right_token);
            match (left, right) {
                (Expression::Next(start_token, middle_token), Expression::Literal(r_tok)) => {
                    let start = get_inner_expression(start_token);
                    let middle = get_inner_expression(middle_token);
                    match (start, middle) {
                        (Expression::Literal(l_tok), Expression::Many(inner_token)) => {
                            let inner = get_inner_expression(inner_token);
                            if let Expression::Regex(re_tok) = inner {
                                (l_tok.value.as_ref(), re_tok.value.as_ref(), "*", r_tok.value.as_ref())
                            } else {
                                return None;
                            }
                        }
                        (Expression::Literal(l_tok), Expression::Many1(inner_token)) => {
                            let inner = get_inner_expression(inner_token);
                            if let Expression::Regex(re_tok) = inner {
                                (l_tok.value.as_ref(), re_tok.value.as_ref(), "+", r_tok.value.as_ref())
                            } else {
                                return None;
                            }
                        }
                        _ => return None,
                    }
                }
                _ => return None,
            }
        }
        _ => return None,
    };

    // Escape the literals for use in a regex
    let escaped_left = regex::escape(left_lit);
    let escaped_right = regex::escape(right_lit);
    let combined = format!("{}({}){}{}", escaped_left, pattern, quantifier, escaped_right);

    // Validate the combined regex compiles
    if regex::Regex::new(&combined).is_err() {
        return None;
    }

    Some(quote! {
        ::parse_that::sp_regex(#combined)
    })
}

pub fn check_for_sep_by<'a>(
    expr: &'a Expression<'a>,
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    cache_bundle: &'a CacheBundle<'a, '_, '_>,
    max_depth: usize,
    depth: usize,
) -> Option<TokenStream> {
    match expr {
        Expression::Group(inner) => {
            let Token { value, .. } = inner.as_ref();
            check_for_sep_by(value, grammar_attrs, cache_bundle, max_depth, depth)
        }
        Expression::Skip(left_expr, inner)
            if matches!(inner.as_ref(), Token { value: Expression::Optional(_), .. }) =>
        {
            let Token { value: Expression::Optional(right_expr), .. } = inner.as_ref() else {
                unreachable!()
            };
            let left_expr = get_inner_expression(left_expr);
            let mut right_expr = get_inner_expression(right_expr);

            let left_parser = calculate_parser_from_expression(
                left_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );

            if let Some(Expression::MappedExpression((t_right_expr, _))) =
                cache_bundle.inline_cache.borrow().get(right_expr)
            {
                right_expr = get_inner_expression(t_right_expr);
            }

            let right_parser = calculate_parser_from_expression(
                right_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );

            let left_type = calculate_expression_type(left_expr, grammar_attrs, cache_bundle);
            let right_type = calculate_expression_type(right_expr, grammar_attrs, cache_bundle);

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

pub fn check_for_wrapped<'a>(
    left_expr: &'a Expression<'a>,
    right_expr: &'a Expression<'a>,
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    cache_bundle: &'a CacheBundle<'a, '_, '_>,
    max_depth: usize,
    depth: usize,
) -> Option<TokenStream> {
    match left_expr {
        Expression::Group(inner) => check_for_wrapped(
            left_expr,
            &inner.as_ref().value,
            grammar_attrs,
            cache_bundle,
            max_depth,
            depth,
        ),
        Expression::Next(left_expr, middle_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let middle_expr = get_inner_expression(middle_expr);
            let left_parser = calculate_parser_from_expression(
                left_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let middle_parser = calculate_parser_from_expression(
                middle_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let right_parser = calculate_parser_from_expression(
                right_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let left_type = calculate_expression_type(left_expr, grammar_attrs, cache_bundle);
            let middle_type = calculate_expression_type(middle_expr, grammar_attrs, cache_bundle);
            let right_type = calculate_expression_type(right_expr, grammar_attrs, cache_bundle);
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

/// Detect the canonical JSON string regex pattern and return true if it matches.
/// The JSON grammar uses `/"(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*"/`
/// which compiles to a general-purpose NFA via `sp_regex(...)`. The fast-path
/// `sp_json_string()` uses `memchr2(b'"', b'\\')` SIMD scanning instead.
pub fn is_json_string_regex(pattern: &str) -> bool {
    // Check for the distinctive substrings that identify the JSON string regex.
    // We look for the character class `[^"\\]` (match non-quote, non-backslash)
    // and the escape sequence group `\\(?:` which handles JSON escape sequences.
    pattern.contains(r#"[^"\\]"#) && pattern.contains(r"\\(?:")
        && pattern.starts_with('"') && pattern.ends_with('"')
}

/// Detect the canonical JSON number regex and return true if it matches.
/// The JSON grammar uses `/-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/` which
/// compiles to a general-purpose NFA. The fast-path `sp_json_number()` uses a
/// monolithic byte loop that is dramatically faster for number-heavy inputs.
pub fn is_json_number_regex(pattern: &str) -> bool {
    // JSON number regex starts with optional minus, contains the integer part
    // (0 or [1-9] followed by digits), and contains an exponent group [eE].
    pattern.starts_with("-?")
        && (pattern.contains("(0|[1-9]\\d*)") || pattern.contains("(0|[1-9][0-9]*)"))
        && pattern.contains("[eE]")
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
                    token.value.clone()
                } else {
                    panic!("Expected literal");
                }
            })
            .collect::<Vec<_>>();
        Some(quote! {
            :: parse_that:: any_span(&[#(#literal_arr), *])
        })
    } else {
        None
    }
}

pub fn calculate_concatenation_expression<'a>(
    inner_exprs: &'a [Expression<'a>],
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    cache_bundle: &'a CacheBundle<'a, '_, '_>,
    max_depth: usize,
    depth: usize,
) -> TokenStream {
    let tys = inner_exprs
        .iter()
        .map(|expr| calculate_expression_type(expr, grammar_attrs, cache_bundle))
        .collect::<Vec<_>>();
    let mut chains: Vec<(bool, Vec<TokenStream>)> = Vec::new();
    for (parser, ty) in inner_exprs
        .iter()
        .map(|expr| {
            calculate_parser_from_expression(expr, grammar_attrs, cache_bundle, max_depth, depth)
        })
        .zip(tys.iter())
    {
        let is_span = type_is_span(ty);
        if let Some((last_is_span, last_chain)) = chains.last_mut() {
            if is_span && *last_is_span {
                last_chain.push(parser);
                continue;
            }
        }
        chains.push((is_span, vec![parser]));
    }
    let mut acc = None;
    for (n, (_, chain)) in chains.iter().enumerate() {
        let chain_acc = chain.iter().fold(None, |acc, parser| match acc {
            None => Some(parser.clone()),
            Some(acc) => Some(quote! {
                #acc.then_span(#parser)
            }),
        });
        acc = match acc {
            None => chain_acc,
            Some(acc) => {
                if n > 1 {
                    Some(quote! {
                        #acc.then_flat(#chain_acc)
                    })
                } else {
                    Some(quote! {
                        #acc.then(#chain_acc)
                    })
                }
            }
        };
    }
    acc.unwrap()
}

pub fn calculate_alternation_expression<'a>(
    inner_exprs: &'a [Expression<'a>],
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    cache_bundle: &'a CacheBundle<'a, '_, '_>,
    max_depth: usize,
    depth: usize,
) -> TokenStream {
    if let Some(parser) = check_for_any_span(inner_exprs) {
        return map_span_if_needed(parser, true, grammar_attrs);
    }

    let parsers: Vec<TokenStream> = inner_exprs
        .iter()
        .map(|expr| {
            calculate_parser_from_expression(expr, grammar_attrs, cache_bundle, max_depth, depth)
        })
        .collect();

    // Phase 1.3: Dispatch table generation — O(1) byte dispatch for alternations
    // with disjoint FIRST sets. Each branch parser is coerced to the alternation's
    // overall output type before being placed in the dispatch table.
    if let Some(first_sets) = grammar_attrs.first_sets {
        let alt_refs: Vec<&Expression<'a>> = inner_exprs.iter().collect();
        if let Some(dispatch) = build_dispatch_table(&alt_refs, first_sets, grammar_attrs.ast) {
            // Compute per-branch types to detect Span vs Box<Enum> mismatches.
            let branch_tys: Vec<Type> = inner_exprs
                .iter()
                .map(|expr| calculate_expression_type(expr, grammar_attrs, cache_bundle))
                .collect();
            let overall_ty = {
                let all_span = branch_tys.iter().all(type_is_span);
                let all_same = branch_tys.iter().all(|ty| {
                    ty.to_token_stream().to_string()
                        == branch_tys[0].to_token_stream().to_string()
                });
                if all_span || all_same {
                    branch_tys[0].clone()
                } else {
                    grammar_attrs.boxed_enum_type.clone()
                }
            };
            let overall_is_boxed_enum = !type_is_span(&overall_ty)
                && overall_ty.to_token_stream().to_string()
                    == grammar_attrs.boxed_enum_type.to_token_stream().to_string();

            // Coerce each branch parser to the overall type if needed.
            let coerced_parsers: Vec<TokenStream> = parsers
                .iter()
                .zip(branch_tys.iter())
                .map(|(parser, branch_ty)| {
                    if overall_is_boxed_enum && type_is_span(branch_ty) {
                        // Span branch in a Box<Enum> alternation — wrap it.
                        // The parser is already generated with proper type from
                        // boxed2, so just box the result.
                        quote! { #parser.map(|x| Box::new(x)) }
                    } else {
                        parser.clone()
                    }
                })
                .collect();

            // Phase C+D: Inline match dispatch with SpanParser fast-path.
            // For span-eligible branches, call Self::rule_sp() directly to avoid
            // vtable hops. For other branches, hoist parsers into let bindings.
            let mut branch_bindings: Vec<TokenStream> = Vec::new();
            let mut match_arms: Vec<TokenStream> = Vec::new();
            let mut used: Vec<bool> = vec![false; coerced_parsers.len()];

            // Detect which branches are span-eligible nonterminals with _sp methods.
            let branch_sp_info: Vec<Option<(String, TokenStream)>> = inner_exprs
                .iter()
                .map(|expr| {
                    // Resolve through inline cache to find the original nonterminal
                    if let Some(cached) = cache_bundle.inline_cache.borrow().get(expr) {
                        // Check if this is a MappedExpression wrapping a nonterminal
                        if let Expression::MappedExpression((inner_token, mapping_token)) = cached {
                            let inner = get_inner_expression(inner_token);
                            let mapping = get_inner_expression(mapping_token);
                            if let Expression::Nonterminal(Token { value: nt_name, .. }) = inner {
                                if let Some(span_rules) = grammar_attrs.span_eligible_rules {
                                    if span_rules.contains(nt_name.as_ref()) {
                                        // Extract the mapping function for enum wrapping
                                        if let Expression::MappingFn(Token { value: map_fn, .. }) = mapping {
                                            let sp_ident = format_ident!("{}_sp", nt_name.as_ref());
                                            let map_closure: syn::ExprClosure = syn::parse_str(map_fn).ok()?;
                                            return Some((
                                                nt_name.as_ref().to_string(),
                                                quote! {
                                                    Self::#sp_ident().call(state).map(#map_closure)
                                                },
                                            ));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    None
                })
                .collect();

            for (idx, parser) in coerced_parsers.iter().enumerate() {
                if used[idx] { continue; }
                used[idx] = true;
                let bytes: Vec<u8> = (0u8..128)
                    .filter(|&c| dispatch.lookup(c) == Some(idx))
                    .collect();
                if bytes.is_empty() { continue; }

                // Build byte match patterns (e.g. b'{' | b'[' | b'"')
                let byte_patterns: Vec<proc_macro2::TokenStream> = bytes.iter()
                    .map(|&b| {
                        let b_lit = proc_macro2::Literal::byte_character(b);
                        quote! { #b_lit }
                    })
                    .collect();

                // Phase D: Use SpanParser fast-path if available
                if let Some(Some((_, sp_call))) = branch_sp_info.get(idx) {
                    // Inline the SpanParser call — no vtable hop, no let binding needed.
                    // If the overall type is Box<Enum>, wrap the result.
                    let call = if overall_is_boxed_enum {
                        quote! { (#sp_call).map(Box::new) }
                    } else {
                        sp_call.clone()
                    };
                    match_arms.push(quote! {
                        #(#byte_patterns)|* => { #call },
                    });
                } else {
                    let branch_ident = format_ident!("_branch_{}", idx);
                    branch_bindings.push(quote! { let #branch_ident = #parser; });
                    match_arms.push(quote! {
                        #(#byte_patterns)|* => #branch_ident.call(state),
                    });
                }
            }

            match_arms.push(quote! { _ => None, });

            return quote! {
                {
                    #(#branch_bindings)*
                    ::parse_that::Parser::new(move |state: &mut ::parse_that::ParserState<'a>| {
                        let byte = *state.src_bytes.get(state.offset)?;
                        match byte {
                            #(#match_arms)*
                        }
                    })
                }
            };
        }
    }

    // For 3+ non-span branches, emit one_of(vec![...]) for flat alternation
    if parsers.len() >= 3 {
        let tys: Vec<_> = inner_exprs
            .iter()
            .map(|expr| calculate_expression_type(expr, grammar_attrs, cache_bundle))
            .collect();
        let all_span = tys.iter().all(type_is_span);
        if !all_span {
            return quote! {
                ::parse_that::parse::one_of(vec![#(#parsers),*])
            };
        }
    }

    let parser = parsers
        .into_iter()
        .fold(None, |acc, parser| match acc {
            None => Some(parser),
            Some(acc) => Some(quote! {
                #acc | #parser
            }),
        })
        .unwrap();
    if inner_exprs.len() > 1 {
        quote! {
            (#parser)
        }
    } else {
        parser
    }
}

pub fn map_span_if_needed<'a>(
    parser: TokenStream,
    is_span: bool,
    GeneratedGrammarAttributes {
        parser_container_attrs,
        ..
    }: &'a GeneratedGrammarAttributes<'a>,
) -> TokenStream {
    if parser_container_attrs.use_string && is_span {
        quote! {
            #parser.map(|x| x.as_str())
        }
    } else {
        parser
    }
}

pub fn calculate_parser_from_expression<'a>(
    expr: &'a Expression<'a>,
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    cache_bundle: &'a CacheBundle<'a, '_, '_>,
    max_depth: usize,
    depth: usize,
) -> TokenStream {
    fn get_and_parse_default_parser<'a>(
        name: &str,
        args: Option<TokenStream>,
        grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
    ) -> Option<TokenStream> {
        let GeneratedNonterminalParser {
            parser,
            ty,
            ..
        } = DEFAULT_PARSERS.get(name)?;
        let Ok(ty) = syn:: parse_str::< syn:: Type >(ty) else {
            return None;
        };
        let parser = syn::parse_str::<syn::Expr>(parser)
            .unwrap()
            .to_token_stream();
        let parser = if let Some(args) = args {
            quote! {
                #parser(#args)
            }
        } else {
            parser
        };
        Some(map_span_if_needed(parser, type_is_span(&ty), grammar_attrs))
    }

    if let Some(parser) = cache_bundle.parser_cache.borrow().get(expr) {
        return parser.clone();
    }
    if let Some(cached_expr) = cache_bundle.inline_cache.borrow().get(expr) {
        if depth <= max_depth {
            return calculate_parser_from_expression(
                cached_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth + 1,
            );
        }
    }
    let parser = match expr {
        Expression::Literal(Token { value, .. }) => get_and_parse_default_parser(
            "LITERAL",
            Some(quote! {
                #value
            }),
            grammar_attrs,
        )
        .unwrap(),
        Expression::Regex(Token { value, .. }) => {
            // Phase 2.1: Detect JSON string regex and emit sp_json_string() fast path.
            // The JSON grammar's string regex uses memchr2-based SIMD scanning which is
            // dramatically faster than the general-purpose NFA for string-heavy workloads.
            if is_json_string_regex(value) {
                let parser = quote! { ::parse_that::sp_json_string_quoted() };
                map_span_if_needed(parser, true, grammar_attrs)
            } else if is_json_number_regex(value) {
                let parser = quote! { ::parse_that::sp_json_number() };
                map_span_if_needed(parser, true, grammar_attrs)
            } else {
                get_and_parse_default_parser(
                    "REGEX",
                    Some(quote! {
                        #value
                    }),
                    grammar_attrs,
                )
                .unwrap()
            }
        }
        Expression::Nonterminal(Token { value, .. }) => {
            if let Some(parser) = get_and_parse_default_parser(value, None, grammar_attrs) {
                parser
            } else {
                // Phase 4.2: Resolve aliases — if this nonterminal aliases another,
                // emit the target's method instead to eliminate indirection.
                let resolved_name = if let Some(aliases) = grammar_attrs.aliases {
                    let canonical = aliases.iter().find(|(k, _)| {
                        matches!(k, Expression::Nonterminal(t) if t.value.as_ref() == value.as_ref())
                    });
                    if let Some((_, target)) = canonical {
                        if let Expression::Nonterminal(t) = target {
                            t.value.as_ref().to_string()
                        } else {
                            value.to_string()
                        }
                    } else {
                        value.to_string()
                    }
                } else {
                    value.to_string()
                };
                let ident = format_ident!("{}", resolved_name);

                // Phase B: Transparent rules already return Box<Enum>,
                // so skip the extra .map(|x| Box::new(x)) wrapping.
                if is_transparent_rule(&resolved_name, grammar_attrs) {
                    quote! { Self::#ident() }
                } else {
                    quote! { Self::#ident().map(|x| Box::new(x)) }
                }
            }
        }
        Expression::Epsilon(_) => quote! {
            ::parse_that::parse::epsilon()
        },
        Expression::MappedExpression((inner_expr, mapping_fn)) => {
            let inner_expr = get_inner_expression(inner_expr);
            let mapping_fn = get_inner_expression(mapping_fn);
            
            let parser = calculate_parser_from_expression(
                inner_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );

            if let Expression::MappingFn(Token { value, .. }) = mapping_fn {
                let Ok(mapping_fn) = syn:: parse_str::< syn:: ExprClosure >(value) else {
                    panic!("Invalid mapper expression: {}", value);
                };

                quote! {
                    #parser.map(#mapping_fn)
                }
            } else {
                parser
            }
        }
        Expression::DebugExpression((inner_expr, name)) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = calculate_parser_from_expression(
                inner_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );

            quote! {
                #parser.debug(#name)
            }
        }
        Expression::Group(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            calculate_parser_from_expression(
                inner_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            )
        }
        Expression::Optional(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = calculate_parser_from_expression(
                inner_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let ty = calculate_expression_type(inner_expr, grammar_attrs, cache_bundle);
            if type_is_span(&ty) {
                return quote! {
                    #parser.opt_span()
                };
            }

            quote! {
                #parser.opt()
            }
        }
        Expression::OptionalWhitespace(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = calculate_parser_from_expression(
                inner_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );

            quote! {
                #parser.trim_whitespace()
            }
        }
        Expression::Many(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            if let Some(parser) =
                check_for_sep_by(inner_expr, grammar_attrs, cache_bundle, max_depth, depth)
            {
                return parser;
            }
            let parser = calculate_parser_from_expression(
                inner_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let ty = calculate_expression_type(inner_expr, grammar_attrs, cache_bundle);
            if type_is_span(&ty) {
                return quote! {
                    #parser.many_span(..)
                };
            }

            quote! {
                #parser.many(..)
            }
        }
        Expression::Many1(inner_expr) => {
            let inner_expr = get_inner_expression(inner_expr);
            let parser = calculate_parser_from_expression(
                inner_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let ty = calculate_expression_type(inner_expr, grammar_attrs, cache_bundle);
            if type_is_span(&ty) {
                return quote! {
                    #parser.many_span(1..)
                };
            }

            quote! {
                #parser.many(1..)
            }
        }
        Expression::Skip(left_expr, right_expr) => {
            // Phase 1.4: Try regex coalescing first
            if let Some(parser) = check_for_regex_coalesce(expr) {
                return map_span_if_needed(parser, true, grammar_attrs);
            }
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);
            if let Some(parser) = check_for_wrapped(
                left_expr,
                right_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            ) {
                return parser;
            }
            let left_parser = calculate_parser_from_expression(
                left_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let right_parser = calculate_parser_from_expression(
                right_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );

            quote! {
                #left_parser.skip(#right_parser)
            }
        }
        Expression::Next(left_expr, right_expr) => {
            // Phase 1.4: Try regex coalescing first
            if let Some(parser) = check_for_regex_coalesce(expr) {
                return map_span_if_needed(parser, true, grammar_attrs);
            }
            let mut left_expr = get_inner_expression(left_expr);

            if let Some(Expression::MappedExpression((t_left_expr, _))) =
                cache_bundle.inline_cache.borrow().get(left_expr)
            {
                left_expr = get_inner_expression(t_left_expr);
            }

            let right_expr = get_inner_expression(right_expr);

            let left_parser = calculate_parser_from_expression(
                left_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let right_parser = calculate_parser_from_expression(
                right_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );

            quote! {
                #left_parser.next(#right_parser)
            }
        }
        Expression::Minus(left_expr, right_expr) => {
            let left_expr = get_inner_expression(left_expr);
            let right_expr = get_inner_expression(right_expr);
            let left_parser = calculate_parser_from_expression(
                left_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            let right_parser = calculate_parser_from_expression(
                right_expr,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );

            quote! {
                #left_parser.not(#right_parser)
            }
        }
        Expression::Concatenation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            calculate_concatenation_expression(
                inner_exprs,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            )
        }
        Expression::Alternation(inner_exprs) => {
            let inner_exprs = get_inner_expression(inner_exprs);
            calculate_alternation_expression(
                inner_exprs,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            )
        }
        Expression::Rule(rhs, mapping_fn) => {
            let parser = calculate_parser_from_expression(
                rhs,
                grammar_attrs,
                cache_bundle,
                max_depth,
                depth,
            );
            if let Some(inner) = mapping_fn {
                if let Expression::MappingFn(Token { value, .. }) = inner.as_ref() {
                    let Ok(mapping_fn) = syn:: parse_str::< syn:: ExprClosure >(value) else {
                        panic!("Invalid mapper expression: {}", value);
                    };

                    quote! {
                        #parser.map(#mapping_fn)
                    }
                } else {
                    parser
                }
            } else {
                parser
            }
        }
        _ => unimplemented!("Expression not implemented: {:?}", expr),
    };
    cache_bundle
        .parser_cache
        .borrow_mut()
        .insert(expr, parser.clone());
    parser
}
