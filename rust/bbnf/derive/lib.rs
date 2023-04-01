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

extern crate pretty;
use pretty::PRINTER;

#[derive(Clone, Debug)]
struct ParserAttributes {
    path: String,
}

impl Default for ParserAttributes {
    fn default() -> Self {
        ParserAttributes {
            path: String::new(),
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
                        parser_attr.path = path.value();
                    }
                }
            } else {
                continue;
            }
        }
    }
    return parser_attr;
}

#[proc_macro_derive(Parser, attributes(parser))]
pub fn bbnf_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = &input.ident;
    let generics = &input.generics;

    let parser_lifetime = match generics.lifetimes().next() {
        Some(lt) => lt.lifetime.clone(),
        None => parse_quote!('a),
    };

    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let parser_container_attrs = parse_parser_attrs(&input.attrs);

    let current_dir = std::env::current_dir().expect("Unable to get current directory");
    let relative_path = current_dir
        .join(&parser_container_attrs.path)
        .to_str()
        .expect("path contains invalid unicode")
        .to_string();

    let file_string = std::fs::read_to_string(relative_path).expect("Unable to read file");
    let ast = BBNFGrammar::grammar()
        .parse(&file_string)
        .expect("Unable to parse grammar");
    let ast = topological_sort(&ast);

    let enum_ident = format_ident!("{}Enum", name);
    let boxed_enum_ident: Type = parse_quote!(Box<#enum_ident<'a>> );

    let nonterminal_names: Vec<_> = ast
        .keys()
        .cloned()
        .map(|name| format_ident!("{}", name))
        .collect();
    let nonterminal_types = calculate_nonterminal_types(&ast, &boxed_enum_ident);

    let enum_values = nonterminal_names
        .iter()
        .map(|name| {
            let ty = nonterminal_types.get(name.to_string().as_str()).unwrap();
            quote! { #name(#ty) }
        })
        .collect::<Vec<_>>();

    let generated_parsers = ast.iter().map(|(name, expr)| {
        let ident = format_ident!("{}", name);

        let parser = generate_parser_from_ast(&expr);

        quote! {
            pub fn #ident<'a>() -> Parser<'a, #boxed_enum_ident> {
                lazy(||
                    #parser
                        .map(|x| Box::new(#enum_ident::#ident( x )) )
                        .debug(#name)
                )
            }
        }
    });

    let expanded = quote! {

        #[derive(pretty::Pretty, Debug)]
        pub enum #enum_ident<'a> {
            #(#enum_values),*
        }

        impl #impl_generics #name #ty_generics #where_clause {
            #(#generated_parsers)*
        }
    };

    TokenStream::from(expanded)
}
