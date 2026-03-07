use parse_that::parsers::css::*;
use parse_that::state::ParserState;

fn parse_css(input: &str) -> Vec<CssNode<'_>> {
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
        CssNode::AtMedia { prelude, body } => {
            assert!(prelude.as_str().contains("max-width"));
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
