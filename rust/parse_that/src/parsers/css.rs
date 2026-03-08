use crate::lazy::lazy;
use crate::leaf::*;
use crate::parse::*;
use crate::span_parser::*;
use crate::state::{ParserState, Span};

// ── CSS AST types (L1.5 — structural + typed values) ────────

#[derive(Debug, Clone, PartialEq)]
pub enum CssNode<'a> {
    QualifiedRule {
        selector_list: Vec<CssSelector<'a>>,
        declarations: Vec<CssDeclaration<'a>>,
    },
    AtMedia {
        prelude: Span<'a>,
        body: Vec<CssNode<'a>>,
    },
    AtSupports {
        prelude: Span<'a>,
        body: Vec<CssNode<'a>>,
    },
    AtFontFace {
        declarations: Vec<CssDeclaration<'a>>,
    },
    AtImport {
        values: Vec<CssValue<'a>>,
    },
    AtKeyframes {
        name: Span<'a>,
        blocks: Vec<KeyframeBlock<'a>>,
    },
    GenericAtRule {
        name: Span<'a>,
        prelude: Span<'a>,
        body: Option<Vec<CssNode<'a>>>,
    },
    Comment(Span<'a>),
}

#[derive(Debug, Clone, PartialEq)]
pub struct CssDeclaration<'a> {
    pub property: Span<'a>,
    pub values: Vec<CssValue<'a>>,
    pub important: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub enum CssValue<'a> {
    Dimension(f64, Span<'a>),
    Number(f64),
    Percentage(f64),
    Color(CssColor<'a>),
    Function {
        name: Span<'a>,
        args: Vec<CssValue<'a>>,
    },
    String(Span<'a>),
    Ident(Span<'a>),
    Comma,
    Slash,
    Operator(Span<'a>),
}

#[derive(Debug, Clone, PartialEq)]
pub enum CssColor<'a> {
    Hex(Span<'a>),
    Named(Span<'a>),
    Function {
        name: Span<'a>,
        args: Vec<CssValue<'a>>,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub enum CssSelector<'a> {
    Type(Span<'a>),
    Class(Span<'a>),
    Id(Span<'a>),
    Universal,
    Attribute {
        name: Span<'a>,
        matcher: Option<Span<'a>>,
        value: Option<Span<'a>>,
    },
    PseudoClass(Span<'a>),
    PseudoElement(Span<'a>),
    PseudoFunction {
        name: Span<'a>,
        args: Vec<CssSelector<'a>>,
    },
    Compound(Vec<CssSelector<'a>>),
    Complex {
        left: Box<CssSelector<'a>>,
        combinator: Span<'a>,
        right: Box<CssSelector<'a>>,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub struct KeyframeBlock<'a> {
    pub stops: Vec<KeyframeStop>,
    pub declarations: Vec<CssDeclaration<'a>>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum KeyframeStop {
    From,
    To,
    Percentage(f64),
}

// ── Monolithic CSS scanners (no regex, no vtable) ───────────

/// Scan a CSS identifier: -?[a-zA-Z_][\w-]* | --[\w-]+
/// Returns None if no ident at current offset.
pub(crate) fn css_ident_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    if start >= len {
        return None;
    }

    let mut i = start;
    let b0 = unsafe { *bytes.get_unchecked(i) };

    if b0 == b'-' {
        i += 1;
        if i >= len {
            return None;
        }
        let b1 = unsafe { *bytes.get_unchecked(i) };
        if b1 == b'-' {
            // Custom property: --[\w-]+
            i += 1;
            while i < len {
                let b = unsafe { *bytes.get_unchecked(i) };
                if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
                    i += 1;
                } else {
                    break;
                }
            }
            if i == start + 2 {
                return None; // just "--" with no continuation
            }
            state.offset = i;
            return Some(Span::new(start, i, state.src));
        }
        // -[a-zA-Z_]...
        if !(b1.is_ascii_alphabetic() || b1 == b'_') {
            return None;
        }
        i += 1;
    } else if b0.is_ascii_alphabetic() || b0 == b'_' {
        i += 1;
    } else {
        return None;
    }

    // Continue with [a-zA-Z0-9_-]*
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
            i += 1;
        } else {
            break;
        }
    }

    if i == start {
        return None;
    }
    state.offset = i;
    Some(Span::new(start, i, state.src))
}

/// Scan CSS whitespace and comments: (\s | /\*...\*/)*
/// Always succeeds (returns empty span if no ws/comments).
pub(crate) fn css_ws_comment_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    let mut i = start;

    loop {
        // Skip ASCII whitespace
        while i < len {
            let b = unsafe { *bytes.get_unchecked(i) };
            if b == b' ' || b == b'\t' || b == b'\n' || b == b'\r' || b == 0x0C {
                i += 1;
            } else {
                break;
            }
        }

        // Check for block comment /*...*/
        if i + 1 < len
            && unsafe { *bytes.get_unchecked(i) } == b'/'
            && unsafe { *bytes.get_unchecked(i + 1) } == b'*'
        {
            i += 2;
            // Scan for */
            loop {
                match memchr::memchr(b'*', bytes.get(i..)?) {
                    None => {
                        // Unterminated comment — consume rest
                        i = len;
                        break;
                    }
                    Some(pos) => {
                        i += pos + 1;
                        if i < len && unsafe { *bytes.get_unchecked(i) } == b'/' {
                            i += 1;
                            break;
                        }
                    }
                }
            }
            continue; // Check for more ws/comments after this comment
        }

        break;
    }

    state.offset = i;
    Some(Span::new(start, i, state.src))
}

/// Scan a CSS quoted string: "..." or '...' with \-escapes.
/// Returns span including quote delimiters.
pub(crate) fn css_string_fast<'a>(state: &mut ParserState<'a>) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    if start >= bytes.len() {
        return None;
    }

    let quote = unsafe { *bytes.get_unchecked(start) };
    if quote != b'"' && quote != b'\'' {
        return None;
    }

    let mut i = start + 1;
    loop {
        // SIMD scan for quote or backslash
        match memchr::memchr2(quote, b'\\', bytes.get(i..)?) {
            None => return None, // unterminated string
            Some(pos) => {
                i += pos;
                if unsafe { *bytes.get_unchecked(i) } == quote {
                    i += 1; // consume closing quote
                    state.offset = i;
                    return Some(Span::new(start, i, state.src));
                }
                // backslash: skip next byte (CSS escapes are simpler than JSON)
                i += 1;
                if i >= bytes.len() {
                    return None;
                }
                i += 1; // skip the escaped character
            }
        }
    }
}

// ── Leaf token parsers ──────────────────────────────────────

fn css_ident<'a>() -> SpanParser<'a> {
    sp_css_ident()
}

fn css_string<'a>() -> SpanParser<'a> {
    sp_css_string()
}

fn css_comment<'a>() -> SpanParser<'a> {
    sp_regex(r"(?s)/\*.*?\*/")
}

fn css_ws<'a>() -> SpanParser<'a> {
    sp_css_ws_comment()
}


// ── Number + dimension parsing ──────────────────────────────

fn css_number_span<'a>() -> SpanParser<'a> {
    sp_json_number()
}



// ── CSS Selector parser ─────────────────────────────────────

fn css_selector_list<'a>() -> Parser<'a, Vec<CssSelector<'a>>> {
    let sel = css_complex_selector();
    let ws = css_ws();
    let comma_sp = sp_string(",");
    let comma = Parser::new(move |state: &mut ParserState<'a>| {
        ws.call(state);
        let v = comma_sp.call(state)?;
        ws.call(state);
        Some(v)
    });
    sel.sep_by(comma, 1..)
}

fn css_complex_selector<'a>() -> Parser<'a, CssSelector<'a>> {
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

fn css_compound_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    let attr_sel = css_attribute_selector();
    let pseudo_sel = css_pseudo_selector();

    Parser::new(move |state: &mut ParserState<'a>| {
        let mut parts = Vec::new();

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


fn css_attribute_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    let open_bracket = sp_string("[");
    let close_bracket = sp_string("]");
    let ws = css_ws();
    let ident = css_ident();
    let str_lit = css_string();
    let matcher_re = sp_regex(r"[~|^$*]?=");

    Parser::new(move |state: &mut ParserState<'a>| {
        open_bracket.call(state)?;
        ws.call(state);
        let name = ident.call(state)?;
        ws.call(state);

        let matcher = matcher_re.call(state);
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

fn css_pseudo_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    lazy(|| {
        let double_colon = sp_string("::");
        let single_colon = sp_string(":");
        let ident = css_ident();
        let open_paren = sp_string("(");
        let close_paren = sp_string(")");
        let ws = css_ws();
        let anb = sp_regex(r"(?:(?:[+-]?\d*n\s*(?:[+-]\s*\d+)?)|(?:[+-]?\d+)|even|odd)");
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

                let args = sel_list.call(state).unwrap_or_default();
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

// ── CSS Declaration parser ──────────────────────────────────

/// Inline value parsing — no vtable dispatch, pure byte-level scanning.
#[inline]
fn parse_value_inline<'a>(state: &mut ParserState<'a>) -> Option<CssValue<'a>> {
    let next = *state.src_bytes.get(state.offset)?;
    match next {
        b'#' => {
            // Hex color
            sp_regex(r"#[0-9a-fA-F]{3,8}").call(state).map(|s| CssValue::Color(CssColor::Hex(s)))
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
fn parse_number_value_inline<'a>(state: &mut ParserState<'a>) -> Option<CssValue<'a>> {
    let span = sp_json_number().call(state)?;
    let num: f64 = fast_float2::parse(span.as_str()).unwrap_or(0.0);

    // Try %
    if state.src_bytes.get(state.offset) == Some(&b'%') {
        state.offset += 1;
        return Some(CssValue::Percentage(num));
    }
    // Try unit — inline the most common ones
    if let Some(u) = css_ident_fast(state) {
        return Some(CssValue::Dimension(num, u));
    }
    Some(CssValue::Number(num))
}

#[inline]
fn parse_ident_or_function_inline<'a>(state: &mut ParserState<'a>) -> Option<CssValue<'a>> {
    let name = css_ident_fast(state)?;

    // Check for function call
    if state.src_bytes.get(state.offset) == Some(&b'(') {
        state.offset += 1;
        css_ws_comment_fast(state);

        let mut args = Vec::new();
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

fn css_declaration<'a>() -> Parser<'a, CssDeclaration<'a>> {
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
        let mut values = Vec::new();
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
        if values.len() >= 1 {
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

fn css_declaration_block<'a>() -> Parser<'a, Vec<CssDeclaration<'a>>> {
    let decl = css_declaration();
    let ws = css_ws();
    let open_brace = sp_string("{");
    let close_brace = sp_string("}");
    let skip = sp_take_until_any(b";}");
    let semi = sp_string(";");

    Parser::new(move |state: &mut ParserState<'a>| {
        open_brace.call(state)?;

        let mut declarations = Vec::new();
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

fn css_keyframe_stop<'a>() -> Parser<'a, KeyframeStop> {
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

fn css_keyframe_block<'a>() -> Parser<'a, KeyframeBlock<'a>> {
    let stop = css_keyframe_stop();
    let comma_ws = css_ws();
    let comma_sp = sp_string(",");
    let comma = Parser::new(move |state: &mut ParserState<'a>| {
        comma_ws.call(state);
        let v = comma_sp.call(state)?;
        comma_ws.call(state);
        Some(v)
    });
    let stops_parser = stop.sep_by(comma, 1..);
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

// ── At-rules ────────────────────────────────────────────────

fn css_at_rule<'a>() -> Parser<'a, CssNode<'a>> {
    lazy(|| {
        let rule = css_rule();
        // single_value not needed — @import uses parse_value_inline
        let decl_block = css_declaration_block();
        let kf_block = css_keyframe_block();
        let ws = css_ws();
        let ident = css_ident();
        let at_sign = sp_string("@");
        let open_brace = sp_string("{");
        let close_brace = sp_string("}");
        let semi = sp_string(";");
        let skip_to_brace = sp_take_until_any(b"{");
        let skip_to_semi_brace = sp_take_until_any(b";}");
        let skip_to_close = sp_take_until_any(b"}");
        let kf_name_parser = css_ident().or(css_string());

        Parser::new(move |state: &mut ParserState<'a>| {
            at_sign.call(state)?;
            let name = ident.call(state)?;
            ws.call(state);

            match name.as_str() {
                "media" => {
                    let prelude_span = skip_to_brace.call(state)?;
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
                        prelude: prelude_span,
                        body,
                    })
                }
                "supports" => {
                    let prelude_span = skip_to_brace.call(state)?;
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

                    Some(CssNode::AtSupports {
                        prelude: prelude_span,
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
                    let mut values = Vec::new();
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

                    let mut blocks = Vec::new();
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
                    let has_block;
                    let prelude_span;

                    let skip = sp_take_until_any(b"{;");
                    prelude_span = skip.call(state).unwrap_or(Span::new(
                        state.offset,
                        state.offset,
                        state.src,
                    ));

                    if open_brace.call(state).is_some() {
                        has_block = true;
                    } else {
                        semi.call(state);
                        has_block = false;
                    }

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

pub fn css_stylesheet<'a>() -> Parser<'a, Vec<CssNode<'a>>> {
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

pub fn css_parser<'a>() -> Parser<'a, Vec<CssNode<'a>>> {
    css_stylesheet()
}
