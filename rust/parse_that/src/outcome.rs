use crate::Cursor;

/// Recoverable recognition evidence.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Failure<'i> {
    at: Cursor<'i>,
}

impl<'i> Failure<'i> {
    #[inline]
    pub(crate) const fn new(at: Cursor<'i>) -> Self {
        Self { at }
    }

    #[inline]
    pub const fn at(self) -> Cursor<'i> {
        self.at
    }

    #[inline]
    pub(crate) fn furthest(self, other: Self) -> Self {
        if other.at.offset() > self.at.offset() {
            other
        } else {
            self
        }
    }

    #[inline]
    pub(crate) fn belongs_to(self, input: crate::Input<'_>) -> bool {
        self.at.belongs_to(input)
    }
}

/// A non-recoverable control-law violation.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Fault<'i> {
    StalledRepeat { at: Cursor<'i> },
    ForeignOutcome { at: Cursor<'i> },
    FullParseAfterProgress { at: Cursor<'i> },
}

impl<'i> Fault<'i> {
    #[inline]
    pub const fn at(self) -> Cursor<'i> {
        match self {
            Self::StalledRepeat { at }
            | Self::ForeignOutcome { at }
            | Self::FullParseAfterProgress { at } => at,
        }
    }

    #[inline]
    pub(crate) fn belongs_to(self, input: crate::Input<'_>) -> bool {
        self.at().belongs_to(input)
    }
}

/// The typed result of one recognition step.
#[must_use = "recognition outcomes must be handled"]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Step<'i, T> {
    Matched(T),
    Mismatch(Failure<'i>),
    Fault(Fault<'i>),
}

impl<T> Step<'_, T> {
    #[inline]
    pub fn into_matched(self) -> Option<T> {
        match self {
            Self::Matched(value) => Some(value),
            Self::Mismatch(_) | Self::Fault(_) => None,
        }
    }
}
