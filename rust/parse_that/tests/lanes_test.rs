//! The lane primitives against their definition, on whichever plane this
//! build selected (stable scalar by default, portable SIMD under the
//! `nightly` feature). Every byte value is visited at every lane position.

use parse_that::parsers::scan::lanes::{self, NibbleLut};

/// The 16 chunks whose lane `i` holds byte `(16 * k + i + rot) % 256`, so
/// over `rot` in 0..16 every byte appears at every lane.
fn chunks(rot: usize) -> impl Iterator<Item = [u8; 16]> {
    (0..16).map(move |k| std::array::from_fn(|i| ((16 * k + i + rot) % 256) as u8))
}

fn reference(chunk: &[u8; 16], hit: impl Fn(u8) -> bool) -> u16 {
    chunk
        .iter()
        .enumerate()
        .fold(0u16, |m, (i, &b)| m | ((hit(b) as u16) << i))
}

#[test]
fn load_round_trips() {
    let bytes: Vec<u8> = (0..=255u8).collect();
    for start in 0..=240 {
        let chunk = lanes::load(&bytes[start..]);
        assert_eq!(lanes::to_array(chunk)[..], bytes[start..start + 16]);
    }
}

#[test]
fn eq_mask_matches_definition_for_every_byte_and_lane() {
    for rot in 0..16 {
        for raw in chunks(rot) {
            let chunk = lanes::load(&raw);
            for needle in 0..=255u8 {
                assert_eq!(
                    lanes::eq_mask(chunk, needle),
                    reference(&raw, |b| b == needle),
                    "needle {needle:#04x} chunk {raw:?}"
                );
            }
        }
    }
}

#[test]
fn nibble_mask_matches_definition_for_every_byte_and_lane() {
    let sets: [&[u8]; 5] = [
        b" \t\n\r",
        b"{}[]:,\"\\",
        b"/",
        &[0x00, 0x7f, 0x80, 0xff],
        b"azAZ09_-",
    ];
    for targets in sets {
        let (lo, hi) = parse_that::build_nibble_luts(targets);
        let lut = NibbleLut::new(&lo, &hi);
        for rot in 0..16 {
            for raw in chunks(rot) {
                assert_eq!(
                    lut.mask(lanes::load(&raw)),
                    reference(&raw, |b| lo[(b & 0x0F) as usize] & hi[(b >> 4) as usize]
                        != 0),
                    "targets {targets:?} chunk {raw:?}"
                );
            }
        }
        // The nibble pair has no false positives for <= 8 targets.
        for b in 0..=255u8 {
            let raw = [b; 16];
            let expect = if targets.contains(&b) { u16::MAX } else { 0 };
            assert_eq!(lut.mask(lanes::load(&raw)), expect, "byte {b:#04x}");
        }
    }
}
