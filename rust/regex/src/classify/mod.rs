//! HIR-based regex classification for during-parse value conversion.
//!
//! Uses the bespoke `parse_that::regex` HIR to parse patterns into HIR
//! (High-level Intermediate Representation) and classify structurally.
//! More robust than string-level matching: normalizes `\d` / `[0-9]`,
//! class orderings, group nesting, etc.
//!
//! Classification is purely structural — every distinguishing flag
//! (sign / fraction / exponent / leading-zero rejection / `\uXXXX`
//! escapes / leading-dash identifiers) is recovered by walking the
//! HIR. There is no nominal fast path: equivalent regexes that differ
//! only in surface form (`\d` vs `[0-9]`, group nesting, ordering)
//! collapse to the same parameterized variant.

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
///
/// Every variant carries the structural parameters that distinguish
/// related dialects. Two patterns that compile to the same HIR up to
/// nesting and ordering produce the same `RegexClass` value with the
/// same field bindings; consumers therefore never need to maintain a
/// dialect dictionary or compare against canonical pattern strings.
#[derive(Debug, Clone, PartialEq)]
pub enum RegexClass {
    /// Numeric token convertible to `f64`. The flags collapse the
    /// JSON / CSS / generic dialects into one variant.
    Numeric {
        allows_sign: bool,
        allows_fraction: bool,
        allows_exponent: bool,
        /// `0|[1-9]\d*` integer alternation — JSON-style integer with
        /// no leading zeros allowed beyond the single `0` literal.
        reject_leading_zero: bool,
        /// `\.\d+` is a valid first segment (CSS `.5` is a number).
        allow_leading_dot: bool,
    },

    /// Quoted string: `"content"` or `'content'`. Carries the quote
    /// byte plus the escape-vocabulary flags so JSON strings (with
    /// `\uXXXX`) and generic CSS strings (no `\u` escape) collapse
    /// into one variant.
    QuotedString {
        quote_char: u8,
        allows_escapes: bool,
        /// JSON-style `\uXXXX` codepoint escapes are valid inside the
        /// content body.
        allows_u_escapes: bool,
    },

    /// Hex-digit run: `[0-9a-fA-F]+` and quantified equivalents.
    HexDigits,

    /// Identifier-class token: `[a-zA-Z_][\w-]*` and CSS dialects.
    /// The flags collapse the generic / CSS-with-leading-dash /
    /// CSS-with-`--` variants into one variant.
    Identifier {
        /// Pattern accepts an optional leading `-` (CSS `-foo`).
        allows_leading_dash: bool,
        /// Pattern accepts a CSS custom-property `--name` prefix.
        allows_double_dash_prefix: bool,
    },

