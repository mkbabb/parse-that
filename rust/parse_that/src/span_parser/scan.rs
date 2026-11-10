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
        use crate::parsers::scan::lanes::{self, NibbleLut};

        let lut = NibbleLut::new(lo_lut, hi_lut);

        let bytes = state.src_bytes;
        let start = state.offset;
        let end = bytes.len();
        let mut i = start;

        // SIMD: classify 16 bytes at a time
        while i + 16 <= end {
            let excluded = lut.mask(lanes::load(&bytes[i..i + 16]));
            if excluded == 0 {
                i += 16;
                continue;
            }
            i += excluded.trailing_zeros() as usize;
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
