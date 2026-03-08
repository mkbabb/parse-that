// CSS L1.5 parser — at-rules, qualified rules, stylesheet entry point.

mod declaration;
mod media;
mod scan;
mod selector;
mod types;
mod value;

// Re-export all public AST types
pub use media::specificity;
pub use types::*;

// Re-export scanner functions for span_parser.rs
pub(crate) use scan::{css_block_comment_fast, css_ident_fast, css_string_fast, css_ws_comment_fast};

use declaration::*;
use media::*;
use scan::*;
use selector::*;
use value::*;

use crate::lazy::lazy;
use crate::parse::*;
use crate::span_parser::*;
use crate::state::{ParserState, Span};
use smallvec::SmallVec;

// ── At-rules ────────────────────────────────────────────────

fn css_at_rule<'a>() -> Parser<'a, CssNode<'a>> {
    lazy(|| {
        let rule = css_rule();
        let decl_block = css_declaration_block();
        let kf_block = css_keyframe_block();
        let ws = css_ws();
        let ident = css_ident();
        let at_sign = sp_string("@");
        let open_brace = sp_string("{");
        let close_brace = sp_string("}");
        let semi = sp_string(";");
        let skip_to_semi_brace = sp_take_until_any(b";}");
        let skip_to_close = sp_take_until_any(b"}");
        let kf_name_parser = css_ident().or(css_string());

        Parser::new(move |state: &mut ParserState<'a>| {
            at_sign.call(state)?;
            let name = ident.call(state)?;
            ws.call(state);

            match name.as_str() {
                "media" => {
                    let queries = parse_media_query_list(state);
                    ws.call(state);
                    open_brace.call(state)?;

                    let mut body = Vec::new();
                    loop {
                        ws.call(state);
                        if close_brace.call(state).is_some() {
                            break;
                        }
                        if state.is_at_end() {
                            return None;
                        }
                        if let Some(node) = rule.call(state) {
                            body.push(node);
                        } else {
                            skip_to_semi_brace.call(state);
                            semi.call(state);
                        }
                    }

                    Some(CssNode::AtMedia {
                        queries,
                        body,
                    })
                }
                "supports" => {
                    let condition = parse_supports_condition(state);
                    ws.call(state);
                    open_brace.call(state)?;

                    let mut body = Vec::new();
                    loop {
                        ws.call(state);
                        if close_brace.call(state).is_some() {
                            break;
                        }
                        if state.is_at_end() {
                            return None;
                        }
                        if let Some(node) = rule.call(state) {
                            body.push(node);
                        } else {
                            skip_to_semi_brace.call(state);
                            semi.call(state);
                        }
                    }

                    let condition = condition.unwrap_or(SupportsCondition::Declaration {
                        property: Span::new(state.offset, state.offset, state.src),
                        value: Vec::new(),
                    });

                    Some(CssNode::AtSupports {
                        condition,
                        body,
                    })
                }
                "font-face" => {
                    ws.call(state);
                    let declarations = decl_block.call(state)?;
                    Some(CssNode::AtFontFace { declarations })
                }
                "import" => {
                    ws.call(state);
                    let mut values: SmallVec<[CssValue<'a>; 4]> = SmallVec::new();
                    loop {
                        ws.call(state);
                        if semi.call(state).is_some() || state.is_at_end() {
                            break;
                        }
                        if let Some(v) = parse_value_inline(state) {
                            values.push(v);
                        } else {
                            break;
                        }
                    }
                    Some(CssNode::AtImport { values })
                }
                "keyframes" | "-webkit-keyframes" | "-moz-keyframes" => {
                    ws.call(state);
                    let kf_name = kf_name_parser.call(state)?;
                    ws.call(state);
                    open_brace.call(state)?;

                    let mut blocks: SmallVec<[KeyframeBlock<'_>; 8]> = SmallVec::new();
                    loop {
                        ws.call(state);
                        if close_brace.call(state).is_some() {
                            break;
                        }
                        if state.is_at_end() {
                            return None;
                        }
                        if let Some(block) = kf_block.call(state) {
                            blocks.push(block);
                        } else {
                            skip_to_close.call(state);
                        }
                    }

                    Some(CssNode::AtKeyframes {
                        name: kf_name,
                        blocks,
                    })
                }
                _ => {
                    let skip = sp_take_until_any(b"{;");
                    let prelude_span = skip.call(state).unwrap_or(Span::new(
                        state.offset,
                        state.offset,
                        state.src,
                    ));

                    let has_block = if open_brace.call(state).is_some() {
                        true
                    } else {
                        semi.call(state);
                        false
                    };

                    let body = if has_block {
                        let mut rules = Vec::new();
                        loop {
                            ws.call(state);
                            if close_brace.call(state).is_some() {
                                break;
                            }
                            if state.is_at_end() {
                                break;
                            }
                            if let Some(node) = rule.call(state) {
                                rules.push(node);
                            } else {
                                skip_to_semi_brace.call(state);
                                semi.call(state);
                            }
                        }
                        Some(rules)
                    } else {
                        None
                    };

                    Some(CssNode::GenericAtRule {
                        name,
                        prelude: prelude_span,
                        body,
                    })
                }
            }
        })
    })
}

