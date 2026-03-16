use std::ops::RangeBounds;

use crate::parse::Parser;
use crate::state::{ParserState, Span};
use crate::utils::extract_bounds;

// ── ParserSpan trait ──────────────────────────────────────────

pub trait ParserSpan<'a> {
    type Output;

    fn opt(self) -> Self::Output;
    fn opt_span(self) -> Self::Output;

    fn then(self, next: Self::Output) -> Self::Output;
    fn then_span(self, next: Self::Output) -> Self::Output;

    fn wrap(self, left: Self::Output, right: Self::Output) -> Self::Output;
    fn wrap_span(self, left: Self::Output, right: Self::Output) -> Self::Output;

    fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
    fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;

    fn sep_by(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
    fn sep_by_span(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output;
}

impl<'a> ParserSpan<'a> for Parser<'a, Span<'a>> {
    type Output = Parser<'a, Span<'a>>;

    #[inline]
    fn opt(self) -> Self::Output {
        let opt = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            if self.call(state).is_none() {
                return Some(Span::new(start, start, state.src));
            }
            Some(Span::new(start, state.offset, state.src))
        };
        Parser::new(opt)
    }

    #[inline]
    fn opt_span(self) -> Self::Output {
        ParserSpan::opt(self)
    }

    #[inline]
    fn then(self, other: Self::Output) -> Self::Output {
        let then = move |state: &mut ParserState<'a>| {
            let start = self.call(state)?;
            let end = other.call(state)?;
            Some(Span::new(start.start, end.end, state.src))
        };
        Parser::new(then)
    }

    #[inline]
    fn then_span(self, other: Self::Output) -> Self::Output {
        ParserSpan::then(self, other)
    }

    #[inline]
    fn wrap(self, left: Self::Output, right: Self::Output) -> Self::Output {
        let wrap = move |state: &mut ParserState<'a>| {
            left.call(state)?;
            let middle = self.call(state)?;
            right.call(state)?;
            Some(Span::new(middle.start, middle.end, state.src))
        };
        Parser::new(wrap)
    }

    #[inline]
    fn wrap_span(self, left: Self::Output, right: Self::Output) -> Self::Output {
        ParserSpan::wrap(self, left, right)
    }

    #[inline]
    fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let many = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            let mut end = state.offset;
            let mut count = 0;

            while count < upper_bound {
                let prev_offset = state.offset;
                match self.call(state) {
                    Some(span) => {
                        end = span.end;
                        count += 1;
                        if state.offset == prev_offset {
                            break;
                        }
                    }
                    None => {
                        state.offset = prev_offset;
                        break;
                    }
                }
            }

            if count >= lower_bound {
                Some(Span::new(start, end, state.src))
            } else {
                None
            }
        };
        Parser::new(many)
    }

    #[inline]
    fn many_span(self, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        ParserSpan::many(self, bounds)
    }

    /// Strictly interleaving: `elem (sep elem)*`. Never accepts trailing separators.
    #[inline]
    fn sep_by(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            let mut count = 0;

            // Parse first element
            let Some(first_value) = self.call(state) else {
                if lower_bound == 0 {
                    return Some(Span::new(start, start, state.src));
                }
                return None;
            };
            let mut end = first_value.end;
            count += 1;

            // Parse (sep elem)* — checkpoint before separator to reject
            // trailing separators.
            while count < upper_bound {
                let cp = state.offset;
                if sep.call(state).is_none() {
                    state.offset = cp;
                    break;
                }
                if let Some(value) = self.call(state) {
                    end = value.end;
                    count += 1;
                } else {
                    // Element after separator failed — backtrack past the
                    // separator to reject trailing separator.
                    state.offset = cp;
                    break;
                }
            }

            if count >= lower_bound {
                Some(Span::new(start, end, state.src))
            } else {
                None
            }
        };
        Parser::new(sep_by)
    }

    #[inline]
    fn sep_by_span(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        ParserSpan::sep_by(self, sep, bounds)
    }
}

// ── ParserFlat trait ──────────────────────────────────────────

pub trait ParserFlat<'a, First, Last> {
    type Output;

    fn then(self, next: Parser<'a, Last>) -> Self::Output;
    fn then_flat(self, next: Parser<'a, Last>) -> Self::Output;
}

macro_rules! impl_parser_flat {
    ($($T:ident),*) => {
        #[allow(non_snake_case)]
        impl<'a, $($T,)* Last> ParserFlat<'a, ($($T,)*), Last> for Parser<'a, ($($T,)*)>
        where
            $($T: 'a,)*
            Last: 'a,
        {
            type Output = Parser<'a, ($($T,)* Last)>;

            #[inline]
            fn then(self, other: Parser<'a, Last>) -> Self::Output {
                let then = move |state: &mut ParserState<'a>| {
                    let ($($T,)*) = self.call(state)?;
                    let last = other.call(state)?;
                    Some(($($T,)* last))
                };
                Parser::new(then)
            }

            #[inline]
            fn then_flat(self, other: Parser<'a, Last>) -> Self::Output {
                return ParserFlat::then(self, other);
            }
        }
    };
}

impl_parser_flat!(B, C);
impl_parser_flat!(B, C, D);
impl_parser_flat!(B, C, D, E);
impl_parser_flat!(B, C, D, E, F);
impl_parser_flat!(B, C, D, E, F, G);
impl_parser_flat!(B, C, D, E, F, G, H);
impl_parser_flat!(B, C, D, E, F, G, H, I);
impl_parser_flat!(B, C, D, E, F, G, H, I, J);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L, M);
impl_parser_flat!(B, C, D, E, F, G, H, I, J, K, L, M, N);
