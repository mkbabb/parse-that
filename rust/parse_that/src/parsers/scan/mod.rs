// Generalized monolithic scanners — language-agnostic, no regex, no vtable.
//
// These are the canonical implementations. Language-specific modules
// (css/scan.rs, json.rs) re-export under domain-prefixed names.

mod number;
mod number_f64;
mod ident;
mod ws_comment;
mod quoted;
mod balanced;
mod digits;
pub mod quoted_simd;

pub use number::{
    GENERIC_NUMBER_CONFIG, JSON_NUMBER_CONFIG, NumberConfig, NumberParts,
    parse_eight_digits, scan_number_mantissa,
};
pub use number_f64::{number_parts_to_f64, parse_number_f64, scan_number_f64, scan_number_span};
pub use ident::scan_ident;
pub use ws_comment::{scan_block_comment, scan_ws_block_comments};
pub use quoted::scan_string_quoted;
pub use balanced::{BalancedScanConfig, scan_balanced, scan_balanced_end};
pub use digits::{scan_alnum_mut, scan_digits_mut, scan_digits_star_mut, scan_hex_mut};
