//! Arch-neutral stripe state shared by every SIMD tier.
//!
//! A tier's kernel produces raw per-stripe bitmasks (structural bytes,
//! per-class quote bytes, backslashes) with its own instructions; what
//! those masks *mean* — escape parity, which quote class is open, the
//! byte-at-a-time epilogue — is decided here, once, so every tier has
//! the semantics of [`crate::scalar::scan`] by construction rather than
//! by re-implementation.

use crate::StructuralIndex;
use crate::alphabet::StructuralAlphabet;
use crate::parity;

/// Bytes per stripe: one bit per byte of a `u64` mask.
pub(crate) const STRIPE: usize = 64;

/// Quote classes a kernel tracks (per-class mask slots).
pub(crate) const MAX_QUOTE_CLASSES: usize = 4;

/// String-literal state carried from one stripe (or chunk) to the next.
#[derive(Default)]
pub(crate) struct QuoteState {
    /// `carries[k]` — a class-`k` string is open at the boundary.
    carries: [bool; MAX_QUOTE_CLASSES],
    /// An odd backslash run ends at the boundary: the next byte is escaped.
    bs_carry: bool,
}

impl QuoteState {
    /// Fold one region of `bits` bytes (`1..=64`) into the state and
    /// return its body mask: bit `i` is set iff byte `i` is inside a
    /// string literal (the closing quote included, the opening quote
    /// excluded — the opener stays structural, as in the scalar
    /// reference).
    ///
    /// `quote_masks[k]` holds the region's raw class-`k` quote bytes and
    /// `bs_mask` its backslashes, both in bits `0..bits`.
    #[inline(always)]
    pub(crate) fn body(
        &mut self,
        quotes: &[u8],
        mut quote_masks: [u64; MAX_QUOTE_CLASSES],
        bs_mask: u64,
        bits: u32,
    ) -> u64 {
        debug_assert!((1..=64).contains(&bits));
        debug_assert!(quotes.len() <= MAX_QUOTE_CLASSES);
        let valid = if bits == 64 {
            u64::MAX
        } else {
            (1u64 << bits) - 1
        };
        let bs = bs_mask & valid;
        let (escape, _) = parity::escape_mask_64(bs, self.bs_carry);
        // Carry-out: the parity of the backslash run that ends at the
        // region's last byte. A run spanning the whole region extends
        // the run carried in.
        let run = (bs << (64 - bits)).leading_ones();
        self.bs_carry = if run == bits {
            self.bs_carry ^ (bits % 2 == 1)
        } else {
            run % 2 == 1
        };
        for m in quote_masks.iter_mut().take(quotes.len()) {
            *m &= !escape & valid;
        }

        if quotes.len() == 1 {
            // One class: a string's extent is the prefix-XOR of its quotes.
            let real = quote_masks[0];
            let prefix = parity::prefix_xor_64(real, self.carries[0]);
            self.carries[0] = (prefix >> (bits - 1)) & 1 == 1;
            return (prefix ^ real) & valid;
        }
        multi_class_body(quote_masks, quotes.len(), &mut self.carries, bits)
    }

    /// The open class at the boundary, if any.
    #[inline]
    fn open_class(&self, n_classes: usize) -> Option<usize> {
        self.carries[..n_classes].iter().position(|&c| c)
    }
}

/// Body mask for a region with several quote classes: a quote of one
/// class inside a string of another is content, not a boundary, so the
/// classes are walked serially (bits `0..bits`).
#[inline]
fn multi_class_body(
    real: [u64; MAX_QUOTE_CLASSES],
    n_classes: usize,
    carries: &mut [bool; MAX_QUOTE_CLASSES],
    bits: u32,
) -> u64 {
    let mut open: Option<usize> = carries[..n_classes].iter().position(|&c| c);
    let mut body = 0u64;
    let any_quote = real[..n_classes].iter().fold(0u64, |a, &m| a | m);
    for bit in 0..bits {
        let mask = 1u64 << bit;
        if open.is_some() {
            body |= mask;
        }
        if any_quote & mask == 0 {
            continue;
        }
        // The quote bytes are distinct, so at most one class matches.
        let k = (0..n_classes).find(|&k| real[k] & mask != 0).unwrap_or(0);
        match open {
            None => open = Some(k),
            Some(o) if o == k => open = None,
            Some(_) => {}
        }
    }
    for (k, c) in carries[..n_classes].iter_mut().enumerate() {
        *c = open == Some(k);
    }
    body
}

/// The byte-at-a-time epilogue for `input[start..]`: the bytes no
/// vector region covered. Continues the state `quotes` carries out of
/// the vector loop, so the epilogue and the vector body are one scan.
#[inline]
pub(crate) fn epilogue(
    input: &[u8],
    start: usize,
    alphabet: &StructuralAlphabet,
    byte_lut: &[bool; 256],
    quotes: &mut QuoteState,
    idx: &mut StructuralIndex,
) {
    let classes = alphabet.quote_classes;
    let mut open = quotes.open_class(classes.len());
    let mut escaped = quotes.bs_carry;
    for (i, &b) in input.iter().enumerate().skip(start) {
        let digraph_first = alphabet
            .digraph_pairs
            .iter()
            .any(|&(f, s)| f == b && input.get(i + 1) == Some(&s));
        if open.is_none() && (byte_lut[b as usize] || digraph_first) {
            idx.push(i as u32, b);
        }
        if !escaped && let Some(k) = classes.iter().position(|&q| q == b) {
            match open {
                None => open = Some(k),
                Some(o) if o == k => open = None,
                Some(_) => {}
            }
        }
        escaped = b == b'\\' && !escaped;
    }
    for (k, c) in quotes.carries[..classes.len()].iter_mut().enumerate() {
        *c = open == Some(k);
    }
    quotes.bs_carry = escaped;
}

/// Whether the vector loop may load a full `width`-byte region at
/// `i`: the region itself, plus one byte of lookahead when the
/// alphabet has digraphs (the second-byte compare reads `i + width`).
#[inline(always)]
pub(crate) fn region_fits(
    i: usize,
    width: usize,
    len: usize,
    alphabet: &StructuralAlphabet,
) -> bool {
    i + width + usize::from(!alphabet.digraph_pairs.is_empty()) <= len
}
