use parse_that::parsers::scan::quote_parity::{
    compute_in_string_bitmap, filter_quote_parity, prefix_xor,
};
use parse_that::{INPUT_PAD_BYTES, PaddedView};

/// Build a padded buffer mirroring `ParserState::new`: the first
/// `input.len()` bytes are the public input; the next
/// [`INPUT_PAD_BYTES`] bytes are NUL.
fn padded_buf(input: &[u8]) -> Vec<u8> {
    let mut v = Vec::with_capacity(input.len() + INPUT_PAD_BYTES);
    v.extend_from_slice(input);
    v.resize(input.len() + INPUT_PAD_BYTES, 0);
    v
}

fn collect_in_string(input: &[u8]) -> Vec<bool> {
    let buf = padded_buf(input);
    let view = PaddedView::new(&buf, input.len());
    let mut out = vec![false; input.len()];
    compute_in_string_bitmap(view, |offset, in_string, _| {
        for i in 0..64 {
            let pos = offset + i;
            if pos < input.len() {
                out[pos] = (in_string >> i) & 1 == 1;
            }
        }
    });
    out
}

#[test]
fn prefix_xor_basic() {
    assert_eq!(prefix_xor(0), 0);
    assert_eq!(prefix_xor(1), !0u64);
}

#[test]
fn no_strings() {
    let input = b"[1,2,3]";
    let got = collect_in_string(input);
    assert_eq!(got, vec![false; input.len()]);
}

#[test]
fn simple_string() {
    let input = b"{ \"key\": 1 }";
    let got = collect_in_string(input);
    // simdjson convention (prefix-xor of unescaped quote positions):
    // opening quote → bit is set (inside starts here).
    // closing quote → bit flips back to 0 (outside resumes).
    assert_eq!(got[0], false);
    assert_eq!(got[1], false);
    assert_eq!(got[2], true);  // opening quote (inside from here)
    assert_eq!(got[3], true);  // 'k'
    assert_eq!(got[4], true);  // 'e'
    assert_eq!(got[5], true);  // 'y'
    assert_eq!(got[6], false); // closing quote (outside resumes)
    assert_eq!(got[7], false);
}

#[test]
fn escaped_quote() {
    // { " k \ " y " : 1 }
    // 0 1 2 3 4 5 6 7 8 9
    let input = br#"{"k\"y":1}"#;
    let got = collect_in_string(input);
    assert_eq!(got[0], false); // {
    assert_eq!(got[1], true);  // opening " (inside starts here)
    assert_eq!(got[2], true);  // k
    assert_eq!(got[3], true);  // \
    assert_eq!(got[4], true);  // escaped "
    assert_eq!(got[5], true);  // y
    assert_eq!(got[6], false); // closing " (outside resumes)
    assert_eq!(got[7], false); // :
    assert_eq!(got[8], false); // 1
    assert_eq!(got[9], false); // }
}

#[test]
fn filter_basic() {
    let input = b"{\"key\":1}";
    let buf = padded_buf(input);
    let view = PaddedView::new(&buf, input.len());
    let mut positions = vec![0, 1, 2, 3, 4, 5, 6, 7, 8];
    filter_quote_parity(view, &mut positions);
    assert_eq!(positions, vec![0, 1, 5, 6, 7, 8]);
}

#[test]
fn filter_no_strings() {
    let input = b"[1,2,3]";
    let buf = padded_buf(input);
    let view = PaddedView::new(&buf, input.len());
    let mut positions = vec![0, 2, 4, 6];
    filter_quote_parity(view, &mut positions);
    assert_eq!(positions, vec![0, 2, 4, 6]);
}

#[test]
fn long_no_escape() {
    // Opening quote at idx 1; closing at idx (prefix.len() + body.len()).
    // Opening quote (idx 1) is inside; interior bytes inside; closing
    // quote flips back to outside.
    let prefix = "{\"";
    let body: String = (0..200).map(|_| 'a').collect();
    let suffix = "\":1}";
    let input = format!("{}{}{}", prefix, body, suffix);
    let got = collect_in_string(input.as_bytes());
    let close_idx = prefix.len() + body.len();
    // Opening quote bit is set (inside).
    assert!(got[1], "opening quote should be inside");
    for i in prefix.len()..close_idx {
        assert!(got[i], "expected idx {i} inside string");
    }
    // Closing quote toggles off.
    assert!(!got[close_idx], "closing quote should toggle outside");
    assert!(!got[close_idx + 1]);
}
