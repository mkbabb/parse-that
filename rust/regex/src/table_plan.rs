//! Checked compile-time regex table plans.
//!
//! `bbnf-regex` owns parsing and automata construction. Generated parsers own
//! execution. This module is the narrow boundary between those planes: it
//! exposes immutable table data that a compiler can serialize or render into
//! `parse_that::RegexPlan` constants, but it contains no matching API.

use std::fmt;

use crate::automata::dfa::{Dfa, DfaOptions};
use crate::automata::nfa::{DEAD, Nfa, NfaBuildError};
use crate::hir::{Hir, Look, ParseError, ParseOptions};

const MAGIC: [u8; 8] = *b"BBRTBL01";
const HEADER_LEN: usize = 20;

/// Sentinel used for a missing transition.
pub const DEAD_STATE: u32 = u32::MAX;

/// Compilation controls for a table plan.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TablePlanOptions {
    /// Maximum recursive syntax/HIR nesting accepted before lowering.
    pub nesting_limit: usize,
    /// Maximum number of NFA states accepted during Thompson construction.
    pub nfa_state_limit: usize,
    /// Maximum number of DFA states accepted during subset construction.
    pub state_limit: usize,
    /// Whether to minimize the DFA after subset construction.
    pub minimize: bool,
}

impl Default for TablePlanOptions {
    fn default() -> Self {
        Self {
            nesting_limit: 256,
            nfa_state_limit: 65_536,
            state_limit: 4096,
            minimize: true,
        }
    }
}

/// Why a regex could not be lowered into an executable table.
#[derive(Clone, Debug)]
#[non_exhaustive]
pub enum TablePlanCompileError {
    /// The regex text was not valid for the selected syntax mode.
    Parse(ParseError),
    /// Raw non-ASCII pattern text is ambiguous at a byte-oriented table
    /// boundary. Callers must spell intended bytes or codepoints explicitly
    /// with escapes.
    NonAsciiPattern { offset: usize },
    /// Position assertions require parser-context semantics and therefore
    /// cannot be silently erased into a byte-only DFA.
    UnsupportedLook(Look),
    /// The HIR could not be represented by the current NFA compiler.
    UnsupportedHir,
    /// A caller-supplied HIR violated a structural invariant.
    InvalidHir(HirValidationError),
    /// Thompson construction exceeded the configured NFA state limit.
    NfaStateLimitExceeded { limit: usize },
    /// Determinization exceeded the configured state limit.
    StateLimitExceeded { limit: usize },
    /// Internal automata output violated the public table invariant.
    InvalidPlan(TablePlanError),
}

impl fmt::Display for TablePlanCompileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Parse(error) => error.fmt(f),
            Self::NonAsciiPattern { offset } => write!(
                f,
                "raw non-ASCII regex syntax at byte {offset}; use an explicit escape"
            ),
            Self::UnsupportedLook(look) => {
                write!(f, "position assertion {look:?} has no byte-table semantics")
            }
            Self::UnsupportedHir => write!(f, "regex HIR cannot be lowered to a DFA"),
            Self::InvalidHir(error) => error.fmt(f),
            Self::NfaStateLimitExceeded { limit } => {
                write!(f, "regex NFA exceeded the {limit}-state compilation limit")
            }
            Self::StateLimitExceeded { limit } => {
                write!(f, "regex DFA exceeded the {limit}-state compilation limit")
            }
            Self::InvalidPlan(error) => write!(f, "compiler produced an invalid table: {error}"),
        }
    }
}

impl std::error::Error for TablePlanCompileError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Parse(error) => Some(error),
            Self::InvalidHir(error) => Some(error),
            Self::InvalidPlan(error) => Some(error),
            _ => None,
        }
    }
}