    /// Whitespace + block-comment regex (`(?s)(?:\s|/\*.*?\*/)*`)
    /// and DFA-compatible variants. Nullary because the family is
    /// fully determined by the `\s` / block-comment alternation
    /// pair; there is no other dimension worth parameterizing.
    WhitespaceWithBlockComment,

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

impl RegexClass {
    /// Canonical regex-pattern string for a parameterized variant.
    ///
    /// Used by IR-side recognizer configuration to avoid hardcoding
    /// pattern literals (e.g., `key_class_regex_pattern` consults this
    /// rather than embedding `r"[a-zA-Z_][\w-]*"` directly). Returns
    /// `None` for variants whose canonical form depends on data that
    /// only the original pattern carried (`CharClassQuantified`,
    /// `PrefixThenClass`, `AccelDriven`, `Unknown`).
    pub fn canonical_pattern(&self) -> Option<&'static str> {
        match self {
            RegexClass::Identifier {
                allows_leading_dash: true,
                allows_double_dash_prefix: true,
            } => Some(r"-?[a-zA-Z_][\w-]*|--[\w-]+"),
            RegexClass::Identifier {
                allows_leading_dash: false,
                allows_double_dash_prefix: false,
            } => Some(r"[a-zA-Z_][\w-]*"),
            RegexClass::QuotedString {
                quote_char: b'"', ..
            } => Some(r#""(?:[^"\\]|\\[\s\S])*""#),
            RegexClass::QuotedString {
                quote_char: b'\'', ..
            } => Some(r"'(?:[^'\\]|\\[\s\S])*'"),
            _ => None,
        }
    }
}

/// Classify a regex pattern structurally via HIR.
///
/// Prefer `classify_regex_from_hir` when the consumer already has a parsed
/// `Hir` — this wrapper exists for callers that only have the pattern string.
pub fn classify_regex(pattern: &str) -> RegexClass {
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
    if let Some(class) = try_classify_identifier(hir) {
        return class;
    }
    if let Some(class) = try_classify_whitespace_block_comment(hir) {
        return class;
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

// ── WhitespaceWithBlockComment ─────────────────────────────────────────────
//
// Detects the canonical comment-aware whitespace family
// `(?s)(?:\s|/\*.*?\*/)*` and the DFA-compatible expansions
// `(?s)(?:\s|/\*[^*]*(?:\*+[^/][^*]*)*\*+/)*`. Both shapes resolve
// to a top-level Repetition over an Alternation whose two branches
// are (a) the shorthand whitespace class `\s` and (b) any HIR
// fragment that begins with the literal bytes `/*` and ends with
// `*/`. The comment body's exact internal structure is irrelevant
// to the classification — what matters is the surrounding
// `(?:\s | /\*…\*/)*` envelope.

fn try_classify_whitespace_block_comment(hir: &Hir) -> Option<RegexClass> {
    // The `(?s)` flag marker materializes as a leading `Empty` node
    // inside a Concat. Strip that wrapper so we can recognize the
    // bare Repetition shape.
    let inner = strip_leading_empty(unwrap_group(hir));
    let rep = match inner {
        Hir::Repetition(rep) => rep,
        _ => return None,
    };
    if rep.min != 0 {
        return None;
    }
    let alt_inner = unwrap_group(&rep.sub);
    let alts = match alt_inner {
        Hir::Alternation(alts) if alts.len() == 2 => alts,
        _ => return None,
    };
    let (ws_branch, comment_branch) = if is_whitespace_shorthand(&alts[0]) {
        (&alts[0], &alts[1])
    } else if is_whitespace_shorthand(&alts[1]) {
        (&alts[1], &alts[0])
    } else {
        return None;
    };
    let _ = ws_branch;
    if !is_block_comment_body(comment_branch) {
        return None;
    }
    Some(RegexClass::WhitespaceWithBlockComment)
}

/// Strip a leading `Empty` node from a Concat — the HIR parser
/// emits `Empty` as a flag marker (e.g., `(?s)` produces
/// `Concat([Empty, ...])`).
fn strip_leading_empty(hir: &Hir) -> &Hir {
    if let Hir::Concat(parts) = hir {
        if parts.len() == 2 && matches!(&parts[0], Hir::Empty) {
            return &parts[1];
        }
    }
    hir
}

/// `\s` shorthand: the standard ASCII whitespace class
/// `[\t\n\x0B\x0C\r ]` that the HIR parser materializes into a
/// six-byte byte class.
fn is_whitespace_shorthand(hir: &Hir) -> bool {
    use crate::hir::{ByteRange, CharClass};
    let inner = unwrap_group(hir);
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = inner {
        if *negated {
            return false;
        }
        let has_tab_to_cr = ranges
            .iter()
            .any(|r| *r == ByteRange::new(0x09, 0x0D));
        let has_space = ranges.iter().any(|r| *r == ByteRange::new(b' ', b' '));
        return has_tab_to_cr && has_space;
    }
    false
}

/// Block-comment body: every branch shape we recognize starts with
/// the literal bytes `/*` and ends with the literal bytes `*/`. The
/// HIR parser sometimes splits the leading and trailing two-byte
/// literals into adjacent single-byte Literal nodes, so we walk
/// the leading and trailing byte sequences to look for the
/// `/`-then-`*` and `*`-then-`/` adjacency rather than requiring
/// a single fused Literal.
fn is_block_comment_body(hir: &Hir) -> bool {
    let parts = match unwrap_group(hir) {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return false,
    };
    if parts.len() < 2 {
        return false;
    }
    leading_bytes_match(parts, b"/*") && trailing_bytes_match(parts, b"*/")
}

/// Walk leading Literal nodes and check whether they collectively
/// begin with `expected`.
fn leading_bytes_match(parts: &[Hir], expected: &[u8]) -> bool {
    let mut idx = 0;
    let mut consumed = 0;
    while consumed < expected.len() && idx < parts.len() {
        match &parts[idx] {
            Hir::Literal(bytes) => {
                let need = expected.len() - consumed;
                let take = bytes.len().min(need);
                if bytes[..take] != expected[consumed..consumed + take] {
                    return false;
                }
                consumed += take;
                idx += 1;
            }
            _ => return false,
        }
    }
    consumed == expected.len()
}

/// Walk trailing Literal nodes and check whether they collectively
/// end with `expected`.
fn trailing_bytes_match(parts: &[Hir], expected: &[u8]) -> bool {
    let mut idx = parts.len();
    let mut consumed = 0;
    while consumed < expected.len() && idx > 0 {
        idx -= 1;
        match &parts[idx] {
            Hir::Literal(bytes) => {
                let need = expected.len() - consumed;
                let take = bytes.len().min(need);
                let bytes_slice = &bytes[bytes.len() - take..];
                let expected_slice = &expected[expected.len() - consumed - take..expected.len() - consumed];
                if bytes_slice != expected_slice {
                    return false;
                }
                consumed += take;
            }
            _ => return false,
        }
    }
    consumed == expected.len()
}
