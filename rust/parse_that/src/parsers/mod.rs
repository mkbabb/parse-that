pub mod json;
pub use json::{
    json_string_fast_quoted, number_scan_convert, number_span_fast, number_span_fast_ex,
    number_span_fast_parser, scan_number_f64_json,
};

pub mod css;
pub use css::{css_block_comment_fast, css_ident_fast, css_scan_value_end, css_string_fast, css_ws_comment_fast};

pub mod scan;

pub mod csv;
pub mod eisel_lemire;
pub mod utils;

// ── Generalized scanner re-exports ──────────────────────────────────────────
// Behavior-named, language-agnostic. Codegen emits these names.

pub use scan::{
    scan_ident, scan_string_quoted, scan_ws_block_comments, scan_block_comment,
    scan_balanced_end, scan_balanced, BalancedScanConfig,
    // Number scanning core
    scan_number_span, scan_number_f64, parse_number_f64, parse_eight_digits,
    NumberParts, NumberConfig, scan_number_mantissa, number_parts_to_f64,
    GENERIC_NUMBER_CONFIG, JSON_NUMBER_CONFIG,
};

// Backward-compat aliases: codegen and existing callers may use these names.
pub use scan::scan_number_span as css_number_span_fast;
pub use scan::scan_number_f64 as css_number_scan_f64;
pub use json::json_string_fast_quoted as scan_json_string;
pub use json::number_span_fast as scan_number_span_json;
pub use json::number_scan_convert as scan_number_convert_json;
