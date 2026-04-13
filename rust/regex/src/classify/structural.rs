//! Structural HIR classifiers for regex patterns.
//!
//! Pure HIR analyzers that decompose regex patterns into semantic categories
//! (Numeric, QuotedString, HexDigits, Identifier, CharClassQuantified,
//! PrefixThenClass) by walking the bespoke `parse_that::regex::hir` tree.

use smallvec::SmallVec;

use crate::hir::{ByteRange, CharClass, Hir, Repetition};
use crate::sets::charset::CharSet128;

use super::{ClassRangeInfo, RegexClass, is_literal_byte, unwrap_group};

// ── Numeric ────────────────────────────────────────────────────────────────

pub(super) fn try_classify_numeric(hir: &Hir) -> Option<RegexClass> {
    // Flatten the top-level concat (or treat a single node as a 1-element list).
    let parts = match hir {
        Hir::Concat(parts) => parts.as_slice(),
        _ => std::slice::from_ref(hir),
    };

    let mut idx = 0;
    let mut allows_sign = false;
    let mut allows_fraction = false;
    let mut allows_exponent = false;
    let mut reject_leading_zero = false;
    let mut allow_leading_dot = false;

    // Optional sign: `[-+]?` or `-?`
    if idx < parts.len() && is_optional_sign_class(&parts[idx]) {
        allows_sign = true;
        idx += 1;
    }

    // Required digits (or alternation with optional fraction built in).
    if idx >= parts.len() {
        return None;
    }
    if is_digit_repetition(&parts[idx]) {
        idx += 1;
    } else if is_digit_class(&parts[idx]) {
        idx += 1;
    } else if is_json_integer_alternation(&parts[idx]) {
        // `(0|[1-9]\d*)` — the JSON integer alternation deliberately
        // forbids `00`, `01`, etc. The dialect flag survives even when
        // an exponent or fraction follows.
        reject_leading_zero = true;
        idx += 1;
    } else if is_css_number_body(&parts[idx]) {
        // `(\d+(\.\d+)?|\.\d+)` accepts `.5` as a leading-dot number.
        allows_fraction = true;
        allow_leading_dot = true;
        idx += 1;
    } else {
        return None;
    }

    // Optional fraction: `(\.\d+)?` or `\.\d+`
    if idx < parts.len() && is_fraction_part(&parts[idx]) {
        allows_fraction = true;
        idx += 1;
    }

    // Optional exponent: `([eE][+-]?\d+)?`
    if idx < parts.len() && is_exponent_part(&parts[idx]) {
        allows_exponent = true;
        idx += 1;
    }

    if idx != parts.len() {
        return None;
    }

    Some(RegexClass::Numeric {
        allows_sign,
        allows_fraction,
        allows_exponent,
        reject_leading_zero,
        allow_leading_dot,
    })
}

/// Check if HIR is an optional sign class: `[-+]?` or `-?`
fn is_optional_sign_class(hir: &Hir) -> bool {
    if let Hir::Repetition(rep) = hir {
        if rep.min == 0 && rep.max == Some(1) {
            return is_sign_class(&rep.sub);
        }
    }
    if let Hir::Group(sub) = hir {
        return is_optional_sign_class(sub);
    }
    false
}

fn is_sign_class(hir: &Hir) -> bool {
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = hir {
        if *negated {
            return false;
        }
        let has_plus = ranges.iter().any(|r| r.start <= b'+' && r.end >= b'+');
        let has_minus = ranges.iter().any(|r| r.start <= b'-' && r.end >= b'-');
        return has_minus && (has_plus || ranges.len() == 1);
    }
    if let Hir::Literal(bytes) = hir {
        return bytes.as_slice() == b"-";
    }
    false
}

/// Check if HIR is a digit repetition: `\d+`, `[0-9]+`, etc.
fn is_digit_repetition(hir: &Hir) -> bool {
    if let Hir::Repetition(rep) = hir {
        if rep.min >= 1 || (rep.min == 0 && rep.max.is_none()) {
            return is_digit_class(&rep.sub);
        }
    }
    if let Hir::Group(sub) = hir {
        return is_digit_repetition(sub);
    }
    false
}

