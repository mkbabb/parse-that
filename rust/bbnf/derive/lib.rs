extern crate proc_macro;

use std::borrow::BorrowMut;
use std::collections::HashMap;
use std::collections::HashSet;

use indexmap::{IndexMap, IndexSet};

use proc_macro::TokenStream;
use quote::ToTokens;
use quote::{format_ident, quote};
use syn::{
    parse_macro_input, parse_quote, token::Comma, Attribute, Data, DeriveInput, Field, Fields, Lit,
    Meta, NestedMeta, Type, Variant, WherePredicate,
};

extern crate bbnf;
use bbnf::generate::*;
use bbnf::grammar::*;

#[derive(Clone, Debug)]
struct ParserAttributes {
    paths: Vec<std::path::PathBuf>,
    ignore_whitespace: bool,
    debug: bool,
}

impl Default for ParserAttributes {
    fn default() -> Self {
        ParserAttributes {
            paths: vec![],
            ignore_whitespace: false,
            debug: false,
        }
    }
}

fn parse_parser_attrs(attrs: &[Attribute]) -> ParserAttributes {
    let mut parser_attr = ParserAttributes::default();

    for meta in attrs
        .into_iter()
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
    return parser_attr;
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
        // #[derive(pretty::Pretty, Debug)]
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
        const #grammar_arr_name: [&'static str; #len] = [
            #(#include_strs),*
        ];
    }
}

fn generate_parsers<'a, 'b>(
    ast: &'a AST,
    acyclic_deps: &HashMap<String, HashSet<String>>,
    type_cache: &'b mut HashMap<&'a Expression<'a>, Type>,
    enum_ident: &syn::Ident,
    boxed_enum_type: &Type,
    parser_container_attrs: &ParserAttributes,
) -> proc_macro2::TokenStream
where
    'a: 'b,
{
    let mut generated_parsers: HashMap<&Expression, proc_macro2::TokenStream> = HashMap::new();
    let mut cache = HashMap::new();

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

    let mut counter = 0;

    while counter < MAX_AST_ITERATIONS {
        let t_generated_parsers: HashMap<_, _> = ast
            .iter()
            .map(|(_, expr)| {
                let Expression::ProductionRule(lhs, _) = expr else {
                    panic!("Expected production rule");
                };
                let Expression::Nonterminal(Token { value: name, ..}) = lhs.as_ref() else {
                    panic!("Expected nonterminal");
                };
                let parser =
                    generate_parser_from_ast(&expr, &boxed_enum_type, &mut cache, type_cache);

                if needs_boxing(name, &acyclic_deps) {
                    return (lhs.as_ref(), parser);
                } else {
                    return (
                        lhs.as_ref(),
                        box_parser(format_parser(parser, name), &format_ident!("{}", name)),
                    );
                }
            })
            .collect();

        cache = t_generated_parsers
            .iter()
            .filter(|(expr, _)| {
                if let Expression::Nonterminal(Token { value: name, .. }) = expr {
                    acyclic_deps.contains_key(name.to_owned())
                } else {
                    false
                }
            })
            .map(|(expr, parser)| (expr.clone(), parser.clone()))
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

        counter += 1;
    }

    let generated_parsers = generated_parsers.into_iter().map(|(expr, mut parser)| {
        let Expression::Nonterminal(Token { value: name, ..}) = expr else {
            panic!("Expected nonterminal");
        };
        let ident = format_ident!("{}", name);

        if needs_boxing(name, &acyclic_deps) {
            parser = format_parser(box_parser(parser, &ident), name);
        }

        quote! {
            pub fn #ident<'a>() -> Parser<'a, #boxed_enum_type> {
                lazy(||
                    #parser
                )
            }
        }
    });

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

    let current_dir = std::env::current_dir().expect("Unable to get current directory");
    let parser_container_attrs = parse_parser_attrs(&input.attrs);
    let parser_container_attrs = ParserAttributes {
        paths: parser_container_attrs
            .paths
            .into_iter()
            .map(|path| current_dir.join(path))
            .collect(),
        ..parser_container_attrs
    };

    let file_strings: Vec<_> = parser_container_attrs
        .paths
        .iter()
        .map(|path| std::fs::read_to_string(path).expect("Unable to read file"))
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

    let (ast, deps) = topological_sort(&ast);
    let acylic_deps = calculate_acyclic_deps(&deps);

    let (nonterminal_types, mut type_cache) =
        calculate_nonterminal_types(&ast, &acylic_deps, &boxed_enum_ident);

    let grammar_arr = generate_grammar_arr(&ident, &parser_container_attrs);
    let grammar_enum = generate_enum(&enum_ident, &nonterminal_types);

    let generated_parsers = generate_parsers(
        &ast,
        &acylic_deps,
        &mut type_cache,
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

    TokenStream::from(expanded)
}
