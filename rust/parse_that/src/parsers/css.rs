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

// ── Leaf token parsers ──────────────────────────────────────

fn css_ident<'a>() -> SpanParser<'a> {
    // CSS ident: [a-zA-Z_-][a-zA-Z0-9_-]* or --custom-prop
    sp_regex(r"[\-]?[a-zA-Z_][\w-]*|--[\w-]+")
}

fn css_string<'a>() -> SpanParser<'a> {
    // Double or single quoted string with escape handling
    sp_regex(r#""(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'"#)
}

fn css_comment<'a>() -> SpanParser<'a> {
    sp_regex(r"(?s)/\*.*?\*/")
}

fn css_ws<'a>() -> SpanParser<'a> {
    // Whitespace + comments
    sp_regex(r"(?s)(?:\s|/\*.*?\*/)*")
}

fn css_ws_parser<'a>() -> Parser<'a, Span<'a>> {
    css_ws().into_parser()
}

/// Skip optional whitespace and comments.
fn skip_ws<'a, O: 'a>(p: Parser<'a, O>) -> Parser<'a, O> {
    let ws = css_ws_parser();
    Parser::new(move |state: &mut ParserState<'a>| {
        ws.call(state);
        let v = p.call(state)?;
        ws.call(state);
        Some(v)
    })
}

// ── Number + dimension parsing ──────────────────────────────

fn css_number_span<'a>() -> SpanParser<'a> {
    sp_json_number()
}

/// CSS dimension units (length, angle, time, frequency, resolution, flex)
fn css_unit<'a>() -> SpanParser<'a> {
    sp_regex(r"(?i)px|em|rem|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc|Q|cap|ic|lh|rlh|vi|vb|svw|svh|lvw|lvh|dvw|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax|deg|rad|grad|turn|ms|s|Hz|kHz|dpi|dpcm|dppx|fr")
}

// ── CSS Value parser ────────────────────────────────────────

fn css_single_value<'a>() -> Parser<'a, CssValue<'a>> {
    lazy(|| {
        let hex_color = sp_regex(r"#[0-9a-fA-F]{3,8}")
            .map(|s| CssValue::Color(CssColor::Hex(s)));

        let string_val = css_string().map(|s| CssValue::String(s));

        let comma = sp_string(",").map(|_| CssValue::Comma);
        let slash = sp_string("/").map(|_| CssValue::Slash);

        // Number with optional unit or %
        let number_with_unit: Parser<'_, CssValue<'_>> = Parser::new(move |state: &mut ParserState<'a>| {
            let num_span = css_number_span();
            let span = num_span.call(state)?;
            let num: f64 = fast_float2::parse(span.as_str()).unwrap_or(0.0);

            // Try %
            if let Some(_) = sp_string("%").call(state) {
                return Some(CssValue::Percentage(num));
            }
            // Try unit
            let unit = css_unit();
            if let Some(u) = unit.call(state) {
                return Some(CssValue::Dimension(num, u));
            }
            Some(CssValue::Number(num))
        });

        // Function call: ident(args)
        let function_call: Parser<'_, CssValue<'_>> = Parser::new(move |state: &mut ParserState<'a>| {
            let name_sp = css_ident();
            let name = name_sp.call(state)?;
            if sp_string("(").call(state).is_none() {
                return None;
            }
            css_ws().call(state);

            // Parse arguments as a value list
            let mut args = Vec::new();
            loop {
                css_ws().call(state);
                if sp_string(")").call(state).is_some() {
                    break;
                }
                // Check for known color function names
                let num_span = css_number_span();
                if let Some(span) = num_span.call(state) {
                    let num: f64 = fast_float2::parse(span.as_str()).unwrap_or(0.0);
                    if sp_string("%").call(state).is_some() {
                        args.push(CssValue::Percentage(num));
                    } else {
                        let unit = css_unit();
                        if let Some(u) = unit.call(state) {
                            args.push(CssValue::Dimension(num, u));
                        } else {
                            args.push(CssValue::Number(num));
                        }
                    }
                } else if sp_string(",").call(state).is_some() {
                    args.push(CssValue::Comma);
                } else if sp_string("/").call(state).is_some() {
                    args.push(CssValue::Slash);
                } else if let Some(s) = css_string().call(state) {
                    args.push(CssValue::String(s));
                } else if let Some(id) = css_ident().call(state) {
                    args.push(CssValue::Ident(id));
                } else {
                    // Unknown token — skip one byte to avoid infinite loop
                    if state.is_at_end() {
                        return None;
                    }
                    state.offset += 1;
                }
            }

            let name_str = name.as_str();
            // Classify color functions
            if matches!(
                name_str,
                "rgb" | "rgba" | "hsl" | "hsla" | "hwb" | "lab" | "lch"
                    | "oklab" | "oklch" | "color" | "color-mix"
            ) {
                return Some(CssValue::Color(CssColor::Function { name, args }));
            }

            Some(CssValue::Function { name, args })
        });

        // Operator: standalone + or -
        let operator = sp_regex(r"[+-]")
            .map(CssValue::Operator);

        // Plain ident (including named colors — classified later)
        let ident_val = css_ident().map(|s| CssValue::Ident(s));

        dispatch_byte_multi(vec![
            (b"#" as &[u8], hex_color),
            (b"\"'", string_val),
            (b",", comma),
            (b"/", slash),
            (b"-+0123456789.", number_with_unit),
        ])
        .or(function_call)
        .or(operator)
        .or(ident_val)
    })
}

