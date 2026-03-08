// CSS declaration and keyframe block parsing.

use super::scan::*;
use super::types::*;
use super::value::*;
use crate::parse::*;
use crate::span_parser::*;
use crate::state::ParserState;
use smallvec::SmallVec;

pub(super) fn css_declaration<'a>() -> Parser<'a, CssDeclaration<'a>> {
    let semi = sp_string(";");

    Parser::new(move |state: &mut ParserState<'a>| {
        css_ws_comment_fast(state);
        let property = css_ident_fast(state)?;
        css_ws_comment_fast(state);
        if state.src_bytes.get(state.offset) != Some(&b':') {
            return None;
        }
        state.offset += 1;
        css_ws_comment_fast(state);

        // Parse values until ; or }
        let mut values: ValueVec<'_> = SmallVec::new();
        let mut important = false;
        loop {
            css_ws_comment_fast(state);
            let next = state.src_bytes.get(state.offset).copied();
            if matches!(next, Some(b';') | Some(b'}') | None) {
                break;
            }
            if let Some(v) = parse_value_inline(state) {
                values.push(v);
            } else {
                break;
            }
        }

        // Check for !important pattern: last value is "important"
        if !values.is_empty() {
            if let Some(CssValue::Ident(s)) = values.last() {
                if s.as_str() == "important" {
                    important = true;
                }
            }
        }

        // Consume optional ;
        semi.call(state);

        Some(CssDeclaration {
            property,
            values,
            important,
        })
    })
}

pub(super) fn css_declaration_block<'a>() -> Parser<'a, DeclVec<'a>> {
    let decl = css_declaration();
    let ws = css_ws();
    let open_brace = sp_string("{");
    let close_brace = sp_string("}");
    let skip = sp_take_until_any(b";}");
    let semi = sp_string(";");

    Parser::new(move |state: &mut ParserState<'a>| {
        open_brace.call(state)?;

        let mut declarations: DeclVec<'_> = Vec::new();
        loop {
            ws.call(state);
            if close_brace.call(state).is_some() {
                break;
            }
            if state.is_at_end() {
                return None;
            }
            if let Some(d) = decl.call(state) {
                declarations.push(d);
            } else {
                // Skip to next ; or } to recover
                skip.call(state);
                semi.call(state);
            }
        }

        Some(declarations)
    })
}

// ── Keyframes ───────────────────────────────────────────────

pub(super) fn css_keyframe_stop<'a>() -> Parser<'a, KeyframeStop> {
    let from = sp_string("from").map(|_| KeyframeStop::From);
    let to = sp_string("to").map(|_| KeyframeStop::To);
    let pct = Parser::new(move |state: &mut ParserState<'a>| {
        let span = css_number_span().call(state)?;
        sp_string("%").call(state)?;
        let num: f64 = fast_float2::parse(span.as_str()).unwrap_or(0.0);
        Some(KeyframeStop::Percentage(num))
    });
    from.or(to).or(pct)
}

pub(super) fn css_keyframe_block<'a>() -> Parser<'a, KeyframeBlock<'a>> {
    let stop = css_keyframe_stop();
    let comma_ws = css_ws();
    let comma_sp = sp_string(",");
    let comma = Parser::new(move |state: &mut ParserState<'a>| {
        comma_ws.call(state);
        let v = comma_sp.call(state)?;
        comma_ws.call(state);
        Some(v)
    });
    let stops_parser = stop.sep_by_small::<_, [KeyframeStop; 4]>(comma, 1..);
    let decl_block = css_declaration_block();
    let ws = css_ws();

    Parser::new(move |state: &mut ParserState<'a>| {
        ws.call(state);
        let stops = stops_parser.call(state)?;
        ws.call(state);
        let declarations = decl_block.call(state)?;

        Some(KeyframeBlock {
            stops,
            declarations,
        })
    })
}
