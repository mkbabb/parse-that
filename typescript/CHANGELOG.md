# Changelog

All notable changes to `@mkbabb/parse-that` are recorded here.

## Unreleased — Tranche S (the 1.0.0-bound cut: packrat arming + the legacy/chain breaking cut)

The keyframes.js Tranche S dispatch (waves S.H1, S.H2). Two independent motions on
disjoint surface, staged for a single **1.0.0** publish (the version bump and the
publish itself land later, at S.H4 — this section is the payload, not the release).

### Performance — the packrat epoch is armed behind a latch (S.H1; fold row 49)

- **The default parse path no longer allocates the packrat epoch.** `packratEnter`
  opened a fresh epoch — **three Maps (`MEMO`/`HEADS`/`GROWING`)** — at every
  parseState entry boundary, so an LL(1) grammar that never memoizes (CSS values,
  JSON, CSV) still paid a **~30 ns / 3-Map allocation on every top-level parse** for
  machinery it never consulted. Packrat is strictly opt-in, so the epoch is now
  gated behind a `PACKRAT_ARMED` module latch: `packratEnter` / `packratExit` /
  `resetPackrat` are **true no-ops until the first `memoize()` / `mergeMemos()`
  construction** arms the latch (arming at construction, not invocation, so the
  latch is set before any memoized parse can open its epoch). The latch **never
  disarms** — once a memoizer exists in the process the epoch machinery runs for
  every parse, preserving the cross-input + re-entrancy soundness fixes (PT-B1 /
  PT-Q1). The armed memoize path is **byte-identical** to before (left recursion
  soundness holds armed: 2/2).
- **Measured effect (workload-scoped — not a single headline number).** Removing
  the per-parse 3-Map allocation is **mid-teens % throughput on short CSS values,
  negligible on long strings** (the allocation is a fixed per-parse cost, so its
  share shrinks as the parse body grows), and **~34% less retained heap** on the
  short-value corpus. The gain is workload-dependent by construction; a flat
  percentage would misrepresent it.
- **Type ripple.** `packratEnter()` now returns `PackratEpoch | null` (`null` when
  unarmed); `packratExit(saved)` null-guards; `resetPackrat()` early-returns when
  unarmed. Gate: **`proof:packrat-armed`** — a retained-heap clause asserting **N
  non-memoized parses allocate flat (zero packrat Maps)**, run in a **memoize-free
  process** (the latch never disarms, so a stray `memoize()` anywhere in the gate's
  process would arm it and false-RED the flat probe; the gate's poison self-check
  spawns a separate armed child to prove the isolation bites). There is **no
  throughput-% gate** — a percentage threshold is workload-dependent and a
  confirmed flake trap (<2% on long strings).

## 0.13.0 — Tranche Q (the no-deferral terminal: shipped-defect cure + no-legacy retirement)

The keyframes.js Tranche Q constellation drive (dispatch `KF-TO-PARSETHAT-Q.md`).
parse-that is the ROOT of the constellation spine — value.js consumes the corrected
packrat surface transitively; keyframes.js inherits a sound, faster, re-entrancy-safe
parser behind the same facade. A single MINOR: every change is an internal-correctness
fix or a zero-consumer dead-code retirement carrying **no BC obligation** (a
never-importable export is not part of the public contract).

### Fixed — the two shipped packrat defects (the lead; correctness BLOCKERs)

- **PT-Q1 — packrat re-entrancy soundness.** The 0.12.0 cross-input fix put the
  src-epoch reset INSIDE `memoizeFn`, firing per-node whenever `state.src !==
  CURRENT_SRC`. A memoized parser whose `.map` ran a **nested** top-level
  `.parse(differentSrc)` mid-grow then wiped the OUTER grow's module-global state →
  a throw out of the public `.parse()` API. The cure moves the epoch to the
  **parseState ENTRY boundary**: each top-level `parse()` opens a fresh packrat
  epoch (`packratEnter`) with empty tables and restores the parent's snapshot on
  return (`packratExit`), inside a `try/finally` that unwinds the LR machinery on
  any throw. A nested `parse(differentSrc)` now runs against its own clean tables
  and the outer grow resumes against its own un-wiped `MEMO` — re-entrancy SOUND,
  with zero caller discipline. Gate: `proof:packrat-reentrant`.

