use parse_that::parsers::css::*;
use parse_that::state::{ParserState, Span};

fn parse_css(input: &str) -> NodeVec<'_> {
    let mut state = ParserState::new(input);
    css_parser().call(&mut state).unwrap_or_default()
}

// ── Basic qualified rules ───────────────────────────────────

#[test]
fn test_simple_rule() {
    let nodes = parse_css("body { margin: 0; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule {
            selector_list,
            declarations,
        } => {
            assert_eq!(selector_list.len(), 1);
            match &selector_list[0] {
                CssSelector::Type(s) => assert_eq!(s.as_str(), "body"),
                other => panic!("expected Type selector, got {:?}", other),
            }
            assert_eq!(declarations.len(), 1);
            assert_eq!(declarations[0].property.as_str(), "margin");
            assert_eq!(declarations[0].values.len(), 1);
            match &declarations[0].values[0] {
                CssValue::Number(n) => assert_eq!(*n, 0.0),
                other => panic!("expected Number, got {:?}", other),
            }
        }
        other => panic!("expected QualifiedRule, got {:?}", other),
    }
}

#[test]
fn test_multiple_declarations() {
    let nodes = parse_css(".box { width: 100px; height: 50%; color: red; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            assert_eq!(declarations.len(), 3);
            assert_eq!(declarations[0].property.as_str(), "width");
            assert_eq!(declarations[1].property.as_str(), "height");
            assert_eq!(declarations[2].property.as_str(), "color");

            // width: 100px
            match &declarations[0].values[0] {
                CssValue::Dimension(n, u) => {
                    assert_eq!(*n, 100.0);
                    assert_eq!(u.as_str(), "px");
                }
                other => panic!("expected Dimension, got {:?}", other),
            }

            // height: 50%
            match &declarations[1].values[0] {
                CssValue::Percentage(n) => assert_eq!(*n, 50.0),
                other => panic!("expected Percentage, got {:?}", other),
            }

            // color: red
            match &declarations[2].values[0] {
                CssValue::Ident(s) => assert_eq!(s.as_str(), "red"),
                other => panic!("expected Ident, got {:?}", other),
            }
        }
        other => panic!("expected QualifiedRule, got {:?}", other),
    }
}

// ── Selectors ───────────────────────────────────────────────

