use std::ops::{Bound, RangeBounds};

pub fn extract_bounds<'a>(bounds: impl RangeBounds<usize> + 'a) -> (usize, usize) {
    let start = match bounds.start_bound() {
        Bound::Included(&n) => n,
        Bound::Excluded(&n) => n + 1,
        Bound::Unbounded => 0,
    };
    let end = match bounds.end_bound() {
        Bound::Included(&n) => n + 1,
        Bound::Excluded(&n) => n,
        Bound::Unbounded => usize::MAX,
    };
    (start, end)
}

pub fn get_cargo_root_path() -> std::path::PathBuf {
    std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".into()))
}
