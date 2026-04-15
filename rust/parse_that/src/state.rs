use std::collections::HashMap;

use pprint::Pretty;
#[cfg(feature = "diagnostics")]
use smallvec::SmallVec;

// ── State-based memoization ───────────────────────────────────

/// Type-erased memoization store for state-based caching.
///
/// Used by generated monolithic slab parsers where the memo cache lives in
/// `ParserState` (dropped with each parse) rather than in the parser closure.
/// This avoids storing `Output` values in the closure — no `Output: 'a`
/// requirement, no `RefCell<HashMap>` per parser object.
pub struct MemoStore {
    slots: Vec<MemoSlotInner>,
}

struct MemoSlotInner {
    ptr: *mut (),
    drop_fn: unsafe fn(*mut ()),
}

unsafe fn drop_memo_table<T>(ptr: *mut ()) {
    unsafe {
        let _ = Box::from_raw(ptr as *mut HashMap<usize, Option<(usize, T)>>);
    }
}

unsafe fn noop_drop(_ptr: *mut ()) {}

impl MemoStore {
    #[inline]
    pub fn new() -> Self {
        Self {
            slots: Vec::new(),
        }
    }

    /// Get or create a memo table for the given slot ID.
    ///
    /// Each ID corresponds to one memoized rule. Tables are created lazily
    /// on first access and destroyed when the `MemoStore` is dropped
    /// (end of each parse).
    #[inline]
    pub fn table_mut<T: Clone>(
        &mut self,
        id: usize,
    ) -> &mut HashMap<usize, Option<(usize, T)>> {
        // Grow slots vec if needed.
        while self.slots.len() <= id {
            self.slots.push(MemoSlotInner {
                ptr: std::ptr::null_mut(),
                drop_fn: noop_drop,
            });
        }
        if self.slots[id].ptr.is_null() {
            let table = Box::new(HashMap::<usize, Option<(usize, T)>>::new());
            let ptr = Box::into_raw(table) as *mut ();
            self.slots[id] = MemoSlotInner {
                ptr,
                drop_fn: drop_memo_table::<T>,
            };
        }
        unsafe { &mut *(self.slots[id].ptr as *mut HashMap<usize, Option<(usize, T)>>) }
    }
}

impl Drop for MemoStore {
    fn drop(&mut self) {
        for slot in &self.slots {
            if !slot.ptr.is_null() {
                unsafe {
                    (slot.drop_fn)(slot.ptr);
                }
            }
        }
    }
}

impl std::fmt::Debug for MemoStore {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "MemoStore({})", self.slots.len())
    }
}

impl Default for MemoStore {
    fn default() -> Self {
        Self::new()
    }
}

// ── Diagnostic types (feature-gated) ──────────────────────────

#[cfg(feature = "diagnostics")]
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum SuggestionKind {
    UnclosedDelimiter {
        delimiter: String,
        open_offset: usize,
    },
    TrailingContent {
        context: String,
    },
}

#[cfg(feature = "diagnostics")]
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Suggestion {
    pub kind: SuggestionKind,
    pub message: String,
}

#[cfg(feature = "diagnostics")]
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct SecondarySpan {
    pub offset: usize,
    pub label: String,
}

/// Snapshot of diagnostic state collected during error recovery.
#[cfg(feature = "diagnostics")]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub offset: usize,
    pub furthest_offset: usize,
    pub line: usize,
    pub column: usize,
    pub expected: Vec<String>,
    pub suggestions: Vec<Suggestion>,
    pub secondary_spans: Vec<SecondarySpan>,
    pub found: String,
}

/// Trailing zero padding appended to the source buffer at
/// `ParserState::new`. Lets every SIMD kernel load a full SIMD vector
/// across the last byte of the public input without per-chunk tail
/// bounds checks. 64 bytes covers a full 64-byte stripe (four 16-byte
/// NEON / SSE loads, one 64-byte AVX-512 load, one cache line).
///
/// Callers that opt into the padded view do so via
/// [`ParserState::padded_bytes`]. The public `src_bytes` / `src`
/// accessors still report the original length; padding is never leaked
/// to consumers that compute byte offsets against the input length.
pub const INPUT_PAD_BYTES: usize = 64;