/// Check if HIR is a digit class: `\d`, `[0-9]`
fn is_digit_class(hir: &Hir) -> bool {
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = hir {
        if *negated {
            return false;
        }
        return ranges.len() == 1 && ranges[0] == ByteRange::new(b'0', b'9');
    }
    false
}

/// Check if HIR matches `(0|[1-9]\d*)` (JSON integer alternation).
fn is_json_integer_alternation(hir: &Hir) -> bool {
    let inner = unwrap_group(hir);
    if let Hir::Alternation(alts) = inner {
        if alts.len() == 2 {
            let is_zero = is_literal_byte(&alts[0], b'0');
            let is_nonzero_seq = is_nonzero_digit_seq(&alts[1]);
            return is_zero && is_nonzero_seq;
        }
    }
    false
}

/// Check if HIR matches `[1-9]\d*`
fn is_nonzero_digit_seq(hir: &Hir) -> bool {
    let parts = match hir {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return false,
    };
    if parts.len() != 2 {
        return false;
    }
    // [1-9]
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = &parts[0] {
        if *negated {
            return false;
        }
        if !(ranges.len() == 1 && ranges[0] == ByteRange::new(b'1', b'9')) {
            return false;
        }
    } else {
        return false;
    }
    // \d*
    if let Hir::Repetition(rep) = &parts[1] {
        return rep.min == 0 && rep.max.is_none() && is_digit_class(&rep.sub);
    }
    false
}

/// Check if HIR matches `(\d+(\.\d+)?|\.\d+)` (CSS non-nullable number body).
fn is_css_number_body(hir: &Hir) -> bool {
    let inner = unwrap_group(hir);
    if let Hir::Alternation(alts) = inner {
        if alts.len() == 2 {
            return is_digits_with_optional_fraction(&alts[0]) && is_dot_digits(&alts[1]);
        }
    }
    false
}

fn is_digits_with_optional_fraction(hir: &Hir) -> bool {
    let parts = match hir {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return is_digit_repetition(hir),
    };
    if parts.len() != 2 {
        return false;
    }
    is_digit_repetition(&parts[0]) && is_fraction_part(&parts[1])
}

fn is_dot_digits(hir: &Hir) -> bool {
    let parts = match hir {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return false,
    };
    if parts.len() != 2 {
        return false;
    }
    is_literal_byte(&parts[0], b'.') && is_digit_repetition(&parts[1])
}

/// Check if HIR is an optional fraction: `(\.\d+)?` or `\.\d+`.
fn is_fraction_part(hir: &Hir) -> bool {
    if let Hir::Repetition(rep) = hir {
        if rep.min == 0 && rep.max == Some(1) {
            return is_dot_digits_inner(&rep.sub);
        }
    }
    is_dot_digits_inner(hir)
}

fn is_dot_digits_inner(hir: &Hir) -> bool {
    let inner = unwrap_group(hir);
    let parts = match inner {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return false,
    };
    if parts.len() != 2 {
        return false;
    }
    is_literal_byte(&parts[0], b'.') && is_digit_repetition(&parts[1])
}

/// Check if HIR is an optional exponent: `([eE][+-]?\d+)?`.
fn is_exponent_part(hir: &Hir) -> bool {
    if let Hir::Repetition(rep) = hir {
        if rep.min == 0 && rep.max == Some(1) {
            return is_exponent_inner(&rep.sub);
        }
    }
    is_exponent_inner(hir)
}

fn is_exponent_inner(hir: &Hir) -> bool {
    let inner = unwrap_group(hir);
    let parts = match inner {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return false,
    };
    if parts.len() < 2 || parts.len() > 3 {
        return false;
    }
    if !is_exponent_letter_class(&parts[0]) {
        return false;
    }
    if parts.len() == 3 {
        is_optional_sign_class(&parts[1]) && is_digit_repetition(&parts[2])
    } else {
        is_digit_repetition(&parts[1])
    }
}

