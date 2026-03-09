use regex::Regex;
use std::sync::Arc;

use crate::leaf::{trim_leading_whitespace, trim_leading_whitespace_mut};
use crate::parse::ParserFn;
use crate::state::{ParserState, Span};

use aho_corasick::{AhoCorasick, Anchored, Input};

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
    RegexMatch(Arc<Regex>),
    AhoCorasickMatch(AhoCorasick),
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
            state.offset += trim_leading_whitespace(state);
            let result = self.call_inner(state);
            if result.is_some() {
                state.offset += trim_leading_whitespace(state);
            }
            return result;
        }
        self.call_with_flags_cold(state)
    }

    #[inline(never)]
    fn call_with_flags_cold(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        if self.flags & FLAG_TRIM_WS != 0 {
            state.offset += trim_leading_whitespace(state);
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
            state.offset += trim_leading_whitespace(state);
        }
        result
    }

    #[inline(always)]
    fn call_inner(&self, state: &mut ParserState<'a>) -> Option<Span<'a>> {
        match &self.kind {
            SpanKind::StringLiteral(s_bytes) => {
                let end = s_bytes.len();
                if end == 0 {
                    return Some(Span::new(state.offset, state.offset, state.src));
                }
                let slc = state.src_bytes.get(state.offset..)?;
                if slc.len() >= end
                    && slc[0] == s_bytes[0]
                    && (end == 1 || slc[1..end].starts_with(&s_bytes[1..]))
                {
                    let start = state.offset;
                    state.offset += end;
                    Some(Span::new(start, state.offset, state.src))
                } else {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    None
                }
            }

            SpanKind::RegexMatch(re) => {
                if state.is_at_end() {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                let slc = state.src.get(state.offset..)?;
                match re.find_at(slc, 0) {
                    Some(m) if m.start() == 0 => {
                        let start = state.offset;
                        state.offset += m.end();
                        Some(Span::new(start, state.offset, state.src))
                    }
                    _ => {
                        #[cfg(feature = "diagnostics")]
                        if let Some(lbl) = self.label {
                            state.add_expected(lbl);
                        }
                        None
                    }
                }
            }

            SpanKind::AhoCorasickMatch(ac) => {
                let slc = state.src.get(state.offset..)?;
                let input = Input::new(slc).anchored(Anchored::Yes);
                match ac.find(input) {
                    Some(m) => {
                        let start = state.offset;
                        state.offset += m.end();
                        Some(Span::new(start, state.offset, state.src))
                    }
                    None => {
                        #[cfg(feature = "diagnostics")]
                        if let Some(lbl) = self.label {
                            state.add_expected(lbl);
                        }
                        None
                    }
                }
            }

            SpanKind::TakeWhileByte(f) => {
                let bytes = state.src_bytes;
                let start = state.offset;
                let end = bytes.len();
                let mut i = start;
                while i < end && f(unsafe { *bytes.get_unchecked(i) }) {
                    i += 1;
                }
                if i == start {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                state.offset = i;
                Some(Span::new(start, i, state.src))
            }

            SpanKind::TakeWhileChar(f) => {
                let slc = state.src.get(state.offset..)?;
                match slc
                    .char_indices()
                    .take_while(|(_, c)| f(*c))
                    .map(|(i, _)| i)
                    .last()
                {
                    Some(mut len) => {
                        len += 1;
                        while len < slc.len() && !slc.is_char_boundary(len) {
                            len += 1;
                        }
                        let start = state.offset;
                        state.offset += len;
                        Some(Span::new(start, state.offset, state.src))
                    }
                    None => {
                        #[cfg(feature = "diagnostics")]
                        if let Some(lbl) = self.label {
                            state.add_expected(lbl);
                        }
                        None
                    }
                }
            }

            SpanKind::NextN(amount) => {
                let start = state.offset;
                let new_offset = start + amount;
                if new_offset > state.src.len() {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                state.offset = new_offset;
                Some(Span::new(start, new_offset, state.src))
            }

            SpanKind::Epsilon => Some(Span::new(state.offset, state.offset, state.src)),

            // Domain-specific scanners delegate to SpanScanner dispatch
            SpanKind::Scanner(scanner) => {
                let result = scanner.call(state);
                #[cfg(feature = "diagnostics")]
                if result.is_none() {
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                }
                result
            }

            SpanKind::TakeUntilAny1(b1) => {
                let bytes = state.src_bytes;
                let start = state.offset;
                if start >= bytes.len() {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                let scan_len = memchr::memchr(*b1, &bytes[start..]).unwrap_or(bytes.len() - start);
                if scan_len == 0 {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                let end = start + scan_len;
                state.offset = end;
                Some(Span::new(start, end, state.src))
            }
            SpanKind::TakeUntilAny2(b1, b2) => {
                let bytes = state.src_bytes;
                let start = state.offset;
                if start >= bytes.len() {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                let scan_len =
                    memchr::memchr2(*b1, *b2, &bytes[start..]).unwrap_or(bytes.len() - start);
                if scan_len == 0 {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                let end = start + scan_len;
                state.offset = end;
                Some(Span::new(start, end, state.src))
            }
            SpanKind::TakeUntilAny3(b1, b2, b3) => {
                let bytes = state.src_bytes;
                let start = state.offset;
                if start >= bytes.len() {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                let scan_len =
                    memchr::memchr3(*b1, *b2, *b3, &bytes[start..]).unwrap_or(bytes.len() - start);
                if scan_len == 0 {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                let end = start + scan_len;
                state.offset = end;
                Some(Span::new(start, end, state.src))
            }
            SpanKind::TakeUntilAnyLut(lut) => {
                let bytes = state.src_bytes;
                let start = state.offset;
                let end = bytes.len();
                let mut i = start;
                while i < end && !lut[unsafe { *bytes.get_unchecked(i) } as usize] {
                    i += 1;
                }
                if i == start {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    return None;
                }
                state.offset = i;
                Some(Span::new(start, i, state.src))
            }

            SpanKind::Seq(parsers) => {
                let start = state.offset;
                for p in parsers {
                    p.call(state)?;
                }
                Some(Span::new(start, state.offset, state.src))
            }

            SpanKind::OneOf(parsers) => {
                for p in parsers {
                    let cp = state.offset;
                    if let Some(span) = p.call(state) {
                        return Some(span);
                    }
                    state.furthest_offset = state.furthest_offset.max(state.offset);
                    state.offset = cp;
                }
                None
            }

            SpanKind::Many { inner, lo, hi } => {
                let start = state.offset;
                let mut end = state.offset;
                let mut count = 0;
                while count < *hi {
                    match inner.call(state) {
                        Some(span) => {
                            end = span.end;
                            count += 1;
                        }
                        None => break,
                    }
                }
                if count >= *lo {
                    Some(Span::new(start, end, state.src))
                } else {
                    None
                }
            }

            SpanKind::SepBy { inner, sep, lo, hi } => {
                let start = state.offset;
                let mut count = 0;
                // Parse first element
                let Some(first_span) = inner.call(state) else {
                    if *lo == 0 {
                        return Some(Span::new(start, start, state.src));
                    }
                    return None;
                };
                let mut end = first_span.end;
                count += 1;
                // Parse (sep elem)* — checkpoint before separator to reject
                // trailing separators.
                while count < *hi {
                    let cp = state.offset;
                    if sep.call(state).is_none() {
                        state.offset = cp;
                        break;
                    }
                    if let Some(span) = inner.call(state) {
                        end = span.end;
                        count += 1;
                    } else {
                        // Element after separator failed — backtrack past
                        // the separator (reject trailing sep).
                        state.offset = cp;
                        break;
                    }
                }
                if count >= *lo {
                    Some(Span::new(start, end, state.src))
                } else {
                    None
                }
            }

            SpanKind::SepByWs { inner, sep, lo, hi } => {
                let start = state.offset;
                let mut count = 0;
                // Pre-trim before first element
                trim_leading_whitespace_mut(state);
                // Parse first element
                if inner.call(state).is_none() {
                    if *lo == 0 {
                        return Some(Span::new(start, state.offset, state.src));
                    }
                    return None;
                }
                count += 1;
                while count < *hi {
                    let cp = state.offset;
                    // Trim before separator
                    trim_leading_whitespace_mut(state);
                    if sep.call(state).is_none() {
                        state.offset = cp;
                        break;
                    }
                    // Trim before next element
                    trim_leading_whitespace_mut(state);
                    if inner.call(state).is_some() {
                        count += 1;
                    } else {
                        state.offset = cp;
                        break;
                    }
                }
                if count >= *lo {
                    // Post-trim after the last element
                    trim_leading_whitespace_mut(state);
                    Some(Span::new(start, state.offset, state.src))
                } else {
                    None
                }
            }

            SpanKind::Opt(inner) => {
                let start = state.offset;
                if inner.call(state).is_none() {
                    return Some(Span::new(start, start, state.src));
                }
                Some(Span::new(start, state.offset, state.src))
            }

            SpanKind::Wrap { left, inner, right } => {
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

            SpanKind::Skip(first, second) => {
                let span = first.call(state)?;
                second.call(state)?;
                Some(span)
            }

            SpanKind::Next(first, second) => {
                first.call(state)?;
                second.call(state)
            }

            SpanKind::Not(main, negated) => {
                let span = main.call(state)?;
                let checkpoint = state.offset;
                let saved_furthest = state.furthest_offset;
                if negated.call(state).is_none() {
                    state.offset = checkpoint;
                    state.furthest_offset = saved_furthest;
                    return Some(span);
                }
                state.offset = checkpoint;
                state.furthest_offset = saved_furthest;
                None
            }

            SpanKind::Minus(main, excluded) => {
                let checkpoint = state.offset;
                let saved_furthest = state.furthest_offset;
                if excluded.call(state).is_some() {
                    state.offset = checkpoint;
                    state.furthest_offset = saved_furthest;
                    return None;
                }
                state.offset = checkpoint;
                state.furthest_offset = saved_furthest;
                main.call(state)
            }

            SpanKind::LookAhead(main, lookahead) => {
                let span = main.call(state)?;
                let offset_after = state.offset;
                let result = lookahead.call(state);
                state.offset = offset_after;
                result?;
                Some(span)
            }

            SpanKind::Negate(inner) => {
                let checkpoint = state.offset;
                let saved_furthest = state.furthest_offset;
                if inner.call(state).is_none() {
                    state.offset = checkpoint;
                    state.furthest_offset = saved_furthest;
                    return Some(Span::new(checkpoint, checkpoint, state.src));
                }
                state.offset = checkpoint;
                state.furthest_offset = saved_furthest;
                None
            }

            SpanKind::Eof => {
                if state.is_at_end() {
                    Some(Span::new(state.offset, state.offset, state.src))
                } else {
                    #[cfg(feature = "diagnostics")]
                    if let Some(lbl) = self.label {
                        state.add_expected(lbl);
                    }
                    None
                }
            }

            SpanKind::Boxed(inner) => inner.call(state),
        }
    }

}

#[path = "span_scanner.rs"]
mod span_scanner;
pub(super) use span_scanner::SpanScanner;

#[path = "span_methods.rs"]
mod span_methods;

#[path = "span_constructors.rs"]
mod span_constructors;
pub use span_constructors::*;
