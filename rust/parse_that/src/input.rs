use core::fmt;
use core::num::NonZeroUsize;
use core::sync::atomic::{AtomicUsize, Ordering};

static NEXT_EMPTY_SOURCE_ID: AtomicUsize = AtomicUsize::new(1);

#[derive(Clone, Copy, Eq, PartialEq)]
struct EmptySourceId(NonZeroUsize);

impl EmptySourceId {
    fn fresh() -> Self {
        let id = NEXT_EMPTY_SOURCE_ID
            .try_update(Ordering::Relaxed, Ordering::Relaxed, |current| {
                current.checked_add(1)
            })
            .unwrap_or_else(|_| panic!("parse_that input source identity space exhausted"));
        Self(NonZeroUsize::new(id).expect("empty source identities start at one"))
    }
}

#[inline]
fn same_source(
    left: &[u8],
    left_empty_id: Option<EmptySourceId>,
    right: &[u8],
    right_empty_id: Option<EmptySourceId>,
) -> bool {
    match (left_empty_id, right_empty_id) {
        (Some(left), Some(right)) => left == right,
        (None, None) => {
            !left.is_empty() && left.as_ptr() == right.as_ptr() && left.len() == right.len()
        }
        _ => false,
    }
}

/// A borrowed, immutable recognition source.
///
/// Non-empty inputs use their live byte region as identity. Empty byte regions
/// have no distinguishable address, so only that cold path receives a fresh
/// process-local token.
#[derive(Clone, Copy)]
pub struct Input<'i> {
    bytes: &'i [u8],
    empty_source_id: Option<EmptySourceId>,
}

impl<'i> Input<'i> {
    #[inline]
    pub fn new(bytes: &'i [u8]) -> Self {
        Self {
            bytes,
            empty_source_id: bytes.is_empty().then(EmptySourceId::fresh),
        }
    }

    #[inline]
    pub const fn bytes(self) -> &'i [u8] {
        self.bytes
    }

    #[inline]
    pub const fn len(self) -> usize {
        self.bytes.len()
    }

    #[inline]
    pub const fn is_empty(self) -> bool {
        self.bytes.is_empty()
    }

    #[inline]
    pub fn start(self) -> Cursor<'i> {
        self.cursor_unchecked(0)
    }

    #[inline]
    pub fn end(self) -> Cursor<'i> {
        self.cursor_unchecked(self.len())
    }

    #[inline]
    pub fn cursor_at(self, offset: usize) -> Result<Cursor<'i>, InputError> {
        if offset <= self.len() {
            Ok(self.cursor_unchecked(offset))
        } else {
            Err(InputError::OutOfBounds {
                offset,
                len: self.len(),
            })
        }
    }

    pub fn span(self, start: Cursor<'i>, end: Cursor<'i>) -> Result<Span<'i>, InputError> {
        if !start.belongs_to(self) || !end.belongs_to(self) {
            return Err(InputError::ForeignCursor);
        }
        if start.offset > end.offset {
            return Err(InputError::ReversedSpan {
                start: start.offset,
                end: end.offset,
            });
        }
        Ok(Span {
            bytes: self.bytes,
            empty_source_id: self.empty_source_id,
            start: start.offset,
            end: end.offset,
        })
    }

    #[inline]
    pub(crate) fn cursor_unchecked(self, offset: usize) -> Cursor<'i> {
        Cursor {
            source: self.bytes,
            empty_source_id: self.empty_source_id,
            offset,
        }
    }

    #[inline]
    pub(crate) fn span_unchecked(self, start: usize, end: usize) -> Span<'i> {
        Span {
            bytes: self.bytes,
            empty_source_id: self.empty_source_id,
            start,
            end,
        }
    }
}

impl fmt::Debug for Input<'_> {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("Input")
            .field("len", &self.len())
            .finish_non_exhaustive()
    }
}

/// An absolute position bound to one borrowed byte source.
///
/// A cursor cannot outlive the source that created it:
///
/// ```compile_fail
/// use parse_that::{Cursor, Input};
///
/// fn dangling() -> Cursor<'static> {
///     let bytes = Vec::from(b"temporary");
///     Input::new(&bytes).start()
/// }
/// ```
#[derive(Clone, Copy)]
pub struct Cursor<'i> {
    source: &'i [u8],
    empty_source_id: Option<EmptySourceId>,
    offset: usize,
}

impl Cursor<'_> {
    #[inline]
    pub const fn offset(self) -> usize {
        self.offset
    }

    #[inline]
    pub(crate) fn belongs_to(self, input: Input<'_>) -> bool {
        same_source(
            self.source,
            self.empty_source_id,
            input.bytes,
            input.empty_source_id,
        ) && self.offset <= self.source.len()
    }
}

impl fmt::Debug for Cursor<'_> {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("Cursor")
            .field("source_len", &self.source.len())
            .field("offset", &self.offset)
            .finish()
    }
}

impl PartialEq for Cursor<'_> {
    fn eq(&self, other: &Self) -> bool {
        same_source(
            self.source,
            self.empty_source_id,
            other.source,
            other.empty_source_id,
        ) && self.offset == other.offset
    }
}

impl Eq for Cursor<'_> {}

/// A checked, zero-copy interval in an [`Input`].
#[derive(Clone, Copy)]
pub struct Span<'i> {
    bytes: &'i [u8],
    empty_source_id: Option<EmptySourceId>,
    start: usize,
    end: usize,
}

impl<'i> Span<'i> {
    #[inline]
    pub const fn start(self) -> usize {
        self.start
    }

    #[inline]
    pub const fn end(self) -> usize {
        self.end
    }

    #[inline]
    pub fn as_bytes(self) -> &'i [u8] {
        &self.bytes[self.start..self.end]
    }
}

impl fmt::Debug for Span<'_> {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("Span")
            .field("start", &self.start)
            .field("end", &self.end)
            .finish()
    }
}

impl PartialEq for Span<'_> {
    fn eq(&self, other: &Self) -> bool {
        same_source(
            self.bytes,
            self.empty_source_id,
            other.bytes,
            other.empty_source_id,
        ) && self.start == other.start
            && self.end == other.end
    }
}

impl Eq for Span<'_> {}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum InputError {
    OutOfBounds { offset: usize, len: usize },
    ForeignCursor,
    ReversedSpan { start: usize, end: usize },
}
