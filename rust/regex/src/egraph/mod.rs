//! HIR e-graph — equality saturation over regex HIR.
//!
//! Mirrors the grammar-tier e-graph in `bbnf-ir`. See the
//! "Tranche H" section of bbnf-lang's four-layer optimizer plan.
//!
//! Currently stubbed: only `cost::RegexExtractionCost` is live.
//! The substrate (`build_hir_egraph`, `saturate_hir_egraph`,
//! `extract_canonical`, `simplify_hir`), the CSP scheduler, and
//! the rewrite rules land in sub-tranches H-2..H-6.

pub mod cost;

pub use cost::RegexExtractionCost;
