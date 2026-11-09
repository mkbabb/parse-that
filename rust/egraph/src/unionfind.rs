//! Union-find with path compression and union-by-rank.
//!
//! The core data structure backing e-class merging. Each e-class is
//! represented by a root in the disjoint-set forest; `find(id)` follows
//! parent pointers (compressing the path) to return the canonical root.

use crate::id::Id;

/// Union-find over `Id` values. Backed by a single `Vec<u32>` storing parent
/// indices (with rank encoded in a sibling vector for union-by-rank).
#[derive(Clone, Debug, Default)]
pub struct UnionFind {
    parents: Vec<u32>,
    ranks: Vec<u8>,
}

impl UnionFind {
    /// Create an empty union-find.
    pub fn new() -> Self {
        Self::default()
    }

    /// Create an empty union-find pre-sized for `expected` elements.
    pub fn with_capacity(expected: usize) -> Self {
        Self {
            parents: Vec::with_capacity(expected),
            ranks: Vec::with_capacity(expected),
        }
    }

    /// Allocate a fresh singleton set and return its `Id`.
    pub fn make_set(&mut self) -> Id {
        let idx = self.parents.len() as u32;
        self.parents.push(idx);
        self.ranks.push(0);
        Id(idx)
    }

    /// Number of elements (not number of sets).
    pub fn len(&self) -> usize {
        self.parents.len()
    }

    /// Whether the union-find is empty.
    pub fn is_empty(&self) -> bool {
        self.parents.is_empty()
    }

    /// Find the canonical representative of `id`, compressing the path.
    pub fn find(&mut self, id: Id) -> Id {
        let mut cur = id.0;
        // Walk to the root.
        let mut root = cur;
        while self.parents[root as usize] != root {
            root = self.parents[root as usize];
        }
        // Path compression: point every visited node directly at the root.
        while cur != root {
            let next = self.parents[cur as usize];
            self.parents[cur as usize] = root;
            cur = next;
        }
        Id(root)
    }

    /// Non-mutating find — does not compress the path. Use when you have
    /// only a `&UnionFind`.
    pub fn find_ref(&self, id: Id) -> Id {
        let mut cur = id.0;
        while self.parents[cur as usize] != cur {
            cur = self.parents[cur as usize];
        }
        Id(cur)
    }

    /// Union the two sets containing `a` and `b`. Returns the new root `Id`.
    ///
    /// If `a` and `b` were already in the same set, returns that set's root.
    pub fn union(&mut self, a: Id, b: Id) -> Id {
        let ra = self.find(a);
        let rb = self.find(b);
        if ra == rb {
            return ra;
        }
        let rank_a = self.ranks[ra.0 as usize];
        let rank_b = self.ranks[rb.0 as usize];
        // Point the shorter tree at the taller one.
        let (parent, child) = if rank_a < rank_b {
            (rb, ra)
        } else if rank_a > rank_b {
            (ra, rb)
        } else {
            // Equal ranks — arbitrary choice, increment the parent's rank.
            self.ranks[ra.0 as usize] = rank_a + 1;
            (ra, rb)
        };
        self.parents[child.0 as usize] = parent.0;
        parent
    }

    /// Whether `a` and `b` are in the same set.
    pub fn same_set(&mut self, a: Id, b: Id) -> bool {
        self.find(a) == self.find(b)
    }
}
