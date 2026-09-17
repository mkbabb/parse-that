SERVED MODEL: claude-opus-5[1m]

# `harness/` — the three instruments, what each proves, and what none of them proves

Authored by **X.P.W1 unit `.e`** at the wave's close, 2026-09-17, under
`value.js/docs/tranches/X/parse-that/waves/W1.md` (sha256
`519df03ff21b48f3b2c4f352d6a4d8ae98c86d3dde117ba786b6c924204c6d09`) §5.e and §4's
`harness/README.md` create row. It is authored **last** by construction: it describes all three
instruments and therefore cannot precede them (§4a).

A parser author in this root can ask three questions and get answers nobody has to defend:

| question                                | instrument                                          | entry                                      |
| --------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| **does it cover the surface we ship?**  | `totality/` — the frozen 52-export corpus           | `node harness/totality/derive.mjs --check` |
| **is it the same engine semantically?** | `equivalence/` — the 403-string differential oracle | `npx tsx harness/equivalence/harness.ts`   |
| **how fast is it, honestly?**           | `bench/` — three legs, one process per cell         | `npx tsx harness/bench/bench.ts`           |

Each subtree carries its own deeper document: `totality/README.md` (unit `.a`) and
`bench/METHOD.md` (unit `.d`). This file is the wave-level index, not their substitute.

---

## 1. `totality/` — coverage is a number the harness prints

**Entry** (run from this root; plain `node`, no loader):

```
node harness/totality/derive.mjs            # writes manifest.json, derived from source
node harness/totality/derive.mjs --check    # asserts manifest vs source, then reports  ← G-1's literal invocation
```

`--check` **writes nothing**: `derive.mjs`'s single `writeFileSync` is in the branch `--check` does
not take. Verified read-only at this seat's clock — `EXIT=0`, stderr **0 bytes**, and
`git status --porcelain` in this root **0 lines** before and after.

**What it proves.** The manifest is **derived by script from value.js `src/css/index.ts` at run
time**, never hand-typed, so it cannot drift from the surface it claims to measure: 52 exports =
**33 types + 19 runtime** (7 grammar · 1 syntax · 3 timeline · 8 stylesheet), cross-checked in the
same process against G-1's own arithmetic (**51 block members + 1 single-line
`export { coerceToSyntax }`**). `--check` compares **counts, name sets, and each name's kind and
slice**, so a _rename_ — which preserves the count — still goes red. It classifies a candidate's
surface **TOTAL / PARTIAL / ABSENT** per-slice and in aggregate, and reports `coverage.md` F-3's
**37 kf-consumed symbols as a separate column, never merged into the 52** (the run prints
`merged: false`).

**What it does not prove.** It is a **surface** instrument: it says a name exists with the right
shape, not that the value behind it is correct. Semantics are §2's question. It measures a
_candidate module_, not a grammar's quality, and it is not a performance instrument.

## 2. `equivalence/` — "same engine", with a taxonomy that cannot quietly widen