/// Cache-line-sized, 64-byte-aligned chunk used as the backing
/// allocation for [`ParserState::padded_buf`]. The `repr(C, align(64))`
/// forces `Vec<PaddedChunk>` to allocate 64-byte-aligned memory,
/// satisfying NEON u8x16, SSE u8x16, and AVX-512 `zmm` load alignment
/// at the start of the buffer.
#[repr(C, align(64))]
#[derive(Clone, Copy, Debug)]
struct PaddedChunk([u8; 64]);

/// Allocate a 64-byte-aligned buffer containing `input` followed by
/// [`INPUT_PAD_BYTES`] of trailing zeros. Returns the backing
/// `Vec<PaddedChunk>`; callers expose a slice view via
/// [`ParserState::padded_bytes`]. The buffer is sized to the next
/// whole chunk so the final SIMD load can read a full stripe at
/// `offset = end` without straying past the allocation.
///
/// The implementation avoids double-touching memory: the input region
/// is populated via a single `copy_nonoverlapping`, and only the
/// trailing `(n_chunks * 64) - input.len()` bytes (which always
/// include the [`INPUT_PAD_BYTES`] contract) are explicitly zeroed.
/// For a 2 MB input this costs one `memcpy(2 MB)` plus
/// `write_bytes(<= 64 + 63 B, 0)` instead of a 2 MB `memset(0)`
/// followed by a 2 MB `memcpy`.
fn allocate_padded_buf(input: &[u8]) -> Vec<PaddedChunk> {
    let padded_len = input.len() + INPUT_PAD_BYTES;
    let n_chunks = padded_len.div_ceil(64);
    let total_bytes = n_chunks * 64;
    let mut buf: Vec<PaddedChunk> = Vec::with_capacity(n_chunks);
    // SAFETY: `with_capacity` allocated contiguous storage for
    // `n_chunks * 64` bytes starting at a 64-byte-aligned address.
    // We fill the first `input.len()` bytes via `copy_nonoverlapping`
    // and zero the remainder (at least `INPUT_PAD_BYTES`, up to
    // `INPUT_PAD_BYTES + 63` when `padded_len` is not chunk-aligned),
    // so every byte reachable through `padded_bytes()` is initialised.
    // The `set_len` call is sound: the `PaddedChunk` layout has no
    // padding bytes of its own and every element is now initialised
    // from some byte-valid value (input bytes are always valid for
    // `PaddedChunk`, which is `[u8; 64]`).
    unsafe {
        let dst = buf.as_mut_ptr() as *mut u8;
        if !input.is_empty() {
            std::ptr::copy_nonoverlapping(input.as_ptr(), dst, input.len());
        }
        std::ptr::write_bytes(dst.add(input.len()), 0, total_bytes - input.len());
        buf.set_len(n_chunks);
    }
    buf
}

/// Zero-cost padded-view witness.
///
/// Carries an immutable slice whose first `len` bytes are the public
/// input and whose next [`INPUT_PAD_BYTES`] bytes are guaranteed to be
/// zero. SIMD scanners that accept `PaddedView` may load any fixed-width
/// stripe at offset `i` where `i + STRIDE <= len + INPUT_PAD_BYTES` for
/// `STRIDE <= INPUT_PAD_BYTES` without a per-chunk bounds guard.
///
/// The caller constructs this via [`ParserState::padded`]; the returned
/// view's `bytes` is the full `padded_bytes()` slice (length
/// `len + INPUT_PAD_BYTES`) and `len` is the public input length.
/// Positions `>= len` read NUL bytes and MUST be clamped to `len` in
/// any returned offset.
#[derive(Clone, Copy, Debug)]
pub struct PaddedView<'a> {
    /// Backing buffer: the first `len` bytes mirror the public input;
    /// the next [`INPUT_PAD_BYTES`] bytes are NUL.
    bytes: &'a [u8],
    /// Public input length. `bytes.len() == len + INPUT_PAD_BYTES`.
    len: usize,
}

impl<'a> PaddedView<'a> {
    /// Construct a view from `bytes` whose trailing
    /// [`INPUT_PAD_BYTES`] bytes are zero. `bytes.len()` must equal
    /// `len + INPUT_PAD_BYTES`.
    #[inline(always)]
    pub fn new(bytes: &'a [u8], len: usize) -> Self {
        debug_assert!(
            bytes.len() == len + INPUT_PAD_BYTES,
            "PaddedView::new: bytes.len() = {}, expected len + INPUT_PAD_BYTES = {}",
            bytes.len(),
            len + INPUT_PAD_BYTES,
        );
        debug_assert!(
            bytes[len..].iter().all(|&b| b == 0),
            "PaddedView::new: trailing INPUT_PAD_BYTES bytes must be NUL",
        );
        Self { bytes, len }
    }

