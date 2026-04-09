use crate::parse::Parser;
#[cfg(feature = "diagnostics")]
use crate::state::ParserState;

impl<'a, Output> Parser<'a, Output>
where
    Self: 'a,
    Output: 'a,
{
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
        use crate::state::{pop_last_diagnostic, push_diagnostic};

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
        panic!("recover() requires the `diagnostics` feature")
    }
}
