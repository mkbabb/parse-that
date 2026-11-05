# Changelog

All notable changes to `@mkbabb/parse-that` are recorded here.

## 2.0.0 — first publication: a general parsing library with four core cures (value.js Tranche X, X.P.W7) — 2026-09-23

The first 2.x published to npm. It is the net of everything below: the `./css` seam that the
2.0.0 history entry describes was added and then retired before publication, so the published
package has no `./css` subpath. On top of that it carries three general-library cures and one documented contract (X.P.W7 `.p`,
value.js COHESION §0ck). Each is a law in `test/x-p-w7-cures.test.ts`.

### Changed — BREAKING: `mapState` becomes the span-carrying `mapSpan`

- **`parser.mapSpan((value, start, end) => …)`** replaces `parser.mapState((next, prev) => …)`.
  The callback receives the parsed value and the `[start, end)` offsets it matched; its return
  value is the new value. A failed inner parse never calls it.
- **Why:** `mapState` handed the callback a view built with `Object.create(state)`, which made
  every live per-parse state a V8 prototype and turned the core's inline caches megamorphic
  (21% of self time in value.js's profile). `mapSpan` hands out no state and copies none, so every
  per-parse state keeps `ParserState`'s one hidden class (`%HaveSameMap`, gate P-1).
- **Migration:** `p.mapState((n, o) => n.ok(f(n.value, o.offset, n.offset)))` becomes
  `p.mapSpan((v, start, end) => f(v, start, end))`. There is no alias.

### Changed — BREAKING: a parse never writes to the console

- `parseState`/`parse` no longer print the error display (`console.error`) on failure. Failure
  evidence travels on the returned state: `furthest` always; with diagnostics enabled also
  `expected`, `suggestions` and `secondarySpans`. `statePrint` and `formatDiagnostic` render it on
  demand.
- With diagnostics off, the failure path moves one number (`furthest`) and allocates nothing: no
  error state, no expected/label arrays, no fresh suggestion or span arrays (gate P-2).

### Fixed — F-p-EOF: an empty-matching regex matches at end of input

- `regex()` no longer fails at end of input before trying its pattern. `/\s*/`, `/a?/` and the
  `whitespace` parser now match `''` at the end of the source exactly as they do mid-input (the
  value is the same as a mid-input empty match); a pattern that cannot match empty still fails
  there with its label (gate P-3).

### Measured, not admitted — a self-patching `lazy`

- A `Parser.lazy` that replaces its own `parser` with the resolved target's function on first
  call was built and measured against these cures on the paired bench. It regressed the JSON
  entry (medians 1.037 and 1.046 in two runs) and read at or above parity elsewhere, so `lazy`
  keeps its closure-local cache (the spec admits the patch only if the bench does not regress).

### Documented — `all()` is positional (the 2.x contract)

- `all(p0, …, pn-1)` yields one array of length n, slot i = pi's value, `undefined` slots kept.

### Kept — the complete-rollback runtime (`90d4ec5`)

- `90d4ec5` was banked as "NO RELEASE" pending a performance admission. Measured against the
  published 0.8.2 on the paired bench (`test/benchmarks/paired/`, one fresh process per cell,
  both arms in-process, 3 reps × 11 rounds, load recorded), HEAD with these cures reads at or
  below 0.8.2 on every entry, twice, so it ships (value.js COHESION §0ck decision 6).

## Pre-release history of 2.0.0 — the CSS surface retires (value.js Tranche X, X.P.W6 / W6R) — 2026-09-23

parse-that is a general parsing library again. The 2.0.0 entry below describes a CSS surface
that no longer exists at HEAD. Neither 2.0.0 nor this entry has been published (npm reads 1.0.0 as
the newest version, 2026-09-23).

### Removed — BREAKING: the `./css` subpath and the CSS surface (`92d8ea7`)

- **The `./css` export is gone** from `package.json`, with everything behind it: the AC-1 grammar
  algebra (`src/css/algebra/**`), its reifier, the JS and Wasm lowerings, the `ac1.wasm` build
  (`src/css/build.mjs`, `scripts/wasm-admission.mjs`), the CSS tests and corpora, the CSS-only
  scripts, and `experiments/w2/ac1-tagless`. `@mkbabb/parse-that/css` no longer resolves.
- **Why:** the owner ruled on 2026-09-23 (value.js COHESION §0by): "No custom grammar, unless it's
  BBNF." The CSS grammar now lives in value.js, authored in BBNF (`src/css/grammar/*.bbnf`) and
  compiled onto parse-that's combinators. parse-that stays the library underneath it.
- **Guard:** `proof:no-css-surface` is restored and fails if a CSS surface reappears.

### Moved — the AC-1 research instruments (X.P.W6R.p, `d129a97`)

- `harness/**` (the equivalence, bench, totality and W2 harnesses) and
  `experiments/w2/{contract,corpus,stage0}` left the repository: 62 files. They measured the
  retired CSS surface, and `harness/equivalence/harness.ts` imported from an absolute job-scratch path
  outside the repository. Their bytes at `92d8ea7` are kept, with a sha256 MANIFEST, in value.js at
  `docs/tranches/X/parse-that/evidence/W6R/`. The package's published files are unchanged by the
  move.

## Pre-release history of 2.0.0 — the CSS seam (value.js Tranche X, X·P) — 2026-09-23

A major version, for two reasons. The package gains its CSS surface, `@mkbabb/parse-that/css`.
The root and `./diagnostics` barrels also lose three runtime exports, and that removal is breaking.

### Added — `./css`: the CSS seam surface (X.P.W2–W5)

- **A new subpath `./css`** (`src/css/build/ac1.js` + `ac1.d.ts`). It publishes the 52 names of
  value.js's frozen `/css` contract: 19 runtime functions and 33 types. The runtime functions are
  `parseCssColor`, `parseCssScalar`, `parseCssValue`, `parseCssValues`, `parseTimingFunction`,
  `parseStylesheet`, `parseKeyframeSelector`, `parseAnimationRange`, `parseAnimationTimeline`,
  `coerceToSyntax`, `serializeCssColor`, `serializeTimelineOptions` and the seven `collect*`
  helpers. Every parser is total: it returns a `ParseResult` and does not throw.
- **One grammar, two lowerings.** The grammar is written once as an algebra
  (`src/css/algebra/**`). It is lowered to parse-that combinators (`lowering-js`) and to a
  WebAssembly module (`lowering-wasm`). The two give byte-identical answers over the harness
  corpora.
- **The Wasm artifact ships in the tarball** at `src/css/build/ac1.wasm`. `node src/css/build.mjs`
  builds it reproducibly. Admission (`scripts/wasm-admission.mjs`) reads 0 imports, 0
  function-kind imports, and empty-import-object instantiation succeeds.
- **CSS Color 5** (X.P.W5.c): `color-mix()` covers every `<color-space>` and every
  `<hue-interpolation-method>`, with percentage normalisation per css-values-5 §6.1. The tests are
  derived from WPT at `5a5b2b59`. `light-dark()` parses both arms and resolves to
  `color_context_required`, because css-color-5 §2 says it is not absolute. The legacy comma forms
  `rgb()`/`rgba()`/`hsl()`/`hsla()` are pinned by WPT.
- **A declaration name may be non-ASCII** (X.P.W5 Repair 1). css-syntax-3 §4.2 counts a non-ASCII
  code point as an ident code point, so `a { Xé: red }` and `--x≡y: red` now parse. The
  declaration-name class had been ASCII-only.
- **Equivalence.** value.js 4.0.0's parsers (pinned commit `6aca8602`) are the oracle for the
  full-surface differential harness (`test/css-equivalence/run-full-surface.mjs`). It reads 0
  mirror-defects, and every declared difference has a row in value.js's `DIVERGENCE-LEDGER.md`.

### Removed — BREAKING: the module-global diagnostics collection (`de36d57`)

- **`collectDiagnostic`, `getCollectedDiagnostics` and `clearCollectedDiagnostics` are no longer
  exported** from `.` or `./diagnostics`. Recovery diagnostics now live on the `ParserState` that
  a parse returns (`ParserState.diagnostics`). The old zero-argument get/clear contract read a
  module-global list, so sequential and nested parses could contaminate each other's diagnostics.
- **`Parser.state` is deleted.** A parser no longer keeps its last result. Read the fresh
  `ParserState` that `parseState` returns.
- Memoized cells now carry source identity, so a cell is never reused across different source
  strings.

### Added — `./packrat`

- `packratEnter` and `packratExit` are exported from `./packrat` (`49ca70b`). The CSS surface's
  latch reader uses them through the package's own subpath.

### Gates at the cut

- `npm test`: 15 files, 148 tests. `proof:manifest` and `proof:subpath` are GREEN.
  `scripts/packed-candidate-surface.mjs` over the packed tarball resolves 52 of 52 seam names from
  the installed bytes, and the 5 forbidden deep specifiers refuse.
- `proof:no-css-surface` was retired at X.P.W5.a (COHESION §0bl), when the CSS surface landed on
  master.

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