/// Structural error in a caller-supplied public HIR.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[non_exhaustive]
pub enum HirValidationError {
    NestingLimitExceeded {
        limit: usize,
    },
    ReversedByteRange {
        start: u8,
        end: u8,
    },
    UnsortedOrOverlappingByteRanges {
        previous_end: u8,
        next_start: u8,
    },
    ReversedCodepointRange {
        start: char,
        end: char,
    },
    UnsortedOrOverlappingCodepointRanges {
        previous_end: char,
        next_start: char,
    },
    RepetitionBounds {
        minimum: u32,
        maximum: u32,
    },
}

impl fmt::Display for HirValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NestingLimitExceeded { limit } => {
                write!(f, "regex HIR exceeded the {limit}-level nesting limit")
            }
            Self::ReversedByteRange { start, end } => write!(
                f,
                "regex HIR contains reversed byte range \\x{start:02x}-\\x{end:02x}"
            ),
            Self::UnsortedOrOverlappingByteRanges {
                previous_end,
                next_start,
            } => write!(
                f,
                "regex HIR byte ranges are unsorted or overlapping at \
                 \\x{previous_end:02x}/\\x{next_start:02x}"
            ),
            Self::ReversedCodepointRange { start, end } => write!(
                f,
                "regex HIR contains reversed codepoint range U+{:04X}-U+{:04X}",
                *start as u32, *end as u32
            ),
            Self::UnsortedOrOverlappingCodepointRanges {
                previous_end,
                next_start,
            } => write!(
                f,
                "regex HIR codepoint ranges are unsorted or overlapping at U+{:04X}/U+{:04X}",
                *previous_end as u32, *next_start as u32
            ),
            Self::RepetitionBounds { minimum, maximum } => write!(
                f,
                "regex HIR repetition minimum {minimum} exceeds maximum {maximum}"
            ),
        }
    }
}

impl std::error::Error for HirValidationError {}

/// A violated table or wire-format invariant.
#[derive(Clone, Debug, PartialEq, Eq)]
#[non_exhaustive]
pub enum TablePlanError {
    EmptyStates,
    EmptyClasses,
    TooManyClasses {
        class_count: u16,
    },
    StateCountMismatch {
        declared: u32,
        accepting: usize,
    },
    StartStateOutOfRange {
        start_state: u32,
        state_count: u32,
    },
    ByteClassOutOfRange {
        byte: u8,
        class: u8,
        class_count: u16,
    },
    TransitionTableLength {
        expected: usize,
        actual: usize,
    },
    TransitionTargetOutOfRange {
        index: usize,
        target: u32,
        state_count: u32,
    },
    SizeOverflow,
    BadMagic,
    InvalidReservedBits(u16),
    InvalidAcceptByte {
        state: u32,
        value: u8,
    },
    EncodedLength {
        expected: usize,
        actual: usize,
    },
}

impl fmt::Display for TablePlanError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyStates => write!(f, "a table plan must contain at least one state"),
            Self::EmptyClasses => write!(f, "a table plan must contain at least one byte class"),
            Self::TooManyClasses { class_count } => write!(
                f,
                "{class_count} byte classes cannot be addressed by an 8-bit class map"
            ),
            Self::StateCountMismatch {
                declared,
                accepting,
            } => write!(
                f,
                "declared {declared} states but received {accepting} accept flags"
            ),
            Self::StartStateOutOfRange {
                start_state,
                state_count,
            } => write!(
                f,
                "start state {start_state} is outside {state_count} states"
            ),
            Self::ByteClassOutOfRange {
                byte,
                class,
                class_count,
            } => write!(
                f,
                "byte 0x{byte:02x} maps to class {class}, outside {class_count} classes"
            ),
            Self::TransitionTableLength { expected, actual } => write!(
                f,
                "transition table has {actual} entries; expected {expected}"
            ),
            Self::TransitionTargetOutOfRange {
                index,
                target,
                state_count,
            } => write!(
                f,
                "transition {index} targets state {target}, outside {state_count} states"
            ),
            Self::SizeOverflow => write!(f, "table dimensions overflow the host address space"),
            Self::BadMagic => write!(f, "not a bbnf-regex table-plan encoding"),
            Self::InvalidReservedBits(bits) => {
                write!(
                    f,
                    "table-plan reserved header bits are nonzero: {bits:#06x}"
                )
            }
            Self::InvalidAcceptByte { state, value } => {
                write!(f, "state {state} has invalid accept byte {value}")
            }
            Self::EncodedLength { expected, actual } => write!(
                f,
                "encoded table has {actual} bytes; expected exactly {expected}"
            ),
        }
    }
}

