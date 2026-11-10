//! `Hir::to_source`: print a `Hir` back to ECMAScript pattern text.
//!
//! The printer is the round-trip oracle for the parser: for every pattern
//! the parser accepts, `parse(hir.to_source(flags)) == hir`, and the printed
//! text means what the source means under V8 and JavaScriptCore with the
//! same `flags`. Case folding, dot-all and the shorthand classes are already
//! materialised in the `Hir`, so the printed text carries no inline flags.
//!
//! `flags` are the leaf's ECMAScript flags. Only `u` and `v` change the
//! spelling: with either, an astral scalar prints as `\u{…}`; without, it
//! prints as its UTF-16 surrogate pair, the only spelling a non-`u` pattern
//! has for it.

use std::fmt::Write as _;

use super::{ByteRange, CharClass, CodepointRange, Hir, Look, Repetition};

impl Hir {
    /// The ECMAScript pattern text of this `Hir` under `flags`.
    pub fn to_source(&self, flags: &str) -> String {
        let mut out = String::new();
        let unicode = flags.contains('u') || flags.contains('v');
        Printer {
            out: &mut out,
            unicode,
        }
        .hir(self);
        out
    }
}

struct Printer<'a> {
    out: &'a mut String,
    unicode: bool,
}

impl Printer<'_> {
    fn hir(&mut self, hir: &Hir) {
        match hir {
            Hir::Alternation(branches) => {
                for (i, branch) in branches.iter().enumerate() {
                    if i > 0 {
                        self.out.push('|');
                    }
                    self.concat_item(branch);
                }
            }
            Hir::Concat(items) => self.concat(items),
            other => self.concat_item(other),
        }
    }

    /// A sequence. Runs of single-byte literals at or above 0x80 print as the
    /// UTF-8 text they spell, so the source `é` (which the parser reads as the
    /// two literals C3 A9) prints as `é` and reads back as those two literals.
    fn concat(&mut self, items: &[Hir]) {
        let mut run: Vec<u8> = Vec::new();
        for item in items {
            match item {
                Hir::Literal(bytes) if bytes.len() == 1 && bytes[0] >= 0x80 => run.push(bytes[0]),
                _ => {
                    self.byte_run(&run);
                    run.clear();
                    match item {
                        Hir::Alternation(_) | Hir::Concat(_) => self.group(item),
                        _ => self.concat_item(item),
                    }
                }
            }
        }
        self.byte_run(&run);
    }

    /// Bytes from separate one-byte literals: valid UTF-8 prints raw, any
    /// other byte as `\xHH`.
    fn byte_run(&mut self, mut bytes: &[u8]) {
        while !bytes.is_empty() {
            match std::str::from_utf8(bytes) {
                Ok(text) => {
                    self.out.push_str(text);
                    return;
                }
                Err(err) => {
                    let (valid, rest) = bytes.split_at(err.valid_up_to());
                    // `valid_up_to` marks a UTF-8 boundary.
                    self.out
                        .push_str(std::str::from_utf8(valid).unwrap_or_default());
                    let bad = err.error_len().unwrap_or(rest.len());
                    for &b in &rest[..bad] {
                        let _ = write!(self.out, "\\x{b:02X}");
                    }
                    bytes = &rest[bad..];
                }
            }
        }
    }

    /// One item of a sequence; a `Concat` or `Alternation` here is grouped.
    fn concat_item(&mut self, hir: &Hir) {
        match hir {
            Hir::Empty => {}
            Hir::Literal(bytes) => self.literal(bytes),
            Hir::Class(class) => self.class(class),
            Hir::Look(look) => self.out.push_str(match look {
                Look::Start => "^",
                Look::End => "$",
                // ECMAScript spells line anchors with the `m` modifier, whose
                // line terminators are LF, CR, U+2028 and U+2029.
                Look::StartLF | Look::StartCRLF => "(?m:^)",
                Look::EndLF | Look::EndCRLF => "(?m:$)",
            }),
            Hir::Repetition(rep) => self.repetition(rep),
            Hir::Group(inner) => self.group(inner),
            Hir::Concat(items) => self.concat(items),
            Hir::Alternation(_) => self.group(hir),
        }
    }

    fn group(&mut self, inner: &Hir) {
        self.out.push_str("(?:");
        self.hir(inner);
        self.out.push(')');
    }

    /// A literal. One scalar of two or more UTF-8 bytes (the parser's reading
    /// of a `\u` escape) prints as an escape, so it reads back as one literal.
    fn literal(&mut self, bytes: &[u8]) {
        match std::str::from_utf8(bytes) {
            Ok(text) if text.chars().count() == 1 && bytes.len() > 1 => {
                let c = text.chars().next().unwrap_or_default();
                self.scalar_escape(c as u32);
            }
            Ok(text) => {
                for c in text.chars() {
                    if c.is_ascii() {
                        self.ascii(c as u8, false);
                    } else {
                        self.scalar_escape(c as u32);
                    }
                }
            }
            Err(_) => {
                for &b in bytes {
                    if b.is_ascii() {
                        self.ascii(b, false);
                    } else {
                        let _ = write!(self.out, "\\x{b:02X}");
                    }
                }
            }
        }
    }

    /// One ASCII byte, escaped where the pattern grammar needs it. `-` is
    /// escaped only inside a class: `\-` outside one is a `u`-mode error.
    fn ascii(&mut self, b: u8, in_class: bool) {
        let special = if in_class {
            matches!(b, b'\\' | b']' | b'[' | b'^' | b'-')
        } else {
            matches!(
                b,
                b'\\'
                    | b'^'
                    | b'$'
                    | b'.'
                    | b'|'
                    | b'?'
                    | b'*'
                    | b'+'
                    | b'('
                    | b')'
                    | b'['
                    | b']'
                    | b'{'
                    | b'}'
                    | b'/'
            )
        };
        match b {
            _ if special => {
                self.out.push('\\');
                self.out.push(b as char);
            }
            b'\n' => self.out.push_str("\\n"),
            b'\r' => self.out.push_str("\\r"),
            b'\t' => self.out.push_str("\\t"),
            0x0C => self.out.push_str("\\f"),
            0x20..=0x7E => self.out.push(b as char),
            _ => {
                let _ = write!(self.out, "\\x{b:02X}");
            }
        }
    }

    /// `\uXXXX`, or for an astral scalar `\u{…}` under `u`/`v` and the
    /// surrogate pair otherwise.
    fn scalar_escape(&mut self, cp: u32) {
        if cp <= 0xFFFF {
            let _ = write!(self.out, "\\u{cp:04X}");
        } else if self.unicode {
            let _ = write!(self.out, "\\u{{{cp:X}}}");
        } else {
            let v = cp - 0x1_0000;
            let _ = write!(
                self.out,
                "\\u{:04X}\\u{:04X}",
                0xD800 + (v >> 10),
                0xDC00 + (v & 0x3FF)
            );
        }
    }

    fn class(&mut self, class: &CharClass) {
        self.out.push('[');
        if class.negated() {
            self.out.push('^');
        }
        match class {
            CharClass::Bytes { ranges, .. } => {
                for &ByteRange { start, end } in ranges {
                    self.class_byte(start);
                    if end > start {
                        self.out.push('-');
                        self.class_byte(end);
                    }
                }
            }
            // Every member is an escape, so the class reads back as a
            // codepoint class with the same ranges.
            CharClass::Unicode { ranges, .. } => {
                for &CodepointRange { start, end } in ranges {
                    self.scalar_escape(start as u32);
                    if end > start {
                        self.out.push('-');
                        self.scalar_escape(end as u32);
                    }
                }
            }
        }
        self.out.push(']');
    }

    fn class_byte(&mut self, b: u8) {
        if b.is_ascii() {
            self.ascii(b, true);
        } else {
            let _ = write!(self.out, "\\x{b:02X}");
        }
    }

    fn repetition(&mut self, rep: &Repetition) {
        let atomic = match rep.sub.as_ref() {
            Hir::Literal(bytes) => {
                bytes.len() == 1 || std::str::from_utf8(bytes).is_ok_and(|t| t.chars().count() == 1)
            }
            Hir::Class(_) | Hir::Group(_) | Hir::Look(_) => true,
            Hir::Empty | Hir::Repetition(_) | Hir::Concat(_) | Hir::Alternation(_) => false,
        };
        if atomic {
            self.concat_item(&rep.sub);
        } else {
            self.group(&rep.sub);
        }
        match (rep.min, rep.max) {
            (0, None) => self.out.push('*'),
            (1, None) => self.out.push('+'),
            (0, Some(1)) => self.out.push('?'),
            (n, None) => {
                let _ = write!(self.out, "{{{n},}}");
            }
            (n, Some(m)) if n == m => {
                let _ = write!(self.out, "{{{n}}}");
            }
            (n, Some(m)) => {
                let _ = write!(self.out, "{{{n},{m}}}");
            }
        }
        if !rep.greedy {
            self.out.push('?');
        }
    }
}
