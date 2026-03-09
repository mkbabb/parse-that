// SpanParser combinator methods, flag setters, bridge to Parser, and trait impls.

use super::{SpanKind, SpanParser};
use crate::parse::Parser;
use crate::state::{ParserState, Span};
use crate::utils::extract_bounds;
use std::ops::RangeBounds;

impl<'a> SpanParser<'a> {
    // ── Combinators with automatic flattening ─────────────────

    /// Sequential composition: flattens nested Seq chains into a single Vec.
    #[inline]
    pub fn then_span(self, other: SpanParser<'a>) -> SpanParser<'a> {
        let mut parsers = match self.kind {
            SpanKind::Seq(v) if self.flags == 0 => v,
            _ => vec![self],
        };
        match other.kind {
            SpanKind::Seq(v) if other.flags == 0 => parsers.extend(v),
            _ => parsers.push(other),
        };
        sp_new!(SpanKind::Seq(parsers))
    }

    /// Alternation: flattens nested OneOf chains into a single Vec.
    #[inline]
    pub fn or(self, other: SpanParser<'a>) -> SpanParser<'a> {
        let mut parsers = match self.kind {
            SpanKind::OneOf(v) if self.flags == 0 => v,
            _ => vec![self],
        };
        match other.kind {
            SpanKind::OneOf(v) if other.flags == 0 => parsers.extend(v),
            _ => parsers.push(other),
        };
        sp_new!(SpanKind::OneOf(parsers))
    }

    #[inline]
    pub fn opt_span(self) -> SpanParser<'a> {
        sp_new!(SpanKind::Opt(Box::new(self)))
    }

    #[inline]
    pub fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> SpanParser<'a> {
        let (lo, hi) = extract_bounds(bounds);
        sp_new!(SpanKind::Many {
            inner: Box::new(self),
            lo,
            hi,
        })
    }

    #[inline]
    pub fn sep_by_span(
        self,
        sep: SpanParser<'a>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> SpanParser<'a> {
        let (lo, hi) = extract_bounds(bounds);
        sp_new!(SpanKind::SepBy {
            inner: Box::new(self),
            sep: Box::new(sep),
            lo,
            hi,
        })
    }

    /// Fused sep_by + whitespace trimming: single trim between each step.
    #[inline]
    pub fn sep_by_ws_span(
        self,
        sep: SpanParser<'a>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> SpanParser<'a> {
        let (lo, hi) = extract_bounds(bounds);
        sp_new!(SpanKind::SepByWs {
            inner: Box::new(self),
            sep: Box::new(sep),
            lo,
            hi,
        })
    }

    #[inline]
    pub fn wrap_span(self, left: SpanParser<'a>, right: SpanParser<'a>) -> SpanParser<'a> {
        sp_new!(SpanKind::Wrap {
            left: Box::new(left),
            inner: Box::new(self),
            right: Box::new(right),
        })
    }

    #[inline]
    pub fn skip_span(self, next: SpanParser<'a>) -> SpanParser<'a> {
        sp_new!(SpanKind::Skip(Box::new(self), Box::new(next)))
    }

    #[inline]
    pub fn next_after(self, next: SpanParser<'a>) -> SpanParser<'a> {
        sp_new!(SpanKind::Next(Box::new(self), Box::new(next)))
    }

    #[inline]
    pub fn not_span(self, negated: SpanParser<'a>) -> SpanParser<'a> {
        sp_new!(SpanKind::Not(Box::new(self), Box::new(negated)))
    }

    /// Set difference: match `self` only if `excluded` would NOT match at the
    /// same starting position. Used for EBNF/BNF exception (`-`) semantics.
    #[inline]
    pub fn minus_span(self, excluded: SpanParser<'a>) -> SpanParser<'a> {
        sp_new!(SpanKind::Minus(Box::new(self), Box::new(excluded)))
    }

    #[inline]
    pub fn look_ahead_span(self, lookahead: SpanParser<'a>) -> SpanParser<'a> {
        sp_new!(SpanKind::LookAhead(Box::new(self), Box::new(lookahead)))
    }

    /// Zero-width negative assertion: succeeds (empty Span) when inner fails.
    #[inline]
    pub fn negate_span(self) -> SpanParser<'a> {
        sp_new!(SpanKind::Negate(Box::new(self)))
    }

    /// Zero-width positive assertion: succeeds with inner's Span but does NOT
    /// consume input. The dual of `negate_span()`.
    #[inline]
    pub fn peek_span(self) -> SpanParser<'a> {
        sp_new!(SpanKind::Peek(Box::new(self)))
    }

    // ── Flag setters ──────────────────────────────────────────

    #[inline]
    pub fn trim_whitespace(mut self) -> SpanParser<'a> {
        self.flags |= super::FLAG_TRIM_WS;
        self
    }

    #[inline]
    pub fn save_state(mut self) -> SpanParser<'a> {
        self.flags |= super::FLAG_SAVE_STATE;
        self
    }

    // ── Bridge to Parser<'a, O> ───────────────────────────────

    /// Convert to a generic `Parser<'a, Span<'a>>`.
    #[inline]
    pub fn into_parser(self) -> Parser<'a, Span<'a>> {
        Parser::new(move |state: &mut ParserState<'a>| self.call(state))
    }

    /// Map Span output to any type, producing a generic Parser.
    #[inline]
    pub fn map<O: 'a>(self, f: fn(Span<'a>) -> O) -> Parser<'a, O> {
        Parser::new(move |state: &mut ParserState<'a>| self.call(state).map(f))
    }

    /// Map with a closure (not just fn pointer).
    #[inline]
    pub fn map_closure<O: 'a>(self, f: impl Fn(Span<'a>) -> O + 'a) -> Parser<'a, O> {
        Parser::new(move |state: &mut ParserState<'a>| self.call(state).map(&f))
    }
}

// ── Operator overloads + trait conversions ───────────────────

impl<'a> std::ops::BitOr for SpanParser<'a> {
    type Output = SpanParser<'a>;

    #[inline]
    fn bitor(self, other: SpanParser<'a>) -> Self::Output {
        self.or(other)
    }
}

impl<'a> From<SpanParser<'a>> for Parser<'a, Span<'a>> {
    #[inline]
    fn from(sp: SpanParser<'a>) -> Self {
        sp.into_parser()
    }
}
