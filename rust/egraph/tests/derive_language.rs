//! `#[derive(Language)]` behavioral tests.

use parse_that_egraph::{Id, Language};
use parse_that_egraph_derive::Language;

#[derive(Clone, Eq, PartialEq, Hash, Debug, Language)]
enum Expr {
    // Leaf: no children, no tag.
    Num(i64),
    // Single child — explicit attribute (still supported).
    Neg(#[language(child)] Id),
    // Variadic children — explicit attribute.
    Sum(#[language(children)] Box<[Id]>),
    // Named fields with a single child + scalar leaves.
    Pow {
        #[language(child)]
        base: Id,
        exp: u32,
    },
    // Unit variant.
    Empty,
}

/// Same shape as `Expr`, but relies entirely on **auto-detection** from
/// field types — no `#[language(...)]` annotations. Exercises B-0.
#[derive(Clone, Eq, PartialEq, Hash, Debug, Language)]
enum AutoExpr {
    Num(i64),                   // non-Id scalar → Leaf
    Neg(Id),                    // Id → SingleId
    Sum(Box<[Id]>),             // Box<[Id]> → SliceId
    Pair([Id; 2]),              // [Id; N] → ArrayId (multi-child via array)
    Pow { base: Id, exp: u32 }, // mixed struct fields
    VecSum(Vec<Id>),            // Vec<Id> → SliceId
    Empty,
}

#[test]
fn leaf_has_no_children() {
    let n = Expr::Num(42);
    assert_eq!(n.children(), &[]);
}

#[test]
fn unit_has_no_children() {
    let e = Expr::Empty;
    assert_eq!(e.children(), &[]);
}

#[test]
fn single_child_visible() {
    let n = Expr::Neg(Id(7));
    assert_eq!(n.children(), &[Id(7)]);
}

#[test]
fn variadic_children_visible() {
    let s = Expr::Sum(Box::new([Id(1), Id(2), Id(3)]));
    assert_eq!(s.children(), &[Id(1), Id(2), Id(3)]);
}

#[test]
fn named_single_child_visible() {
    let p = Expr::Pow {
        base: Id(5),
        exp: 2,
    };
    assert_eq!(p.children(), &[Id(5)]);
}

#[test]
fn children_mut_replaces_ids() {
    let mut n = Expr::Neg(Id(0));
    for c in n.children_mut() {
        *c = Id(99);
    }
    assert_eq!(n.children(), &[Id(99)]);

    let mut s = Expr::Sum(Box::new([Id(0), Id(1), Id(2)]));
    for c in s.children_mut() {
        c.0 += 10;
    }
    assert_eq!(s.children(), &[Id(10), Id(11), Id(12)]);
}

// ── Auto-detection tests (B-0) ─────────────────────────────────────────

#[test]
fn auto_leaf_scalar() {
    assert_eq!(AutoExpr::Num(42).children(), &[]);
    assert_eq!(AutoExpr::Empty.children(), &[]);
}

#[test]
fn auto_single_id() {
    let n = AutoExpr::Neg(Id(7));
    assert_eq!(n.children(), &[Id(7)]);
}

#[test]
fn auto_boxed_slice() {
    let s = AutoExpr::Sum(Box::new([Id(1), Id(2), Id(3)]));
    assert_eq!(s.children(), &[Id(1), Id(2), Id(3)]);
}

#[test]
fn auto_vec_of_id() {
    let v = AutoExpr::VecSum(vec![Id(10), Id(20)]);
    assert_eq!(v.children(), &[Id(10), Id(20)]);
}

#[test]
fn auto_fixed_array_pair() {
    let p = AutoExpr::Pair([Id(4), Id(5)]);
    assert_eq!(p.children(), &[Id(4), Id(5)]);
}

#[test]
fn auto_named_struct_variant() {
    let p = AutoExpr::Pow {
        base: Id(5),
        exp: 2,
    };
    assert_eq!(p.children(), &[Id(5)]);
}

#[test]
fn auto_children_mut_pair_roundtrip() {
    let mut p = AutoExpr::Pair([Id(0), Id(0)]);
    for (i, c) in p.children_mut().iter_mut().enumerate() {
        c.0 = (i as u32) + 1;
    }
    assert_eq!(p.children(), &[Id(1), Id(2)]);
}
