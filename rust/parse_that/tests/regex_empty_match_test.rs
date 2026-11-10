//! sk-v27 LW2 S4-B: a zero-length regex match is a match (the TS `regex`
//! leaf's contract, R-b parity), and progress is the combinators' duty.
//!
//! Each repetition runs on a worker thread with a deadline, so a regression
//! to an unguarded loop fails the test instead of hanging the suite.

use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use parse_that::*;

fn within_deadline<T: Send + 'static>(f: impl FnOnce() -> T + Send + 'static) -> T {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let _ = tx.send(f());
    });
    rx.recv_timeout(Duration::from_secs(10))
        .expect("repetition over an empty-matching leaf did not terminate")
}

#[test]
fn regex_empty_match_is_a_match() {
    let (result, state) = regex(r"a*").parse_return_state("bbb");
    assert_eq!(result, Some(""));
    assert_eq!(state.offset, 0);
}

#[test]
fn regex_span_empty_match_is_a_match() {
    let (result, state) = regex_span(r"[ \t]*").parse_return_state("x");
    let span = result.expect("empty match");
    assert_eq!((span.start, span.end), (0, 0));
    assert_eq!(state.offset, 0);
}

#[test]
fn regex_empty_match_at_end_of_input() {
    assert_eq!(regex(r"\s*").parse(""), Some(""));
    assert_eq!(regex(r"a+").parse(""), None);
}

#[test]
fn regex_nonempty_match_unchanged() {
    let (result, state) = regex(r"a*").parse_return_state("aab");
    assert_eq!(result, Some("aa"));
    assert_eq!(state.offset, 2);
}

#[test]
fn many_over_empty_matching_regex_terminates() {
    let n = within_deadline(|| regex(r"a*").many(0..).parse("bbb").map(|v| v.len()));
    assert_eq!(n, Some(1));
    let n = within_deadline(|| {
        regex(r"a*")
            .many_small::<[&str; 4]>(0..)
            .parse("bbb")
            .map(|v| v.len())
    });
    assert_eq!(n, Some(1));
}

#[test]
fn sep_by_with_empty_matching_elem_and_sep_terminates() {
    let n = within_deadline(|| {
        regex(r"a*")
            .sep_by(regex(r",*"), 0..)
            .parse("bbb")
            .map(|v| v.len())
    });
    assert_eq!(n, Some(1));
    let n = within_deadline(|| {
        regex(r"a*")
            .sep_by_small::<_, [&str; 4]>(regex(r",*"), 0..)
            .parse("bbb")
            .map(|v| v.len())
    });
    assert_eq!(n, Some(1));
    let n = within_deadline(|| {
        regex(r"a*")
            .sep_by_ws(regex(r",*"), 0..)
            .parse("bbb")
            .map(|v| v.len())
    });
    assert_eq!(n, Some(1));
    let n = within_deadline(|| {
        regex(r"a*")
            .sep_by_ws_until(regex(r",*"), 0.., b"}")
            .parse("bbb")
            .map(|v| v.len())
    });
    assert_eq!(n, Some(1));
}

#[test]
fn sep_by_progress_still_collects_elements() {
    let v = within_deadline(|| {
        regex(r"a*")
            .sep_by(string(","), 0..)
            .parse("aa,,a")
            .map(|v| v.into_iter().map(str::to_owned).collect::<Vec<_>>())
    });
    assert_eq!(v, Some(vec!["aa".into(), "".into(), "a".into()]));
}

#[test]
fn span_sep_by_over_empty_matching_leaf_terminates() {
    let r = within_deadline(|| {
        sp_regex(r"a*")
            .sep_by_span(sp_regex(r",*"), 0..)
            .into_parser()
            .parse("bbb")
            .map(|s| (s.start, s.end))
    });
    assert_eq!(r, Some((0, 0)));
    let r = within_deadline(|| {
        sp_regex(r"a*")
            .sep_by_ws_span(sp_regex(r",*"), 0..)
            .into_parser()
            .parse("bbb")
            .map(|s| (s.start, s.end))
    });
    assert_eq!(r, Some((0, 0)));
}