// ── CSS Selector parser ─────────────────────────────────────

fn css_selector_list<'a>() -> Parser<'a, Vec<CssSelector<'a>>> {
    lazy(|| {
        let sel = css_complex_selector();
        let comma = skip_ws(sp_string(",").into_parser());
        sel.sep_by(comma, 1..)
    })
}

fn css_complex_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    lazy(|| {
        let compound = css_compound_selector();

        Parser::new(move |state: &mut ParserState<'a>| {
            let left = compound.call(state)?;

            // Try to parse combinator + right side
            let cp = state.offset;
            css_ws().call(state);

            // Check for combinators: >, +, ~
            let comb_parser = sp_regex(r"[>+~]");
            let combinator = if let Some(c) = comb_parser.call(state) {
                css_ws().call(state);
                Some(c)
            } else if state.offset > cp && !state.is_at_end() {
                // Whitespace-only might be descendant combinator
                // but only if next char can start a selector
                let next = state.src_bytes.get(state.offset).copied();
                if matches!(next, Some(b'.' | b'#' | b'[' | b':' | b'*') | Some(b'a'..=b'z') | Some(b'A'..=b'Z') | Some(b'_')) {
                    Some(Span::new(cp, cp + 1, state.src)) // space combinator
                } else {
                    state.offset = cp;
                    None
                }
            } else {
                state.offset = cp;
                None
            };

            if let Some(comb) = combinator {
                if let Some(right) = css_complex_selector().call(state) {
                    return Some(CssSelector::Complex {
                        left: Box::new(left),
                        combinator: comb,
                        right: Box::new(right),
                    });
                }
                // No right side — backtrack
                state.offset = cp;
            }

            Some(left)
        })
    })
}

fn css_compound_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    lazy(|| {
        Parser::new(move |state: &mut ParserState<'a>| {
            let mut parts = Vec::new();

            // First: optional type selector or *
            if sp_string("*").call(state).is_some() {
                parts.push(CssSelector::Universal);
            } else if let Some(name) = css_ident().call(state) {
                // Only if not followed by ( — that would be a function
                let cp = state.offset;
                if sp_string("(").call(state).is_some() {
                    state.offset = cp;
                    // Not a type selector, it's a function
                } else {
                    parts.push(CssSelector::Type(name));
                }
            }

            // Then: any number of class, id, attribute, pseudo selectors
            loop {
                if let Some(s) = css_simple_selector_suffix().call(state) {
                    parts.push(s);
                } else {
                    break;
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
    })
}

fn css_simple_selector_suffix<'a>() -> Parser<'a, CssSelector<'a>> {
    lazy(|| {
        let class_sel = sp_string(".")
            .then_span(css_ident())
            .map(|s| CssSelector::Class(s));

        let id_sel = sp_string("#")
            .then_span(css_ident())
            .map(|s| CssSelector::Id(s));

        let universal = sp_string("*").map(|_| CssSelector::Universal);

        let attr_sel = css_attribute_selector();
        let pseudo_sel = css_pseudo_selector();

        class_sel
            .or(id_sel)
            .or(attr_sel)
            .or(pseudo_sel)
            .or(universal)
    })
}

fn css_attribute_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    Parser::new(move |state: &mut ParserState<'a>| {
        sp_string("[").call(state)?;
        css_ws().call(state);
        let name = css_ident().call(state)?;
        css_ws().call(state);

        // Optional matcher + value
        let matcher_re = sp_regex(r"[~|^$*]?=");
        let matcher = matcher_re.call(state);
        let value = if matcher.is_some() {
            css_ws().call(state);
            let v = css_string().call(state).or_else(|| css_ident().call(state));
            css_ws().call(state);
            v
        } else {
            None
        };

        sp_string("]").call(state)?;

        Some(CssSelector::Attribute {
            name,
            matcher,
            value,
        })
    })
}