impl std::error::Error for TablePlanError {}

/// Owned, validated DFA tables for compiler serialization and source emission.
///
/// Fields are private so every instance is born checked. There is deliberately
/// no matching method: execution belongs to the generated parser runtime.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RegexTablePlan {
    byte_classes: [u8; 256],
    transitions: Vec<u32>,
    accepting: Vec<bool>,
    state_count: u32,
    class_count: u16,
    start_state: u32,
}

impl RegexTablePlan {
    /// Parse and compile a byte-oriented regex with default limits.
    pub fn compile(pattern: &str) -> Result<Self, TablePlanCompileError> {
        Self::compile_with(pattern, TablePlanOptions::default())
    }

    /// Parse and compile a regex with explicit compilation controls.
    pub fn compile_with(
        pattern: &str,
        options: TablePlanOptions,
    ) -> Result<Self, TablePlanCompileError> {
        if let Some(offset) = pattern.bytes().position(|byte| !byte.is_ascii()) {
            return Err(TablePlanCompileError::NonAsciiPattern { offset });
        }
        // Runtime cursors consume bytes, so the table boundary has one
        // unambiguous syntax policy. Unicode analysis remains available
        // through the HIR APIs, but is not a table-plan option.
        let hir = crate::hir::parser::parse_with_nesting_limit(
            pattern,
            &ParseOptions::byte_mode(),
            options.nesting_limit,
        )
        .map_err(TablePlanCompileError::Parse)?;
        Self::from_hir(&hir, options)
    }

    /// Compile a previously parsed HIR.
    pub fn from_hir(hir: &Hir, options: TablePlanOptions) -> Result<Self, TablePlanCompileError> {
        if let Some(look) =
            validate_hir(hir, options.nesting_limit).map_err(TablePlanCompileError::InvalidHir)?
        {
            return Err(TablePlanCompileError::UnsupportedLook(look));
        }
        let nfa = match Nfa::from_hir_with_limit(hir, options.nfa_state_limit) {
            Ok(nfa) => nfa,
            Err(NfaBuildError::UnsupportedHir) => {
                return Err(TablePlanCompileError::UnsupportedHir);
            }
            Err(NfaBuildError::StateLimitExceeded) => {
                return Err(TablePlanCompileError::NfaStateLimitExceeded {
                    limit: options.nfa_state_limit,
                });
            }
        };
        let dfa_options = DfaOptions {
            state_limit: options.state_limit,
            minimize: options.minimize,
        };
        let dfa =
            Dfa::from_nfa(&nfa, &dfa_options).ok_or(TablePlanCompileError::StateLimitExceeded {
                limit: options.state_limit,
            })?;
        Self::from_dfa(dfa).map_err(TablePlanCompileError::InvalidPlan)
    }

