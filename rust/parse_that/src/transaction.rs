use core::convert::Infallible;
use core::marker::PhantomData;

/// The append-only semantic side of a recognition transaction.
///
/// `push` must append one logical record without mutating earlier records.
/// `truncate(mark)` must exactly restore the logical state observed when
/// `len()` returned `mark`.
#[allow(clippy::len_without_is_empty)]
pub trait EventSink {
    type Event;

    fn len(&self) -> usize;
    fn truncate(&mut self, len: usize);
    fn push(&mut self, event: Self::Event);

    #[inline]
    fn push_with<F>(&mut self, event: F)
    where
        F: FnOnce() -> Self::Event,
    {
        self.push(event());
    }
}

/// A zero-sized sink for recognition-only calls.
#[derive(Clone, Copy, Debug, Default)]
pub struct NoSink<E = Infallible> {
    event: PhantomData<fn(E)>,
}

impl<E> NoSink<E> {
    #[inline]
    pub const fn new() -> Self {
        Self { event: PhantomData }
    }
}

impl<E> EventSink for NoSink<E> {
    type Event = E;

    #[inline]
    fn len(&self) -> usize {
        0
    }

    #[inline]
    fn truncate(&mut self, len: usize) {
        debug_assert_eq!(len, 0);
    }

    #[inline]
    fn push(&mut self, _event: Self::Event) {}

    #[inline]
    fn push_with<F>(&mut self, _event: F)
    where
        F: FnOnce() -> Self::Event,
    {
    }
}

#[derive(Clone, Copy)]
pub(crate) struct Checkpoint {
    pub(crate) cursor: usize,
    pub(crate) sink_len: usize,
}