fn css_pseudo_selector<'a>() -> Parser<'a, CssSelector<'a>> {
    lazy(|| {
        Parser::new(move |state: &mut ParserState<'a>| {
            // :: for pseudo-elements, : for pseudo-classes
            let is_element = sp_string("::").call(state).is_some();
            if !is_element && sp_string(":").call(state).is_none() {
                return None;
            }

            let name = css_ident().call(state)?;

            // Check for functional pseudo: :is(), :not(), :has(), :nth-child(), etc.
            if sp_string("(").call(state).is_some() {
                css_ws().call(state);

                // For :nth-* pseudos, parse An+B syntax
                let name_str = name.as_str();
                if name_str.starts_with("nth-") {
                    // Parse An+B microsyntax or 'even'/'odd'
                    let anb = sp_regex(r"(?:(?:[+-]?\d*n\s*(?:[+-]\s*\d+)?)|(?:[+-]?\d+)|even|odd)")
                        .into_parser();
                    css_ws().call(state);
                    let arg = if let Some(s) = anb.call(state) {
                        vec![CssSelector::Type(s)] // store An+B as a type span
                    } else {
                        Vec::new()
                    };
                    css_ws().call(state);
                    sp_string(")").call(state)?;
                    return Some(CssSelector::PseudoFunction { name, args: arg });
                }

                // For :is(), :not(), :has(), :where() — parse selector list
                let args = css_selector_list().call(state).unwrap_or_default();
                css_ws().call(state);
                sp_string(")").call(state)?;
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

fn css_declaration<'a>() -> Parser<'a, CssDeclaration<'a>> {
    Parser::new(move |state: &mut ParserState<'a>| {
        css_ws().call(state);
        let property = css_ident().call(state)?;
        css_ws().call(state);
        sp_string(":").call(state)?;
        css_ws().call(state);

        // Parse values until ; or }
        let mut values = Vec::new();
        loop {
            css_ws().call(state);
            let next = state.src_bytes.get(state.offset).copied();
            if matches!(next, Some(b';') | Some(b'}') | None) {
                break;
            }
            if let Some(v) = css_single_value().call(state) {
                values.push(v);
            } else {
                break;
            }
        }

        // Check for !important
        let important = if let Some(last) = values.last() {
            if matches!(last, CssValue::Ident(s) if s.as_str() == "important") {
                // Check the one before it is an operator "!"
                if values.len() >= 2 {
                    // Actually "!important" is parsed as "!" then "important"
                    // Let's handle it differently
                    false
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false
        };

        // Consume optional ;
        sp_string(";").call(state);

        Some(CssDeclaration {
            property,
            values,
            important,
        })
    })
}

fn css_declaration_block<'a>() -> Parser<'a, Vec<CssDeclaration<'a>>> {
    lazy(|| {
        let decl = css_declaration();

        Parser::new(move |state: &mut ParserState<'a>| {
            sp_string("{").call(state)?;

            let mut declarations = Vec::new();
            loop {
                css_ws().call(state);
                if sp_string("}").call(state).is_some() {
                    break;
                }
                if state.is_at_end() {
                    return None;
                }
                if let Some(d) = decl.call(state) {
                    declarations.push(d);
                } else {
                    // Skip to next ; or } to recover
                    let skip = sp_take_until_any(b";}")
                        .into_parser();
                    skip.call(state);
                    sp_string(";").call(state);
                }
            }

            Some(declarations)
        })
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
    Parser::new(move |state: &mut ParserState<'a>| {
        css_ws().call(state);

        // Parse stops: from, to, 0%, 50%, 100%
        let stop = css_keyframe_stop();
        let comma = skip_ws(sp_string(",").into_parser());
        let stops = stop.sep_by(comma, 1..).call(state)?;

        css_ws().call(state);
        let declarations = css_declaration_block().call(state)?;

        Some(KeyframeBlock {
            stops,
            declarations,
        })
    })
}

// ── At-rules ────────────────────────────────────────────────

fn css_at_rule<'a>() -> Parser<'a, CssNode<'a>> {
    lazy(|| {
        Parser::new(move |state: &mut ParserState<'a>| {
            sp_string("@").call(state)?;
            let name = css_ident().call(state)?;
            css_ws().call(state);

            match name.as_str() {
                "media" => {
                    // Prelude until {
                    let _skip = sp_take_until_any(b"{");
                    let prelude_span = _skip.call(state)?;
                    sp_string("{").call(state)?;

                    let mut body = Vec::new();
                    loop {
                        css_ws().call(state);
                        if sp_string("}").call(state).is_some() {
                            break;
                        }
                        if state.is_at_end() {
                            return None;
                        }
                        if let Some(node) = css_rule().call(state) {
                            body.push(node);
                        } else {
                            // Skip to recover
                            let skip = sp_take_until_any(b";}");
                            skip.call(state);
                            sp_string(";").call(state);
                        }
                    }

                    Some(CssNode::AtMedia {
                        prelude: prelude_span,
                        body,
                    })
                }
                "supports" => {
                    let prelude_span = sp_take_until_any(b"{").call(state)?;
                    sp_string("{").call(state)?;

                    let mut body = Vec::new();
                    loop {
                        css_ws().call(state);
                        if sp_string("}").call(state).is_some() {
                            break;
                        }
                        if state.is_at_end() {
                            return None;
                        }
                        if let Some(node) = css_rule().call(state) {
                            body.push(node);
                        } else {
                            let skip = sp_take_until_any(b";}");
                            skip.call(state);
                            sp_string(";").call(state);
                        }
                    }

                    Some(CssNode::AtSupports {
                        prelude: prelude_span,
                        body,
                    })
                }
                "font-face" => {
                    css_ws().call(state);
                    let declarations = css_declaration_block().call(state)?;
                    Some(CssNode::AtFontFace { declarations })
                }
                "import" => {
                    css_ws().call(state);
                    // Parse value list until ;
                    let mut values = Vec::new();
                    loop {
                        css_ws().call(state);
                        if sp_string(";").call(state).is_some() || state.is_at_end() {
                            break;
                        }
                        if let Some(v) = css_single_value().call(state) {
                            values.push(v);
                        } else {
                            break;
                        }
                    }
                    Some(CssNode::AtImport { values })
                }
                "keyframes" | "-webkit-keyframes" | "-moz-keyframes" => {
                    css_ws().call(state);
                    let kf_name = css_ident()
                        .or(css_string())
                        .call(state)?;
                    css_ws().call(state);
                    sp_string("{").call(state)?;

                    let mut blocks = Vec::new();
                    loop {
                        css_ws().call(state);
                        if sp_string("}").call(state).is_some() {
                            break;
                        }
                        if state.is_at_end() {
                            return None;
                        }
                        if let Some(block) = css_keyframe_block().call(state) {
                            blocks.push(block);
                        } else {
                            // Skip to next } to recover
                            let skip = sp_take_until_any(b"}");
                            skip.call(state);
                        }
                    }

                    Some(CssNode::AtKeyframes {
                        name: kf_name,
                        blocks,
                    })
                }
                _ => {
                    // Generic at-rule
                    let has_block;
                    let prelude_span;

                    // Scan prelude until { or ;
                    let skip = sp_take_until_any(b"{;");
                    prelude_span = skip.call(state).unwrap_or(Span::new(
                        state.offset,
                        state.offset,
                        state.src,
                    ));

                    if sp_string("{").call(state).is_some() {
                        has_block = true;
                    } else {
                        sp_string(";").call(state);
                        has_block = false;
                    }

                    let body = if has_block {
                        let mut rules = Vec::new();
                        loop {
                            css_ws().call(state);
                            if sp_string("}").call(state).is_some() {
                                break;
                            }
                            if state.is_at_end() {
                                break;
                            }
                            if let Some(node) = css_rule().call(state) {
                                rules.push(node);
                            } else {
                                let skip = sp_take_until_any(b";}");
                                skip.call(state);
                                sp_string(";").call(state);
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
    lazy(|| {
        Parser::new(move |state: &mut ParserState<'a>| {
            let selector_list = css_selector_list().call(state)?;
            css_ws().call(state);
            let declarations = css_declaration_block().call(state)?;

            Some(CssNode::QualifiedRule {
                selector_list,
                declarations,
            })
        })
    })
}

// ── Comment node ────────────────────────────────────────────

fn css_comment_node<'a>() -> Parser<'a, CssNode<'a>> {
    css_comment().map(CssNode::Comment)
}

// ── Top-level rule ──────────────────────────────────────────

fn css_rule<'a>() -> Parser<'a, CssNode<'a>> {
    lazy(|| {
        // Use non-comment whitespace skip, then try comment first
        let ws_no_comment = sp_regex(r"\s*").into_parser();
        ws_no_comment
            .next(css_comment_node().or(css_at_rule()).or(css_qualified_rule()))
    })
}

// ── Stylesheet (entry point) ────────────────────────────────

pub fn css_stylesheet<'a>() -> Parser<'a, Vec<CssNode<'a>>> {
    Parser::new(move |state: &mut ParserState<'a>| {
        let mut nodes = Vec::new();
        let ws_only = sp_regex(r"\s*");

        loop {
            ws_only.call(state);
            if state.is_at_end() {
                break;
            }
            if let Some(node) = css_rule().call(state) {
                nodes.push(node);
            } else {
                // Skip to next rule to recover
                if state.is_at_end() {
                    break;
                }
                let skip = sp_take_until_any(b";}");
                skip.call(state);
                if sp_string(";").call(state).is_none() && sp_string("}").call(state).is_none() {
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
