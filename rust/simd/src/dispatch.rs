//! Runtime kernel dispatch.
//!
//! Every ISA tier whose kernel can exist on the build's target
//! architecture is compiled into a default build; which one runs is
//! decided once, at runtime, by CPU-feature detection and cached in a
//! [`OnceLock`]. A kernel's body is compiled under
//! `#[target_feature(enable = ...)]`, so the build's baseline
//! `target_feature` set never hides a tier.
//!
//! [`scan_with`] runs a named tier (or reports that the host cannot run
//! it); it is how the differential tests hold every supported tier to
//! the [`scalar`](crate::scalar) oracle.
//!
//! # Overrides
//!
//! - The `force-scalar` feature, and every Miri run, select
//!   [`Tier::Scalar`].
//! - Otherwise the environment variable [`TIER_ENV`]
//!   (`PARSE_THAT_SCAN_TIER`), read once, names the tier to run
//!   ([`Tier::name`]). A name that is unknown, or a tier the host cannot
//!   run, panics on the first scan rather than silently running another
//!   tier.

use std::sync::OnceLock;

use crate::StructuralIndex;
use crate::alphabet::StructuralAlphabet;
use crate::index::Stage1Index;
use crate::padded::PaddedSlice;
use crate::stage1::{Stage1Error, Stage1Spec};

/// One structural-scan kernel tier.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Tier {
    /// Portable byte-at-a-time reference ([`crate::scalar`]).
    Scalar,
    /// aarch64 Advanced SIMD (baseline on every aarch64 CPU).
    Neon,
    /// x86_64 AVX2.
    Avx2,
    /// x86_64 AVX-512 F + BW + VBMI2.
    Avx512,
    /// wasm32 SIMD128.
    Simd128,
}

impl Tier {
    /// Every tier, best first: the order [`selected_tier`] searches.
    pub const PREFERENCE: [Tier; 5] = [
        Tier::Avx512,
        Tier::Avx2,
        Tier::Neon,
        Tier::Simd128,
        Tier::Scalar,
    ];

    /// The tier named `name` ([`Tier::name`]), if there is one.
    ///
    /// ```
    /// use parse_that_simd::Tier;
    /// assert_eq!(Tier::from_name("scalar"), Some(Tier::Scalar));
    /// assert_eq!(Tier::from_name("sse2"), None);
    /// ```
    pub fn from_name(name: &str) -> Option<Tier> {
        Tier::PREFERENCE.into_iter().find(|t| t.name() == name)
    }

    /// Stable lowercase name (used in records and test messages).
    pub const fn name(self) -> &'static str {
        match self {
            Tier::Scalar => "scalar",
            Tier::Neon => "neon",
            Tier::Avx2 => "avx2",
            Tier::Avx512 => "avx512",
            Tier::Simd128 => "simd128",
        }
    }

    /// Whether this build contains the tier's kernel.
    pub const fn is_compiled(self) -> bool {
        match self {
            Tier::Scalar => true,
            Tier::Neon => cfg!(target_arch = "aarch64"),
            Tier::Avx2 | Tier::Avx512 => cfg!(target_arch = "x86_64"),
            // wasm has no runtime detection: the tier exists only in a
            // build that enables `simd128` (see `crate::wasm`).
            Tier::Simd128 => cfg!(all(target_arch = "wasm32", target_feature = "simd128")),
        }
    }

    /// Whether this build contains the tier **and** the running CPU
    /// supports it.
    pub fn is_supported(self) -> bool {
        if !self.is_compiled() {
            return false;
        }
        // Miri checks the scalar and dispatch code; it does not model the
        // vector intrinsics, so no SIMD tier runs under it.
        if cfg!(miri) {
            return self == Tier::Scalar;
        }
        match self {
            Tier::Scalar | Tier::Neon | Tier::Simd128 => true,
            #[cfg(target_arch = "x86_64")]
            Tier::Avx2 => std::is_x86_feature_detected!("avx2"),
            #[cfg(target_arch = "x86_64")]
            Tier::Avx512 => {
                std::is_x86_feature_detected!("avx512f")
                    && std::is_x86_feature_detected!("avx512bw")
                    && std::is_x86_feature_detected!("avx512vbmi2")
            }
            #[allow(unreachable_patterns)]
            _ => false,
        }
    }
}

/// The tiers this build contains, best first. The scalar oracle is
/// always among them, last.
///
/// ```
/// use parse_that_simd::{Tier, compiled_tiers};
/// assert_eq!(compiled_tiers().last(), Some(&Tier::Scalar));
/// ```
pub fn compiled_tiers() -> Vec<Tier> {
    Tier::PREFERENCE
        .into_iter()
        .filter(|t| t.is_compiled())
        .collect()
}

/// The environment variable that names the tier to run
/// ([`Tier::name`]); see the module docs.
pub const TIER_ENV: &str = "PARSE_THAT_SCAN_TIER";

/// The tier [`crate::scan_structural`] runs, decided once per process:
/// [`Tier::Scalar`] under `force-scalar` or Miri, else the tier
/// [`TIER_ENV`] names, else the best tier the running CPU supports.
///
/// ```
/// let tier = parse_that_simd::selected_tier();
/// assert!(tier.is_supported());
/// ```
pub fn selected_tier() -> Tier {
    static SELECTED: OnceLock<Tier> = OnceLock::new();
    *SELECTED.get_or_init(|| select(std::env::var(TIER_ENV).ok().as_deref()))
}

