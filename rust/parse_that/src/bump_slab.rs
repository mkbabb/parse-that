//! Byte-based bump allocator — polymorphic, zero-overhead allocation for
//! single-threaded parsing.
//!
//! Unlike a typed `Arena<T>`, `BumpSlab` allocates raw bytes with alignment,
//! so a single slab serves all types: enums, tuples, slices, references.
//!
//! # Safety
//!
//! - **No Drop**: allocated values are NOT destructed when the slab is freed.
//!   All parser-allocated types (enums of `&'a` references, `Span`, tuples,
//!   `Value` with `NonNull`) are trivially destructible. If you allocate a type
//!   with a non-trivial `Drop`, it will leak.
//! - Single-threaded (no `Send`/`Sync`).
//! - Non-reentrant allocation (no recursive `alloc` during `alloc`).
//! - Returned `&T` references are valid for the slab's lifetime.

use std::cell::UnsafeCell;

/// A fast byte-based bump allocator. Generic `alloc<T>` and `alloc_slice_clone<T>`
/// work for any type on a single slab — no type parameter.
pub struct BumpSlab {
    current: UnsafeCell<Vec<u8>>,
    rest: UnsafeCell<Vec<Vec<u8>>>,
}

impl BumpSlab {
    /// Create a new slab with the given byte capacity.
    #[inline]
    pub fn with_capacity(bytes: usize) -> Self {
        Self {
            current: UnsafeCell::new(Vec::with_capacity(bytes.max(256))),
            rest: UnsafeCell::new(Vec::new()),
        }
    }

    /// Create a new slab with default capacity (512 bytes).
    #[inline]
    pub fn new() -> Self {
        Self::with_capacity(512)
    }

    /// Allocate a single value and return a reference to it.
    #[inline(always)]
    pub fn alloc<T>(&self, value: T) -> &T {
        let size = std::mem::size_of::<T>();
        let align = std::mem::align_of::<T>();
        let ptr = self.alloc_raw(size, align) as *mut T;
        unsafe {
            std::ptr::write(ptr, value);
            &*ptr
        }
    }

    /// Allocate a cloned slice and return a borrowed view.
    #[inline(always)]
    pub fn alloc_slice_clone<T: Clone>(&self, values: &[T]) -> &[T] {
        if values.is_empty() {
            return &[];
        }
        let size = std::mem::size_of::<T>() * values.len();
        let align = std::mem::align_of::<T>();
        let ptr = self.alloc_raw(size, align) as *mut T;
        for (i, v) in values.iter().enumerate() {
            unsafe { std::ptr::write(ptr.add(i), v.clone()) };
        }
        unsafe { std::slice::from_raw_parts(ptr, values.len()) }
    }

    /// Allocate a copied slice (memcpy fast path for `Copy` types).
    #[inline(always)]
    pub fn alloc_slice_copy<T: Copy>(&self, values: &[T]) -> &[T] {
        if values.is_empty() {
            return &[];
        }
        let size = std::mem::size_of::<T>() * values.len();
        let align = std::mem::align_of::<T>();
        let ptr = self.alloc_raw(size, align) as *mut T;
        unsafe {
            std::ptr::copy_nonoverlapping(values.as_ptr(), ptr, values.len());
            std::slice::from_raw_parts(ptr, values.len())
        }
    }

    /// Allocate aligned raw bytes within the current chunk.
    #[inline(always)]
    fn alloc_raw(&self, size: usize, align: usize) -> *mut u8 {
        let current = unsafe { &mut *self.current.get() };
        let pos = current.len();
        let aligned = (pos + align - 1) & !(align - 1);
        let end = aligned + size;

        if end <= current.capacity() {
            // SAFETY: extending len to cover the allocation. The caller
            // will write into [aligned..end] before reading.
            unsafe { current.set_len(end) };
            unsafe { current.as_mut_ptr().add(aligned) }
        } else {
            self.grow_and_alloc(size, align)
        }
    }

    /// Grow the slab by moving the current chunk to `rest` and allocating in a
    /// fresh chunk. Cold path — called only when the current chunk is full.
    #[cold]
    #[inline(never)]
    fn grow_and_alloc(&self, size: usize, align: usize) -> *mut u8 {
        let current = unsafe { &mut *self.current.get() };
        let rest = unsafe { &mut *self.rest.get() };

        // New chunk must fit the allocation (size + worst-case alignment padding).
        let min_cap = size + align;
        let new_cap = (current.capacity() * 2).max(min_cap).max(256);
        let old = std::mem::replace(current, Vec::with_capacity(new_cap));
        rest.push(old);

        // Allocate in the fresh chunk (pos = 0, alignment from start).
        let aligned = (0 + align - 1) & !(align - 1);
        let end = aligned + size;
        unsafe { current.set_len(end) };
        unsafe { current.as_mut_ptr().add(aligned) }
    }
}

impl Default for BumpSlab {
    fn default() -> Self {
        Self::new()
    }
}
