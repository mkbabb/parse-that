//! Correctness gate: every kernel must produce identical
//! `StructuralIndex` on the canonical corpus. Scalar path is the
//! reference; per-arch paths must match byte-for-byte.

use parse_that_simd::{StructuralIndex, alphabet::StructuralAlphabet, scalar, scan_structural};

const JSON_ALPHABET: StructuralAlphabet = StructuralAlphabet::from_parts(b"{}[]:,\"\\", &[], b"\"");

const JSON_NO_QUOTES: StructuralAlphabet = StructuralAlphabet::from_parts(b"{}[]:,", &[], &[]);

const CSS_ALPHABET: StructuralAlphabet =
    StructuralAlphabet::from_parts(b"{}();:,", &[(b'/', b'*'), (b'*', b'/')], b"\"'");

fn read_corpus(name: &str) -> Vec<u8> {
    parse_that_corpus::read(name)
}

fn assert_indices_equal(a: &StructuralIndex, b: &StructuralIndex, ctx: &str) {
    assert_eq!(
        a.positions.len(),
        b.positions.len(),
        "{ctx}: position count mismatch (scalar={}, simd={})",
        a.positions.len(),
        b.positions.len()
    );
    for (i, (&p, &k)) in a.positions.iter().zip(a.kinds.iter()).enumerate() {
        assert_eq!(
            (p, k),
            (b.positions[i], b.kinds[i]),
            "{ctx}: divergence at index {i}",
        );
    }
}

#[test]
fn empty_alphabet_yields_empty_index() {
    let input = b"abcdefghijklmnopqrstuvwxyz";
    let alphabet = StructuralAlphabet::EMPTY;
    let scalar_idx = scalar::scan(input, &alphabet);
    let simd_idx = scan_structural(input, &alphabet);
    assert!(scalar_idx.is_empty());
    assert!(simd_idx.is_empty());
}

#[test]
fn empty_input_yields_empty_index() {
    let scalar_idx = scalar::scan(&[], &JSON_ALPHABET);
    let simd_idx = scan_structural(&[], &JSON_ALPHABET);
    assert!(scalar_idx.is_empty());
    assert!(simd_idx.is_empty());
}

#[test]
fn short_input_below_stripe() {
    let input = b"{\"a\":1}";
    let scalar_idx = scalar::scan(input, &JSON_ALPHABET);
    let simd_idx = scan_structural(input, &JSON_ALPHABET);
    assert_indices_equal(&scalar_idx, &simd_idx, "short_input");
}

#[test]
fn no_quotes_simple() {
    let input = b"{a,b,c:[1,2,3]}";
    let scalar_idx = scalar::scan(input, &JSON_NO_QUOTES);
    let simd_idx = scan_structural(input, &JSON_NO_QUOTES);
    assert_indices_equal(&scalar_idx, &simd_idx, "no_quotes_simple");
    // Spot-check positions: { , , , : [ , , ] }
    let expected: Vec<u32> = vec![0, 2, 4, 6, 7, 9, 11, 13, 14];
    assert_eq!(simd_idx.positions, expected);
}

#[test]
fn json_twitter_canonical() {
    let input = read_corpus("json/twitter.json");
    let scalar_idx = scalar::scan(&input, &JSON_ALPHABET);
    let simd_idx = scan_structural(&input, &JSON_ALPHABET);
    assert_indices_equal(&scalar_idx, &simd_idx, "twitter.json");
    assert!(!scalar_idx.is_empty(), "twitter must have structural bytes");
}

#[test]
fn json_citm_canonical() {
    let input = read_corpus("json/citm_catalog.json");
    let scalar_idx = scalar::scan(&input, &JSON_ALPHABET);
    let simd_idx = scan_structural(&input, &JSON_ALPHABET);
    assert_indices_equal(&scalar_idx, &simd_idx, "citm_catalog.json");
}

#[test]
fn json_canada_canonical() {
    let input = read_corpus("json/canada.json");
    let scalar_idx = scalar::scan(&input, &JSON_ALPHABET);
    let simd_idx = scan_structural(&input, &JSON_ALPHABET);
    assert_indices_equal(&scalar_idx, &simd_idx, "canada.json");
}

#[test]
fn css_bootstrap_canonical() {
    let input = read_corpus("css/bootstrap.css");
    let scalar_idx = scalar::scan(&input, &CSS_ALPHABET);
    let simd_idx = scan_structural(&input, &CSS_ALPHABET);
    assert_indices_equal(&scalar_idx, &simd_idx, "bootstrap.css");
}

#[test]
fn css_tailwind_output_canonical() {
    let input = read_corpus("css/tailwind-output.css");
    let scalar_idx = scalar::scan(&input, &CSS_ALPHABET);
    let simd_idx = scan_structural(&input, &CSS_ALPHABET);
    assert_indices_equal(&scalar_idx, &simd_idx, "tailwind-output.css");
}

#[test]
fn wide_lut_alphabet_15_singletons() {
    let alphabet: StructuralAlphabet = StructuralAlphabet::from_parts(b"abcdefghijklmno", &[], &[]);
    let input = b"the quick brown fox jumps over the lazy dog";
    let scalar_idx = scalar::scan(input, &alphabet);
    let simd_idx = scan_structural(input, &alphabet);
    assert_indices_equal(&scalar_idx, &simd_idx, "wide_lut");
}

#[test]
fn multi_cmp_alphabet_20_singletons() {
    let alphabet: StructuralAlphabet =
        StructuralAlphabet::from_parts(b"abcdefghijklmnopqrst", &[], &[]);
    let input = b"the quick brown fox jumps over the lazy dog";
    let scalar_idx = scalar::scan(input, &alphabet);
    let simd_idx = scan_structural(input, &alphabet);
    assert_indices_equal(&scalar_idx, &simd_idx, "multi_cmp");
}

#[test]
fn stripe_boundary_64_byte_input() {
    // Exactly one stripe; the kernel takes the stripe path and skips
    // the tail.
    let input = b"{abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+abcdefghijklmn,";
    assert_eq!(input.len(), 64);
    let scalar_idx = scalar::scan(input, &JSON_NO_QUOTES);
    let simd_idx = scan_structural(input, &JSON_NO_QUOTES);
    assert_indices_equal(&scalar_idx, &simd_idx, "stripe_boundary_64");
}

#[test]
fn stripe_plus_one_input() {
    // 65 bytes — one stripe + one byte tail. Exercises the
    // tail-handling branch.
    let mut input = vec![b'a'; 65];
    input[0] = b'{';
    input[63] = b',';
    input[64] = b'}';
    let scalar_idx = scalar::scan(&input, &JSON_NO_QUOTES);
    let simd_idx = scan_structural(&input, &JSON_NO_QUOTES);
    assert_indices_equal(&scalar_idx, &simd_idx, "stripe_plus_one");
}
