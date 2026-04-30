use parse_that::regex::hir::{ByteRange, CharClass, CodepointRange, Hir, ParseOptions, Repetition};
use parse_that::regex::parser::{parse, parse_with};

fn p(s: &str) -> Hir {
    parse(s).unwrap_or_else(|e| panic!("parse({:?}) failed: {}", s, e))
}

#[test]
fn empty() {
    assert_eq!(p(""), Hir::Empty);
}

#[test]
fn literal() {
    assert_eq!(
        p("abc"),
        Hir::Concat(vec![
            Hir::Literal(vec![b'a']),
            Hir::Literal(vec![b'b']),
            Hir::Literal(vec![b'c']),
        ])
    );
}

#[test]
fn char_class() {
    match p("[a-z]") {
        Hir::Class(CharClass::Bytes { ranges, negated }) => {
            assert!(!negated);
            assert_eq!(ranges, vec![ByteRange::new(b'a', b'z')]);
        }
        other => panic!("expected Bytes class, got {:?}", other),
    }
}

#[test]
fn negated_class() {
    match p("[^abc]") {
        Hir::Class(CharClass::Bytes { negated, .. }) => assert!(negated),
        other => panic!("expected negated Bytes class, got {:?}", other),
    }
}

#[test]
fn alternation() {
    match p("a|b|c") {
        Hir::Alternation(branches) => assert_eq!(branches.len(), 3),
        other => panic!("expected Alternation, got {:?}", other),
    }
}

#[test]
fn quantifiers() {
    match p("a*") {
        Hir::Repetition(Repetition {
            min: 0,
            max: None,
            greedy: true,
            ..
        }) => {}
        other => panic!("expected star, got {:?}", other),
    }
    match p("a+") {
        Hir::Repetition(Repetition {
            min: 1,
            max: None,
            greedy: true,
            ..
        }) => {}
        other => panic!("expected plus, got {:?}", other),
    }
    match p("a?") {
        Hir::Repetition(Repetition {
            min: 0,
            max: Some(1),
            greedy: true,
            ..
        }) => {}
        other => panic!("expected optional, got {:?}", other),
    }
}

#[test]
fn lazy_quantifier() {
    match p("a*?") {
        Hir::Repetition(Repetition {
            min: 0,
            max: None,
            greedy: false,
            ..
        }) => {}
        other => panic!("expected lazy star, got {:?}", other),
    }
}

#[test]
fn bounded_repetition() {
    match p("a{3,5}") {
        Hir::Repetition(Repetition {
            min: 3,
            max: Some(5),
            ..
        }) => {}
        other => panic!("expected {{3,5}}, got {:?}", other),
    }
}

#[test]
fn non_capturing_group() {
    match p("(?:abc)") {
        Hir::Group(inner) => {
            assert!(matches!(*inner, Hir::Concat(_)));
        }
        other => panic!("expected Group, got {:?}", other),
    }
}

#[test]
fn dotall_flag_unicode() {
    // (?s). in unicode mode → Unicode class matching all codepoints.
    match p("(?s).") {
        Hir::Concat(items) => {
            assert_eq!(items.len(), 2); // Empty (from flag group) + dot
            match &items[1] {
                Hir::Class(CharClass::Unicode {
                    ranges,
                    negated: false,
                }) => {
                    assert_eq!(ranges[0], CodepointRange::new('\0', '\u{10FFFF}'));
                }
                other => panic!("expected Unicode class for dotall, got {:?}", other),
            }
        }
        other => panic!("expected Concat, got {:?}", other),
    }
}

#[test]
fn dotall_flag_byte_mode() {
    // (?s). in byte mode → Bytes class matching all bytes.
    let hir = parse_with("(?s).", &ParseOptions::byte_mode()).unwrap();
    match hir {
        Hir::Concat(items) => match &items[1] {
            Hir::Class(CharClass::Bytes {
                ranges,
                negated: false,
            }) => {
                assert_eq!(ranges[0], ByteRange::new(0, 255));
            }
            other => panic!("expected Bytes class for dotall byte mode, got {:?}", other),
        },
        other => panic!("expected Concat, got {:?}", other),
    }
}

#[test]
fn shorthand_classes() {
    match p(r"\d") {
        Hir::Class(CharClass::Bytes {
            ranges,
            negated: false,
        }) => {
            assert_eq!(ranges, vec![ByteRange::new(b'0', b'9')]);
        }
        other => panic!("expected digit class, got {:?}", other),
    }
    match p(r"\w") {
        Hir::Class(CharClass::Bytes {
            ranges,
            negated: false,
        }) => {
            assert_eq!(ranges.len(), 4); // 0-9, A-Z, _, a-z
        }
        other => panic!("expected word class, got {:?}", other),
    }
}

#[test]
fn escaped_literal() {
    assert_eq!(p(r"\."), Hir::Literal(vec![b'.']));
    assert_eq!(p(r"\\"), Hir::Literal(vec![b'\\']));
    assert_eq!(p(r"\/"), Hir::Literal(vec![b'/']));
}

#[test]
fn json_number() {
    // The canonical JSON number pattern should parse without error.
    let _hir = p(r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?");
}

#[test]
fn json_string() {
    let _hir = p(r#""(?:[^"\\]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*""#);
}

#[test]
fn css_ws_comment() {
    let _hir = p(r"(?s)(?:\s|/\*.*?\*/)*");
}

#[test]
fn css_ident() {
    let _hir = p(r"[a-zA-Z_][\w-]*");
}

#[test]
fn complex_ident() {
    let _hir = p(r"[\-]?[a-zA-Z_][\w-]*|--[\w-]+");
}

#[test]
fn quoted_string() {
    let _hir = p(r#""(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'"#);
}

#[test]
fn hex_color() {
    let _hir = p(r"[0-9a-fA-F]{3,8}");
}

#[test]
fn byte_mode() {
    let hir = parse_with(r"\w", &ParseOptions::byte_mode()).unwrap();
    match hir {
        Hir::Class(CharClass::Bytes { ranges, .. }) => {
            // Byte mode: \w = [0-9A-Za-z_]
            assert_eq!(ranges.len(), 4);
        }
        other => panic!("expected Bytes class in byte mode, got {:?}", other),
    }
}

#[test]
fn dot_default() {
    match p(".") {
        Hir::Class(CharClass::Bytes {
            negated: true,
            ranges,
        }) => {
            assert_eq!(ranges, vec![ByteRange::new(b'\n', b'\n')]);
        }
        other => panic!("expected negated class for dot, got {:?}", other),
    }
}
