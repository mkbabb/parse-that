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

pub mod scanners;
pub use scanners::*;

pub mod regex;

// Re-export memchr so generated monolithic code can reference it.
pub use memchr;
pub use smallvec;

// ── Scanners (always available — used by generated parsers + codegen) ────

pub mod parsers;
pub use parsers::*;

// ── Combinators (used by hand-written parsers, bootstrap, tests) ────────

pub mod lazy;
pub use lazy::*;

pub mod leaf;
pub use leaf::*;

pub mod combinators;
pub use combinators::*;

pub mod span_parser;
pub use span_parser::*;

pub mod debug;
pub use debug::*;

pub mod utils;
pub use utils::*;

pub mod split;
pub use split::*;
