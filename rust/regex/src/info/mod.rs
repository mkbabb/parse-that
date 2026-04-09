//! Unified regex analysis: structural facts, fixed-point properties, width, cost estimation.
//!
//! `RegexInfo::analyze(pattern)` computes all properties in a single pass over the HIR.
//! Consumers cache results by pattern identity (e.g., `StringId` in grammar IR).
//!
//! The module is split by responsibility:
//!
//! - [`classify`] — structural classifiers (anchors, negated classes,
//!   quantified classes, memchr acceleration candidate).
//! - [`width`] — `is_nullable`, match-width bounds, HIR node counting.
//! - [`literal_prefix`] — fixed-byte prefix/suffix extraction.
//! - [`dfa_size`] — DFA/NFA state count estimation heuristics.
//! - [`one_pass`] — one-pass eligibility and HIR walkability.

use crate::classify::{classify_known_pattern, classify_regex_from_hir, RegexClass};
use crate::first::regex_first_chars_from_hir;
use crate::hir::Hir;
use crate::sets::charset::CharSet128;

mod classify;
mod dfa_size;
mod literal_prefix;
mod one_pass;
mod width;

pub use width::is_nullable;

use classify::{
    detect_accel_candidate, detect_anchored, detect_negated_class, detect_quantified_class,
};
use dfa_size::estimate_dfa_size;
use literal_prefix::{extract_literal_prefix, extract_literal_suffix};
use one_pass::{check_one_pass_eligible, is_hir_walkable};
use width::compute_match_width;
pub(crate) use width::count_hir_nodes;

/// Quantified character class info (e.g., `[a-z]+`, `\d*`, `[^"\\]+`).
#[derive(Clone, Debug)]
pub struct QuantifiedClassInfo {
    /// The character set accepted by the class (positive form, ASCII).
    pub chars: CharSet128,
    /// Whether the original class was negated (`[^...]`).
    pub negated: bool,
    /// Minimum repetition count.
    pub min: u32,
    /// Maximum repetition count (`None` = unbounded).
    pub max: Option<u32>,
}

/// Bitset of engines that are *feasible* for a given regex pattern.
///
/// Tranche V: monotone derivation from existing `RegexInfo` fields
/// (`one_pass_eligible`, `dfa_size_estimate`, `accel_candidate`,
/// `classification` narrowness). Consumed by the recognizer-tier CSP
/// (`crates/ir/src/passes/csp_recognizers.rs`) as the legal domain
/// for the per-pattern `RegexEngine` variable.
///
/// `EngineSet` is a thin newtype around `u16`, hand-rolled to avoid a
/// `bitflags` dependency in this leaf crate.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash)]
pub struct EngineSet(u16);

impl EngineSet {
    pub const MEMCHR1: Self = Self(1 << 0);
    pub const MEMCHR2: Self = Self(1 << 1);
    pub const MEMCHR3: Self = Self(1 << 2);
    pub const NIBBLE_LUT: Self = Self(1 << 3);
    pub const ONE_PASS: Self = Self(1 << 4);
    pub const SMALL_DFA: Self = Self(1 << 5);
    pub const DFA: Self = Self(1 << 6);
    /// Pattern matches a named `RegexClass` family — a kernel helper exists.
    pub const FAMILY_HELPER: Self = Self(1 << 7);

    pub const fn empty() -> Self {
        Self(0)
    }

    pub const fn bits(self) -> u16 {
        self.0
    }

    pub const fn from_bits(bits: u16) -> Self {
        Self(bits)
    }

    pub const fn contains(self, other: Self) -> bool {
        (self.0 & other.0) == other.0
    }

    pub const fn intersects(self, other: Self) -> bool {
        (self.0 & other.0) != 0
    }

    pub fn insert(&mut self, other: Self) {
        self.0 |= other.0;
    }

    pub fn remove(&mut self, other: Self) {
        self.0 &= !other.0;
    }

    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }
}

impl std::ops::BitOr for EngineSet {
    type Output = Self;
    fn bitor(self, rhs: Self) -> Self {
        Self(self.0 | rhs.0)
    }
}

impl std::ops::BitOrAssign for EngineSet {
    fn bitor_assign(&mut self, rhs: Self) {
        self.0 |= rhs.0;
    }
}

impl std::ops::BitAnd for EngineSet {
    type Output = Self;
    fn bitand(self, rhs: Self) -> Self {
        Self(self.0 & rhs.0)
    }
}

