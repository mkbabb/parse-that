//! Differential fuzz: every kernel against the scalar oracle.
//!
//! One target per tier the host can run (`compiled_tiers()` filtered
//! by `is_supported`). Each target draws inputs from a seeded xorshift
//! generator, biased toward the bytes that matter (structural bytes,
//! digraph halves, quotes, backslash runs) and sized to cross the
//! 16-, 32- and 64-byte region boundaries, then compares the tier's
//! `StructuralIndex` with `scalar::scan` exactly (positions and kinds).
//!
//! `PARSE_THAT_SIMD_FUZZ_INPUTS` sets the number of inputs per target
//! and alphabet (default 2,000, a smoke run; the LW2.PERF-1 reading
//! is 100,000). `PARSE_THAT_SIMD_FUZZ_SEED` sets the seed. The report
//! line per target is printed with `--nocapture`.

use parse_that_simd::{StructuralAlphabet, Tier, compiled_tiers, scalar, scan_with};

const ALPHABETS: [(&str, StructuralAlphabet); 5] = [
    ("json", StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\"")),
    (
        "css",
        StructuralAlphabet::from_parts(b"{}();:,", &[(b'/', b'*'), (b'*', b'/')], b"\"'"),
    ),
    (
        "arrow",
        StructuralAlphabet::from_parts(b"{}();:,=", &[(b'-', b'>'), (b'(', b'*'), (b'*', b')')], b"\""),
    ),
    (
        "wide",
        StructuralAlphabet::from_parts(b"{}();:,=|<>[]?", &[(b'-', b'>')], b"\"'`"),
    ),
    ("no-quote", StructuralAlphabet::from_parts(b"abc", &[], &[])),
];

/// Bytes drawn with extra weight: every alphabet's structural bytes,
/// quotes, the backslash, and plain filler.
const HOT: &[u8] = b"{}[]();:,=|<>?-*/\"'`\\\\\\abc \n";

struct XorShift(u64);

impl XorShift {
    fn next(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.0 = x;
        x
    }

    fn below(&mut self, n: usize) -> usize {
        (self.next() % n as u64) as usize
    }

    fn input(&mut self) -> Vec<u8> {
        // Lengths cluster around region multiples, with a long tail.
        let len = match self.below(4) {
            0 => self.below(17),
            1 => 16 * (1 + self.below(8)) + self.below(3) - 1,
            2 => 64 * (1 + self.below(8)) + self.below(3) - 1,
            _ => self.below(1500),
        };
        let hot_share = self.below(4); // 0..=3 quarters of hot bytes
        (0..len)
            .map(|_| {
                if self.below(4) < hot_share + 1 {
                    HOT[self.below(HOT.len())]
                } else {
                    self.next() as u8
                }
            })
            .collect()
    }
}

fn env_usize(name: &str, default: usize) -> usize {
    std::env::var(name).ok().and_then(|v| v.parse().ok()).unwrap_or(default)
}

fn fuzz_tier(tier: Tier, inputs: usize, seed: u64) {
    let mut divergences = 0usize;
    let mut first = None;
    for (name, alphabet) in &ALPHABETS {
        let mut rng = XorShift(seed ^ (name.len() as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15) | 1);
        for case in 0..inputs {
            let input = rng.input();
            let got = scan_with(tier, &input, alphabet).expect("tier is supported");
            let want = scalar::scan(&input, alphabet);
            if got.positions != want.positions || got.kinds != want.kinds {
                divergences += 1;
                first.get_or_insert((*name, case, input));
            }
        }
    }
    println!(
        "differential tier={} inputs_per_alphabet={inputs} alphabets={} total={} divergences={divergences} seed={seed:#x}",
        tier.name(),
        ALPHABETS.len(),
        inputs * ALPHABETS.len(),
    );
    if let Some((name, case, input)) = first {
        panic!(
            "tier {} diverges from the scalar oracle: {divergences} inputs; first: alphabet {name}, case {case}, input {:?}",
            tier.name(),
            String::from_utf8_lossy(&input)
        );
    }
}

#[test]
fn every_supported_tier_matches_the_scalar_oracle() {
    let inputs = env_usize("PARSE_THAT_SIMD_FUZZ_INPUTS", 2_000);
    let seed = env_usize("PARSE_THAT_SIMD_FUZZ_SEED", 0x5EED_2711) as u64;
    for tier in compiled_tiers().into_iter().filter(|t| t.is_supported()) {
        fuzz_tier(tier, inputs, seed);
    }
}
