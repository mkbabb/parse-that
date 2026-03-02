use aho_corasick::{AhoCorasickBuilder, MatchKind, StartKind};

use crate::leaf::cached_regex;
use crate::parse::ParserFn;
use crate::state::Span;

use super::{SpanKind, SpanParser};

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

/// Monolithic JSON number scanner.
#[inline]
pub fn sp_json_number<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::JsonNumber, "number")
}

/// Monolithic JSON string scanner — SIMD-accelerated via memchr2.
/// Returns span of content between quotes (exclusive of delimiters).
#[inline]
pub fn sp_json_string<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::JsonString, "string")
}

/// Monolithic JSON string scanner — SIMD-accelerated via memchr2.
/// Returns span including the quote delimiters (matches regex behavior).
#[inline]
pub fn sp_json_string_quoted<'a>() -> SpanParser<'a> {
    sp_new!(SpanKind::JsonStringQuoted, "string")
}

/// Match one or more bytes until any byte in `excluded` is found.
/// Enum-dispatched LUT scanner — no boxing, no vtable.
#[inline]
pub fn sp_take_until_any<'a>(excluded: &'static [u8]) -> SpanParser<'a> {
    let mut lut = [false; 256];
    for &b in excluded {
        lut[b as usize] = true;
    }
    #[cfg(feature = "diagnostics")]
    {
        let chars: String = excluded.iter().map(|&b| b as char).collect();
        let label: &'static str =
            Box::leak(format!("any byte not in [{}]", chars).into_boxed_str());
        sp_new!(SpanKind::TakeUntilAny(Box::new(lut)), label)
    }
    #[cfg(not(feature = "diagnostics"))]
    {
        sp_new!(SpanKind::TakeUntilAny(Box::new(lut)))
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
