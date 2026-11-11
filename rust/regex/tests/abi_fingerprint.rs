//! sk-v27 LW2.RX-2: the `Hir` ABI freeze (OR-7 Route A, so the `Hir` types
//! only: Route A's determinizer is regex-automata, and no state type of ours
//! is frozen).
//!
//! The fingerprint covers every variant, every field with its type, and the
//! size and alignment of each frozen type. Its parts are read from the types
//! themselves:
//!
//! - each enum is matched without a wildcard and each struct is destructured
//!   without `..`, so a new variant or field does not compile;
//! - each field is bound to its frozen type, so a changed field type does not
//!   compile;
//! - sizes and alignments are `size_of`/`align_of` on the host (64-bit
//!   targets; wasm32 is not read).
//!
//! The descriptor text must equal the block recorded in `ABI-HIR.md`, and its
//! FNV-1a 64 digest must equal `RECORDED`. Any change to a frozen type is an
//! `ABI-HIR.md` addendum (a new version line), never an edit of this test's
//! constant alone.

#![cfg(target_pointer_width = "64")]
// Each field is bound to its exact frozen type, `Box<Hir>` included.
#![allow(clippy::borrowed_box)]

use std::mem::{align_of, size_of};

use parse_that_regex::hir::{ByteRange, CharClass, CodepointRange, Hir, Look, Repetition};

/// FNV-1a 64 of the descriptor at ABI version 1.
const RECORDED: u64 = 0x0c58_7e00_7f6c_cf7d;

fn fnv1a64(bytes: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for &b in bytes {
        h ^= u64::from(b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    h
}

fn layout<T>(name: &str) -> String {
    format!("{name} size={} align={}", size_of::<T>(), align_of::<T>())
}

// ── Exhaustive witnesses: one arm per variant, every field bound to its type.

fn hir_variant(h: &Hir) -> &'static str {
    match h {
        Hir::Empty => "Empty",
        Hir::Literal(bytes) => {
            let _: &Vec<u8> = bytes;
            "Literal(Vec<u8>)"
        }
        Hir::Class(class) => {
            let _: &CharClass = class;
            "Class(CharClass)"
        }
        Hir::Look(look) => {
            let _: &Look = look;
            "Look(Look)"
        }
        Hir::Repetition(rep) => {
            let _: &Repetition = rep;
            "Repetition(Repetition)"
        }
        Hir::Group(sub) => {
            let _: &Box<Hir> = sub;
            "Group(Box<Hir>)"
        }
        Hir::Concat(items) => {
            let _: &Vec<Hir> = items;
            "Concat(Vec<Hir>)"
        }
        Hir::Alternation(items) => {
            let _: &Vec<Hir> = items;
            "Alternation(Vec<Hir>)"
        }
    }
}

fn look_variant(l: &Look) -> &'static str {
    match l {
        Look::Start => "Start",
        Look::End => "End",
        Look::StartLF => "StartLF",
        Look::EndLF => "EndLF",
        Look::StartCRLF => "StartCRLF",
        Look::EndCRLF => "EndCRLF",
        Look::WordBoundary => "WordBoundary",
        Look::NotWordBoundary => "NotWordBoundary",
    }
}

fn class_variant(c: &CharClass) -> &'static str {
    match c {
        CharClass::Bytes { ranges, negated } => {
            let _: (&Vec<ByteRange>, &bool) = (ranges, negated);
            "Bytes { ranges: Vec<ByteRange>, negated: bool }"
        }
        CharClass::Unicode { ranges, negated } => {
            let _: (&Vec<CodepointRange>, &bool) = (ranges, negated);
            "Unicode { ranges: Vec<CodepointRange>, negated: bool }"
        }
    }
}

fn repetition_fields(r: &Repetition) -> &'static str {
    let Repetition {
        sub,
        min,
        max,
        greedy,
    } = r;
    let _: (&Box<Hir>, &u32, &Option<u32>, &bool) = (sub, min, max, greedy);
    "sub: Box<Hir>, min: u32, max: Option<u32>, greedy: bool"
}

