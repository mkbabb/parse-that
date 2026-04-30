//! Semantic fold (host functions): generated `RegexParserEnum` AST → bespoke `Hir`.
//!
//! Pure recursive walk over the generated parser's typed AST. Each enum
//! variant maps to one `Hir` constructor. Mutable `LowerCtx` tracks inline
//! flag groups (`(?si)` etc.) across the fold.

use super::generated::RegexParserEnum;
use super::hir::*;
use super::unicode;

/// Mutable lowering state — tracks inline flag groups.
struct LowerCtx {
    dotall: bool,
    case_insensitive: bool,
    unicode: bool,
}

/// Lower a generated regex AST to `Hir`.
pub fn lower(ast: &RegexParserEnum<'_>, src: &str, opts: &ParseOptions) -> Result<Hir, ParseError> {
    let mut ctx = LowerCtx {
        dotall: false,
        case_insensitive: false,
        unicode: opts.unicode,
    };
    lower_node(ast, src, &mut ctx)
}

fn lower_node(
    node: &RegexParserEnum<'_>,
    src: &str,
    ctx: &mut LowerCtx,
) -> Result<Hir, ParseError> {
    match node {
        RegexParserEnum::regex(inner) => lower_node(inner, src, ctx),

        RegexParserEnum::alternation((first, rest)) => {
            if rest.is_empty() {
                return lower_node(first, src, ctx);
            }
            let mut branches = vec![lower_node(first, src, ctx)?];
            for r in *rest {
                branches.push(lower_node(r, src, ctx)?);
            }
            Ok(Hir::Alternation(branches))
        }

        RegexParserEnum::concat(items) => {
            if items.len() == 1 {
                return lower_node(&items[0], src, ctx);
            }
            let mut hirs = Vec::new();
            for item in *items {
                hirs.push(lower_node(item, src, ctx)?);
            }
            Ok(Hir::Concat(hirs))
        }

        RegexParserEnum::quantified((atom, quant)) => {
            let inner = lower_node(atom, src, ctx)?;
            match quant {
                None => Ok(inner),
                Some(q) => lower_quantifier(&inner, q, src, ctx),
            }
        }

        RegexParserEnum::atom(inner) => lower_node(inner, src, ctx),

        // group_0: group with inner alternation (capturing, non-capturing, scoped flags)
        RegexParserEnum::group_0((flags_or_prefix, inner)) => {
            let prefix = flags_or_prefix.as_str();
            if prefix.starts_with("(?") && !prefix.starts_with("(?:") {
                // Scoped flags: (?si:...) — extract flags, parse inner
                let flag_str = &prefix[2..];
                let saved = (ctx.dotall, ctx.case_insensitive, ctx.unicode);
                apply_flags(flag_str, ctx);
                let result = lower_node(inner, src, ctx)?;
                (ctx.dotall, ctx.case_insensitive, ctx.unicode) = saved;
                Ok(Hir::Group(Box::new(result)))
            } else {
                // (?:...) or (...)
                let result = lower_node(inner, src, ctx)?;
                Ok(Hir::Group(Box::new(result)))
            }
        }

        // group_1: bare flag group (?si) — no inner alternation
        RegexParserEnum::group_1(flags_span) => {
            let flag_str = flags_span.as_str();
            apply_flags(flag_str, ctx);
            Ok(Hir::Empty)
        }

        RegexParserEnum::group(inner) => {
            let result = lower_node(inner, src, ctx)?;
            Ok(Hir::Group(Box::new(result)))
        }

        // atom_0: dot, anchor, or literal (single span)
        RegexParserEnum::atom_0(span) => {
            let text = span.as_str();
            match text {
                "." => Ok(make_dot(ctx)),
                "^" => Ok(Hir::Look(Look::Start)),
                "$" => Ok(Hir::Look(Look::End)),
                _ => Ok(maybe_case_fold(text.as_bytes()[0], ctx)),
            }
        }

        // escape: backslash sequence (span contains everything after \\)
        RegexParserEnum::escape(span) => lower_escape(span.as_str(), ctx),

        // literal: single non-meta character
        RegexParserEnum::literal(span) => {
            let b = span.as_str().as_bytes()[0];
            Ok(maybe_case_fold(b, ctx))
        }

        // char_class: (optional_negation_span, items_slice)
        RegexParserEnum::char_class((neg_span, items)) => {
            let negated = neg_span.as_str().contains('^');
            lower_char_class(negated, items, src, ctx)
        }

        // class_item: transparent wrapper
        RegexParserEnum::class_item(inner) => lower_node(inner, src, ctx),

        // class_item_0: range (lo - hi)
        RegexParserEnum::class_item_0((lo_span, hi)) => {
            let lo = lower_class_atom_byte(lo_span.as_str());
            let hi_byte = lower_class_atom_node_byte(hi, src);
            Ok(Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(lo, hi_byte)],
                negated: false,
            }))
        }

        // class_item_1: bare character in class
        RegexParserEnum::class_item_1(span) => {
            let b = span.as_str().as_bytes()[0];
            Ok(Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(b, b)],
                negated: false,
            }))
        }

        // class_atom: transparent
        RegexParserEnum::class_atom(inner) => lower_node(inner, src, ctx),

        // class_atom_0: bare char in class
        RegexParserEnum::class_atom_0(span) => {
            let b = span.as_str().as_bytes()[0];
            Ok(Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(b, b)],
                negated: false,
            }))
        }

        // class_escape: backslash sequence inside class
        RegexParserEnum::class_escape(span) => lower_class_escape(span.as_str()),

        // quantifier: parsed but applied by quantified
        RegexParserEnum::quantifier(span) => {
            // Should not be reached directly — handled by lower_quantifier
            Err(ParseError {
                message: format!("unexpected quantifier node: {}", span.as_str()),
                offset: span.start,
            })
        }

        RegexParserEnum::__Phantom(_) => unreachable!(),
    }
}

