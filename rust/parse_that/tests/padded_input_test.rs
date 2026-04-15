//! Tests for the 64-byte-padded input buffer invariant (AU.6.1).
//!
//! `ParserState::new` allocates an owned, 64-byte-aligned copy of the
//! input with [`INPUT_PAD_BYTES`] trailing zero bytes. The padded view
//! is exposed via `state.padded_bytes()` for SIMD kernels that want to
//! elide the per-chunk `i + STRIDE <= len` tail bounds check. The
//! public `src` / `src_bytes` views must continue to report the
//! original length — padding is never leaked to consumers that compute
//! byte offsets against `input.len()`.

use parse_that::state::{INPUT_PAD_BYTES, ParserState};

fn check_padding_invariants(src: &str) {
    let state = ParserState::new(src);
    let padded = state.padded_bytes();

    assert_eq!(state.end, src.len(), "state.end mirrors input length");
    assert_eq!(state.src_bytes.len(), src.len(), "src_bytes unchanged");
    assert_eq!(
        padded.len(),
        src.len() + INPUT_PAD_BYTES,
        "padded_bytes extends by exactly INPUT_PAD_BYTES",
    );
    assert_eq!(
        &padded[..src.len()],
        src.as_bytes(),
        "padded prefix mirrors input",
    );
    for (i, &b) in padded[src.len()..].iter().enumerate() {
        assert_eq!(b, 0, "padding byte {i} must be zero, got {:#x}", b);
    }
    assert_eq!(
        padded.as_ptr() as usize % 64,
        0,
        "padded buffer is 64-byte aligned",
    );
}

#[test]
fn empty_input_padding() {
    check_padding_invariants("");
}

#[test]
fn single_byte_input_padding() {
    check_padding_invariants("a");
}

#[test]
fn short_input_padding() {
    check_padding_invariants("hello");
}

#[test]
fn stripe_boundary_input_padding() {
    // Inputs at 63 / 64 / 65 bytes exercise the PaddedChunk-size
    // allocation boundary.
    for n in [63usize, 64, 65] {
        let src: String = (0..n).map(|i| ((b'a' + (i % 26) as u8) as char)).collect();
        check_padding_invariants(&src);
    }
}

#[test]
fn long_input_padding() {
    // ~4 KB input: crosses many cache lines and verifies the
    // allocation scales.
    let src: String = (0..4096).map(|i| ((b'0' + (i % 10) as u8) as char)).collect();
    check_padding_invariants(&src);
}

#[test]
fn public_views_never_leak_padding() {
    // The `src_bytes` and `src` views must continue to show only the
    // original bytes; consumers computing offsets against their length
    // must be unaffected by padding.
    let src = "abc";
    let state = ParserState::new(src);
    assert_eq!(state.src, "abc");
    assert_eq!(state.src_bytes, b"abc");
    assert_eq!(state.end, 3);
}

#[test]
fn padded_bytes_permit_full_stripe_read_at_end() {
    // The contract is that a SIMD kernel may read a full STRIDE-byte
    // vector at any offset `i` with `i <= src.len()` without straying
    // past the allocation. Verify by reading a 64-byte stripe at
    // offset `src.len()`.
    let src = "xyz";
    let state = ParserState::new(src);
    let padded = state.padded_bytes();

    let stripe: [u8; 64] = padded[src.len()..src.len() + 64]
        .try_into()
        .expect("padded view exposes exactly INPUT_PAD_BYTES trailing bytes");
    assert_eq!(stripe, [0u8; 64]);
}

#[test]
fn padded_bytes_aligned_for_avx512_cache_line() {
    // AVX-512 `zmm` loads + cache-line fills benefit from 64-byte
    // alignment at buffer start. The invariant is spelled out in
    // `ParserState::padded_bytes`; repeat it here to lock the
    // contract down via a test.
    for n in [0usize, 1, 17, 63, 64, 255, 4096] {
        let src = "a".repeat(n);
        let state = ParserState::new(&src);
        let addr = state.padded_bytes().as_ptr() as usize;
        assert_eq!(
            addr % 64,
            0,
            "padded_bytes must be 64-byte aligned for len={n} (got addr {addr:#x})",
        );
    }
}
