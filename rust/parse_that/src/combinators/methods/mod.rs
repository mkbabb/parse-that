use crate::parse::Parser;
use crate::state::ParserState;

mod alternation;
mod map;
mod minus;
mod recover;
mod repetition;
mod sep_by;
mod sequence;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
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

#[path = "../../span_trait.rs"]
mod span_trait;
pub use span_trait::*;
