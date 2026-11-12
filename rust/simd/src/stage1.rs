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

/// Comment classes a [`Stage1Spec`] may carry.
pub const MAX_COMMENT_CLASSES: usize = 4;

/// Quote classes a kernel tracks (per-class mask slots).
pub(crate) const MAX_QUOTE_CLASSES: usize = 4;

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

// ───────────────────────── the arch-neutral resolver ─────────────────────────

/// One 64-byte block's raw masks, as a tier's kernel classifies them:
/// bit `i` for byte `i` of the block. Bytes past the input's end and
/// matches whose second byte is past it are masked off by [`Resolver`],
/// so a kernel may classify the padding freely.
#[derive(Clone, Copy, Default)]
pub(crate) struct Raw {
    /// Singleton bytes.
    pub(crate) singles: u64,
    /// First bytes of digraph matches (the second byte read at `i + 1`).
    pub(crate) digraph: u64,
    /// Per-quote-class bytes.
    pub(crate) quotes: [u64; MAX_QUOTE_CLASSES],
    /// Backslashes.
    pub(crate) bs: u64,
    /// Whitespace bytes.
    pub(crate) ws: u64,
    /// First bytes of comment-opener matches, per class.
    pub(crate) open: [u64; MAX_COMMENT_CLASSES],
    /// First bytes of comment-closer matches, per class.
    pub(crate) close: [u64; MAX_COMMENT_CLASSES],
}

/// Where the resolver is at a block boundary.
#[derive(Clone, Copy, Default)]
enum Mode {
    #[default]
    Outside,
    String(usize),
    /// In a comment of class `class`; a closer may start at absolute
    /// offset `close_from`; `end` is the absolute offset of the last byte
    /// of a matched closer that runs into the next block.
    Comment {
        class: usize,
        close_from: usize,
        end: Option<usize>,
    },
}

/// The state [`drive`] carries from one block to the next.
#[derive(Default)]
struct Resolver {
    mode: Mode,
    bs_carry: bool,
    prev_atom: bool,
    prev_digraph: bool,
}

/// Bits `0..n` (`n <= 64`).
#[inline(always)]
fn low(n: usize) -> u64 {
    if n >= 64 { u64::MAX } else { (1u64 << n) - 1 }
}

/// Bits `0..=b` (`b < 64`).
#[inline(always)]
fn through(b: u32) -> u64 {
    low(b as usize + 1)
}

impl Resolver {
    /// Apply the module's definition to the block at `base` and append its
    /// slots to `out`.
    #[inline(always)]
    fn block(
        &mut self,
        raw: &Raw,
        base: usize,
        spec: &Stage1Spec,
        bytes: &[u8],
        out: &mut Stage1Index,
    ) {
        let rest = bytes.len() - base;
        let n = rest.min(64);
        let valid = low(n);
        // A two-byte match at `i` needs `base + i + 1 < len`.
        let pair_valid = low(rest - 1);

        let bs = raw.bs & valid;
        let (escape, _) = crate::parity::escape_mask_64(bs, self.bs_carry);
        let run = (bs << (64 - n)).leading_ones() as usize;
        self.bs_carry = if run == n {
            self.bs_carry ^ (n % 2 == 1)
        } else {
            run % 2 == 1
        };

        let quote_classes = spec.alphabet.quote_classes;
        let nq = quote_classes.len();
        let mut quotes = [0u64; MAX_QUOTE_CLASSES];
        for (q, r) in quotes.iter_mut().zip(&raw.quotes).take(nq) {
            *q = r & !escape & valid;
        }
        let comments = spec.comments;
        let nc = comments.len();
        let mut open = [0u64; MAX_COMMENT_CLASSES];
        let mut close = [0u64; MAX_COMMENT_CLASSES];
        for (c, class) in comments.iter().enumerate() {
            open[c] = raw.open[c] & if class.open.len() == 2 { pair_valid } else { valid };
            close[c] = raw.close[c] & if class.close.len() == 2 { pair_valid } else { valid };
        }

        let (qbody, cbody, opener) = if nc == 0 && nq <= 1 {
            (self.one_quote_class(quotes[0], n, nq), 0, 0)
        } else {
            self.walk(&quotes[..nq], &open[..nc], &close[..nc], comments, base, n)
        };

        let outside = valid & !qbody & !cbody;
        let digraph = raw.digraph & pair_valid & outside;
        let structural = (raw.singles & outside) | digraph;
        let tail = (digraph << 1) | u64::from(self.prev_digraph);
        self.prev_digraph = digraph >> 63 == 1;
        let ws = raw.ws & outside;
        let atom = valid & !structural & !tail & !ws & !cbody & !opener;
        let starts = atom & !((atom << 1) | u64::from(self.prev_atom));
        self.prev_atom = atom >> 63 == 1;

        let mut slots = structural | starts;
        while slots != 0 {
            let bit = slots.trailing_zeros();
            let pos = base + bit as usize;
            out.push(pos as u32, bytes[pos], starts >> bit & 1 == 1);
            slots &= slots - 1;
        }
    }

