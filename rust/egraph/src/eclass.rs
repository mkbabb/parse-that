//! `EClass` — equivalence class of e-nodes.

use crate::analysis::Analysis;
use crate::id::Id;
use crate::language::Language;

/// A single equivalence class in the e-graph.
///
/// Contains all e-nodes known to be equivalent (regardless of whether they
/// were added directly or arose from rewrites), the class's canonical `Id`,
/// and its analysis data.
#[derive(Clone)]
pub struct EClass<N: Language, A: Analysis<N>> {
    /// The canonical ID for this class. Equal to `egraph.find(id)` for any
    /// `id` in this class.
    pub id: Id,
    /// All e-nodes in this class. May contain duplicates after unions —
    /// these are de-duplicated during rebuild.
    pub nodes: Vec<N>,
    /// Per-class analysis data (lattice-joined across all e-nodes).
    pub data: A::Data,
    /// Parent edges: `(parent_node, parent_class_id)` for every e-node that
    /// has this class as a child. Used during rebuild to propagate unions
    /// upwards.
    pub(crate) parents: Vec<(N, Id)>,
}

impl<N: Language, A: Analysis<N>> EClass<N, A> {
    /// Number of e-nodes in this class.
    pub fn len(&self) -> usize {
        self.nodes.len()
    }

    /// Whether the class has no nodes (shouldn't happen in a well-formed
    /// e-graph, but defensive for partial rebuilds).
    pub fn is_empty(&self) -> bool {
        self.nodes.is_empty()
    }

    /// Iterate over the e-nodes in this class.
    pub fn iter(&self) -> std::slice::Iter<'_, N> {
        self.nodes.iter()
    }
}
