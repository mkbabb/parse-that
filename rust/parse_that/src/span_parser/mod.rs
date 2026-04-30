use std::sync::Arc;

use crate::parse::ParserFn;
use crate::scanners::trim_leading_whitespace_mut;
use crate::state::{ParserState, Span};

use aho_corasick::AhoCorasick;

// ── Flags (same values as Parser flags) ───────────────────────

const FLAG_TRIM_WS: u8 = 0b0001;
const FLAG_SAVE_STATE: u8 = 0b0010;

// ── SpanParser: enum-dispatched, zero-boxing for Span hot path ─

/// Helper macro for constructing SpanParser with conditional label field.
#[cfg(feature = "diagnostics")]
macro_rules! sp_new {
    ($kind:expr, $label:expr) => {
        SpanParser {
            kind: $kind,
            flags: 0,
            label: Some($label),
        }
    };
    ($kind:expr) => {
        SpanParser {
            kind: $kind,
            flags: 0,
            label: None,
        }
    };
}

#[cfg(not(feature = "diagnostics"))]
macro_rules! sp_new {
    ($kind:expr, $label:expr) => {
        SpanParser {
            kind: $kind,
            flags: 0,
        }
    };
    ($kind:expr) => {
        SpanParser {
            kind: $kind,
            flags: 0,
        }
    };
}

pub struct SpanParser<'a> {
    pub(super) kind: SpanKind<'a>,
    pub(super) flags: u8,
    #[cfg(feature = "diagnostics")]
    pub(super) label: Option<&'static str>,
}

