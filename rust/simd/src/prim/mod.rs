//! Block primitives: fixed-width classification kernels a hand-written
//! or generated scanner composes into its own loop.
//!
//! [`crate::scan_structural`] is a whole scan. A primitive is one step
//! of one: it classifies one 64-byte (or 16-byte) block against
//! caller data (byte sets, a kind partition, a 64-entry table) and
//! returns bitmasks, bit `i` for byte `i`. The caller owns the loop,
//! the carries and the meaning of each byte; no primitive names a
//! grammar.
//!
//! Each primitive has one scalar oracle ([`scalar`]) and, on aarch64,
//! one NEON body. Which runs is the crate's one tier decision,
//! [`crate::selected_tier`]: the NEON body when it selects
//! [`crate::Tier::Neon`], the oracle on every other tier (and so under
//! `force-scalar`, `PARSE_THAT_SCAN_TIER=scalar` and Miri). The two are
//! held equal by `tests/prim_differential.rs`.

pub mod scalar;

#[cfg(target_arch = "aarch64")]
mod neon;

/// Whether the selected tier runs the NEON bodies.
#[cfg(target_arch = "aarch64")]
#[inline(always)]
fn neon() -> bool {
    crate::selected_tier() == crate::Tier::Neon
}

/// Run the NEON body when the selected tier is NEON, else the oracle.
macro_rules! dispatch {
    ($name:ident($($arg:expr),*)) => {{
        #[cfg(target_arch = "aarch64")]
        if neon() {
            return neon::$name($($arg),*);
        }
        scalar::$name($($arg),*)
    }};
}

/// Bit `i` is set iff `src[i]` is one of the bytes of `set`.
///
/// ```
/// use parse_that_simd::prim::byte_class_from_eq_set_64;
/// let mut block = [b'a'; 64];
/// block[0] = b'"';
/// block[63] = b'\'';
/// assert_eq!(byte_class_from_eq_set_64(&block, b"\"'"), 1 | 1 << 63);
/// ```
#[inline]
pub fn byte_class_from_eq_set_64(src: &[u8; 64], set: &[u8]) -> u64 {
    dispatch!(byte_class_from_eq_set_64(src, set))
}

/// A caller's structural bytes, partitioned into five kind buckets.
///
/// A byte in two buckets sets both kind bits. The bucket names are the
/// roles a bracket-and-string scanner gives its bytes; which bytes fill
/// them is the caller's.
#[derive(Copy, Clone, Debug)]
pub struct KindPartition<'a> {
    /// Opening brackets.
    pub open: &'a [u8],
    /// Closing brackets.
    pub close: &'a [u8],
    /// String quotes.
    pub quote: &'a [u8],
    /// The first byte of a comment opener.
    pub slash: &'a [u8],
    /// Stop delimiters.
    pub stop: &'a [u8],
}

/// [`structural_classify_64`]'s result: one mask per kind and their
/// union, bit `i` for `src[i]`.
#[derive(Copy, Clone, Debug, Default, PartialEq, Eq)]
pub struct StructuralClassify64 {
    /// Bytes in any bucket.
    pub significant: u64,
    /// Bytes in [`KindPartition::open`].
    pub open: u64,
    /// Bytes in [`KindPartition::close`].
    pub close: u64,
    /// Bytes in [`KindPartition::quote`].
    pub quote: u64,
    /// Bytes in [`KindPartition::slash`].
    pub slash: u64,
    /// Bytes in [`KindPartition::stop`].
    pub stop: u64,
}

/// Classify a 64-byte block by `partition`: a scanner iterates
/// `significant` and reads each byte's kind from the kind masks.
///
/// ```
/// use parse_that_simd::prim::{KindPartition, structural_classify_64};
/// let block: [u8; 64] = *b"a(b)c;d--------------------------------------------------------e";
/// let kinds = KindPartition { open: b"(", close: b")", quote: b"\"'", slash: b"/", stop: b";" };
/// let classes = structural_classify_64(&block, &kinds);
/// assert_eq!(classes.significant, 0b10_1010);
/// assert_eq!(classes.stop, 1 << 5);
/// ```
#[inline]
pub fn structural_classify_64(src: &[u8; 64], partition: &KindPartition<'_>) -> StructuralClassify64 {
    dispatch!(structural_classify_64(src, partition))
}

