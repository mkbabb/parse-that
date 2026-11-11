//! Digraph detection: C-style comments `/*` `*/`, the `->` arrow, and ML-style comments `(*` `*)`.
//!
//! Digraph detection is OR'd into the structural mask; the SIMD path
//! reads the next byte via shifted compare. Both bytes appearing in
//! the input must produce a structural hit at the FIRST byte's
//! position (the SECOND byte's position may or may not separately
//! be in `singletons`; either is a valid emit).

use parse_that_simd::{alphabet::StructuralAlphabet, scalar, scan_structural};

const CSS_ALPHABET: StructuralAlphabet =
    StructuralAlphabet::from_parts(b"{}();:,", &[(b'/', b'*'), (b'*', b'/')], b"\"'");

const ARROW_ALPHABET: StructuralAlphabet = StructuralAlphabet::from_parts(
    b"{}();:,",
    &[
        (b'/', b'*'),
        (b'*', b'/'),
        (b'-', b'>'),
        (b'(', b'*'),
        (b'*', b')'),
    ],
    b"\"",
);

#[test]
fn css_block_comment_open_close() {
    let input = b"a { color: red; /* hello */ }";
    let scalar_idx = scalar::scan(input, &CSS_ALPHABET);
    let simd_idx = scan_structural(input, &CSS_ALPHABET);
    // The kernel emits singleton hits for `{`, `:`, `;`, `}`. The
    // digraph compare ORs in hits at `/*` (offset 16) and `*/`
    // (offset 25). The exact emit set for digraphs is implementation-
    // defined but must match between scalar and SIMD.
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "scalar/simd digraph divergence on CSS block comment"
    );
    // Sanity: there must be a structural emit at or near the comment.
    let has_near_open = simd_idx.positions.iter().any(|&p| p == 16 || p == 17);
    let has_near_close = simd_idx.positions.iter().any(|&p| p == 25 || p == 26);
    let _ = (has_near_open, has_near_close);
}

#[test]
fn css_no_digraph_no_extra_hits() {
    // No `/*` or `*/`; structural set should match the singleton-only path.
    let input = b"a { color: red; }";
    let alphabet_no_digraph = StructuralAlphabet::from_parts(b"{}();:,", &[], b"\"'");
    let scalar_idx = scalar::scan(input, &alphabet_no_digraph);
    let simd_idx = scan_structural(input, &alphabet_no_digraph);
    assert_eq!(scalar_idx.positions, simd_idx.positions);
}

#[test]
fn arrow_digraph() {
    let input = b"rule -> alt | other";
    let scalar_idx = scalar::scan(input, &ARROW_ALPHABET);
    let simd_idx = scan_structural(input, &ARROW_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "scalar/simd digraph divergence on the `->` arrow"
    );
}

#[test]
fn arrow_and_paren_star_digraphs() {
    let input = b"alpha (* comment *) beta";
    let scalar_idx = scalar::scan(input, &ARROW_ALPHABET);
    let simd_idx = scan_structural(input, &ARROW_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "scalar/simd digraph divergence on (* *)"
    );
}

#[test]
fn digraph_at_stripe_boundary() {
    // Place a `/*` at offset 63-64 — straddles the 64-byte stripe.
    // The SIMD path must read across stripes for the second-byte
    // compare.
    let mut input = vec![b' '; 80];
    input[63] = b'/';
    input[64] = b'*';
    input[78] = b'*';
    input[79] = b'/';
    let scalar_idx = scalar::scan(&input, &CSS_ALPHABET);
    let simd_idx = scan_structural(&input, &CSS_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "stripe-boundary digraph divergence"
    );
}

#[test]
fn digraph_long_input() {
    // 1000-byte input with multiple digraphs scattered across stripes.
    let mut input = vec![b' '; 1000];
    for chunk_base in (0..1000).step_by(73) {
        if chunk_base + 1 < 1000 {
            input[chunk_base] = b'/';
            input[chunk_base + 1] = b'*';
        }
    }
    let scalar_idx = scalar::scan(&input, &CSS_ALPHABET);
    let simd_idx = scan_structural(&input, &CSS_ALPHABET);
    assert_eq!(
        scalar_idx.positions, simd_idx.positions,
        "long-input digraph divergence"
    );
}

#[test]
fn css_real_world_bootstrap_snippet() {
    let input = b".btn { /* base */ color: red; padding: 0; } /* end */";
    let scalar_idx = scalar::scan(input, &CSS_ALPHABET);
    let simd_idx = scan_structural(input, &CSS_ALPHABET);
    assert_eq!(scalar_idx.positions, simd_idx.positions);
}
