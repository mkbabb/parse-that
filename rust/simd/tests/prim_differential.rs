//! Differential fuzz: every block primitive against its scalar oracle.
//!
//! [`parse_that_simd::prim`] runs the selected tier's body (NEON on
//! aarch64, the oracle elsewhere); [`parse_that_simd::prim::scalar`] is
//! the oracle. One target per primitive draws seeded blocks biased
//! toward the bytes each primitive classifies (and every byte value,
//! including `0x00`, `0x1f`, `0x7f`, `0x80` and `0xff`), over several
//! caller byte sets, and compares the two results exactly.
//!
//! `PARSE_THAT_SIMD_FUZZ_INPUTS` sets the inputs per target and byte
//! set (default 2,000; the LW2.PERF-1b reading is 100,000);
//! `PARSE_THAT_SIMD_FUZZ_SEED` sets the seed. With `--nocapture` each
//! target prints one report line.

use parse_that_simd::prim::{self, KindPartition, Lo6Table, scalar};
use parse_that_simd::{Tier, selected_tier};

const HOT: &[u8] = b"{}[]()<>;:,=\"'`/\\*#@ \n\t\x00\x01\x1f\x7f\x80\xbf\xc3\xe2\xed\xf0\xf4\xffaAfFgG09";
const SETS: [&[u8]; 5] = [b"\"'", b",", b"{}[]:,", b";{}!", b"\\\"\x00\x1f\x80\xff"];
const BRACKETS: [(&[u8], &[u8]); 3] = [(b"([{", b")]}"), (b"(", b")"), (b"<{", b">}")];
const PARTITIONS: [KindPartition<'static>; 3] = [
    KindPartition { open: b"([{", close: b")]}", quote: b"\"'", slash: b"/", stop: b";:" },
    KindPartition { open: b"{", close: b"}", quote: b"\"", slash: b"", stop: b",;!" },
    KindPartition { open: b"(", close: b"(", quote: b"", slash: b"/*", stop: b"" },
];
const LO6: [Lo6Table; 3] = [
    Lo6Table::from_members(b"{}[],:\""),
    Lo6Table::from_members(b"{}:(),["),
    Lo6Table::from_members(b"\x01\x3f@"),
];
const HEX: &[u8] = b"0123456789abcdefABCDEF";

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

    fn byte_from(&mut self, hot: &[u8], hot_share: usize) -> u8 {
        if self.below(4) < hot_share + 1 { hot[self.below(hot.len())] } else { self.next() as u8 }
    }

    fn block<const N: usize>(&mut self, hot: &[u8]) -> [u8; N] {
        let hot_share = self.below(4);
        std::array::from_fn(|_| self.byte_from(hot, hot_share))
    }
}

fn env_usize(name: &str, default: usize) -> usize {
    std::env::var(name).ok().and_then(|v| v.parse().ok()).unwrap_or(default)
}

/// Run `cases` inputs per variant through `check`; panic with the first
/// divergence after printing the report line.
fn target(name: &str, variants: usize, check: impl Fn(&mut XorShift, usize) -> Option<String>) {
    let inputs = env_usize("PARSE_THAT_SIMD_FUZZ_INPUTS", 2_000);
    let seed = env_usize("PARSE_THAT_SIMD_FUZZ_SEED", 0x5EED_2711) as u64;
    let mut divergences = 0usize;
    let mut first = None;
    for variant in 0..variants {
        let mut rng = XorShift((seed ^ (name.len() as u64 * 31 + variant as u64).wrapping_mul(0x9E37_79B9_7F4A_7C15)) | 1);
        for case in 0..inputs {
            if let Some(why) = check(&mut rng, variant) {
                divergences += 1;
                first.get_or_insert((variant, case, why));
            }
        }
    }
    println!(
        "prim_differential kernel={name} tier={} inputs_per_set={inputs} sets={variants} total={} divergences={divergences} seed={seed:#x}",
        selected_tier().name(),
        inputs * variants,
    );
    if let Some((variant, case, why)) = first {
        panic!("{name} diverges from its scalar oracle on {divergences} inputs; first: set {variant}, case {case}: {why}");
    }
}

