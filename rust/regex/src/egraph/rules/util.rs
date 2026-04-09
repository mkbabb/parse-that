//! Shared helpers for HIR e-graph rules: `CharClass` ↔ `ByteSet`
//! projection, and e-class inspection.
//!
//! The grammar-tier rules work with pattern strings (because
//! `GrammarENode::Regex(StringId)` carries interned text). The HIR
//! tier works with `HirENode::Class(CharClass)` directly — no
//! string round-tripping. These helpers project a non-negated
//! byte class into the `ByteSet` that `crate::algebra::{is_superset,
//! try_union}` operate on, and rebuild a canonical `CharClass` from
//! the merged `ByteSet` for installation back into the e-graph.

use egraph::{Analysis, EGraph, Id};

use crate::egraph::node::HirENode;
use crate::hir::{ByteRange, CharClass};
use crate::sets::byteset::ByteSet;

/// Project a non-negated `CharClass::Bytes` into a `ByteSet`.
/// Returns `None` for negated classes and Unicode classes — those
/// need their own handling and are out of scope for the peephole
/// superset / union rules.
pub fn char_class_byteset(class: &CharClass) -> Option<ByteSet> {
    match class {
        CharClass::Bytes { ranges, negated } if !*negated => {
            let mut bs = ByteSet::empty();
            for r in ranges {
                for b in r.start..=r.end {
                    bs.insert(b);
                }
            }
            Some(bs)
        }
        _ => None,
    }
}

/// Rebuild a canonical `CharClass::Bytes` from a `ByteSet`, with
/// ranges coalesced into maximal runs of adjacent bytes.
pub fn byteset_to_char_class(bs: &ByteSet) -> CharClass {
    let bytes: Vec<u8> = bs.iter().collect();
    let mut ranges = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        let start = bytes[i];
        let mut end = start;
        while i + 1 < bytes.len() && bytes[i + 1] == end + 1 {
            end = bytes[i + 1];
            i += 1;
        }
        ranges.push(ByteRange::new(start, end));
        i += 1;
    }
    CharClass::Bytes {
        ranges,
        negated: false,
    }
}

/// Find the `CharClass` payload of a child e-class, if any of its
/// e-nodes is a `HirENode::Class`. Returns the first `Class` node
/// found — if multiple distinct `Class` nodes coexist in the same
/// e-class, the e-graph has already merged them as structurally
/// equivalent, so any representative works.
pub fn class_payload<A: Analysis<HirENode>>(
    egraph: &EGraph<HirENode, A>,
    id: Id,
) -> Option<CharClass> {
    let canon = egraph.find_ref(id);
    egraph.class(canon).iter().find_map(|n| {
        if let HirENode::Class(class) = n {
            Some(class.clone())
        } else {
            None
        }
    })
}