    /// Construct a plan from externally produced tables.
    ///
    /// This is the sole public construction seam for serialized or alternate
    /// compiler output. Every dimension, class, and target is validated.
    pub fn from_parts(
        byte_classes: [u8; 256],
        state_count: u32,
        class_count: u16,
        start_state: u32,
        transitions: Vec<u32>,
        accepting: Vec<bool>,
    ) -> Result<Self, TablePlanError> {
        if state_count == 0 {
            return Err(TablePlanError::EmptyStates);
        }
        if class_count == 0 {
            return Err(TablePlanError::EmptyClasses);
        }
        if class_count > 256 {
            return Err(TablePlanError::TooManyClasses { class_count });
        }
        if accepting.len() != state_count as usize {
            return Err(TablePlanError::StateCountMismatch {
                declared: state_count,
                accepting: accepting.len(),
            });
        }
        if start_state >= state_count {
            return Err(TablePlanError::StartStateOutOfRange {
                start_state,
                state_count,
            });
        }
        for (byte, &class) in byte_classes.iter().enumerate() {
            if u16::from(class) >= class_count {
                return Err(TablePlanError::ByteClassOutOfRange {
                    byte: byte as u8,
                    class,
                    class_count,
                });
            }
        }
        let expected = (state_count as usize)
            .checked_mul(class_count as usize)
            .ok_or(TablePlanError::SizeOverflow)?;
        if transitions.len() != expected {
            return Err(TablePlanError::TransitionTableLength {
                expected,
                actual: transitions.len(),
            });
        }
        for (index, &target) in transitions.iter().enumerate() {
            if target != DEAD_STATE && target >= state_count {
                return Err(TablePlanError::TransitionTargetOutOfRange {
                    index,
                    target,
                    state_count,
                });
            }
        }

        Ok(Self {
            byte_classes,
            transitions,
            accepting,
            state_count,
            class_count,
            start_state,
        })
    }

    fn from_dfa(dfa: Dfa) -> Result<Self, TablePlanError> {
        let state_count =
            u32::try_from(dfa.states.len()).map_err(|_| TablePlanError::SizeOverflow)?;
        let accepting = dfa.states.iter().map(|state| state.is_accept).collect();
        Self::from_parts(
            dfa.byte_classes,
            state_count,
            dfa.num_classes,
            0,
            dfa.flat_transitions,
            accepting,
        )
    }

    pub const fn byte_classes(&self) -> &[u8; 256] {
        &self.byte_classes
    }

    pub fn transitions(&self) -> &[u32] {
        &self.transitions
    }

    pub fn accepting(&self) -> &[bool] {
        &self.accepting
    }

    pub const fn state_count(&self) -> u32 {
        self.state_count
    }

    pub const fn class_count(&self) -> u16 {
        self.class_count
    }

    pub const fn start_state(&self) -> u32 {
        self.start_state
    }

    /// Serialize the checked plan into the stable `BBRTBL01` little-endian
    /// wire format.
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut encoded = Vec::with_capacity(
            HEADER_LEN + 256 + self.accepting.len() + self.transitions.len() * 4,
        );
        encoded.extend_from_slice(&MAGIC);
        encoded.extend_from_slice(&self.state_count.to_le_bytes());
        encoded.extend_from_slice(&self.class_count.to_le_bytes());
        encoded.extend_from_slice(&0_u16.to_le_bytes());
        encoded.extend_from_slice(&self.start_state.to_le_bytes());
        encoded.extend_from_slice(&self.byte_classes);
        encoded.extend(self.accepting.iter().map(|accept| u8::from(*accept)));
        for transition in &self.transitions {
            encoded.extend_from_slice(&transition.to_le_bytes());
        }
        encoded
    }

    /// Deserialize and revalidate a stable `BBRTBL01` table plan.
    pub fn from_bytes(encoded: &[u8]) -> Result<Self, TablePlanError> {
        if encoded.len() < HEADER_LEN {
            return Err(TablePlanError::EncodedLength {
                expected: HEADER_LEN,
                actual: encoded.len(),
            });
        }
        if encoded[..8] != MAGIC {
            return Err(TablePlanError::BadMagic);
        }
        let state_count = u32::from_le_bytes(encoded[8..12].try_into().unwrap());
        let class_count = u16::from_le_bytes(encoded[12..14].try_into().unwrap());
        let reserved = u16::from_le_bytes(encoded[14..16].try_into().unwrap());
        if reserved != 0 {
            return Err(TablePlanError::InvalidReservedBits(reserved));
        }
        let start_state = u32::from_le_bytes(encoded[16..20].try_into().unwrap());
        let transition_count = (state_count as usize)
            .checked_mul(class_count as usize)
            .ok_or(TablePlanError::SizeOverflow)?;
        let transition_bytes = transition_count
            .checked_mul(4)
            .ok_or(TablePlanError::SizeOverflow)?;
        let expected = HEADER_LEN
            .checked_add(256)
            .and_then(|size| size.checked_add(state_count as usize))
            .and_then(|size| size.checked_add(transition_bytes))
            .ok_or(TablePlanError::SizeOverflow)?;
        if encoded.len() != expected {
            return Err(TablePlanError::EncodedLength {
                expected,
                actual: encoded.len(),
            });
        }

        let mut byte_classes = [0_u8; 256];
        byte_classes.copy_from_slice(&encoded[HEADER_LEN..HEADER_LEN + 256]);
        let accepting_start = HEADER_LEN + 256;
        let accepting_end = accepting_start + state_count as usize;
        let mut accepting = Vec::with_capacity(state_count as usize);
        for (state, &value) in encoded[accepting_start..accepting_end].iter().enumerate() {
            match value {
                0 => accepting.push(false),
                1 => accepting.push(true),
                _ => {
                    return Err(TablePlanError::InvalidAcceptByte {
                        state: state as u32,
                        value,
                    });
                }
            }
        }
        let mut transitions = Vec::with_capacity(transition_count);
        for &bytes in encoded[accepting_end..].as_chunks::<4>().0 {
            transitions.push(u32::from_le_bytes(bytes));
        }
        Self::from_parts(
            byte_classes,
            state_count,
            class_count,
            start_state,
            transitions,
            accepting,
        )
    }
}