fn is_exponent_letter_class(hir: &Hir) -> bool {
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = hir {
        if *negated {
            return false;
        }
        let has_e = ranges.iter().any(|r| r.start <= b'e' && r.end >= b'e');
        let has_upper_e = ranges.iter().any(|r| r.start <= b'E' && r.end >= b'E');
        return has_e && has_upper_e;
    }
    false
}

// ── QuotedString ───────────────────────────────────────────────────────────

pub(super) fn try_classify_quoted_string(hir: &Hir) -> Option<RegexClass> {
    let parts = match hir {
        Hir::Concat(parts) => parts.as_slice(),
        _ => {
            // Top-level alternation of two same-quote-char patterns is
            // common (e.g., the CSS `"…" | '…'` shape collapses to a
            // single Alternation rather than a Concat). Recurse into
            // every branch and return the first that classifies as a
            // QuotedString — branch quote chars must agree, but we
            // accept any legal first match because the dialect flags
            // are preserved structurally.
            if let Hir::Alternation(alts) = hir {
                for alt in alts {
                    if let Some(class) = try_classify_quoted_string(alt) {
                        return Some(class);
                    }
                }
            }
            return None;
        }
    };
    if parts.len() < 3 {
        return None;
    }

    // First element: literal quote char.
    let quote_char = match &parts[0] {
        Hir::Literal(bytes) if bytes.len() == 1 => {
            let b = bytes[0];
            if b == b'"' || b == b'\'' {
                b
            } else {
                return None;
            }
        }
        _ => return None,
    };

    // Last element: literal closing quote (same char).
    let last = parts.last()?;
    match last {
        Hir::Literal(bytes) if bytes.len() == 1 && bytes[0] == quote_char => {}
        _ => return None,
    }

    // Middle: repetition containing the content pattern. Inspect for
    // backslash escapes and the JSON-style `\uXXXX` codepoint escape
    // shape so consumers can distinguish JSON strings (with `\u`)
    // from generic CSS strings (`\[\s\S]` only).
    let middle = &parts[1..parts.len() - 1];
    let allows_escapes = middle.iter().any(contains_backslash_pattern);
    let allows_u_escapes = allows_escapes && middle.iter().any(contains_u_escape_pattern);

    Some(RegexClass::QuotedString {
        quote_char,
        allows_escapes,
        allows_u_escapes,
    })
}

fn contains_backslash_pattern(hir: &Hir) -> bool {
    match hir {
        Hir::Literal(bytes) => bytes.contains(&b'\\'),
        Hir::Concat(parts) => parts.iter().any(contains_backslash_pattern),
        Hir::Alternation(alts) => alts.iter().any(contains_backslash_pattern),
        Hir::Repetition(rep) => contains_backslash_pattern(&rep.sub),
        Hir::Group(sub) => contains_backslash_pattern(sub),
        _ => false,
    }
}

/// Detect the JSON `\uXXXX` codepoint escape shape: a literal `u`
/// byte directly followed by a four-digit hex repetition. The HIR
/// parser materializes the standard `u[0-9a-fA-F]{4}` fragment as a
/// `Concat([Literal('u'), Repetition([0-9a-fA-F]{4})])` (sometimes
/// nested inside a wider Alternation), so we walk the same nodes
/// `contains_backslash_pattern` does and look for that local shape.
fn contains_u_escape_pattern(hir: &Hir) -> bool {
    match hir {
        Hir::Concat(parts) => {
            if has_u_then_quad_hex(parts) {
                return true;
            }
            parts.iter().any(contains_u_escape_pattern)
        }
        Hir::Alternation(alts) => alts.iter().any(contains_u_escape_pattern),
        Hir::Repetition(rep) => contains_u_escape_pattern(&rep.sub),
        Hir::Group(sub) => contains_u_escape_pattern(sub),
        _ => false,
    }
}

