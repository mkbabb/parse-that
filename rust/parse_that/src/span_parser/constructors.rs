use std::sync::Arc;


use crate::parse::ParserFn;
use crate::parsers::scan::{IdentConfig, NumberConfig, QuotedStringConfig, STRICT_NUMBER_CONFIG};
use crate::state::Span;

use super::{SpanKind, SpanParser, SpanScanner};

// ── Leaf constructors ─────────────────────────────────────────

/// Match exact string literal (byte comparison).
/// The string must be `'static` (string literals, leaked strings).
#[inline]
pub fn sp_string<'a>(s: &'static str) -> SpanParser<'a> {
    #[cfg(feature = "diagnostics")]
    {
        let label: &'static str = Box::leak(format!("\"{}\"", s).into_boxed_str());
        sp_new!(SpanKind::StringLiteral(s.as_bytes()), label)
    }
    #[cfg(not(feature = "diagnostics"))]
    {
        sp_new!(SpanKind::StringLiteral(s.as_bytes()))
    }
}

/// Compile a regex pattern to a bespoke DFA `SpanParser`.
/// Returns `None` if the pattern is unsupported or exceeds the state limit.
pub fn sp_compiled_dfa<'a>(pattern: &str) -> Option<SpanParser<'a>> {
    let dfa = crate::regex::dfa::Dfa::compile(pattern)?;
    #[cfg(feature = "diagnostics")]
    {
        let label: &'static str = Box::leak(format!("/{}/", pattern).into_boxed_str());
        Some(sp_new!(SpanKind::CompiledDfa(Arc::new(dfa)), label))
    }
    #[cfg(not(feature = "diagnostics"))]
    {
        Some(sp_new!(SpanKind::CompiledDfa(Arc::new(dfa))))
    }
}

/// Match regex pattern via bespoke DFA engine.
pub fn sp_regex<'a>(r: &str) -> SpanParser<'a> {
    sp_compiled_dfa(r).unwrap_or_else(|| panic!("Failed to compile regex to DFA: {}", r))
}

/// Match any of the given string patterns (Aho-Corasick). Uses global cache.
pub fn sp_any<'a>(patterns: &[&str]) -> SpanParser<'a> {
    let ac = crate::cached_aho_corasick(patterns);
    #[cfg(feature = "diagnostics")]
    {
        let label: &'static str = Box::leak(format!("one of {:?}", patterns).into_boxed_str());
        sp_new!(SpanKind::AhoCorasickMatch(ac), label)
    }
    #[cfg(not(feature = "diagnostics"))]
    {
        sp_new!(SpanKind::AhoCorasickMatch(ac))
    }
}

/// Take bytes while predicate holds (byte-level, ASCII-safe).
#[inline]
pub fn sp_take_while_byte<'a>(f: fn(u8) -> bool) -> SpanParser<'a> {
    sp_new!(SpanKind::TakeWhileByte(f), "matching byte")
}

/// Take characters while predicate holds (char-level, Unicode-safe).
#[inline]
pub fn sp_take_while_char<'a>(f: impl Fn(char) -> bool + 'a) -> SpanParser<'a> {
    sp_new!(SpanKind::TakeWhileChar(Box::new(f)), "matching character")
}

/// Consume exactly N bytes.
#[inline]
pub fn sp_next<'a>(amount: usize) -> SpanParser<'a> {
    sp_new!(SpanKind::NextN(amount), "next character")
}

/// Always succeeds, consuming nothing (empty span).
#[inline]
pub fn sp_epsilon<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Epsilon)
}

// ── Structural scanner constructors ──────────────────────────

/// Monolithic number scanner.
///
/// Currently the only supported number config is `STRICT_NUMBER_CONFIG`
/// (RFC 8259: no leading `+`, no leading `.`, no `007`-style leading
/// zeros) — it dispatches through the `SpanScanner::NumberStrict`
/// variant. Other configs require composing `scan_number_mantissa`
/// directly via a custom `Boxed` parser.
#[inline]
pub fn sp_number<'a>(config: &NumberConfig) -> SpanParser<'a> {
    if numeric_config_eq(config, &STRICT_NUMBER_CONFIG) {
        sp_new!(SpanKind::Scanner(SpanScanner::NumberStrict), "number")
    } else {
        panic!(
            "sp_number currently supports only STRICT_NUMBER_CONFIG; \
             custom NumberConfig values must compose `scan_number_mantissa` directly"
        );
    }
}

#[inline]
fn numeric_config_eq(a: &NumberConfig, b: &NumberConfig) -> bool {
    a.allow_plus_sign == b.allow_plus_sign
        && a.allow_leading_dot == b.allow_leading_dot
        && a.reject_leading_zero == b.reject_leading_zero
}

