// CSS selector parsing — compound, complex, attribute, and pseudo selectors.

use super::scan::*;
use super::types::*;
use crate::lazy::lazy;
use crate::parse::*;
use crate::span_parser::*;
use crate::state::{ParserState, Span};

pub(super) fn css_selector_list<'a>() -> Parser<'a, SelectorVec<'a>> {
    let sel = css_complex_selector();
    let ws = css_ws();
    let comma_sp = sp_string(",");
    let comma = Parser::new(move |state: &mut ParserState<'a>| {
        ws.call(state);
        let v = comma_sp.call(state)?;
        ws.call(state);
        Some(v)
    });
    sel.sep_by_small::<_, [CssSelector<'a>; 2]>(comma, 1..)
}

pub(super) fn css_complex_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    lazy(|| {
        let compound = css_compound_selector();
        let recurse = css_complex_selector();
        let ws = css_ws();

        Parser::new(move |state: &mut ParserState<'a>| {
            let left = compound.call(state)?;

            // Try to parse combinator + right side
            let cp = state.offset;
            ws.call(state);

            // Check for combinators: >, +, ~
            let combinator = if let Some(&b) = state.src_bytes.get(state.offset) {
                if b == b'>' || b == b'+' || b == b'~' {
                    let c = Span::new(state.offset, state.offset + 1, state.src);
                    state.offset += 1;
                    ws.call(state);
                    Some(c)
                } else {
                    None
                }
            } else {
                None
            };
            // Descendant combinator: whitespace between selectors
            let combinator = if combinator.is_some() {
                combinator
            } else if state.offset > cp && !state.is_at_end() {
                let next = state.src_bytes.get(state.offset).copied();
                if matches!(next, Some(b'.' | b'#' | b'[' | b':' | b'*') | Some(b'a'..=b'z') | Some(b'A'..=b'Z') | Some(b'_')) {
                    Some(Span::new(cp, cp + 1, state.src))
                } else {
                    state.offset = cp;
                    None
                }
            } else {
                state.offset = cp;
                None
            };

            if let Some(comb) = combinator {
                if let Some(right) = recurse.call(state) {
                    return Some(CssSelector::Complex {
                        left: Box::new(left),
                        combinator: comb,
                        right: Box::new(right),
                    });
                }
                state.offset = cp;
            }

            Some(left)
        })
    })
}

pub(super) fn css_compound_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    let attr_sel = css_attribute_selector();
    let pseudo_sel = css_pseudo_selector();

    Parser::new(move |state: &mut ParserState<'a>| {
        let mut parts: CompoundVec<'_> = Vec::with_capacity(3);

        // First: optional type selector or *
        if let Some(&b'*') = state.src_bytes.get(state.offset) {
            state.offset += 1;
            parts.push(CssSelector::Universal);
        } else if let Some(name) = css_ident_fast(state) {
            // Only if not followed by ( — that would be a function
            if state.src_bytes.get(state.offset) == Some(&b'(') {
                // Backtrack — it's a function, not a type selector
                state.offset = name.start;
            } else {
                parts.push(CssSelector::Type(name));
            }
        }

        // Then: any number of class, id, attribute, pseudo selectors
        // Inline byte dispatch to avoid vtable chain
        loop {
            match state.src_bytes.get(state.offset) {
                Some(&b'.') => {
                    state.offset += 1;
                    if let Some(name) = css_ident_fast(state) {
                        parts.push(CssSelector::Class(Span::new(name.start - 1, name.end, state.src)));
                    } else {
                        state.offset -= 1;
                        break;
                    }
                }
                Some(&b'#') => {
                    state.offset += 1;
                    if let Some(name) = css_ident_fast(state) {
                        parts.push(CssSelector::Id(Span::new(name.start - 1, name.end, state.src)));
                    } else {
                        state.offset -= 1;
                        break;
                    }
                }
                Some(&b'[') => {
                    if let Some(s) = attr_sel.call(state) {
                        parts.push(s);
                    } else {
                        break;
                    }
                }
                Some(&b':') => {
                    if let Some(s) = pseudo_sel.call(state) {
                        parts.push(s);
                    } else {
                        break;
                    }
                }
                Some(&b'*') => {
                    state.offset += 1;
                    parts.push(CssSelector::Universal);
                }
                _ => break,
            }
        }

        if parts.is_empty() {
            None
        } else if parts.len() == 1 {
            Some(parts.into_iter().next().unwrap())
        } else {
            Some(CssSelector::Compound(parts))
        }
    })
}