// ── Qualified rule (selector + declarations) ────────────────

fn css_qualified_rule<'a>() -> Parser<'a, CssNode<'a>> {
    let sel_list = css_selector_list();
    let decl_block = css_declaration_block();
    let ws = css_ws();

    Parser::new(move |state: &mut ParserState<'a>| {
        let selector_list = sel_list.call(state)?;
        ws.call(state);
        let declarations = decl_block.call(state)?;

        Some(CssNode::QualifiedRule {
            selector_list,
            declarations,
        })
    })
}

// ── Top-level rule ──────────────────────────────────────────

fn css_rule<'a>() -> Parser<'a, CssNode<'a>> {
    lazy(|| {
        let at_rule = css_at_rule();
        let qualified_rule = css_qualified_rule();
        let comment = css_comment();

        Parser::new(move |state: &mut ParserState<'a>| {
            // Skip plain whitespace (not comments — those become AST nodes)
            while let Some(&b) = state.src_bytes.get(state.offset) {
                if b == b' ' || b == b'\t' || b == b'\n' || b == b'\r' || b == 0x0C {
                    state.offset += 1;
                } else {
                    break;
                }
            }

            // Byte dispatch instead of .or() chain
            match state.src_bytes.get(state.offset)? {
                b'/' => {
                    // Might be a comment
                    if state.src_bytes.get(state.offset + 1) == Some(&b'*') {
                        comment.call(state).map(CssNode::Comment)
                    } else {
                        qualified_rule.call(state)
                    }
                }
                b'@' => at_rule.call(state),
                _ => qualified_rule.call(state),
            }
        })
    })
}

// ── Stylesheet (entry point) ────────────────────────────────

pub fn css_stylesheet<'a>() -> Parser<'a, NodeVec<'a>> {
    let rule = css_rule();
    let ws_only = sp_take_while_byte(|b| b == b' ' || b == b'\t' || b == b'\n' || b == b'\r' || b == 0x0C)
        .opt_span();
    let skip = sp_take_until_any(b";}");
    let semi = sp_string(";");
    let close_brace = sp_string("}");

    Parser::new(move |state: &mut ParserState<'a>| {
        let mut nodes = Vec::new();

        loop {
            ws_only.call(state);
            if state.is_at_end() {
                break;
            }
            if let Some(node) = rule.call(state) {
                nodes.push(node);
            } else {
                // Skip to next rule to recover
                if state.is_at_end() {
                    break;
                }
                skip.call(state);
                if semi.call(state).is_none() && close_brace.call(state).is_none() {
                    // Truly stuck — advance one byte
                    if !state.is_at_end() {
                        state.offset += 1;
                    } else {
                        break;
                    }
                }
            }
        }

        Some(nodes)
    })
}

pub fn css_parser<'a>() -> Parser<'a, NodeVec<'a>> {
    css_stylesheet()
}