/// The bracket-interior mask of a 64-byte block, and the depth after it.
///
/// Bit `i` is set iff `src[i]` is at depth ≥ 1 under the bracket bytes
/// `opens`/`closes`: an opener is marked only when already nested, its
/// matching closer is marked. `depth_in` is the depth before `src[0]`
/// (0 at the start of a scan); a closer at depth 0 is unmarked and the
/// depth never goes negative.
///
/// ```
/// use parse_that_simd::prim::bracket_depth_mask_64;
/// let mut block = [b'x'; 64];
/// block[0] = b'[';
/// block[2] = b']';
/// let (inside, depth) = bracket_depth_mask_64(&block, b"([{", b")]}", 0);
/// assert_eq!(inside, 0b110);
/// assert_eq!(depth, 0);
/// ```
#[inline]
pub fn bracket_depth_mask_64(src: &[u8; 64], opens: &[u8], closes: &[u8], depth_in: i32) -> (u64, i32) {
    dispatch!(bracket_depth_mask_64(src, opens, closes, depth_in))
}

/// A 64-entry table classifying bytes by their low six bits: byte `b`
/// is a member iff `b != 0` and `table[b & 0x3f] == b`. A member set is
/// admissible iff no two members share their low six bits.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Lo6Table {
    table: [u8; 64],
}

impl Lo6Table {
    /// The table whose members are `members`.
    ///
    /// # Panics
    /// When two members share their low six bits, or a member is 0.
    pub const fn from_members(members: &[u8]) -> Self {
        let mut table = [0u8; 64];
        let mut i = 0;
        while i < members.len() {
            let byte = members[i];
            let slot = (byte & 0x3f) as usize;
            assert!(byte != 0 && table[slot] == 0, "Lo6Table: member 0, or two members share their low six bits");
            table[slot] = byte;
            i += 1;
        }
        Self { table }
    }

    /// Whether `byte` is a member.
    #[inline]
    pub fn is_member(&self, byte: u8) -> bool {
        byte != 0 && self.table[(byte & 0x3f) as usize] == byte
    }

    #[cfg(target_arch = "aarch64")]
    #[inline]
    pub(crate) fn bytes(&self) -> &[u8; 64] {
        &self.table
    }

    /// Classify one 64-byte block: its members, and the bytes equal to
    /// `terminator`, equal to `escape`, and below `control_limit`.
    ///
    /// ```
    /// use parse_that_simd::prim::Lo6Table;
    /// const JSON: Lo6Table = Lo6Table::from_members(b"{}[],:\"");
    /// let mut block = [b' '; 64];
    /// block[..8].copy_from_slice(b"{\"a\\\"\":1");
    /// let classes = JSON.classify(&block, b'"', b'\\', 0x20);
    /// assert_eq!(classes.structural_mask, 0b111_0011);
    /// assert_eq!(classes.terminator_mask, 0b11_0010);
    /// assert_eq!(classes.escape_mask, 1 << 3);
    /// assert_eq!(classes.control_mask, 0);
    /// ```
    #[inline]
    pub fn classify(&self, src: &[u8; 64], terminator: u8, escape: u8, control_limit: u8) -> BlockClasses {
        dispatch!(lo6_classify(self, src, terminator, escape, control_limit))
    }
}

/// [`Lo6Table::classify`]'s result, bit `i` for `src[i]`.
#[derive(Debug, Copy, Clone, Default, PartialEq, Eq)]
pub struct BlockClasses {
    /// Table members.
    pub structural_mask: u64,
    /// Bytes equal to the terminator.
    pub terminator_mask: u64,
    /// Bytes equal to the escape.
    pub escape_mask: u64,
    /// Bytes below the control limit.
    pub control_mask: u64,
}

/// [`string_special_block`]'s result, bit `i` for byte `i`.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct StringSpecialBlock {
    /// Bytes equal to the terminator.
    pub terminator_mask: u16,
    /// Bytes equal to the escape.
    pub escape_mask: u16,
    /// Bytes below the control limit.
    pub control_mask: u16,
    /// Bytes `>= 0x80`.
    pub non_ascii_mask: u16,
}

/// The bytes of a 16-byte block that end a plain run inside a string
/// literal: the terminator, the escape, a control byte
/// (`< control_limit`), and a non-ASCII byte.
///
/// ```
/// use parse_that_simd::prim::string_special_block;
/// let special = string_special_block(b"caf\xc3\xa9 \"done\" ok!", b'"', b'\\', 0x20);
/// assert_eq!(special.non_ascii_mask, 0b11000);
/// assert_eq!(special.terminator_mask, 1 << 6 | 1 << 11);
/// ```
#[inline]
pub fn string_special_block(bytes: &[u8; 16], terminator: u8, escape: u8, control_limit: u8) -> StringSpecialBlock {
    dispatch!(string_special_block(bytes, terminator, escape, control_limit))
}

/// [`validate_utf8_block`]'s result.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Utf8BlockStatus {
    is_valid: bool,
    complete_bytes: u8,
    bad_byte_offset: u8,
    continues: bool,
}

