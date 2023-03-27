extern crate proc_macro;

use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{
    parse_macro_input, parse_quote, token::Comma, Attribute, Data, DeriveInput, Field, Fields,
    GenericParam, Lit, Meta, NestedMeta, Variant, WherePredicate,
};

#[derive(Clone, Debug)]
struct PrettyAttributes {
    skip: bool,
    indent: bool,
    rename: Option<String>,
}

impl Default for PrettyAttributes {
    fn default() -> Self {
        PrettyAttributes {
            skip: false,
            indent: false,
            rename: None,
        }
    }
}

fn get_pretty_attrs(attrs: &[Attribute]) -> PrettyAttributes {
    let mut pretty_attr = PrettyAttributes::default();

    for meta in attrs
        .into_iter()
        .filter(|attr| attr.path.is_ident("pretty"))
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
                if nested_meta.path().is_ident("rename") {
                    if let Lit::Str(rename) = &_name_value.lit {
                        pretty_attr.rename = Some(rename.value());
                    }
                }
            } else {
                if nested_meta.path().is_ident("skip") {
                    pretty_attr.skip = true;
                } else if nested_meta.path().is_ident("indent") {
                    pretty_attr.indent = true;
                }
            }
        }
    }

    return pretty_attr;
}

fn generate_field_doc(
    field_doc: &proc_macro2::TokenStream,
    pretty_attr: &PrettyAttributes,
) -> proc_macro2::TokenStream {
    let mut doc = quote! { #field_doc };

    if pretty_attr.indent {
        doc = quote! { (#doc).indent() };
    }

    doc
}

#[proc_macro_derive(Pretty, attributes(pretty))]
pub fn pretty_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = &input.ident;
    let generics = &input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();
    let doc_lifetime: GenericParam = parse_quote!('a);

    let doc_match = match &input.data {
        Data::Struct(data_struct) => generate_struct_match(&name, &data_struct.fields),
        Data::Enum(data_enum) => generate_enum_match(&name, &data_enum.variants),
        _ => panic!("Only structs and enums are supported."),
    };

    // Start with the existing where_clause predicates or an empty set of predicates.
    let mut new_where_clause = where_clause
        .map(|wc| wc.predicates.clone())
        .unwrap_or_else(|| syn::punctuated::Punctuated::new());

    let new_where_clause_predicates = generics.type_params().map(|tp| -> WherePredicate {
        let ident = &tp.ident;
        parse_quote! { #ident : Into<Doc<#doc_lifetime>> }
    });

    new_where_clause.extend(new_where_clause_predicates);

    let expanded = quote! {
        #[allow(non_camel_case_types)]
        impl #impl_generics From<#name #ty_generics> for pretty::Doc<'a>
        where
            #new_where_clause
        {
            fn from(_self: #name #ty_generics) -> Self {
                use pretty::{concat, indent, wrap, join, str, Doc, Join, Wrap, Group, Indent};

                #doc_match
            }
        }
    };

    TokenStream::from(expanded)
}

fn generate_struct_fields_match(fields: &Fields) -> Vec<proc_macro2::TokenStream> {
    let format_key_value = |field_name: &Option<syn::Ident>, field: &Field| {
        let pretty_attr = get_pretty_attrs(&field.attrs);
        if pretty_attr.skip {
            return None;
        }

        let field_name_str = pretty_attr.rename.clone().unwrap_or_else(|| {
            field_name
                .as_ref()
                .map(|ident| ident.to_string())
                .unwrap_or_else(|| "".to_string())
        });

        let is_generic_type = match &field.ty {
            syn::Type::Path(_) => true,
            _ => false,
        };
        let field_doc = if is_generic_type {
            quote! { _self.#field_name.into() }
        } else {
            quote! { Doc::from(_self.#field_name) }
        };

        let field_doc = generate_field_doc(&field_doc, &pretty_attr);

        Some(quote! {
            concat(vec![
                Doc::from(#field_name_str),
                Doc::Str(": "),
                #field_doc,
            ])
        })
    };

    match fields {
        Fields::Named(fields) => fields
            .named
            .iter()
            .filter_map(|field| {
                let field_name = &field.ident;
                format_key_value(&field_name, &field)
            })
            .collect(),
        Fields::Unnamed(fields) => fields
            .unnamed
            .iter()
            .enumerate()
            .filter_map(|(i, field)| {
                let field_name = Some(format_ident!("field_{}", i));
                format_key_value(&field_name, &field)
            })
            .collect(),
        Fields::Unit => vec![],
    }
}

fn generate_struct_match(name: &syn::Ident, fields: &Fields) -> proc_macro2::TokenStream {
    let fields_match = generate_struct_fields_match(fields);

    // TODO: Fix: hack to remove the unused variable warning when the field is ignored.
    let named_fields = fields.into_iter().filter_map(|field| field.ident.clone());

    match fields {
        Fields::Named(_) | Fields::Unnamed(_) => {
            quote! {
                (#((&_self.#named_fields),)*);

                let body = vec![#(#fields_match,)*]
                        .join(str(", ") + Doc::Hardline)
                        .group()
                        .wrap(Doc::Str("{"), Doc::Str("}"))
                        .indent();

                concat(vec![
                    Doc::from(format!("{} ", stringify!(#name))),
                    body,
                ]).group()
            }
        }
        Fields::Unit => {
            quote! {
                Doc::from(stringify!(#name))
            }
        }
    }
}

fn generate_variants_match(
    variant: &syn::Variant,
    constructor: &proc_macro2::TokenStream,
) -> Option<proc_macro2::TokenStream> {
    let pretty_attr = get_pretty_attrs(&variant.attrs);

    if pretty_attr.skip {
        return None;
    }

    let variant_name = pretty_attr
        .rename
        .clone()
        .unwrap_or_else(|| variant.ident.to_string());

    let field_bindings = match &variant.fields {
        Fields::Named(fields) => fields
            .named
            .iter()
            .map(|field| quote! { #field.ident })
            .collect(),
        Fields::Unnamed(fields) => fields
            .unnamed
            .iter()
            .enumerate()
            .map(|(i, _)| {
                let ident = format_ident!("field_{}", i);
                quote! { #ident }
            })
            .collect(),
        Fields::Unit => {
            vec![quote! {
                #variant_name
            }]
        }
    };

    let field_bindings_tup = if field_bindings.len() == 1 {
        quote! { #(#field_bindings),* }
    } else {
        quote! { (#(#field_bindings),*) }
    };

    let field_doc = quote! {
        Doc::from(#field_bindings_tup)
    };

    let field_doc = generate_field_doc(&field_doc, &pretty_attr);

    let match_arms = match &variant.fields {
        Fields::Named(_) => {
            quote! {
                #constructor { #(#field_bindings),* } => #field_doc
            }
        }
        Fields::Unnamed(_) => {
            quote! {
                #constructor(#(#field_bindings),*) => #field_doc
            }
        }
        Fields::Unit => {
            quote! {
                #constructor =>  #field_doc
            }
        }
    };
    Some(match_arms)
}

fn generate_enum_match(
    name: &syn::Ident,
    variants: &syn::punctuated::Punctuated<Variant, Comma>,
) -> proc_macro2::TokenStream {
    let format_variant = |variant: &Variant| {
        let variant_ident = &variant.ident;
        let constructor = quote! { #name::#variant_ident };
        generate_variants_match(variant, &constructor)
    };
    let variants_match = variants.into_iter().filter_map(format_variant);

    quote! {
        match _self {
           #(#variants_match,)*
           _ => Doc::Null
        }
    }
}
