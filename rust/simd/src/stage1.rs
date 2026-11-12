//! Stage 1: the structural index of a two-stage parser.
//!
//! [`stage1`] reads a [`PaddedSlice`] once and returns a
//! [`Stage1Index`]: every structural byte outside string literals and
//! comments, merged in input order with every **atom start** (the first
//! byte of each scalar, the pseudo-structural positions), after validating
//! the whole input as UTF-8 in the same pass.
//!
//! # The index, defined
//!
//! Under a [`Stage1Spec`] (a [`StructuralAlphabet`], a whitespace set and
//! up to [`MAX_COMMENT_CLASSES`] comment classes), each byte of the input
//! is in exactly one state:
//!
//! - **string body**: after an unescaped opening quote of class `k`, up to
//!   and including the next unescaped class-`k` quote. A quote is escaped
//!   iff an odd run of backslashes ends just before it (the rule of
//!   [`crate::scan_structural`]).
//! - **comment body**: after the first byte of a comment opener, up to and
//!   including the last byte of the first closer of that class that starts
//!   after the opener ends. Openers and closers are not escapable, and
//!   neither is recognized inside a string, nor a quote inside a comment.
//! - **outside** otherwise.
//!
//! Then:
//!
//! - a byte outside is **structural** iff it is one of the alphabet's
//!   singletons, or the first byte of one of its digraphs (whose second
//!   byte is inside the input). This is [`crate::scan_structural`]'s set,
//!   less the bytes inside comments.
//! - a byte is an **atom byte** iff it is not structural, not the second
//!   byte of a structural digraph, not whitespace outside a string, not
//!   the first byte of a comment opener and not in a comment body. String
//!   literals, opening quote included, are atom bytes.
//! - an **atom start** is an atom byte whose predecessor is not one.
//!
//! The index holds every structural byte and every atom start, in input
//! order, each with its byte as its kind and a flag that names the atom
//! starts ([`Stage1Index::is_atom`]).
//!
//! # Tiers
//!
//! The scalar oracle ([`crate::scalar::stage1`]) walks bytes. Each SIMD
//! tier classifies one 64-byte block into raw bitmasks with its own
//! instructions and hands them to this module's arch-neutral resolver,
//! which applies the definition above to the masks; the tiers' outputs are
//! byte-identical to the oracle (`tests/stage1.rs`).

use crate::alphabet::StructuralAlphabet;
use crate::index::Stage1Index;
use crate::padded::PaddedSlice;
use crate::stripe::MAX_QUOTE_CLASSES;

/// Comment classes a [`Stage1Spec`] may carry.
pub const MAX_COMMENT_CLASSES: usize = 4;

/// One comment syntax: an opener and a closer, each one or two bytes.
///
/// A [`CommentClass::new`] closer belongs to the comment (`*/`); a
/// [`CommentClass::line`] terminator ends the comment and stays outside
/// it, so a newline that the grammar indexes is still indexed.
///
/// ```
/// use parse_that_simd::CommentClass;
/// const BLOCK: CommentClass = CommentClass::new(b"/*", b"*/");
/// const LINE: CommentClass = CommentClass::line(b"#", b"\n");
/// assert_eq!(BLOCK.open(), b"/*");
/// assert_eq!(LINE.close(), b"\n");
/// assert!(!BLOCK.keeps_close() && LINE.keeps_close());
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CommentClass {
    open: &'static [u8],
    close: &'static [u8],
    keep: bool,
}

impl CommentClass {
    /// A comment class. Panics (at compile time, in a `const`) unless the
    /// opener and the closer are each one or two bytes and the closer holds
    /// no backslash.
    pub const fn new(open: &'static [u8], close: &'static [u8]) -> Self {
        Self::checked(open, close, false)
    }

    /// A comment class whose terminator `end` ends the comment but is not
    /// part of it (a line comment's newline). The same limits as
    /// [`CommentClass::new`].
    pub const fn line(open: &'static [u8], end: &'static [u8]) -> Self {
        Self::checked(open, end, true)
    }

    const fn checked(open: &'static [u8], close: &'static [u8], keep: bool) -> Self {
        assert!(
            !open.is_empty() && open.len() <= 2,
            "a comment opener is one or two bytes"
        );
        assert!(
            !close.is_empty() && close.len() <= 2,
            "a comment closer is one or two bytes"
        );
        let mut i = 0;
        while i < close.len() {
            assert!(close[i] != b'\\', "a comment closer holds no backslash");
            i += 1;
        }
        CommentClass { open, close, keep }
    }

    /// The opener's bytes.
    pub const fn open(&self) -> &'static [u8] {
        self.open
    }

    /// The closer's bytes.
    pub const fn close(&self) -> &'static [u8] {
        self.close
    }

    /// Whether the closer stays outside the comment ([`CommentClass::line`]).
    pub const fn keeps_close(&self) -> bool {
        self.keep
    }
}

/// What stage 1 reads: the structural alphabet, the whitespace set and
/// the comment classes.
///
/// ```
/// use parse_that_simd::{CommentClass, Stage1Spec, StructuralAlphabet};
/// const CSS: Stage1Spec = Stage1Spec::new(
///     StructuralAlphabet::from_parts(b"{}();:,", &[], b"\"'"),
///     b" \t\n\r\x0c",
///     &[CommentClass::new(b"/*", b"*/")],
/// );
/// assert_eq!(CSS.comments().len(), 1);
/// ```
#[derive(Debug, Clone, Copy)]
pub struct Stage1Spec {
    alphabet: StructuralAlphabet,
    whitespace: &'static [u8],
    comments: &'static [CommentClass],
}

