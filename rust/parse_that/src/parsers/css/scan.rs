// CSS scanner re-exports — thin wrappers over generalized scanners in parsers/scan.rs.
// Domain-prefixed names kept for backward compatibility.

use crate::span_parser::*;
use crate::state::{ParserState, Span};

// ── Re-exports from parsers::scan ──────────────────────────────

#[inline(always)]
pub fn css_ident_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    super::super::scan::scan_ident(state)
}

#[inline(always)]
pub fn css_ws_comment_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    super::super::scan::scan_ws_block_comments(state)
}

#[inline(always)]
pub fn css_string_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    super::super::scan::scan_string_quoted(state)
}

#[inline(always)]
pub fn css_block_comment_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    super::super::scan::scan_block_comment(state)
}

pub fn css_scan_value_end(bytes: &[u8]) -> usize {
    super::super::scan::scan_balanced_end(bytes)
}

// ── Leaf token parsers (SpanParser wrappers) ────────────────

pub(super) fn css_ident<'a>() -> SpanParser<'a> {
    sp_css_ident()
}

pub(super) fn css_string<'a>() -> SpanParser<'a> {
    sp_css_string()
}

pub(super) fn css_comment<'a>() -> SpanParser<'a> {
    sp_css_block_comment()
}

pub(super) fn css_ws<'a>() -> SpanParser<'a> {
    sp_css_ws_comment()
}

// Number + dimension parsing — css_number_span removed (unused; callers use
// css_number_scan_f64 or scan_number_span directly).
