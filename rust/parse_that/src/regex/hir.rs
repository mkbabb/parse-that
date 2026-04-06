//! Bespoke regex HIR (High-level Intermediate Representation).
//!
//! Replaces `regex_syntax::hir::*`. Key difference: `CharClass` retains a
//! `negated` flag instead of materializing the complement as positive ranges.

// ── Byte-level range ────────────────────────────────────────────────────

/// An inclusive byte range `[start, end]`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct ByteRange {
    pub start: u8,
    pub end: u8,
}

impl ByteRange {
    pub const fn new(start: u8, end: u8) -> Self {
        Self { start, end }
    }
}

// ── Unicode codepoint range ─────────────────────────────────────────────

/// An inclusive codepoint range `[start, end]`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct CodepointRange {
    pub start: char,
    pub end: char,
}

impl CodepointRange {
    pub const fn new(start: char, end: char) -> Self {
        Self { start, end }
    }
}

// ── Character class ─────────────────────────────────────────────────────

/// Character class — unified byte-level and Unicode.
///
/// Key difference from `regex-syntax`: retains `negated` flag. Consumers can
/// call `negated()` directly instead of heuristic byte-count detection.
#[derive(Clone, Debug, PartialEq)]
pub enum CharClass {
    /// Byte-level class (ASCII patterns, `\d`, `\w`, `\s`, `[a-z]`, `[^abc]`).
    /// Ranges are sorted and non-overlapping.
    Bytes {
        ranges: Vec<ByteRange>,
        negated: bool,
    },
    /// Unicode codepoint class (`\p{Letter}`, `[\u{0100}-\u{017F}]`, etc.).
    /// Expanded to UTF-8 byte sequences during NFA construction.
    Unicode {
        ranges: Vec<CodepointRange>,
        negated: bool,
    },
}

impl CharClass {
    /// Whether this class was written as a negated class (`[^...]`).
    pub fn negated(&self) -> bool {
        match self {
            CharClass::Bytes { negated, .. } | CharClass::Unicode { negated, .. } => *negated,
        }
    }

    /// Materialize the positive byte ranges for NFA construction.
    ///
    /// For non-negated `Bytes` classes, returns the ranges directly.
    /// For negated `Bytes` classes, computes the complement over `[0, 255]`.
    /// For `Unicode` classes, panics — use `to_positive_codepoint_ranges()`
    /// and expand to UTF-8 byte sequences instead.
    pub fn to_positive_byte_ranges(&self) -> Vec<ByteRange> {
        match self {
            CharClass::Bytes { ranges, negated } => {
                if !negated {
                    return ranges.clone();
                }
                negate_byte_ranges(ranges)
            }
            CharClass::Unicode { .. } => {
                panic!("to_positive_byte_ranges() not valid for Unicode classes; use UTF-8 expansion")
            }
        }
    }

    /// Materialize positive codepoint ranges (applying negation if needed).
    pub fn to_positive_codepoint_ranges(&self) -> Vec<CodepointRange> {
        match self {
            CharClass::Unicode { ranges, negated } => {
                if !negated {
                    return ranges.clone();
                }
                negate_codepoint_ranges(ranges)
            }
            CharClass::Bytes { .. } => {
                panic!("to_positive_codepoint_ranges() not valid for Bytes classes")
            }
        }
    }
}

/// Negate sorted, non-overlapping byte ranges over `[0, 255]`.
fn negate_byte_ranges(ranges: &[ByteRange]) -> Vec<ByteRange> {
    let mut result = Vec::new();
    let mut cursor: u16 = 0; // u16 to handle 255+1
    for r in ranges {
        let start = r.start as u16;
        if cursor < start {
            result.push(ByteRange::new(cursor as u8, (start - 1) as u8));
        }
        cursor = r.end as u16 + 1;
    }
    if cursor <= 255 {
        result.push(ByteRange::new(cursor as u8, 255));
    }
    result
}

/// Negate sorted, non-overlapping codepoint ranges over `['\0', '\u{10FFFF}']`,
/// skipping the surrogate range `[U+D800, U+DFFF]`.
fn negate_codepoint_ranges(ranges: &[CodepointRange]) -> Vec<CodepointRange> {
    let mut result = Vec::new();
    let mut cursor: u32 = 0;

    for r in ranges {
        let start = r.start as u32;
        if cursor < start {
            add_codepoint_range(&mut result, cursor, start - 1);
        }
        cursor = r.end as u32 + 1;
    }
    if cursor <= 0x10FFFF {
        add_codepoint_range(&mut result, cursor, 0x10FFFF);
    }
    result
}