impl Stage1Spec {
    /// A stage-1 spec. Panics (at compile time, in a `const`) when the
    /// alphabet has more than four quote classes, there are more than
    /// [`MAX_COMMENT_CLASSES`] comment classes, a comment opener begins
    /// with a quote byte, or one opener is a prefix of another.
    pub const fn new(
        alphabet: StructuralAlphabet,
        whitespace: &'static [u8],
        comments: &'static [CommentClass],
    ) -> Self {
        assert!(
            alphabet.quote_classes.len() <= MAX_QUOTE_CLASSES,
            "at most four quote classes"
        );
        assert!(
            comments.len() <= MAX_COMMENT_CLASSES,
            "at most four comment classes"
        );
        let mut c = 0;
        while c < comments.len() {
            let open = comments[c].open;
            let mut q = 0;
            while q < alphabet.quote_classes.len() {
                assert!(
                    open[0] != alphabet.quote_classes[q],
                    "a comment opener does not begin with a quote byte"
                );
                q += 1;
            }
            let mut d = 0;
            while d < comments.len() {
                if d != c {
                    let other = comments[d].open;
                    let prefix = other.len() <= open.len()
                        && other[0] == open[0]
                        && (other.len() == 1 || other[1] == open[1]);
                    assert!(!prefix, "no comment opener is a prefix of another");
                }
                d += 1;
            }
            c += 1;
        }
        Stage1Spec {
            alphabet,
            whitespace,
            comments,
        }
    }

    /// The structural alphabet.
    pub const fn alphabet(&self) -> &StructuralAlphabet {
        &self.alphabet
    }

    /// The whitespace bytes.
    pub const fn whitespace(&self) -> &'static [u8] {
        self.whitespace
    }

    /// The comment classes.
    pub const fn comments(&self) -> &'static [CommentClass] {
        self.comments
    }
}

/// Why stage 1 refused its input.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Stage1Error {
    /// The input is not UTF-8; its first `valid_up_to` bytes are.
    InvalidUtf8 {
        /// The length of the longest valid UTF-8 prefix
        /// ([`core::str::Utf8Error::valid_up_to`]).
        valid_up_to: usize,
    },
    /// The input is longer than a `u32` position can name.
    TooLong {
        /// The input's length.
        len: usize,
    },
}

impl core::fmt::Display for Stage1Error {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            Stage1Error::InvalidUtf8 { valid_up_to } => {
                write!(f, "invalid UTF-8 after byte {valid_up_to}")
            }
            Stage1Error::TooLong { len } => {
                write!(f, "input of {len} bytes is longer than u32::MAX")
            }
        }
    }
}

impl std::error::Error for Stage1Error {}

/// Build the [`Stage1Index`] of `input` under `spec` on the selected tier
/// ([`crate::selected_tier`]), validating the input as UTF-8 in the same
/// pass.
///
/// ```
/// use parse_that_simd::{CommentClass, PaddedInput, Stage1Spec, StructuralAlphabet, stage1};
/// const CSS: Stage1Spec = Stage1Spec::new(
///     StructuralAlphabet::from_parts(b"{}:;", &[], b"\""),
///     b" \n",
///     &[CommentClass::new(b"/*", b"*/")],
/// );
/// let input = PaddedInput::from_slice(b"a{b:1}/*{*/");
/// let index = stage1(input.as_padded(), &CSS).unwrap();
/// // `{` inside the comment is not structural; `a`, `b` and `1` start atoms.
/// assert_eq!(index.index.positions, [0, 1, 2, 3, 4, 5]);
/// assert_eq!(index.index.kinds, b"a{b:1}");
/// assert!(index.is_atom(0) && !index.is_atom(1) && index.is_atom(4));
///
/// let bad = PaddedInput::from_slice(b"{\xff}");
/// assert!(stage1(bad.as_padded(), &CSS).is_err());
/// ```
pub fn stage1(input: PaddedSlice<'_>, spec: &Stage1Spec) -> Result<Stage1Index, Stage1Error> {
    crate::dispatch::stage1_selected(input, spec)
}

/// Born-RED stand-in (sk-v27 LW3.PERF-1a): the old index, no comment
/// mask, no atom starts, no UTF-8 check.
pub(crate) fn stub(input: &[u8], spec: &Stage1Spec) -> Result<Stage1Index, Stage1Error> {
    let old = crate::scan_structural(input, &spec.alphabet);
    let mut out = Stage1Index::with_capacity(old.len());
    for (&p, &k) in old.positions.iter().zip(&old.kinds) {
        out.push(p, k, false);
    }
    Ok(out)
}

#[doc(hidden)]
/// The arch-neutral resolver over bytewise raw masks (a test hook: it
/// runs on every host and under Miri).
pub fn portable(input: PaddedSlice<'_>, spec: &Stage1Spec) -> Result<Stage1Index, Stage1Error> {
    stub(input.bytes(), spec)
}
