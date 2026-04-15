pub mod json;

pub mod css;

pub mod scan;

pub mod csv;
pub mod eisel_lemire;
pub mod utils;
pub use utils::number_span;

// ── Generalized scanner re-exports ──────────────────────────────────────────
// Behavior-named, language-agnostic. Codegen emits these names.

pub use scan::{
    scan_ident, IdentConfig, DEFAULT_IDENT_CONFIG, CSS_IDENT_CONFIG, CSS_IDENT_ESCAPE_CONFIG,
    scan_string_quoted, scan_quoted_string_content, scan_quoted_string_strict,
    validate_strict_escapes,
    QuotedStringConfig, STRICT_QUOTED_STRING_CONFIG, GENERIC_QUOTED_STRING_CONFIG,
    scan_ws_block_comments, scan_block_comment,
    scan_balanced, BalancedScanConfig,
    // Char-class quantified scanners (Tranche W phase 5d).
    scan_alnum_mut, scan_digits_mut, scan_digits_star_mut, scan_hex_mut,
    // AV.0.3 Bug 2b: parse-and-return-scalar variants.
    scan_digits_parse_i64_mut, scan_hex_parse_i64_mut,
    // Number scanning core
    scan_number_span, scan_number_f64, parse_number_f64, parse_eight_digits,
    NumberParts, NumberConfig, scan_number_mantissa, number_parts_to_f64,
    GENERIC_NUMBER_CONFIG, STRICT_NUMBER_CONFIG,
    // Strict number scanners
    scan_number_strict_span, scan_number_strict_fused, scan_number_strict_f64,
    // Tranche AU.2.7 — SIMD structural bitmap v2 + quote-parity filter.
    compute_in_string_bitmap, filter_quote_parity,
    NibbleBitmapIter, classify_stripe, expand_byte_lut, find_next_structural_from,
};