fn byte_range_fields(r: &ByteRange) -> &'static str {
    let ByteRange { start, end } = r;
    let _: (&u8, &u8) = (start, end);
    "start: u8, end: u8"
}

fn codepoint_range_fields(r: &CodepointRange) -> &'static str {
    let CodepointRange { start, end } = r;
    let _: (&char, &char) = (start, end);
    "start: char, end: char"
}

/// The canonical descriptor, one line per type header and per variant/field
/// set, in declaration order.
fn descriptor() -> String {
    let byte = ByteRange::new(0, 0);
    let cp = CodepointRange::new('a', 'a');
    let hirs = [
        Hir::Empty,
        Hir::Literal(Vec::new()),
        Hir::Class(CharClass::Bytes {
            ranges: Vec::new(),
            negated: false,
        }),
        Hir::Look(Look::Start),
        Hir::Repetition(Repetition {
            sub: Box::new(Hir::Empty),
            min: 0,
            max: None,
            greedy: true,
        }),
        Hir::Group(Box::new(Hir::Empty)),
        Hir::Concat(Vec::new()),
        Hir::Alternation(Vec::new()),
    ];
    let looks = [
        Look::Start,
        Look::End,
        Look::StartLF,
        Look::EndLF,
        Look::StartCRLF,
        Look::EndCRLF,
        Look::WordBoundary,
        Look::NotWordBoundary,
    ];
    let classes = [
        CharClass::Bytes {
            ranges: Vec::new(),
            negated: false,
        },
        CharClass::Unicode {
            ranges: Vec::new(),
            negated: false,
        },
    ];
    let rep = Repetition {
        sub: Box::new(Hir::Empty),
        min: 0,
        max: None,
        greedy: true,
    };

    let mut out = Vec::new();
    out.push("parse-that-regex Hir ABI v1 (sk-v27 LW2.RX-2, OR-7 Route A)".to_string());
    out.push(format!("enum {}", layout::<Hir>("Hir")));
    out.extend(hirs.iter().map(|h| format!("  {}", hir_variant(h))));
    out.push(format!("enum {}", layout::<Look>("Look")));
    out.extend(looks.iter().map(|l| format!("  {}", look_variant(l))));
    out.push(format!("enum {}", layout::<CharClass>("CharClass")));
    out.extend(classes.iter().map(|c| format!("  {}", class_variant(c))));
    out.push(format!("struct {}", layout::<Repetition>("Repetition")));
    out.push(format!("  {}", repetition_fields(&rep)));
    out.push(format!("struct {}", layout::<ByteRange>("ByteRange")));
    out.push(format!("  {}", byte_range_fields(&byte)));
    out.push(format!(
        "struct {}",
        layout::<CodepointRange>("CodepointRange")
    ));
    out.push(format!("  {}", codepoint_range_fields(&cp)));
    let mut text = out.join("\n");
    text.push('\n');
    text
}

/// The descriptor block recorded in `ABI-HIR.md` (the first ```text fence).
fn recorded_descriptor() -> String {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/ABI-HIR.md");
    let doc = std::fs::read_to_string(path).expect("ABI-HIR.md");
    let start = doc
        .find("```text\n")
        .expect("ABI-HIR.md has a ```text block")
        + 8;
    let end = start + doc[start..].find("```").expect("closed fence");
    doc[start..end].to_string()
}

#[test]
fn hir_abi_fingerprint_is_recorded() {
    let text = descriptor();
    let digest = fnv1a64(text.as_bytes());
    assert_eq!(
        text,
        recorded_descriptor(),
        "the Hir types moved from ABI-HIR.md; a change is an ABI-HIR.md addendum"
    );
    assert_eq!(
        digest, RECORDED,
        "Hir ABI fingerprint {digest:#018x} != recorded {RECORDED:#018x}\n{text}"
    );
}
