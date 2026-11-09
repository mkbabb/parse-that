//! General-purpose e-graph for equality saturation.
//!
//! An e-graph is a data structure that compactly represents many equivalent
//! forms of an expression. Rewrite rules add equivalences instead of
//! replacing terms, preserving alternatives for cost-model-guided extraction.
//!
//! This crate is deliberately domain-agnostic — the `Language` trait is the
//! only thing a consumer must implement to use the full pipeline
//! (intern → saturate → extract). Both grammar IR nodes and regex HIR nodes
//! implement `Language`, so both pipelines share this single infrastructure.
//!
//! # Architecture
//!
//! ```text
//!   trees of N       EGraph<N, A>            best N per root
//!   ───────────►  ◄──────────────► ───────────────►
//!       add          saturate            extract
//!                    (rules, sched)      (cost model)
//! ```
//!
//! Consumer responsibilities:
//!
//! - Implement `Language` for the e-node type (auto-derivable via
//!   `#[derive(parse_that_egraph_derive::Language)]`).
//! - Implement `Analysis<N>` for the per-class lattice data (defaults to
//!   `()` if no analysis is needed).
//! - Implement `Rewrite<N, A>` for each rewrite rule, or use closure helpers.
//! - Implement `CostModel<N, A>` for extraction, or use the default
//!   `AstSize` cost model.

#![cfg_attr(not(test), warn(missing_docs))]

mod analysis;
mod cost_config;
mod cost_weights;
mod csp_scheduler;
mod eclass;
mod egraph;
mod extract;
mod id;
mod language;
mod rewrite;
mod scheduler;
mod unionfind;

pub use analysis::{Analysis, NoAnalysis};
pub use cost_config::CostConfig;
pub use cost_weights::{CALIBRATED_WEIGHTS, CostWeights};
pub use csp_scheduler::{CspScheduler, DirtyDomain, ParentDirtyProp};
pub use eclass::EClass;
pub use egraph::EGraph;
pub use extract::{AstSize, CostModel, Extractor, Lattice, Scalar};
pub use id::Id;
pub use language::{Language, LanguageChildren};
pub use rewrite::{Rewrite, RewriteFn};
pub use scheduler::{BackoffScheduler, RunReport, Scheduler};
pub use unionfind::UnionFind;
