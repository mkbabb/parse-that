//! Portable scalar reference kernel.
//!
//! - Always available; used as the SIMD-fallback path on architectures
//!   without intrinsics, and as the **correctness reference** for the
//!   `tests/fuzz.rs` proptest harness.
//! - No intrinsics, no `unsafe`. Branch-free where natural;
//!   straight-line otherwise. Optimised for clarity, not throughput.
//! - Implements the full alphabet contract: singletons, digraphs, and
//!   quote parity.

use crate::StructuralIndex;
use crate::alphabet::StructuralAlphabet;

/// Walk `input` byte-by-byte, classify against `alphabet`, and write
/// the resulting `StructuralIndex`. Used by `parse_that_simd::scan_structural`
/// when no SIMD path is available, and as the fuzz reference.
pub fn scan(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    if alphabet.singletons.is_empty() && alphabet.digraph_pairs.is_empty() {
        return StructuralIndex::new();
    }

    // Density estimate: 1 structural byte per 16 input bytes is a
    // conservative upper bound for JSON / CSS at canonical density;
    // saves N reallocations in the push loop.
    let mut idx = StructuralIndex::with_capacity(input.len() / 8 + 1);

    let mut byte_lut = [false; 256];
    for &b in alphabet.singletons {
        byte_lut[b as usize] = true;
    }

    let quote_lut = build_quote_lut(alphabet.quote_classes);
    let inside_string = compute_inside_string_mask(input, &quote_lut);

    // Pre-compute digraph hits: bit at position `i` is set iff
    // `(input[i], input[i+1])` matches some `(first, second)` pair.
    // Combined with the singleton set so the kernels' merged-mask
    // semantics is preserved on the scalar side.
    let mut digraph_hits = vec![false; input.len()];
    if !alphabet.digraph_pairs.is_empty() {
        for i in 0..input.len().saturating_sub(1) {
            let a = input[i];
            let b = input[i + 1];
            for &(f, s) in alphabet.digraph_pairs {
                if a == f && b == s {
                    digraph_hits[i] = true;
                    break;
                }
            }
        }
    }

    let mut i = 0;
    while i < input.len() {
        let b = input[i];
        let inside = inside_string.get(i).copied().unwrap_or(false);
        let is_singleton = byte_lut[b as usize];
        let is_digraph = digraph_hits.get(i).copied().unwrap_or(false);

        if (is_singleton || is_digraph) && !inside {
            idx.push(i as u32, b);
        }
        i += 1;
    }

    idx
}

/// Build a 256-byte boolean LUT for quote-class membership.
pub fn build_quote_lut(quote_classes: &[u8]) -> [bool; 256] {
    let mut lut = [false; 256];
    for &b in quote_classes {
        lut[b as usize] = true;
    }
    lut
}

/// Compute the per-byte "inside string" mask. Bit `i` is `true` iff
/// byte `i` of `input` lies inside a string literal — i.e. between
/// an unescaped opening quote and the corresponding closing quote.
///
/// Backslash before a quote escapes the quote; an even count of
/// backslashes before a quote leaves the quote unescaped. This is
/// the same parity rule simdjson encodes via CLMUL; the scalar
/// reference computes it byte-by-byte.
pub fn compute_inside_string_mask(input: &[u8], quote_lut: &[bool; 256]) -> Vec<bool> {
    let mut out = vec![false; input.len()];
    if !quote_lut.iter().any(|&b| b) {
        return out;
    }

    let mut inside = false;
    let mut active_quote: u8 = 0;
    let mut i = 0;
    while i < input.len() {
        let b = input[i];
        // Compute escape parity: count consecutive backslashes
        // immediately preceding position `i`.
        let bs_count = {
            let mut j = i;
            let mut c = 0usize;
            while j > 0 && input[j - 1] == b'\\' {
                c += 1;
                j -= 1;
            }
            c
        };
        let is_escaped = bs_count % 2 == 1;

        if !inside {
            // An opening quote is real iff it isn't escaped.
            if quote_lut[b as usize] && !is_escaped {
                inside = true;
                active_quote = b;
            }
            i += 1;
            continue;
        }
        // inside = true. Mark every byte (including closing quote).
        out[i] = true;
        if b == active_quote && !is_escaped {
            // Unescaped closing quote.
            inside = false;
        }
        i += 1;
    }

    out
}

