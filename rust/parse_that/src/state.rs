use pprint::Pretty;
#[cfg(feature = "diagnostics")]
use smallvec::SmallVec;

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

/// Snapshot of diagnostic state collected during error recovery.
#[cfg(feature = "diagnostics")]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub offset: usize,
    pub furthest_offset: usize,
    pub line: usize,
    pub column: usize,
    pub expected: Vec<String>,
    pub suggestions: Vec<Suggestion>,
    pub secondary_spans: Vec<SecondarySpan>,
    pub found: String,
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
        debug_assert!(
            self.start <= self.end
                && self.end <= self.src.len()
                && self.src.is_char_boundary(self.start)
                && self.src.is_char_boundary(self.end),
            "Span::as_str: invalid bounds {}..{} for src len {}",
            self.start,
            self.end,
            self.src.len()
        );
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
    pub expected: SmallVec<[&'static str; 8]>,
    #[cfg(feature = "diagnostics")]
    #[pprint(skip)]
    pub suggestions: SmallVec<[Suggestion; 4]>,
    #[cfg(feature = "diagnostics")]
    #[pprint(skip)]
    pub secondary_spans: SmallVec<[SecondarySpan; 4]>,
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

    /// Snapshot the current diagnostic state into a `Diagnostic`, then clear
    /// the expected/suggestions/secondary_spans so the next error starts fresh.
    #[cfg(feature = "diagnostics")]
    pub fn snapshot_diagnostic(&mut self, error_offset: usize) -> Diagnostic {
        let furthest = self.furthest_offset.max(error_offset);
        let src_before = &self.src[..furthest];
        let last_nl = src_before.rfind('\n');
        let line = match last_nl {
            Some(pos) => src_before[..=pos].chars().filter(|&c| c == '\n').count() + 1,
            None => 1,
        };
        let column = match last_nl {
            Some(pos) => furthest - pos - 1,
            None => furthest,
        };
        let found_end = (furthest + 20).min(self.src.len());
        let found = self.src[furthest..found_end].replace('\n', "\\n");

        let diag = Diagnostic {
            offset: error_offset,
            furthest_offset: furthest,
            line,
            column,
            expected: self.expected.iter().map(|s| s.to_string()).collect(),
            suggestions: std::mem::take(&mut self.suggestions).into_vec(),
            secondary_spans: std::mem::take(&mut self.secondary_spans).into_vec(),
            found,
        };
        self.expected.clear();
        diag
    }
}

// ── Collected Diagnostics (thread-local) ──────────────────────

#[cfg(feature = "diagnostics")]
std::thread_local! {
    static COLLECTED_DIAGNOSTICS: std::cell::RefCell<Vec<Diagnostic>> =
        const { std::cell::RefCell::new(Vec::new()) };
}

#[cfg(feature = "diagnostics")]
pub fn push_diagnostic(d: Diagnostic) {
    COLLECTED_DIAGNOSTICS.with(|diags| diags.borrow_mut().push(d));
}

#[cfg(feature = "diagnostics")]
pub fn pop_last_diagnostic() -> Option<Diagnostic> {
    COLLECTED_DIAGNOSTICS.with(|diags| diags.borrow_mut().pop())
}

#[cfg(feature = "diagnostics")]
pub fn get_collected_diagnostics() -> Vec<Diagnostic> {
    COLLECTED_DIAGNOSTICS.with(|diags| diags.borrow().clone())
}

#[cfg(feature = "diagnostics")]
pub fn clear_collected_diagnostics() {
    COLLECTED_DIAGNOSTICS.with(|diags| diags.borrow_mut().clear());
}
