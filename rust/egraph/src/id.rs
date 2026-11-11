//! `Id` — opaque, internable node/class identifier.

use std::fmt;

/// An opaque index identifying either an e-class or a slot in the
/// interning table, depending on context. Kept 32-bit so arrays of `Id`
/// remain cache-friendly for typical grammar/regex sizes.
#[derive(Copy, Clone, Eq, PartialEq, Hash, Ord, PartialOrd)]
pub struct Id(pub u32);

impl Id {
    /// A sentinel `Id` used as a "null" / "not yet assigned" marker.
    pub const INVALID: Self = Self(u32::MAX);

    /// Raw u32 value.
    #[inline]
    pub fn index(self) -> u32 {
        self.0
    }

    /// `Id` from a `usize` (saturating — callers must stay under `u32::MAX`).
    #[inline]
    pub fn from_usize(n: usize) -> Self {
        debug_assert!(n <= u32::MAX as usize);
        Self(n as u32)
    }

    /// Convert to `usize` for indexing `Vec<T>` / `Box<[T]>`.
    #[inline]
    pub fn as_usize(self) -> usize {
        self.0 as usize
    }
}

impl From<u32> for Id {
    #[inline]
    fn from(n: u32) -> Self {
        Self(n)
    }
}

impl From<Id> for u32 {
    #[inline]
    fn from(id: Id) -> Self {
        id.0
    }
}

impl fmt::Debug for Id {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "e{}", self.0)
    }
}

impl fmt::Display for Id {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "e{}", self.0)
    }
}
