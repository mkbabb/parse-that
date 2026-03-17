use aho_corasick::{AhoCorasickBuilder, MatchKind, StartKind};

use crate::leaf::cached_regex;
use crate::parse::ParserFn;
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

/// Match regex pattern. Uses global cache to avoid recompilation.
pub fn sp_regex<'a>(r: &str) -> SpanParser<'a> {
    let re = cached_regex(r);
    #[cfg(feature = "diagnostics")]
    {
        let label: &'static str = Box::leak(format!("/{}/", r).into_boxed_str());
        sp_new!(SpanKind::RegexMatch(re), label)
    }
    #[cfg(not(feature = "diagnostics"))]
    {
        sp_new!(SpanKind::RegexMatch(re))
    }
}

/// Match any of the given string patterns (Aho-Corasick). Compiled at construction time.
pub fn sp_any<'a>(patterns: &[&str]) -> SpanParser<'a> {
    let ac = AhoCorasickBuilder::new()
        .match_kind(MatchKind::LeftmostFirst)
        .start_kind(StartKind::Anchored)
        .build(patterns)
        .expect("failed to build aho-corasick automaton");
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

// ── Domain-specific scanner constructors ─────────────────────

/// Monolithic JSON number scanner.
#[inline]
pub fn sp_json_number<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::JsonNumber), "number")
}

/// Monolithic JSON string scanner (memchr2). Content span, exclusive of quotes.
#[inline]
pub fn sp_json_string<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::JsonString), "string")
}

/// Monolithic JSON string scanner (memchr2). Span includes quote delimiters.
#[inline]
pub fn sp_json_string_quoted<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::JsonStringQuoted), "string")
}

/// Monolithic CSS identifier scanner — direct byte scanning.
#[inline]
pub fn sp_css_ident<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::CssIdent), "CSS identifier")
}

/// Monolithic CSS whitespace + comment scanner. Always succeeds.
#[inline]
pub fn sp_css_ws_comment<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::CssWsComment))
}

/// Monolithic CSS quoted string scanner (memchr2).
#[inline]
pub fn sp_css_string<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::CssString), "CSS string")
}

/// Monolithic CSS block comment scanner: /\*...\*/
#[inline]
pub fn sp_css_block_comment<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::Scanner(SpanScanner::CssBlockComment), "CSS comment")
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