/// Comprehensive regex analysis result.
///
/// Built by `RegexInfo::analyze(pattern)` in a single pass. Fields are grouped
/// by analysis category:
///
/// - **Structural**: direct HIR walks, no solver needed
/// - **Fixed-point**: monotone properties (nullable, FIRST, one-pass)
/// - **Width**: min/max match length from normalized HIR
/// - **Cost estimation**: feeds into tier planning CSP
#[derive(Clone, Debug)]
pub struct RegexInfo {
    // ── Structural (direct HIR analysis) ─────────────────────────────────
    /// Semantic pattern category.
    pub classification: RegexClass,
    /// Fixed byte prefix (enables memcmp fast path).
    pub literal_prefix: Option<Vec<u8>>,
    /// Fixed byte suffix (enables reverse memcmp).
    pub literal_suffix: Option<Vec<u8>>,
    /// For `[^XYZ]+` patterns: the positive-form CharSet128 (bytes accepted).
    pub negated_class: Option<CharSet128>,
    /// For `[a-z]+`, `\d*`, etc.: the quantified class info.
    pub quantified_class: Option<QuantifiedClassInfo>,
    /// Whether the pattern is anchored (`^` at start or `$` at end).
    pub is_anchored: bool,
    /// HIR node count (direct count, for cost estimation).
    pub hir_size_estimate: usize,

    // ── Fixed-point properties ───────────────────────────────────────────
    /// Possible first bytes (ASCII, 128-bit bitset).
    pub first_chars: CharSet128,
    /// Whether the pattern can match the empty string.
    pub nullable: bool,
    /// Always advances input on successful match (`!nullable && min_match_len > 0`).
    pub must_consume: bool,
    /// No ambiguity in alternation structure — can match in single left-to-right pass.
    pub one_pass_eligible: bool,

    // ── Width ────────────────────────────────────────────────────────────
    /// Minimum bytes consumed on successful match.
    pub min_match_len: usize,
    /// Upper bound on match length (`None` = unbounded).
    pub max_match_len: Option<usize>,

    // ── Cost estimation ──────────────────────────────────────────────────
    /// Estimated DFA state count (heuristic from NFA, avoids full compilation).
    pub dfa_size_estimate: Option<usize>,

    // ── Emission hints ───────────────────────────────────────────────────
    /// A single discriminating byte that `memchr` can use for acceleration.
    /// `Some(b)` means `b` is guaranteed to appear in every match and can
    /// drive a memchr-based fast scan.
    pub accel_candidate: Option<u8>,
    /// Whether the HIR emitter can compile this pattern to inline byte
    /// operations (vs. falling back to a DFA). Checked once here to avoid
    /// re-probing at each emission site.
    pub hir_walkable: bool,

    /// Tranche V: bitset of engines that are *feasible* for this pattern.
    /// Monotone derivation from the other RegexInfo fields. Consumed by
    /// the recognizer-tier CSP as the per-pattern `RegexEngine` domain.
    pub feasible_engines: EngineSet,
}

impl RegexInfo {
    /// Analyze a regex pattern, computing all properties in a single parse.
    ///
    /// Uses [`crate::egraph::RegexExtractionCost::default`] for HIR
    /// canonicalization. Consumers with a non-default cost (e.g. the
    /// bbnf-lang grammar pipeline reading from `ir.cost_config`) should
    /// call [`Self::analyze_with_cost`] instead.
    ///
    /// Returns `None` if the pattern fails to parse.
    pub fn analyze(pattern: &str) -> Option<Self> {
        Self::analyze_with_cost(pattern, &crate::egraph::RegexExtractionCost::default())
    }

    /// Analyze a regex pattern with an explicit cost model for HIR
    /// canonicalization.
    pub fn analyze_with_cost(
        pattern: &str,
        cost: &crate::egraph::RegexExtractionCost,
    ) -> Option<Self> {
        let hir = crate::hir::parser::parse_with(pattern, &crate::hir::ParseOptions::byte_mode())
            .ok()?;
        Some(Self::analyze_from_hir_with_cost(pattern, &hir, cost))
    }

    /// Analyze a regex from a pre-parsed HIR using the default cost model.
    ///
    /// See [`Self::analyze_from_hir_with_cost`] for the explicit-cost variant.
    pub fn analyze_from_hir(pattern: &str, hir: &Hir) -> Self {
        Self::analyze_from_hir_with_cost(
            pattern,
            hir,
            &crate::egraph::RegexExtractionCost::default(),
        )
    }

