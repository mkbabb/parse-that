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