fn lower_quantifier(
    inner: &Hir,
    quant: &RegexParserEnum<'_>,
    _src: &str,
    _ctx: &mut LowerCtx,
) -> Result<Hir, ParseError> {
    let span = match quant {
        RegexParserEnum::quantifier(s) => s.as_str(),
        _ => {
            return Err(ParseError {
                message: "expected quantifier".into(),
                offset: 0,
            });
        }
    };

    let bytes = span.as_bytes();
    let (min, max, rest) = if bytes[0] == b'*' {
        (0u32, None, &bytes[1..])
    } else if bytes[0] == b'+' {
        (1, None, &bytes[1..])
    } else if bytes[0] == b'?' {
        (0, Some(1), &bytes[1..])
    } else {
        // {n,m} — parse from the span text (skip already handled by >> in grammar)
        parse_braced_quantifier(span)?
    };

    let greedy = !rest.first().is_some_and(|&b| b == b'?');

    Ok(Hir::Repetition(Repetition {
        sub: Box::new(inner.clone()),
        min,
        max,
        greedy,
    }))
}

fn parse_braced_quantifier(s: &str) -> Result<(u32, Option<u32>, &[u8]), ParseError> {
    // s is the span content: "n" or "n," or "n,m" with optional trailing "?"
    let s = s.trim();
    let (num_part, rest) = if let Some(q_pos) = s.find('?') {
        (&s[..q_pos], &s.as_bytes()[q_pos..])
    } else {
        (s, &s.as_bytes()[s.len()..])
    };

    if let Some(comma_pos) = num_part.find(',') {
        let n: u32 = num_part[..comma_pos]
            .trim()
            .parse()
            .map_err(|_| ParseError {
                message: "invalid repetition bound".into(),
                offset: 0,
            })?;
        let after_comma = num_part[comma_pos + 1..].trim();
        let max = if after_comma.is_empty() {
            None
        } else {
            Some(after_comma.parse().map_err(|_| ParseError {
                message: "invalid repetition bound".into(),
                offset: 0,
            })?)
        };
        Ok((n, max, rest))
    } else {
        let n: u32 = num_part.trim().parse().map_err(|_| ParseError {
            message: "invalid repetition bound".into(),
            offset: 0,
        })?;
        Ok((n, Some(n), rest))
    }
}