    /// Analyze a regex from a pre-parsed HIR with an explicit cost model.
    /// Consumers that already have the HIR should call this directly to
    /// avoid a redundant parse.
    ///
    /// `pattern` is still required for the known-pattern fast path in
    /// `classify_regex` — if the consumer doesn't have the original string,
    /// pass `""` (classification falls back to HIR-only structural checks).
    ///
    /// Before analysis runs, the HIR is passed through
    /// `crate::egraph::simplify_hir` — a cost-guided equality saturation
    /// that canonicalizes alternations (dedup, superset absorption,
    /// charclass union merge), flattens nested Alt/Concat, and absorbs
    /// adjacent repetitions. Every downstream analysis (FIRST sets,
    /// nullable, width, DFA sizing) therefore sees the canonicalized
    /// HIR with zero caller-side awareness.
    pub fn analyze_from_hir_with_cost(
        pattern: &str,
        hir: &Hir,
        cost: &crate::egraph::RegexExtractionCost,
    ) -> Self {
        // Canonicalize HIR via the cost-guided e-graph first. Every
        // downstream analysis runs against `canonical`, not the raw
        // input `hir`.
        let canonical = crate::egraph::simplify_hir(hir, cost);
        let hir = &canonical;

        // Classification: known-pattern fast path first, then structural.
        let classification = classify_known_pattern(pattern)
            .unwrap_or_else(|| classify_regex_from_hir(hir));
        let first_chars = regex_first_chars_from_hir(hir).unwrap_or_else(CharSet128::new);
        let nullable = is_nullable(hir);
        let (min_len, max_len) = compute_match_width(hir);
        let must_consume = !nullable && min_len > 0;
        let literal_prefix = extract_literal_prefix(hir);
        let literal_suffix = extract_literal_suffix(hir);
        let negated_class = detect_negated_class(hir);
        let quantified_class = detect_quantified_class(hir);
        let is_anchored = detect_anchored(hir);
        let hir_size = count_hir_nodes(hir);
        let one_pass = check_one_pass_eligible(hir);
        let dfa_estimate = estimate_dfa_size(hir);
        let accel_candidate = detect_accel_candidate(hir, &literal_prefix, &literal_suffix);
        let hir_walkable = is_hir_walkable(hir);

        let feasible_engines = derive_feasible_engines(
            &classification,
            &literal_prefix,
            &negated_class,
            accel_candidate,
            one_pass,
            dfa_estimate,
            hir_walkable,
        );

        RegexInfo {
            classification,
            literal_prefix,
            literal_suffix,
            negated_class,
            quantified_class,
            is_anchored,
            hir_size_estimate: hir_size,
            first_chars,
            nullable,
            must_consume,
            one_pass_eligible: one_pass,
            min_match_len: min_len,
            max_match_len: max_len,
            dfa_size_estimate: dfa_estimate,
            accel_candidate,
            hir_walkable,
            feasible_engines,
        }
    }
}

/// Tranche V: monotone derivation of `EngineSet` from already-computed
/// RegexInfo fields. No analysis cost beyond a few branch comparisons.
fn derive_feasible_engines(
    classification: &crate::classify::RegexClass,
    literal_prefix: &Option<Vec<u8>>,
    negated_class: &Option<crate::sets::charset::CharSet128>,
    accel_candidate: Option<u8>,
    one_pass_eligible: bool,
    dfa_size_estimate: Option<usize>,
    hir_walkable: bool,
) -> EngineSet {
    use crate::classify::RegexClass;
    let mut set = EngineSet::empty();

    // memchr family — driven by the negated-class bit count or the
    // accel candidate when no negated class is present.
    if let Some(cs) = negated_class {
        // Negated class with N bytes accepted means the *exit* set has
        // (128 - N) bytes; the kernel selection consumer reads that.
        // For feasibility we just say "memchr1/2/3 are reachable as
        // long as the exit set fits".
        let exit_count = 128usize.saturating_sub(cs.len());
        if exit_count <= 1 {
            set.insert(EngineSet::MEMCHR1);
        }
        if exit_count <= 2 {
            set.insert(EngineSet::MEMCHR2);
        }
        if exit_count <= 3 {
            set.insert(EngineSet::MEMCHR3);
        }
        if exit_count <= 8 {
            set.insert(EngineSet::NIBBLE_LUT);
        }
    } else if accel_candidate.is_some() || literal_prefix.is_some() {
        set.insert(EngineSet::MEMCHR1);
    }

    if one_pass_eligible {
        set.insert(EngineSet::ONE_PASS);
    }

    if let Some(states) = dfa_size_estimate {
        if states <= 64 {
            set.insert(EngineSet::SMALL_DFA);
        }
        // DFA is always feasible as the universal fallback for any
        // walkable pattern.
        set.insert(EngineSet::DFA);
    } else if hir_walkable {
        set.insert(EngineSet::DFA);
    }

    // Family helper bit — set whenever the classifier landed on a named
    // family that has a kernel module in `crates/core/src/backend/kernels/`.
    if matches!(
        classification,
        RegexClass::Numeric { .. }
            | RegexClass::QuotedString { .. }
            | RegexClass::HexDigits
            | RegexClass::Identifier
            | RegexClass::JsonString
            | RegexClass::JsonNumber
            | RegexClass::WsBlockComment
            | RegexClass::CssIdent
            | RegexClass::CssQuotedString
            | RegexClass::CharClassQuantified(_)
            | RegexClass::PrefixThenClass { .. }
            | RegexClass::AccelDriven(_)
    ) {
        set.insert(EngineSet::FAMILY_HELPER);
    }

    set
}
