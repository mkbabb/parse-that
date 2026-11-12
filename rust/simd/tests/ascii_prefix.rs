//! sk-v27 LW3.PERF-2: the all-ASCII run kernel.
//!
//! `ascii_prefix_len(bytes)` is the length of the longest prefix of
//! `bytes` whose every byte is below `0x80`. Every tier the host can run
//! is held to the scalar oracle (`scalar::ascii_prefix_len`) on every
//! length `0..=256` at every alignment `0..64`, with the first non-ASCII
//! byte at every position, at a page boundary, and under proptest fuzz.

use parse_that_simd::{
    Tier, ascii_prefix_len, ascii_prefix_len_with, compiled_tiers, scalar, selected_tier,
};
use proptest::prelude::*;

/// Fuzz cases per target: `PARSE_THAT_FUZZ_CASES`, else a smoke count.
fn cases() -> u32 {
    std::env::var("PARSE_THAT_FUZZ_CASES")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(if cfg!(miri) { 4 } else { 256 })
}

fn runnable() -> Vec<Tier> {
    compiled_tiers().into_iter().filter(|t| t.is_supported()).collect()
}

/// The oracle is the plain definition.
#[test]
fn oracle_is_the_definition() {
    assert_eq!(scalar::ascii_prefix_len(b""), 0);
    assert_eq!(scalar::ascii_prefix_len(b"abc"), 3);
    assert_eq!(scalar::ascii_prefix_len("ab\u{e9}c".as_bytes()), 2);
    assert_eq!(scalar::ascii_prefix_len(&[0x7F, 0x80]), 1);
    assert_eq!(scalar::ascii_prefix_len(&[0xFF]), 0);
}

/// The public entry runs the selected tier and equals the oracle.
#[test]
fn entry_point_runs_the_selected_tier() {
    let input = "plain ascii, then \u{2603} and more".as_bytes();
    let want = scalar::ascii_prefix_len(input);
    assert_eq!(ascii_prefix_len(input), want);
    assert_eq!(ascii_prefix_len_with(selected_tier(), input), Some(want));
}

/// Every length 0..=256, every alignment 0..64, the first non-ASCII byte
/// at every position (or absent), and every high byte value class.
#[test]
fn every_tier_every_length_alignment_and_position() {
    let lens: Vec<usize> = if cfg!(miri) {
        vec![0, 1, 15, 16, 17, 63, 64, 65]
    } else {
        (0..=256).collect()
    };
    let aligns: Vec<usize> = if cfg!(miri) { vec![0, 1, 7] } else { (0..64).collect() };
    let mut buf = vec![b'a'; 256 + 64 + 1];
    for tier in runnable() {
        for &align in &aligns {
            for &len in &lens {
                let window = align..align + len;
                // No high byte.
                buf.iter_mut().for_each(|b| *b = b'a');
                let s = &buf[window.clone()];
                assert_eq!(
                    ascii_prefix_len_with(tier, s),
                    Some(len),
                    "{} align {align} len {len} all ascii",
                    tier.name()
                );
                // The first high byte at each position, with high and low
                // bytes after it (the answer is the first one only).
                let positions: Vec<usize> = if cfg!(miri) {
                    (0..len).step_by(7).collect()
                } else {
                    (0..len).collect()
                };
                for p in positions {
                    buf.iter_mut().for_each(|b| *b = b'a');
                    let hi = [0x80u8, 0xC3, 0xFF][p % 3];
                    buf[align + p] = hi;
                    if align + p + 3 < buf.len() {
                        buf[align + p + 3] = 0x80;
                    }
                    let s = &buf[window.clone()];
                    let want = scalar::ascii_prefix_len(s);
                    assert_eq!(want, p);
                    assert_eq!(
                        ascii_prefix_len_with(tier, s),
                        Some(want),
                        "{} align {align} len {len} high byte {hi:#x} at {p}",
                        tier.name()
                    );
                }
            }
        }
    }
}

/// A tier the host cannot run reports `None`, never another tier's answer.
#[test]
fn unsupported_tier_reports_none() {
    for tier in Tier::PREFERENCE {
        if !tier.is_supported() {
            assert_eq!(ascii_prefix_len_with(tier, b"abc"), None, "{}", tier.name());
        }
    }
}

/// No tier reads past the end of its input: the input's last byte is the
/// last byte of a mapped page and the next page is `PROT_NONE`.
#[cfg(all(unix, not(miri)))]
#[test]
fn no_tier_reads_past_the_end() {
    struct Guarded {
        base: *mut u8,
        page: usize,
    }
    impl Drop for Guarded {
        fn drop(&mut self) {
            // SAFETY: the mapping made below.
            unsafe { libc::munmap(self.base.cast(), 2 * self.page) };
        }
    }
    // SAFETY: an anonymous two-page mapping whose second page is made
    // inaccessible; unmapped by `Guarded::drop`.
    let g = unsafe {
        let page = libc::sysconf(libc::_SC_PAGESIZE) as usize;
        let base = libc::mmap(
            std::ptr::null_mut(),
            2 * page,
            libc::PROT_READ | libc::PROT_WRITE,
            libc::MAP_PRIVATE | libc::MAP_ANON,
            -1,
            0,
        );
        assert_ne!(base, libc::MAP_FAILED);
        assert_eq!(libc::mprotect((base as *mut u8).add(page).cast(), page, libc::PROT_NONE), 0);
        Guarded { base: base.cast(), page }
    };
    for tier in runnable() {
        for len in 0..=256usize {
            for high in [None, Some(len.saturating_sub(1))] {
                // SAFETY: `len <= page`; the slice lies in the RW page and
                // ends exactly at the guard page.
                let s = unsafe {
                    let dst = g.base.add(g.page - len);
                    std::ptr::write_bytes(dst, b'x', len);
                    if let (Some(p), true) = (high, len > 0) {
                        *dst.add(p) = 0xE2;
                    }
                    std::slice::from_raw_parts(dst, len)
                };
                assert_eq!(
                    ascii_prefix_len_with(tier, s),
                    Some(scalar::ascii_prefix_len(s)),
                    "{} len {len}",
                    tier.name()
                );
            }
        }
    }
}

proptest! {
    #![proptest_config(ProptestConfig {
        cases: cases(),
        failure_persistence: None,
        ..ProptestConfig::default()
    })]

    /// Differential fuzz: mostly-ASCII inputs with a sparse high byte, at a
    /// random offset into the buffer (alignment), on every runnable tier.
    #[test]
    fn fuzz_every_tier_matches_the_oracle(
        bytes in proptest::collection::vec(
            prop_oneof![
                30 => 0u8..0x80,
                1 => 0x80u8..=0xFF,
            ],
            0..2048,
        ),
        offset in 0usize..64,
    ) {
        let offset = offset.min(bytes.len());
        let s = &bytes[offset..];
        let want = scalar::ascii_prefix_len(s);
        for tier in runnable() {
            prop_assert_eq!(ascii_prefix_len_with(tier, s), Some(want), "{}", tier.name());
        }
    }
}
