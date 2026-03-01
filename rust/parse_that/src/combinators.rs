use std::ops::RangeBounds;

use crate::parse::Parser;
use crate::state::{ParserState, Span};
use crate::utils::extract_bounds;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
    #[inline]
    pub fn then<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, (Output, Output2)>
    where
        Output2: 'a,
    {
        let with = move |state: &mut ParserState<'a>| {
            let value1 = self.call(state)?;
            let value2 = next.call(state)?;
            Some((value1, value2))
        };
        Parser::new(with)
    }

    /// Alternation with checkpoint-based backtracking (no Vec push/pop).
    #[inline]
    pub fn or(self, other: Parser<'a, Output>) -> Parser<'a, Output> {
        let or = move |state: &mut ParserState<'a>| {
            let checkpoint = state.offset;
            if let Some(value) = self.call(state) {
                return Some(value);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = checkpoint;

            if let Some(value) = other.call(state) {
                return Some(value);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = checkpoint;

            None
        };
        Parser::new(or)
    }

    #[inline]
    pub fn or_else(self, f: fn() -> Output) -> Parser<'a, Output> {
        let or_else = move |state: &mut ParserState<'a>| match self.call(state) {
            Some(value) => Some(value),
            None => Some(f()),
        };
        Parser::new(or_else)
    }

    #[inline]
    pub fn opt(self) -> Parser<'a, Option<Output>> {
        let opt = move |state: &mut ParserState<'a>| {
            if let Some(value) = self.call(state) {
                return Some(Some(value));
            }
            Some(None)
        };
        Parser::new(opt)
    }

    #[inline]
    pub fn not<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let not = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            if next.call(state).is_none() {
                return Some(value);
            }
            None
        };
        Parser::new(not)
    }

    /// Set difference: match `self` only if `excluded` would NOT match at the
    /// same starting position. Used for EBNF/BNF exception (`-`) semantics.
    #[inline]
    pub fn minus<Output2>(self, excluded: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let minus = move |state: &mut ParserState<'a>| {
            let checkpoint = state.offset;
            if excluded.call(state).is_some() {
                state.offset = checkpoint;
                return None;
            }
            state.offset = checkpoint;
            self.call(state)
        };
        Parser::new(minus)
    }

    #[inline]
    pub fn negate(self) -> Parser<'a, ()> {
        let negate = move |state: &mut ParserState<'a>| {
            if self.call(state).is_none() {
                return Some(());
            }
            None
        };
        Parser::new(negate)
    }

    #[inline]
    pub fn map<Output2>(self, f: fn(Output) -> Output2) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map = move |state: &mut ParserState<'a>| self.call(state).map(f);
        Parser::new(map)
    }

    #[inline]
    pub fn map_with_state<Output2>(
        self,
        f: fn(Output, usize, &mut ParserState<'a>) -> Output2,
    ) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let map_with_state = move |state: &mut ParserState<'a>| {
            let offset = state.offset;
            let result = self.call(state)?;
            Some(f(result, offset, state))
        };
        Parser::new(map_with_state)
    }

    #[inline]
    pub fn skip<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let skip = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            next.call(state)?;
            Some(value)
        };
        Parser::new(skip)
    }

    #[inline]
    pub fn next<Output2>(self, next: Parser<'a, Output2>) -> Parser<'a, Output2>
    where
        Output2: 'a,
    {
        let next = move |state: &mut ParserState<'a>| {
            self.call(state)?;
            next.call(state)
        };
        Parser::new(next)
    }

    #[inline]
    pub fn many(self, bounds: impl RangeBounds<usize> + 'a) -> Parser<'a, Vec<Output>> {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let many = move |state: &mut ParserState<'a>| {
            let est = if lower_bound > 0 { lower_bound.max(16) } else { 32 };
            let mut values = Vec::with_capacity(est);

            while values.len() < upper_bound {
                if let Some(value) = self.call(state) {
                    values.push(value);
                } else {
                    break;
                }
            }
            if values.len() >= lower_bound {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(many)
    }

    #[inline]
    pub fn wrap<Output2, Output3>(
        self,
        left: Parser<'a, Output2>,
        right: Parser<'a, Output3>,
    ) -> Parser<'a, Output>
    where
        Output2: 'a,
        Output3: 'a,
    {
        let wrap = move |state: &mut ParserState<'a>| {
            #[cfg(feature = "diagnostics")]
            let open_offset = state.offset;
            left.call(state)?;
            #[cfg(feature = "diagnostics")]
            let open_end = state.offset;
            let value = self.call(state)?;
            if right.call(state).is_some() {
                Some(value)
            } else {
                #[cfg(feature = "diagnostics")]
                {
                    let delimiter = state.src[open_offset..open_end].to_string();
                    state.add_suggestion(|| crate::state::Suggestion {
                        kind: crate::state::SuggestionKind::UnclosedDelimiter {
                            delimiter: delimiter.clone(),
                            open_offset,
                        },
                        message: format!(
                            "close the delimiter with matching `{}`",
                            match delimiter.as_str() {
                                "{" => "}",
                                "[" => "]",
                                "(" => ")",
                                d => d,
                            }
                        ),
                    });
                    state.add_secondary_span(
                        open_offset,
                        format!("unclosed `{}` opened here", delimiter),
                    );
                }
                None
            }
        };
        Parser::new(wrap)
    }

    #[inline]
    pub fn trim<Output2>(self, trimmer: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            trimmer.call(state)?;
            let value = self.call(state)?;
            trimmer.call(state)?;
            Some(value)
        };
        Parser::new(trim)
    }

    #[inline]
    pub fn trim_keep<Output2>(
        self,
        trimmer: Parser<'a, Output2>,
    ) -> Parser<'a, (Output2, Output, Output2)>
    where
        Output2: 'a,
    {
        let trim = move |state: &mut ParserState<'a>| {
            let trim1 = trimmer.call(state)?;
            let value = self.call(state)?;
            let trim2 = trimmer.call(state)?;
            Some((trim1, value, trim2))
        };
        Parser::new(trim)
    }

    #[inline]
    pub fn sep_by<Output2>(
        self,
        sep: Parser<'a, Output2>,
        bounds: impl RangeBounds<usize> + 'a,
    ) -> Parser<'a, Vec<Output>>
    where
        Output2: 'a,
    {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let est = if lower_bound > 0 { lower_bound.max(16) } else { 32 };
            let mut values = Vec::with_capacity(est);

            while values.len() < upper_bound {
                if let Some(value) = self.call(state) {
                    values.push(value);
                } else {
                    break;
                }
                // Checkpoint-based: if sep fails, don't leave state dirty
                let cp = state.offset;
                if sep.call(state).is_none() {
                    state.offset = cp;
                    break;
                }
            }

            if values.len() >= lower_bound {
                Some(values)
            } else {
                None
            }
        };

        Parser::new(sep_by)
    }

    /// Error recovery combinator. On success, returns the result normally.
    /// On failure, snapshots the current diagnostic into the collected
    /// diagnostics list, then runs `sync` to skip past the bad content
    /// and returns `sentinel`.
    ///
    /// This enables `many()` / `sep_by()` loops to keep going — each failed
    /// element produces a diagnostic but doesn't halt the overall parse.
    #[cfg(feature = "diagnostics")]
    pub fn recover(self, sync: Parser<'a, ()>, sentinel: Output) -> Parser<'a, Output>
    where
        Output: Clone,
    {
        use crate::state::{push_diagnostic, pop_last_diagnostic};

        let recover = move |state: &mut ParserState<'a>| {
            let checkpoint = state.offset;
            if let Some(value) = self.call(state) {
                return Some(value);
            }

            // Snapshot diagnostic, then try to sync forward
            let diag = state.snapshot_diagnostic(checkpoint);
            push_diagnostic(diag);

            state.offset = checkpoint;
            if sync.call(state).is_some() {
                // Sync succeeded — return sentinel
                Some(sentinel.clone())
            } else {
                // Sync failed — pop the diagnostic and give up
                pop_last_diagnostic();
                state.offset = checkpoint;
                None
            }
        };
        Parser::new(recover)
    }

    /// No-op version without diagnostics feature — just runs the inner parser.
    #[cfg(not(feature = "diagnostics"))]
    pub fn recover(self, _sync: Parser<'a, ()>, _sentinel: Output) -> Parser<'a, Output>
    where
        Output: Clone,
    {
        self
    }

    #[inline]
    pub fn look_ahead<Output2>(self, parser: Parser<'a, Output2>) -> Parser<'a, Output>
    where
        Output2: 'a,
    {
        let look_ahead = move |state: &mut ParserState<'a>| {
            let value = self.call(state)?;
            let offset_after_self = state.offset;
            let lookahead_result = parser.call(state);
            state.offset = offset_after_self;
            lookahead_result?;
            Some(value)
        };
        Parser::new(look_ahead)
    }
}

