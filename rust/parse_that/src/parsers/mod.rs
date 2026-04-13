pub mod json;
pub use json::{
    quoted_string_scan_full, number_fused_scan_convert, number_span_scan_strict,
    number_span_scan_ex, number_span_scan_strict_parser, number_scan_f64_strict,
};

pub mod css;

pub mod scan;

pub mod csv;
pub mod eisel_lemire;
pub mod utils;

// ── Generalized scanner re-exports ──────────────────────────────────────────
// Behavior-named, language-agnostic. Codegen emits these names.

pub use scan::{
    scan_ident, scan_string_quoted, scan_ws_block_comments, scan_block_comment,
    scan_balanced_end, scan_balanced, BalancedScanConfig,
    // Char-class quantified scanners (Tranche W phase 5d).
    scan_alnum_mut, scan_digits_mut, scan_digits_star_mut, scan_hex_mut,
    // Number scanning core
    scan_number_span, scan_number_f64, parse_number_f64, parse_eight_digits,
    NumberParts, NumberConfig, scan_number_mantissa, number_parts_to_f64,
    GENERIC_NUMBER_CONFIG, JSON_NUMBER_CONFIG,
};

// Structural bitmap pre-scanner (Tranche AM.5).
pub use scan::structural::{scan_structural, StructuralIter};

// Quote-parity filtering for structural indices (Tranche AO).
pub use scan::quote_parity::filter_quote_parity;