/// Monolithic quoted-string scanner. Returns the span including the
/// quote delimiters.
///
/// The strict variant validates RFC 8259 escape sequences; the generic
/// variant (`QuotedStringConfig { allows_escapes: false, .. }`) treats
/// `\` as a "skip next byte" without validation and accepts either `"`
/// or `'`.
#[inline]
pub fn sp_quoted_string<'a>(config: &QuotedStringConfig) -> SpanParser<'a> {
    if config.quote_char == b'"' && config.allows_escapes && config.allows_u_escapes {
        sp_new!(SpanKind::Scanner(SpanScanner::QuotedStringStrict), "string")
    } else if !config.allows_escapes {
        // Generic single/double-quote scanner with raw `\`-skip.
        sp_new!(SpanKind::Scanner(SpanScanner::QuotedString), "string")
    } else {
        panic!(
            "sp_quoted_string: only STRICT_QUOTED_STRING_CONFIG (full RFC 8259 escapes) \
             or escape-free configs are currently supported"
        );
    }
}

/// Monolithic identifier scanner.
///
/// Configures via [`IdentConfig`]. The CSS-flavored config
/// (`CSS_IDENT_CONFIG`) accepts vendor prefixes (`-foo`) and custom
/// properties (`--foo`); the default config restricts to plain
/// `[a-zA-Z_][\w-]*`.
#[inline]
pub fn sp_ident<'a>(config: &IdentConfig) -> SpanParser<'a> {
    if config.allow_leading_dash && config.allow_double_dash_prefix {
        sp_new!(SpanKind::Scanner(SpanScanner::Identifier), "identifier")
    } else {
        panic!(
            "sp_ident: only CSS_IDENT_CONFIG is currently routed through SpanScanner; \
             plain identifiers should call `scan_ident` via a `Boxed` parser"
        );
    }
}

/// Monolithic whitespace + block-comment scanner. Always succeeds.
#[inline]
pub fn sp_ws_comment<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::WsComment))
}

/// Monolithic block-comment scanner: `/\*...\*/`.
#[inline]
pub fn sp_block_comment<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::BlockComment), "comment")
}

/// Match one or more bytes until any byte in `excluded` is found.
/// Enum-dispatched LUT scanner — no boxing, no vtable.
#[inline]
pub fn sp_take_until_any<'a>(excluded: &'static [u8]) -> SpanParser<'a> {
    let mut lut = [false; 256];
    let mut unique = [0u8; 8];
    let mut unique_count = 0usize;
    for &b in excluded {
        let idx = b as usize;
        if lut[idx] {
            continue;
        }
        lut[idx] = true;
        if unique_count < 8 {
            unique[unique_count] = b;
            unique_count += 1;
        }
    }
    let kind = match unique_count {
        0 => SpanKind::TakeUntilAnyLut(Box::new(lut)),
        1 => SpanKind::TakeUntilAny1(unique[0]),
        2 => SpanKind::TakeUntilAny2(unique[0], unique[1]),
        3 => SpanKind::TakeUntilAny3(unique[0], unique[1], unique[2]),
        4..=8 => {
            // Build SIMD nibble LUTs — exact classification, no false positives
            let mut lo_lut = [0u8; 16];
            let mut hi_lut = [0u8; 16];
            for i in 0..unique_count {
                let bit = 1u8 << i;
                lo_lut[(unique[i] & 0x0F) as usize] |= bit;
                hi_lut[(unique[i] >> 4) as usize] |= bit;
            }
            SpanKind::TakeUntilAnySIMD { lo_lut, hi_lut }
        }
        _ => SpanKind::TakeUntilAnyLut(Box::new(lut)),
    };
    #[cfg(feature = "diagnostics")]
    {
        let chars: String = excluded.iter().map(|&b| b as char).collect();
        let label: &'static str =
            Box::leak(format!("any byte not in [{}]", chars).into_boxed_str());
        sp_new!(kind, label)
    }
    #[cfg(not(feature = "diagnostics"))]
    {
        sp_new!(kind)
    }
}

/// End-of-input check for SpanParser. Succeeds with an empty Span at EOF.
#[inline]
pub fn sp_eof<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Eof, "<end of input>")
}

/// Wrap a boxed `ParserFn` as a SpanParser escape hatch.
pub fn sp_boxed<'a>(inner: impl ParserFn<'a, Span<'a>>) -> SpanParser<'a> {
    sp_new!(SpanKind::Boxed(Box::new(inner)))
}