fn lower_escape(text: &str, ctx: &LowerCtx) -> Result<Hir, ParseError> {
    let bytes = text.as_bytes();
    match bytes[0] {
        b'd' => Ok(shorthand_digit(false)),
        b'D' => Ok(shorthand_digit(true)),
        b'w' => Ok(shorthand_word(false)),
        b'W' => Ok(shorthand_word(true)),
        b's' => Ok(shorthand_space(false)),
        b'S' => Ok(shorthand_space(true)),
        b'n' => Ok(Hir::Literal(vec![b'\n'])),
        b'r' => Ok(Hir::Literal(vec![b'\r'])),
        b't' => Ok(Hir::Literal(vec![b'\t'])),
        b'f' => Ok(Hir::Literal(vec![0x0C])),
        b'a' => Ok(Hir::Literal(vec![0x07])),
        b'0' => Ok(Hir::Literal(vec![0])),
        b'b' => Ok(Hir::Literal(vec![0x08])),
        b'x' => {
            // \xHH
            let hex = &text[1..];
            let val = u8::from_str_radix(hex, 16).map_err(|_| ParseError {
                message: format!("invalid hex escape: \\x{}", hex),
                offset: 0,
            })?;
            Ok(Hir::Literal(vec![val]))
        }
        b'u' => {
            // \u{XXXX} or \uHHHH — text after 'u'
            let rest = &text[1..];
            let hex = rest.trim_start_matches('{').trim_end_matches('}');
            let cp = u32::from_str_radix(hex, 16).map_err(|_| ParseError {
                message: format!("invalid unicode escape: \\u{}", rest),
                offset: 0,
            })?;
            let ch = char::from_u32(cp).ok_or_else(|| ParseError {
                message: format!("invalid codepoint U+{:04X}", cp),
                offset: 0,
            })?;
            let mut buf = [0u8; 4];
            let s = ch.encode_utf8(&mut buf);
            Ok(Hir::Literal(s.as_bytes().to_vec()))
        }
        b'p' | b'P' => {
            // \p{Name} or \P{Name} — text is "p{Name}" or "P{Name}"
            let negated = bytes[0] == b'P';
            let name = &text[1..]; // already stripped { } by grammar >>
            let ranges = unicode::unicode_category_ranges(name).ok_or_else(|| ParseError {
                message: format!("unknown Unicode property: {}", name),
                offset: 0,
            })?;
            Ok(Hir::Class(CharClass::Unicode { ranges, negated }))
        }
        b => Ok(maybe_case_fold(b, ctx)),
    }
}

fn lower_class_escape(text: &str) -> Result<Hir, ParseError> {
    let bytes = text.as_bytes();
    match bytes[0] {
        b'd' => Ok(shorthand_digit(false)),
        b'D' => Ok(shorthand_digit(true)),
        b'w' => Ok(shorthand_word(false)),
        b'W' => Ok(shorthand_word(true)),
        b's' => Ok(shorthand_space(false)),
        b'S' => Ok(shorthand_space(true)),
        b'n' => Ok(Hir::Class(CharClass::Bytes {
            ranges: vec![ByteRange::new(b'\n', b'\n')],
            negated: false,
        })),
        b'r' => Ok(Hir::Class(CharClass::Bytes {
            ranges: vec![ByteRange::new(b'\r', b'\r')],
            negated: false,
        })),
        b't' => Ok(Hir::Class(CharClass::Bytes {
            ranges: vec![ByteRange::new(b'\t', b'\t')],
            negated: false,
        })),
        b'x' => {
            let hex = &text[1..];
            let val = u8::from_str_radix(hex, 16).unwrap_or(0);
            Ok(Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(val, val)],
                negated: false,
            }))
        }
        b'u' => {
            let rest = &text[1..];
            let hex = rest.trim_start_matches('{').trim_end_matches('}');
            let cp = u32::from_str_radix(hex, 16).unwrap_or(0);
            let ch = char::from_u32(cp).unwrap_or('\0');
            if (ch as u32) <= 0x7F {
                let b = ch as u8;
                Ok(Hir::Class(CharClass::Bytes {
                    ranges: vec![ByteRange::new(b, b)],
                    negated: false,
                }))
            } else {
                Ok(Hir::Class(CharClass::Unicode {
                    ranges: vec![CodepointRange::new(ch, ch)],
                    negated: false,
                }))
            }
        }
        b => Ok(Hir::Class(CharClass::Bytes {
            ranges: vec![ByteRange::new(b, b)],
            negated: false,
        })),
    }
}