**Entry** (see §4 on the loader; the entry name is the gate's address):

```
npx tsx harness/equivalence/harness.ts
```

**It writes `harness/equivalence/equivalence-results.json` on every run** — a full 403-row result
file, which is the point: the run is comparable to the prior one **row by row**, by item id and
provenance tag, not merely by a headline count.

**What it proves.** 403 deduplicated CSS strings, ids `0..402`, provenance published in **both**
aggregations (the raw composite tags and the five-key summary `b:232 · c:84 · seed:70 · d:27 ·
a:19`), hints `stylesheet:121 · value:120 · color:84 · easing:43 · keyframe-selector:22 · sheet:13`,
corpus sha256 `c6649cad…0f0a4ff8`. The taxonomy is imported **verbatim** from
`apotheosis/parser-proof/equivalence.md` §1 and the harness **asserts the class definitions
byte-for-byte** as well as the count — the authority's §1 block is extracted at run time and checked
against the ported copy on **both** handles, pinned in `equivalence/taxonomy.ts` as
`TAXONOMY_BYTES = 683` (UTF-8 bytes; `TAXONOMY_CHARS = 675`, and mixing the two would fail a correct
port for the wrong reason) and `TAXONOMY_SHA256 = 554c2993…5dd963a7` — because a
taxonomy that widens turns a defect into a non-defect and the count goes to zero for the wrong
reason. Only **A** `DIVERGENT_VALUE`, **B** `MIS_ACCEPT` and **C** `FALSE_REJECT_IN_SHAPE` are RED
triggers; `COVERAGE_NARROWING` and `LIVE_STRICTER` are declared non-defects. The 22 ruled
divergence rows and the four preserved DISSENTs print as a **declared-divergence section distinct
from the defect count**, so a divergence that was **ruled** is visibly different from one never
seen. (The class names are in code spans deliberately: their underscores are emphasis markers to a
Markdown formatter, and a bare `DIVERGENT_VALUE` in prose here was measurably rewritten to
`DIVERGENT*VALUE` by a second `prettier --write` pass. A formatter silently altering a receipt's
text is the drift this program measures — unit `.a` recorded the same hazard.)
Unit `.b`'s landed run reproduced **`A/B/C = 0/0/0`**, exit 0, and joined row-by-row to the prior
result file with **0 of 403** rows differing in verdict, source or provenance.

**What it does not prove.** It compares against the **vendored sha-pinned published 4.0.0 tarball**,
never a working-tree dist — so it says nothing about unpublished bytes. It is bounded by its corpus:
"same engine" means _on these 403 strings under this taxonomy_, not universally. Its single
`ENGINE_EXCEPTION` row is the **LIVE** engine throwing on `oklch()` — R1, the shipping crash — and
that is a recorded fact about the incumbent, not a defect of a candidate.

## 3. `bench/` — a bench that cannot silently measure itself in the wrong state

**Entry and argv — this is a CROSS-WAVE CONTRACT.** X.P.W2 §4 binds this entry by name and argv
(_"the bench entry `npx tsx harness/bench/bench.ts`, argv per W1's landed `harness/README.md`"_).
The table below is read from `bench.ts`'s own argv header (`:8–12`) and its parser (`:36–44`).

```
npx tsx harness/bench/bench.ts                                   # the gate's bare invocation
npx tsx harness/bench/bench.ts 2> harness/bench/bench.stderr     # G-5's literal capture form
node harness/bench/diagnostics-suite.mjs                         # the quarantine — its OWN process
```

| flag            | default                        | meaning                                                                   |
| --------------- | ------------------------------ | ------------------------------------------------------------------------- |
| `--rounds=<n>`  | `40`                           | total rounds per cell                                                     |
| `--warmup=<n>`  | `10`                           | leading rounds discarded before the median is taken                       |
| `--out=<path>`  | `harness/bench/bench-raw.json` | raw per-round rows                                                        |
| `--no-finalize` | off                            | skip the `aggregate.mjs` / `finalize.mjs` invocation (rows still written) |

Every flag is optional; the bare invocation is the gate's. The entry writes **only** inside
`harness/bench/`: `bench-raw.json`, `bench-results.json`, and — under G-5's redirect —
`bench.stderr`. `harness/bench/package.json` exists for exactly one reason: to declare
`"type": "module"` for this directory, so node does not walk to a stray ancestor manifest and emit
`MODULE_TYPELESS_PACKAGE_JSON` **on stderr**, which G-5 reads as a failure. It declares no
dependency and installs nothing.

**What it proves.**

1. **It is never armed.** `PACKRAT_ARMED` is a module-global **one-way** latch — declared `false` at
   `:678` of the installed dist's `packrat-entry-*.js`, read at `:682` and `:714`, set `true` at
   `:722` inside `makeMemoized()`, with **no assignment back to false anywhere in the bundle**;
   `resetPackrat()` clears the memo tables and leaves it armed. A harness that arms it in an early
   cell measures every later cell at the armed rate. So each cell is **its own process**, all cells
   are alive simultaneously (no two can share a PID), and each asserts the latch false at **entry
   and at exit** — a startup-only check passes while being wrong from cell two onward. The latch is
   **read**, never inferred: a node loader hook appends one accessor to every module declaring it.
   _"We did not call `memoize`"_ is forbidden as evidence, and a process that has loaded **no**
   latch-bearing module **halts** rather than reporting an unobserved latch as an unarmed one.
2. **Diagnostics are quarantined.** Arming diagnostics couples an unconditional `console.error` on
   the parse path and `enableDiagnostics()` is **process-global (arity 0)** — there is no scoped
   posture. The labelled-failure expectations therefore live in `diagnostics-suite.mjs`, a separate
   file in a separate process that `bench.ts` neither imports nor spawns. The bench's stderr is
   **byte-empty**; the suite's own measured 76 bytes never reach it.
3. **Depth is declared, not discovered.** Every corpus declares its maximum nesting depth, computed
   by script from its bytes, and the run fails if any margin below the `Parser.lazy` ceiling is
   under 1,000. The ceiling is measured **in the census process at its own clock** and never
   inherited: `W1.md` and O-15 read 7,761, this wave's open read 7,759, the census read 7,773. It is
   a property of a **stack shape**, not a constant — which is why the margin, not the number, is the
   assertion.
4. **Three legs, kept separate** — `shared-accepted` · `reject-non-throwing` · `r1-throw-class`.
   The reject leg is its own leg because DEBT-2 makes it one: averaging the legs hides the only axis
   on which the incumbent regex engine genuinely wins. A leg's cell grid is decided by **measured
   disposition**; an engine whose accept/reject/throw tally makes a leg vacuous is printed with its
   tally and **not timed**, and the reason is the measurement.

**What it does not prove.** See §5 — it sets no bar, and it is N = 1.

---

## 4. The loader, and one measured obstruction in this root

`derive.mjs` and `diagnostics-suite.mjs` run under plain `node`. The two `.ts` entries are `.ts`
because their names are gate and cross-wave coordinates; they run under `tsx` and, unchanged, under
plain `node` (node 26 strips types natively).

**Measured obstruction, declared rather than worked around (units `.b` and `.d`, finding D-F5).**
`npx` invoked **with this root as the cwd** does not complete on the authoring box: npm's prefix
walk finds no `package.json` here, climbs to the user's home directory, and the process OOMs at
4 GB (`EXIT=134`). The cause is npm's walk, not the harnesses. Everything in bounds was measured:
the exact binary `npx tsx` resolves runs from here at `EXIT=0` with byte-empty stderr; the same
entries run under plain `node` from here at `EXIT=0`; and `npx tsx <absolute path to the entry>`
from a cwd whose walk terminates runs in ~1.4–2.8 s at `EXIT=0`.

**No file was created in this root to work around it.** A root `package.json`, a root
`tsconfig.json`, a `vitest.config.ts`, or an `npm ci` would each be the `W1.md` §3a
file-bound-expansion trigger that invalidates the wave. The obstruction is **returned** to the
orchestrator, because X.P.W2 §4 binds the literal command: either that coordinate gains a cwd note,
or a later wave's bounds admit a package root here. This wave writes neither.

---

## 5. WHAT NONE OF THESE INSTRUMENTS PROVES

**No bar is set here.** `COHESION.md` §0j.E **OC-1** rules the bench table
**RECORDED-NOT-GATING** — _"admission is decided on correctness … never a floor, never a veto, never
an invented standard"_ — and it **ratifies no bar**. On the parse-that runtime-uplift plane the
`≥10×` floor is **RETIRED AS LAW** and strict-3× / strict-2× / break-even are each `0/5` **OPEN and
UNRATIFIED**; every pass/fail cell on that plane reads **`OWNER-GATED-PENDING-RATIFICATION`** in the
lane's ledger. There is **no ✓/✗ column** in any output here and no sentence of the form _"the bench
passes"_ — the column would be the claim. The historical absolute floors (VALUE ≥ 0.0500 /
SHEET ≥ 0.1000) survive in `bench-results.json` as `historicalFloorsRecordedNotApplied`, with
`appliedTo: "nothing in this file"`; the original gate's own calibration subject failed them on 3 of
5 scenarios, and a bar the calibration subject cannot meet is a broken ruler, not a standard.

**The two planes are never merged.** A value-side drop-in ratio and a parse-that budget in
microseconds answer different questions against different denominators; a number from one is never a
verdict on the other. The lane's ledger,
`value.js/docs/tranches/X/parse-that/evidence/W1/BAR-LEDGER-2026-09-17.md`, keeps them in disjoint
sections and states the rule before either.

**It is N = 1.** One machine, one build, one clock; a same-process hot loop within each cell.
Absolute ns/parse is not portable — the same unarmed subject measured 55.6, 56.4, 58.0 and 93.9
ns/parse across four readings of the same latch. **Read the ratios between interleaved cells of one
process-set. No speed claim exists outside the printed table.**

**These are instruments, not results.** No grammar is written by the wave that built them, no
candidate is implemented, no architecture is chosen, and the dual-target (source-direct JS +
zero-import Wasm) hypothesis remains `OPEN_UNPROVEN` and untouched. **L-16**: every reading these
harnesses emit is SOURCE, API-TEST or BENCH-PROCESS evidence — none of it is a proof of a product.
