use parse_that::split_balanced;

#[test]
fn no_delimiter() {
    assert_eq!(
        split_balanced("no commas here", b','),
        vec!["no commas here"]
    );
}

#[test]
fn basic_split() {
    assert_eq!(split_balanced("a, b, c", b','), vec!["a", " b", " c"]);
}

#[test]
fn nested_parens() {
    assert_eq!(
        split_balanced(":is(.a, .b), .c", b','),
        vec![":is(.a, .b)", " .c"],
    );
}

#[test]
fn nested_brackets() {
    assert_eq!(
        split_balanced(r#"[attr="x,y"], .z"#, b','),
        vec![r#"[attr="x,y"]"#, " .z"],
    );
}

#[test]
fn quoted_strings() {
    assert_eq!(split_balanced(r#""a,b", c"#, b','), vec![r#""a,b""#, " c"],);
}

#[test]
fn single_quoted_strings() {
    assert_eq!(split_balanced("'a,b', c", b','), vec!["'a,b'", " c"],);
}

#[test]
fn deep_nesting() {
    assert_eq!(
        split_balanced(":is(:not(.a, .b), .c), .d", b','),
        vec![":is(:not(.a, .b), .c)", " .d"],
    );
}

#[test]
fn empty_segments() {
    assert_eq!(split_balanced(",a,,b,", b','), vec!["", "a", "", "b", ""]);
}

#[test]
fn single_char() {
    assert_eq!(split_balanced(",", b','), vec!["", ""]);
}

#[test]
fn empty_input() {
    assert_eq!(split_balanced("", b','), vec![""]);
}

#[test]
fn mixed_nesting_and_quotes() {
    // CSS-like: :is(.a, .b), [data-x="1,2"], 'hello, world'
    assert_eq!(
        split_balanced(r#":is(.a, .b), [data-x="1,2"], 'hello, world'"#, b','),
        vec![":is(.a, .b)", r#" [data-x="1,2"]"#, " 'hello, world'"],
    );
}
