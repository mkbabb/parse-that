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

use crate::hir::Hir;

use structural::{
    try_classify_hex, try_classify_identifier, try_classify_numeric, try_classify_quoted_string,
};

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
fn classify_known_pattern(pattern: &str) -> Option<RegexClass> {
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

    if let Some(class) = try_classify_numeric(&hir) {
        return class;
    }
    if let Some(class) = try_classify_quoted_string(&hir) {
        return class;
    }
    if try_classify_hex(&hir) {
        return RegexClass::HexDigits;
    }
    if try_classify_identifier(&hir) {
        return RegexClass::Identifier;
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
