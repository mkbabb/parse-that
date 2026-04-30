//! Self-loop state acceleration detection.
//!
//! Detects DFA states where most byte classes loop back to the same state
//! (e.g., `[^"\\]+` loops on everything except `"` and `\\`). For these
//! states, we can use memchr/SIMD to skip directly to the first "exit byte"
//! instead of checking one byte at a time.

use smallvec::SmallVec;

use super::dfa::Dfa;
use crate::sets::byteset::ByteSet;

/// Acceleration strategy for a self-loop state.
#[derive(Clone, Debug)]
pub enum AccelStrategy {
    /// 1 exit byte → `memchr::memchr`.
    Memchr1(u8),
    /// 2 exit bytes → `memchr::memchr2`.
    Memchr2(u8, u8),
    /// 3 exit bytes → `memchr::memchr3`.
    Memchr3(u8, u8, u8),
    /// 4–8 exit bytes → SIMD nibble LUT (`vpshufb` / `tbl`).
    NibbleLut {
        lo_lut: [u8; 16],
        hi_lut: [u8; 16],
        exit_bytes: SmallVec<[u8; 8]>,
    },
    /// Not accelerable.
    None,
}

/// Per-state acceleration info.
#[derive(Clone, Debug)]
pub struct StateAccel {
    pub strategy: AccelStrategy,
}

/// Detect acceleration opportunities in a completed DFA.
///
/// Returns a Vec parallel to `dfa.states` with acceleration info per state.
pub fn detect_accel(dfa: &Dfa) -> Vec<StateAccel> {
    let num_cls = dfa.num_classes as usize;

    dfa.states
        .iter()
        .enumerate()
        .map(|(state_id, state)| {
            // Count how many classes self-loop vs. exit.
            let sid = state_id as u32;
            let mut self_loop_classes = 0usize;
            let mut exit_classes = 0usize;

            for cls in 0..num_cls {
                let target = state.transitions[cls];
                if target == sid {
                    self_loop_classes += 1;
                } else {
                    exit_classes += 1;
                }
            }

            // Only accelerate if the vast majority of classes self-loop.
            // Heuristic: at least 80% self-loop, and at most 8 exit bytes
            // for SIMD strategies.
            if self_loop_classes == 0 || exit_classes > self_loop_classes {
                return StateAccel {
                    strategy: AccelStrategy::None,
                };
            }

            // Collect the actual exit bytes (not classes — expand classes to bytes).
            let mut exit_byte_set = ByteSet::empty();
            for (b, &cls) in dfa.byte_classes.iter().enumerate() {
                let target = state.transitions[cls as usize];
                if target != sid {
                    exit_byte_set.insert(b as u8);
                }
            }

            let exit_count = exit_byte_set.len();
            if exit_count == 0 {
                // Pure self-loop with no exits — not useful (would loop forever).
                return StateAccel {
                    strategy: AccelStrategy::None,
                };
            }

            let exit_bytes: SmallVec<[u8; 8]> = exit_byte_set.iter().collect();

            let strategy = match exit_count {
                1 => AccelStrategy::Memchr1(exit_bytes[0]),
                2 => AccelStrategy::Memchr2(exit_bytes[0], exit_bytes[1]),
                3 => AccelStrategy::Memchr3(exit_bytes[0], exit_bytes[1], exit_bytes[2]),
                4..=8 => {
                    let (lo_lut, hi_lut) = build_nibble_luts(&exit_bytes);
                    AccelStrategy::NibbleLut {
                        lo_lut,
                        hi_lut,
                        exit_bytes,
                    }
                }
                // 9+ exit bytes: no accelerator (the former ScalarLut
                // variant was dead code — detected here but never
                // consumed by any emitter. Deleted in Tranche AA.10.)
                _ => AccelStrategy::None,
            };

            StateAccel { strategy }
        })
        .collect()
}

/// Build SIMD nibble lookup tables for the given target bytes.
///
/// Two 16-byte tables: `lo_lut` indexed by low nibble (b & 0xF),
/// `hi_lut` indexed by high nibble (b >> 4). For a byte `b`, if
/// `lo_lut[b & 0xF] & hi_lut[b >> 4] != 0`, then `b` is in the target set.
///
/// Each target byte gets a unique bit position (up to 8 targets = 8 bits).
fn build_nibble_luts(targets: &[u8]) -> ([u8; 16], [u8; 16]) {
    let mut lo_lut = [0u8; 16];
    let mut hi_lut = [0u8; 16];

    for (i, &b) in targets.iter().enumerate().take(8) {
        let bit = 1u8 << i;
        lo_lut[(b & 0xF) as usize] |= bit;
        hi_lut[(b >> 4) as usize] |= bit;
    }

    (lo_lut, hi_lut)
}
