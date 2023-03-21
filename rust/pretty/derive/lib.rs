extern crate proc_macro;

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput, Fields, Variant};

#[proc_macro_derive(Pretty)]
pub fn pretty_derive(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = &input.ident;
    let generics = &input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let doc_match = match &input.data {
        Data::Struct(data_struct) => match &data_struct.fields {
            Fields::Named(fields) => {
                let field_match = fields.named.iter().map(|field| {
                    let field_name = &field.ident;
                    quote! { #field_name: self.#field_name.into() }
                });
                quote! { Doc::from(#name { #(#field_match,)* }) }
            }
            _ => panic!("Only named fields are supported."),
        },
        Data::Enum(data_enum) => {
            let variant_match = data_enum.variants.iter().map(|variant| {
                let variant_name = &variant.ident;
                let constructor = quote! { #name::#variant_name };
                generate_variant_match(&constructor, &variant.fields)
            });
            quote! {
                match self {
                    #(#variant_match,)*
                }
            }
        }
        _ => panic!("Only structs and enums are supported."),
    };

    let expanded = quote! {
        impl #impl_generics Into<Doc> for #name #ty_generics #where_clause {
            fn into(self) -> Doc {
                #doc_match
            }
        }
    };

    TokenStream::from(expanded)
}

fn generate_variant_match(constructor: &proc_macro2::TokenStream, fields: &Fields) -> proc_macro2::TokenStream {
    match fields {
        Fields::Unnamed(fields) => {
            let field_bindings = fields.unnamed.iter().enumerate().map(|(i, _)| syn::Ident::new(&format!("x{}", i), proc_macro2::Span::call_site()));
            quote! {
                #constructor(#(#field_bindings),*) => Doc::from((#(#field_bindings.into()),*))
            }
        }
        Fields::Named(fields) => {
            let field_bindings = fields.named.iter().map(|field| field.ident.as_ref().unwrap());
            quote! {
                #constructor { #(#field_bindings),* } => Doc::from((#(#field_bindings.into()),*))
            }
        }
        Fields::Unit => {
            quote! {
                #constructor => Doc::from(())
            }
        }
    }
}
