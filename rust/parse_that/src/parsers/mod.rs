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
    BalancedScanConfig,
    CSS_IDENT_CONFIG,
    CSS_IDENT_ESCAPE_CONFIG,
    DEFAULT_IDENT_CONFIG,
    GENERIC_NUMBER_CONFIG,
    GENERIC_QUOTED_STRING_CONFIG,
    IdentConfig,
    NibbleBitmapIter,
    NumberConfig,
    NumberParts,
    QuotedStringConfig,
    STRICT_NUMBER_CONFIG,
    STRICT_QUOTED_STRING_CONFIG,
    classify_stripe,
    // Tranche AU.2.7 — SIMD structural bitmap v2 + quote-parity filter.
    compute_in_string_bitmap,
    expand_byte_lut,
    filter_quote_parity,
    find_next_structural_from,
    number_parts_to_f64,
    parse_eight_digits,
    parse_f64_from_bytes,
    parse_i64_from_bytes,
    parse_number_f64,
    // Char-class quantified scanners (Tranche W phase 5d).
    scan_alnum_mut,
    scan_balanced,
    scan_block_comment,
    scan_digits_mut,
    // AV.0.3 Bug 2b: parse-and-return-scalar variants + span→scalar helpers.
    scan_digits_parse_i64_mut,
    scan_digits_star_mut,
    scan_hex_mut,
    scan_hex_parse_i64_mut,
    scan_ident,
    scan_number_f64,
    scan_number_mantissa,
    // Number scanning core
    scan_number_span,
    scan_number_strict_f64,
    scan_number_strict_fused,
    // Strict number scanners
    scan_number_strict_span,
    scan_quoted_string_content,
    scan_quoted_string_strict,
    scan_string_quoted,
    scan_ws_block_comments,
    validate_strict_escapes,
};
