//! Bespoke path-string lexer (AZ-IV.W2.3).
//!
//! Hand-rolled recursive-descent over the path alphabet — does **not**
//! depend on `regex-syntax` or the bbnf-regex HIR parser, keeping the
//! consuming `path!` proc-macro crate (AZ-IV.W2.4) narrow.
//!
//! Alphabet: identifier (`[A-Za-z_][A-Za-z0-9_]*`, Unicode-aware via
//! `char::is_alphabetic`), integer index (`[0-9]+`), structural
//! (`[`, `]`, `.`, `*`, `$`); interstitial whitespace is skipped.
//!
//! Every emitted token carries the macro call-site `proc_macro2::Span`
//! (anchored verbatim per the W2 hard-gate); sub-token byte offsets travel
//! in `PathToken::byte_offset` + `PathLexError::byte_offset`.

use proc_macro2::Span;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PathTokenKind {
    Ident,
    Index,
    LBracket,
    RBracket,
    Dot,
    Star,
    Dollar,
    Eof,
}

#[derive(Clone, Debug)]
pub struct PathToken {
    pub kind: PathTokenKind,
    /// `proc_macro2::Span` anchor — the macro call-site span passed to
    /// [`lex_path`]. Sub-token positioning lives in `byte_offset`.
    pub span: Span,
    pub text: String,
    /// Byte offset of the token's first byte within the input string.
    pub byte_offset: usize,
}

#[derive(Clone, Debug)]
pub struct PathLexError {
    pub byte_offset: usize,
    pub message: String,
    pub span: Span,
}

/// Tokenise a path-string literal.
///
/// `input` is the contents of the path-string literal (with surrounding
/// quotes already stripped by the caller). `span` is the macro call-site
/// anchor — every emitted token carries this span verbatim; the
/// consuming `path!` proc-macro re-anchors diagnostics through it via
/// `syn::Error::new(token.span, …)`.
pub fn lex_path(input: &str, span: Span) -> Result<Vec<PathToken>, PathLexError> {
    let bytes = input.as_bytes();
    let mut pos = 0usize;
    let mut tokens: Vec<PathToken> = Vec::new();

    while pos < bytes.len() {
        let b = bytes[pos];
        if b.is_ascii_whitespace() {
            pos += 1;
            continue;
        }
        match b {
            b'.' => push_single(&mut tokens, PathTokenKind::Dot, ".", pos, span),
            b'[' => push_single(&mut tokens, PathTokenKind::LBracket, "[", pos, span),
            b']' => push_single(&mut tokens, PathTokenKind::RBracket, "]", pos, span),
            b'*' => push_single(&mut tokens, PathTokenKind::Star, "*", pos, span),
            b'$' => push_single(&mut tokens, PathTokenKind::Dollar, "$", pos, span),
            b'0'..=b'9' => {
                let start = pos;
                while pos < bytes.len() && bytes[pos].is_ascii_digit() {
                    pos += 1;
                }
                tokens.push(PathToken {
                    kind: PathTokenKind::Index,
                    span,
                    text: input[start..pos].to_string(),
                    byte_offset: start,
                });
                continue;
            }
            _ => {
                // Identifier — ASCII fast path covers `[A-Za-z_]`; the
                // Unicode-extension lane handles non-ASCII letters via
                // `char::is_alphabetic`. Subsequent bytes accept ASCII
                // alphanumerics, `_`, and Unicode letters/digits.
                let start = pos;
                let first = match decode_char(bytes, pos) {
                    Some((c, _)) => c,
                    None => {
                        return Err(PathLexError {
                            byte_offset: pos,
                            message: format!("invalid UTF-8 byte 0x{:02x}", b),
                            span,
                        });
                    }
                };
                if !is_ident_start(first) {
                    return Err(PathLexError {
                        byte_offset: pos,
                        message: format!("unexpected character {:?} in path", first),
                        span,
                    });
                }
                while pos < bytes.len() {
                    let (c, w) = match decode_char(bytes, pos) {
                        Some(v) => v,
                        None => {
                            return Err(PathLexError {
                                byte_offset: pos,
                                message: format!("invalid UTF-8 byte 0x{:02x}", bytes[pos]),
                                span,
                            });
                        }
                    };
                    if !is_ident_continue(c) {
                        break;
                    }
                    pos += w;
                }
                tokens.push(PathToken {
                    kind: PathTokenKind::Ident,
                    span,
                    text: input[start..pos].to_string(),
                    byte_offset: start,
                });
                continue;
            }
        }
        pos += 1;
    }
    tokens.push(PathToken {
        kind: PathTokenKind::Eof,
        span,
        text: String::new(),
        byte_offset: bytes.len(),
    });
    Ok(tokens)
}

#[inline]
fn push_single(
    tokens: &mut Vec<PathToken>,
    kind: PathTokenKind,
    text: &str,
    byte_offset: usize,
    span: Span,
) {
    tokens.push(PathToken {
        kind,
        span,
        text: text.to_string(),
        byte_offset,
    });
}

#[inline]
fn is_ident_start(c: char) -> bool {
    c == '_' || c.is_alphabetic()
}

#[inline]
fn is_ident_continue(c: char) -> bool {
    c == '_' || c.is_alphanumeric()
}

/// Decode a single UTF-8 codepoint at `bytes[pos]`. Returns `(char, width)`
/// on success; `None` if the byte sequence is not valid UTF-8. Validates
/// only the leading codepoint — does **not** walk the remaining slice.
#[inline]
fn decode_char(bytes: &[u8], pos: usize) -> Option<(char, usize)> {
    let b0 = *bytes.get(pos)?;
    let width = match b0 {
        0x00..=0x7F => 1,
        0xC2..=0xDF => 2,
        0xE0..=0xEF => 3,
        0xF0..=0xF4 => 4,
        _ => return None,
    };
    let slice = bytes.get(pos..pos + width)?;
    let s = std::str::from_utf8(slice).ok()?;
    let c = s.chars().next()?;
    Some((c, width))
}
