// Generalized monolithic scanners — language-agnostic, no regex, no vtable.
//
// These are the canonical implementations. Higher-level constructs
// (span_parser, kernels, generated parsers) call them directly.

mod number;
mod number_f64;
mod ident;
mod ws_comment;
mod quoted;
mod balanced;
mod digits;
pub mod quoted_simd;

pub use number::{
    GENERIC_NUMBER_CONFIG, STRICT_NUMBER_CONFIG, NumberConfig, NumberParts,
    parse_eight_digits, scan_number_mantissa,
};
pub use number_f64::{
    number_parts_to_f64, parse_number_f64, scan_number_f64, scan_number_span,
    scan_number_strict_span, scan_number_strict_fused, scan_number_strict_f64,
};
pub use ident::{scan_ident, IdentConfig, DEFAULT_IDENT_CONFIG, CSS_IDENT_CONFIG};
pub use ws_comment::{scan_block_comment, scan_ws_block_comments};
pub use quoted::{
    scan_string_quoted,
    scan_quoted_string_content, scan_quoted_string_strict, validate_strict_escapes,
    QuotedStringConfig, STRICT_QUOTED_STRING_CONFIG, GENERIC_QUOTED_STRING_CONFIG,
};
pub use balanced::{BalancedScanConfig, scan_balanced};
pub use digits::{scan_alnum_mut, scan_digits_mut, scan_digits_star_mut, scan_hex_mut};
