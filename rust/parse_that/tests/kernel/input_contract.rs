use parse_that::Input;

#[test]
fn input_borrows_the_callers_bytes_without_copying() {
    let bytes = b"alpha";
    let input = Input::new(bytes);

    assert_eq!(input.bytes(), bytes);
    assert_eq!(input.bytes().as_ptr(), bytes.as_ptr());
    assert_eq!(input.len(), bytes.len());
    assert!(!input.is_empty());
}

#[test]
fn cursors_are_checked_and_include_the_one_past_end_position() {
    let input = Input::new(b"abc");

    assert_eq!(input.start().offset(), 0);
    assert_eq!(input.end().offset(), 3);
    assert_eq!(input.cursor_at(2).expect("in-bounds cursor").offset(), 2);
    assert!(input.cursor_at(4).is_err());
}

#[test]
fn spans_are_checked_ordered_and_bound_to_their_source() {
    let input = Input::new(b"abcdef");
    let start = input.cursor_at(1).expect("start");
    let end = input.cursor_at(4).expect("end");
    let span = input.span(start, end).expect("checked span");

    assert_eq!(span.start(), 1);
    assert_eq!(span.end(), 4);
    assert_eq!(span.as_bytes(), b"bcd");

    assert!(input.span(end, start).is_err(), "reversed span");

    let other = Input::new(b"uvwxyz");
    assert!(
        input.span(other.start(), other.end()).is_err(),
        "cursors from another source must not form a span"
    );
}

#[test]
fn span_equality_is_interval_and_source_identity_not_whole_input_content() {
    let left_bytes = Vec::from(b"same");
    let right_bytes = Vec::from(b"same");
    let left = Input::new(&left_bytes);
    let right = Input::new(&right_bytes);

    let left_span = left.span(left.start(), left.end()).expect("left span");
    let right_span = right.span(right.start(), right.end()).expect("right span");

    assert_ne!(left_span, right_span);
    assert_eq!(left_span, left_span);
}

#[test]
fn reborrowed_nonempty_byte_region_retains_the_same_source_identity() {
    let bytes = Vec::from(&b"abc"[..]);
    let first = Input::new(&bytes);
    let second = Input::new(&bytes);

    assert_eq!(first.start(), second.start());
    assert_eq!(first.end(), second.end());
    assert!(
        first.span(second.start(), second.end()).is_ok(),
        "the same live nonempty byte region is one safe source"
    );
}

#[test]
fn distinct_empty_inputs_retain_distinct_cursor_and_span_provenance() {
    let left_bytes = Vec::new();
    let right_bytes = Vec::new();
    let left = Input::new(&left_bytes);
    let right = Input::new(&right_bytes);

    assert_ne!(left.start(), right.start());
    assert!(
        left.span(right.start(), right.end()).is_err(),
        "zero-length cursors from another Input must remain foreign"
    );

    let left_span = left.span(left.start(), left.end()).expect("left span");
    let right_span = right.span(right.start(), right.end()).expect("right span");
    assert_ne!(left_span, right_span);
}

#[test]
fn source_identity_is_absent_from_deterministic_debug_output() {
    let first = Input::new(b"abc");
    let second = Input::new(b"abc");

    assert_eq!(format!("{first:?}"), "Input { len: 3, .. }");
    assert_eq!(format!("{first:?}"), format!("{second:?}"));
    assert_eq!(
        format!("{:?}", first.cursor_at(1).expect("cursor")),
        "Cursor { source_len: 3, offset: 1 }"
    );
    assert_eq!(
        format!(
            "{:?}",
            first.span(first.start(), first.end()).expect("span")
        ),
        "Span { start: 0, end: 3 }"
    );
}
