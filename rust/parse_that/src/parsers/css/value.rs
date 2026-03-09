// CSS value parsing — inline dispatch for zero-vtable hot path.

use super::scan::*;
use super::types::*;
use crate::span_parser::*;
use crate::state::{ParserState, Span};

/// Inline value parsing — no vtable dispatch, pure byte-level scanning.
#[inline]
pub(super) fn parse_value_inline<'a>(state: &mut ParserState<'a>) -> Option<CssValue<'a>> {
    let next = *state.src_bytes.get(state.offset)?;
    match next {
        b'#' => {
            // Hex color — inline byte scan: skip '#', scan hex digits, validate length
            let start = state.offset;
            let bytes = state.src_bytes;
            let mut i = start + 1; // skip '#'
            while i < bytes.len() {
                match unsafe { *bytes.get_unchecked(i) } {
                    b'0'..=b'9' | b'a'..=b'f' | b'A'..=b'F' => i += 1,
                    _ => break,
                }
            }
            let hex_len = i - start - 1;
            if matches!(hex_len, 3 | 4 | 6 | 8) {
                state.offset = i;
                Some(CssValue::Color(CssColor::Hex(Span::new(start, i, state.src))))
            } else {
                None
            }
        }
        b'"' | b'\'' => {
            css_string_fast(state).map(CssValue::String)
        }
        b',' => {
            state.offset += 1;
            Some(CssValue::Comma)
        }
        b'/' => {
            state.offset += 1;
            Some(CssValue::Slash)
        }
        b'0'..=b'9' | b'.' => {
            parse_number_value_inline(state)
        }
        b'-' => {
            // Could be: negative number (-5, -.5, -1px), CSS ident (-webkit-xxx, --custom),
            // or standalone operator (in calc)
            let cp = state.offset;
            // Try number first
            if let Some(v) = parse_number_value_inline(state) {
                Some(v)
            } else {
                state.offset = cp;
                // Try ident (handles --custom-prop and -webkit-xxx)
                if let Some(v) = parse_ident_or_function_inline(state) {
                    Some(v)
                } else {
                    state.offset = cp;
                    // Standalone operator
                    let span = Span::new(cp, cp + 1, state.src);
                    state.offset = cp + 1;
                    Some(CssValue::Operator(span))
                }
            }
        }
        b'+' => {
            let cp = state.offset;
            if let Some(v) = parse_number_value_inline(state) {
                Some(v)
            } else {
                state.offset = cp;
                let span = Span::new(cp, cp + 1, state.src);
                state.offset = cp + 1;
                Some(CssValue::Operator(span))
            }
        }
        b'!' => {
            // !important — the '!' is consumed, 'important' is next ident
            let cp = state.offset;
            state.offset += 1;
            css_ws_comment_fast(state);
            if let Some(s) = css_ident_fast(state) {
                if s.as_str() == "important" {
                    // We'll mark important in the declaration, skip this value
                    return Some(CssValue::Ident(s)); // Let caller detect
                }
            }
            state.offset = cp;
            None
        }
        b'a'..=b'z' | b'A'..=b'Z' | b'_' => {
            parse_ident_or_function_inline(state)
        }
        _ => None,
    }
}

#[inline]
pub(super) fn parse_number_value_inline<'a>(state: &mut ParserState<'a>) -> Option<CssValue<'a>> {
    let span = sp_json_number().call(state)?;
    let num: f64 = fast_float2::parse(span.as_str()).unwrap_or(0.0);

    // Try %
    if state.src_bytes.get(state.offset) == Some(&b'%') {
        state.offset += 1;
        return Some(CssValue::Percentage(num));
    }
    // Try unit
    if let Some(u) = css_ident_fast(state) {
        return Some(CssValue::Dimension(num, u));
    }
    Some(CssValue::Number(num))
}

#[inline]
pub(super) fn parse_ident_or_function_inline<'a>(state: &mut ParserState<'a>) -> Option<CssValue<'a>> {
    let name = css_ident_fast(state)?;

    // Check for function call
    if state.src_bytes.get(state.offset) == Some(&b'(') {
        state.offset += 1;
        css_ws_comment_fast(state);

        let mut args: FuncArgVec<'_> = Vec::with_capacity(4);
        loop {
            css_ws_comment_fast(state);
            if state.src_bytes.get(state.offset) == Some(&b')') {
                state.offset += 1;
                break;
            }
            if state.is_at_end() {
                return None;
            }
            // Parse argument value inline
            if let Some(v) = parse_value_inline(state) {
                args.push(v);
            } else {
                // Skip unknown byte to avoid infinite loop
                state.offset += 1;
            }
        }

        // Color function detection
        let name_str = name.as_str();
        if matches!(
            name_str,
            "rgb" | "rgba" | "hsl" | "hsla" | "hwb" | "lab" | "lch"
                | "oklab" | "oklch" | "color" | "color-mix"
        ) {
            return Some(CssValue::Color(CssColor::Function { name, args }));
        }
        return Some(CssValue::Function { name, args });
    }

    Some(CssValue::Ident(name))
}
