//! Union-find behavioral tests.

use parse_that_egraph::UnionFind;

#[test]
fn make_set_distinct() {
    let mut uf = UnionFind::new();
    let a = uf.make_set();
    let b = uf.make_set();
    let c = uf.make_set();
    assert_ne!(a, b);
    assert_ne!(b, c);
    assert!(!uf.same_set(a, b));
    assert!(!uf.same_set(a, c));
}

#[test]
fn union_and_find() {
    let mut uf = UnionFind::new();
    let a = uf.make_set();
    let b = uf.make_set();
    let c = uf.make_set();
    let d = uf.make_set();
    uf.union(a, b);
    uf.union(c, d);
    assert!(uf.same_set(a, b));
    assert!(uf.same_set(c, d));
    assert!(!uf.same_set(a, c));
    uf.union(b, c);
    assert!(uf.same_set(a, d));
}

#[test]
fn path_compression() {
    let mut uf = UnionFind::new();
    let ids: Vec<_> = (0..16).map(|_| uf.make_set()).collect();
    for pair in ids.windows(2) {
        uf.union(pair[0], pair[1]);
    }
    // After find, every node should point directly at the root.
    let root = uf.find(ids[0]);
    for id in &ids {
        assert_eq!(uf.find(*id), root);
    }
}
