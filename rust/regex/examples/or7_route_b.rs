//! sk-v27 LW2.RX-1 (OR-7), Route B: this crate's determinizer.
//!
//! `Dfa::compile` (NFA → powerset DFA → Hopcroft minimization), searched
//! with `find_at`, which is anchored and leftmost-longest. States are
//! `Dfa::state_count`. See `or7/common.rs` for the shared harness.

#[path = "or7/common.rs"]
mod common;

use parse_that_regex::{Dfa, parse};

struct RouteB;

impl common::Route for RouteB {
    type Matcher = Dfa;
    const NAME: &'static str = "B (in-house Dfa, leftmost-longest)";

    fn compile(&self, pattern: &str) -> Result<Dfa, String> {
        parse(pattern).map_err(|e| e.to_string())?;
        Dfa::compile(pattern).ok_or_else(|| "Dfa::compile refused the parsed pattern".to_string())
    }

    fn states(&self, m: &Dfa) -> usize {
        m.state_count()
    }

    fn find(&self, m: &Dfa, input: &[u8]) -> Option<usize> {
        m.find_at(input, 0)
    }
}

fn main() {
    common::main_with(RouteB);
}
