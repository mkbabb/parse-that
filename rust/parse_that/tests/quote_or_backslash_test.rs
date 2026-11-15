//! sk-v27 LW3.PERF-1d (RULINGS 2026-11-14e PERF1D-B): the relocated
//! quote-or-backslash finder equals `find_first_of(bytes, b"\"\\")` on
//! every compiled tier: boundary inputs of every length 0..=130 with a hit
//! at every offset (each of `"` and `\`), hit-free inputs, near-miss bytes,
//! and random inputs.

use parse_that::find_first_of;
use parse_that::scan::find_quote_or_backslash;
use parse_that_simd::{compiled_tiers, find_quote_or_backslash_with, scalar};

const TARGETS: &[u8] = b"\"\\";

/// Every way to compute the answer agrees with `find_first_of`.
fn check(bytes: &[u8]) {
    let want = find_first_of(bytes, TARGETS);
    assert_eq!(
        find_quote_or_backslash(bytes),
        want,
        "selected tier on {bytes:?}"
    );
    assert_eq!(
        scalar::find_quote_or_backslash(bytes),
        want,
        "oracle on {bytes:?}"
    );
    for tier in compiled_tiers() {
        if let Some(got) = find_quote_or_backslash_with(tier, bytes) {
            assert_eq!(got, want, "tier {} on {bytes:?}", tier.name());
        }
    }
}

#[test]
fn hit_free_inputs_of_every_length() {
    for len in 0..=130 {
        check(&vec![b'a'; len]);
        // Near misses: bytes one off `"` (0x22) and `\` (0x5c), and the
        // high-bit twins, which a sign or nibble slip would match.
        let near: Vec<u8> = (0..len)
            .map(|i| [0x21, 0x23, 0x5b, 0x5d, 0xa2, 0xdc][i % 6])
            .collect();
        check(&near);
    }
}

#[test]
fn a_hit_at_every_offset_of_every_length() {
    for len in 1..=130 {
        for at in 0..len {
            for &hit in TARGETS {
                let mut bytes = vec![b'x'; len];
                bytes[at] = hit;
                check(&bytes);
                // A second hit after the first never wins.
                if at + 1 < len {
                    bytes[len - 1] = TARGETS[(hit == b'"') as usize];
                    check(&bytes);
                }
            }
        }
    }
}

#[test]
fn random_inputs() {
    let mut s: u64 = 0x9e37_79b9_7f4a_7c15;
    let mut next = || {
        s ^= s << 13;
        s ^= s >> 7;
        s ^= s << 17;
        s
    };
    for _ in 0..20_000 {
        let len = (next() % 131) as usize;
        // Sparse hits: about one byte in 64 is a target.
        let bytes: Vec<u8> = (0..len)
            .map(|_| {
                let r = next();
                if r % 64 == 0 {
                    TARGETS[(r >> 8) as usize % 2]
                } else {
                    (r >> 16) as u8
                }
            })
            .collect();
        check(&bytes);
    }
}

#[test]
fn unaligned_windows_of_one_buffer() {
    let mut buf = vec![b'.'; 300];
    buf[150] = b'\\';
    buf[200] = b'"';
    for start in 0..64 {
        for len in 0..=130 {
            check(&buf[start..start + len]);
            check(&buf[start + 100..start + 100 + len]);
        }
    }
}
