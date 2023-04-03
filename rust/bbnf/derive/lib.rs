extern crate proc_macro;

use std::collections::HashMap;

use proc_macro::TokenStream;
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
        #[derive(pretty::Pretty, Debug)]
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

fn generate_parsers(
    ast: &AST,
    enum_ident: &syn::Ident,
    boxed_enum_type: &Type,
    nonterminal_types: &HashMap<String, Type>,
    parser_container_attrs: &ParserAttributes,
) -> proc_macro2::TokenStream {
    let mut cache = HashMap::new();

    let generated_parsers = ast.iter().map(|(name, expr)| {
        let ident = format_ident!("{}", name);

        let mut parser =
            generate_parser_from_ast(&expr, &boxed_enum_type, &nonterminal_types, &mut cache);
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

        quote! {
            pub fn #ident<'a>() -> Parser<'a, #boxed_enum_type> {
                lazy(||
                    #parser
                        .map(|x| Box::new( #enum_ident::#ident( x ) ) )
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
        .fold(HashMap::new(), |mut acc, ast| {
            for (name, expr) in ast {
                acc.insert(name, expr);
            }
            acc
        });

    let ast = topological_sort(&ast);

    let nonterminal_types = calculate_nonterminal_types(&ast, &boxed_enum_ident);

    let grammar_arr = generate_grammar_arr(&ident, &parser_container_attrs);
    let grammar_enum = generate_enum(&enum_ident, &nonterminal_types);
    let generated_parsers = generate_parsers(
        &ast,
        &enum_ident,
        &boxed_enum_ident,
        &nonterminal_types,
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