/// Search a flat Concat slice for an adjacent `u` literal followed
/// by a 4-occurrence hex-class repetition. Both the `\u` part of a
/// JSON escape and the trailing `XXXX` materialize this pair.
fn has_u_then_quad_hex(parts: &[Hir]) -> bool {
    if parts.len() < 2 {
        return false;
    }
    for window in parts.windows(2) {
        let head = match &window[0] {
            Hir::Literal(bytes) => bytes,
            _ => continue,
        };
        if head.last().copied() != Some(b'u') {
            continue;
        }
        let tail = unwrap_group(&window[1]);
        if let Hir::Repetition(rep) = tail {
            if rep.min == 4 && rep.max == Some(4) && is_hex_class(&rep.sub) {
                return true;
            }
        }
    }
    false
}

// ── HexDigits ──────────────────────────────────────────────────────────────

pub(super) fn try_classify_hex(hir: &Hir) -> bool {
    if let Hir::Repetition(rep) = hir {
        if rep.min >= 1 || rep.max.is_none() {
            return is_hex_class(&rep.sub);
        }
    }
    false
}

fn is_hex_class(hir: &Hir) -> bool {
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = hir {
        if *negated {
            return false;
        }
        if ranges.len() == 3 {
            let has_digits = ranges.iter().any(|r| *r == ByteRange::new(b'0', b'9'));
            let has_upper = ranges.iter().any(|r| *r == ByteRange::new(b'A', b'F'));
            let has_lower = ranges.iter().any(|r| *r == ByteRange::new(b'a', b'f'));
            return has_digits && has_upper && has_lower;
        }
    }
    false
}

// ── Identifier ─────────────────────────────────────────────────────────────

pub(super) fn try_classify_identifier(hir: &Hir) -> Option<RegexClass> {
    // Top-level alternation: CSS dialects fold the optional-leading-dash
    // pattern with a `--` custom-property branch, e.g.
    // `-?[a-zA-Z_][\w-]*|--[\w-]+`. Detect that shape directly.
    let inner = unwrap_group(hir);
    if let Hir::Alternation(alts) = inner {
        if let Some(class) = try_classify_identifier_alt(alts) {
            return Some(class);
        }
    }

    // Single concat — `[-?]? [a-zA-Z_] [\w-]*` with optional leading
    // dash literal collapsed via the sign class. We treat a leading
    // optional `-` literal as `allows_leading_dash = true`.
    let (allows_leading_dash, body) = strip_optional_leading_dash(inner);
    if !is_identifier_body(body) {
        return None;
    }
    Some(RegexClass::Identifier {
        allows_leading_dash,
        allows_double_dash_prefix: false,
    })
}

/// Match the CSS identifier alternation shape:
/// `-?[a-zA-Z_][\w-]*|--[\w-]+`. The first branch accepts an
/// optional leading dash + identifier body; the second is the `--`
/// custom-property prefix followed by `[\w-]+`. Both branches must
/// be recognized for the alternation to classify as the wider
/// dialect.
fn try_classify_identifier_alt(alts: &[Hir]) -> Option<RegexClass> {
    if alts.len() != 2 {
        return None;
    }
    let (a, b) = (&alts[0], &alts[1]);
    let dash_ident = is_optional_dash_identifier(a) || is_optional_dash_identifier(b);
    let custom_prop = is_double_dash_word_run(a) || is_double_dash_word_run(b);
    if !(dash_ident && custom_prop) {
        return None;
    }
    Some(RegexClass::Identifier {
        allows_leading_dash: true,
        allows_double_dash_prefix: true,
    })
}

/// `-?[a-zA-Z_][\w-]*` — optional leading dash followed by an
/// identifier body.
fn is_optional_dash_identifier(hir: &Hir) -> bool {
    let inner = unwrap_group(hir);
    let (has_dash, body) = strip_optional_leading_dash(inner);
    if !has_dash {
        // Tolerate the bare body too — the alternation form sometimes
        // factors out the optional dash on only one branch.
        return is_identifier_body(inner);
    }
    is_identifier_body(body)
}

