//! 256-bit bitset — one bit per possible byte value (0x00–0xFF).
//!
//! Foundation type for NFA transitions and byte equivalence class computation.
//! Supports set operations (union, intersect, complement) and iteration.

use smallvec::SmallVec;

/// A 256-bit bitset representing a set of byte values.
///
/// Used to describe which input bytes trigger a given NFA transition.
/// Stored as four `u64` words: word 0 covers bytes 0x00–0x3F, word 1 covers
/// 0x40–0x7F, word 2 covers 0x80–0xBF, word 3 covers 0xC0–0xFF.
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct ByteSet(pub(crate) [u64; 4]);

impl ByteSet {
    /// Empty set — no bytes.
    #[inline]
    pub const fn empty() -> Self {
        Self([0; 4])
    }

    /// Full set — all 256 bytes.
    #[inline]
    pub const fn full() -> Self {
        Self([u64::MAX; 4])
    }

    /// ASCII set — bytes 0x00–0x7F.
    #[inline]
    pub const fn ascii() -> Self {
        Self([u64::MAX, u64::MAX, 0, 0])
    }

    /// Singleton set containing exactly one byte.
    #[inline]
    pub fn singleton(b: u8) -> Self {
        let mut s = Self::empty();
        s.insert(b);
        s
    }

    /// Inclusive range [lo, hi].
    #[inline]
    pub fn range(lo: u8, hi: u8) -> Self {
        let mut s = Self::empty();
        for b in lo..=hi {
            s.insert(b);
        }
        s
    }

    /// Whether this set contains the given byte.
    #[inline]
    pub fn contains(&self, b: u8) -> bool {
        let word = (b >> 6) as usize;
        let bit = b & 0x3F;
        self.0[word] & (1u64 << bit) != 0
    }

    /// Insert a byte into the set.
    #[inline]
    pub fn insert(&mut self, b: u8) {
        let word = (b >> 6) as usize;
        let bit = b & 0x3F;
        self.0[word] |= 1u64 << bit;
    }

    /// Remove a byte from the set.
    #[inline]
    pub fn remove(&mut self, b: u8) {
        let word = (b >> 6) as usize;
        let bit = b & 0x3F;
        self.0[word] &= !(1u64 << bit);
    }

    /// Set union (bytes in either set).
    #[inline]
    pub fn union(&self, other: &Self) -> Self {
        Self([
            self.0[0] | other.0[0],
            self.0[1] | other.0[1],
            self.0[2] | other.0[2],
            self.0[3] | other.0[3],
        ])
    }

    /// Mutating union.
    #[inline]
    pub fn union_with(&mut self, other: &Self) {
        self.0[0] |= other.0[0];
        self.0[1] |= other.0[1];
        self.0[2] |= other.0[2];
        self.0[3] |= other.0[3];
    }

    /// Set intersection (bytes in both sets).
    #[inline]
    pub fn intersect(&self, other: &Self) -> Self {
        Self([
            self.0[0] & other.0[0],
            self.0[1] & other.0[1],
            self.0[2] & other.0[2],
            self.0[3] & other.0[3],
        ])
    }

    /// Set complement (all bytes NOT in this set).
    #[inline]
    pub fn negate(&self) -> Self {
        Self([!self.0[0], !self.0[1], !self.0[2], !self.0[3]])
    }

    /// Set difference (bytes in self but not in other).
    #[inline]
    pub fn difference(&self, other: &Self) -> Self {
        Self([
            self.0[0] & !other.0[0],
            self.0[1] & !other.0[1],
            self.0[2] & !other.0[2],
            self.0[3] & !other.0[3],
        ])
    }