/// [`selected_tier`]'s decision, given the override's value.
fn select(requested: Option<&str>) -> Tier {
    if cfg!(any(feature = "force-scalar", miri)) {
        return Tier::Scalar;
    }
    if let Some(name) = requested {
        let tier = Tier::from_name(name)
            .unwrap_or_else(|| panic!("{TIER_ENV}={name:?} names no tier"));
        assert!(tier.is_supported(), "{TIER_ENV}={name:?}: this host cannot run that tier");
        return tier;
    }
    Tier::PREFERENCE
        .into_iter()
        .find(|t| t.is_supported())
        .unwrap_or(Tier::Scalar)
}

/// Run `tier`'s kernel, or `None` when the build or the host cannot
/// run it. Output is byte-identical to [`crate::scalar::scan`] for
/// every tier that returns `Some`.
///
/// ```
/// use parse_that_simd::{StructuralAlphabet, compiled_tiers, scalar, scan_with};
///
/// const CSV: StructuralAlphabet = StructuralAlphabet::from_parts(b",\n", &[], b"\"");
/// let input = b"a,\"b,c\"\nd,e\n";
/// let oracle = scalar::scan(input, &CSV);
/// for tier in compiled_tiers() {
///     if let Some(index) = scan_with(tier, input, &CSV) {
///         assert_eq!(index.positions, oracle.positions, "{}", tier.name());
///         assert_eq!(index.kinds, oracle.kinds, "{}", tier.name());
///     }
/// }
/// ```
pub fn scan_with(
    tier: Tier,
    input: &[u8],
    alphabet: &StructuralAlphabet,
) -> Option<StructuralIndex> {
    // SAFETY: `run`'s precondition is exactly `is_supported`.
    tier.is_supported()
        .then(|| unsafe { run(tier, input, alphabet) })
}

/// [`scan_with`] on [`selected_tier`], which is supported by
/// construction.
pub(crate) fn scan_selected(input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    // SAFETY: `selected_tier` only returns a supported tier.
    unsafe { run(selected_tier(), input, alphabet) }
}

/// # Safety
/// `tier.is_supported()`: the kernel's target features are present.
unsafe fn run(tier: Tier, input: &[u8], alphabet: &StructuralAlphabet) -> StructuralIndex {
    if alphabet.singletons.is_empty() && alphabet.digraph_pairs.is_empty() {
        return StructuralIndex::new();
    }
    match tier {
        #[cfg(target_arch = "aarch64")]
        Tier::Neon => crate::neon::scan(input, alphabet),
        // SAFETY (both x86 arms): the caller guarantees the features.
        #[cfg(target_arch = "x86_64")]
        Tier::Avx2 => unsafe { crate::avx2::scan(input, alphabet) },
        #[cfg(target_arch = "x86_64")]
        Tier::Avx512 => unsafe { crate::avx512::scan(input, alphabet) },
        #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
        Tier::Simd128 => crate::wasm::scan(input, alphabet),
        _ => crate::scalar::scan(input, alphabet),
    }
}

/// Run `tier`'s stage-1 kernel ([`crate::stage1`]), or `None` when the
/// build or the host cannot run it. Output is identical to
/// [`crate::scalar::stage1`] for every tier that returns `Some`.
///
/// ```
/// use parse_that_simd::{PaddedInput, Stage1Spec, StructuralAlphabet, compiled_tiers, scalar, stage1_with};
/// const JSON: Stage1Spec =
///     Stage1Spec::new(StructuralAlphabet::from_parts(b"{}[]:,", &[], b"\""), b" \n", &[]);
/// let input = PaddedInput::from_slice(br#"{"a": [1, true]}"#);
/// let oracle = scalar::stage1(input.as_bytes(), &JSON);
/// for tier in compiled_tiers() {
///     if let Some(got) = stage1_with(tier, input.as_padded(), &JSON) {
///         assert_eq!(got, oracle, "{}", tier.name());
///     }
/// }
/// ```
pub fn stage1_with(
    tier: Tier,
    input: PaddedSlice<'_>,
    spec: &Stage1Spec,
) -> Option<Result<Stage1Index, Stage1Error>> {
    // SAFETY: `run_stage1`'s precondition is exactly `is_supported`.
    tier.is_supported()
        .then(|| unsafe { run_stage1(tier, input, spec) })
}

/// [`stage1_with`] on [`selected_tier`].
pub(crate) fn stage1_selected(
    input: PaddedSlice<'_>,
    spec: &Stage1Spec,
) -> Result<Stage1Index, Stage1Error> {
    // SAFETY: `selected_tier` only returns a supported tier.
    unsafe { run_stage1(selected_tier(), input, spec) }
}

/// # Safety
/// `tier.is_supported()`.
unsafe fn run_stage1(
    tier: Tier,
    input: PaddedSlice<'_>,
    spec: &Stage1Spec,
) -> Result<Stage1Index, Stage1Error> {
    if u32::try_from(input.len()).is_err() {
        return Err(Stage1Error::TooLong { len: input.len() });
    }
    match tier {
        #[cfg(target_arch = "aarch64")]
        Tier::Neon => crate::neon::stage1(input, spec),
        // SAFETY (both x86 arms): the caller guarantees the features.
        #[cfg(target_arch = "x86_64")]
        Tier::Avx2 => unsafe { crate::avx2::stage1(input, spec) },
        #[cfg(target_arch = "x86_64")]
        Tier::Avx512 => unsafe { crate::avx512::stage1(input, spec) },
        #[cfg(all(target_arch = "wasm32", target_feature = "simd128"))]
        Tier::Simd128 => crate::wasm::stage1(input, spec),
        _ => crate::scalar::stage1(input.bytes(), spec),
    }
}

