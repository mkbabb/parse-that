//! Lowering of this crate's [`Hir`] into `regex_syntax::hir::Hir`, the input
//! of the determinizer (`regex-automata`, OR-7 Route A).
//!
//! The lowering is node for node. Byte classes stay byte classes and
//! codepoint classes stay codepoint classes: every ECMAScript class the front
//! end reads (`\d`, `\w`, `\s`, `.`, case-folded literals, property escapes)
//! is already expanded to explicit ranges in the `Hir`, so nothing here
//! consults a Unicode table of `regex-syntax`'s. `Group` is transparent.
//! A negated class is materialized as its complement over its own domain
//! (bytes `0x00..=0xFF`, or scalar values without the surrogates).
//!
//! The lowering is internal: `regex-syntax`'s types never appear in this
//! crate's public API, and the frozen `Hir` ABI is unchanged by it.

use regex_syntax::hir as rs;

use crate::hir::{CharClass, Hir, Look};

/// Why a `Hir` has no lowering.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum LowerError {
    /// A zero-width assertion the determinizer is not given. Named so a
    /// caller can report the leaf rather than read the assertion as empty.
    UnsupportedLook(Look),
}

/// Lower one `Hir` into `regex-syntax`'s `Hir`.
pub fn lower(hir: &Hir) -> Result<rs::Hir, LowerError> {
    Ok(match hir {
        Hir::Empty => rs::Hir::empty(),
        Hir::Literal(bytes) => rs::Hir::literal(bytes.clone()),
        Hir::Class(CharClass::Bytes { ranges, negated }) => {
            let mut class = rs::ClassBytes::new(
                ranges
                    .iter()
                    .map(|r| rs::ClassBytesRange::new(r.start, r.end)),
            );
            if *negated {
                class.negate();
            }
            rs::Hir::class(rs::Class::Bytes(class))
        }
        Hir::Class(CharClass::Unicode { ranges, negated }) => {
            let mut class = rs::ClassUnicode::new(
                ranges
                    .iter()
                    .map(|r| rs::ClassUnicodeRange::new(r.start, r.end)),
            );
            if *negated {
                class.negate();
            }
            rs::Hir::class(rs::Class::Unicode(class))
        }
        Hir::Look(look) => rs::Hir::look(lower_look(*look)?),
        Hir::Repetition(rep) => rs::Hir::repetition(rs::Repetition {
            min: rep.min,
            max: rep.max,
            greedy: rep.greedy,
            sub: Box::new(lower(&rep.sub)?),
        }),
        Hir::Group(sub) => lower(sub)?,
        Hir::Concat(items) => rs::Hir::concat(items.iter().map(lower).collect::<Result<_, _>>()?),
        Hir::Alternation(branches) => {
            rs::Hir::alternation(branches.iter().map(lower).collect::<Result<_, _>>()?)
        }
    })
}

fn lower_look(look: Look) -> Result<rs::Look, LowerError> {
    Ok(match look {
        Look::Start => rs::Look::Start,
        Look::End => rs::Look::End,
        Look::StartLF => rs::Look::StartLF,
        Look::EndLF => rs::Look::EndLF,
        Look::StartCRLF => rs::Look::StartCRLF,
        Look::EndCRLF => rs::Look::EndCRLF,
        Look::WordBoundary | Look::NotWordBoundary => {
            return Err(LowerError::UnsupportedLook(look));
        }
    })
}
