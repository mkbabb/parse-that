//! HIR-based regex classification for during-parse value conversion.
//!
//! Uses the bespoke `parse_that::regex` HIR to parse patterns into HIR
//! (High-level Intermediate Representation) and classify structurally.
//! More robust than string-level matching: normalizes `\d` / `[0-9]`,
//! class orderings, group nesting, etc.
//!
//! Known-pattern detection via exact string match takes priority over HIR
//! structural analysis, providing stable classification for canonical patterns.

mod structural;

use smallvec::SmallVec;

use crate::hir::Hir;
use crate::sets::charset::CharSet128;

use structural::{
    try_classify_charclass_quantified, try_classify_hex, try_classify_identifier,
    try_classify_numeric, try_classify_prefix_then_class, try_classify_quoted_string,
};

/// Information about a quantified character class, used by both
/// `RegexInfo::quantified_class` and the `RegexClass::CharClassQuantified`
/// structural variant. Re-exported from `crate::info::QuantifiedClassInfo`
/// once that module declares it; defined here to avoid the cyclic dependency
/// (classify/ is consumed by info/).
#[derive(Clone, Debug, PartialEq)]
pub struct ClassRangeInfo {
    /// Positive form of the byte set the class accepts (ASCII).
    pub chars: CharSet128,
    /// Whether the original class was negated (`[^...]`).
    pub negated: bool,
    /// Minimum repetition count.
    pub min: u32,
    /// Maximum repetition count (`None` = unbounded).
    pub max: Option<u32>,
}

/// Classification result for a regex pattern.
#[derive(Debug, Clone, PartialEq)]
pub enum RegexClass {
    /// Matches numeric values convertible to f64.
    Numeric {
        allows_sign: bool,
        allows_fraction: bool,
        allows_exponent: bool,
    },

    /// Matches quoted strings: `"content"` or `'content'`.
    QuotedString {
        quote_char: u8,
        allows_escapes: bool,
    },

    /// Matches hex digit runs: `[0-9a-fA-F]+` or similar.
    HexDigits,

    /// Matches identifier-class tokens: `[a-zA-Z_][\w-]*` or similar.
    Identifier,

    /// Canonical JSON string regex — exact-match fast path.
    JsonString,

    /// Canonical JSON number regex — exact-match fast path.
    JsonNumber,

    /// Whitespace + block-comment regex (`(?s)(?:\s|/\*.*?\*/)*`).
    WsBlockComment,

    /// CSS identifier regex (known patterns with custom-property support).
    CssIdent,

    /// CSS quoted string regex (double or single, with general escapes).
    CssQuotedString,

    /// `[a-z]+`, `\d*`, `[^"\\]+`, etc. — quantified char class.
    /// Tranche V: closes the gap where structural information was already
    /// extracted into `RegexInfo.quantified_class` but no `RegexClass`
    /// variant existed for it.
    CharClassQuantified(ClassRangeInfo),

    /// `--[\w-]+`, `@[a-z][\w-]*`, `#[a-f0-9]+`, etc. — fixed literal
    /// prefix followed by a quantified class tail. Tranche V: closes the
    /// "literal prefix + class suffix" coverage gap.
    PrefixThenClass {
        prefix: SmallVec<[u8; 8]>,
        tail: ClassRangeInfo,
    },

    /// Pattern with a guaranteed mandatory byte that drives memchr
    /// acceleration but doesn't fit a narrower family. Tranche V: gives
    /// `RegexInfo.accel_candidate` a first-class home in the taxonomy.
    AccelDriven(u8),

    /// Not classifiable — use general regex engine.
    Unknown,
}

// ── Known-pattern constants ───────────────────────────────────────────────

const JSON_STRING_PATTERNS: &[&str] = &[
    r#""(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*""#,
    r#""(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9A-Fa-f]{4}))*""#,
    r#""(?:[^"\\]|\\(?:["\\bfnrt]|u[0-9a-fA-F]{4}))*""#,
];

const JSON_NUMBER_PATTERNS: &[&str] = &[
    r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?",
    r"-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?",
];