/// Add a codepoint range, splitting around the surrogate gap.
fn add_codepoint_range(out: &mut Vec<CodepointRange>, lo: u32, hi: u32) {
    if lo > hi {
        return;
    }
    // Split around surrogate range D800..DFFF
    if lo <= 0xD7FF && hi >= 0xD800 {
        if lo <= 0xD7FF {
            out.push(CodepointRange::new(
                char::from_u32(lo).unwrap(),
                '\u{D7FF}',
            ));
        }
        if hi >= 0xE000 {
            out.push(CodepointRange::new(
                '\u{E000}',
                char::from_u32(hi).unwrap(),
            ));
        }
    } else if lo >= 0xD800 && lo <= 0xDFFF {
        // Start is in surrogate range — skip to E000.
        if hi >= 0xE000 {
            out.push(CodepointRange::new(
                '\u{E000}',
                char::from_u32(hi).unwrap(),
            ));
        }
    } else {
        out.push(CodepointRange::new(
            char::from_u32(lo).unwrap(),
            char::from_u32(hi).unwrap(),
        ));
    }
}

// ── Look assertions ─────────────────────────────────────────────────────

/// Position assertions (zero-width).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Look {
    /// `^` — start of input (or start of line with `(?m)`).
    Start,
    /// `$` — end of input (or end of line with `(?m)`).
    End,
    /// `^` with `(?m)` — start of line (LF).
    StartLF,
    /// `$` with `(?m)` — end of line (LF).
    EndLF,
    /// Start of line (CRLF).
    StartCRLF,
    /// End of line (CRLF).
    EndCRLF,
}

// ── Repetition ──────────────────────────────────────────────────────────

/// Quantified sub-expression.
#[derive(Clone, Debug, PartialEq)]
pub struct Repetition {
    pub sub: Box<Hir>,
    pub min: u32,
    pub max: Option<u32>, // None = unbounded
    pub greedy: bool,
}

// ── HIR ─────────────────────────────────────────────────────────────────

/// High-level intermediate representation for a regex pattern.
///
/// Flat enum — match directly, no `.kind()` indirection.
#[derive(Clone, Debug, PartialEq)]
pub enum Hir {
    /// Matches the empty string.
    Empty,
    /// Matches a literal byte sequence.
    Literal(Vec<u8>),
    /// Matches a character class.
    Class(CharClass),
    /// Zero-width position assertion.
    Look(Look),
    /// Quantified sub-expression (`*`, `+`, `?`, `{n,m}`).
    Repetition(Repetition),
    /// Capture group (treated as transparent — only the sub-expression matters).
    Group(Box<Hir>),
    /// Concatenation of sub-expressions.
    Concat(Vec<Hir>),
    /// Alternation of sub-expressions.
    Alternation(Vec<Hir>),
}

// ── Parse error ─────────────────────────────────────────────────────────

/// Error returned when parsing a regex pattern.
#[derive(Clone, Debug)]
pub struct ParseError {
    pub message: String,
    pub offset: usize,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "regex parse error at byte {}: {}", self.offset, self.message)
    }
}

impl std::error::Error for ParseError {}

// ── Parse options ───────────────────────────────────────────────────────

/// Options controlling regex parsing behavior.
#[derive(Clone, Debug)]
pub struct ParseOptions {
    /// Enable Unicode mode (`\w` = Unicode letters, `.` matches codepoints).
    /// When false, byte mode: `\w` = ASCII `[0-9A-Za-z_]`, `.` matches any byte.
    pub unicode: bool,
}

impl Default for ParseOptions {
    fn default() -> Self {
        Self { unicode: true }
    }
}

impl ParseOptions {
    /// Byte mode — ASCII-only shorthand classes, `.` matches any byte.
    pub fn byte_mode() -> Self {
        Self { unicode: false }
    }
}

// ── Tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn negate_empty() {
        let neg = negate_byte_ranges(&[]);
        assert_eq!(neg, vec![ByteRange::new(0, 255)]);
    }

    #[test]
    fn negate_full() {
        let neg = negate_byte_ranges(&[ByteRange::new(0, 255)]);
        assert!(neg.is_empty());
    }

    #[test]
    fn negate_middle() {
        // [a-z] → [0, 96] ∪ [123, 255]
        let neg = negate_byte_ranges(&[ByteRange::new(b'a', b'z')]);
        assert_eq!(neg, vec![
            ByteRange::new(0, b'a' - 1),
            ByteRange::new(b'z' + 1, 255),
        ]);
    }

    #[test]
    fn char_class_negated_flag() {
        let c = CharClass::Bytes {
            ranges: vec![ByteRange::new(b'a', b'z')],
            negated: true,
        };
        assert!(c.negated());
        let positive = c.to_positive_byte_ranges();
        assert!(positive.iter().any(|r| r.start == 0));
        assert!(!positive.iter().any(|r| r.start == b'a' && r.end == b'z'));
    }
}
