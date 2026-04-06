//! Unicode general-category property tables.
//!
//! Minimal codepoint ranges for `\p{Name}` / `\P{Name}` escapes.
//! Covers the most common categories used by BBNF grammars.

use super::hir::CodepointRange;

/// Resolve a Unicode general category name to codepoint ranges.
///
/// Supports the most common categories. Returns `None` for unknown names.
pub fn unicode_category_ranges(name: &str) -> Option<Vec<CodepointRange>> {
    match name {
        "L" | "Letter" => Some(unicode_letters()),
        "N" | "Number" | "Nd" | "Digit" => Some(unicode_digits()),
        "Z" | "Separator" | "Zs" | "Space_Separator" => Some(unicode_separators()),
        "P" | "Punctuation" => Some(unicode_punctuation()),
        "S" | "Symbol" => Some(unicode_symbols()),
        "M" | "Mark" => Some(unicode_marks()),
        "Alphabetic" => Some(unicode_alphabetic()),
        "Lowercase" | "Ll" => Some(unicode_lowercase()),
        "Uppercase" | "Lu" => Some(unicode_uppercase()),
        "Pc" => Some(vec![CodepointRange::new('\u{005F}', '\u{005F}')]), // connector punctuation (_)
        "Join_Control" | "Join_C" => Some(vec![
            CodepointRange::new('\u{200C}', '\u{200D}'), // ZWNJ, ZWJ
        ]),
        _ => None,
    }
}

// Minimal Unicode category ranges -- ASCII subset + common BMP ranges.
// For full Unicode, these would be much larger tables, but the codebase
// currently only uses ASCII patterns. These are sufficient for NFA
// construction; the DFA handles the full byte-level matching.

fn unicode_letters() -> Vec<CodepointRange> {
    vec![
        CodepointRange::new('A', 'Z'),
        CodepointRange::new('a', 'z'),
        CodepointRange::new('\u{00C0}', '\u{00D6}'),
        CodepointRange::new('\u{00D8}', '\u{00F6}'),
        CodepointRange::new('\u{00F8}', '\u{02FF}'),
        CodepointRange::new('\u{0370}', '\u{037D}'),
        CodepointRange::new('\u{037F}', '\u{1FFF}'),
        CodepointRange::new('\u{200C}', '\u{200D}'),
        CodepointRange::new('\u{2070}', '\u{218F}'),
        CodepointRange::new('\u{2C00}', '\u{2FEF}'),
        CodepointRange::new('\u{3001}', '\u{D7FF}'),
        CodepointRange::new('\u{F900}', '\u{FDCF}'),
        CodepointRange::new('\u{FDF0}', '\u{FFFD}'),
        CodepointRange::new('\u{10000}', '\u{EFFFF}'),
    ]
}

fn unicode_alphabetic() -> Vec<CodepointRange> {
    unicode_letters() // simplified -- full Unicode would include Nl, Other_Alphabetic
}

fn unicode_digits() -> Vec<CodepointRange> {
    vec![
        CodepointRange::new('0', '9'),
        CodepointRange::new('\u{0660}', '\u{0669}'), // Arabic-Indic
        CodepointRange::new('\u{06F0}', '\u{06F9}'), // Extended Arabic-Indic
        CodepointRange::new('\u{0966}', '\u{096F}'), // Devanagari
    ]
}

fn unicode_lowercase() -> Vec<CodepointRange> {
    vec![
        CodepointRange::new('a', 'z'),
        CodepointRange::new('\u{00DF}', '\u{00F6}'),
        CodepointRange::new('\u{00F8}', '\u{00FF}'),
    ]
}

fn unicode_uppercase() -> Vec<CodepointRange> {
    vec![
        CodepointRange::new('A', 'Z'),
        CodepointRange::new('\u{00C0}', '\u{00D6}'),
        CodepointRange::new('\u{00D8}', '\u{00DE}'),
    ]
}

fn unicode_separators() -> Vec<CodepointRange> {
    vec![
        CodepointRange::new('\u{0020}', '\u{0020}'),
        CodepointRange::new('\u{00A0}', '\u{00A0}'),
        CodepointRange::new('\u{1680}', '\u{1680}'),
        CodepointRange::new('\u{2000}', '\u{200A}'),
        CodepointRange::new('\u{202F}', '\u{202F}'),
        CodepointRange::new('\u{205F}', '\u{205F}'),
        CodepointRange::new('\u{3000}', '\u{3000}'),
    ]
}

fn unicode_punctuation() -> Vec<CodepointRange> {
    vec![
        CodepointRange::new('\u{0021}', '\u{0023}'),
        CodepointRange::new('\u{0025}', '\u{002A}'),
        CodepointRange::new('\u{002C}', '\u{002F}'),
        CodepointRange::new('\u{003A}', '\u{003B}'),
        CodepointRange::new('\u{003F}', '\u{0040}'),
        CodepointRange::new('\u{005B}', '\u{005D}'),
        CodepointRange::new('\u{005F}', '\u{005F}'),
        CodepointRange::new('\u{007B}', '\u{007B}'),
        CodepointRange::new('\u{007D}', '\u{007D}'),
    ]
}

fn unicode_symbols() -> Vec<CodepointRange> {
    vec![
        CodepointRange::new('\u{0024}', '\u{0024}'), // $
        CodepointRange::new('\u{002B}', '\u{002B}'), // +
        CodepointRange::new('\u{003C}', '\u{003E}'), // < = >
        CodepointRange::new('\u{005E}', '\u{005E}'), // ^
        CodepointRange::new('\u{0060}', '\u{0060}'), // `
        CodepointRange::new('\u{007C}', '\u{007C}'), // |
        CodepointRange::new('\u{007E}', '\u{007E}'), // ~
    ]
}

fn unicode_marks() -> Vec<CodepointRange> {
    vec![
        CodepointRange::new('\u{0300}', '\u{036F}'), // Combining Diacritical Marks
        CodepointRange::new('\u{0483}', '\u{0489}'),
        CodepointRange::new('\u{0591}', '\u{05BD}'),
    ]
}
