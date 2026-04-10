//! Per-compile HIR canonicalization cache (Tranche X phase 3).
//!
//! `bbnf-ir::passes::regex_info::compute_regex_info` allocates one
//! cache per compile, drops it at the end, and threads it through
//! every `RegexInfo::analyze_with_cost_cached` call. The cache stores
//! `Hir → canonical Hir` so each unique pattern's saturation cost is
//! paid at most once per compile.
//!
//! The cache is **per-compile**, not global. There is no
//! cross-compile leakage and no invalidation logic — the lifetime is
//! exactly the `compute_regex_info` pass.
//!
//! Hash: the input HIR's structural hash via the derived `Hash` impls
//! on `Hir / Repetition / CharClass / ...`. Backing store:
//! `FxHashMap<Hir, Hir>` keyed on the input HIR.

use rustc_hash::FxHashMap;

use crate::hir::Hir;

/// Per-compile saturation result cache.
///
/// Owned by the consumer (e.g., `compute_regex_info`); cleared at
/// drop. `Default`-constructed and used as `&mut SaturationCache`
/// from inside `simplify_hir_cached` / `RegexInfo::analyze_with_cost_cached`.
#[derive(Debug, Default)]
pub struct SaturationCache {
    canonical: FxHashMap<Hir, Hir>,
}

impl SaturationCache {
    /// Construct an empty cache. Equivalent to `Default::default`.
    pub fn new() -> Self {
        Self::default()
    }

    /// Construct a cache with a pre-allocated capacity hint. Useful
    /// when the consumer knows the unique pattern count upfront —
    /// `compute_regex_info` walks the grammar once to count unique
    /// `Regex(StringId)` nodes before populating the cache.
    pub fn with_capacity(cap: usize) -> Self {
        Self {
            canonical: FxHashMap::with_capacity_and_hasher(cap, Default::default()),
        }
    }

    /// Look up the cached canonical form for `input`. Returns `None`
    /// on miss; caller is expected to compute and `insert` the
    /// canonical form.
    pub fn get(&self, input: &Hir) -> Option<&Hir> {
        self.canonical.get(input)
    }

    /// Insert a canonical-HIR result keyed on the input HIR.
    pub fn insert(&mut self, input: Hir, canonical: Hir) {
        self.canonical.insert(input, canonical);
    }

    /// Number of cached canonical forms. Useful for diagnostics.
    pub fn len(&self) -> usize {
        self.canonical.len()
    }

    /// Whether the cache is empty.
    pub fn is_empty(&self) -> bool {
        self.canonical.is_empty()
    }
}
