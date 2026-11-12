//! Lints over a pattern's reading.
//!
//! The engine reads every pattern with u/v semantics: a class is a set of
//! scalar values and consumes one whole scalar. ECMAScript reads a pattern
//! without the `u` or `v` flag over UTF-16 code units instead. The two
//! readings agree on most patterns and differ only where a class can match a
//! surrogate code unit, which is half of an astral scalar. A caller that
//! hands the engine a pattern written without `u` uses [`reads_differently_without_u`]
//! to report it under [`RX_NOU`].

use crate::hir::{CharClass, Hir};

/// The lint id for a pattern written without `u`/`v` whose reading differs
/// without it. A caller prefixes its own namespace (for example a grammar
/// tool's `<TOOL>-RX-NOU`).
pub const RX_NOU: &str = "RX-NOU";

/// Whether the pattern `hir` (parsed with u/v semantics, the default
/// [`crate::ParseOptions`]) can match differently when ECMAScript reads its
/// source without the `u` flag.
///
/// It holds when some class of the pattern matches an astral scalar (read
/// without `u`, the class matches one surrogate of it, ending inside the
/// pair), or when a class's members run across the surrogate block, written
/// as one range or as a negation (read without `u`, it also matches a lone
/// surrogate of an astral scalar). The test is on the class's scalar set, so
/// a class that only names BMP scalars outside that block, such as `\s`,
/// `[é]` or `[ ]`, reads the same both ways.
pub fn reads_differently_without_u(hir: &Hir) -> bool {
    match hir {
        Hir::Class(class) => class_differs(class),
        Hir::Repetition(rep) => reads_differently_without_u(&rep.sub),
        Hir::Group(sub) => reads_differently_without_u(sub),
        Hir::Concat(items) | Hir::Alternation(items) => {
            items.iter().any(reads_differently_without_u)
        }
        Hir::Empty | Hir::Literal(_) | Hir::Look(_) => false,
    }
}

fn class_differs(class: &CharClass) -> bool {
    match class {
        // A byte class under u/v is ASCII-only and never negated.
        CharClass::Bytes { .. } => false,
        CharClass::Unicode { ranges, negated } => {
            let has = |cp: u32| {
                ranges
                    .iter()
                    .any(|r| r.start as u32 <= cp && cp <= r.end as u32)
                    != *negated
            };
            let astral = if *negated {
                // The complement holds an astral scalar unless the ranges
                // cover the whole astral planes.
                !ranges
                    .iter()
                    .any(|r| r.start as u32 <= 0x1_0000 && r.end as u32 == 0x10_FFFF)
            } else {
                ranges.iter().any(|r| r.end as u32 >= 0x1_0000)
            };
            astral || (has(0xD7FF) && has(0xE000))
        }
    }
}