/// `--[\w-]+` — the CSS custom-property prefix.
fn is_double_dash_word_run(hir: &Hir) -> bool {
    let parts = match unwrap_group(hir) {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return false,
    };
    if parts.len() != 2 {
        return false;
    }
    let leading_double_dash = match &parts[0] {
        Hir::Literal(bytes) => bytes.as_slice() == b"--",
        _ => false,
    };
    if !leading_double_dash {
        return false;
    }
    if let Hir::Repetition(rep) = &parts[1] {
        if rep.min >= 1 {
            return is_word_class(unwrap_group(&rep.sub));
        }
    }
    false
}

/// Strip a leading `-?` (or `[\-]?`) sign-style optional from the
/// front of a Concat or single node. Returns `(true, remainder)` if
/// the leading optional dash was present, `(false, hir)` otherwise.
fn strip_optional_leading_dash(hir: &Hir) -> (bool, &Hir) {
    let parts = match hir {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return (false, hir),
    };
    if parts.is_empty() {
        return (false, hir);
    }
    if !is_optional_dash(&parts[0]) {
        return (false, hir);
    }
    if parts.len() == 2 {
        (true, &parts[1])
    } else {
        // Rebuilding a partial Concat is awkward and unnecessary —
        // the body classifier walks every part of the original Concat
        // when invoked on the original `hir`, so we return the full
        // Concat with the dash flag set and let the body classifier
        // skip the optional. To avoid borrowing surgery we mark the
        // identifier body classifier to accept both shapes.
        (true, hir)
    }
}

fn is_optional_dash(hir: &Hir) -> bool {
    if let Hir::Repetition(rep) = hir {
        if rep.min == 0 && rep.max == Some(1) {
            return is_dash_byte(&rep.sub);
        }
    }
    if let Hir::Group(sub) = hir {
        return is_optional_dash(sub);
    }
    false
}

fn is_dash_byte(hir: &Hir) -> bool {
    use crate::hir::CharClass;
    let inner = unwrap_group(hir);
    if let Hir::Literal(bytes) = inner {
        return bytes.as_slice() == b"-";
    }
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = inner {
        if *negated {
            return false;
        }
        return ranges.len() == 1
            && ranges[0] == crate::hir::ByteRange::new(b'-', b'-');
    }
    false
}

/// `[a-zA-Z_][\w-]*` (or its bare-letter `[a-zA-Z][\w]*`
/// counterpart) — an identifier body. When invoked on a wider
/// Concat carrying a leading optional-dash repetition, the head
/// scan tolerates the leading optional and resumes at the letter
/// class.
fn is_identifier_body(hir: &Hir) -> bool {
    let parts = match hir {
        Hir::Concat(parts) => parts.as_slice(),
        _ => {
            if let Hir::Repetition(rep) = hir {
                return is_letter_class(&rep.sub);
            }
            return false;
        }
    };

    if parts.is_empty() {
        return false;
    }

    // Skip a leading optional-dash if present (the wider Concat
    // shape invoked from `strip_optional_leading_dash` returns the
    // original Concat unchanged when the body contained more than
    // two parts).
    let mut idx = 0;
    if is_optional_dash(&parts[idx]) {
        idx += 1;
        if idx >= parts.len() {
            return false;
        }
    }

    let first = super::unwrap_repetition(&parts[idx]).unwrap_or(&parts[idx]);
    if !is_letter_class(first) {
        return false;
    }
    idx += 1;

    for part in &parts[idx..] {
        if !is_word_continuation(part) {
            return false;
        }
    }
    true
}

fn is_letter_class(hir: &Hir) -> bool {
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = hir {
        if *negated {
            return false;
        }
        let has_lower = ranges.iter().any(|r| r.start <= b'a' && r.end >= b'z');
        let has_upper = ranges.iter().any(|r| r.start <= b'A' && r.end >= b'Z');
        return has_lower || has_upper;
    }
    false
}

