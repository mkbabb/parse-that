//! NEON bodies of the block primitives (aarch64).
//!
//! Each body equals its oracle in [`super::scalar`] byte for byte
//! (`tests/prim_differential.rs`). Loads are whole fixed-size arrays, so
//! no body reads past its argument. The movemask is the crate's one
//! NEON movemask ([`crate::neon::movemask_u8x16`]).

#![cfg(target_arch = "aarch64")]

use core::arch::aarch64::*;

use super::{BlockClasses, KindPartition, Lo6Table, StringSpecialBlock, StructuralClassify64, Utf8BlockStatus};
use crate::neon::movemask_u8x16;

/// Four 16-lane compare results packed into one 64-bit mask.
#[inline(always)]
fn pack4(m: [uint8x16_t; 4]) -> u64 {
    // SAFETY: register-only intrinsics; NEON is baseline on aarch64.
    unsafe {
        (movemask_u8x16(m[0]) as u64)
            | ((movemask_u8x16(m[1]) as u64) << 16)
            | ((movemask_u8x16(m[2]) as u64) << 32)
            | ((movemask_u8x16(m[3]) as u64) << 48)
    }
}

#[inline(always)]
fn load4(src: &[u8; 64]) -> [uint8x16_t; 4] {
    // SAFETY: each load reads 16 bytes inside the 64-byte array.
    unsafe {
        [
            vld1q_u8(src.as_ptr()),
            vld1q_u8(src.as_ptr().add(16)),
            vld1q_u8(src.as_ptr().add(32)),
            vld1q_u8(src.as_ptr().add(48)),
        ]
    }
}

/// Lanes equal to any member of `set`, OR-reduced per stripe.
#[inline(always)]
fn eq_set(stripes: &[uint8x16_t; 4], set: &[u8]) -> [uint8x16_t; 4] {
    // SAFETY: register-only intrinsics.
    unsafe {
        let mut m = [vdupq_n_u8(0); 4];
        for &member in set {
            let needle = vdupq_n_u8(member);
            for k in 0..4 {
                m[k] = vorrq_u8(m[k], vceqq_u8(stripes[k], needle));
            }
        }
        m
    }
}

pub(super) fn byte_class_from_eq_set_64(src: &[u8; 64], set: &[u8]) -> u64 {
    pack4(eq_set(&load4(src), set))
}

pub(super) fn structural_classify_64(src: &[u8; 64], partition: &KindPartition<'_>) -> StructuralClassify64 {
    let s = load4(src);
    let open = pack4(eq_set(&s, partition.open));
    let close = pack4(eq_set(&s, partition.close));
    let quote = pack4(eq_set(&s, partition.quote));
    let slash = pack4(eq_set(&s, partition.slash));
    let stop = pack4(eq_set(&s, partition.stop));
    StructuralClassify64 { significant: open | close | quote | slash | stop, open, close, quote, slash, stop }
}

pub(super) fn bracket_depth_mask_64(src: &[u8; 64], opens: &[u8], closes: &[u8], depth_in: i32) -> (u64, i32) {
    let s = load4(src);
    super::scalar::running_balance(pack4(eq_set(&s, opens)), pack4(eq_set(&s, closes)), depth_in)
}

