use std::time::{Duration, Instant};

use bbnf_regex::automata::dfa::{Dfa, DfaOptions};
use bbnf_regex::automata::nfa::DEAD;

const MAX_DFA_STATES: usize = 64;
const MAX_TRANSITIONS: usize = 4096;
const MAX_WALL: Duration = Duration::from_millis(250);

#[test]
fn start_assertion_rejects_nonzero_offset() {
    let dfa = Dfa::compile("^a").expect("^a must compile");
    assert_eq!(dfa.find_at(b"a", 0), Some(1));
    assert_eq!(
        dfa.find_at(b"xa", 1),
        None,
        "^ must assert absolute input start"
    );
}

#[test]
fn end_assertion_rejects_trailing_input() {
    let dfa = Dfa::compile("a$").expect("a$ must compile");
    assert_eq!(dfa.find_at(b"a", 0), Some(1));
    assert_eq!(
        dfa.find_at(b"ab", 0),
        None,
        "$ must assert absolute input end"
    );
}

#[test]
fn multiline_anchors_match_only_at_line_boundaries() {
    let dfa = Dfa::compile("(?m)^a$").expect("multiline anchors must compile");
    let input = b"x\na\ny";
    assert_eq!(dfa.find_at(input, 0), None);
    assert_eq!(dfa.find_at(input, 2), Some(3));
    assert_eq!(dfa.find_at(input, 3), None);
}

#[test]
fn alternation_preserves_left_branch_priority() {
    let dfa = Dfa::compile("a|ab").expect("ordered alternation must compile");
    assert_eq!(
        dfa.find_at(b"ab", 0),
        Some(1),
        "the first successful branch must win even when a later branch is longer"
    );
}

#[test]
fn lazy_and_greedy_repetition_have_distinct_match_order() {
    let lazy = Dfa::compile("a.*?b").expect("lazy pattern must compile");
    let greedy = Dfa::compile("a.*b").expect("greedy pattern must compile");
    let input = b"aXbYb";

    assert_eq!(greedy.find_at(input, 0), Some(5));
    assert_eq!(
        lazy.find_at(input, 0),
        Some(3),
        "lazy repetition must accept the first ordered closing branch"
    );
}

#[test]
fn unicode_word_class_accepts_non_ascii_letters() {
    let dfa = Dfa::compile(r"\w").expect("Unicode word class must compile");
    assert_eq!(dfa.find_at("β".as_bytes(), 0), Some("β".len()));
}

#[test]
fn unicode_letter_property_rejects_emoji() {
    let dfa = Dfa::compile(r"\p{L}").expect("Unicode letter property must compile");
    assert_eq!(dfa.find_at("β".as_bytes(), 0), Some("β".len()));
    assert_eq!(
        dfa.find_at("😀".as_bytes(), 0),
        None,
        "emoji is not in the Unicode Letter general category"
    );
}

#[test]
fn nullable_repetition_terminates_within_explicit_limits() {
    let started = Instant::now();
    let opts = DfaOptions {
        state_limit: MAX_DFA_STATES,
        minimize: false,
        unicode: true,
    };
    let long_input = vec![b'a'; MAX_TRANSITIONS];

    for (pattern, input, expected) in [
        ("(?:)*", b"x".as_slice(), Some(0)),
        ("(a?)*", long_input.as_slice(), Some(MAX_TRANSITIONS)),
    ] {
        let dfa = Dfa::compile_with(pattern, &opts)
            .unwrap_or_else(|| panic!("{pattern:?} exceeded the {MAX_DFA_STATES}-state budget"));
        assert!(dfa.state_count() <= MAX_DFA_STATES);

        let (bounded, transitions) = find_at_bounded(&dfa, input, 0, MAX_TRANSITIONS)
            .unwrap_or_else(|used| panic!("{pattern:?} exceeded {used} transitions"));
        assert_eq!(bounded, expected, "bounded result for {pattern:?}");
        assert_eq!(
            dfa.find_at(input, 0),
            expected,
            "public result for {pattern:?}"
        );
        assert!(transitions <= MAX_TRANSITIONS);
    }

    assert!(
        started.elapsed() <= MAX_WALL,
        "nullable controls exceeded the {MAX_WALL:?} wall"
    );
}

fn find_at_bounded(
    dfa: &Dfa,
    bytes: &[u8],
    offset: usize,
    max_transitions: usize,
) -> Result<(Option<usize>, usize), usize> {
    let num_classes = dfa.num_classes as usize;
    let mut state = 0_u32;
    let mut pos = offset;
    let mut transitions = 0;
    let mut last_accept = dfa.states[0].is_accept.then_some(pos);

    while pos < bytes.len() {
        if transitions == max_transitions {
            return Err(transitions + 1);
        }
        transitions += 1;

        let class = dfa.byte_classes[bytes[pos] as usize] as usize;
        let next = dfa.flat_transitions[state as usize * num_classes + class];
        if next == DEAD {
            break;
        }
        state = next;
        pos += 1;
        if dfa.states[state as usize].is_accept {
            last_accept = Some(pos);
        }
    }

    Ok((last_accept, transitions))
}
