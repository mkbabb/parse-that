//! ECMAScript case canonicalization over the generated tables
//! (`case_tables.rs`, from the UCD by `tools/ucd/gen_tables.py`).
//!
//! Two scalars match under `i` when they canonicalize to the same scalar
//! (ECMA-262 Canonicalize). In u/v mode that is simple case folding; in
//! non-u mode, the toUppercase reading of one UTF-16 code unit. The engine's
//! canonical meaning is u/v (Unicode mode); byte mode reads the non-u rule.

use crate::case_tables::{
    FOLD_NONU_CLASSES, FOLD_NONU_MEMBERS, FOLD_U_CLASSES, FOLD_U_MEMBERS, IU_WORD_EXTRA,
};
use crate::hir::CodepointRange;

pub use crate::case_tables::{SPACE_ZS, UNICODE_VERSION};

fn tables(unicode: bool) -> (&'static [&'static [u32]], &'static [(u32, u16)]) {
    if unicode {
        (FOLD_U_CLASSES, FOLD_U_MEMBERS)
    } else {
        (FOLD_NONU_CLASSES, FOLD_NONU_MEMBERS)
    }
}

/// The scalars that match `c` under `i` (`c` itself included), in order.
pub fn equivalents(c: char, unicode: bool) -> Vec<char> {
    let (classes, members) = tables(unicode);
    match members.binary_search_by_key(&(c as u32), |&(m, _)| m) {
        Ok(i) => classes[members[i].1 as usize]
            .iter()
            .filter_map(|&m| char::from_u32(m))
            .collect(),
        Err(_) => vec![c],
    }
}

/// The closure of a sorted range set under `i`: every scalar equivalent to
/// a member is added. The result is sorted and merged.
pub fn close_ranges(ranges: &[CodepointRange], unicode: bool) -> Vec<CodepointRange> {
    let (classes, members) = tables(unicode);
    let contains = |c: u32| {
        ranges
            .binary_search_by(|r| {
                if (r.end as u32) < c {
                    std::cmp::Ordering::Less
                } else if (r.start as u32) > c {
                    std::cmp::Ordering::Greater
                } else {
                    std::cmp::Ordering::Equal
                }
            })
            .is_ok()
    };
    let mut out: Vec<CodepointRange> = ranges.to_vec();
    let mut added = vec![false; classes.len()];
    for &(m, class) in members {
        if !added[class as usize] && contains(m) {
            added[class as usize] = true;
            for &e in classes[class as usize] {
                if let Some(ch) = char::from_u32(e) {
                    out.push(CodepointRange::new(ch, ch));
                }
            }
        }
    }
    crate::hir::merge_codepoint_ranges(out)
}

/// The `/iu` word set's members outside `[A-Za-z0-9_]` (U+017F, U+212A at
/// Unicode 17.0).
pub fn iu_word_extra() -> impl Iterator<Item = char> {
    IU_WORD_EXTRA.iter().filter_map(|&c| char::from_u32(c))
}
