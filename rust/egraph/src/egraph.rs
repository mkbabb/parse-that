//! The `EGraph` struct — core data structure backing equality saturation.

use std::collections::HashMap;
use std::hash::BuildHasherDefault;

use rustc_hash::FxHasher;

use crate::analysis::{Analysis, NoAnalysis};
use crate::eclass::EClass;
use crate::id::Id;
use crate::language::Language;
use crate::unionfind::UnionFind;

type FxHashMap<K, V> = HashMap<K, V, BuildHasherDefault<FxHasher>>;

/// The e-graph: a compact representation of many equivalent forms of
/// expressions in a language `N`, with per-class analysis `A`.
///
/// Parameterized over the node type `N` (implementing `Language`) and the
/// analysis `A` (implementing `Analysis<N>`). Use `NoAnalysis` when no
/// analysis is needed.
#[derive(Clone)]
pub struct EGraph<N: Language, A: Analysis<N> = NoAnalysis> {
    /// Union-find of e-class IDs.
    unionfind: UnionFind,
    /// All e-classes, indexed by their canonical `Id.as_usize()`.
    /// After rebuild, every non-canonical class is empty (moved into its
    /// canonical parent).
    classes: Vec<EClass<N, A>>,
    /// Hashcons: canonical e-node (with canonicalized children) → class ID.
    /// Used to detect existing nodes on `add` and to rebuild after unions.
    memo: FxHashMap<N, Id>,
    /// Worklist of classes whose nodes need canonicalization after unions.
    pending: Vec<Id>,
    /// Worklist of classes whose analysis may need updating after unions.
    analysis_pending: Vec<Id>,
    /// Bookkeeping: total number of rebuilds invoked.
    rebuild_count: u32,
    /// Bookkeeping: total number of `union` calls that actually merged
    /// two distinct classes (no-op unions on equal classes are not
    /// counted). Used by the scheduler's saturation detection — a
    /// rewrite rule that only unions (without adding new nodes) still
    /// does real work, and `total_nodes` alone would miss it.
    union_count: u64,
}

impl<N: Language> Default for EGraph<N, NoAnalysis> {
    fn default() -> Self {
        Self::new()
    }
}

impl<N: Language, A: Analysis<N>> EGraph<N, A> {
    /// Create a new empty e-graph.
    pub fn new() -> Self {
        Self {
            unionfind: UnionFind::new(),
            classes: Vec::new(),
            memo: FxHashMap::default(),
            pending: Vec::new(),
            analysis_pending: Vec::new(),
            rebuild_count: 0,
            union_count: 0,
        }
    }

    /// Create a new empty e-graph pre-sized for `expected_nodes` interned
    /// e-nodes.
    ///
    /// The hash-cons table (`memo`) and the e-class table (`classes`) are
    /// allocated up front to the requested capacity. This avoids the chain of
    /// re-hashes / vector growths that would otherwise fire as the e-graph
    /// fills, AND — critically for small grammars — keeps the dropped capacity
    /// proportional to actual occupancy. Without a capacity hint the default
    /// `FxHashMap` settles at the next power of two, which on a ~300-node
    /// grammar can leave a 1024-bucket table whose teardown dominates the
    /// compile profile.
    pub fn with_capacity(expected_nodes: usize) -> Self {
        Self {
            unionfind: UnionFind::with_capacity(expected_nodes),
            classes: Vec::with_capacity(expected_nodes),
            memo: FxHashMap::with_capacity_and_hasher(expected_nodes, Default::default()),
            pending: Vec::new(),
            analysis_pending: Vec::new(),
            rebuild_count: 0,
            union_count: 0,
        }
    }

    /// Total number of e-classes (including canonicalized non-root classes
    /// that still occupy a slot in `classes`).
    pub fn total_classes(&self) -> usize {
        self.classes.len()
    }

    /// Total number of e-nodes across all classes.
    pub fn total_nodes(&self) -> usize {
        self.classes.iter().map(|c| c.nodes.len()).sum()
    }

    /// Number of rebuilds performed.
    pub fn rebuild_count(&self) -> u32 {
        self.rebuild_count
    }

    /// Number of `union` calls that actually merged two distinct
    /// classes since this e-graph was created. Incremented only when
    /// `ra != rb`; no-op self-unions are not counted.
    pub fn union_count(&self) -> u64 {
        self.union_count
    }

    /// Find the canonical `Id` for `id` (with path compression).
    pub fn find(&mut self, id: Id) -> Id {
        self.unionfind.find(id)
    }

    /// Find the canonical `Id` without mutating (no path compression).
    pub fn find_ref(&self, id: Id) -> Id {
        self.unionfind.find_ref(id)
    }

    /// Borrow an e-class by its ID. The ID should be canonical —
    /// non-canonical IDs return the class they've been merged into.
    pub fn class(&self, id: Id) -> &EClass<N, A> {
        let canonical = self.unionfind.find_ref(id);
        &self.classes[canonical.as_usize()]
    }

    /// Borrow an e-class mutably.
    pub fn class_mut(&mut self, id: Id) -> &mut EClass<N, A> {
        let canonical = self.unionfind.find(id);
        &mut self.classes[canonical.as_usize()]
    }

    /// Iterate over all canonical e-classes. Skips empty slots left behind
    /// after unions (their nodes have been moved to their canonical parent).
    pub fn classes(&self) -> impl Iterator<Item = &EClass<N, A>> {
        self.classes.iter().filter(|c| !c.nodes.is_empty())
    }

    /// Canonicalize an e-node in place: replace each child ID with its
    /// canonical representative.
    pub fn canonicalize(&self, node: &mut N) {
        for child in node.children_mut() {
            *child = self.unionfind.find_ref(*child);
        }
    }

