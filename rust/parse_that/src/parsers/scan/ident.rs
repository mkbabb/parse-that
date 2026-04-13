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
}

/// Default identifier config: no leading dash, no double-dash prefix.
/// Accepts `[a-zA-Z_][\w-]*`.
pub const DEFAULT_IDENT_CONFIG: IdentConfig = IdentConfig {
    allow_leading_dash: false,
    allow_double_dash_prefix: false,
};

/// CSS identifier config: vendor prefixes (`-foo`) and custom properties (`--foo`).
/// Accepts `-?[a-zA-Z_][\w-]*` and `--[\w-]+`.
pub const CSS_IDENT_CONFIG: IdentConfig = IdentConfig {
    allow_leading_dash: true,
    allow_double_dash_prefix: true,
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
        // -[a-zA-Z_]...
        if !(b1.is_ascii_alphabetic() || b1 == b'_') {
            return None;
        }
        i += 1;
    } else if b0.is_ascii_alphabetic() || b0 == b'_' {
        i += 1;
    } else {
        return None;
    }

    // Continue with [a-zA-Z0-9_-]*
    while i < len {
        let b = unsafe { *bytes.get_unchecked(i) };
        if b.is_ascii_alphanumeric() || b == b'_' || b == b'-' {
            i += 1;
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