- **PT-Q2 — the >1MB offset budget.** `getCijKey` masked the offset with a 20-bit
  mask (`& (2²⁰ − 1)`), so a source ≥ 1,048,576 chars silently aliased memo cells
  (`getCijKey(1, 2²⁰+3) === getCijKey(1, 3)`). The offset budget is widened to a
  2³² span — the offset is now added **whole** (no mask), distinct for any
  addressable source — with a fail-loud `RangeError` guard at the float64-safe
  mantissa ceiling (parser id ≤ ~2.1M) so a degenerate input throws rather than
  returns a wrong answer. The two stale `getCijKey` comments are corrected to the
  verified-true rationale. Gate: `proof:packrat-large-offset`.

### Removed — the no-legacy deletions (zero in-realm consumers)

- **PT-Q3 — `Parser.prototype.thenMap` and `fuse()` deleted.** Both were 0.12.0
  speculative fusion seams with ZERO constellation-wide consumers. `thenMap` (a
  `then()+map()` fusion method) optimized a shape no consumer writes; `fuse()` was
  byte-identical to `all()` and not even barrel-reachable (unimportable). Deleting
  them honors parse-that's own substrate-deadcode precept; neither was part of a
  consumable public contract. Gate: `proof:no-dead-combinator`.

- **PT-Q5 — the `dispatch()` 2nd-byte `subTable` widening RETRACTED.** The optional
  `subTable` parameter (a speculative perf seam to flatten a deep first-char
  bucket) shipped in 0.12.0 with ZERO production consumers — value.js's only
  `dispatch()` calls pass a single argument — and was gated only against a synthetic
  corpus no consumer ran. Per the terminal-or-KILL disposition it is retracted:
  `dispatch(table)` is single-arg again. No published contract breaks (no consumer
  passed the 2nd arg). The surviving first-char `dispatch()` primitive — the one
  value.js actually consumes — is unchanged. The `proof:perf` gate's dispatch clause
  is **re-anchored** from the synthetic `ca/cl/cu` toy corpus to the REAL CSS
  function-name bucket (the value.js application shape).

### Deprecated — the `*Span` surface (scheduled for removal in 1.0.0)

- **PT-Q4 — the 15 closure-based `*Span` builders are `@deprecated`.** A
  zero-consumer published surface (`stringSpan`, `regexSpan`, `manySpan`,
  `sepBySpan`, `wrapSpan`, `optSpan`, `skipSpan`, `nextSpan`, `altSpan`,
  `takeUntilAnySpan`, `negateSpan`, `peekSpan`, `notSpan`, `minusSpan`,
  `lookAheadSpan`) kept through 0.12.0 only to honor that release's BC-additive
  promise. Rather than perpetuate a "kept for BC" punt, 0.13.0 tags all 15
  `@deprecated` with a removal-version note (1.0.0) — a recorded removal plan. The
  builders remain exported and functional this release; if a coordinated value.js
  consume adopts one on a real hot leaf, its tag is dropped (the ADOPT upgrade).
  Gate: `proof:span-surface-resolved`.

### Gates

New `proof:*` gates wired into `proof:all`: `proof:packrat-reentrant`,
`proof:packrat-large-offset`, `proof:no-dead-combinator`,
`proof:span-surface-resolved`; `proof:perf` re-scoped (clause B' on the real CSS
corpus + the subTable-retract assertion). Each was authored born-RED (verified to
bite the genuine defect on the unfixed tree) before the cure.

## 0.12.0 — Tranche B

Packrat cross-input soundness fix (the `(id, offset)` + src-epoch BLOCKER),
combinator fusion (`all`/`any` monomorphic sequencers), the SpanParser
tagged-union KILL.