    /// Add an e-node, returning the `Id` of its (possibly-existing) e-class.
    ///
    /// If an equivalent e-node is already present, returns the existing
    /// e-class ID. Otherwise creates a fresh singleton class, registers
    /// parent edges on each child class, and computes the initial analysis.
    pub fn add(&mut self, mut node: N) -> Id {
        self.canonicalize(&mut node);
        if let Some(&existing) = self.memo.get(&node) {
            return self.unionfind.find(existing);
        }

        // Create a fresh class.
        let id = self.unionfind.make_set();
        debug_assert_eq!(id.as_usize(), self.classes.len());

        // Snapshot child IDs before borrowing `self` for analysis or mutation.
        let child_ids: Vec<Id> = node.children().to_vec();

        // Compute analysis data while `self` is immutably borrowable.
        // `A::make` may inspect child classes via `self.class(child)` — all
        // child classes already exist because children were added first.
        let data = A::make(self, &node);

        // Pre-clone the node for each child's parent edge + the memo key.
        // The original is moved into the class's node list (zero-clone path).
        let mut clones: Vec<N> = (0..child_ids.len() + 1).map(|_| node.clone()).collect();
        let memo_key = clones.pop().unwrap();

        // Create the class with the original node moved in.
        self.classes.push(EClass {
            id,
            nodes: vec![node],
            data,
            parents: Vec::new(),
        });

        // Register parent edges on each child's class.
        for (child_id, parent_clone) in child_ids.into_iter().zip(clones) {
            let child_canonical = self.unionfind.find(child_id);
            self.classes[child_canonical.as_usize()]
                .parents
                .push((parent_clone, id));
        }

        self.memo.insert(memo_key, id);
        id
    }

    /// Union two e-classes, merging all their e-nodes and analyses.
    ///
    /// Returns the new canonical `Id`. If `a` and `b` were already in the
    /// same class, returns that class's ID without doing work.
    pub fn union(&mut self, a: Id, b: Id) -> Id {
        let ra = self.unionfind.find(a);
        let rb = self.unionfind.find(b);
        if ra == rb {
            return ra;
        }
        self.union_count += 1;
        // Pick the bigger class as the merge target.
        let (dst, src) =
            if self.classes[ra.as_usize()].nodes.len() >= self.classes[rb.as_usize()].nodes.len() {
                (ra, rb)
            } else {
                (rb, ra)
            };
        // Union-find bookkeeping: point src at dst.
        self.unionfind.union(dst, src);
        // Replace src with an empty placeholder, carrying over dst's current
        // data as the placeholder's analysis. Clone required: `A::merge`
        // consumes src's data by value, so the src slot needs a valid
        // `A::Data` for drop safety, and `A::Data` has no `Default` bound.
        let dst_data = self.classes[dst.as_usize()].data.clone();
        let src_class = std::mem::replace(
            &mut self.classes[src.as_usize()],
            EClass {
                id: src,
                nodes: Vec::new(),
                data: dst_data,
                parents: Vec::new(),
            },
        );
        let dst_class = &mut self.classes[dst.as_usize()];
        dst_class.nodes.extend(src_class.nodes);
        dst_class.parents.extend(src_class.parents);
        let changed = A::merge(&mut dst_class.data, src_class.data);
        if changed {
            self.analysis_pending.push(dst);
        }
        // Src's parent edges may now have non-canonical children; schedule
        // rebuild.
        self.pending.push(dst);
        dst
    }

    /// Rebuild the e-graph: canonicalize all e-nodes after pending unions,
    /// re-memo them, and propagate parent edges until a fixed point.
    ///
    /// Must be called after a batch of `union` operations before reading
    /// the e-graph (`classes()`, `class()`, etc.) — the memo table and
    /// parent pointers are stale until rebuild completes.
    pub fn rebuild(&mut self) {
        while !self.pending.is_empty() || !self.analysis_pending.is_empty() {
            while let Some(class_id) = self.pending.pop() {
                let canonical = self.unionfind.find(class_id);
                // Re-canonicalize every node in this class and re-memoize.
                let parents = std::mem::take(&mut self.classes[canonical.as_usize()].parents);
                for (mut parent_node, parent_class) in parents {
                    // Remove the old, pre-canonicalization memo entry.
                    self.memo.remove(&parent_node);
                    self.canonicalize(&mut parent_node);
                    let parent_canonical = self.unionfind.find(parent_class);
                    if let Some(&existing) = self.memo.get(&parent_node) {
                        // Duplicate — union with the existing class and
                        // schedule another rebuild.
                        let merged = self.union(existing, parent_canonical);
                        let _ = merged;
                    } else {
                        // Clone required: memo takes ownership of the key,
                        // and the node is also stored in the parents list.
                        self.memo.insert(parent_node.clone(), parent_canonical);
                        self.classes[canonical.as_usize()]
                            .parents
                            .push((parent_node, parent_canonical));
                    }
                }
                // Canonicalize the nodes stored in this class too, and
                // de-duplicate via linear scan. E-classes are typically
                // small, so Vec::contains is cheaper than HashMap
                // construction and avoids cloning each node for the set.
                let nodes = std::mem::take(&mut self.classes[canonical.as_usize()].nodes);
                let mut kept = Vec::with_capacity(nodes.len());
                for mut n in nodes {
                    self.canonicalize(&mut n);
                    if !kept.contains(&n) {
                        kept.push(n);
                    }
                }
                self.classes[canonical.as_usize()].nodes = kept;
            }
            while let Some(class_id) = self.analysis_pending.pop() {
                let canonical = self.unionfind.find(class_id);
                A::modify(self, canonical);
            }
        }
        self.rebuild_count += 1;
    }
}
