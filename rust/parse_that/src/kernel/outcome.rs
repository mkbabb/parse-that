use super::Cursor;

/// The generic runtime resource whose configured bound was exhausted.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[non_exhaustive]
pub enum ResourceKind {
    InputBytes,
    Nesting,
    Work,
    Events,
}

/// The number of distinct labels a module's label table may hold.
///
/// A label is an interned id into the module's label table, which the
/// generator writes sorted by the labels' bytes, so id order is label order.
/// A generator refuses a module whose table would exceed this bound.
pub const LABEL_CAPACITY: usize = 256;

const WORDS: usize = LABEL_CAPACITY / 64;

/// One interned id into the module's label table.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Hash)]
pub struct Label(pub(super) u16);

impl Label {
    /// The label with table id `id`, or `None` past [`LABEL_CAPACITY`].
    #[inline]
    pub const fn new(id: u16) -> Option<Self> {
        if (id as usize) < LABEL_CAPACITY {
            Some(Self(id))
        } else {
            None
        }
    }

    #[inline]
    pub const fn id(self) -> u16 {
        self.0
    }
}

/// The expected-label set at a failure's offset.
///
/// A bit set over the module's label table: it is sorted and deduplicated by
/// construction (iteration is in id order and a label is one bit), a merge
/// is a word-wise union, and it is `Copy` and allocation-free.
#[derive(Clone, Copy, Default, Eq, PartialEq, Hash)]
pub struct Expected {
    pub(super) words: [u64; WORDS],
}

impl Expected {
    pub const EMPTY: Self = Self { words: [0; WORDS] };

    /// The set holding `label` alone.
    #[inline]
    pub const fn of(label: Label) -> Self {
        let mut words = [0; WORDS];
        let id = label.0 as usize;
        words[id / 64] = 1 << (id % 64);
        Self { words }
    }

    /// Every label in either set.
    #[inline]
    pub const fn union(self, other: Self) -> Self {
        let mut words = self.words;
        let mut i = 0;
        while i < WORDS {
            words[i] |= other.words[i];
            i += 1;
        }
        Self { words }
    }

    #[inline]
    pub const fn contains(self, label: Label) -> bool {
        let id = label.0 as usize;
        self.words[id / 64] & (1 << (id % 64)) != 0
    }

    #[inline]
    pub const fn is_empty(self) -> bool {
        let mut i = 0;
        while i < WORDS {
            if self.words[i] != 0 {
                return false;
            }
            i += 1;
        }
        true
    }

    #[inline]
    pub const fn len(self) -> usize {
        let mut n = 0;
        let mut i = 0;
        while i < WORDS {
            n += self.words[i].count_ones() as usize;
            i += 1;
        }
        n
    }

    /// The labels in ascending id order, each once.
    #[inline]
    pub const fn iter(self) -> ExpectedIter {
        ExpectedIter {
            words: self.words,
            word: 0,
        }
    }
}

impl core::fmt::Debug for Expected {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.debug_set().entries(self.iter().map(Label::id)).finish()
    }
}

impl IntoIterator for Expected {
    type Item = Label;
    type IntoIter = ExpectedIter;

    #[inline]
    fn into_iter(self) -> ExpectedIter {
        self.iter()
    }
}

/// Ascending iteration over an [`Expected`] set.
#[derive(Clone, Debug)]
pub struct ExpectedIter {
    words: [u64; WORDS],
    word: usize,
}

impl Iterator for ExpectedIter {
    type Item = Label;

    #[inline]
    fn next(&mut self) -> Option<Label> {
        while self.word < WORDS {
            let bits = self.words[self.word];
            if bits != 0 {
                let bit = bits.trailing_zeros() as usize;
                self.words[self.word] = bits & (bits - 1);
                return Some(Label((self.word * 64 + bit) as u16));
            }
            self.word += 1;
        }
        None
    }
}

/// Recoverable recognition evidence: the furthest cursor a failed attempt
/// reached and the expected-label set at that cursor.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Failure<'i> {
    pub(super) at: Cursor<'i>,
    pub(super) expected: Expected,
}

impl<'i> Failure<'i> {
    #[inline]
    pub(crate) const fn new(at: Cursor<'i>) -> Self {
        Self {
            at,
            expected: Expected::EMPTY,
        }
    }

    #[inline]
    pub const fn at(self) -> Cursor<'i> {
        self.at
    }

    /// The labels expected at [`Failure::at`], sorted and deduplicated.
    #[inline]
    pub const fn expected(self) -> Expected {
        self.expected
    }

    /// This failure with `label` as its whole expected set.
    #[inline]
    pub(crate) const fn labelled(self, label: Label) -> Self {
        Self {
            at: self.at,
            expected: Expected::of(label),
        }
    }

    /// The further of two failures; at an equal offset, one failure whose
    /// set is the union of both. A failure at a smaller offset never
    /// replaces or widens the further one.
    #[inline]
    pub(crate) fn furthest(self, other: Self) -> Self {
        match other.at.offset().cmp(&self.at.offset()) {
            core::cmp::Ordering::Greater => other,
            core::cmp::Ordering::Less => self,
            core::cmp::Ordering::Equal => Self {
                at: self.at,
                expected: self.expected.union(other.expected),
            },
        }
    }

    #[inline]
    pub(crate) fn belongs_to(self, input: super::Input<'_>) -> bool {
        self.at.belongs_to(input)
    }
}

/// A non-recoverable control-law violation.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[non_exhaustive]
pub enum Fault<'i> {
    StalledRepeat {
        at: Cursor<'i>,
    },
    ForeignOutcome {
        at: Cursor<'i>,
    },
    FullParseAfterProgress {
        at: Cursor<'i>,
    },
    ResourceLimit {
        at: Cursor<'i>,
        kind: ResourceKind,
        limit: usize,
    },
}

impl<'i> Fault<'i> {
    #[inline]
    pub const fn at(self) -> Cursor<'i> {
        match self {
            Self::StalledRepeat { at }
            | Self::ForeignOutcome { at }
            | Self::FullParseAfterProgress { at }
            | Self::ResourceLimit { at, .. } => at,
        }
    }

    #[inline]
    pub(crate) fn belongs_to(self, input: super::Input<'_>) -> bool {
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
