//! `HirENode` — the regex HIR e-node type used by the HIR e-graph.
//!
//! # Why a separate type?
//!
//! The `Hir` enum is an *owning tree*: children are `Box<Hir>` /
//! `Vec<Hir>` so consumers can walk and inspect the structure
//! without an e-graph in scope. An e-graph, on the other hand,
//! stores hash-consed nodes in an arena and represents children as
//! `egraph::Id` (indices into the arena's union-find).
//!
//! These two shapes are structurally incompatible: a `Box<Hir>`
//! field cannot become a `Box<Id>` field at runtime, because the
//! latter doesn't own the child. Every published e-graph library
//! (egg, egglog, Cranelift ægraphs) draws this same owning-type /
//! e-node-type distinction — it is load-bearing, not incidental.
//!
//! `HirENode` mirrors `Hir` variant-for-variant with children
//! projected to `Id`:
//!
//! | `Hir` field type      | `HirENode` field type |
//! |-----------------------|-----------------------|
//! | `Box<Hir>`            | `Id`                  |
//! | `Vec<Hir>`            | `Box<[Id]>`           |
//! | scalar / non-rec leaf | same type             |
//!
//! Leaf data (literal bytes, char classes, look-assertions,
//! repetition bounds) round-trips verbatim so two distinct leaves
//! occupy distinct e-classes.
//!
//! The `Language` impl is auto-derived via
//! `egraph_derive::Language`, which classifies fields by type
//! (`Id`, `Box<[Id]>`) and projects them into the required
//! `children() -> &[Id]` slice.

use egraph::Id;
use egraph_derive::Language;

use crate::hir::{CharClass, Look};

/// E-node form of a regex HIR node. Children are `egraph::Id`.
/// Two e-nodes are equal (and share an e-class) iff every
/// non-child field matches and every child Id is canonically
/// equal after union-find compaction.
#[derive(Clone, Debug, PartialEq, Eq, Hash, Language)]
pub enum HirENode {
    /// Matches the empty string.
    Empty,
    /// Literal byte sequence. Owned bytes — two distinct byte
    /// sequences occupy distinct e-classes.
    Literal(Box<[u8]>),
    /// Character class. `CharClass` derives structural equality
    /// so distinct byte-range sets occupy distinct e-classes.
    Class(CharClass),
    /// Zero-width look assertion.
    Look(Look),
    /// Quantified sub-expression. The scalar fields (`min`, `max`,
    /// `greedy`) participate in structural equality. `sub` is the
    /// single e-class Id child — `egraph_derive::Language`
    /// classifies it as `FieldKind::SingleId` and produces
    /// `children() -> &[sub]`.
    Repetition {
        sub: Id,
        min: u32,
        max: Option<u32>,
        greedy: bool,
    },
    /// Transparent capture group — contains one child.
    Group(Id),
    /// Concatenation of sub-expressions.
    Concat(Box<[Id]>),
    /// Alternation of sub-expressions.
    Alternation(Box<[Id]>),
}