impl Utf8BlockStatus {
    const BAD_OFFSET_NONE: u8 = u8::MAX;

    const fn valid_complete() -> Self {
        Self { is_valid: true, complete_bytes: 16, bad_byte_offset: Self::BAD_OFFSET_NONE, continues: false }
    }

    const fn valid_prefix(complete_bytes: u8) -> Self {
        Self { is_valid: true, complete_bytes, bad_byte_offset: Self::BAD_OFFSET_NONE, continues: true }
    }

    const fn invalid(bad_byte_offset: u8) -> Self {
        Self { is_valid: false, complete_bytes: bad_byte_offset, bad_byte_offset, continues: false }
    }

    /// The block holds no invalid sequence (it may end inside a valid one).
    pub const fn is_valid(self) -> bool {
        self.is_valid
    }

    /// All 16 bytes are whole, valid UTF-8 sequences.
    pub const fn is_valid_and_complete(self) -> bool {
        self.is_valid && !self.continues && self.complete_bytes == 16
    }

    /// The first [`Self::complete_bytes`] bytes are valid, and a sequence
    /// starting there runs past the block.
    pub const fn is_valid_but_continues(self) -> bool {
        self.is_valid && self.continues
    }

    /// The length of the valid prefix.
    pub const fn complete_bytes(self) -> u8 {
        self.complete_bytes
    }

    /// The offset of the first byte of the first invalid sequence.
    pub const fn bad_byte_offset(self) -> Option<u8> {
        if self.bad_byte_offset == Self::BAD_OFFSET_NONE { None } else { Some(self.bad_byte_offset) }
    }
}

/// UTF-8 validity of a 16-byte block.
///
/// ```
/// use parse_that_simd::prim::validate_utf8_block;
/// assert!(validate_utf8_block(b"0123456789abcdef").is_valid_and_complete());
/// let cut = validate_utf8_block(b"0123456789abcd\xe2\x82");
/// assert!(cut.is_valid_but_continues());
/// assert_eq!(cut.complete_bytes(), 14);
/// assert_eq!(validate_utf8_block(b"0123\xff56789abcdef").bad_byte_offset(), Some(4));
/// ```
#[inline]
pub fn validate_utf8_block(bytes: &[u8; 16]) -> Utf8BlockStatus {
    dispatch!(validate_utf8_block(bytes))
}

/// Decode four packed 4-digit hex quads; `None` when any byte is not an
/// ASCII hex digit. The `\uXXXX` escape decoder's step.
///
/// ```
/// use parse_that_simd::prim::decode_hex_quads;
/// assert_eq!(decode_hex_quads(b"00e9D83Dde00abcd"), Some([0xe9, 0xd83d, 0xde00, 0xabcd]));
/// assert_eq!(decode_hex_quads(b"00e9D83Dde00abcx"), None);
/// ```
#[inline]
pub fn decode_hex_quads(bytes: &[u8; 16]) -> Option<[u32; 4]> {
    dispatch!(decode_hex_quads(bytes))
}

/// A trailing block of at most 64 bytes, zero-padded to 64.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EobBlock {
    /// The input bytes, then zeros.
    pub bytes: [u8; 64],
    /// Bit `i` set iff byte `i` came from the input.
    pub live_mask: u64,
}

/// Pad the end-of-buffer block `input` (at most 64 bytes) to 64 bytes,
/// so a block primitive can classify it without reading past the input.
///
/// ```
/// use parse_that_simd::prim::eob_pad_clamp;
/// let tail = eob_pad_clamp(b"]}");
/// assert_eq!(&tail.bytes[..3], b"]}\0");
/// assert_eq!(tail.live_mask, 0b11);
/// ```
///
/// # Panics
/// When `input` is longer than 64 bytes.
#[inline]
pub fn eob_pad_clamp(input: &[u8]) -> EobBlock {
    assert!(input.len() <= 64, "eob_pad_clamp: a block is at most 64 bytes");
    let mut bytes = [0u8; 64];
    bytes[..input.len()].copy_from_slice(input);
    let live_mask = if input.len() == 64 { u64::MAX } else { (1u64 << input.len()) - 1 };
    EobBlock { bytes, live_mask }
}

/// Append `base + i` to `positions` for every set bit `i` of `mask`,
/// lowest first.
///
/// ```
/// let mut positions = vec![7];
/// parse_that_simd::prim::compact_positions(128, 0b1001, &mut positions);
/// assert_eq!(positions, [7, 128, 131]);
/// ```
#[inline]
pub fn compact_positions(base: u32, mut mask: u64, positions: &mut Vec<u32>) {
    positions.reserve(mask.count_ones() as usize);
    while mask != 0 {
        positions.push(base + mask.trailing_zeros());
        mask &= mask - 1;
    }
}