    /// Backing buffer of length `len + INPUT_PAD_BYTES`. SIMD kernels
    /// load from this slice at any offset `i` where
    /// `i + STRIDE <= bytes().len()` without a per-chunk bounds check.
    #[inline(always)]
    pub fn bytes(&self) -> &'a [u8] {
        self.bytes
    }

    /// Public input length. Kernels that scan forward through input
    /// positions terminate when `i >= len()`.
    #[inline(always)]
    pub fn len(&self) -> usize {
        self.len
    }

    /// `true` when the public input is empty. Kernels short-circuit
    /// ahead of any SIMD load in this case.
    #[inline(always)]
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }
}

#[derive(Pretty, Debug, Default, PartialEq, Clone, Copy, Hash, Eq)]
pub struct Span<'a> {
    pub start: usize,
    pub end: usize,

    #[pprint(skip)]
    pub src: &'a str,
}

impl<'a> Span<'a> {
    pub fn new(start: usize, end: usize, src: &'a str) -> Self {
        Span { start, end, src }
    }

    pub fn as_str(&self) -> &'a str {
        debug_assert!(
            self.start <= self.end
                && self.end <= self.src.len()
                && self.src.is_char_boundary(self.start)
                && self.src.is_char_boundary(self.end),
            "Span::as_str: invalid bounds {}..{} for src len {}",
            self.start,
            self.end,
            self.src.len()
        );
        unsafe { self.src.get_unchecked(self.start..self.end) }
    }
}

#[derive(Pretty, Debug)]
pub struct ParserState<'a> {
    #[pprint(skip)]
    pub src: &'a str,
    #[pprint(skip)]
    pub src_bytes: &'a [u8],

    pub end: usize,

    pub offset: usize,
    pub furthest_offset: usize,
    #[pprint(skip)]
    pub context_ptr: *const (),

    /// Owned, 64-byte-aligned padded copy of the input. The first
    /// `end` bytes mirror `src_bytes`; the next [`INPUT_PAD_BYTES`]
    /// bytes are zero. `padded_buf.len() == end + INPUT_PAD_BYTES`,
    /// allocated at [`ParserState::new`] so SIMD kernels can load a
    /// full stripe over the tail without the per-chunk
    /// `i + STRIDE <= len` guard.
    ///
    /// Empty `Vec` when the state is built via [`Default::default`]
    /// (e.g. during tests or direct struct literals); consumers must
    /// check `end` or `src_bytes.len()` before indexing.
    #[pprint(skip)]
    padded_buf: Vec<PaddedChunk>,

    /// Whitespace bitmap cache — 64-byte window.
    /// Bit `i` is set if byte at `ws_bitmap_start + i` is whitespace.
    /// Avoids re-scanning the same region on consecutive `?w` calls.
    ///
    /// AQ.8.1 documentation: this bitmap is the unified ws / non-ws
    /// fast path. The skip-leading-WS routine consults
    /// `(ws_bitmap >> bit_offset).trailing_ones()` to advance past
    /// the run of whitespace; the non-WS scan path consumes the
    /// inverse — `(!ws_bitmap >> bit_offset).trailing_ones()` —
    /// when callers want to find the next non-WS byte directly. No
    /// separate `nospace_bits` cache is needed because both probes
    /// share the same 64-bit window.
    #[pprint(skip)]
    pub ws_bitmap: u64,
    #[pprint(skip)]
    pub ws_bitmap_start: usize,

    /// State-based memoization for monolithic slab parsers.
    /// Dropped with each parse — no cross-iteration cache retention.
    #[pprint(skip)]
    pub memo: MemoStore,

    #[cfg(feature = "diagnostics")]
    #[pprint(skip)]
    pub expected: SmallVec<[&'static str; 8]>,
    #[cfg(feature = "diagnostics")]
    #[pprint(skip)]
    pub suggestions: SmallVec<[Suggestion; 4]>,
    #[cfg(feature = "diagnostics")]
    #[pprint(skip)]
    pub secondary_spans: SmallVec<[SecondarySpan; 4]>,
}

