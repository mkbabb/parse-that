//! Unified regex analysis: structural facts, fixed-point properties, width, cost estimation.
//!
//! `RegexInfo::analyze(pattern)` computes all properties in a single pass over the HIR.
//! Consumers cache results by pattern identity (e.g., `StringId` in grammar IR).

use crate::classify::{classify_known_pattern, classify_regex_from_hir, RegexClass};
use crate::first::regex_first_chars_from_hir;
use crate::hir::{CharClass, Hir, Repetition};
use crate::sets::charset::CharSet128;

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
    pub fn analyze_from_hir(pattern: &str, hir: &Hir) -> Self {
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

// ── Acceleration candidate detection ────────────────────────────────────────

/// Find a single byte that must appear in every match, suitable for
/// `memchr`-based acceleration. Prefers the first literal byte if the
/// pattern starts with a fixed prefix; otherwise picks the first byte of
/// a fixed suffix. Returns `None` for wholly variable patterns.
fn detect_accel_candidate(
    _hir: &Hir,
    literal_prefix: &Option<Vec<u8>>,
    literal_suffix: &Option<Vec<u8>>,
) -> Option<u8> {
    if let Some(prefix) = literal_prefix {
        if let Some(&b) = prefix.first() {
            return Some(b);
        }
    }
    if let Some(suffix) = literal_suffix {
        if let Some(&b) = suffix.first() {
            return Some(b);
        }
    }
    None
}

// ── HIR walkability check ───────────────────────────────────────────────────

/// Whether the HIR walker can compile this pattern to inline byte operations.
///
/// Returns `false` for patterns containing constructs the walker doesn't
/// handle: lazy quantifiers outside `.*?literal`, Unicode properties beyond
/// ASCII, backreferences, or non-anchor look-around.
///
/// This is a conservative check used to skip the HIR-emit probe at backends
/// that can cache `RegexInfo`. The actual walker may succeed or fail
/// independently; a `true` here is a necessary (not sufficient) condition.
fn is_hir_walkable(hir: &Hir) -> bool {
    match hir {
        Hir::Empty | Hir::Literal(_) | Hir::Class(_) => true,
        Hir::Look(_) => true, // anchors are fine
        Hir::Repetition(rep) => {
            // Greedy only — lazy repetitions are only handled as part of
            // the `.*?literal` special case in the walker.
            rep.greedy && is_hir_walkable(&rep.sub)
        }
        Hir::Group(sub) => is_hir_walkable(sub),
        Hir::Concat(seq) => seq.iter().all(is_hir_walkable),
        Hir::Alternation(alts) => alts.iter().all(is_hir_walkable),
    }
}

// ── Nullable ─────────────────────────────────────────────────────────────

/// Whether a HIR node can match the empty string.
pub fn is_nullable(hir: &Hir) -> bool {
    match hir {
        Hir::Empty => true,
        Hir::Literal(_) => false,
        Hir::Class(_) => false,
        Hir::Alternation(alts) => alts.iter().any(is_nullable),
        Hir::Concat(seq) => seq.iter().all(is_nullable),
        Hir::Repetition(rep) => rep.min == 0,
        Hir::Group(sub) => is_nullable(sub),
        Hir::Look(_) => true,
    }
}

// ── Match width ──────────────────────────────────────────────────────────

/// Compute (min_match_len, max_match_len) for a HIR node.
///
/// `max_match_len` is `None` for unbounded patterns (e.g., `a+`, `.*`).
fn compute_match_width(hir: &Hir) -> (usize, Option<usize>) {
    match hir {
        Hir::Empty | Hir::Look(_) => (0, Some(0)),

        Hir::Literal(bytes) => {
            let n = bytes.len();
            (n, Some(n))
        }

        Hir::Class(class) => {
            let (lo, hi) = class_byte_width(class);
            (lo, Some(hi))
        }

        Hir::Alternation(alts) => {
            if alts.is_empty() {
                return (0, Some(0));
            }
            let mut min_lo = usize::MAX;
            let mut max_hi: Option<usize> = Some(0);
            for alt in alts {
                let (lo, hi) = compute_match_width(alt);
                min_lo = min_lo.min(lo);
                max_hi = match (max_hi, hi) {
                    (Some(a), Some(b)) => Some(a.max(b)),
                    _ => None,
                };
            }
            (min_lo, max_hi)
        }

        Hir::Concat(seq) => {
            let mut total_lo: usize = 0;
            let mut total_hi: Option<usize> = Some(0);
            for child in seq {
                let (lo, hi) = compute_match_width(child);
                total_lo = total_lo.saturating_add(lo);
                total_hi = match (total_hi, hi) {
                    (Some(a), Some(b)) => a.checked_add(b),
                    _ => None,
                };
            }
            (total_lo, total_hi)
        }

        Hir::Repetition(Repetition {
            sub, min, max, ..
        }) => {
            let (sub_lo, sub_hi) = compute_match_width(sub);
            let rep_lo = (*min as usize).saturating_mul(sub_lo);
            let rep_hi = match (max, sub_hi) {
                (Some(m), Some(h)) => (*m as usize).checked_mul(h),
                (Some(0), _) => Some(0),
                _ => None, // unbounded repetition
            };
            (rep_lo, rep_hi)
        }

        Hir::Group(sub) => compute_match_width(sub),
    }
}

/// Byte width range for a character class.
fn class_byte_width(class: &CharClass) -> (usize, usize) {
    match class {
        CharClass::Bytes { .. } => (1, 1),
        CharClass::Unicode { ranges, negated } => {
            // Unicode classes can match multi-byte UTF-8 sequences.
            let effective = if *negated {
                // Negated: at least 1 byte (ASCII), up to 4 bytes (non-BMP complement).
                return (1, 4);
            } else {
                ranges
            };
            if effective.is_empty() {
                return (0, 0);
            }
            let min_cp = effective.first().unwrap().start as u32;
            let max_cp = effective.last().unwrap().end as u32;
            let lo = utf8_len(min_cp);
            let hi = utf8_len(max_cp);
            (lo, hi)
        }
    }
}

fn utf8_len(cp: u32) -> usize {
    if cp <= 0x7F {
        1
    } else if cp <= 0x7FF {
        2
    } else if cp <= 0xFFFF {
        3
    } else {
        4
    }
}

// ── Literal prefix/suffix ────────────────────────────────────────────────

/// Extract fixed byte prefix from the pattern.
fn extract_literal_prefix(hir: &Hir) -> Option<Vec<u8>> {
    match hir {
        Hir::Literal(bytes) => Some(bytes.clone()),

        Hir::Concat(seq) => {
            let mut prefix = Vec::new();
            for child in seq {
                match child {
                    Hir::Literal(bytes) => prefix.extend_from_slice(bytes),
                    Hir::Group(sub) => {
                        if let Some(p) = extract_literal_prefix(sub) {
                            prefix.extend_from_slice(&p);
                            if p.len() < compute_match_width(sub).0 {
                                break; // sub has more than just a literal
                            }
                        } else {
                            break;
                        }
                    }
                    _ => break,
                }
            }
            if prefix.is_empty() {
                None
            } else {
                Some(prefix)
            }
        }

        Hir::Group(sub) => extract_literal_prefix(sub),

        _ => None,
    }
}

/// Extract fixed byte suffix from the pattern.
fn extract_literal_suffix(hir: &Hir) -> Option<Vec<u8>> {
    match hir {
        Hir::Literal(bytes) => Some(bytes.clone()),

        Hir::Concat(seq) => {
            let mut suffix = Vec::new();
            for child in seq.iter().rev() {
                match child {
                    Hir::Literal(bytes) => {
                        let mut b = bytes.clone();
                        b.extend_from_slice(&suffix);
                        suffix = b;
                    }
                    Hir::Group(sub) => {
                        if let Some(s) = extract_literal_suffix(sub) {
                            let mut b = s;
                            b.extend_from_slice(&suffix);
                            suffix = b;
                            if compute_match_width(sub).0
                                > extract_literal_suffix(sub).map_or(0, |s| s.len())
                            {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    _ => break,
                }
            }
            if suffix.is_empty() {
                None
            } else {
                Some(suffix)
            }
        }

        Hir::Group(sub) => extract_literal_suffix(sub),

        _ => None,
    }
}

// ── Negated class detection ──────────────────────────────────────────────

/// Detect `[^XYZ]+` or `[^XYZ]*` patterns. Returns the positive-form CharSet128
/// (bytes that the negated class accepts).
fn detect_negated_class(hir: &Hir) -> Option<CharSet128> {
    match hir {
        // Bare negated class: [^XYZ]
        Hir::Class(CharClass::Bytes { negated: true, .. }) => Some(class_to_charset_positive(hir)),

        // Quantified negated class: [^XYZ]+ or [^XYZ]*
        Hir::Repetition(Repetition { sub, .. }) => detect_negated_class(sub),

        // Concat starting with negated class
        Hir::Concat(seq) if !seq.is_empty() => detect_negated_class(&seq[0]),

        Hir::Group(sub) => detect_negated_class(sub),

        _ => None,
    }
}

/// Convert a CharClass to its positive-form CharSet128 (ASCII).
fn class_to_charset_positive(hir: &Hir) -> CharSet128 {
    let mut cs = CharSet128::new();
    if let Hir::Class(class) = hir {
        let ranges = class.to_positive_byte_ranges();
        for r in &ranges {
            let lo = r.start;
            let hi = r.end.min(127);
            if lo <= hi {
                cs.add_range(lo, hi);
            }
        }
    }
    cs
}

// ── Quantified class detection ───────────────────────────────────────────

/// Detect patterns like `[a-z]+`, `\d*`, `[^"\\]+` — a quantified character class.
fn detect_quantified_class(hir: &Hir) -> Option<QuantifiedClassInfo> {
    match hir {
        Hir::Repetition(Repetition {
            sub, min, max, ..
        }) => {
            if let Hir::Class(class) = sub.as_ref() {
                let negated = class.negated();
                let ranges = class.to_positive_byte_ranges();
                let mut chars = CharSet128::new();
                for r in &ranges {
                    let lo = r.start;
                    let hi = r.end.min(127);
                    if lo <= hi {
                        chars.add_range(lo, hi);
                    }
                }
                Some(QuantifiedClassInfo {
                    chars,
                    negated,
                    min: *min,
                    max: *max,
                })
            } else if let Hir::Group(inner) = sub.as_ref() {
                // Unwrap group around class
                if let Hir::Class(class) = inner.as_ref() {
                    let negated = class.negated();
                    let ranges = class.to_positive_byte_ranges();
                    let mut chars = CharSet128::new();
                    for r in &ranges {
                        let lo = r.start;
                        let hi = r.end.min(127);
                        if lo <= hi {
                            chars.add_range(lo, hi);
                        }
                    }
                    Some(QuantifiedClassInfo {
                        chars,
                        negated,
                        min: *min,
                        max: *max,
                    })
                } else {
                    None
                }
            } else {
                None
            }
        }

        // Concat where first element is a quantified class
        Hir::Concat(seq) if !seq.is_empty() => detect_quantified_class(&seq[0]),

        Hir::Group(sub) => detect_quantified_class(sub),

        _ => None,
    }
}

// ── Anchor detection ─────────────────────────────────────────────────────

fn detect_anchored(hir: &Hir) -> bool {
    match hir {
        Hir::Look(crate::hir::Look::Start | crate::hir::Look::End) => true,

        Hir::Concat(seq) => {
            if let Some(first) = seq.first() {
                if matches!(first, Hir::Look(crate::hir::Look::Start)) {
                    return true;
                }
            }
            if let Some(last) = seq.last() {
                if matches!(last, Hir::Look(crate::hir::Look::End)) {
                    return true;
                }
            }
            false
        }

        Hir::Group(sub) => detect_anchored(sub),

        _ => false,
    }
}

// ── HIR node counting ────────────────────────────────────────────────────

fn count_hir_nodes(hir: &Hir) -> usize {
    match hir {
        Hir::Empty | Hir::Literal(_) | Hir::Class(_) | Hir::Look(_) => 1,
        Hir::Repetition(rep) => 1 + count_hir_nodes(&rep.sub),
        Hir::Group(sub) => 1 + count_hir_nodes(sub),
        Hir::Concat(seq) => 1 + seq.iter().map(count_hir_nodes).sum::<usize>(),
        Hir::Alternation(alts) => 1 + alts.iter().map(count_hir_nodes).sum::<usize>(),
    }
}

// ── One-pass eligibility ─────────────────────────────────────────────────

/// Check if the pattern can be matched in a single left-to-right pass
/// without backtracking. True when no alternation has overlapping FIRST sets.
fn check_one_pass_eligible(hir: &Hir) -> bool {
    match hir {
        Hir::Empty | Hir::Literal(_) | Hir::Class(_) | Hir::Look(_) => true,

        Hir::Alternation(alts) => {
            // Check pairwise FIRST set disjointness.
            let firsts: Vec<Option<CharSet128>> =
                alts.iter().map(|a| first_chars_of_hir(a)).collect();
            for i in 0..firsts.len() {
                for j in (i + 1)..firsts.len() {
                    match (&firsts[i], &firsts[j]) {
                        (Some(a), Some(b)) => {
                            if !a.is_disjoint(b) {
                                return false;
                            }
                        }
                        // If either is None (wildcard), they overlap.
                        _ => return false,
                    }
                }
            }
            // Also check children recursively.
            alts.iter().all(check_one_pass_eligible)
        }

        Hir::Concat(seq) => seq.iter().all(check_one_pass_eligible),
        Hir::Repetition(rep) => check_one_pass_eligible(&rep.sub),
        Hir::Group(sub) => check_one_pass_eligible(sub),
    }
}

/// FIRST chars for a single HIR node (used internally for one-pass check).
fn first_chars_of_hir(hir: &Hir) -> Option<CharSet128> {
    crate::first::regex_first_chars_from_hir(hir)
}

// ── DFA size estimation ──────────────────────────────────────────────────

/// Heuristic DFA state count estimate without full compilation.
///
/// Uses NFA state count as a proxy: for most practical patterns,
/// DFA states ≈ 2–4× NFA states. Returns `None` if NFA construction fails.
fn estimate_dfa_size(hir: &Hir) -> Option<usize> {
    // Count NFA-like states from HIR structure.
    let nfa_estimate = estimate_nfa_states(hir);
    // Practical DFA states are typically 2-4x NFA states for non-pathological patterns.
    Some(nfa_estimate.saturating_mul(3))
}

fn estimate_nfa_states(hir: &Hir) -> usize {
    match hir {
        Hir::Empty => 1,
        Hir::Look(_) => 1,
        Hir::Literal(bytes) => bytes.len() + 1, // one state per byte + accept
        Hir::Class(_) => 2,                      // one transition state + accept
        Hir::Alternation(alts) => {
            2 + alts.iter().map(estimate_nfa_states).sum::<usize>() // split + join
        }
        Hir::Concat(seq) => seq.iter().map(estimate_nfa_states).sum::<usize>(),
        Hir::Repetition(rep) => {
            let sub = estimate_nfa_states(&rep.sub);
            match (rep.min, rep.max) {
                (0, None) => sub + 2,     // Kleene star: ε-loop
                (1, None) => sub + 1,     // Plus: body + loop-back
                (_, Some(m)) => sub * (m as usize).max(1) + 1, // Bounded: unroll
                _ => sub + 2,
            }
        }
        Hir::Group(sub) => estimate_nfa_states(sub),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_literal() {
        let info = RegexInfo::analyze("hello").unwrap();
        assert!(!info.nullable);
        assert!(info.must_consume);
        assert_eq!(info.min_match_len, 5);
        assert_eq!(info.max_match_len, Some(5));
        assert_eq!(info.literal_prefix, Some(b"hello".to_vec()));
        assert_eq!(info.literal_suffix, Some(b"hello".to_vec()));
        assert!(info.one_pass_eligible);
    }

    #[test]
    fn test_nullable_pattern() {
        let info = RegexInfo::analyze("[a-z]*").unwrap();
        assert!(info.nullable);
        assert!(!info.must_consume);
        assert_eq!(info.min_match_len, 0);
        assert_eq!(info.max_match_len, None);
    }

    #[test]
    fn test_negated_class() {
        let info = RegexInfo::analyze(r#"[^"\\]+"#).unwrap();
        assert!(info.negated_class.is_some());
        assert!(info.quantified_class.is_some());
        let qc = info.quantified_class.unwrap();
        assert!(qc.negated);
        assert_eq!(qc.min, 1);
        assert_eq!(qc.max, None);
    }

    #[test]
    fn test_json_number_classification() {
        let info =
            RegexInfo::analyze(r"-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?").unwrap();
        assert_eq!(info.classification, RegexClass::JsonNumber);
        assert!(!info.nullable);
        assert!(info.must_consume);
    }

    #[test]
    fn test_anchored() {
        let info = RegexInfo::analyze(r"^hello").unwrap();
        assert!(info.is_anchored);
    }

    #[test]
    fn test_alternation_one_pass() {
        // Disjoint FIRST sets → one-pass eligible
        let info = RegexInfo::analyze(r"[a-z]+|[0-9]+").unwrap();
        assert!(info.one_pass_eligible);

        // Overlapping FIRST sets → not one-pass
        let info = RegexInfo::analyze(r"abc|abd").unwrap();
        assert!(!info.one_pass_eligible);
    }

    #[test]
    fn test_width_bounds() {
        let info = RegexInfo::analyze(r"[a-z]{2,5}").unwrap();
        assert_eq!(info.min_match_len, 2);
        assert_eq!(info.max_match_len, Some(5));
    }
}
