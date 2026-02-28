use pprint::Pretty;

// ── Diagnostic types (feature-gated) ──────────────────────────

#[cfg(feature = "diagnostics")]
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum SuggestionKind {
    UnclosedDelimiter {
        delimiter: String,
        open_offset: usize,
    },
    TrailingContent {
        context: String,
    },
}

#[cfg(feature = "diagnostics")]
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Suggestion {
    pub kind: SuggestionKind,
    pub message: String,
}

#[cfg(feature = "diagnostics")]
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct SecondarySpan {
    pub offset: usize,
    pub label: String,
}

#[derive(Pretty, Debug, Default, PartialEq, Clone, Copy, Hash, Eq)]
pub struct Span<'a> {
    pub start: usize,
    pub end: usize,

    #[pprint(skip)]
    pub src: &'a str,
}

impl<'a> Span<'a> {
    pub fn new(start: usize, end: usize, src: &'a str) -> Self {
        Span { start, end, src }
    }

    pub fn as_str(&self) -> &'a str {
        unsafe { self.src.get_unchecked(self.start..self.end) }
    }
}



#[derive(Pretty, Debug, Default, PartialEq, Clone, Hash, Eq)]
pub struct ParserState<'a> {
    #[pprint(skip)]
    pub src: &'a str,
    #[pprint(skip)]
    pub src_bytes: &'a [u8],

    pub end: usize,

    pub offset: usize,
    pub furthest_offset: usize,

    #[cfg(feature = "diagnostics")]
    #[pprint(skip)]
    pub expected: Vec<&'static str>,
    #[cfg(feature = "diagnostics")]
    #[pprint(skip)]
    pub suggestions: Vec<Suggestion>,
    #[cfg(feature = "diagnostics")]
    #[pprint(skip)]
    pub secondary_spans: Vec<SecondarySpan>,
}

impl<'a> ParserState<'a> {
    pub fn new(src: &'a str) -> ParserState<'a> {
        ParserState {
            src,
            src_bytes: src.as_bytes(),
            end: src.len(),
            ..Default::default()
        }
    }

    pub fn is_at_end(&self) -> bool {
        self.offset >= self.end
    }

    pub fn get_column_number(&self) -> usize {
        let offset = self.offset;
        match self.src[..offset].rfind('\n') {
            Some(nl) => offset - nl - 1,
            None => offset,
        }
    }

    pub fn get_line_number(&self) -> usize {
        self.src.as_bytes()[..self.offset]
            .iter()
            .filter(|&&c| c == b'\n')
            .count()
            + 1
    }

    /// Record an expected label at the current offset. No-op without `diagnostics` feature.
    #[inline(always)]
    pub fn add_expected(&mut self, _label: &'static str) {
        #[cfg(feature = "diagnostics")]
        {
            use std::cmp::Ordering;
            match self.offset.cmp(&self.furthest_offset) {
                Ordering::Greater => {
                    // New furthest — clear and start fresh
                    self.expected.clear();
                    self.expected.push(_label);
                    self.suggestions.clear();
                    self.secondary_spans.clear();
                }
                Ordering::Equal => {
                    if !self.expected.contains(&_label) {
                        self.expected.push(_label);
                    }
                }
                Ordering::Less => {
                    // Stale label — ignore
                }
            }
        }
    }

    /// Record a structured suggestion. No-op without `diagnostics` feature.
    #[cfg(feature = "diagnostics")]
    #[inline(always)]
    pub fn add_suggestion(&mut self, suggestion: impl FnOnce() -> Suggestion) {
        self.suggestions.push(suggestion());
    }

    /// Record a structured suggestion. No-op without `diagnostics` feature.
    #[cfg(not(feature = "diagnostics"))]
    #[inline(always)]
    pub fn add_suggestion<F>(&mut self, _suggestion: F) {}

    /// Record a secondary span annotation. No-op without `diagnostics` feature.
    #[cfg(feature = "diagnostics")]
    #[inline(always)]
    pub fn add_secondary_span(&mut self, offset: usize, label: impl Into<String>) {
        self.secondary_spans.push(SecondarySpan {
            offset,
            label: label.into(),
        });
    }

    /// Record a secondary span annotation. No-op without `diagnostics` feature.
    #[cfg(not(feature = "diagnostics"))]
    #[inline(always)]
    pub fn add_secondary_span<S>(&mut self, _offset: usize, _label: S) {}
}