fn validate_hir(hir: &Hir, nesting_limit: usize) -> Result<Option<Look>, HirValidationError> {
    let mut stack = vec![(hir, 0_usize)];
    let mut first_look = None;

    while let Some((node, depth)) = stack.pop() {
        if depth > nesting_limit {
            return Err(HirValidationError::NestingLimitExceeded {
                limit: nesting_limit,
            });
        }
        match node {
            Hir::Class(crate::hir::CharClass::Bytes { ranges, .. }) => {
                for (index, range) in ranges.iter().enumerate() {
                    if range.start > range.end {
                        return Err(HirValidationError::ReversedByteRange {
                            start: range.start,
                            end: range.end,
                        });
                    }
                    if let Some(previous) = index.checked_sub(1).map(|before| ranges[before])
                        && range.start <= previous.end
                    {
                        return Err(HirValidationError::UnsortedOrOverlappingByteRanges {
                            previous_end: previous.end,
                            next_start: range.start,
                        });
                    }
                }
            }
            Hir::Class(crate::hir::CharClass::Unicode { ranges, .. }) => {
                for (index, range) in ranges.iter().enumerate() {
                    if range.start > range.end {
                        return Err(HirValidationError::ReversedCodepointRange {
                            start: range.start,
                            end: range.end,
                        });
                    }
                    if let Some(previous) = index.checked_sub(1).map(|before| ranges[before])
                        && range.start <= previous.end
                    {
                        return Err(HirValidationError::UnsortedOrOverlappingCodepointRanges {
                            previous_end: previous.end,
                            next_start: range.start,
                        });
                    }
                }
            }
            Hir::Look(look) => {
                first_look.get_or_insert(*look);
            }
            Hir::Repetition(repetition) => {
                if let Some(maximum) = repetition.max
                    && repetition.min > maximum
                {
                    return Err(HirValidationError::RepetitionBounds {
                        minimum: repetition.min,
                        maximum,
                    });
                }
                stack.push((&repetition.sub, depth + 1));
            }
            Hir::Group(sub) => stack.push((sub, depth + 1)),
            Hir::Concat(children) | Hir::Alternation(children) => {
                stack.extend(children.iter().rev().map(|child| (child, depth + 1)));
            }
            Hir::Empty | Hir::Literal(_) => {}
        }
    }
    Ok(first_look)
}

const _: () = {
    assert!(DEAD == DEAD_STATE);
};
