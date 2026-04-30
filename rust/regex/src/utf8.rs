//! UTF-8 byte sequence expansion for Unicode codepoint ranges.
//!
//! Converts a codepoint range `[lo, hi]` into an iterator of `Utf8Sequence`
//! values — each a linear chain of byte ranges that together encode a
//! contiguous range of codepoints in UTF-8.
//!
//! Used by the NFA builder to expand `CharClass::Unicode` into byte-level
//! transitions. Replaces `regex_syntax::utf8::Utf8Sequences`.

/// An inclusive byte range within a single byte position of a UTF-8 sequence.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Utf8Range {
    pub start: u8,
    pub end: u8,
}

/// A UTF-8 byte sequence: 1–4 `Utf8Range` values representing one path
/// through the NFA for a contiguous range of codepoints.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Utf8Sequence {
    ranges: [Utf8Range; 4],
    len: u8,
}

impl Utf8Sequence {
    /// Byte ranges in this sequence (1–4 elements).
    pub fn as_slice(&self) -> &[Utf8Range] {
        &self.ranges[..self.len as usize]
    }
}

/// Iterator yielding `Utf8Sequence` values for a codepoint range `[lo, hi]`.
///
/// Partitions the range by UTF-8 byte-length boundaries and computes the
/// minimal set of byte-range sequences for each partition. Skips the
/// surrogate range `U+D800..U+DFFF`.
pub struct Utf8Sequences {
    seqs: Vec<Utf8Sequence>,
    index: usize,
}

impl Utf8Sequences {
    /// Create an iterator over UTF-8 byte sequences for codepoints in `[lo, hi]`.
    pub fn new(lo: char, hi: char) -> Self {
        let mut seqs = Vec::new();
        let lo = lo as u32;
        let hi = hi as u32;
        encode_range(&mut seqs, lo, hi);
        Self { seqs, index: 0 }
    }
}

impl Iterator for Utf8Sequences {
    type Item = Utf8Sequence;

    fn next(&mut self) -> Option<Self::Item> {
        if self.index < self.seqs.len() {
            let seq = self.seqs[self.index].clone();
            self.index += 1;
            Some(seq)
        } else {
            None
        }
    }
}

// ── UTF-8 encoding boundaries ──────────────────────────────────────────

/// UTF-8 byte-length boundaries.
const BOUNDARIES: [(u32, u32); 4] = [
    (0x0000, 0x007F),    // 1-byte
    (0x0080, 0x07FF),    // 2-byte
    (0x0800, 0xFFFF),    // 3-byte (includes surrogate gap)
    (0x10000, 0x10FFFF), // 4-byte
];

/// Encode the codepoint range `[lo, hi]` into minimal UTF-8 byte sequences.
fn encode_range(out: &mut Vec<Utf8Sequence>, lo: u32, hi: u32) {
    if lo > hi {
        return;
    }

    for &(bnd_lo, bnd_hi) in &BOUNDARIES {
        // Intersect [lo, hi] with this byte-length partition.
        let r_lo = lo.max(bnd_lo);
        let r_hi = hi.min(bnd_hi);
        if r_lo > r_hi {
            continue;
        }

        // Skip surrogate range within the 3-byte partition.
        if bnd_lo == 0x0800 {
            // Before surrogates.
            if r_lo <= 0xD7FF {
                encode_partition(out, r_lo, r_hi.min(0xD7FF));
            }
            // After surrogates.
            if r_hi >= 0xE000 {
                encode_partition(out, r_lo.max(0xE000), r_hi);
            }
        } else {
            encode_partition(out, r_lo, r_hi);
        }
    }
}

/// Encode a single byte-length partition `[lo, hi]` into UTF-8 byte sequences.
///
/// All codepoints in `[lo, hi]` have the same UTF-8 byte length. We split
/// the range into sub-ranges where each byte position is a contiguous range.
fn encode_partition(out: &mut Vec<Utf8Sequence>, lo: u32, hi: u32) {
    if lo > hi {
        return;
    }

    let lo_bytes = encode_utf8(lo);
    let hi_bytes = encode_utf8(hi);
    let len = lo_bytes.len();
    debug_assert_eq!(len, hi_bytes.len());

    split_range(out, &lo_bytes, &hi_bytes, 0);
}