impl Default for ParserState<'_> {
    fn default() -> Self {
        Self {
            src: "",
            src_bytes: &[],
            end: 0,
            offset: 0,
            furthest_offset: 0,
            context_ptr: std::ptr::null(),
            ws_bitmap: 0,
            ws_bitmap_start: usize::MAX,
            memo: MemoStore::new(),
            padded_buf: Vec::new(),
            #[cfg(feature = "diagnostics")]
            expected: SmallVec::new(),
            #[cfg(feature = "diagnostics")]
            suggestions: SmallVec::new(),
            #[cfg(feature = "diagnostics")]
            secondary_spans: SmallVec::new(),
        }
    }
}

impl<'a> ParserState<'a> {
    /// Build a `ParserState` over `src`. Allocates a 64-byte-aligned
    /// padded copy of the input bytes with [`INPUT_PAD_BYTES`] trailing
    /// zero bytes, reachable via [`Self::padded_bytes`]. The public
    /// `src` / `src_bytes` views are unchanged from prior tranches —
    /// consumers that compute byte offsets against the input length
    /// still see `src.len()`.
    pub fn new(src: &'a str) -> ParserState<'a> {
        let end = src.len();
        let padded_buf = allocate_padded_buf(src.as_bytes());
        ParserState {
            src,
            src_bytes: src.as_bytes(),
            end,
            offset: 0,
            furthest_offset: 0,
            context_ptr: std::ptr::null(),
            ws_bitmap: 0,
            ws_bitmap_start: usize::MAX,
            memo: MemoStore::new(),
            padded_buf,
            #[cfg(feature = "diagnostics")]
            expected: SmallVec::new(),
            #[cfg(feature = "diagnostics")]
            suggestions: SmallVec::new(),
            #[cfg(feature = "diagnostics")]
            secondary_spans: SmallVec::new(),
        }
    }

    pub fn with_context<C>(src: &'a str, context: &'a C) -> ParserState<'a> {
        let mut state = Self::new(src);
        state.context_ptr = context as *const C as *const ();
        state
    }

    /// Return the padded view of the input: the first `end` bytes
    /// mirror `src_bytes`; the next [`INPUT_PAD_BYTES`] bytes are
    /// guaranteed to be zero. The returned slice is 64-byte-aligned
    /// at byte 0 and is safe to load at any offset `i` where
    /// `i + STRIDE <= src_bytes.len() + INPUT_PAD_BYTES` for every
    /// SIMD stride in use (`STRIDE <= INPUT_PAD_BYTES`).
    ///
    /// Kernels that iterate over input bytes with a fixed-width SIMD
    /// load (`u8x16`, `u8x32`, `u8x64`) may substitute this for
    /// `src_bytes` to eliminate the per-chunk `i + STRIDE <= len`
    /// tail bounds check. The returned length is
    /// `src_bytes.len() + INPUT_PAD_BYTES`. Positions beyond
    /// `src_bytes.len()` read zeros and must NOT be reported as
    /// match positions — callers that compute byte offsets against
    /// the public input length should clamp results to `end`.
    ///
    /// Invariants:
    /// * `padded_bytes()[0..end] == src_bytes`
    /// * `padded_bytes()[end..end + INPUT_PAD_BYTES] == [0; 64]`
    /// * `padded_bytes().as_ptr() as usize % 64 == 0`
    #[inline(always)]
    pub fn padded_bytes(&self) -> &[u8] {
        debug_assert!(
            self.padded_buf.len() * 64 >= self.end + INPUT_PAD_BYTES,
            "padded_buf under-sized: have {}, need {}",
            self.padded_buf.len() * 64,
            self.end + INPUT_PAD_BYTES,
        );
        let ptr = self.padded_buf.as_ptr() as *const u8;
        let len = self.end + INPUT_PAD_BYTES;
        unsafe { std::slice::from_raw_parts(ptr, len) }
    }

