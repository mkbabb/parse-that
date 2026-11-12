//! Stage-1 structural-index output type.
//!
//! `StructuralIndex` is the wire contract between the SIMD scanner
//! and grammar-derived parser dispatch. The scanner builds it from
//! input bytes; consumers read the sorted position/kind columns to
//! bound lookahead, structural dispatch, and regex search windows.

/// Stage-1 structural index: every byte in `positions` is a position
/// in the original input where the parser may need to dispatch, and
/// `kinds[i]` carries the byte or synthetic discriminant at that
/// position.
///
/// Both columns are sorted by `positions` ascending and must have
/// equal length.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct StructuralIndex {
    /// Input byte offsets of structural bytes. Strictly monotone.
    pub positions: Vec<u32>,
    /// Per-position kind discriminant. Length matches `positions`.
    pub kinds: Vec<u8>,
}

impl StructuralIndex {
    /// Number of structural positions in the index.
    #[inline]
    pub fn len(&self) -> usize {
        self.positions.len()
    }

    /// `true` iff the input contained no structural bytes.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.positions.is_empty()
    }

    /// Construct an empty index. Equivalent to `Default::default()`.
    #[inline]
    pub const fn new() -> Self {
        Self {
            positions: Vec::new(),
            kinds: Vec::new(),
        }
    }

    /// Construct an index with pre-allocated capacity for `n`
    /// positions. Stage-1 scanners size this from an expected
    /// structural-byte density.
    #[inline]
    pub fn with_capacity(n: usize) -> Self {
        Self {
            positions: Vec::with_capacity(n),
            kinds: Vec::with_capacity(n),
        }
    }

    /// Append one `(position, kind)` pair. Caller maintains
    /// monotonicity.
    #[inline]
    pub fn push(&mut self, pos: u32, kind: u8) {
        self.positions.push(pos);
        self.kinds.push(kind);
    }

    /// Drop both columns to length zero, retaining capacity.
    #[inline]
    pub fn clear(&mut self) {
        self.positions.clear();
        self.kinds.clear();
    }

    /// Return the smallest `positions[i]` that is `>= from`, or
    /// `None` when every position is below `from`.
    #[inline]
    pub fn next_structural_at_or_after(&self, from: u32) -> Option<u32> {
        match self.positions.binary_search(&from) {
            Ok(idx) => Some(self.positions[idx]),
            Err(idx) => self.positions.get(idx).copied(),
        }
    }

    /// Return the smallest slot `i` such that `positions[i] >= from`,
    /// or `None` when every position is below `from`.
    #[inline]
    pub fn next_structural_slot_at_or_after(&self, from: u32) -> Option<usize> {
        match self.positions.binary_search(&from) {
            Ok(idx) => Some(idx),
            Err(idx) => {
                if idx < self.positions.len() {
                    Some(idx)
                } else {
                    None
                }
            }
        }
    }
}

/// Return the smallest position in `index.positions` that is
/// `>= from`, or `None` if every position is below `from`.
#[inline]
pub fn next_structural_at_or_after(index: &StructuralIndex, from: u32) -> Option<u32> {
    index.next_structural_at_or_after(from)
}

/// The output of [`crate::stage1`]: the structural bytes and the atom
/// starts (pseudo-structural positions) of an input, merged in input
/// order.
///
/// `index.positions[j]` and `index.kinds[j]` are slot `j`'s offset and
/// byte; [`Stage1Index::is_atom`] says whether slot `j` starts an atom
/// (a scalar: a string literal, a number, a name) rather than being a
/// structural byte. The atom flags are a bitset over the slots.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Stage1Index {
    /// Every slot's position and byte.
    pub index: StructuralIndex,
    /// Bit `j % 64` of word `j / 64` is set iff slot `j` is an atom start.
    pub atoms: Vec<u64>,
}

impl Stage1Index {
    /// An empty index with room for `n` slots.
    #[inline]
    pub fn with_capacity(n: usize) -> Self {
        Self {
            index: StructuralIndex::with_capacity(n),
            atoms: Vec::with_capacity(n.div_ceil(64)),
        }
    }

    /// Number of slots.
    #[inline]
    pub fn len(&self) -> usize {
        self.index.len()
    }

    /// `true` iff there are no slots.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.index.is_empty()
    }

    /// Append one slot. The caller keeps positions strictly increasing.
    #[inline]
    pub fn push(&mut self, pos: u32, kind: u8, atom: bool) {
        let slot = self.index.positions.len();
        if slot.is_multiple_of(64) {
            self.atoms.push(0);
        }
        if atom {
            // The word for `slot` was pushed above or by an earlier slot.
            if let Some(w) = self.atoms.last_mut() {
                *w |= 1u64 << (slot % 64);
            }
        }
        self.index.push(pos, kind);
    }

    /// Whether slot `slot` is an atom start (`false` past the end).
    #[inline]
    pub fn is_atom(&self, slot: usize) -> bool {
        slot < self.len() && self.atoms[slot / 64] >> (slot % 64) & 1 == 1
    }

    /// The positions of the atom starts, in order.
    pub fn atom_positions(&self) -> impl Iterator<Item = u32> + '_ {
        (0..self.len())
            .filter(|&j| self.is_atom(j))
            .map(|j| self.index.positions[j])
    }

    /// The positions of the structural (non-atom) slots, in order.
    pub fn structural_positions(&self) -> impl Iterator<Item = u32> + '_ {
        (0..self.len())
            .filter(|&j| !self.is_atom(j))
            .map(|j| self.index.positions[j])
    }
}
