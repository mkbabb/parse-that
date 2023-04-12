extern crate proc_macro;

use std::collections::HashMap;

use std::collections::HashSet;
use std::env;
use std::path::Path;
use std::path::PathBuf;

use bbnf::map_generated_parser;
use bbnf::calculate_acyclic_deps;
use bbnf::calculate_ast_deps;
use bbnf::calculate_non_acyclic_deps;
use bbnf::calculate_nonterminal_generated_parsers;
use bbnf::calculate_nonterminal_types;
use bbnf::format_parser;
use bbnf::get_nonterminal_name;

use bbnf::topological_sort;
use bbnf::BBNFGrammar;
use bbnf::Expression;
use bbnf::GeneratedGrammarAttributes;
use bbnf::GeneratedParserCache;
use bbnf::ParserAttributes;
use bbnf::Token;
use bbnf::TypeCache;
use indexmap::IndexMap;

use pretty::Doc;
use proc_macro::TokenStream;

use quote::{format_ident, quote};
use syn::{parse_macro_input, parse_quote, Attribute, DeriveInput, Lit, Meta, NestedMeta, Type};

use parse_that::utils::get_cargo_root_path;

fn parse_parser_attrs(attrs: &[Attribute]) -> ParserAttributes {
    let mut parser_attr = ParserAttributes::default();
    let root_path = get_cargo_root_path();

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
                        let path = PathBuf::from(path.value());
                        let path = if path.is_relative() {
                            root_path.join(path)
                        } else {
                            path
                        };
                        parser_attr.paths.push(path);
                    }
                }
            } else {
                match nested_meta.path() {
                    path if path.is_ident("ignore_whitespace") => {
                        parser_attr.ignore_whitespace = true
                    }
                    path if path.is_ident("debug") => parser_attr.debug = true,
                    path if path.is_ident("use_string") => parser_attr.use_string = true,
                    _ => {}
                }
            }
        }
    }
    parser_attr
}

fn generate_enum(
    grammar_attrs: &GeneratedGrammarAttributes,
    nonterminal_types: &TypeCache,
) -> proc_macro2::TokenStream {
    let enum_values = nonterminal_types.iter().map(|(expr, ty)| {
        let Some(name) = get_nonterminal_name(expr) else {
            panic!("Expected nonterminal");
        };
        let name = format_ident!("{}", name);
        quote! { #name(#ty) }
    });

    let enum_ident = &grammar_attrs.enum_ident;

    quote! {
        #[derive(::pretty::Pretty, Debug, Clone)]
        pub enum #enum_ident<'a> {
            #(#enum_values),*
        }
    }
}

fn generate_grammar_arr(
    grammar_attrs: &GeneratedGrammarAttributes,
    parser_container_attrs: &ParserAttributes,
) -> proc_macro2::TokenStream {
    let grammar_arr_name = format_ident!("GRAMMAR_{}", grammar_attrs.ident);

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

fn format_generated_parsers<'a, 'b>(
    generated_parsers: &'a GeneratedParserCache<'a>,
    grammar_attrs: &'a GeneratedGrammarAttributes<'a>,
) -> proc_macro2::TokenStream
where
    'a: 'b,
{
    let generated_parsers: Vec<_> = generated_parsers
        .iter()
        .map(|(expr, parser)| {
            let Expression::Nonterminal(Token { value: name, ..}) = expr else {
            panic!("Expected nonterminal");
            };
            let ident = format_ident!("{}", name);

            let ty = &grammar_attrs.enum_type;


            // make the parser lazy if it's a non_acyclic dep:
            let parser = if grammar_attrs.non_acyclic_deps.contains_key(expr) {
                quote! { lazy(|| #parser) }
            } else {
                parser.clone()
            };

            quote! {
                pub fn #ident<'a>() -> Parser<'a, #ty> {
                    #parser
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

    let enum_type: Type = parse_quote!(#enum_ident<'a>);
    let boxed_enum_type: Type = parse_quote!(Box<#enum_ident<'a>> );

    let parser_container_attrs = parse_parser_attrs(&input.attrs);

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

    let deps = calculate_ast_deps(&ast);

    let ast = topological_sort(&ast, &deps);
    let acyclic_deps = calculate_acyclic_deps(&deps);
    let non_acyclic_deps = calculate_non_acyclic_deps(&deps, &acyclic_deps);

    let grammar_attrs = GeneratedGrammarAttributes {
        ast: &ast,
        deps: &deps,
        acyclic_deps: &acyclic_deps,
        non_acyclic_deps: &non_acyclic_deps,

        ident,
        enum_ident: &enum_ident,

        enum_type: &enum_type,
        boxed_enum_type: &boxed_enum_type,

        parser_container_attrs: &parser_container_attrs,
    };

    let nonterminal_types = calculate_nonterminal_types(&grammar_attrs);

    let grammar_arr = generate_grammar_arr(&grammar_attrs, &parser_container_attrs);
    let grammar_enum = generate_enum(&grammar_attrs, &nonterminal_types);

    let generated_parsers =
        calculate_nonterminal_generated_parsers(&grammar_attrs, &nonterminal_types);

    let generated_parsers = format_generated_parsers(&generated_parsers, &grammar_attrs);

    let expanded = quote! {
        #grammar_arr

        #grammar_enum

         impl #impl_generics #ident #ty_generics #where_clause {
            #generated_parsers
        }
    };

    expanded.into()
}
