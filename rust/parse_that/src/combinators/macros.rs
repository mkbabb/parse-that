// ── seq!: flat N-ary sequential combinator ────────────────────
// Creates a single Box<dyn ParserFn> instead of N-1 intermediate boxes.
// Usage: seq!(p1, p2) → Parser<(O1, O2)>, seq!(p1, p2, p3) → Parser<(O1, O2, O3)>, etc.

#[macro_export]
macro_rules! seq {
    ($p1:expr, $p2:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            Some((v1, v2))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            Some((v1, v2, v3))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            Some((v1, v2, v3, v4))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            let v5 = $p5.call(state)?;
            Some((v1, v2, v3, v4, v5))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            let v5 = $p5.call(state)?;
            let v6 = $p6.call(state)?;
            Some((v1, v2, v3, v4, v5, v6))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr, $p7:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            let v5 = $p5.call(state)?;
            let v6 = $p6.call(state)?;
            let v7 = $p7.call(state)?;
            Some((v1, v2, v3, v4, v5, v6, v7))
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr, $p7:expr, $p8:expr) => {
        $crate::Parser::new(move |state| {
            let v1 = $p1.call(state)?;
            let v2 = $p2.call(state)?;
            let v3 = $p3.call(state)?;
            let v4 = $p4.call(state)?;
            let v5 = $p5.call(state)?;
            let v6 = $p6.call(state)?;
            let v7 = $p7.call(state)?;
            let v8 = $p8.call(state)?;
            Some((v1, v2, v3, v4, v5, v6, v7, v8))
        })
    };
}

// ── alt!: flat N-ary alternation combinator ───────────────────
// Creates a single Box<dyn ParserFn> instead of N-1 intermediate boxes.
// Usage: alt!(p1, p2) → Parser<O>, alt!(p1, p2, p3) → Parser<O>, etc.

#[macro_export]
macro_rules! alt {
    ($p1:expr, $p2:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p5.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p5.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p6.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr, $p7:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p5.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p6.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p7.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
    ($p1:expr, $p2:expr, $p3:expr, $p4:expr, $p5:expr, $p6:expr, $p7:expr, $p8:expr) => {
        $crate::Parser::new(move |state| {
            let cp = state.offset;
            if let Some(v) = $p1.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p2.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p3.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p4.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p5.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p6.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p7.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            if let Some(v) = $p8.call(state) {
                return Some(v);
            }
            state.furthest_offset = state.furthest_offset.max(state.offset);
            state.offset = cp;
            None
        })
    };
}
