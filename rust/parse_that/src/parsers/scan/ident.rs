// Identifier scanner — plain idents, vendor prefixes, custom properties.

use crate::state::{ParserState, Span};

/// Configuration controlling which identifier syntax is accepted.
pub struct IdentConfig {
    /// Allow a single leading `-` followed by `[a-zA-Z_]`
    /// (vendor-prefixed idents like `-webkit-foo`).
    pub allow_leading_dash: bool,
    /// Allow a `--` prefix followed by `[\w-]+`
    /// (CSS custom properties like `--theme-color`).
    pub allow_double_dash_prefix: bool,
    /// Allow `\` followed by any non-newline byte as part of the identifier.
    /// Used by CSS selector identifiers (`\:`, `\.`, `\\`, etc.).
    pub allow_escapes: bool,
}

/// Default identifier config: no leading dash, no double-dash prefix, no escapes.
/// Accepts `[a-zA-Z_][\w-]*`.
pub const DEFAULT_IDENT_CONFIG: IdentConfig = IdentConfig {
    allow_leading_dash: false,
    allow_double_dash_prefix: false,
    allow_escapes: false,
};

/// CSS identifier config: vendor prefixes (`-foo`) and custom properties (`--foo`).
/// Accepts `-?[a-zA-Z_][\w-]*` and `--[\w-]+`.
pub const CSS_IDENT_CONFIG: IdentConfig = IdentConfig {
    allow_leading_dash: true,
    allow_double_dash_prefix: true,
    allow_escapes: false,
};

/// CSS identifier config with escape sequences.
/// Accepts `-?([a-zA-Z_]|\\[^\n])([\w-]|\\[^\n])*` and `--[\w-]+`.
/// Used by CSS selector identifiers where `\:`, `\.`, `\\`, etc. are valid.
pub const CSS_IDENT_ESCAPE_CONFIG: IdentConfig = IdentConfig {
    allow_leading_dash: true,
    allow_double_dash_prefix: true,
    allow_escapes: true,
};

/// Scan an identifier per the supplied configuration.
/// Returns `None` if no identifier matches at the current offset.
#[inline(always)]
pub fn scan_ident<'a>(state: &mut ParserState<'a>, config: &IdentConfig) -> Option<Span<'a>> {
    let bytes = state.src_bytes;
    let start = state.offset;
    let len = bytes.len();
    if start >= len {
        return None;
    }

    let mut i = start;
    let b0 = unsafe { *bytes.get_unchecked(i) };

    if b0 == b'-' {
        if !config.allow_leading_dash && !config.allow_double_dash_prefix {
            return None;
        }
        i += 1;
        if i >= len {
            return None;
        }
        let b1 = unsafe { *bytes.get_unchecked(i) };
        if b1 == b'-' {
            if !config.allow_double_dash_prefix {
                return None;
            }
            // Custom property: --[\w-]+
            i += 1;
            while i < len {
                let b = unsafe { *bytes.get_unchecked(i) };
                if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
                    i += 1;
                } else {
                    break;
                }
            }
            if i == start + 2 {
                return None; // just "--" with no continuation
            }
            state.offset = i;
            return Some(Span::new(start, i, state.src));
        }
        if !config.allow_leading_dash {
            return None;
        }
        // -[a-zA-Z_]... or -\X (escape as first char after dash)
        if b1.is_ascii_alphabetic() || b1 == b'_' {
            i += 1;
        } else if config.allow_escapes && b1 == b'\\' && i + 1 < len {
            let next = unsafe { *bytes.get_unchecked(i + 1) };
            if next != b'\n' {
                i += 2; // consume \X as the first char after dash
            } else {
                return None;
            }
        } else {
            return None;
        }
    } else if b0.is_ascii_alphabetic() || b0 == b'_' {
        i += 1;
    } else if config.allow_escapes && b0 == b'\\' && i + 1 < len {
        let next = unsafe { *bytes.get_unchecked(i + 1) };
        if next != b'\n' {
            i += 2; // consume \X as the first char
        } else {
            return None;
        }
    } else {
        return None;
    }

    // Continue with [a-zA-Z0-9_-]* (and optionally \X escapes)
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
            i += 1;
        } else if config.allow_escapes && b == b'\\' && i + 1 < len {
            let next = unsafe { *bytes.get_unchecked(i + 1) };
            if next != b'\n' {
                i += 2; // consume backslash + escaped char
            } else {
                break;
            }
        } else {
            break;
        }
    }

    if i == start {
        return None;
    }
    state.offset = i;
    Some(Span::new(start, i, state.src))
}
