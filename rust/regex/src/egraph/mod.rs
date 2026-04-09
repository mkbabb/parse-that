//! HIR e-graph — equality saturation over regex HIR.
//!
//! Mirrors the grammar-tier e-graph in `bbnf-ir`. See
//! `docs/four-layer-optimizer.md` in bbnf-lang for the full
//! architectural framing.
//!
//! # Substrate
//!
//! - [`HirENode`] — the e-node enum (variant-parallel to `Hir`,
//!   with `Id` children). Derives `Language` via
//!   `egraph_derive::Language`.
//! - [`insert_hir`] — recursive translator: owning `Hir` tree →
//!   e-graph root Id.
//! - [`extract_hir`] — recursive extractor: saturated e-graph +
//!   root Id → cost-cheapest owning `Hir` tree.
//! - [`RegexExtractionCost`] — cost model embedding the shared
//!   `egraph::CostWeights` substrate.
//!
//! Rewrite rules (Tranche H-3), the CSP scheduler (H-4), and the
//! `simplify_hir` entry point that wires the e-graph into
//! `RegexInfo::analyze_from_hir` (H-6) land in subsequent
//! sub-tranches.

pub mod cost;
pub mod node;
pub mod translate;

pub use cost::RegexExtractionCost;
pub use node::HirENode;
pub use translate::{extract_hir, insert_hir};
