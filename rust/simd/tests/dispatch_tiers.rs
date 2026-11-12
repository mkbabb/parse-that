//! LW1.PERF-1 — every dispatch tier is reachable on a default build.
//!
//! A default build is `cargo build` with no `RUSTFLAGS`: the target's
//! baseline feature set (x86-64-v1 on `x86_64-*`, so no AVX2 and no
//! AVX-512). A tier that only exists under `-C target-feature=+avx2`
//! is dead code for every consumer, and its kernel never meets the
//! scalar oracle. These tests pin three facts:
//!
//! 1. the build contains every ISA tier of its architecture;
//! 2. the selected tier is the best one the running CPU supports;
//! 3. every tier the host can run agrees with `scalar::scan`.

use parse_that_simd::{StructuralAlphabet, Tier, compiled_tiers, scalar, scan_with, selected_tier};

const JSON: StructuralAlphabet = StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\"");
const CSS: StructuralAlphabet =
    StructuralAlphabet::from_parts(b"{}();:,", &[(b'/', b'*'), (b'*', b'/')], b"\"'");
/// Eight singletons: the nibble LUT's bit 7 (0x80) is in use.
const ARROW: StructuralAlphabet =
    StructuralAlphabet::from_parts(b"{}();:,=", &[(b'-', b'>')], b"\"");
const WIDE: StructuralAlphabet =
    StructuralAlphabet::from_parts(b"{}();:,=|<>[]?", &[(b'-', b'>')], b"\"");
/// No singletons, only digraphs (sk-v27 LW3.PERF-1a: the `Empty` shape
/// is chosen by the singleton count alone, and must still index digraphs).
const DIGRAPHS_ONLY: StructuralAlphabet =
    StructuralAlphabet::from_parts(&[], &[(b'/', b'*'), (b'*', b'/'), (b'-', b'>')], b"\"'");

#[test]
fn every_isa_tier_of_the_target_is_compiled() {
    let compiled = compiled_tiers();
    assert!(compiled.contains(&Tier::Scalar));
    #[cfg(target_arch = "aarch64")]
    assert!(compiled.contains(&Tier::Neon), "neon missing: {compiled:?}");
    #[cfg(target_arch = "x86_64")]
    for t in [Tier::Avx2, Tier::Avx512] {
        assert!(
            compiled.contains(&t),
            "{} kernel is not compiled into a default x86_64 build \
             (cfg(target_feature) gate); compiled = {compiled:?}",
            t.name()
        );
    }
    #[cfg(target_arch = "wasm32")]
    assert!(compiled.contains(&Tier::Simd128));
}

#[test]
#[cfg_attr(miri, ignore = "Miri selects the scalar tier by design (dispatch::select)")]
fn selected_tier_is_the_best_supported() {
    let sel = selected_tier();
    #[cfg(target_arch = "x86_64")]
    {
        let host_avx2 = std::is_x86_feature_detected!("avx2");
        let host_avx512 = std::is_x86_feature_detected!("avx512f")
            && std::is_x86_feature_detected!("avx512bw")
            && std::is_x86_feature_detected!("avx512vbmi2");
        let want = if host_avx512 {
            Tier::Avx512
        } else if host_avx2 {
            Tier::Avx2
        } else {
            Tier::Scalar
        };
        assert_eq!(sel, want, "host avx2={host_avx2} avx512={host_avx512}");
    }
    #[cfg(target_arch = "aarch64")]
    assert_eq!(sel, Tier::Neon);
    eprintln!("selected tier: {}", sel.name());
}

/// Deterministic xorshift corpus: dense structural bytes, quotes of
/// both classes, backslash runs, digraph halves; every length 0..=300
/// so each stripe/chunk/epilogue boundary is crossed.
fn corpus() -> Vec<Vec<u8>> {
    const POOL: &[u8] = b"{}[]:,\"'\\\\/**/()<>;=|?-ab \n";
    let mut s: u64 = 0x9E37_79B9_7F4A_7C15;
    let mut out = Vec::new();
    // Miri interprets every intrinsic; it gets every boundary length
    // once instead of four times.
    let (max_len, reps) = if cfg!(miri) {
        (140usize, 1)
    } else {
        (300usize, 4)
    };
    for len in 0..=max_len {
        for _ in 0..reps {
            let v: Vec<u8> = (0..len)
                .map(|_| {
                    s ^= s << 13;
                    s ^= s >> 7;
                    s ^= s << 17;
                    if s.is_multiple_of(5) {
                        (s >> 32) as u8
                    } else {
                        POOL[(s >> 40) as usize % POOL.len()]
                    }
                })
                .collect();
            out.push(v);
        }
    }
    out
}

#[test]
fn every_supported_tier_matches_the_scalar_oracle() {
    let corpus = corpus();
    let mut ran = Vec::new();
    for tier in compiled_tiers() {
        if !tier.is_supported() {
            continue;
        }
        ran.push(tier.name());
        for (name, alphabet) in [
            ("json", &JSON),
            ("css", &CSS),
            ("arrow", &ARROW),
            ("wide", &WIDE),
            ("digraphs-only", &DIGRAPHS_ONLY),
        ] {
            for input in &corpus {
                let want = scalar::scan(input, alphabet);
                let got = scan_with(tier, input, alphabet).expect("supported tier runs");
                assert_eq!(
                    (&got.positions, &got.kinds),
                    (&want.positions, &want.kinds),
                    "tier {} diverges from scalar ({name} alphabet) on {:?}",
                    tier.name(),
                    String::from_utf8_lossy(input)
                );
            }
        }
    }
    eprintln!("tiers held to the oracle: {ran:?}");
    #[cfg(target_arch = "x86_64")]
    if std::is_x86_feature_detected!("avx2") {
        assert!(
            ran.contains(&"avx2"),
            "host has avx2 but the avx2 tier did not run: {ran:?}"
        );
    }
}

/// sk-v27 LW3.PERF-1a (X-4): the tiers a CI arm names in
/// `PARSE_THAT_REQUIRE_TIERS` (comma-separated `Tier::name`s) are the
/// ones it executes, so an arm whose CPU (or emulator) stops offering a
/// tier fails instead of silently holding fewer kernels to the oracle.
#[test]
fn required_tiers_are_supported_on_this_host() {
    let runnable: Vec<&str> = compiled_tiers()
        .into_iter()
        .filter(|t| t.is_supported())
        .map(|t| t.name())
        .collect();
    eprintln!("tiers this host runs: {runnable:?}");
    let Ok(required) = std::env::var("PARSE_THAT_REQUIRE_TIERS") else {
        return;
    };
    for name in required.split(',').map(str::trim).filter(|s| !s.is_empty()) {
        assert!(
            Tier::from_name(name).is_some(),
            "PARSE_THAT_REQUIRE_TIERS names no tier {name:?}"
        );
        assert!(
            runnable.contains(&name),
            "tier {name} is required on this arm but does not run here: {runnable:?}"
        );
    }
}
