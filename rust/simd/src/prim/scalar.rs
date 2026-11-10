//! The scalar oracle of every block primitive.
//!
//! Each function here is the specification its NEON body in
//! `prim::neon` is held to, byte for byte (`tests/prim_differential.rs`).
//! [`crate::prim`] runs these on every tier but NEON, under the
//! `force-scalar` feature, under `PARSE_THAT_SCAN_TIER=scalar` and under
//! Miri.

use super::{BlockClasses, KindPartition, StringSpecialBlock, StructuralClassify64, Utf8BlockStatus};

/// Bit `i` is set iff `src[i]` is in `set`.
///
/// ```
/// let mut block = [b'a'; 64];
/// block[3] = b',';
/// assert_eq!(parse_that_simd::prim::scalar::byte_class_from_eq_set_64(&block, b","), 1 << 3);
/// ```
pub fn byte_class_from_eq_set_64(src: &[u8; 64], set: &[u8]) -> u64 {
    let mut mask = 0u64;
    for (i, byte) in src.iter().enumerate() {
        if set.contains(byte) {
            mask |= 1u64 << i;
        }
    }
    mask
}

/// One mask per kind bucket of `partition`, and their union.
///
/// ```
/// use parse_that_simd::prim::{KindPartition, scalar};
/// let mut block = [b' '; 64];
/// block[0] = b'(';
/// block[9] = b')';
/// let kinds = KindPartition { open: b"(", close: b")", quote: b"", slash: b"", stop: b"" };
/// let classes = scalar::structural_classify_64(&block, &kinds);
/// assert_eq!((classes.open, classes.close, classes.significant), (1, 1 << 9, 1 | 1 << 9));
/// ```
pub fn structural_classify_64(src: &[u8; 64], partition: &KindPartition<'_>) -> StructuralClassify64 {
    let mut out = StructuralClassify64::default();
    for (i, byte) in src.iter().enumerate() {
        let bit = 1u64 << i;
        if partition.open.contains(byte) {
            out.open |= bit;
        }
        if partition.close.contains(byte) {
            out.close |= bit;
        }
        if partition.quote.contains(byte) {
            out.quote |= bit;
        }
        if partition.slash.contains(byte) {
            out.slash |= bit;
        }
        if partition.stop.contains(byte) {
            out.stop |= bit;
        }
    }
    out.significant = out.open | out.close | out.quote | out.slash | out.stop;
    out
}

/// The bracket-interior mask and the depth after the block: see
/// [`crate::prim::bracket_depth_mask_64`].
///
/// ```
/// let mut block = [b'x'; 64];
/// block[1] = b'(';
/// block[4] = b')';
/// let (inside, depth) = parse_that_simd::prim::scalar::bracket_depth_mask_64(&block, b"(", b")", 0);
/// assert_eq!((inside, depth), (0b11100, 0));
/// ```
pub fn bracket_depth_mask_64(src: &[u8; 64], opens: &[u8], closes: &[u8], depth_in: i32) -> (u64, i32) {
    running_balance(
        byte_class_from_eq_set_64(src, opens),
        byte_class_from_eq_set_64(src, closes),
        depth_in,
    )
}

/// The running bracket balance over precomputed open and close event
/// masks; the NEON body shares it (only the classification is vector).
pub(crate) fn running_balance(opens: u64, closes: u64, depth_in: i32) -> (u64, i32) {
    let mut mask = 0u64;
    let mut depth = depth_in;
    for i in 0..64 {
        let bit = 1u64 << i;
        if opens & bit != 0 {
            if depth > 0 {
                mask |= bit;
            }
            depth += 1;
        } else if closes & bit != 0 {
            // An unbalanced close at depth 0 is not marked and does not
            // take the depth negative.
            if depth > 0 {
                mask |= bit;
                depth -= 1;
            }
        } else if depth > 0 {
            mask |= bit;
        }
    }
    (mask, depth)
}

/// [`crate::prim::Lo6Table::classify`] on one block.
///
/// ```
/// use parse_that_simd::prim::{Lo6Table, scalar};
/// let table = Lo6Table::from_members(b",");
/// let mut block = [b'a'; 64];
/// block[2] = b',';
/// block[5] = b'"';
/// let classes = scalar::lo6_classify(&table, &block, b'"', b'\\', 0x20);
/// assert_eq!((classes.structural_mask, classes.terminator_mask), (1 << 2, 1 << 5));
/// ```
pub fn lo6_classify(
    table: &super::Lo6Table,
    src: &[u8; 64],
    terminator: u8,
    escape: u8,
    control_limit: u8,
) -> BlockClasses {
    let mut out = BlockClasses::default();
    for (i, &byte) in src.iter().enumerate() {
        let bit = 1u64 << i;
        if table.is_member(byte) {
            out.structural_mask |= bit;
        }
        if byte == terminator {
            out.terminator_mask |= bit;
        }
        if byte == escape {
            out.escape_mask |= bit;
        }
        if byte < control_limit {
            out.control_mask |= bit;
        }
    }
    out
}

