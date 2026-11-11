//! The `Language` trait: what a consumer e-node type must implement.

use std::hash::Hash;

use crate::id::Id;

/// An e-node type in the e-graph.
///
/// An e-node is one concrete term shape whose children are e-class IDs
/// (not sub-trees). Implementing this trait gives a type full e-graph
/// support: interning, equality saturation, and cost-model extraction.
///
/// Typically derived via `#[derive(parse_that_egraph_derive::Language)]` — the derive
/// mechanically generates the implementation by projecting `Vec<Self>`,
/// `Box<Self>`, and `Self` fields to `Id`.
pub trait Language: Clone + Eq + Hash {
    /// Slice-style read access to all child IDs in this e-node.
    ///
    /// The order must be stable — consumers rely on positional matching
    /// when applying rewrite rules.
    fn children(&self) -> &[Id];

    /// Mutable access to all child IDs. Used by the e-graph during rebuild
    /// when canonicalizing children after a union.
    fn children_mut(&mut self) -> &mut [Id];

    /// Whether two e-nodes have the same constructor/shape. Default impl
    /// uses `PartialEq`; consumers can override for more efficient matching
    /// if their `Eq` impl compares children as well.
    fn matches(&self, other: &Self) -> bool {
        self == other
    }

    /// Number of children (convenience).
    fn num_children(&self) -> usize {
        self.children().len()
    }

    /// Whether this is a leaf node (no children).
    fn is_leaf(&self) -> bool {
        self.children().is_empty()
    }

    /// Apply a function to each child ID, producing an owned e-node with
    /// the mapped IDs. Used during extraction to swap e-class IDs for their
    /// extracted child IDs.
    ///
    /// Default impl clones the node, then runs `children_mut` and maps in
    /// place. Override if a more efficient implementation is possible.
    fn map_children(&self, mut f: impl FnMut(Id) -> Id) -> Self {
        let mut cloned = self.clone();
        for child in cloned.children_mut() {
            *child = f(*child);
        }
        cloned
    }
}

/// A helper trait for opaque child containers — implemented by
/// `()`, `Box<Id>`, `[Id; N]`, `Box<[Id]>`, etc. Used by the derive macro
/// to uniformly project fields into a single `children()` slice.
///
/// Most consumers will never implement this directly.
pub trait LanguageChildren {
    /// Slice-style read access.
    fn as_slice(&self) -> &[Id];
    /// Slice-style mutable access.
    fn as_slice_mut(&mut self) -> &mut [Id];
}

impl LanguageChildren for () {
    fn as_slice(&self) -> &[Id] {
        &[]
    }
    fn as_slice_mut(&mut self) -> &mut [Id] {
        &mut []
    }
}

impl LanguageChildren for Id {
    fn as_slice(&self) -> &[Id] {
        std::slice::from_ref(self)
    }
    fn as_slice_mut(&mut self) -> &mut [Id] {
        std::slice::from_mut(self)
    }
}

impl LanguageChildren for Box<[Id]> {
    fn as_slice(&self) -> &[Id] {
        self
    }
    fn as_slice_mut(&mut self) -> &mut [Id] {
        self
    }
}

impl LanguageChildren for Vec<Id> {
    fn as_slice(&self) -> &[Id] {
        self
    }
    fn as_slice_mut(&mut self) -> &mut [Id] {
        self
    }
}

impl<const N: usize> LanguageChildren for [Id; N] {
    fn as_slice(&self) -> &[Id] {
        self
    }
    fn as_slice_mut(&mut self) -> &mut [Id] {
        self
    }
}
