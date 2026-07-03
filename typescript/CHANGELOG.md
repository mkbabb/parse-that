# Changelog

All notable changes to `@mkbabb/parse-that` are recorded here.

## 1.0.0 — Tranche S (packrat arming + the legacy/chain breaking cut) — 2026-07-03

The keyframes.js Tranche S dispatch (waves S.H1, S.H2, S.H4) — the single **1.0.0**
breaking cut. Two independent motions on disjoint surface — the packrat epoch armed
behind a latch (S.H1) and the `*Span`/`chain` breaking cut (S.H2) — ship in ONE
publish; S.H4 closes the R-dropped ledger rows, records the deliberate non-goals and
the two r6-mandated decisions, and cuts this release. Breaking changes: the `*Span`
surface is removed, the `chainError` parameter is removed, and the packrat epoch is
armed (behavior-preserving, but a source-visible type ripple). This is the **first
leg of Tranche S's single external SPINE**: 1.0.0 reaches keyframes.js ONLY via
value.js's `^1.0.0`-carrying 2.0.x follow-on (kf is parse-that-free), with exactly
one kf re-pin at S.C4/S2 (owner ruling 6).

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

### Removed — BREAKING: the `*Span` surface is excised (S.H2; fold row 48, DQ-2)

- **The 15 closure-based `*Span` builders are DELETED.** `stringSpan`, `regexSpan`,
  `manySpan`, `sepBySpan`, `wrapSpan`, `optSpan`, `skipSpan`, `nextSpan`, `altSpan`,
  `takeUntilAnySpan`, `negateSpan`, `peekSpan`, `notSpan`, `minusSpan`,
  `lookAheadSpan` — deprecated in 0.13.0 (PT-Q4), zero consumers across value.js +
  keyframes.js. `span.ts` is removed wholesale and both barrels (`.` and `./core`)
  no longer export them. This is the **source-breaking** change that makes the cut
  a 1.0.0. The `Span` type and its two helpers (`spanToString`, `mergeSpans`) are
  UNAFFECTED — they operate on the surviving `Span` value, not the deleted
  builders. Gate: **`proof:no-span-surface`** (born-RED against the pre-cut tree,
  reading the built dist surface) — it SUPERSEDES the retired `proof:span-surface-resolved`
  (its deprecate-then-remove disposition is now fulfilled) and folds in
  `proof:span-parser-killed`'s A.W3 falsification record.

### Fixed — BREAKING: `chain()` threads falsy seeds; `chainError` retired (S.H2; C-16, fold row 50)

- **`chain()` no longer drops a falsy-but-valid seed.** The pre-1.0.0 body gated
  the continuation on `state.value || chainError`, so a successful parse whose value
  was `0` / `''` / `false` silently skipped `fn` and returned the seed. The fix is
  C-16 Option A — truly additive: on a successful parse, ALWAYS thread the value:
  ```ts
  if (state.isError) return state;
  return fn(state.value).parser(state);
  ```
- **The `chainError` parameter is retired (breaking).** It was dead-on-error (the
  `isError` branch returns first) and had **zero callers** across value.js +
  parse-that src (recorded scan: the 4 live value.js `.chain()` sites all pass a
  single argument; the identifier appears as live code nowhere). Removed in the
  same 1.0.0 cut — a documented removal, not a silent drop. r6's
  `!state.isError || chainError` was rejected: it would silently resurrect a
  continue-on-error path nothing uses. Gate: **`test/chain.test.ts`** — falsy-seed
  thread (red-then-green), genuine-error short-circuit, and the 0-caller arity scan.

### Ledger closure + recorded decisions (S.H4)

- **DQ-1 / DQ-2 verified landed (fold rows 47, 48).** The two R-dropped ledger rows
  are confirmed against this tree: **DQ-1** (packrat re-entrancy) shipped in 0.13.0
  (PT-Q1) — `proof:packrat-reentrant` GREEN; **DQ-2** (the dead `*Span` API) is fully
  excised by S.H2 — `proof:no-span-surface` GREEN (span.ts gone, zero `*Span` on the
  built dist).
- **`color2Into` (fold row 46) is verified AT THE RE-PIN, not here.** The cross-repo
  `color2Into` WATCH is a value.js dispatch whose green is asserted by the value.js
  suite running against the published 1.0.0 at the later re-pin (born-SPECIFIED — it
  fires at value.js's `^1.0.0`-carrying 2.0.x follow-on, not at this cut). If it
  cannot be verified there, the named exit fires — it is never silently re-WATCHed.
- **Deliberate non-goals of the 1.0.0 cut.** **Token streams · incremental parsing ·
  Squirrel LR · SpanParser resurrection** are out of scope by design. The cut is
  combinator-tier only — **no bbnf-lang / grammar-DSL work** (a separate session's
  job). The SpanParser tagged-union tier stays permanently KILLED (its V8 perf
  hypothesis was falsified; see `docs/future-research.md` §7).
- **Two r6-mandated decisions (recorded).** (**r6 #6**) parse-that is **not**
  zone-partitioned — the subpath export map (`.` / `core` / `diagnostics` / `packrat`
  / `utils`) IS the zone map, and splitting the ~711-LOC `parser.ts` is net-negative.
  (**r6 #8**) zero-copy is **deliberately delegated to value.js's scanner layer** —
  the `*Span` retirement above is the correct direction for the real consumer, not a
  parse-that-side zero-copy build-out.
- **The WDM/LR (Warth–Douglass–Millstein left-recursion) tier keep is PROVISIONAL.**
  Arming (S.H1) makes the packrat/LR tier free for the LL(1) constellation, but this
  is **NOT** a blanket "made free" claim: the latch **never disarms**, so "free"
  holds **only for memoize-free processes**. The tier is kept pending the bbnf-lang
  LR-consumer question (bbnf-lang is the one grammar-DSL that would exercise it); if
  that consumer never materializes, a future cut may retire the tier.

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