fn is_word_continuation(hir: &Hir) -> bool {
    if let Hir::Repetition(rep) = hir {
        return is_word_class(&rep.sub);
    }
    false
}

fn is_word_class(hir: &Hir) -> bool {
    if let Hir::Class(CharClass::Bytes { ranges, negated }) = hir {
        if *negated {
            return false;
        }
        let has_lower = ranges.iter().any(|r| r.start <= b'a' && r.end >= b'z');
        let has_digit = ranges.iter().any(|r| *r == ByteRange::new(b'0', b'9'));
        return has_lower && has_digit;
    }
    false
}

// ── CharClassQuantified ─────────────────────────────────────────────────────
//
// Tranche V structural classifier. Detects bare quantified char classes
// (`[a-z]+`, `\d*`, `[^"\\]+`) that fall through every narrower classifier.
// Captures the same data structure used by `RegexInfo.quantified_class` so
// the kernel registry can hash and dedup signatures.

pub(super) fn try_classify_charclass_quantified(hir: &Hir) -> Option<RegexClass> {
    let info = extract_class_range_info(hir)?;
    Some(RegexClass::CharClassQuantified(info))
}

fn extract_class_range_info(hir: &Hir) -> Option<ClassRangeInfo> {
    let inner = unwrap_group(hir);
    match inner {
        Hir::Repetition(Repetition { sub, min, max, .. }) => {
            let class = match unwrap_group(sub.as_ref()) {
                Hir::Class(class) => class,
                _ => return None,
            };
            Some(class_to_range_info(class, *min, *max))
        }
        // Bare class with implicit `{1,1}` (rare but valid).
        Hir::Class(class) => Some(class_to_range_info(class, 1, Some(1))),
        _ => None,
    }
}

fn class_to_range_info(class: &CharClass, min: u32, max: Option<u32>) -> ClassRangeInfo {
    let negated = class.negated();
    let ranges = class.to_positive_byte_ranges();
    let mut chars = CharSet128::new();
    for r in &ranges {
        let lo = r.start;
        let hi = r.end.min(127);
        if lo <= hi {
            chars.add_range(lo, hi);
        }
    }
    ClassRangeInfo {
        chars,
        negated,
        min,
        max,
    }
}

// ── PrefixThenClass ────────────────────────────────────────────────────────
//
// Tranche V structural classifier. Detects fixed-byte literal prefix
// followed by a quantified class tail: `--[\w-]+`, `@[a-z][\w-]*`,
// `#[a-f0-9]+`. The prefix length is bounded by the SmallVec inline
// capacity (8 bytes); longer prefixes fall to Unknown rather than
// proliferating into a Vec.

pub(super) fn try_classify_prefix_then_class(hir: &Hir) -> Option<RegexClass> {
    let inner = unwrap_group(hir);
    let parts = match inner {
        Hir::Concat(parts) => parts.as_slice(),
        _ => return None,
    };
    if parts.len() < 2 {
        return None;
    }

    // Walk the leading literals into one fused prefix.
    let mut prefix: SmallVec<[u8; 8]> = SmallVec::new();
    let mut idx = 0;
    while idx < parts.len() {
        let p = unwrap_group(&parts[idx]);
        match p {
            Hir::Literal(bytes) => {
                if prefix.len() + bytes.len() > 8 {
                    return None;
                }
                prefix.extend_from_slice(bytes);
                idx += 1;
            }
            _ => break,
        }
    }
    if prefix.is_empty() || idx == parts.len() {
        return None;
    }

    // The remaining parts must be exactly one quantified-class tail. The
    // tail can be a single Repetition, or a sequence of (single-class +
    // quantified-class) which we collapse into the larger of the two.
    let tail_hir = if idx == parts.len() - 1 {
        &parts[idx]
    } else {
        return None;
    };

    let tail = extract_class_range_info(tail_hir)?;
    Some(RegexClass::PrefixThenClass { prefix, tail })
}