    /// Whether this set is empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.0[0] == 0 && self.0[1] == 0 && self.0[2] == 0 && self.0[3] == 0
    }

    /// Number of bytes in the set (popcount).
    #[inline]
    pub fn len(&self) -> u32 {
        self.0[0].count_ones()
            + self.0[1].count_ones()
            + self.0[2].count_ones()
            + self.0[3].count_ones()
    }

    /// Whether two sets are disjoint (no byte in common).
    #[inline]
    pub fn is_disjoint(&self, other: &Self) -> bool {
        self.intersect(other).is_empty()
    }

    /// Whether this set is a subset of another.
    #[inline]
    pub fn is_subset(&self, other: &Self) -> bool {
        self.difference(other).is_empty()
    }

    /// Iterate over all bytes in the set, ascending.
    #[inline]
    pub fn iter(&self) -> ByteSetIter {
        ByteSetIter {
            set: *self,
            word: 0,
            bits: self.0[0],
        }
    }

    /// Collect the bytes NOT in this set (the "exit bytes" for self-loop acceleration).
    /// Returns up to `limit` exit bytes; returns None if more than `limit` exist.
    pub fn exit_bytes(&self, limit: usize) -> Option<SmallVec<[u8; 8]>> {
        let complement = self.negate();
        let count = complement.len() as usize;
        if count > limit {
            return None;
        }
        Some(complement.iter().collect())
    }

    /// Collect all bytes in this set into a SmallVec.
    pub fn to_bytes(&self) -> SmallVec<[u8; 8]> {
        self.iter().collect()
    }
}

impl std::fmt::Debug for ByteSet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let count = self.len();
        if count == 0 {
            return write!(f, "ByteSet{{}}");
        }
        if count == 256 {
            return write!(f, "ByteSet{{ALL}}");
        }
        write!(f, "ByteSet{{")?;
        let mut first = true;
        let mut printed = 0;
        for b in self.iter() {
            if printed >= 16 {
                write!(f, ", ...+{}", count as usize - printed)?;
                break;
            }
            if !first {
                write!(f, ", ")?;
            }
            first = false;
            if b.is_ascii_graphic() {
                write!(f, "'{}'", b as char)?;
            } else {
                write!(f, "0x{:02X}", b)?;
            }
            printed += 1;
        }
        write!(f, "}}")
    }
}

/// Iterator over bytes in a `ByteSet`, ascending order.
pub struct ByteSetIter {
    set: ByteSet,
    word: usize,
    bits: u64,
}

impl Iterator for ByteSetIter {
    type Item = u8;

    #[inline]
    fn next(&mut self) -> Option<u8> {
        loop {
            if self.bits != 0 {
                let bit = self.bits.trailing_zeros();
                self.bits &= self.bits - 1; // clear lowest set bit
                return Some((self.word as u32 * 64 + bit) as u8);
            }
            self.word += 1;
            if self.word >= 4 {
                return None;
            }
            self.bits = self.set.0[self.word];
        }
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        let remaining = self.bits.count_ones() as usize
            + if self.word + 1 < 4 {
                self.set.0[self.word + 1..].iter().map(|w| w.count_ones() as usize).sum()
            } else {
                0
            };
        (remaining, Some(remaining))
    }
}

impl ExactSizeIterator for ByteSetIter {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_set() {
        let s = ByteSet::empty();
        assert!(s.is_empty());
        assert_eq!(s.len(), 0);
        assert!(!s.contains(0));
        assert!(!s.contains(255));
        assert_eq!(s.iter().count(), 0);
    }

    #[test]
    fn full_set() {
        let s = ByteSet::full();
        assert!(!s.is_empty());
        assert_eq!(s.len(), 256);
        assert!(s.contains(0));
        assert!(s.contains(127));
        assert!(s.contains(255));
        assert_eq!(s.iter().count(), 256);
    }

    #[test]
    fn ascii_set() {
        let s = ByteSet::ascii();
        assert_eq!(s.len(), 128);
        assert!(s.contains(0));
        assert!(s.contains(127));
        assert!(!s.contains(128));
        assert!(!s.contains(255));
    }

    #[test]
    fn singleton() {
        let s = ByteSet::singleton(b'a');
        assert_eq!(s.len(), 1);
        assert!(s.contains(b'a'));
        assert!(!s.contains(b'b'));
        assert_eq!(s.iter().collect::<Vec<_>>(), vec![b'a']);
    }

