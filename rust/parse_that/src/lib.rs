// The default build is stable (sk-v27 LW2.TOPO-2). The opt-in `nightly`
// feature turns on the portable-SIMD scan kernels; each has a stable scalar
// twin with the same contract, selected when the feature is off.
#![cfg_attr(feature = "nightly", feature(portable_simd))]

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

// ── The transactional recognition kernel (generated parsers, ABI) ───────
//
// Additive (sk-v27 LW3.COMP-1a): the kernel lives beside the combinator
// runtime above and shares no state with it. `parse_that::kernel::KERNEL_ABI`
// names its contract.
pub mod kernel;

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