    /// Borrow the padded view as a [`PaddedView`] witness. The returned
    /// value carries the padded-backing-buffer invariant at the type
    /// level: SIMD kernels that accept `PaddedView` may load a full
    /// fixed-width stripe at any offset `i` where
    /// `i + STRIDE <= view.bytes().len()` without a per-chunk bounds
    /// guard.
    #[inline(always)]
    pub fn padded(&self) -> PaddedView<'_> {
        PaddedView {
            bytes: self.padded_bytes(),
            len: self.end,
        }
    }

    pub fn is_at_end(&self) -> bool {
        self.offset >= self.end
    }

    pub fn get_column_number(&self) -> usize {
        let offset = self.offset;
        match self.src[..offset].rfind('\n') {
            Some(nl) => offset - nl - 1,
            None => offset,
        }
    }

    pub fn get_line_number(&self) -> usize {
        self.src.as_bytes()[..self.offset]
            .iter()
            .filter(|&&c| c == b'\n')
            .count()
            + 1
    }

    /// Record an expected label at the current offset. No-op without `diagnostics` feature.
    #[inline(always)]
    pub fn add_expected(&mut self, _label: &'static str) {
        #[cfg(feature = "diagnostics")]
        {
            use std::cmp::Ordering;
            match self.offset.cmp(&self.furthest_offset) {
                Ordering::Greater => {
                    // New furthest — clear and start fresh
                    self.expected.clear();
                    self.expected.push(_label);
                    self.suggestions.clear();
                    self.secondary_spans.clear();
                }
                Ordering::Equal => {
                    if !self.expected.contains(&_label) {
                        self.expected.push(_label);
                    }
                }
                Ordering::Less => {
                    // Stale label — ignore
                }
            }
        }
    }

    /// Record a structured suggestion. No-op without `diagnostics` feature.
    #[cfg(feature = "diagnostics")]
    #[inline(always)]
    pub fn add_suggestion(&mut self, suggestion: impl FnOnce() -> Suggestion) {
        self.suggestions.push(suggestion());
    }

    /// Record a structured suggestion. No-op without `diagnostics` feature.
    #[cfg(not(feature = "diagnostics"))]
    #[inline(always)]
    pub fn add_suggestion<F>(&mut self, _suggestion: F) {}

    /// Record a secondary span annotation. No-op without `diagnostics` feature.
    #[cfg(feature = "diagnostics")]
    #[inline(always)]
    pub fn add_secondary_span(&mut self, offset: usize, label: impl Into<String>) {
        self.secondary_spans.push(SecondarySpan {
            offset,
            label: label.into(),
        });
    }

    /// Record a secondary span annotation. No-op without `diagnostics` feature.
    #[cfg(not(feature = "diagnostics"))]
    #[inline(always)]
    pub fn add_secondary_span<S>(&mut self, _offset: usize, _label: S) {}

    /// Snapshot the current diagnostic state into a `Diagnostic`, then clear
    /// the expected/suggestions/secondary_spans so the next error starts fresh.
    #[cfg(feature = "diagnostics")]
    pub fn snapshot_diagnostic(&mut self, error_offset: usize) -> Diagnostic {
        let furthest = self.furthest_offset.max(error_offset);
        let src_before = &self.src[..furthest];
        let last_nl = src_before.rfind('\n');
        let line = match last_nl {
            Some(pos) => src_before[..=pos].chars().filter(|&c| c == '\n').count() + 1,
            None => 1,
        };
        let column = match last_nl {
            Some(pos) => furthest - pos - 1,
            None => furthest,
        };
        let found_end = (furthest + 20).min(self.src.len());
        let found = self.src[furthest..found_end].replace('\n', "\\n");

        let diag = Diagnostic {
            offset: error_offset,
            furthest_offset: furthest,
            line,
            column,
            expected: self.expected.iter().map(|s| s.to_string()).collect(),
            suggestions: std::mem::take(&mut self.suggestions).into_vec(),
            secondary_spans: std::mem::take(&mut self.secondary_spans).into_vec(),
            found,
        };
        self.expected.clear();
        diag
    }
}

// ── Collected Diagnostics (thread-local) ──────────────────────

#[cfg(feature = "diagnostics")]
std::thread_local! {
    static COLLECTED_DIAGNOSTICS: std::cell::RefCell<Vec<Diagnostic>> =
        const { std::cell::RefCell::new(Vec::new()) };
}

#[cfg(feature = "diagnostics")]
pub fn push_diagnostic(d: Diagnostic) {
    COLLECTED_DIAGNOSTICS.with(|diags| diags.borrow_mut().push(d));
}

#[cfg(feature = "diagnostics")]
pub fn pop_last_diagnostic() -> Option<Diagnostic> {
    COLLECTED_DIAGNOSTICS.with(|diags| diags.borrow_mut().pop())
}

#[cfg(feature = "diagnostics")]
pub fn get_collected_diagnostics() -> Vec<Diagnostic> {
    COLLECTED_DIAGNOSTICS.with(|diags| diags.borrow().clone())
}

#[cfg(feature = "diagnostics")]
pub fn clear_collected_diagnostics() {
    COLLECTED_DIAGNOSTICS.with(|diags| diags.borrow_mut().clear());
}