    /// The string body of a block under at most one quote class and no
    /// comments: the prefix-XOR of its unescaped quotes.
    #[inline(always)]
    fn one_quote_class(&mut self, quotes: u64, n: usize, nq: usize) -> u64 {
        if nq == 0 {
            return 0;
        }
        let carry = matches!(self.mode, Mode::String(_));
        let prefix = crate::parity::prefix_xor_64(quotes, carry);
        self.mode = if (prefix >> (n - 1)) & 1 == 1 {
            Mode::String(0)
        } else {
            Mode::Outside
        };
        (prefix ^ quotes) & low(n)
    }

    /// String bodies, comment bodies and comment-opener first bytes of one
    /// block, by walking its events (unescaped quotes, opener and closer
    /// matches) in order from the carried mode.
    #[inline(always)]
    fn walk(
        &mut self,
        quotes: &[u64],
        open: &[u64],
        close: &[u64],
        comments: &[CommentClass],
        base: usize,
        n: usize,
    ) -> (u64, u64, u64) {
        let valid = low(n);
        let any_quote = quotes.iter().fold(0, |a, &m| a | m);
        let any_open = open.iter().fold(0, |a, &m| a | m);
        let (mut qbody, mut cbody, mut opener) = (0u64, 0u64, 0u64);
        let mut pos = 0usize;
        while pos < n {
            let from = !0u64 << pos;
            match self.mode {
                Mode::Outside => {
                    let events = (any_quote | any_open) & from & valid;
                    if events == 0 {
                        break;
                    }
                    let b = events.trailing_zeros();
                    let bit = 1u64 << b;
                    if any_quote & bit != 0 {
                        let k = quotes.iter().position(|&m| m & bit != 0).unwrap_or(0);
                        self.mode = Mode::String(k);
                    } else {
                        let class = open.iter().position(|&m| m & bit != 0).unwrap_or(0);
                        opener |= bit;
                        self.mode = Mode::Comment {
                            class,
                            close_from: base + b as usize + comments[class].open.len(),
                            end: None,
                        };
                    }
                    pos = b as usize + 1;
                }
                Mode::String(k) => {
                    let events = quotes[k] & from;
                    if events == 0 {
                        qbody |= from & valid;
                        break;
                    }
                    let b = events.trailing_zeros();
                    qbody |= from & through(b);
                    self.mode = Mode::Outside;
                    pos = b as usize + 1;
                }
                Mode::Comment { end: Some(end), .. } => {
                    // A two-byte closer that began on the last byte of the
                    // previous block ends on this block's first byte.
                    let e = (end - base) as u32;
                    cbody |= from & through(e);
                    self.mode = Mode::Outside;
                    pos = e as usize + 1;
                }
                Mode::Comment {
                    class,
                    close_from,
                    end: None,
                } => {
                    let earliest = close_from.saturating_sub(base);
                    let events = if earliest >= 64 {
                        0
                    } else {
                        close[class] & from & (!0u64 << earliest)
                    };
                    if events == 0 {
                        cbody |= from & valid;
                        break;
                    }
                    let b = events.trailing_zeros();
                    let c = comments[class];
                    if c.keep {
                        // The terminator ends the comment and stays outside.
                        cbody |= from & low(b as usize);
                        self.mode = Mode::Outside;
                        pos = b as usize;
                    } else {
                        let e = b as usize + c.close.len() - 1;
                        if e < 64 {
                            cbody |= from & through(e as u32);
                            self.mode = Mode::Outside;
                            pos = e + 1;
                        } else {
                            cbody |= from & valid;
                            self.mode = Mode::Comment {
                                class,
                                close_from,
                                end: Some(base + e),
                            };
                            break;
                        }
                    }
                }
            }
        }
        (qbody, cbody, opener)
    }
}