pub(super) fn css_attribute_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    let open_bracket = sp_string("[");
    let close_bracket = sp_string("]");
    let ws = css_ws();
    let ident = css_ident();
    let str_lit = css_string();
    Parser::new(move |state: &mut ParserState<'a>| {
        open_bracket.call(state)?;
        ws.call(state);
        let name = ident.call(state)?;
        ws.call(state);

        // Inline attribute matcher: [~|^$*]?=
        let matcher = if let Some(&b) = state.src_bytes.get(state.offset) {
            if b == b'=' {
                let start = state.offset;
                state.offset += 1;
                Some(Span::new(start, state.offset, state.src))
            } else if matches!(b, b'~' | b'|' | b'^' | b'$' | b'*') {
                if state.src_bytes.get(state.offset + 1) == Some(&b'=') {
                    let start = state.offset;
                    state.offset += 2;
                    Some(Span::new(start, state.offset, state.src))
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        };
        let value = if matcher.is_some() {
            ws.call(state);
            let v = str_lit.call(state).or_else(|| ident.call(state));
            ws.call(state);
            v
        } else {
            None
        };

        close_bracket.call(state)?;

        Some(CssSelector::Attribute {
            name,
            matcher,
            value,
        })
    })
}

pub(super) fn css_pseudo_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    lazy(|| {
        let double_colon = sp_string("::");
        let single_colon = sp_string(":");
        let ident = css_ident();
        let open_paren = sp_string("(");
        let close_paren = sp_string(")");
        let ws = css_ws();
        // Inline An+B parser — replaces regex
        let anb = Parser::new(|state: &mut ParserState<'a>| {
            let bytes = state.src_bytes;
            let start = state.offset;
            let len = bytes.len();
            let mut i = start;

            if i >= len {
                return None;
            }

            // Check for "even" / "odd" keywords
            if i + 4 <= len && &bytes[i..i + 4] == b"even" {
                state.offset = i + 4;
                return Some(Span::new(start, i + 4, state.src));
            }
            if i + 3 <= len && &bytes[i..i + 3] == b"odd" {
                state.offset = i + 3;
                return Some(Span::new(start, i + 3, state.src));
            }

            // Optional sign
            if i < len && matches!(bytes[i], b'+' | b'-') {
                i += 1;
            }

            // Try An+B or plain integer
            let digit_start = i;
            while i < len && bytes[i].is_ascii_digit() {
                i += 1;
            }

            if i < len && bytes[i] == b'n' {
                // An+B form: [+-]?\d*n\s*([+-]\s*\d+)?
                i += 1; // skip 'n'
                // Skip whitespace
                while i < len && matches!(bytes[i], b' ' | b'\t') {
                    i += 1;
                }
                // Optional [+-]\s*\d+
                if i < len && matches!(bytes[i], b'+' | b'-') {
                    i += 1;
                    while i < len && matches!(bytes[i], b' ' | b'\t') {
                        i += 1;
                    }
                    while i < len && bytes[i].is_ascii_digit() {
                        i += 1;
                    }
                }
                state.offset = i;
                Some(Span::new(start, i, state.src))
            } else if i > digit_start {
                // Plain integer: [+-]?\d+
                state.offset = i;
                Some(Span::new(start, i, state.src))
            } else {
                None
            }
        });
        let sel_list = css_selector_list();

        Parser::new(move |state: &mut ParserState<'a>| {
            let is_element = double_colon.call(state).is_some();
            if !is_element && single_colon.call(state).is_none() {
                return None;
            }

            let name = ident.call(state)?;

            if open_paren.call(state).is_some() {
                ws.call(state);

                let name_str = name.as_str();
                if name_str.starts_with("nth-") {
                    ws.call(state);
                    let arg = if let Some(s) = anb.call(state) {
                        vec![CssSelector::Type(s)]
                    } else {
                        Vec::new()
                    };
                    ws.call(state);
                    close_paren.call(state)?;
                    return Some(CssSelector::PseudoFunction { name, args: arg });
                }

                let args: Vec<CssSelector<'_>> = sel_list.call(state).map(|v| v.into_vec()).unwrap_or_default();
                ws.call(state);
                close_paren.call(state)?;
                return Some(CssSelector::PseudoFunction { name, args });
            }

            if is_element {
                Some(CssSelector::PseudoElement(name))
            } else {
                Some(CssSelector::PseudoClass(name))
            }
        })
    })
}
