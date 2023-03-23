extern crate proc_macro;

use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{parse_macro_input, Attribute, Data, DeriveInput, Fields, Meta, NestedMeta};

#[proc_macro_derive(Pretty, attributes(pretty))]
pub fn pretty_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = &input.ident;
    let generics = &input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let doc_match = match &input.data {
        Data::Struct(data_struct) => generate_struct_match(&name, &data_struct.fields),
        Data::Enum(data_enum) => {
            let variant_match = data_enum.variants.iter().map(|variant| {
                let variant_ident = &variant.ident;
                let constructor = quote! { #name::#variant_ident };
                generate_variant_match(&constructor, &variant_ident, &variant.fields)
            });
            quote! {
                match self {
                   #(#variant_match,)*
                }
            }
        }
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
                use pretty::{concat, indent, wrap, join, Doc, str, Join, Wrap, Group, Indent};
                #doc_match
            }
        }
    };

    TokenStream::from(expanded)
}

fn generate_struct_match(name: &syn::Ident, fields: &Fields) -> proc_macro2::TokenStream {
    let field_match = generate_struct_fields_match(fields);

    match fields {
        Fields::Named(_) | Fields::Unnamed(_) => {
            quote! {
                let body = vec![#(#field_match,)*]
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
                format!("{}", stringify!(#name)).into()
            }
        }
    }
}

fn get_pretty_attrs(attrs: &[Attribute]) -> (bool, bool) {
    let mut ignore = false;
    let mut indent = false;

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
                    ignore = lit_bool.value;
                }
            } else if name_value.path.is_ident("indent") {
                if let syn::Lit::Bool(lit_bool) = &name_value.lit {
                    indent = lit_bool.value;
                }
            }
        }
    }

    (ignore, indent)
}

fn generate_field_doc(
    field_doc: proc_macro2::TokenStream,
    indent: bool,
) -> proc_macro2::TokenStream {
    if indent {
        quote! { Doc::from(#field_doc).indent() }
    } else {
        field_doc
    }
}

fn generate_struct_fields_match(fields: &Fields) -> Vec<proc_macro2::TokenStream> {
    let format_key_value = |key: &Option<syn::Ident>, value: &proc_macro2::TokenStream| {
        return quote! {
            concat(vec![
                stringify!(#key).into(),
                Doc::Str(": "),
                #value,
            ])
        };
    };

    match fields {
        Fields::Named(fields) => fields
            .named
            .iter()
            .filter_map(|field| {
                let field_name = &field.ident;
                let (ignore, indent) = get_pretty_attrs(&field.attrs);
                if ignore {
                    return None;
                }
                let field_doc = generate_field_doc(quote! { self.#field_name.into() }, indent);
                Some(format_key_value(&field_name, &field_doc))
            })
            .collect(),
        Fields::Unnamed(fields) => fields
            .unnamed
            .iter()
            .enumerate()
            .filter_map(|(i, field)| {
                let field_name = Some(format_ident!("field_{}", i));
                let (ignore, indent) = get_pretty_attrs(&field.attrs);
                if ignore {
                    return None;
                }
                let field_doc = generate_field_doc(quote! { self.#field_name.into() }, indent);
                Some(format_key_value(&field_name, &field_doc))
            })
            .collect(),
        Fields::Unit => vec![],
    }
}

fn generate_variant_match(
    constructor: &proc_macro2::TokenStream,
    name: &syn::Ident,
    fields: &Fields,
) -> proc_macro2::TokenStream {
    match fields {
        Fields::Unnamed(fields) => {
            let field_bindings = fields
                .unnamed
                .iter()
                .enumerate()
                .map(|(i, _)| format_ident!("field_{}", i));
            let field_bindings_2 = field_bindings.clone();
            quote! {
                #constructor(#(#field_bindings),*) => Doc::from((#(#field_bindings_2.into()),*))
            }
        }
        Fields::Named(fields) => {
            let field_bindings = fields
                .named
                .iter()
                .map(|field| field.ident.as_ref().unwrap());
            let field_bindings_2 = field_bindings.clone();
            quote! {
                #constructor { #(#field_bindings),* } => Doc::from((#(#field_bindings_2.into()),*))
            }
        }
        Fields::Unit => {
            quote! {
                #constructor =>  format!("{}", stringify!(#name)).into()
            }
        }
    }
}
