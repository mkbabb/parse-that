//! `#[derive(Language)]` — generate `Language` impl for an e-node enum.
//!
//! The derive walks each variant of the input enum and projects child-bearing
//! fields into a single `children(&self) -> &[Id]` slice. Field classification
//! is **automatic** based on type:
//!
//! - `Id` → a single child
//! - `Box<[Id]>`, `Vec<Id>`, `[Id; N]` → a variadic child slice
//! - Anything else → a leaf (metadata, scalars, non-recursive types)
//!
//! Explicit `#[language(child)]` / `#[language(children)]` attributes are
//! still honored for disambiguation, but are no longer required for the
//! common cases.
//!
//! ## Multi-child variants
//!
//! The e-graph requires `children()` to return a contiguous `&[Id]` slice.
//! Variants with a single tagged field project directly. Variants with
//! multiple tagged fields must store them in a single `[Id; N]` or
//! `Box<[Id]>` field — the derive refuses scattered `Id` fields because
//! there's no portable way to return a slice over non-adjacent struct
//! fields without relying on layout guarantees.
//!
//! ## Example
//!
//! ```rust,ignore
//! use parse_that_egraph::Id;
//! use parse_that_egraph_derive::Language;
//!
//! #[derive(Clone, Eq, PartialEq, Hash, Language)]
//! pub enum Expr {
//!     Num(i64),                        // leaf (auto — not an Id type)
//!     Neg(Id),                         // single child (auto)
//!     Sum(Box<[Id]>),                  // variadic (auto)
//!     Pow { base: Id, exp: u32 },      // field + scalar (auto)
//!     Pair([Id; 2]),                   // two children via fixed array
//! }
//! ```
//!
//! Each variant generates one arm of the `children`/`children_mut` match.

use proc_macro::TokenStream;
use proc_macro2::TokenStream as TokenStream2;
use quote::{format_ident, quote};
use syn::{Data, DeriveInput, Fields, Ident, Type, parse_macro_input};

/// The `#[derive(Language)]` proc macro.
#[proc_macro_derive(Language, attributes(language))]
pub fn derive_language(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let (impl_generics, ty_generics, where_clause) = input.generics.split_for_impl();

    let Data::Enum(data_enum) = &input.data else {
        return syn::Error::new_spanned(&input, "#[derive(Language)] only supports enums")
            .to_compile_error()
            .into();
    };

    let mut children_arms = Vec::new();
    let mut children_mut_arms = Vec::new();

    for variant in &data_enum.variants {
        let variant_ident = &variant.ident;
        let arms_result: syn::Result<VariantArms> = match &variant.fields {
            Fields::Unit => Ok(VariantArms::unit(name, variant_ident)),
            Fields::Unnamed(fields_unnamed) => {
                variant_arms(name, variant_ident, &fields_unnamed.unnamed, false)
            }
            Fields::Named(fields_named) => {
                variant_arms(name, variant_ident, &fields_named.named, true)
            }
        };
        match arms_result {
            Ok(arms) => {
                children_arms.push(arms.children);
                children_mut_arms.push(arms.children_mut);
            }
            Err(err) => return err.to_compile_error().into(),
        }
    }

    let expanded = quote! {
        #[automatically_derived]
        impl #impl_generics ::parse_that_egraph::Language for #name #ty_generics #where_clause {
            fn children(&self) -> &[::parse_that_egraph::Id] {
                match self {
                    #(#children_arms,)*
                }
            }

            fn children_mut(&mut self) -> &mut [::parse_that_egraph::Id] {
                match self {
                    #(#children_mut_arms,)*
                }
            }
        }
    };

    expanded.into()
}

struct VariantArms {
    children: TokenStream2,
    children_mut: TokenStream2,
}

