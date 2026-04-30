// Generalized monolithic scanners — language-agnostic, no regex, no vtable.
//
// These are the canonical implementations. Higher-level constructs
// (span_parser, kernels, generated parsers) call them directly.

mod balanced;
mod decode;
mod digits;
mod ident;
mod number;
mod number_f64;
pub mod number_simd;
pub mod quote_parity;
mod quoted;
pub mod quoted_simd;
pub mod structural_bitmap;
mod ws_comment;

pub use balanced::{BalancedScanConfig, scan_balanced};
pub use decode::{StringPayload, decode_json_string_to_arena};
pub use digits::{
    parse_f64_from_bytes, parse_i64_from_bytes, scan_alnum_mut, scan_digits_mut,
    scan_digits_parse_i64_mut, scan_digits_star_mut, scan_hex_mut, scan_hex_parse_i64_mut,
};
pub use ident::{
    CSS_IDENT_CONFIG, CSS_IDENT_ESCAPE_CONFIG, DEFAULT_IDENT_CONFIG, IdentConfig, scan_ident,
};
pub use number::{
    GENERIC_NUMBER_CONFIG, NumberConfig, NumberParts, STRICT_NUMBER_CONFIG, parse_eight_digits,
    scan_number_mantissa,
};
pub use number_f64::{
    number_parts_to_f64, parse_number_f64, scan_number_f64, scan_number_span,
    scan_number_strict_f64, scan_number_strict_fused, scan_number_strict_span,
};
pub use quote_parity::{compute_in_string_bitmap, filter_quote_parity};
pub use quoted::{
    GENERIC_QUOTED_STRING_CONFIG, QuotedStringConfig, STRICT_QUOTED_STRING_CONFIG,
    scan_quoted_string_content, scan_quoted_string_strict, scan_string_quoted,
    validate_strict_escapes,
};
pub use structural_bitmap::{
    NibbleBitmapIter, classify_stripe, expand_byte_lut, find_next_structural_from,
};
pub use ws_comment::{scan_block_comment, scan_ws_block_comments};
