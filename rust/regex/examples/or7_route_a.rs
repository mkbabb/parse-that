//! sk-v27 LW2.RX-1 (OR-7), Route A: regex-automata as the determinizer.
//!
//! The front end is still this crate's parser. Its `Hir` is lowered into
//! `regex_syntax::hir::Hir` node for node (byte classes stay byte classes,
//! codepoint classes stay codepoint classes, `Group` is transparent), then
//! compiled by regex-automata's Thompson compiler into a dense DFA with
//! `MatchKind::LeftmostFirst`, anchored starts and minimization. A search is
//! an anchored forward search at offset 0. States are the dense DFA's states
//! reachable from the anchored start, dead state excluded. See
//! `or7/common.rs` for the shared harness.

#[path = "or7/common.rs"]
mod common;

use parse_that_regex::hir::{CharClass, Hir, Look};
use regex_automata::dfa::{Automaton, StartKind, dense};
use regex_automata::nfa::thompson;
use regex_automata::util::start;
use regex_automata::{Anchored, Input, MatchKind};
use regex_syntax::hir as rs;

fn lower(hir: &Hir) -> rs::Hir {
    match hir {
        Hir::Empty => rs::Hir::empty(),
        Hir::Literal(bytes) => rs::Hir::literal(bytes.clone()),
        Hir::Class(CharClass::Bytes { ranges, negated }) => {
            let mut c = rs::ClassBytes::new(ranges.iter().map(|r| rs::ClassBytesRange::new(r.start, r.end)));
            if *negated {
                c.negate();
            }
            rs::Hir::class(rs::Class::Bytes(c))
        }
        Hir::Class(CharClass::Unicode { ranges, negated }) => {
            let mut c = rs::ClassUnicode::new(ranges.iter().map(|r| rs::ClassUnicodeRange::new(r.start, r.end)));
            if *negated {
                c.negate();
            }
            rs::Hir::class(rs::Class::Unicode(c))
        }
        Hir::Look(look) => rs::Hir::look(match look {
            Look::Start => rs::Look::Start,
            Look::End => rs::Look::End,
            Look::StartLF => rs::Look::StartLF,
            Look::EndLF => rs::Look::EndLF,
            Look::StartCRLF => rs::Look::StartCRLF,
            Look::EndCRLF => rs::Look::EndCRLF,
        }),
        Hir::Repetition(rep) => rs::Hir::repetition(rs::Repetition {
            min: rep.min,
            max: rep.max,
            greedy: rep.greedy,
            sub: Box::new(lower(&rep.sub)),
        }),
        Hir::Group(sub) => lower(sub),
        Hir::Concat(items) => rs::Hir::concat(items.iter().map(lower).collect()),
        Hir::Alternation(branches) => rs::Hir::alternation(branches.iter().map(lower).collect()),
    }
}

struct RouteA;

impl common::Route for RouteA {
    type Matcher = dense::DFA<Vec<u32>>;
    const NAME: &'static str = "A (regex-automata 0.4.14 dense DFA, leftmost-first)";

    fn compile(&self, pattern: &str) -> Result<Self::Matcher, String> {
        let hir = parse_that_regex::parse(pattern).map_err(|e| e.to_string())?;
        let nfa = thompson::Compiler::new()
            .configure(thompson::Config::new().utf8(false))
            .build_from_hir(&lower(&hir))
            .map_err(|e| e.to_string())?;
        dense::Builder::new()
            .configure(
                dense::Config::new()
                    .match_kind(MatchKind::LeftmostFirst)
                    .start_kind(StartKind::Anchored)
                    .minimize(true),
            )
            .build_from_nfa(&nfa)
            .map_err(|e| e.to_string())
    }

    fn states(&self, dfa: &Self::Matcher) -> usize {
        let config = start::Config::new().anchored(Anchored::Yes);
        let Ok(s0) = dfa.start_state(&config) else { return 0 };
        let mut seen = std::collections::HashSet::from([s0]);
        let mut stack = vec![s0];
        while let Some(s) = stack.pop() {
            let mut next: Vec<_> = (0..=255u8).map(|b| dfa.next_state(s, b)).collect();
            next.push(dfa.next_eoi_state(s));
            for n in next {
                if !dfa.is_dead_state(n) && seen.insert(n) {
                    stack.push(n);
                }
            }
        }
        seen.len()
    }

    fn find(&self, dfa: &Self::Matcher, input: &[u8]) -> Option<usize> {
        let search = Input::new(input).anchored(Anchored::Yes);
        dfa.try_search_fwd(&search).ok().flatten().map(|m| m.offset())
    }
}

fn main() {
    common::main_with(RouteA);
}