fn differ<T: PartialEq + std::fmt::Debug>(got: T, want: T, input: &[u8]) -> Option<String> {
    (got != want).then(|| format!("got {got:?}, want {want:?}, input {input:?}"))
}

/// Without an override, aarch64 selects NEON: the targets below then
/// hold the NEON bodies, not the oracle, to the oracle.
#[test]
fn the_selected_tier_runs_the_neon_bodies_on_aarch64() {
    if std::env::var_os(parse_that_simd::TIER_ENV).is_none() && cfg!(all(target_arch = "aarch64", not(miri), not(feature = "force-scalar"))) {
        assert_eq!(selected_tier(), Tier::Neon);
    }
}

#[test]
fn byte_class_from_eq_set_64() {
    target("byte_class_from_eq_set_64", SETS.len(), |rng, v| {
        let src: [u8; 64] = rng.block(HOT);
        differ(prim::byte_class_from_eq_set_64(&src, SETS[v]), scalar::byte_class_from_eq_set_64(&src, SETS[v]), &src)
    });
}

#[test]
fn structural_classify_64() {
    target("structural_classify_64", PARTITIONS.len(), |rng, v| {
        let src: [u8; 64] = rng.block(HOT);
        differ(prim::structural_classify_64(&src, &PARTITIONS[v]), scalar::structural_classify_64(&src, &PARTITIONS[v]), &src)
    });
}

#[test]
fn bracket_depth_mask_64() {
    target("bracket_depth_mask_64", BRACKETS.len(), |rng, v| {
        let src: [u8; 64] = rng.block(HOT);
        let depth = rng.below(4) as i32;
        let (opens, closes) = BRACKETS[v];
        differ(prim::bracket_depth_mask_64(&src, opens, closes, depth), scalar::bracket_depth_mask_64(&src, opens, closes, depth), &src)
    });
}

#[test]
fn lo6_classify() {
    target("lo6_classify", LO6.len(), |rng, v| {
        let src: [u8; 64] = rng.block(HOT);
        let (t, e, c) = (HOT[rng.below(HOT.len())], HOT[rng.below(HOT.len())], rng.next() as u8);
        differ(LO6[v].classify(&src, t, e, c), scalar::lo6_classify(&LO6[v], &src, t, e, c), &src)
    });
}

#[test]
fn string_special_block() {
    target("string_special_block", 2, |rng, v| {
        let src: [u8; 16] = rng.block(HOT);
        let (t, e, c) = if v == 0 { (b'"', b'\\', 0x20) } else { (rng.next() as u8, rng.next() as u8, rng.next() as u8) };
        differ(prim::string_special_block(&src, t, e, c), scalar::string_special_block(&src, t, e, c), &src)
    });
}

#[test]
fn validate_utf8_block() {
    // Set 0: ASCII-heavy blocks; set 1: blocks built from UTF-8 sequence
    // bytes (leads, continuations, the surrogate and overlong edges).
    const UTF8: &[u8] = b"a\x7f\x80\x8f\x90\x9f\xa0\xbf\xc0\xc1\xc2\xdf\xe0\xe1\xed\xee\xef\xf0\xf1\xf4\xf5\xff";
    target("validate_utf8_block", 2, |rng, v| {
        let src: [u8; 16] = rng.block(if v == 0 { HOT } else { UTF8 });
        differ(prim::validate_utf8_block(&src), scalar::validate_utf8_block(&src), &src)
    });
}

#[test]
fn decode_hex_quads() {
    // Set 0: all-hex blocks with rare faults; set 1: any bytes.
    target("decode_hex_quads", 2, |rng, v| {
        let src: [u8; 16] = if v == 0 {
            std::array::from_fn(|_| if rng.below(64) == 0 { HOT[rng.below(HOT.len())] } else { HEX[rng.below(HEX.len())] })
        } else {
            rng.block(HOT)
        };
        differ(prim::decode_hex_quads(&src), scalar::decode_hex_quads(&src), &src)
    });
}
