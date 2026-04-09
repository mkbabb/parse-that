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
use width::{compute_match_width, count_hir_nodes};

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
}

impl RegexInfo {
    /// Analyze a regex pattern, computing all properties in a single parse.
    ///
    /// Returns `None` if the pattern fails to parse.
    pub fn analyze(pattern: &str) -> Option<Self> {
        let hir = crate::hir::parser::parse_with(pattern, &crate::hir::ParseOptions::byte_mode())
            .ok()?;
        Some(Self::analyze_from_hir(pattern, &hir))
    }

    /// Analyze a regex from a pre-parsed HIR. Consumers that already have
    /// the HIR should call this directly to avoid a redundant parse.
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
    pub fn analyze_from_hir(pattern: &str, hir: &Hir) -> Self {
        // Canonicalize HIR via the cost-guided e-graph first. Every
        // downstream analysis runs against `canonical`, not the raw
        // input `hir`.
        let cost = crate::egraph::RegexExtractionCost::default();
        let canonical = crate::egraph::simplify_hir(hir, &cost);
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
        }
    }
}
