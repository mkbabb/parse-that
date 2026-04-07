#![feature(cold_path)]
#![feature(portable_simd)]
#![feature(fmt_helpers_for_derive)]
#![feature(stmt_expr_attributes)]

// ── Core (always available — used by generated parsers) ──────────────────

pub mod bump_slab;
pub use bump_slab::BumpSlab;

pub mod parse;
pub use parse::*;

pub mod state;
pub use state::*;

pub mod regex;

// Re-export memchr so generated monolithic code can reference it.
pub use memchr;
pub use smallvec;

// ── Combinators + Scanners ──────────────────────────────────────────────
//
// Currently always compiled. The `combinators` feature exists as a marker
// for the planned split of scanner functions from combinator infrastructure.
// Generated parsers will eventually depend only on the core modules above.

pub mod lazy;
pub use lazy::*;

pub mod leaf;
pub use leaf::*;

pub mod combinators;
pub use combinators::*;

pub mod span_parser;
pub use span_parser::*;

pub mod parsers;
pub use parsers::*;

pub mod debug;
pub use debug::*;

pub mod utils;
pub use utils::*;

pub mod split;
pub use split::*;