/// Run the resolver over `input`, one 64-byte block at a time. `block`
/// classifies the block at its pointer argument into [`Raw`] masks; its
/// second argument is the number of the block's bytes inside the input
/// (`1..=64`).
///
/// # Contract for `block`
///
/// It may read the 65 bytes from its pointer argument (the block and the
/// one byte of two-byte-match lookahead): [`PaddedSlice`] guarantees
/// `base + 65 <= len + PADDING` for every block start `base < len`.
#[inline(always)]
pub(crate) fn drive(
    input: PaddedSlice<'_>,
    spec: &Stage1Spec,
    mut block: impl FnMut(*const u8, usize) -> Raw,
) -> Stage1Index {
    let bytes = input.bytes();
    let len = bytes.len();
    let ptr = input.as_ptr();
    let mut out = Stage1Index::with_capacity(len / 8 + 1);
    let mut resolver = Resolver::default();
    let mut base = 0usize;
    while base < len {
        // SAFETY: `base < len <= padded_len`, so the offset is in bounds.
        let raw = block(unsafe { ptr.add(base) }, (len - base).min(64));
        resolver.block(&raw, base, spec, bytes, &mut out);
        base += 64;
    }
    out
}

/// The error a tier returns when its fused validator flagged the input:
/// the exact position is [`core::str::from_utf8`]'s.
#[cold]
pub(crate) fn utf8_error(bytes: &[u8]) -> Stage1Error {
    match core::str::from_utf8(bytes) {
        Err(e) => Stage1Error::InvalidUtf8 {
            valid_up_to: e.valid_up_to(),
        },
        Ok(_) => unreachable!("a tier's UTF-8 validator flagged valid UTF-8"),
    }
}

/// The 64 `0xFF` bytes then 64 zero bytes a tier loads at
/// `64 - n + offset` to keep the first `n` bytes of a block and zero the
/// rest (the UTF-8 validator must read zeros past the end).
// Only the vector tiers load it (a build with no vector tier has none).
#[cfg(any(
    target_arch = "aarch64",
    target_arch = "x86_64",
    all(target_arch = "wasm32", target_feature = "simd128")
))]
pub(crate) static TAIL_MASK: [u8; 128] = {
    let mut m = [0u8; 128];
    let mut i = 0;
    while i < 64 {
        m[i] = 0xFF;
        i += 1;
    }
    m
};

/// The Keiser–Lemire UTF-8 lookup tables, indexed by a nibble: the
/// error classes a byte pair can raise, by the first byte's high nibble,
/// its low nibble, and the second byte's high nibble. A pair is
/// malformed iff the three lookups share a bit, except that the
/// two-continuations bit is expected (and so cancelled) where the pair
/// is the second and third, or third and fourth, bytes of a longer
/// sequence.
#[cfg(any(
    target_arch = "aarch64",
    target_arch = "x86_64",
    all(target_arch = "wasm32", target_feature = "simd128")
))]
pub(crate) mod utf8 {
    const TOO_SHORT: u8 = 1 << 0;
    const TOO_LONG: u8 = 1 << 1;
    const OVERLONG_3: u8 = 1 << 2;
    const TOO_LARGE: u8 = 1 << 3;
    const SURROGATE: u8 = 1 << 4;
    const OVERLONG_2: u8 = 1 << 5;
    const TOO_LARGE_1000: u8 = 1 << 6;
    const OVERLONG_4: u8 = 1 << 6;
    const TWO_CONTS: u8 = 1 << 7;
    const CARRY: u8 = TOO_SHORT | TOO_LONG | TWO_CONTS;

    /// By the first byte's high nibble.
    pub(crate) static BYTE_1_HIGH: [u8; 16] = [
        TOO_LONG,
        TOO_LONG,
        TOO_LONG,
        TOO_LONG,
        TOO_LONG,
        TOO_LONG,
        TOO_LONG,
        TOO_LONG,
        TWO_CONTS,
        TWO_CONTS,
        TWO_CONTS,
        TWO_CONTS,
        TOO_SHORT | OVERLONG_2,
        TOO_SHORT,
        TOO_SHORT | OVERLONG_3 | SURROGATE,
        TOO_SHORT | TOO_LARGE | TOO_LARGE_1000 | OVERLONG_4,
    ];

    /// By the first byte's low nibble.
    pub(crate) static BYTE_1_LOW: [u8; 16] = [
        CARRY | OVERLONG_3 | OVERLONG_2 | OVERLONG_4,
        CARRY | OVERLONG_2,
        CARRY,
        CARRY,
        CARRY | TOO_LARGE,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000 | SURROGATE,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
        CARRY | TOO_LARGE | TOO_LARGE_1000,
    ];