pub(super) enum SpanKind<'a> {
    // === Leaves (no inner parser, no vtable) ===
    StringLiteral(&'static [u8]),
    CompiledDfa(Arc<crate::regex::dfa::Dfa>),
    AhoCorasickMatch(Arc<AhoCorasick>),
    TakeWhileByte(fn(u8) -> bool),
    TakeWhileChar(Box<dyn Fn(char) -> bool + 'a>),
    NextN(usize),
    Epsilon,
    /// Fast path for negated byte classes with one excluded byte.
    TakeUntilAny1(u8),
    /// Fast path for negated byte classes with two excluded bytes.
    TakeUntilAny2(u8, u8),
    /// Fast path for negated byte classes with three excluded bytes.
    TakeUntilAny3(u8, u8, u8),
    /// LUT-based byte scanner for negated character classes (`[^...]+`) when
    /// the excluded set is larger than three bytes.
    TakeUntilAnyLut(Box<[bool; 256]>),
    /// SIMD nibble-LUT byte scanner for negated character classes when the
    /// excluded set has 4–8 unique bytes. Two 16-byte LUTs classify 16 bytes/cycle
    /// via `swizzle_dyn` (vpshufb / tbl).
    TakeUntilAnySIMD {
        lo_lut: [u8; 16],
        hi_lut: [u8; 16],
    },

    // === Domain-specific monolithic scanners (JSON, CSS, etc.) ===
    Scanner(SpanScanner),

    // === Flat combinators (no nesting depth) ===
    Seq(Vec<SpanParser<'a>>),
    OneOf(Vec<SpanParser<'a>>),
    Many {
        inner: Box<SpanParser<'a>>,
        lo: usize,
        hi: usize,
    },
    SepBy {
        inner: Box<SpanParser<'a>>,
        sep: Box<SpanParser<'a>>,
        lo: usize,
        hi: usize,
    },
    /// Fused sep_by + whitespace trimming: single trim between each step,
    /// no redundant double-trims from nested trim_whitespace wrappers.
    SepByWs {
        inner: Box<SpanParser<'a>>,
        sep: Box<SpanParser<'a>>,
        lo: usize,
        hi: usize,
    },
    Opt(Box<SpanParser<'a>>),
    Wrap {
        left: Box<SpanParser<'a>>,
        inner: Box<SpanParser<'a>>,
        right: Box<SpanParser<'a>>,
    },
    Skip(Box<SpanParser<'a>>, Box<SpanParser<'a>>),
    Next(Box<SpanParser<'a>>, Box<SpanParser<'a>>),
    Not(Box<SpanParser<'a>>, Box<SpanParser<'a>>),
    /// Set difference: match main only if excluded would NOT match at the same
    /// starting position. Used for EBNF/BNF exception (`-`) semantics.
    Minus(Box<SpanParser<'a>>, Box<SpanParser<'a>>),
    LookAhead(Box<SpanParser<'a>>, Box<SpanParser<'a>>),
    /// Zero-width negative assertion: succeeds (empty Span) when inner fails.
    Negate(Box<SpanParser<'a>>),
    /// Zero-width positive assertion: succeeds with inner's Span but does NOT
    /// consume input. The dual of `Negate`.
    Peek(Box<SpanParser<'a>>),
    /// End-of-input check: succeeds (empty Span) if at end of source.
    Eof,

    // === Escape hatch ===
    Boxed(Box<dyn ParserFn<'a, Span<'a>> + 'a>),
}

impl<'a> SpanParser<'a> {
    // ── Core dispatch ─────────────────────────────────────────

    #[inline(always)]
    pub fn call(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        if self.flags == 0 {
            return self.call_inner(state);
        }
        // Fast path: trim_ws only (most common flag combination)
        if self.flags == FLAG_TRIM_WS {
            trim_leading_whitespace_mut(state);
            let result = self.call_inner(state);
            if result.is_some() {
                trim_leading_whitespace_mut(state);
            }
            return result;
        }
        self.call_with_flags_cold(state)
    }

    #[inline(never)]
    fn call_with_flags_cold(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        if self.flags & FLAG_TRIM_WS != 0 {
            trim_leading_whitespace_mut(state);
        }
        let checkpoint = if self.flags & FLAG_SAVE_STATE != 0 {
            Some(state.offset)
        } else {
            None
        };

        let result = self.call_inner(state);

        if let Some(cp) = checkpoint {
            if result.is_none() {
                state.furthest_offset = state.furthest_offset.max(state.offset);
                state.offset = cp;
                return None;
            }
        }
        // Skip post-trim on failure
        if result.is_some() && self.flags & FLAG_TRIM_WS != 0 {
            trim_leading_whitespace_mut(state);
        }
        result
    }

    #[inline(always)]
    fn call_inner(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        match &self.kind {
            // ── Leaf dispatch (leaves.rs) ─────────────────────
            SpanKind::StringLiteral(s_bytes) => self.dispatch_string_literal(s_bytes, state),
            SpanKind::CompiledDfa(dfa) => self.dispatch_compiled_dfa(dfa, state),
            SpanKind::AhoCorasickMatch(ac) => self.dispatch_aho_corasick(ac, state),
            SpanKind::TakeWhileByte(f) => self.dispatch_take_while_byte(*f, state),
            SpanKind::TakeWhileChar(f) => self.dispatch_take_while_char(f.as_ref(), state),
            SpanKind::NextN(amount) => self.dispatch_next_n(*amount, state),
            SpanKind::Epsilon => self.dispatch_epsilon(state),
            SpanKind::Scanner(scanner) => self.dispatch_scanner(scanner, state),
            SpanKind::Eof => self.dispatch_eof(state),
            SpanKind::Boxed(inner) => self.dispatch_boxed(inner.as_ref(), state),

            // ── Negated-class byte scanners (scan.rs) ─────────
            SpanKind::TakeUntilAny1(b1) => self.dispatch_take_until_any1(*b1, state),
            SpanKind::TakeUntilAny2(b1, b2) => self.dispatch_take_until_any2(*b1, *b2, state),
            SpanKind::TakeUntilAny3(b1, b2, b3) => {
                self.dispatch_take_until_any3(*b1, *b2, *b3, state)
            }
            SpanKind::TakeUntilAnyLut(lut) => self.dispatch_take_until_any_lut(lut, state),
            SpanKind::TakeUntilAnySIMD { lo_lut, hi_lut } => {
                self.dispatch_take_until_any_simd(lo_lut, hi_lut, state)
            }

            // ── Flat combinators (combinators.rs) ─────────────
            SpanKind::Seq(parsers) => self.dispatch_seq(parsers, state),
            SpanKind::OneOf(parsers) => self.dispatch_one_of(parsers, state),
            SpanKind::Many { inner, lo, hi } => self.dispatch_many(inner, *lo, *hi, state),
            SpanKind::Opt(inner) => self.dispatch_opt(inner, state),
            SpanKind::Skip(first, second) => self.dispatch_skip(first, second, state),
            SpanKind::Next(first, second) => self.dispatch_next(first, second, state),

            // ── Wrap (wrap.rs) ────────────────────────────────
            SpanKind::Wrap { left, inner, right } => self.dispatch_wrap(left, inner, right, state),

            // ── sep_by family (sep_by.rs) ─────────────────────
            SpanKind::SepBy { inner, sep, lo, hi } => {
                self.dispatch_sep_by(inner, sep, *lo, *hi, state)
            }
            SpanKind::SepByWs { inner, sep, lo, hi } => {
                self.dispatch_sep_by_ws(inner, sep, *lo, *hi, state)
            }

            // ── Assertions (assertions.rs) ────────────────────
            SpanKind::Not(main, negated) => self.dispatch_not(main, negated, state),
            SpanKind::Minus(main, excluded) => self.dispatch_minus(main, excluded, state),
            SpanKind::LookAhead(main, lookahead) => {
                self.dispatch_look_ahead(main, lookahead, state)
            }
            SpanKind::Negate(inner) => self.dispatch_negate(inner, state),
            SpanKind::Peek(inner) => self.dispatch_peek(inner, state),
        }
    }
}

// ── Sub-modules (order matters: sp_new! must be defined above) ──
mod span_scanner;
pub(super) use span_scanner::SpanScanner;
mod assertions;
mod combinators;
mod constructors;
mod leaves;
mod methods;
mod scan;
mod sep_by;
mod wrap;
pub use constructors::*;