    #[test]
    fn range() {
        let s = ByteSet::range(b'a', b'z');
        assert_eq!(s.len(), 26);
        assert!(s.contains(b'a'));
        assert!(s.contains(b'z'));
        assert!(!s.contains(b'A'));
        assert!(!s.contains(b'a' - 1));
    }

    #[test]
    fn range_boundary() {
        // Range spanning word boundary (0x3F = 63, 0x40 = 64).
        let s = ByteSet::range(60, 70);
        assert_eq!(s.len(), 11);
        for b in 60..=70 {
            assert!(s.contains(b), "should contain {}", b);
        }
        assert!(!s.contains(59));
        assert!(!s.contains(71));
    }

    #[test]
    fn union_and_intersect() {
        let a = ByteSet::range(b'a', b'f');
        let b = ByteSet::range(b'd', b'k');
        let u = a.union(&b);
        assert_eq!(u.len(), 11); // a-k
        let i = a.intersect(&b);
        assert_eq!(i.len(), 3); // d-f
    }

    #[test]
    fn negate() {
        let s = ByteSet::singleton(b'x');
        let n = s.negate();
        assert_eq!(n.len(), 255);
        assert!(!n.contains(b'x'));
        assert!(n.contains(b'y'));
    }

    #[test]
    fn difference() {
        let a = ByteSet::range(b'a', b'z');
        let b = ByteSet::range(b'a', b'f');
        let d = a.difference(&b);
        assert_eq!(d.len(), 20); // g-z
        assert!(!d.contains(b'a'));
        assert!(d.contains(b'g'));
    }

    #[test]
    fn disjoint() {
        let a = ByteSet::range(b'a', b'f');
        let b = ByteSet::range(b'g', b'z');
        assert!(a.is_disjoint(&b));
        let c = ByteSet::range(b'f', b'g');
        assert!(!a.is_disjoint(&c));
    }

    #[test]
    fn insert_remove() {
        let mut s = ByteSet::empty();
        s.insert(42);
        assert!(s.contains(42));
        assert_eq!(s.len(), 1);
        s.remove(42);
        assert!(!s.contains(42));
        assert_eq!(s.len(), 0);
    }

    #[test]
    fn iterator_ascending() {
        let s = ByteSet::range(250, 255);
        let v: Vec<u8> = s.iter().collect();
        assert_eq!(v, vec![250, 251, 252, 253, 254, 255]);
    }

    #[test]
    fn exit_bytes() {
        // Set with all but 3 bytes → 3 exit bytes.
        let mut s = ByteSet::full();
        s.remove(b'"');
        s.remove(b'\\');
        s.remove(b'\n');
        let exits = s.negate();
        assert_eq!(exits.len(), 3);
        let eb = s.exit_bytes(8).unwrap();
        assert_eq!(eb.len(), 3);
        assert!(eb.contains(&b'"'));
        assert!(eb.contains(&b'\\'));
        assert!(eb.contains(&b'\n'));
    }

    #[test]
    fn exit_bytes_over_limit() {
        let s = ByteSet::range(0, 100); // 101 bytes set → 155 exit bytes
        assert!(s.exit_bytes(8).is_none());
    }

    #[test]
    fn exact_size_iterator() {
        let s = ByteSet::range(b'A', b'Z');
        let iter = s.iter();
        assert_eq!(iter.len(), 26);
    }

    #[test]
    fn high_bytes_utf8_leading() {
        // UTF-8 leading bytes for 2-byte sequences: 0xC2–0xDF.
        let s = ByteSet::range(0xC2, 0xDF);
        assert_eq!(s.len(), 30);
        assert!(s.contains(0xC2));
        assert!(s.contains(0xDF));
        assert!(!s.contains(0xC1));
        assert!(!s.contains(0xE0));
    }

    #[test]
    fn high_bytes_utf8_continuation() {
        // UTF-8 continuation bytes: 0x80–0xBF.
        let s = ByteSet::range(0x80, 0xBF);
        assert_eq!(s.len(), 64);
        assert!(s.contains(0x80));
        assert!(s.contains(0xBF));
        assert!(!s.contains(0x7F));
        assert!(!s.contains(0xC0));
    }
}