/// The terminator, escape, control (`< control_limit`) and non-ASCII
/// masks of one 16-byte block.
///
/// ```
/// let block = *b"ab\"c\\d\x01efghijklm";
/// let special = parse_that_simd::prim::scalar::string_special_block(&block, b'"', b'\\', 0x20);
/// assert_eq!((special.terminator_mask, special.escape_mask, special.control_mask), (1 << 2, 1 << 4, 1 << 6));
/// ```
pub fn string_special_block(bytes: &[u8; 16], terminator: u8, escape: u8, control_limit: u8) -> StringSpecialBlock {
    let mut block = StringSpecialBlock::default();
    for (index, &byte) in bytes.iter().enumerate() {
        let bit = 1u16 << index;
        if byte == terminator {
            block.terminator_mask |= bit;
        }
        if byte == escape {
            block.escape_mask |= bit;
        }
        if byte < control_limit {
            block.control_mask |= bit;
        }
        if byte >= 0x80 {
            block.non_ascii_mask |= bit;
        }
    }
    block
}

/// UTF-8 validity of one 16-byte block; see [`Utf8BlockStatus`].
///
/// ```
/// let status = parse_that_simd::prim::scalar::validate_utf8_block(b"plain ascii text");
/// assert!(status.is_valid_and_complete());
/// ```
pub fn validate_utf8_block(bytes: &[u8; 16]) -> Utf8BlockStatus {
    let mut cursor = 0usize;
    while cursor < bytes.len() {
        let first = bytes[cursor];
        if first < 0x80 {
            cursor += 1;
            continue;
        }
        let width = match first {
            0xc2..=0xdf => 2,
            0xe0..=0xef => 3,
            0xf0..=0xf4 => 4,
            _ => return Utf8BlockStatus::invalid(cursor as u8),
        };
        if cursor + width > bytes.len() {
            return Utf8BlockStatus::valid_prefix(cursor as u8);
        }
        if !valid_sequence(bytes, cursor, width) {
            return Utf8BlockStatus::invalid(cursor as u8);
        }
        cursor += width;
    }
    Utf8BlockStatus::valid_complete()
}

fn valid_sequence(bytes: &[u8; 16], cursor: usize, width: usize) -> bool {
    let cont = |b: u8| (0x80..=0xbf).contains(&b);
    let second = bytes[cursor + 1];
    match (width, bytes[cursor]) {
        (2, _) => cont(second),
        (3, 0xe0) => (0xa0..=0xbf).contains(&second) && cont(bytes[cursor + 2]),
        (3, 0xed) => (0x80..=0x9f).contains(&second) && cont(bytes[cursor + 2]),
        (3, _) => cont(second) && cont(bytes[cursor + 2]),
        (4, 0xf0) => (0x90..=0xbf).contains(&second) && cont(bytes[cursor + 2]) && cont(bytes[cursor + 3]),
        (4, 0xf4) => (0x80..=0x8f).contains(&second) && cont(bytes[cursor + 2]) && cont(bytes[cursor + 3]),
        (4, _) => cont(second) && cont(bytes[cursor + 2]) && cont(bytes[cursor + 3]),
        _ => false,
    }
}

/// Decode four packed 4-digit hex quads (`b"0041"` → `0x41`), or `None`
/// when any of the 16 bytes is not an ASCII hex digit.
///
/// ```
/// assert_eq!(parse_that_simd::prim::scalar::decode_hex_quads(b"0041d83Dde00FFFF"), Some([0x41, 0xd83d, 0xde00, 0xffff]));
/// assert_eq!(parse_that_simd::prim::scalar::decode_hex_quads(b"00g1000000000000"), None);
/// ```
pub fn decode_hex_quads(bytes: &[u8; 16]) -> Option<[u32; 4]> {
    let mut out = [0u32; 4];
    for (quad, value) in out.iter_mut().enumerate() {
        for &byte in &bytes[quad * 4..quad * 4 + 4] {
            let nibble = match byte {
                b'0'..=b'9' => byte - b'0',
                b'A'..=b'F' => byte - b'A' + 10,
                b'a'..=b'f' => byte - b'a' + 10,
                _ => return None,
            };
            *value = (*value << 4) | u32::from(nibble);
        }
    }
    Some(out)
}