const WS_BLOCK_COMMENT_PATTERNS: &[&str] = &[r"(?s)(?:\s|/\*.*?\*/)*", r"(?s)(?:\s|\/\*.*?\*\/)*"];

const IDENT_PATTERNS: &[&str] = &[
    r"[\-]?[a-zA-Z_][\w-]*|--[\w-]+",
    r"-?[a-zA-Z_][\w-]*|--[\w-]+",
    r"[a-zA-Z_][\w-]*|--[\w-]+|-[a-zA-Z][\w-]*",
    r"[a-zA-Z_][\w-]*",
    r"[a-zA-Z][\w-]*",
];

const QUOTED_STRING_PATTERNS: &[&str] = &[r#""(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'"#];

/// Classify by exact match against known canonical patterns.
pub fn classify_known_pattern(pattern: &str) -> Option<RegexClass> {
    if JSON_STRING_PATTERNS.contains(&pattern) {
        return Some(RegexClass::JsonString);
    }
    if JSON_NUMBER_PATTERNS.contains(&pattern) {
        return Some(RegexClass::JsonNumber);
    }
    if WS_BLOCK_COMMENT_PATTERNS.contains(&pattern) {
        return Some(RegexClass::WsBlockComment);
    }
    if IDENT_PATTERNS.contains(&pattern) {
        return Some(RegexClass::CssIdent);
    }
    if QUOTED_STRING_PATTERNS.contains(&pattern) {
        return Some(RegexClass::CssQuotedString);
    }
    None
}

/// Classify a regex pattern structurally via HIR, with known-pattern
/// fast path checked first.
///
/// Prefer `classify_regex_from_hir` when the consumer already has a parsed
/// `Hir` — this wrapper exists for callers that only have the pattern string.
pub fn classify_regex(pattern: &str) -> RegexClass {
    // Fast path: exact match against known canonical patterns.
    if let Some(class) = classify_known_pattern(pattern) {
        return class;
    }

    let hir = match crate::hir::parser::parse_with(
        pattern,
        &crate::ParseOptions::byte_mode(),
    ) {
        Ok(h) => h,
        Err(_) => return RegexClass::Unknown,
    };

    classify_regex_from_hir(&hir)
}

/// Classify a regex pattern from a pre-parsed HIR. The core implementation
/// used by `classify_regex` after parsing, and by `RegexInfo::analyze` to
/// avoid redundant parses.
///
/// Does not consult the known-pattern fast path — callers with only the
/// pattern string should use `classify_regex` (which checks the fast path
/// before calling this).
///
/// Classifier order: narrower / value-bearing classes first
/// (Numeric / QuotedString / Hex / Identifier), then the structural
/// fallthroughs introduced in Tranche V (CharClassQuantified,
/// PrefixThenClass) for patterns that previously fell to Unknown despite
/// carrying enough structural signal for kernel emission. AccelDriven is
/// not produced here because it depends on the literal prefix/suffix
/// computed in info/, not from raw HIR.
pub fn classify_regex_from_hir(hir: &Hir) -> RegexClass {
    if let Some(class) = try_classify_numeric(hir) {
        return class;
    }
    if let Some(class) = try_classify_quoted_string(hir) {
        return class;
    }
    if try_classify_hex(hir) {
        return RegexClass::HexDigits;
    }
    if try_classify_identifier(hir) {
        return RegexClass::Identifier;
    }
    if let Some(class) = try_classify_prefix_then_class(hir) {
        return class;
    }
    if let Some(class) = try_classify_charclass_quantified(hir) {
        return class;
    }
    RegexClass::Unknown
}

// ── Utility ────────────────────────────────────────────────────────────────

pub(crate) fn is_literal_byte(hir: &Hir, byte: u8) -> bool {
    if let Hir::Literal(bytes) = hir {
        return bytes.len() == 1 && bytes[0] == byte;
    }
    false
}

pub(crate) fn unwrap_group(hir: &Hir) -> &Hir {
    match hir {
        Hir::Group(sub) => unwrap_group(sub),
        _ => hir,
    }
}

pub(crate) fn unwrap_repetition(hir: &Hir) -> Option<&Hir> {
    if let Hir::Repetition(rep) = hir {
        Some(&rep.sub)
    } else {
        None
    }
}