impl<'a, Output2> std::ops::BitOr<Parser<'a, Output2>> for Parser<'a, Output2>
where
    Output2: 'a,
{
    type Output = Parser<'a, Output2>;

    #[inline]
    fn bitor(self, other: Parser<'a, Output2>) -> Self::Output {
        self.or(other)
    }
}

impl<'a, Output, Output2> std::ops::Add<Parser<'a, Output2>> for Parser<'a, Output>
where
    Output: 'a,
    Output2: 'a,
{
    type Output = Parser<'a, (Output, Output2)>;

    #[inline]
    fn add(self, other: Parser<'a, Output2>) -> Self::Output {
        self.then(other)
    }
}

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
                match self.call(state) {
                    Some(span) => {
                        end = span.end;
                        count += 1;
                    }
                    None => break,
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

    #[inline]
    fn sep_by(self, sep: Self::Output, bounds: impl RangeBounds<usize> + 'a) -> Self::Output {
        let (lower_bound, upper_bound) = extract_bounds(bounds);

        let sep_by = move |state: &mut ParserState<'a>| {
            let start = state.offset;
            let mut end = state.offset;
            let mut count = 0;

            while count < upper_bound {
                if let Some(value) = self.call(state) {
                    end = value.end;
                    count += 1;
                } else {
                    break;
                }
                let cp = state.offset;
                if sep.call(state).is_none() {
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

// ── seq!: flat N-ary sequential combinator ────────────────────
// Creates a single Box<dyn ParserFn> instead of N-1 intermediate boxes.
// Usage: seq!(p1, p2) → Parser<(O1, O2)>, seq!(p1, p2, p3) → Parser<(O1, O2, O3)>, etc.

#[macro_export]
macro_rules! seq {
    ($p1:expr, $p2:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            Some((v1, v2))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            Some((v1, v2, v3))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            Some((v1, v2, v3, v4))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            let v5 = $p5.call(state)?;
            Some((v1, v2, v3, v4, v5))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            let v5 = $p5.call(state)?;
            let v6 = $p6.call(state)?;
            Some((v1, v2, v3, v4, v5, v6))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr, $p7:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            let v5 = $p5.call(state)?;
            let v6 = $p6.call(state)?;
            let v7 = $p7.call(state)?;
            Some((v1, v2, v3, v4, v5, v6, v7))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr, $p7:expr, $p8:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            let v5 = $p5.call(state)?;
            let v6 = $p6.call(state)?;
            let v7 = $p7.call(state)?;
            let v8 = $p8.call(state)?;
            Some((v1, v2, v3, v4, v5, v6, v7, v8))
        })
    };
}

// ── alt!: flat N-ary alternation combinator ───────────────────
// Creates a single Box<dyn ParserFn> instead of N-1 intermediate boxes.
// Usage: alt!(p1, p2) → Parser<O>, alt!(p1, p2, p3) → Parser<O>, etc.

#[macro_export]
macro_rules! alt {
    ($p1:expr, $p2:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p5.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p5.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p6.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr, $p7:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p5.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p6.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p7.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr, $p7:expr, $p8:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p5.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p6.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p7.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p8.call(state) { return Some(v); }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
}
