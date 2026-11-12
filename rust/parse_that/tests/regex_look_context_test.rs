//! sk-v27 LW3.RX-1b: a regex leaf reads its look-behind from the input.
//!
//! A leaf is a sticky match at the parser's offset, so `^` and `\b` depend on
//! the byte before that offset (ECMAScript `y` with `lastIndex`). The leaf
//! must hand the engine the whole input and the offset, not the suffix. The
//! expected values are the V8 + JavaScriptCore answers of
//! `rust/regex/oracle/anchors.json` (`start-at-1`, `wb-mid-at`) and
//! `wordboundary.json` (`wb-b-foo-midword`, `wb-b-foo-after-space`).

use parse_that::*;

#[test]
fn word_boundary_reads_the_byte_before_the_leaf() {
    // `/\bfoo/y` at 1 in "xfoo": no boundary between x and f.
    assert!(string("x").then(regex(r"\bfoo")).parse("xfoo").is_none());
    // At 1 in " foo": a boundary.
    assert_eq!(
        string(" ").then(regex(r"\bfoo")).parse(" foo"),
        Some((" ", "foo"))
    );
    // `/foo\b/y` at 1 in "xfoo ": boundary after foo.
    assert_eq!(
        string("x").then(regex(r"foo\b")).parse("xfoo "),
        Some(("x", "foo"))
    );
}

#[test]
fn start_anchor_holds_only_at_the_start_of_the_input() {
    // `/^a/y` at 1 in "ba": no match.
    assert!(string("b").then(regex(r"^a")).parse("ba").is_none());
    assert_eq!(regex(r"^a").parse("a"), Some("a"));
}

#[test]
fn span_leaf_reads_the_byte_before_too() {
    assert!(
        string("x")
            .then(regex_span(r"\bfoo"))
            .parse("xfoo")
            .is_none()
    );
    let (_, span) = string(" ")
        .then(regex_span(r"\bfoo"))
        .parse(" foo")
        .expect("boundary after a space");
    assert_eq!((span.start, span.end), (1, 4));
}
