// Dispatch arm for the Wrap combinator: left delimiter, inner body, right
// delimiter. Owns diagnostics for unclosed-delimiter suggestions.

use super::SpanParser;
use crate::state::{ParserState, Span};

impl<'a> SpanParser<'a> {
    #[inline(always)]
    pub(super) fn dispatch_wrap(
        &self,
        left: &SpanParser<'a>,
        inner: &SpanParser<'a>,
        right: &SpanParser<'a>,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        #[cfg(feature = "diagnostics")]
        let open_offset = state.offset;
        left.call(state)?;
        #[cfg(feature = "diagnostics")]
        let open_end = state.offset;
        let middle = inner.call(state)?;
        if right.call(state).is_some() {
            Some(Span::new(middle.start, middle.end, state.src))
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
    }
}
