//! The padded-input contract of stage 1.
//!
//! A vector kernel reads whole 64-byte blocks. Over a plain `&[u8]` the
//! last block needs a byte-at-a-time epilogue, or a copy, or a read past
//! the end. Stage 1 instead takes its input with [`PADDING`] readable
//! bytes after the logical end, so every block, the last one included, is
//! one set of full-width loads, and the bytes past the end are masked off
//! in registers.
//!
//! The contract has three parts:
//!
//! - **Tail.** The `PADDING` bytes after the logical end are readable.
//!   Their contents are unspecified for a [`PaddedSlice`] and zero for a
//!   [`PaddedInput`]; they never influence a kernel's output.
//! - **Alignment.** None is required. A [`PaddedInput`] allocates its
//!   buffer on a 64-byte boundary, so its blocks never straddle a cache
//!   line.
//! - **Page guard.** No tier reads at or past `len + PADDING`. The guard
//!   page tests place the end of the padding at a `PROT_NONE` page.
//!
//! [`PaddedSlice`] is the borrowed form: any buffer whose length is at
//! least `len + PADDING` (an arena, a reused read buffer, a mapped file
//! with slack) is indexed in place, with no copy. [`PaddedInput`] is the
//! owned form that copies a plain slice once.

/// Readable bytes a stage-1 input carries past its logical end.
pub const PADDING: usize = 64;

/// One 64-byte, 64-aligned block of a [`PaddedInput`] buffer.
#[derive(Clone, Copy)]
#[repr(C, align(64))]
struct Block([u8; 64]);

/// An owned stage-1 input: the bytes, then at least [`PADDING`] zero
/// bytes, in a 64-byte-aligned buffer.
///
/// ```
/// use parse_that_simd::{PADDING, PaddedInput};
/// let input = PaddedInput::from_slice(b"[1, 2]");
/// assert_eq!(input.as_bytes(), b"[1, 2]");
/// assert_eq!(input.as_padded().len(), 6);
/// assert!(input.as_padded().padded_len() >= 6 + PADDING);
/// ```
#[derive(Clone)]
pub struct PaddedInput {
    blocks: Vec<Block>,
    len: usize,
}

impl PaddedInput {
    /// Copy `bytes` into a new padded, aligned buffer.
    pub fn from_slice(bytes: &[u8]) -> Self {
        let n_blocks = (bytes.len() + PADDING).div_ceil(64);
        let mut blocks = vec![Block([0; 64]); n_blocks];
        for (block, chunk) in blocks.iter_mut().zip(bytes.chunks(64)) {
            block.0[..chunk.len()].copy_from_slice(chunk);
        }
        PaddedInput {
            blocks,
            len: bytes.len(),
        }
    }

    /// The logical length.
    #[inline]
    pub fn len(&self) -> usize {
        self.len
    }

    /// `true` iff the logical input is empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    /// The logical bytes.
    #[inline]
    pub fn as_bytes(&self) -> &[u8] {
        &self.buffer()[..self.len]
    }

    /// The borrowed form of this input.
    #[inline]
    pub fn as_padded(&self) -> PaddedSlice<'_> {
        PaddedSlice {
            buf: self.buffer(),
            len: self.len,
        }
    }

    /// The whole buffer, padding included.
    #[inline]
    fn buffer(&self) -> &[u8] {
        // SAFETY: `Block` is `repr(C)` over `[u8; 64]` with no padding
        // bytes, so `blocks` is `64 * blocks.len()` initialized bytes.
        unsafe {
            core::slice::from_raw_parts(self.blocks.as_ptr().cast::<u8>(), self.blocks.len() * 64)
        }
    }
}

impl core::fmt::Debug for PaddedInput {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.debug_struct("PaddedInput").field("len", &self.len).finish_non_exhaustive()
    }
}

/// A borrowed stage-1 input: the first `len` bytes of a buffer that holds
/// at least `len + PADDING` bytes.
///
/// ```
/// use parse_that_simd::{PADDING, PaddedSlice};
/// let mut buf = b"{\"a\": 1}".to_vec();
/// let len = buf.len();
/// buf.resize(len + PADDING, 0xFF); // the padding's contents do not matter
/// let input = PaddedSlice::new(&buf, len).unwrap();
/// assert_eq!(input.bytes(), b"{\"a\": 1}");
/// assert!(PaddedSlice::new(&buf, len + 1).is_none());
/// ```
#[derive(Clone, Copy, Debug)]
pub struct PaddedSlice<'a> {
    buf: &'a [u8],
    len: usize,
}

impl<'a> PaddedSlice<'a> {
    /// The first `len` bytes of `buf`, or `None` when `buf` does not hold
    /// [`PADDING`] bytes past them.
    #[inline]
    pub fn new(buf: &'a [u8], len: usize) -> Option<Self> {
        let need = len.checked_add(PADDING)?;
        (buf.len() >= need).then_some(PaddedSlice { buf, len })
    }

    /// The logical length.
    #[inline]
    pub fn len(&self) -> usize {
        self.len
    }

    /// `true` iff the logical input is empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    /// The logical bytes.
    #[inline]
    pub fn bytes(&self) -> &'a [u8] {
        &self.buf[..self.len]
    }

    /// The readable length, padding included (at least `len + PADDING`).
    #[inline]
    pub fn padded_len(&self) -> usize {
        self.buf.len()
    }

    /// The first byte of the buffer: `padded_len()` bytes are readable
    /// from it.
    #[inline]
    pub(crate) fn as_ptr(&self) -> *const u8 {
        self.buf.as_ptr()
    }
}
