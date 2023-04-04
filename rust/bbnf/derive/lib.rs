extern crate proc_macro;

use std::collections::HashMap;

use std::env;

use indexmap::IndexMap;

use pretty::Doc;
use proc_macro::TokenStream;

use quote::{format_ident, quote};
use syn::{parse_macro_input, parse_quote, Attribute, DeriveInput, Lit, Meta, NestedMeta, Type};

extern crate bbnf;
use bbnf::generate::*;
use bbnf::grammar::*;

#[derive(Clone, Debug, Default)]
struct ParserAttributes {
    paths: Vec<std::path::PathBuf>,
    ignore_whitespace: bool,
    debug: bool,
}

fn parse_parser_attrs(attrs: &[Attribute]) -> ParserAttributes {
    let mut parser_attr = ParserAttributes::default();

    for meta in attrs
        .iter()
        .filter(|attr| attr.path.is_ident("parser"))
        .filter_map(|attr| match attr.parse_meta() {
            Ok(Meta::List(meta)) => Some(meta),
            _ => None,
        })
    {
        for nested_meta in meta.nested.iter() {
            let NestedMeta::Meta(nested_meta)  = nested_meta else {
                continue;
            };

            if let Meta::NameValue(_name_value) = nested_meta {
                if nested_meta.path().is_ident("path") {
                    if let Lit::Str(path) = &_name_value.lit {
                        parser_attr.paths.push(path.value().into());
                    }
                }
            } else {
                match nested_meta.path() {
                    path if path.is_ident("ignore_whitespace") => {
                        parser_attr.ignore_whitespace = true
                    }
                    path if path.is_ident("debug") => parser_attr.debug = true,
                    _ => {}
                }
            }
        }
    }
    parser_attr
}

fn generate_enum(
    enum_ident: &syn::Ident,
    nonterminal_types: &HashMap<String, Type>,
) -> proc_macro2::TokenStream {
    let nonterminal_names: Vec<_> = nonterminal_types
        .keys()
        .cloned()
        .map(|name| format_ident!("{}", name))
        .collect();

    let enum_values = nonterminal_names.iter().map(|name| {
        let ty = nonterminal_types
            .get(name.to_string().as_str())
            .unwrap_or_else(|| panic!("Missing nonterminal type for {}", name));
        quote! { #name(#ty) }
    });

    quote! {
        // #[derive(::pretty::Pretty, Debug, Clone)]
        pub enum #enum_ident<'a> {
            #(#enum_values),*
        }
    }
}