/// The stage-1 oracle: [`crate::stage1`]'s definition (see
/// [`crate::stage1`]'s module docs), one byte at a time, after
/// [`core::str::from_utf8`].
pub fn stage1(
    input: &[u8],
    spec: &crate::Stage1Spec,
) -> Result<crate::Stage1Index, crate::Stage1Error> {
    use crate::Stage1Error;

    if u32::try_from(input.len()).is_err() {
        return Err(Stage1Error::TooLong { len: input.len() });
    }
    if let Err(e) = core::str::from_utf8(input) {
        return Err(Stage1Error::InvalidUtf8 {
            valid_up_to: e.valid_up_to(),
        });
    }

    #[derive(Clone, Copy)]
    enum Mode {
        Outside,
        String(u8),
        /// In a comment of class `class`; a closer may start at
        /// `close_from`; `end` is the last byte of a matched closer.
        Comment {
            class: usize,
            close_from: usize,
            end: Option<usize>,
        },
    }

    let alphabet = spec.alphabet();
    let singleton = alphabet.byte_lut();
    let mut whitespace = [false; 256];
    for &b in spec.whitespace() {
        whitespace[b as usize] = true;
    }
    let comments = spec.comments();
    let mut out = crate::Stage1Index::with_capacity(input.len() / 4 + 1);
    let mut mode = Mode::Outside;
    let mut backslashes = 0usize;
    let mut prev_atom = false;
    let mut prev_digraph = false;

    for (i, &b) in input.iter().enumerate() {
        let escaped = backslashes % 2 == 1;
        let mut in_string = false;
        let mut in_comment = false;
        let mut opener = false;

        // A comment whose kept terminator starts here ends before it.
        if let Mode::Comment {
            class,
            close_from,
            end: None,
        } = mode
        {
            let c = comments[class];
            if c.keeps_close() && i >= close_from && input[i..].starts_with(c.close()) {
                mode = Mode::Outside;
            }
        }
        match mode {
            Mode::Outside => {
                if let Some(q) = alphabet.quote_classes.iter().position(|&q| q == b)
                    && !escaped
                {
                    mode = Mode::String(q as u8);
                } else if let Some(class) =
                    comments.iter().position(|c| input[i..].starts_with(c.open()))
                {
                    opener = true;
                    mode = Mode::Comment {
                        class,
                        close_from: i + comments[class].open().len(),
                        end: None,
                    };
                }
            }
            Mode::String(q) => {
                in_string = true;
                if b == alphabet.quote_classes[q as usize] && !escaped {
                    mode = Mode::Outside;
                }
            }
            Mode::Comment {
                class,
                close_from,
                end,
            } => {
                in_comment = true;
                let c = comments[class];
                match end {
                    Some(e) if e == i => mode = Mode::Outside,
                    Some(_) => {}
                    None if !c.keeps_close()
                        && i >= close_from
                        && input[i..].starts_with(c.close()) =>
                    {
                        mode = if c.close().len() == 1 {
                            Mode::Outside
                        } else {
                            Mode::Comment {
                                class,
                                close_from,
                                end: Some(i + c.close().len() - 1),
                            }
                        };
                    }
                    None => {}
                }
            }
        }

        let outside = !in_string && !in_comment;
        let digraph = outside
            && alphabet
                .digraph_pairs
                .iter()
                .any(|&(f, s)| f == b && input.get(i + 1) == Some(&s));
        let structural = outside && (singleton[b as usize] || digraph);
        let atom = !structural
            && !prev_digraph
            && !(outside && whitespace[b as usize])
            && !in_comment
            && !opener;
        if structural {
            out.push(i as u32, b, false);
        } else if atom && !prev_atom {
            out.push(i as u32, b, true);
        }
        prev_atom = atom;
        prev_digraph = digraph;
        backslashes = if b == b'\\' { backslashes + 1 } else { 0 };
    }
    Ok(out)
}
