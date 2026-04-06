use parse_that::regex::byteset::ByteSet;
use parse_that::regex::nfa::Nfa;

#[test]
fn literal_pattern() {
    let nfa = Nfa::from_pattern("abc").unwrap();
    assert!(nfa.state_count() >= 4);
}

#[test]
fn char_class_ascii() {
    let nfa = Nfa::from_pattern("[a-z]").unwrap();
    assert!(nfa.state_count() >= 2);
    let start_trans = &nfa.states[nfa.start as usize].transitions;
    assert_eq!(start_trans.len(), 1);
    let (bs, _) = &start_trans[0];
    assert!(bs.contains(b'a'));
    assert!(bs.contains(b'z'));
    assert!(!bs.contains(b'A'));
}

#[test]
fn char_class_unicode() {
    let nfa = Nfa::from_pattern(r"[\u{0100}-\u{017F}]").unwrap();
    assert!(nfa.state_count() >= 3);
}

#[test]
fn alternation() {
    let nfa = Nfa::from_pattern("cat|dog|fox").unwrap();
    assert!(nfa.state_count() >= 7);
}

#[test]
fn star_greedy() {
    let nfa = Nfa::from_pattern("a*").unwrap();
    assert!(nfa.state_count() >= 3);
}

#[test]
fn plus_lazy() {
    let nfa = Nfa::from_pattern("a+?").unwrap();
    assert!(nfa.state_count() >= 2);
}

#[test]
fn bounded_repetition() {
    let nfa = Nfa::from_pattern("[0-9]{3,5}").unwrap();
    assert!(nfa.state_count() >= 4);
}

#[test]
fn concat() {
    let nfa = Nfa::from_pattern("[a-z][0-9]").unwrap();
    assert!(nfa.state_count() >= 3);
}

#[test]
fn empty_pattern() {
    let nfa = Nfa::from_pattern("").unwrap();
    assert_eq!(nfa.start, nfa.accept);
}

#[test]
fn dot_all() {
    let nfa = Nfa::from_pattern("(?s).").unwrap();
    assert!(nfa.state_count() >= 2);
}

#[test]
fn unicode_property() {
    let nfa = Nfa::from_pattern(r"\p{L}");
    assert!(nfa.is_some());
    let nfa = nfa.unwrap();
    assert!(nfa.state_count() > 10);
}

#[test]
fn transition_byte_sets() {
    let nfa = Nfa::from_pattern("[a-z]+").unwrap();
    let sets = nfa.transition_byte_sets();
    assert!(!sets.is_empty());
    assert!(sets.iter().any(|bs| bs.contains(b'a') && bs.contains(b'z')));
}

#[test]
fn backreference_unsupported() {
    // Our parser doesn't support backreferences — parse error → None.
    let result = Nfa::from_pattern(r"(a)\1");
    assert!(result.is_none());
}