fn generate_grammar_arr(
    ident: &syn::Ident,
    parser_container_attrs: &ParserAttributes,
) -> proc_macro2::TokenStream {
    let grammar_arr_name = format_ident!("GRAMMAR_{}", ident);

    let len = parser_container_attrs.paths.len();
    let include_strs = parser_container_attrs.paths.iter().map(|path| {
        let path = path.to_str().unwrap();
        quote! { include_str!(#path) }
    });

    quote! {
        #[allow(non_upper_case_globals)]
        pub const #grammar_arr_name: [&'static str; #len] = [
            #(#include_strs),*
        ];
    }
}

fn generate_parsers<'a, 'b>(
    ast: &'a AST,
    deps: &'a Dependencies<'a>,
    acyclic_deps: &'a Dependencies<'a>,
    type_cache: &'b mut HashMap<&'a Expression<'a>, Type>,
    default_parsers: &'a HashMap<&'a str, GeneratedParser<'a>>,
    enum_ident: &syn::Ident,
    boxed_enum_type: &Type,
    parser_container_attrs: &ParserAttributes,
) -> proc_macro2::TokenStream
where
    'a: 'b,
{
    let format_parser = |mut parser: proc_macro2::TokenStream, name: &str| {
        if parser_container_attrs.ignore_whitespace {
            parser = quote! {
                #parser.trim_whitespace()
            };
        }
        if parser_container_attrs.debug {
            parser = quote! {
                #parser.debug(#name)
            };
        }
        parser
    };

    let box_parser = |parser: proc_macro2::TokenStream, ident: &syn::Ident| {
        quote! {
            #parser.map(|x| Box::new( #enum_ident::#ident( x ) ) )
        }
    };

    println!("deps: {:?}", Doc::from(deps.clone()));
    println!("acyclic_deps: {:?}", Doc::from(acyclic_deps.clone()));

    let mut generated_parsers: HashMap<&Expression, proc_macro2::TokenStream> = HashMap::new();
    let mut cache: HashMap<&Expression, proc_macro2::TokenStream> = HashMap::new();

    loop {
        let t_generated_parsers: HashMap<_, _> = ast
            .iter()
            .map(|(_, expr)| {
                let Expression::ProductionRule(lhs, ..) = expr else {
                panic!("Expected production rule");
            };
                let mut boxed_parsers = HashMap::new();
                let mut boxed_types = HashMap::new();

                if !acyclic_deps.contains_key(lhs) {
                    if let Some(deps) = deps.get(lhs) {
                        for dep in deps.iter().filter(|dep| acyclic_deps.contains_key(*dep)) {
                            if boxed_parsers.contains_key(dep) {
                                continue;
                            }

                            if let Some(parser) = cache.get(dep) {
                                if let Some(_sub_deps) = acyclic_deps.get(dep) {
                                    let name = get_nonterminal_name(dep);
                                    let ident = format_ident!("{}", name);
                                    let boxed_parser = box_parser(parser.clone(), &ident);

                                    boxed_parsers.insert(dep, parser.clone());
                                    cache.insert(dep, boxed_parser);

                                    if type_cache.contains_key(dep) {
                                        let boxed_type = type_cache.get(dep).unwrap().clone();
                                        boxed_types.insert(dep, boxed_type);
                                        type_cache.insert(dep, boxed_enum_type.clone());
                                    }
                                }
                            }
                        }
                    }
                }

                let parser = generate_parser_from_ast(
                    expr,
                    boxed_enum_type,
                    default_parsers,
                    &mut cache,
                    type_cache,
                );

                for (dep, parser) in boxed_parsers {
                    cache.insert(dep, parser);
                }
                for (dep, ty) in boxed_types {
                    type_cache.insert(dep, ty);
                }

                (lhs.as_ref(), parser)
            })
            .collect();

        cache = t_generated_parsers
            .iter()
            .filter(|(expr, _)| acyclic_deps.contains_key(*expr))
            .map(|(expr, parser)| (*expr, parser.clone()))
            .collect();

        if t_generated_parsers.iter().all(|(k, v)| {
            if let Some(v2) = generated_parsers.get(k) {
                return v.to_string() == v2.to_string();
            }
            false
        }) {
            break;
        } else {
            generated_parsers = t_generated_parsers;
        }
    }

    let generated_parsers: Vec<_> = generated_parsers
        .into_iter()
        .map(|(expr, mut parser)| {
            let Expression::Nonterminal(Token { value: name, ..}) = expr else {
            panic!("Expected nonterminal");
        };
            let ident = format_ident!("{}", name);

            parser = format_parser(box_parser(parser, &ident), name);

            quote! {
                pub fn #ident<'a>() -> Parser<'a, #boxed_enum_type> {
                    lazy(||
                        #parser
                    )
                }
            }
        })
        .collect();

    quote! {
        #(#generated_parsers)*
    }
}

#[proc_macro_derive(Parser, attributes(parser))]
pub fn bbnf_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let ident = &input.ident;
    let generics = &input.generics;

    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let enum_ident = format_ident!("{}Enum", ident);
    let boxed_enum_ident: Type = parse_quote!(Box<#enum_ident<'a>> );

    let root =
        std::path::PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".into()));

    let parser_container_attrs = parse_parser_attrs(&input.attrs);
    let parser_container_attrs = ParserAttributes {
        paths: parser_container_attrs
            .paths
            .into_iter()
            .map(|path| root.join(path))
            .collect(),
        ..parser_container_attrs
    };

    let file_strings: Vec<_> = parser_container_attrs
        .paths
        .iter()
        .map(|path| {
            std::fs::read_to_string(path)
                .unwrap_or_else(|_| panic!("Unable to read file: {}", path.display()))
        })
        .collect();

    let ast = file_strings
        .iter()
        .map(|file_string| {
            BBNFGrammar::grammar()
                .parse(file_string)
                .expect("Unable to parse grammar")
        })
        .fold(IndexMap::new(), |mut acc, ast| {
            for (name, expr) in ast {
                acc.insert(name, expr);
            }
            acc
        });
    let default_parsers = generate_default_parsers();

    let deps = calculate_ast_deps(&ast);

    let ast = topological_sort(&ast, &deps);
    let acylic_deps = calculate_acyclic_deps(&deps);

    let (nonterminal_types, mut type_cache) = calculate_nonterminal_types(
        &ast,
        &deps,
        &acylic_deps,
        &boxed_enum_ident,
        &default_parsers,
    );

    let grammar_arr = generate_grammar_arr(ident, &parser_container_attrs);
    let grammar_enum = generate_enum(&enum_ident, &nonterminal_types);

    let generated_parsers = generate_parsers(
        &ast,
        &deps,
        &acylic_deps,
        &mut type_cache,
        &default_parsers,
        &enum_ident,
        &boxed_enum_ident,
        &parser_container_attrs,
    );

    let expanded = quote! {
        #grammar_arr

        #grammar_enum

         impl #impl_generics #ident #ty_generics #where_clause {
            #generated_parsers
        }
    };

    expanded.into()
}