#[test]
fn test_class_selector() {
    let nodes = parse_css(".foo { color: blue; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            assert_eq!(selector_list.len(), 1);
            match &selector_list[0] {
                CssSelector::Class(s) => assert_eq!(s.as_str(), ".foo"),
                other => panic!("expected Class, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_id_selector() {
    let nodes = parse_css("#main { padding: 10px; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            assert_eq!(selector_list.len(), 1);
            match &selector_list[0] {
                CssSelector::Id(s) => assert_eq!(s.as_str(), "#main"),
                other => panic!("expected Id, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_compound_selector() {
    let nodes = parse_css("div.foo#bar { color: red; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            assert_eq!(selector_list.len(), 1);
            match &selector_list[0] {
                CssSelector::Compound(parts) => {
                    assert_eq!(parts.len(), 3);
                    match &parts[0] {
                        CssSelector::Type(s) => assert_eq!(s.as_str(), "div"),
                        other => panic!("expected Type, got {:?}", other),
                    }
                }
                other => panic!("expected Compound, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_descendant_combinator() {
    let nodes = parse_css("div p { color: red; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            assert_eq!(selector_list.len(), 1);
            match &selector_list[0] {
                CssSelector::Complex { left, right, .. } => {
                    match left.as_ref() {
                        CssSelector::Type(s) => assert_eq!(s.as_str(), "div"),
                        other => panic!("expected Type, got {:?}", other),
                    }
                    match right.as_ref() {
                        CssSelector::Type(s) => assert_eq!(s.as_str(), "p"),
                        other => panic!("expected Type, got {:?}", other),
                    }
                }
                other => panic!("expected Complex, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_child_combinator() {
    let nodes = parse_css("ul > li { list-style: none; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            match &selector_list[0] {
                CssSelector::Complex { combinator, .. } => {
                    assert_eq!(combinator.as_str(), ">");
                }
                other => panic!("expected Complex, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_selector_list() {
    let nodes = parse_css("h1, h2, h3 { font-weight: bold; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            assert_eq!(selector_list.len(), 3);
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_pseudo_class() {
    let nodes = parse_css("a:hover { color: blue; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            match &selector_list[0] {
                CssSelector::Compound(parts) => {
                    assert!(parts.len() >= 2);
                    match &parts[1] {
                        CssSelector::PseudoClass(s) => assert_eq!(s.as_str(), "hover"),
                        other => panic!("expected PseudoClass, got {:?}", other),
                    }
                }
                other => panic!("expected Compound, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_pseudo_element() {
    let nodes = parse_css("p::before { content: ''; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            match &selector_list[0] {
                CssSelector::Compound(parts) => {
                    assert!(parts.len() >= 2);
                    match &parts[1] {
                        CssSelector::PseudoElement(s) => assert_eq!(s.as_str(), "before"),
                        other => panic!("expected PseudoElement, got {:?}", other),
                    }
                }
                other => panic!("expected Compound, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_attribute_selector() {
    let nodes = parse_css("[data-value=\"test\"] { display: none; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            match &selector_list[0] {
                CssSelector::Attribute { name, matcher, value } => {
                    assert_eq!(name.as_str(), "data-value");
                    assert!(matcher.is_some());
                    assert!(value.is_some());
                }
                other => panic!("expected Attribute, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

// ── Values ──────────────────────────────────────────────────

#[test]
fn test_dimension_values() {
    let nodes = parse_css(".x { margin: 10px 2em 1.5rem 0; }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            let values = &declarations[0].values;
            assert_eq!(values.len(), 4);
            match &values[0] {
                CssValue::Dimension(n, u) => {
                    assert_eq!(*n, 10.0);
                    assert_eq!(u.as_str(), "px");
                }
                other => panic!("expected Dimension, got {:?}", other),
            }
            match &values[1] {
                CssValue::Dimension(n, u) => {
                    assert_eq!(*n, 2.0);
                    assert_eq!(u.as_str(), "em");
                }
                other => panic!("expected Dimension, got {:?}", other),
            }
            match &values[2] {
                CssValue::Dimension(n, u) => {
                    assert_eq!(*n, 1.5);
                    assert_eq!(u.as_str(), "rem");
                }
                other => panic!("expected Dimension, got {:?}", other),
            }
            match &values[3] {
                CssValue::Number(n) => assert_eq!(*n, 0.0),
                other => panic!("expected Number, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_hex_color() {
    let nodes = parse_css(".x { color: #ff0000; }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            match &declarations[0].values[0] {
                CssValue::Color(CssColor::Hex(s)) => {
                    assert_eq!(s.as_str(), "#ff0000");
                }
                other => panic!("expected Hex color, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_rgb_function() {
    let nodes = parse_css(".x { color: rgb(255, 0, 0); }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            match &declarations[0].values[0] {
                CssValue::Color(CssColor::Function { name, args }) => {
                    assert_eq!(name.as_str(), "rgb");
                    // 255, 0, 0 -> Number, Comma, Number, Comma, Number
                    assert!(args.len() >= 3);
                }
                other => panic!("expected Color Function, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_calc_function() {
    let nodes = parse_css(".x { width: calc(100% - 20px); }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            match &declarations[0].values[0] {
                CssValue::Function { name, .. } => {
                    assert_eq!(name.as_str(), "calc");
                }
                other => panic!("expected Function, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_var_function() {
    let nodes = parse_css(".x { color: var(--main-color); }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            match &declarations[0].values[0] {
                CssValue::Function { name, args } => {
                    assert_eq!(name.as_str(), "var");
                    assert!(args.len() >= 1);
                    match &args[0] {
                        CssValue::Ident(s) => assert_eq!(s.as_str(), "--main-color"),
                        other => panic!("expected Ident, got {:?}", other),
                    }
                }
                other => panic!("expected Function, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_string_value() {
    let nodes = parse_css(".x { content: \"hello\"; }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            match &declarations[0].values[0] {
                CssValue::String(s) => {
                    assert_eq!(s.as_str(), "\"hello\"");
                }
                other => panic!("expected String, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

// ── At-rules ────────────────────────────────────────────────

#[test]
fn test_at_media() {
    let nodes = parse_css("@media (max-width: 768px) { .foo { display: none; } }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::AtMedia { queries, body } => {
            assert!(!queries.is_empty());
            // The media query should have a plain feature with "max-width"
            assert_eq!(body.len(), 1);
        }
        other => panic!("expected AtMedia, got {:?}", other),
    }
}

#[test]
fn test_at_keyframes() {
    let css = "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
    let nodes = parse_css(css);
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::AtKeyframes { name, blocks } => {
            assert_eq!(name.as_str(), "spin");
            assert_eq!(blocks.len(), 2);
            assert_eq!(blocks[0].stops[0], KeyframeStop::From);
            assert_eq!(blocks[1].stops[0], KeyframeStop::To);
        }
        other => panic!("expected AtKeyframes, got {:?}", other),
    }
}

#[test]
fn test_at_font_face() {
    let css = "@font-face { font-family: 'Open Sans'; src: url('open-sans.woff2'); }";
    let nodes = parse_css(css);
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::AtFontFace { declarations } => {
            assert_eq!(declarations.len(), 2);
            assert_eq!(declarations[0].property.as_str(), "font-family");
        }
        other => panic!("expected AtFontFace, got {:?}", other),
    }
}

#[test]
fn test_at_import() {
    let nodes = parse_css("@import url('reset.css');");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::AtImport { values } => {
            assert!(values.len() >= 1);
        }
        other => panic!("expected AtImport, got {:?}", other),
    }
}

// ── Comments ────────────────────────────────────────────────

#[test]
fn test_comment() {
    let nodes = parse_css("/* hello */ .foo { color: red; }");
    assert_eq!(nodes.len(), 2);
    match &nodes[0] {
        CssNode::Comment(s) => assert_eq!(s.as_str(), "/* hello */"),
        other => panic!("expected Comment, got {:?}", other),
    }
}

// ── Multiple rules ──────────────────────────────────────────

#[test]
fn test_multiple_rules() {
    let css = "body { margin: 0; } .container { max-width: 960px; }";
    let nodes = parse_css(css);
    assert_eq!(nodes.len(), 2);
}

// ── Benchmark file parsing ──────────────────────────────────

#[test]
fn test_parse_normalize_css() {
    let css = include_str!("../../../data/css/normalize.css");
    let nodes = parse_css(css);
    // normalize.css has ~30+ rules
    assert!(nodes.len() > 20, "expected 20+ rules, got {}", nodes.len());
}

#[test]
fn test_parse_bootstrap_css() {
    let css = include_str!("../../../data/css/bootstrap.css");
    let nodes = parse_css(css);
    // bootstrap.css has thousands of rules
    assert!(
        nodes.len() > 100,
        "expected 100+ rules, got {}",
        nodes.len()
    );
}

#[test]
#[ignore] // 3.6MB file — too slow in debug, runs in release benchmarks
fn test_parse_tailwind_css() {
    let css = include_str!("../../../data/css/tailwind-output.css");
    let nodes = parse_css(css);
    assert!(
        nodes.len() > 100,
        "expected 100+ rules, got {}",
        nodes.len()
    );
}

// ── Nested @media rules ─────────────────────────────────────

#[test]
fn test_nested_media() {
    let css = "@media screen { @media (min-width: 640px) { .sm { display: block; } } }";
    let nodes = parse_css(css);
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::AtMedia { body, .. } => {
            assert_eq!(body.len(), 1);
            match &body[0] {
                CssNode::AtMedia { body: inner, .. } => {
                    assert_eq!(inner.len(), 1);
                }
                other => panic!("expected nested AtMedia, got {:?}", other),
            }
        }
        _ => panic!("expected AtMedia"),
    }
}

// ── Edge cases ──────────────────────────────────────────────

#[test]
fn test_empty_stylesheet() {
    let nodes = parse_css("");
    assert_eq!(nodes.len(), 0);
}

#[test]
fn test_whitespace_only() {
    let nodes = parse_css("   \n\t  ");
    assert_eq!(nodes.len(), 0);
}

#[test]
fn test_custom_property_declaration() {
    let nodes = parse_css(":root { --main-color: #ff0000; }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            assert_eq!(declarations[0].property.as_str(), "--main-color");
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_negative_dimension() {
    let nodes = parse_css(".x { margin: -10px; }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            match &declarations[0].values[0] {
                CssValue::Dimension(n, u) => {
                    assert_eq!(*n, -10.0);
                    assert_eq!(u.as_str(), "px");
                }
                other => panic!("expected Dimension, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_universal_selector() {
    let nodes = parse_css("* { box-sizing: border-box; }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::QualifiedRule { selector_list, .. } => {
            match &selector_list[0] {
                CssSelector::Universal => {}
                other => panic!("expected Universal, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

// ── L1.75: Media Query parsing ──────────────────────────────

#[test]
fn test_media_query_plain_feature() {
    let nodes = parse_css("@media (color) { .x { color: red; } }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::AtMedia { queries, body } => {
            assert_eq!(queries.len(), 1);
            assert!(queries[0].modifier.is_none());
            assert!(queries[0].media_type.is_none());
            assert_eq!(queries[0].conditions.len(), 1);
            match &queries[0].conditions[0] {
                MediaCondition::Feature(MediaFeature::Plain { name, value }) => {
                    assert_eq!(name.as_str(), "color");
                    assert!(value.is_none());
                }
                other => panic!("expected Plain feature, got {:?}", other),
            }
            assert_eq!(body.len(), 1);
        }
        other => panic!("expected AtMedia, got {:?}", other),
    }
}

#[test]
fn test_media_query_screen_and_feature() {
    let nodes = parse_css("@media screen and (min-width: 768px) { .x { display: block; } }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::AtMedia { queries, .. } => {
            assert_eq!(queries.len(), 1);
            let q = &queries[0];
            assert!(q.modifier.is_none());
            assert_eq!(q.media_type.as_ref().unwrap().as_str(), "screen");
            assert_eq!(q.conditions.len(), 1);
            match &q.conditions[0] {
                MediaCondition::Feature(MediaFeature::Plain { name, value }) => {
                    assert_eq!(name.as_str(), "min-width");
                    assert!(value.is_some());
                }
                other => panic!("expected Plain feature, got {:?}", other),
            }
        }
        other => panic!("expected AtMedia, got {:?}", other),
    }
}

#[test]
fn test_media_query_not_print() {
    let nodes = parse_css("@media not print { .x { display: none; } }");
    match &nodes[0] {
        CssNode::AtMedia { queries, .. } => {
            assert_eq!(queries.len(), 1);
            assert_eq!(queries[0].modifier.as_ref().unwrap().as_str(), "not");
            assert_eq!(queries[0].media_type.as_ref().unwrap().as_str(), "print");
        }
        other => panic!("expected AtMedia, got {:?}", other),
    }
}

#[test]
fn test_media_query_list() {
    let nodes = parse_css("@media screen, print { .x { color: black; } }");
    match &nodes[0] {
        CssNode::AtMedia { queries, .. } => {
            assert_eq!(queries.len(), 2);
            assert_eq!(queries[0].media_type.as_ref().unwrap().as_str(), "screen");
            assert_eq!(queries[1].media_type.as_ref().unwrap().as_str(), "print");
        }
        other => panic!("expected AtMedia, got {:?}", other),
    }
}

#[test]
fn test_media_query_and_conditions() {
    let nodes = parse_css("@media (min-width: 768px) and (max-width: 1024px) { .x { color: red; } }");
    match &nodes[0] {
        CssNode::AtMedia { queries, .. } => {
            assert_eq!(queries.len(), 1);
            assert_eq!(queries[0].conditions.len(), 1);
            match &queries[0].conditions[0] {
                MediaCondition::And(conds) => {
                    assert_eq!(conds.len(), 2);
                }
                other => panic!("expected And condition, got {:?}", other),
            }
        }
        other => panic!("expected AtMedia, got {:?}", other),
    }
}

// ── L1.75: Supports Condition parsing ───────────────────────

#[test]
fn test_supports_declaration() {
    let nodes = parse_css("@supports (display: grid) { .x { display: grid; } }");
    assert_eq!(nodes.len(), 1);
    match &nodes[0] {
        CssNode::AtSupports { condition, body } => {
            match condition {
                SupportsCondition::Declaration { property, value } => {
                    assert_eq!(property.as_str(), "display");
                    assert!(!value.is_empty());
                }
                other => panic!("expected Declaration, got {:?}", other),
            }
            assert_eq!(body.len(), 1);
        }
        other => panic!("expected AtSupports, got {:?}", other),
    }
}

#[test]
fn test_supports_not() {
    let nodes = parse_css("@supports not (display: grid) { .x { float: left; } }");
    match &nodes[0] {
        CssNode::AtSupports { condition, .. } => {
            match condition {
                SupportsCondition::Not(inner) => {
                    match inner.as_ref() {
                        SupportsCondition::Declaration { property, .. } => {
                            assert_eq!(property.as_str(), "display");
                        }
                        other => panic!("expected Declaration, got {:?}", other),
                    }
                }
                other => panic!("expected Not, got {:?}", other),
            }
        }
        other => panic!("expected AtSupports, got {:?}", other),
    }
}

#[test]
fn test_supports_and() {
    let nodes = parse_css("@supports (display: grid) and (gap: 10px) { .x { display: grid; } }");
    match &nodes[0] {
        CssNode::AtSupports { condition, .. } => {
            match condition {
                SupportsCondition::And(conds) => {
                    assert_eq!(conds.len(), 2);
                }
                other => panic!("expected And, got {:?}", other),
            }
        }
        other => panic!("expected AtSupports, got {:?}", other),
    }
}

// ── L1.75: Specificity calculator ───────────────────────────

#[test]
fn test_specificity_type() {
    let sel = CssSelector::Type(Span::new(0, 3, "div"));
    assert_eq!(specificity(&sel), Specificity(0, 0, 1));
}

#[test]
fn test_specificity_class() {
    let sel = CssSelector::Class(Span::new(0, 4, ".foo"));
    assert_eq!(specificity(&sel), Specificity(0, 1, 0));
}

#[test]
fn test_specificity_id() {
    let sel = CssSelector::Id(Span::new(0, 4, "#bar"));
    assert_eq!(specificity(&sel), Specificity(1, 0, 0));
}

#[test]
fn test_specificity_compound() {
    // div.class#id → (1, 1, 1)
    let src = "div.class#id";
    let sel = CssSelector::Compound(vec![
        CssSelector::Type(Span::new(0, 3, src)),
        CssSelector::Class(Span::new(3, 9, src)),
        CssSelector::Id(Span::new(9, 12, src)),
    ]);
    assert_eq!(specificity(&sel), Specificity(1, 1, 1));
}

#[test]
fn test_specificity_universal() {
    assert_eq!(specificity(&CssSelector::Universal), Specificity(0, 0, 0));
}

#[test]
fn test_specificity_pseudo_where() {
    let sel = CssSelector::PseudoFunction {
        name: Span::new(0, 5, "where"),
        args: vec![CssSelector::Id(Span::new(0, 4, "#foo"))],
    };
    assert_eq!(specificity(&sel), Specificity(0, 0, 0));
}

#[test]
fn test_specificity_pseudo_is() {
    let sel = CssSelector::PseudoFunction {
        name: Span::new(0, 2, "is"),
        args: vec![
            CssSelector::Class(Span::new(0, 4, ".foo")),
            CssSelector::Id(Span::new(0, 4, "#bar")),
        ],
    };
    // :is() takes the most specific argument → (1, 0, 0)
    assert_eq!(specificity(&sel), Specificity(1, 0, 0));
}

#[test]
fn test_specificity_complex() {
    let src = "div > .x";
    let sel = CssSelector::Complex {
        left: Box::new(CssSelector::Type(Span::new(0, 3, src))),
        combinator: Span::new(4, 5, src),
        right: Box::new(CssSelector::Class(Span::new(6, 8, src))),
    };
    assert_eq!(specificity(&sel), Specificity(0, 1, 1));
}

// ── L1.75: Block comment scanner ────────────────────────────

#[test]
fn test_block_comment_fast() {
    let nodes = parse_css("/* test comment */ .x { color: red; }");
    assert_eq!(nodes.len(), 2);
    match &nodes[0] {
        CssNode::Comment(s) => assert_eq!(s.as_str(), "/* test comment */"),
        other => panic!("expected Comment, got {:?}", other),
    }
}

#[test]
fn test_block_comment_multiline() {
    let nodes = parse_css("/*\n * multi\n * line\n */ .x { color: blue; }");
    assert_eq!(nodes.len(), 2);
    match &nodes[0] {
        CssNode::Comment(s) => assert!(s.as_str().starts_with("/*")),
        other => panic!("expected Comment, got {:?}", other),
    }
}

// ── L1.75: Hex color inline scanner ─────────────────────────

#[test]
fn test_hex_color_3() {
    let nodes = parse_css(".x { color: #f00; }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            match &declarations[0].values[0] {
                CssValue::Color(CssColor::Hex(s)) => assert_eq!(s.as_str(), "#f00"),
                other => panic!("expected Hex, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}

#[test]
fn test_hex_color_8() {
    let nodes = parse_css(".x { color: #ff000080; }");
    match &nodes[0] {
        CssNode::QualifiedRule { declarations, .. } => {
            match &declarations[0].values[0] {
                CssValue::Color(CssColor::Hex(s)) => assert_eq!(s.as_str(), "#ff000080"),
                other => panic!("expected Hex, got {:?}", other),
            }
        }
        _ => panic!("expected QualifiedRule"),
    }
}
