// Dispatch arms for negated-class byte scanners: memchr fast paths and
// LUT / SIMD nibble scanners.

use super::SpanParser;
use crate::state::{ParserState, Span};

impl<'a> SpanParser<'a> {
    #[inline(always)]
    pub(super) fn dispatch_take_until_any1(
        &self,
        b1: u8,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let bytes = state.src_bytes;
        let start = state.offset;
        if start >= bytes.len() {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        let scan_len = memchr::memchr(b1, &bytes[start..]).unwrap_or(bytes.len() - start);
        if scan_len == 0 {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        let end = start + scan_len;
        state.offset = end;
        Some(Span::new(start, end, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_take_until_any2(
        &self,
        b1: u8,
        b2: u8,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let bytes = state.src_bytes;
        let start = state.offset;
        if start >= bytes.len() {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        let scan_len = memchr::memchr2(b1, b2, &bytes[start..]).unwrap_or(bytes.len() - start);
        if scan_len == 0 {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        let end = start + scan_len;
        state.offset = end;
        Some(Span::new(start, end, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_take_until_any3(
        &self,
        b1: u8,
        b2: u8,
        b3: u8,
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let bytes = state.src_bytes;
        let start = state.offset;
        if start >= bytes.len() {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        let scan_len = memchr::memchr3(b1, b2, b3, &bytes[start..]).unwrap_or(bytes.len() - start);
        if scan_len == 0 {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        let end = start + scan_len;
        state.offset = end;
        Some(Span::new(start, end, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_take_until_any_lut(
        &self,
        lut: &[bool; 256],
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        let bytes = state.src_bytes;
        let start = state.offset;
        let end = bytes.len();
        let mut i = start;
        while i < end && !lut[unsafe { *bytes.get_unchecked(i) } as usize] {
            i += 1;
        }
        if i == start {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        state.offset = i;
        Some(Span::new(start, i, state.src))
    }

    #[inline(always)]
    pub(super) fn dispatch_take_until_any_simd(
        &self,
        lo_lut: &[u8; 16],
        hi_lut: &[u8; 16],
        state: &mut ParserState<'a>,
    ) -> Option<Span<'a>> {
        use std::simd::prelude::*;

        let lo = u8x16::from_array(*lo_lut);
        let hi = u8x16::from_array(*hi_lut);
        let lo_mask_const = u8x16::splat(0x0F);

        let bytes = state.src_bytes;
        let start = state.offset;
        let end = bytes.len();
        let mut i = start;

        // SIMD: classify 16 bytes at a time
        while i + 16 <= end {
            let chunk = u8x16::from_slice(&bytes[i..i + 16]);
            let lo_nibbles = chunk & lo_mask_const;
            let hi_nibbles = chunk >> 4;

            let lo_result = lo.swizzle_dyn(lo_nibbles);
            let hi_result = hi.swizzle_dyn(hi_nibbles);
            let matched = lo_result & hi_result;

            let is_excluded = matched.simd_ne(u8x16::splat(0));
            if !is_excluded.any() {
                i += 16;
                continue;
            }
            i += is_excluded.to_bitmask().trailing_zeros() as usize;
            // Found an excluded byte — break to return result
            if i == start {
                #[cfg(feature = "diagnostics")]
                if let Some(lbl) = self.label {
                    state.add_expected(lbl);
                }
                return None;
            }
            state.offset = i;
            return Some(Span::new(start, i, state.src));
        }

        // Scalar tail: use nibble LUTs for remaining bytes
        while i < end {
            let b = unsafe { *bytes.get_unchecked(i) };
            if lo_lut[(b & 0x0F) as usize] & hi_lut[(b >> 4) as usize] != 0 {
                break;
            }
            i += 1;
        }

        if i == start {
            #[cfg(feature = "diagnostics")]
            if let Some(lbl) = self.label {
                state.add_expected(lbl);
            }
            return None;
        }
        state.offset = i;
        Some(Span::new(start, i, state.src))
    }
}