fn lower_char_class(
    negated: bool,
    items: &[RegexParserEnum<'_>],
    src: &str,
    ctx: &mut LowerCtx,
) -> Result<Hir, ParseError> {
    let mut byte_ranges = Vec::new();
    let mut cp_ranges: Vec<CodepointRange> = Vec::new();

    for item in items {
        match lower_node(item, src, ctx)? {
            Hir::Class(CharClass::Bytes {
                ranges,
                negated: false,
            }) => {
                byte_ranges.extend(ranges);
            }
            Hir::Class(CharClass::Unicode {
                ranges,
                negated: false,
            }) => {
                cp_ranges.extend(ranges);
            }
            Hir::Class(CharClass::Bytes {
                ranges,
                negated: true,
            }) => {
                // Negated shorthand inside class — expand to positive ranges
                let positive = negate_byte_ranges(&ranges);
                byte_ranges.extend(positive);
            }
            Hir::Literal(bytes) if bytes.len() == 1 => {
                byte_ranges.push(ByteRange::new(bytes[0], bytes[0]));
            }
            _ => {} // skip unexpected nodes
        }
    }

    if cp_ranges.is_empty() {
        byte_ranges.sort();
        byte_ranges = merge_byte_ranges(byte_ranges);
        Ok(Hir::Class(CharClass::Bytes {
            ranges: byte_ranges,
            negated,
        }))
    } else {
        for br in &byte_ranges {
            cp_ranges.push(CodepointRange::new(br.start as char, br.end as char));
        }
        cp_ranges.sort();
        cp_ranges.dedup();
        Ok(Hir::Class(CharClass::Unicode {
            ranges: cp_ranges,
            negated,
        }))
    }
}

fn lower_class_atom_byte(text: &str) -> u8 {
    text.as_bytes()[0]
}

fn lower_class_atom_node_byte(node: &RegexParserEnum<'_>, _src: &str) -> u8 {
    match node {
        RegexParserEnum::class_atom_0(span) => span.as_str().as_bytes()[0],
        RegexParserEnum::class_escape(span) => {
            let text = span.as_str();
            match text.as_bytes()[0] {
                b'n' => b'\n',
                b'r' => b'\r',
                b't' => b'\t',
                b => b,
            }
        }
        RegexParserEnum::class_atom(inner) => lower_class_atom_node_byte(inner, _src),
        _ => 0,
    }
}

// ── Helpers ─────────────────────────────────────────────────────────────

fn make_dot(ctx: &LowerCtx) -> Hir {
    if ctx.dotall {
        if ctx.unicode {
            Hir::Class(CharClass::Unicode {
                ranges: vec![CodepointRange::new('\0', '\u{10FFFF}')],
                negated: false,
            })
        } else {
            Hir::Class(CharClass::Bytes {
                ranges: vec![ByteRange::new(0, 255)],
                negated: false,
            })
        }
    } else {
        Hir::Class(CharClass::Bytes {
            ranges: vec![ByteRange::new(b'\n', b'\n')],
            negated: true,
        })
    }
}

fn maybe_case_fold(b: u8, ctx: &LowerCtx) -> Hir {
    if ctx.case_insensitive && b.is_ascii_alphabetic() {
        let lo = b.to_ascii_lowercase();
        let hi = b.to_ascii_uppercase();
        Hir::Class(CharClass::Bytes {
            ranges: vec![ByteRange::new(hi, hi), ByteRange::new(lo, lo)],
            negated: false,
        })
    } else {
        Hir::Literal(vec![b])
    }
}

fn apply_flags(flags: &str, ctx: &mut LowerCtx) {
    for b in flags.bytes() {
        match b {
            b's' => ctx.dotall = true,
            b'i' => ctx.case_insensitive = true,
            b'u' => ctx.unicode = true,
            _ => {}
        }
    }
}

fn shorthand_digit(negated: bool) -> Hir {
    Hir::Class(CharClass::Bytes {
        ranges: vec![ByteRange::new(b'0', b'9')],
        negated,
    })
}

fn shorthand_word(negated: bool) -> Hir {
    Hir::Class(CharClass::Bytes {
        ranges: vec![
            ByteRange::new(b'0', b'9'),
            ByteRange::new(b'A', b'Z'),
            ByteRange::new(b'_', b'_'),
            ByteRange::new(b'a', b'z'),
        ],
        negated,
    })
}

fn shorthand_space(negated: bool) -> Hir {
    Hir::Class(CharClass::Bytes {
        ranges: vec![ByteRange::new(0x09, 0x0D), ByteRange::new(0x20, 0x20)],
        negated,
    })
}

fn merge_byte_ranges(mut ranges: Vec<ByteRange>) -> Vec<ByteRange> {
    if ranges.len() <= 1 {
        return ranges;
    }
    ranges.sort_by_key(|r| (r.start, r.end));
    let mut merged = vec![ranges[0]];
    for r in &ranges[1..] {
        let last = merged.last_mut().unwrap();
        if r.start <= last.end + 1 {
            last.end = last.end.max(r.end);
        } else {
            merged.push(*r);
        }
    }
    merged
}
