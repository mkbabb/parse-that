extern crate proc_macro;

use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{
    parse_macro_input, parse_quote, token::Comma, Attribute, Data, DeriveInput, Field, Fields, Lit,
    Meta, NestedMeta, Variant, WherePredicate,
};

#[derive(Clone, Debug)]
struct PrettyAttributes {
    skip: bool,
    indent: bool,
    rename: Option<String>,
    getter: Option<String>,
    verbose: bool,
}

impl Default for PrettyAttributes {
    fn default() -> Self {
        PrettyAttributes {
            skip: false,
            indent: false,
            rename: None,
            getter: None,
            verbose: false,
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
                if nested_meta.path().is_ident("getter") {
                    if let Lit::Str(getter) = &_name_value.lit {
                        pretty_attr.getter = Some(getter.value());
                    }
                }
            } else {
                match nested_meta.path() {
                    path if path.is_ident("skip") => pretty_attr.skip = true,
                    path if path.is_ident("indent") => pretty_attr.indent = true,
                    path if path.is_ident("verbose") => pretty_attr.verbose = true,
                    _ => {}
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

    let pretty_container_attrs = get_pretty_attrs(&input.attrs);

    let name = &input.ident;
    let generics = &input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let doc_lifetime = match generics.lifetimes().next() {
        Some(lt) => lt.lifetime.clone(),
        None => parse_quote!('a),
    };

    let doc_match = match &input.data {
        Data::Struct(data_struct) => {
            generate_struct_match(&name, &data_struct.fields, &pretty_container_attrs)
        }
        Data::Enum(data_enum) => {
            generate_enum_match(&name, &data_enum.variants, &pretty_container_attrs)
        }
        _ => panic!("Only structs and enums are supported."),
    };

    let mut new_where_clause = where_clause
        .map(|wc| wc.predicates.clone())
        .unwrap_or_else(|| syn::punctuated::Punctuated::new());

    let new_where_clause_predicates = generics.type_params().map(|tp| -> WherePredicate {
        let ident = &tp.ident;
        parse_quote! { #ident : Into<Doc<#doc_lifetime>> }
    });
    let new_lifetime_predicates = generics.lifetimes().map(|lt| -> WherePredicate {
        let lifetime = &lt.lifetime;
        parse_quote! { #lifetime : 'a }
    });

    new_where_clause.extend(new_where_clause_predicates);
    new_where_clause.extend(new_lifetime_predicates);

    let expanded = quote! {
        #[allow(non_camel_case_types)]
        impl #impl_generics From<#name #ty_generics> for pretty::Doc<#doc_lifetime>
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
    let format_key_value = |field_ident: &Option<syn::Ident>, field: &Field| {
        let pretty_attr = get_pretty_attrs(&field.attrs);
        if pretty_attr.skip {
            return None;
        }
        let field_name = pretty_attr.rename.clone().unwrap_or_else(|| {
            field_ident
                .as_ref()
                .map(|ident| ident.to_string())
                .unwrap_or_else(|| "".to_string())
        });

        let is_generic_type = match &field.ty {
            syn::Type::Path(_) => true,
            _ => false,
        };

        let field_doc = if is_generic_type {
            quote! { _self.#field_ident.into() }
        } else {
            quote! { Doc::from(_self.#field_ident) }
        };
        let field_doc = generate_field_doc(&field_doc, &pretty_attr);
        let field_doc = quote! {
            concat(vec![
                Doc::from(#field_name),
                Doc::Str(": "),
                #field_doc,
            ])
        };
        Some(field_doc)
    };

    match fields {
        Fields::Named(fields) => fields
            .named
            .iter()
            .filter_map(|field| {
                let field_ident = &field.ident;
                format_key_value(&field_ident, &field)
            })
            .collect(),
        Fields::Unnamed(fields) => fields
            .unnamed
            .iter()
            .enumerate()
            .filter_map(|(i, field)| {
                let field_ident = Some(format_ident!("field_{}", i));
                format_key_value(&field_ident, &field)
            })
            .collect(),
        Fields::Unit => vec![],
    }
}

fn generate_struct_match(
    ident: &syn::Ident,
    fields: &Fields,
    pretty_container_attrs: &PrettyAttributes,
) -> proc_macro2::TokenStream {
    let fields_match = generate_struct_fields_match(fields);

    // TODO: Fix: hack to remove the unused variable warning when the field is ignored.
    let named_fields = fields.into_iter().filter_map(|field| field.ident.clone());

    match fields {
        Fields::Named(_) | Fields::Unnamed(_) => {
            let body = quote! {
                vec![#(#fields_match,)*]
                        .join(Doc::Str(", ") + Doc::Hardline)
                        .group()
                        .wrap(Doc::Str("{"), Doc::Str("}"))
                        .indent()
            };

            let doc_match = if pretty_container_attrs.verbose {
                quote! {
                    concat(vec![
                        Doc::from(stringify!(#ident)),
                        Doc::Str(" "),
                        #body,
                    ])
                }
            } else {
                body
            };
            quote! {
                (#((&_self.#named_fields),)*);
                #doc_match
            }
        }
        Fields::Unit => {
            quote! {
                Doc::from(stringify!(#ident))
            }
        }
    }
}

fn generate_variants_match(
    variant: &syn::Variant,
    constructor: &proc_macro2::TokenStream,
    pretty_container_attrs: &PrettyAttributes,
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

    let field_doc = match pretty_attr.getter.clone() {
        Some(getter) => {
            let getter = syn::parse_str::<syn::Expr>(&getter).unwrap();
            quote! {
                #getter(&#field_bindings_tup)
            }
        }
        None => field_bindings_tup,
    };
    let field_doc = quote! {
        Doc::from(#field_doc)
    };
    let field_doc = generate_field_doc(&field_doc, &pretty_attr);
    let field_doc = if pretty_container_attrs.verbose {
        quote! {
            concat(vec![
                Doc::from(#variant_name),
                Doc::from(#field_doc)
                .wrap(Doc::Str("("), Doc::Str(")"))
            ])
        }
    } else {
        field_doc
    };

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
    pretty_container_attrs: &PrettyAttributes,
) -> proc_macro2::TokenStream {
    let format_variant = |variant: &Variant| {
        let variant_ident = &variant.ident;
        let constructor = quote! { #name::#variant_ident };
        generate_variants_match(variant, &constructor, pretty_container_attrs)
    };
    let variants_match = variants.into_iter().filter_map(format_variant);

    quote! {
        match _self {
           #(#variants_match,)*
           _ => Doc::Null
        }
    }
}
