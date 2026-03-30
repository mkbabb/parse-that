#![feature(cold_path)]
#![feature(portable_simd)]

pub use typed_arena::Arena;

pub mod bump_arena;
pub use bump_arena::BumpArena;

pub mod parse;
pub use parse::*;

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

pub mod state;
pub use state::*;

pub mod regex;

// Re-export memchr so generated monolithic code can reference it.
pub use memchr;