    /// By the second byte's high nibble.
    pub(crate) static BYTE_2_HIGH: [u8; 16] = [
        TOO_SHORT,
        TOO_SHORT,
        TOO_SHORT,
        TOO_SHORT,
        TOO_SHORT,
        TOO_SHORT,
        TOO_SHORT,
        TOO_SHORT,
        TOO_LONG | OVERLONG_2 | TWO_CONTS | OVERLONG_3 | TOO_LARGE_1000 | OVERLONG_4,
        TOO_LONG | OVERLONG_2 | TWO_CONTS | OVERLONG_3 | TOO_LARGE,
        TOO_LONG | OVERLONG_2 | TWO_CONTS | SURROGATE | TOO_LARGE,
        TOO_LONG | OVERLONG_2 | TWO_CONTS | SURROGATE | TOO_LARGE,
        TOO_SHORT,
        TOO_SHORT,
        TOO_SHORT,
        TOO_SHORT,
    ];

    /// `b - THIRD >= 0x80` (saturating) iff `b >= 0xE0`: `b` leads a
    /// sequence of three or more, so the byte two after it continues one.
    pub(crate) const THIRD: u8 = 0xE0 - 0x80;
    /// `b - FOURTH >= 0x80` iff `b >= 0xF0`: the byte three after `b`
    /// continues a four-byte sequence.
    pub(crate) const FOURTH: u8 = 0xF0 - 0x80;

    /// Saturating-subtracted from a vector's last 16 bytes, nonzero iff a
    /// sequence that starts there is cut off at the vector's end.
    pub(crate) static INCOMPLETE_16: [u8; 16] = [
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xF0 - 1,
        0xE0 - 1, 0xC0 - 1,
    ];
}

#[doc(hidden)]
/// The arch-neutral resolver over bytewise raw masks (a test hook: it
/// runs on every host and under Miri, and it reads the padding through
/// [`drive`]'s contract, so Miri checks that contract).
///
/// ```
/// use parse_that_simd::{PaddedInput, Stage1Spec, StructuralAlphabet, scalar, stage1};
/// const JSON: Stage1Spec =
///     Stage1Spec::new(StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\""), b" ", &[]);
/// let input = PaddedInput::from_slice(br#"{"a": [1, 2]}"#);
/// assert_eq!(
///     stage1::portable(input.as_padded(), &JSON),
///     scalar::stage1(input.as_bytes(), &JSON)
/// );
/// ```
pub fn portable(input: PaddedSlice<'_>, spec: &Stage1Spec) -> Result<Stage1Index, Stage1Error> {
    if u32::try_from(input.len()).is_err() {
        return Err(Stage1Error::TooLong { len: input.len() });
    }
    let lut = spec.alphabet.byte_lut();
    let mut ws = [false; 256];
    for &b in spec.whitespace {
        ws[b as usize] = true;
    }
    let out = drive(input, spec, |ptr, _| {
        // SAFETY: `drive`'s contract: 65 bytes are readable at `ptr`.
        let block = unsafe { core::slice::from_raw_parts(ptr, 65) };
        let mut raw = Raw::default();
        let matches = |seq: &[u8], i: usize| block[i] == seq[0] && (seq.len() == 1 || block[i + 1] == seq[1]);
        for i in 0..64 {
            let (x, y) = (block[i], block[i + 1]);
            let bit = 1u64 << i;
            if lut[x as usize] {
                raw.singles |= bit;
            }
            if spec.alphabet.digraph_pairs.iter().any(|&(f, s)| f == x && s == y) {
                raw.digraph |= bit;
            }
            for (k, &q) in spec.alphabet.quote_classes.iter().enumerate() {
                if x == q {
                    raw.quotes[k] |= bit;
                }
            }
            if x == b'\\' {
                raw.bs |= bit;
            }
            if ws[x as usize] {
                raw.ws |= bit;
            }
            for (c, class) in spec.comments.iter().enumerate() {
                if matches(class.open, i) {
                    raw.open[c] |= bit;
                }
                if matches(class.close, i) {
                    raw.close[c] |= bit;
                }
            }
        }
        raw
    });
    match core::str::from_utf8(input.bytes()) {
        Ok(_) => Ok(out),
        Err(_) => Err(utf8_error(input.bytes())),
    }
}