/// Recursively split a UTF-8 byte range into sequences where each byte
/// position covers a contiguous range.
fn split_range(out: &mut Vec<Utf8Sequence>, lo: &[u8], hi: &[u8], depth: usize) {
    if depth >= lo.len() {
        return;
    }

    if lo == hi {
        // Single codepoint — emit one sequence with exact bytes.
        let mut ranges = [Utf8Range { start: 0, end: 0 }; 4];
        for (i, &b) in lo.iter().enumerate() {
            ranges[i] = Utf8Range { start: b, end: b };
        }
        out.push(Utf8Sequence {
            ranges,
            len: lo.len() as u8,
        });
        return;
    }

    if depth == lo.len() - 1 {
        // Last byte — emit a single range.
        let mut ranges = [Utf8Range { start: 0, end: 0 }; 4];
        for i in 0..depth {
            ranges[i] = Utf8Range {
                start: lo[i],
                end: lo[i],
            };
        }
        ranges[depth] = Utf8Range {
            start: lo[depth],
            end: hi[depth],
        };
        // Verify all prefix bytes are equal.
        if lo[..depth] == hi[..depth] {
            out.push(Utf8Sequence {
                ranges,
                len: lo.len() as u8,
            });
        } else {
            // Prefix bytes differ — need to split further.
            split_at_boundary(out, lo, hi, depth);
        }
        return;
    }

    // Check if prefix bytes match. If so, recurse on remaining bytes.
    if lo[depth] == hi[depth] {
        split_range(out, lo, hi, depth + 1);
        return;
    }

    split_at_boundary(out, lo, hi, depth);
}

/// Split a range where bytes at `depth` differ.
///
/// Strategy: split into up to 3 sub-ranges:
/// 1. `lo[depth]` with lo's continuation → max continuation
/// 2. `lo[depth]+1 .. hi[depth]-1` with full continuation range
/// 3. `hi[depth]` with min continuation → hi's continuation
fn split_at_boundary(out: &mut Vec<Utf8Sequence>, lo: &[u8], hi: &[u8], depth: usize) {
    let len = lo.len();
    let cont_min = 0x80u8;
    let cont_max = 0xBFu8;

    // Part 1: lo[depth] with lo's continuation bytes → max continuation.
    if lo[depth] < hi[depth] || depth == len - 1 {
        let mut hi1 = lo.to_vec();
        for i in (depth + 1)..len {
            hi1[i] = cont_max;
        }
        split_range(out, lo, &hi1, depth);
    }

    // Part 2: middle range — full continuation byte ranges.
    let mid_lo = lo[depth] + 1;
    let mid_hi = hi[depth].saturating_sub(1);
    if mid_lo <= mid_hi {
        let mut ranges = [Utf8Range { start: 0, end: 0 }; 4];
        for i in 0..depth {
            debug_assert_eq!(lo[i], hi[i]);
            ranges[i] = Utf8Range {
                start: lo[i],
                end: lo[i],
            };
        }
        ranges[depth] = Utf8Range {
            start: mid_lo,
            end: mid_hi,
        };
        for i in (depth + 1)..len {
            ranges[i] = Utf8Range {
                start: cont_min,
                end: cont_max,
            };
        }
        out.push(Utf8Sequence {
            ranges,
            len: len as u8,
        });
    }

    // Part 3: hi[depth] with min continuation → hi's continuation bytes.
    if hi[depth] > lo[depth] {
        let mut lo3 = hi.to_vec();
        for i in (depth + 1)..len {
            lo3[i] = cont_min;
        }
        split_range(out, &lo3, hi, depth);
    }
}

/// Encode a codepoint as UTF-8 bytes.
fn encode_utf8(cp: u32) -> Vec<u8> {
    let ch = char::from_u32(cp).expect("invalid codepoint");
    let mut buf = [0u8; 4];
    let s = ch.encode_utf8(&mut buf);
    s.as_bytes().to_vec()
}
