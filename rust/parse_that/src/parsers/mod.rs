pub mod json;
pub use json::{json_string_fast_quoted, number_span_fast, number_span_fast_ex, number_span_fast_parser, number_scan_convert, parse_number_f64, css_number_span_fast, css_number_scan_f64};

pub mod css;
pub use css::{css_block_comment_fast, css_ident_fast, css_scan_value_end, css_string_fast, css_ws_comment_fast};

pub mod csv;
pub mod eisel_lemire;
pub mod utils;

// ── Generalized scanner aliases ─────────────────────────────────────────────
// Behavior-named, language-agnostic re-exports of the underlying scanners.
// Codegen emits these names; the old CSS/JSON-prefixed names remain for compat.

pub use css::css_ident_fast as scan_ident;
pub use css::css_string_fast as scan_string_quoted;
pub use css::css_ws_comment_fast as scan_ws_block_comments;
pub use css::css_block_comment_fast as scan_block_comment;
pub use css::css_scan_value_end as scan_balanced_end;
pub use json::css_number_span_fast as scan_number_span;
pub use json::css_number_scan_f64 as scan_number_f64;
pub use json::json_string_fast_quoted as scan_json_string;
pub use json::number_span_fast as scan_number_span_json;
pub use json::number_scan_convert as scan_number_convert_json;