pub(super) fn lo6_classify(
    table: &Lo6Table,
    src: &[u8; 64],
    terminator: u8,
    escape: u8,
    control_limit: u8,
) -> BlockClasses {
    let s = load4(src);
    // SAFETY: `vld1q_u8_x4` reads the 64-byte table; the rest is
    // register-only.
    unsafe {
        let lut = vld1q_u8_x4(table.bytes().as_ptr());
        let mut structural = [vdupq_n_u8(0); 4];
        let mut terminators = [vdupq_n_u8(0); 4];
        let mut escapes = [vdupq_n_u8(0); 4];
        let mut controls = [vdupq_n_u8(0); 4];
        for k in 0..4 {
            let class = vqtbl4q_u8(lut, vandq_u8(s[k], vdupq_n_u8(0x3f)));
            structural[k] = vandq_u8(vceqq_u8(class, s[k]), vcgtq_u8(class, vdupq_n_u8(0)));
            terminators[k] = vceqq_u8(s[k], vdupq_n_u8(terminator));
            escapes[k] = vceqq_u8(s[k], vdupq_n_u8(escape));
            controls[k] = vcltq_u8(s[k], vdupq_n_u8(control_limit));
        }
        BlockClasses {
            structural_mask: pack4(structural),
            terminator_mask: pack4(terminators),
            escape_mask: pack4(escapes),
            control_mask: pack4(controls),
        }
    }
}

pub(super) fn string_special_block(bytes: &[u8; 16], terminator: u8, escape: u8, control_limit: u8) -> StringSpecialBlock {
    // SAFETY: one 16-byte load of the array; the rest is register-only.
    unsafe {
        let chunk = vld1q_u8(bytes.as_ptr());
        StringSpecialBlock {
            terminator_mask: movemask_u8x16(vceqq_u8(chunk, vdupq_n_u8(terminator))),
            escape_mask: movemask_u8x16(vceqq_u8(chunk, vdupq_n_u8(escape))),
            control_mask: movemask_u8x16(vcltq_u8(chunk, vdupq_n_u8(control_limit))),
            non_ascii_mask: movemask_u8x16(vcgeq_u8(chunk, vdupq_n_u8(0x80))),
        }
    }
}

pub(super) fn validate_utf8_block(bytes: &[u8; 16]) -> Utf8BlockStatus {
    // An all-ASCII block is decided in vector; any other block by the
    // oracle (the vector step is the common-case filter).
    // SAFETY: one 16-byte load of the array.
    let high = unsafe { movemask_u8x16(vcgeq_u8(vld1q_u8(bytes.as_ptr()), vdupq_n_u8(0x80))) };
    if high == 0 {
        Utf8BlockStatus::valid_complete()
    } else {
        super::scalar::validate_utf8_block(bytes)
    }
}

/// Low nibble → value for `'0'..='9'` (and the low nibble of
/// `'A'..='F'`/`'a'..='f'`, adjusted by 9 below); other slots poison.
const HEX_NIBBLE_LUT: [u8; 16] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

pub(super) fn decode_hex_quads(bytes: &[u8; 16]) -> Option<[u32; 4]> {
    // SAFETY: 16-byte loads of the array and the LUT, one 16-byte store
    // to a local; the rest is register-only.
    unsafe {
        let v = vld1q_u8(bytes.as_ptr());
        let base = vqtbl1q_u8(vld1q_u8(HEX_NIBBLE_LUT.as_ptr()), vandq_u8(v, vdupq_n_u8(0x0f)));
        let within = |lo: u8, hi: u8| vandq_u8(vcgeq_u8(v, vdupq_n_u8(lo)), vcgeq_u8(vdupq_n_u8(hi), v));
        let is_alpha = vorrq_u8(within(b'A', b'F'), within(b'a', b'f'));
        let is_hex = vorrq_u8(within(b'0', b'9'), is_alpha);
        if vminvq_u8(is_hex) == 0 {
            return None;
        }
        let nibbles = vaddq_u8(base, vandq_u8(is_alpha, vdupq_n_u8(9)));
        let mut lanes = [0u8; 16];
        vst1q_u8(lanes.as_mut_ptr(), nibbles);
        let quad = |q: usize| {
            (u32::from(lanes[q * 4]) << 12)
                | (u32::from(lanes[q * 4 + 1]) << 8)
                | (u32::from(lanes[q * 4 + 2]) << 4)
                | u32::from(lanes[q * 4 + 3])
        };
        Some([quad(0), quad(1), quad(2), quad(3)])
    }
}
