//! UnsafeCell-based bump arena — zero-overhead allocation for single-threaded parsing.
//!
//! Drop-in replacement for `typed_arena::Arena<T>` without `RefCell` borrow tracking.
//! Each `alloc()` call avoids 2 reads + 1 write + 1 branch from `RefCell::borrow_mut()`.
//!
//! # Safety
//!
//! `BumpArena` uses `UnsafeCell` internally. The returned `&T` references are valid
//! for the lifetime of the arena. This is safe under the parsing contract:
//! - Single-threaded (no `Send`/`Sync`)
//! - Non-reentrant allocation (no recursive `alloc` during `alloc`)
//! - References don't alias the internal chunk state

use std::cell::UnsafeCell;

/// A fast bump allocator that returns `&T` references valid for the arena's lifetime.
///
/// Unlike `typed_arena::Arena`, this uses `UnsafeCell` instead of `RefCell`,
/// eliminating runtime borrow checks on every allocation.
pub struct BumpArena<T> {
    current: UnsafeCell<Vec<T>>,
    rest: UnsafeCell<Vec<Vec<T>>>,
}

impl<T> BumpArena<T> {
    /// Create a new arena with the given initial capacity.
    #[inline]
    pub fn with_capacity(n: usize) -> Self {
        Self {
            current: UnsafeCell::new(Vec::with_capacity(n.max(64))),
            rest: UnsafeCell::new(Vec::new()),
        }
    }

    /// Create a new arena with default capacity.
    #[inline]
    pub fn new() -> Self {
        Self::with_capacity(64)
    }

    /// Allocate a value in the arena and return a reference to it.
    ///
    /// The returned reference is valid for the lifetime of the arena.
    ///
    /// # Safety contract (upheld by construction)
    ///
    /// This is safe because:
    /// 1. `&self` ensures the arena outlives the returned reference
    /// 2. `Vec::push` doesn't invalidate existing references when we grow
    ///    (we move the full Vec to `rest` and start a fresh one)
    /// 3. Parsing is single-threaded — no concurrent `alloc` calls
    #[inline(always)]
    pub fn alloc(&self, value: T) -> &T {
        let current = unsafe { &mut *self.current.get() };
        if current.len() == current.capacity() {
            self.grow();
            // Re-borrow after grow (current chunk was swapped).
            let current = unsafe { &mut *self.current.get() };
            current.push(value);
            unsafe { current.last().unwrap_unchecked() }
        } else {
            current.push(value);
            unsafe { current.last().unwrap_unchecked() }
        }
    }

    /// Grow the arena by moving the current chunk to `rest` and allocating a new,
    /// larger chunk.
    #[cold]
    #[inline(never)]
    fn grow(&self) {
        let current = unsafe { &mut *self.current.get() };
        let rest = unsafe { &mut *self.rest.get() };
        let new_cap = current.capacity() * 2;
        let old = std::mem::replace(current, Vec::with_capacity(new_cap));
        rest.push(old);
    }
}

impl<T> Default for BumpArena<T> {
    fn default() -> Self {
        Self::new()
    }
}
