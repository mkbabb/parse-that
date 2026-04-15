// Integration tests for scan_ws_block_comments bitmap path.

use parse_that::{ParserState, scan_ws_block_comments};

fn scan(input: &str) -> (usize, String) {
    let mut state = ParserState::new(input);
    let span = scan_ws_block_comments(&mut state).unwrap();
    (state.offset, input[span.start..span.end].to_string())
}

#[test]
fn empty_input() {
    let (off, consumed) = scan("");
    assert_eq!(off, 0);
    assert_eq!(consumed, "");
}

#[test]
fn no_ws() {
    let (off, consumed) = scan("foo");
    assert_eq!(off, 0);
    assert_eq!(consumed, "");
}

#[test]
fn simple_ws() {
    let (off, consumed) = scan("   foo");
    assert_eq!(off, 3);
    assert_eq!(consumed, "   ");
}

#[test]
fn tabs_and_newlines() {
    let (off, consumed) = scan(" \t\n\r foo");
    assert_eq!(off, 5);
    assert_eq!(consumed, " \t\n\r ");
}

#[test]
fn slash_without_comment() {
    let (off, _) = scan("/foo");
    assert_eq!(off, 0);
}

#[test]
fn simple_block_comment() {
    let (off, _) = scan("/* hi */x");
    assert_eq!(off, 8);
}

#[test]
fn ws_then_comment_then_ws() {
    let (off, _) = scan("  /* hi */  x");
    assert_eq!(off, 12);
}

#[test]
fn multiple_comments() {
    let (off, _) = scan("/*a*/ /*b*/x");
    assert_eq!(off, 11);
}

#[test]
fn nested_star_in_comment() {
    let (off, _) = scan("/* * */x");
    assert_eq!(off, 7);
}

#[test]
fn long_ws_crossing_stripe() {
    let input = format!("{}foo", " ".repeat(100));
    let (off, _) = scan(&input);
    assert_eq!(off, 100);
}

#[test]
fn long_comment_crossing_stripe() {
    let body: String = (0..100).map(|_| 'a').collect();
    let input = format!("/*{}*/x", body);
    let (off, _) = scan(&input);
    assert_eq!(off, 104);
}

#[test]
fn ws_slash_non_star() {
    // A `/` not followed by `*` terminates — scan stops at `/`.
    let (off, _) = scan("   /foo");
    assert_eq!(off, 3);
}

#[test]
fn ws_slash_then_x() {
    let (off, _) = scan(" /");
    assert_eq!(off, 1);
}

#[test]
fn unterminated_comment() {
    let input = "/* hello world";
    let (off, _) = scan(input);
    assert_eq!(off, input.len());
}

#[test]
fn stripe_boundary_ws_slash() {
    // Pack exactly 62 ws, then `/a` — `/` is not followed by `*`,
    // scan should terminate at position 62.
    let input = format!("{}/{}", " ".repeat(62), "a");
    let (off, _) = scan(&input);
    assert_eq!(off, 62);
}

#[test]
fn stripe_boundary_comment() {
    // 62 ws + `/*xxx*/` spanning stripe boundary.
    let input = format!("{}/*xxx*/y", " ".repeat(62));
    let (off, _) = scan(&input);
    assert_eq!(off, 62 + 7);
}

#[test]
fn all_slash_stripe_terminates() {
    // 64 `/` with no `*`: scan terminates at idx 0 because the
    // first `/` is not followed by `*`.
    let input = format!("{}", "/".repeat(64));
    let (off, _) = scan(&input);
    assert_eq!(off, 0);
}

#[test]
fn exact_stripe_all_ws() {
    let input = format!("{}x", " ".repeat(64));
    let (off, _) = scan(&input);
    assert_eq!(off, 64);
}
