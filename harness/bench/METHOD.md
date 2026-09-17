SERVED MODEL: claude-opus-5[1m]

# The honest bench — method, argv, and what it does not prove

Authored by X.P.W1 unit `.d` under `docs/tranches/X/parse-that/waves/W1.md` §5.d (gates G-4, G-5,
G-9, G-10). Unit `.e` folds this into `harness/README.md` at the wave's close; the argv table below
is the cross-wave coordinate **X.P.W2 §4 already binds** (_"the bench entry `npx tsx
harness/bench/bench.ts`, argv per W1's landed `harness/README.md`"_).

## Entry and argv

```
npx tsx harness/bench/bench.ts                                   # run from <p2>
npx tsx harness/bench/bench.ts 2> harness/bench/bench.stderr     # G-5's literal capture form
node harness/bench/diagnostics-suite.mjs                         # the quarantine — its OWN process
```

| flag            | default                        | meaning                                              |
| --------------- | ------------------------------ | ---------------------------------------------------- |
| `--rounds=<n>`  | `40`                           | rounds per cell                                      |
| `--warmup=<n>`  | `10`                           | leading rounds discarded before the median is taken  |
| `--out=<path>`  | `harness/bench/bench-raw.json` | raw per-round rows                                   |
| `--no-finalize` | off                            | skip the `aggregate.mjs` / `finalize.mjs` invocation |

Every flag is optional. The bare invocation is the gate's. The entry writes **only** inside
`harness/bench/`: `bench-raw.json`, `bench-results.json`, and (under G-5's redirect)
`bench.stderr`.

**On the loader.** The entry is `.ts` because the name is a cross-wave contract. It runs under
`tsx` and, unchanged, under plain `node` (node 26 strips types natively). `harness/bench/package.json`
exists for one reason: to declare `"type": "module"` for the files this unit authored, so that node
does not walk up to a stray ancestor `package.json`, find no type, and emit
`MODULE_TYPELESS_PACKAGE_JSON` on stderr — which G-5 reads as a failure. It declares no dependency
and installs nothing.

## The three structural changes, each traceable to a measured fact

**1. One fresh process per cell (O-15 PT-03).** `PACKRAT_ARMED` is a module-global one-way latch:
declared `false` at `:678` of the installed dist's `packrat-entry-*.js`, read at `:682` and `:714`,
set `true` at `:722` inside `makeMemoized()`, with **no assignment back to false anywhere in the
bundle** — `resetPackrat()` clears the memo tables and leaves the latch armed. A harness that arms it
in an early cell measures every later cell at the armed rate. Each cell is therefore its own process;
all cells are alive simultaneously, so no two can share a PID; and each asserts the latch false at
**entry and at exit**, because a startup-only check passes while being wrong from cell two onward.

The latch is **read**, never inferred. It is a module-local binding that nothing exports, so a node
loader hook appends one accessor to every module declaring it — the installed dist chunk always, plus
whatever copy an engine bundle inlines — and the cell calls that accessor. `"We did not call
memoize"` is forbidden as evidence (W1.md §3a), and a process that has loaded **no** latch-bearing
module HALTS rather than reporting an unobserved latch as an unarmed one. The reader is proved to be
a live read, not a constant, by the positive control in `diagnostics-suite.mjs`.

**2. Interleaved cells, 40 rounds, first 10 discarded, median of the scored rounds, printed sink.**
Round _r_ measures every cell once, in order, before round _r+1_ begins, so cells share machine state
round-for-round. The median is reported rather than the peak the ported bench reported: a peak is the
luckiest round on a shared box. Every result feeds a sink that the run prints, so no parse can be
elided as dead code. `aggregate.mjs` prints the dispersion of the scored rounds and the discarded
rounds beside them, so the warmup's cost is visible rather than asserted.

**3. Three legs, kept separate.** `shared-accepted` (every engine accepts every item) ·
`reject-non-throwing` (the engine refuses by returning a failure) · `r1-throw-class` (the degenerate
cross-product on which published 4.0.0's `parseCssColor` crashes). The reject leg is its own leg
because the adjudication's DEBT-2 makes it one — averaging the legs hides the only axis on which the
incumbent regex engine genuinely wins. A leg's cell grid is decided by **measured disposition**: an
engine whose accept/reject/throw tally makes a leg vacuous is printed with its tally and NOT timed,
and the reason is the measurement.

## Depth (G-9)

Every corpus declares its maximum nesting depth, computed by script from the corpus bytes. The census
cell measures the `Parser.lazy` ceiling **at its own clock, in its own process**, and the run fails if
any corpus's margin below it is under 1,000. The ceiling is never inherited: W1.md and O-15 PT-04 read
7,761, this wave's own open read 7,759, and a process with a different module graph reads different
again. It is a property of a stack shape, not a constant — which is why the margin, not the number,
is the assertion. `Parser.lazy` has arity 1 and its failure at the ceiling is a thrown `RangeError`,
not an `ok:false`, so an input near it kills a cell instead of reporting.

## What this bench does not prove

It sets **no bar**. COHESION §0j.E OC-1 rules the bench table **RECORDED-NOT-GATING**; Plane B's
strict-3× / strict-2× / break-even are each `0/5` OPEN and **UNRATIFIED**, and every pass/fail cell on
that plane reads `OWNER-GATED-PENDING-RATIFICATION`. There is no ✓/✗ column here and no sentence of
the form "the bench passes" — the column would be the claim. The historical absolute floors
(VALUE ≥ 0.0500 / SHEET ≥ 0.1000) are recorded in `bench-results.json` for lineage and applied to
nothing; the gate's own calibration subject failed them on 3 of 5 scenarios, and a bar the calibration
subject cannot meet is a broken ruler, not a standard.

It is **N=1**: one machine, one build, one clock, a same-process hot loop within each cell. Absolute
ns/parse is not portable — this wave's open measured the same unarmed subject at 56.4 then 58.0
ns/parse against 55.6 in the spec and 93.9 in O-15. Read the ratios between interleaved cells of one
process-set. **No speed claim exists outside the printed table.**

It measures **engines, not grammars**: no grammar is written by this wave, no candidate is
implemented, and the dual-target hypothesis is untouched.