impl VariantArms {
    fn unit(name: &Ident, variant: &Ident) -> Self {
        Self {
            children: quote! { #name::#variant => &[] },
            children_mut: quote! { #name::#variant => &mut [] },
        }
    }
}

/// Build the match arms for a single struct-like or tuple-like variant.
fn variant_arms(
    name: &Ident,
    variant: &Ident,
    fields: &syn::punctuated::Punctuated<syn::Field, syn::Token![,]>,
    named: bool,
) -> syn::Result<VariantArms> {
    // Collect one (binding, field_ident, kind) per field.
    let mut pairs: Vec<(Ident, Option<syn::Ident>, FieldKind)> = Vec::new();
    for (i, field) in fields.iter().enumerate() {
        let binding = format_ident!("__f{}", i);
        let field_name = field.ident.clone();
        let kind = classify_field(field)?;
        pairs.push((binding, field_name, kind));
    }

    let tagged: Vec<&(Ident, Option<syn::Ident>, FieldKind)> = pairs
        .iter()
        .filter(|(_, _, k)| !matches!(k, FieldKind::Leaf))
        .collect();

    // Destructuring pattern (named vs tuple).
    let pattern = if named {
        let binds: Vec<TokenStream2> = pairs
            .iter()
            .map(|(binding, field_name, kind)| {
                let n = field_name.as_ref().expect("named field");
                if matches!(kind, FieldKind::Leaf) {
                    quote! { #n: _ }
                } else {
                    quote! { #n: #binding }
                }
            })
            .collect();
        quote! { #name::#variant { #(#binds),* } }
    } else {
        let binds: Vec<TokenStream2> = pairs
            .iter()
            .map(|(binding, _, kind)| {
                if matches!(kind, FieldKind::Leaf) {
                    quote! { _ }
                } else {
                    quote! { #binding }
                }
            })
            .collect();
        quote! { #name::#variant(#(#binds),*) }
    };

    // No tagged fields: empty slice.
    if tagged.is_empty() {
        let pattern_ignore = if named {
            quote! { #name::#variant { .. } }
        } else {
            let ignores: Vec<TokenStream2> = pairs.iter().map(|_| quote! { _ }).collect();
            quote! { #name::#variant(#(#ignores),*) }
        };
        return Ok(VariantArms {
            children: quote! { #pattern_ignore => &[] },
            children_mut: quote! { #pattern_ignore => &mut [] },
        });
    }

    // Single tagged field: direct slice projection.
    if tagged.len() == 1 {
        let (binding, _, kind) = tagged[0];
        let (child_expr, child_mut_expr) = match kind {
            FieldKind::Leaf => unreachable!(),
            FieldKind::SingleId => (
                quote! { ::std::slice::from_ref(#binding) },
                quote! { ::std::slice::from_mut(#binding) },
            ),
            FieldKind::SliceId => (quote! { &#binding[..] }, quote! { &mut #binding[..] }),
            FieldKind::ArrayId => (quote! { &#binding[..] }, quote! { &mut #binding[..] }),
        };
        return Ok(VariantArms {
            children: quote! { #pattern => #child_expr },
            children_mut: quote! { #pattern => #child_mut_expr },
        });
    }

    // Multiple tagged fields: reject with an actionable error. The e-graph
    // algorithms require `children()` to return a contiguous slice, and
    // there's no portable way to project two non-adjacent `Id` fields
    // into a single slice without relying on #[repr(C)] layout guarantees.
    //
    // Users should rewrap their children into a single `[Id; N]` or
    // `Box<[Id]>` field. For example, `Skip(Id, Id)` becomes
    // `Skip([Id; 2])` and call sites destructure the array.
    let span = variant.span();
    Err(syn::Error::new(
        span,
        "Language derive: variants with multiple recursive fields must combine \
         them into a single `[Id; N]` or `Box<[Id]>` field. The e-graph \
         requires contiguous child storage for `children() -> &[Id]`.",
    ))
}

#[derive(Debug)]
enum FieldKind {
    /// Non-recursive / metadata field (scalars, byte strings, etc.).
    Leaf,
    /// A single `Id` field.
    SingleId,
    /// A `Box<[Id]>` or `Vec<Id>` field.
    SliceId,
    /// A `[Id; N]` fixed-size array.
    ArrayId,
}

fn classify_field(field: &syn::Field) -> syn::Result<FieldKind> {
    // Explicit attributes still win for disambiguation.
    for attr in &field.attrs {
        if !attr.path().is_ident("language") {
            continue;
        }
        let mut kind: Option<FieldKind> = None;
        attr.parse_nested_meta(|meta| {
            if meta.path.is_ident("child") {
                kind = Some(FieldKind::SingleId);
                Ok(())
            } else if meta.path.is_ident("children") {
                kind = Some(FieldKind::SliceId);
                Ok(())
            } else if meta.path.is_ident("skip") {
                kind = Some(FieldKind::Leaf);
                Ok(())
            } else {
                Err(meta.error(
                    "unknown #[language(...)] attribute — expected `child`, `children`, or `skip`",
                ))
            }
        })?;
        if let Some(k) = kind {
            return Ok(k);
        }
    }
    // No explicit annotation — infer from the field type.
    Ok(infer_field_kind(&field.ty))
}

/// Infer field classification from its `syn::Type`.
///
/// Recognizes:
/// - `Id` → SingleId
/// - `Box<[Id]>` → SliceId
/// - `Vec<Id>` → SliceId
/// - `[Id; N]` → ArrayId
/// - anything else → Leaf (metadata)
fn infer_field_kind(ty: &Type) -> FieldKind {
    if type_is_id(ty) {
        return FieldKind::SingleId;
    }
    if type_is_boxed_id_slice(ty) || type_is_vec_of_id(ty) {
        return FieldKind::SliceId;
    }
    if type_is_id_array(ty) {
        return FieldKind::ArrayId;
    }
    FieldKind::Leaf
}

/// Match the last path segment — accept fully-qualified (`::parse_that_egraph::Id`,
/// `parse_that_egraph::Id`) or bare (`Id`) forms.
fn path_tail_is(ty: &Type, want: &str) -> bool {
    if let Type::Path(tp) = ty
        && let Some(last) = tp.path.segments.last()
    {
        return last.ident == want;
    }
    false
}

fn type_is_id(ty: &Type) -> bool {
    path_tail_is(ty, "Id")
}

/// `[Id; N]` for any N — used for multi-child variants like `Skip([Id; 2])`.
fn type_is_id_array(ty: &Type) -> bool {
    if let Type::Array(arr) = ty {
        return type_is_id(&arr.elem);
    }
    false
}

/// `Box<[Id]>` — single type param `Box`, inner is a slice of `Id`.
fn type_is_boxed_id_slice(ty: &Type) -> bool {
    let Type::Path(tp) = ty else {
        return false;
    };
    let Some(last) = tp.path.segments.last() else {
        return false;
    };
    if last.ident != "Box" {
        return false;
    }
    let syn::PathArguments::AngleBracketed(args) = &last.arguments else {
        return false;
    };
    let Some(syn::GenericArgument::Type(inner)) = args.args.first() else {
        return false;
    };
    if let Type::Slice(slice) = inner {
        return type_is_id(&slice.elem);
    }
    false
}

/// `Vec<Id>` — single type param `Vec`, inner is `Id`.
fn type_is_vec_of_id(ty: &Type) -> bool {
    let Type::Path(tp) = ty else {
        return false;
    };
    let Some(last) = tp.path.segments.last() else {
        return false;
    };
    if last.ident != "Vec" {
        return false;
    }
    let syn::PathArguments::AngleBracketed(args) = &last.arguments else {
        return false;
    };
    let Some(syn::GenericArgument::Type(inner)) = args.args.first() else {
        return false;
    };
    type_is_id(inner)
}
