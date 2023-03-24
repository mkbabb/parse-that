extern crate proc_macro;

use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{
    parse_macro_input, token::Comma, Attribute, Data, DeriveInput, Field, Fields, Meta, NestedMeta,
    Variant,
};

struct PrettyAttributes {
    ignore: bool,
    indent: bool,
}

impl Default for PrettyAttributes {
    fn default() -> Self {
        PrettyAttributes {
            ignore: false,
            indent: false,
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
            let NestedMeta::Meta(Meta::NameValue(name_value)) = nested_meta else {
                continue;
            };

            if name_value.path.is_ident("ignore") {
                if let syn::Lit::Bool(lit_bool) = &name_value.lit {
                    pretty_attr.ignore = lit_bool.value;
                }
            } else if name_value.path.is_ident("indent") {
                if let syn::Lit::Bool(lit_bool) = &name_value.lit {
                    pretty_attr.indent = lit_bool.value;
                }
            }
        }
    }

    return pretty_attr;
}

fn generate_field_doc(
    field_doc: &proc_macro2::TokenStream,
    attrs: &[Attribute],
) -> Option<proc_macro2::TokenStream> {
    let pretty_attr = get_pretty_attrs(attrs);

    if pretty_attr.ignore {
        return None;
    }

    let mut doc = quote! { #field_doc };

    if pretty_attr.indent {
        doc = quote! { (#doc).indent() };
    }

    Some(doc)
}

#[proc_macro_derive(Pretty, attributes(pretty))]
pub fn pretty_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = &input.ident;
    let generics = &input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let doc_match = match &input.data {
        Data::Struct(data_struct) => generate_struct_match(&name, &data_struct.fields),
        Data::Enum(data_enum) => generate_enum_match(&name, &data_enum.variants),
        _ => panic!("Only structs and enums are supported."),
    };

    let where_clause_predicates = where_clause.map(|wc| &wc.predicates);

    let new_where_clause_predicates: Vec<_> = generics
        .type_params()
        .map(|tp| {
            let ident = &tp.ident;
            quote! { #ident : Into<Doc<'a>> }
        })
        .collect();

    let all_where_clause_predicates = quote! {
        #where_clause_predicates
        #(#new_where_clause_predicates,)*
    };

    let expanded = quote! {
        impl #impl_generics Into<pretty::Doc<'a>> for #name #ty_generics
        where
            #all_where_clause_predicates
        {
            fn into(self) -> pretty::Doc<'a> {
                use pretty::{concat, indent, wrap, join, str, Doc, Join, Wrap, Group, Indent};

                #doc_match
            }
        }
    };

    TokenStream::from(expanded)
}

fn generate_struct_fields_match(fields: &Fields) -> Vec<proc_macro2::TokenStream> {
    let format_key_value = |field_name: &Option<syn::Ident>, field: &Field| {
        let field_doc = quote! { self.#field_name.into() };
        let Some(field_doc) = generate_field_doc(&field_doc, &field.attrs) else {
            return None;
        };

        Some(quote! {
            concat(vec![
                stringify!(#field_name).into(),
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

    match fields {
        Fields::Named(_) | Fields::Unnamed(_) => {
            quote! {
                let body = vec![#(#fields_match,)*]
                        .join(str(", ") + Doc::Hardline)
                        .group()
                        .wrap(str("{"), str("}"))
                        .indent();

                concat(vec![
                    format!("{} ", stringify!(#name)).into(),
                    body,
                ]).group()
            }
        }
        Fields::Unit => {
            quote! {
                stringify!(#name).into()
            }
        }
    }
}

fn generate_variants_match(
    variant: &syn::Variant,
    constructor: &proc_macro2::TokenStream,
) -> Option<proc_macro2::TokenStream> {
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
               format!("{}", stringify!(#variant))
            }]
        }
    };

    let field_doc = quote! {
        Doc::from((#(#field_bindings.into()),*))
    };
    let Some(field_doc) = generate_field_doc(&field_doc, &variant.attrs) else {
        return None;
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
) -> proc_macro2::TokenStream {
    let format_variant = |variant: &Variant| {
        let variant_ident = &variant.ident;
        let constructor = quote! { #name::#variant_ident };
        generate_variants_match(variant, &constructor)
    };
    let variants_match = variants.into_iter().filter_map(format_variant);

    quote! {
        match self {
           #(#variants_match,)*
           _ => Doc::Null
        }
    }
}
