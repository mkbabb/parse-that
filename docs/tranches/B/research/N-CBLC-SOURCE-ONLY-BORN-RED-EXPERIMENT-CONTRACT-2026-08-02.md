# N-CBLC source-only born-RED experiment contract

Date: 2026-08-02

Status: **HOLD_BORN_RED — PL-BE ONLY — WORLD NOVELTY REJECTED — SOURCE ONLY — UNDISPATCHED — ZERO PRODUCT/LAW CREDIT**

## Scope and coordinate

This document banks one local research hypothesis. It creates no task,
evidence root, runtime, parser, API, benchmark, fixture, product, package,
consumer, Browser result, candidate, release, or rebind coordinate.

- repository: `/Users/mkbabb/Programming/parse-that-css-totality`;
- branch: `codex/css-totality-combinators-20260729`;
- source coordinate read: `dce5d318fc9cc875f6f5597be60d042dfa15c11e`;
- `typescript/src/parse/state.ts` SHA-256:
  `c25b1b038c62ebd078679b58138fb7be6ae9d6d27288578f00af4bb368ae14cf`;
- N-CBLC implementation or dispatch: `NONE`;
- N-IETM/N2c and N-DNF-BIR authority or credit change: `NONE`.

`N-CBLC` means **Caller-Bounded Lane Cohorting**. The name denotes a private
experiment family only. It is not an API, export, implementation, package
surface, or novelty claim.

## Negative archaeology and retained hypothesis

Two adjacent routes are retired:

1. Fast-success with canonical-failure replay is not a distinct legal plane.
   Ordered-choice overlap and success-side `parseState` observables make a
   deferred canonical failure pass unequal to the original execution.
2. Rollback-horizon coalescing folds into the earlier R, rejected M3, and P6
   transaction/carrier genealogy. Changing checkpoint ownership or encoding
   does not remove its load-bearing rollback cost.

The one retained local hypothesis changes the unit of execution rather than
the grammar, input, or rollback carrier:

> Given multiple already-independent caller-owned UTF-16 strings, can one
> width-generic parse-that combinator graph advance active subsets of lanes and
> produce each lane's complete value/state/diagnostic/fault product directly,
> in caller order, with enough end-to-end consumer savings to clear PL-BE?

The caller supplies the strings and their boundaries. The parser does not
discover, split, concatenate, frame, scan, or index them. A lane is one whole
string and one independent `ParserState`. No source byte or mutable parse state
is shared between lanes.

## Prior-art and honesty ruling

Broad parallel, batched, and SIMD parsing are established. World novelty is
therefore rejected; only the parse-that-specific integration question remains
unproven.

- [ParPaRaw](https://www.vldb.org/pvldb/vol13/p616-stehle.pdf) parallelizes
  delimiter-separated input on GPUs using DFA-state simulation, transition
  vectors, and parallel composition. It establishes parallel parsing but uses
  within-input chunk/context discovery unlike caller-bounded independent
  strings.
- [simdjson](https://arxiv.org/abs/1902.08318) establishes standard-compliant
  SIMD acceleration for JSON on commodity processors. It is format-specific
  and does not establish callback-rich generic combinator lane semantics.
- [Morpheus](https://arxiv.org/abs/2305.07901) makes the effects and arbitrary
  data dependencies of parser-combinator semantic actions explicit as a safety
  problem. N-CBLC therefore receives no callback/effect-safety credit by
  assumption.
- [Parsec](https://dspace.library.uu.nl/handle/1874/2535) treats precise error
  position and the productions legal at that position as observable parser
  behavior. Failure/frontier/expected evidence must remain exact per lane.

No external speed claim is parse-that evidence. A local result may show only
consumer-scoped utility under the frozen experiment below.

## Mechanism invariant

One width-generic runtime applies the same combinator operation to an active
lane subset. Each lane owns its source, mutable state, callbacks, effects,
memo epoch, recovery, diagnostics, fault, recursion depth, and final product.
The operation retires completed or failed lanes from the active subset and
continues the rest. Results are returned in original caller order.

Width `1` uses this exact runtime, graph, entry point, state layout, and result
projection. There is no scalar alternate path, incumbent call, compatibility
branch, or benchmark-only executor.

N-CBLC contains none of the following:

- boundary discovery, shared-buffer slicing, prepass, scanner, or lexer;
- token object/array, token/trivia index, CST, forest, event/capture tape,
  region journal, or delayed typed projection;
- cross-lane or cross-input memo reuse;
- generated artifact, staged/link-time grammar, runtime compiler, or rewritten
  source;
- opcode, program counter, bytecode, instruction loop, generic VM, or
  continuation table;
- FIRST/prefix classification table, parser array dispatch, or grammar-specific
  lane scheduler; or
- scalar fallback, alternate parser, or width-specialized semantic path.

Per-lane use of current `memoize`/`mergeMemo` must remain private to that lane's
ordinary parse epoch. A cache cell, LR head/seed, diagnostic accumulator, or
callback result may never cross lane identity.

## Non-isomorphism law

| Retired family | N-CBLC must prove |
|---|---|
| S | no staged, compiled, traversed, or linked closure substrate; the ordinary width-generic runtime itself owns lane execution |
| C | no FIRST/prefix table, runtime dispatch map, parser array schedule, graph interpreter, or grammar-specific cohort plan |
| V | no opcode, PC, instruction sequence, VM loop, bounce/continuation machine, or encoded grammar |
| E | no event/capture/region output followed by a second typed-product projection; each lane writes its final typed state directly |
| R/M3/P6 | no widened checkpoint owner, rollback coalescing, alternate failure carrier, or shared transaction state |

An implementation translatable to one of those families while preserving its
load-bearing work is PRUNE, not a new mechanism. Lane masks or subsets alone do
not establish non-isomorphism.

## Authenticated parser-name denominator

The exact ordered `parserNames` authority is
`typescript/src/parse/state.ts:193-223` at the bound source SHA. It has 29
unique entries:

```text
01 string          02 regex           03 then          04 or
05 chain           06 map             07 many          08 lazy
09 memoize         10 mergeMemo       11 not           12 minus
13 skip            14 next            15 trim          16 trimWhitespace
17 whitespace      18 wrap            19 sepBy         20 any
21 all             22 opt             23 eof           24 dispatch
25 debug           26 mapState        27 recover       28 peek
29 lookAhead
```

A future source packet must bind the same file bytes, ordered names, count,
uniqueness, and one explicit lane-semantics disposition per name. Missing,
extra, reordered, duplicate, unknown, aliased, or unauthenticated names are
RED. A supported label whose production implementation does not traverse the
lane runtime is also RED.

Callback-rich rows—`chain`, `map`, `mapState`, `lazy`, `debug`, custom `regex`,
and recovery—receive no opaque exemption. They must either preserve exact
per-lane behavior and effect order or kill the whole family.

## Current consumer truth

Read-only source archaeology at contract time found:

- Value has no parse-that dependency;
- every non-definition internal `parseCss*` call is inside Value's CSS-owned
  implementation; non-CSS internal call sites are `0`;
- no caller-owned parse-that/Value batch boundary is implemented; owned batch
  consumers are `0/2`; and
- no N-CBLC product, deletion, API, or migration receipt exists.

Potential callers, workload labels, Keyframes references, and future deletion
do not count as consumers. Two exact production consumers must own existing
batches before a public surface, scalar deletion, or PL-BE admission can be
considered.

## Frozen correctness matrix

### Cases

There are exactly 64 logical cases:

- 32 JSON-shaped and 32 CSS-shaped;
- within each domain: eight behaviors × four UTF-16 classes;
- behaviors: complete success, early failure, late/furthest failure,
  overlapping ordered choice/backtrack, data-dependent chain, callback/effect,
  recovery/diagnostics, and recursion/nesting/fault;
- UTF-16 classes: ASCII, BMP/combining, astral scalar, and lone surrogate.

The CSS-shaped domain is a generic mechanism assay, not CSS conformance,
Webref, WPT, or Value product credit.

### Configurations and arithmetic

The three caller orders are original, reverse, and a frozen interleaved
permutation. Widths are `1`, `2`, `4`, and `8`. Diagnostics are independently
off and on.

For one order/mode pair, the 64 cases require:

```text
width 1: 64 batches
width 2: 32 batches
width 4: 16 batches
width 8:  8 batches
total:  120 batches
```

Therefore:

```text
batch invocations = 120 × 3 orders × 2 diagnostic modes = 720
lane results       = 64 cases × 4 widths × 3 orders × 2 modes = 1,536
state equalities   = 1,536 × 12 observables = 18,432
graph isolation    = 64 × (29 name snapshots + 4 lane assertions) = 2,112
total equalities   = 18,432 + 2,112 = 20,544
```

### Twelve complete `ParserState` observables

Every lane is compared with a fresh scalar control over these exact current
fields, preserving type, holes, `undefined`, `-0`, `NaN`, infinities, ordering,
and deep immutability where required:

1. `src`;
2. `value`;
3. `offset`;
4. `isError`;
5. `furthest`;
6. `expected`;
7. `suggestions`;
8. `secondarySpans`;
9. `diagnostics`;
10. `fault`;
11. `liveDepth`;
12. `maxDepth`.

The control runs the same parser graph and case in its own process/state, not
a recognizer, native parser, handwritten grammar, replay, sink, or digest.

### Graph-isolation checks

For each of the 64 logical cases, all 29 name-keyed graph identities are
snapshotted before and after the lane batch and must be unchanged. Four
additional assertions prove:

1. lane `ParserState` objects and mutable diagnostic containers never alias;
2. callback/effect traces are lane-tagged, exactly-once, and preserve each
   lane's scalar order;
3. memo/LR/recovery/fault/depth state never crosses lane identity; and
4. result index and source identity preserve caller order under lane retirement.

That is `64 × 33 = 2,112` exact graph/isolation checks. A static graph hash
without reference/alias and effect evidence is insufficient.

## Control-of-control matrix

The future source assay has exactly 23 controls judged by the same production
predicates as the candidate:

| Class | Count | Required result |
|---|---:|---|
| clean baseline | 1 | GREEN only when all production predicates and counts hold |
| S/C/V/E forbidden-substrate injections | 4 | each RED under its unique owning code |
| owner-predicate suppressions | 4 | suppressing the owning predicate exposes exactly its injected defect and no other expected-code oracle |
| non-owner predicate retentions | 12 | for each injection, the other three predicates remain byte-identical and do not claim ownership |
| unknown parser name | 1 | RED: exact set mismatch |
| duplicate parser name | 1 | RED: uniqueness mismatch |
| total | **23** | no hardcoded case IDs, selected rows, or shadow validator |

The clean baseline, mutations, suppressions, and retentions all traverse the
same lane runtime/source predicate path. A label-only source search or
mutant-specific validator is fatal.

## Economics matrix and PL-BE law

Performance is formation evidence only after correctness, controls,
consumer-boundary, and source non-isomorphism gates are GREEN.

The comparative rows are:

```text
2 domains × 4 widths × 3 orders × 3 mixes × 2 phases = 144
fixed-cost rows = 8
total economics rows = 152
```

Orders match the correctness matrix. Mixes are homogeneous success,
success/failure/callback divergence, and adversarial lane-retirement pressure.
Phases are build-plus-first/cold and stabilized hot. Equal scalar controls
receive identical strings, parser graph, diagnostics mode, callback/effect
work, and complete immutable products.

The eight separately unit-bearing fixed costs are:

1. shared graph construction time;
2. lane-state/cohort initialization time;
3. active-subset maintenance time;
4. result demultiplexing/order-restoration time;
5. allocation bytes;
6. retained heap and GC time;
7. installed/source package-byte delta; and
8. two-consumer migration and scalar-path deletion cost.

PL-BE is the only eligible law. It retains nanoseconds, allocation bytes,
retained bytes, GC nanoseconds, package bytes, and migration time as explicit
units with declared conversion authority and joint uncertainty. It never
falls through to a raw ratio, PL-2X, or PL-3X. Descriptive lane speedups carry
no strict-law credit. Admission requires PL-BE CI-low `> 0` after every fixed
cost and both live consumers.

Width `1` is a structural equivalence control. Its complete-product
control/candidate speed ratio must have CI-low `>= 1.0`, with no allocation,
package, or semantic regression. It cannot dispatch to a scalar fast path.

## Terminal kill gates

N-CBLC is immediately PRUNE/KILL on any one of these:

1. fewer than two existing caller-owned batch consumers;
2. any inferred boundary, prepass, shared-buffer split, scanner, token, index,
   CST, event/tape, region, forest, or generated/runtime-compiled substrate;
3. any value/state/diagnostic/fault/rollback/recovery/provenance/UTF-16 drift;
4. any callback/effect reorder, duplication, omission, cross-lane read, or
   alias;
5. an unauthenticated, missing, duplicate, unknown, or unhandled parser name;
6. any width-1 correctness, time, allocation, package, or entry-path regression;
7. no measured reduction in closure calls on the exact same graph/product;
8. allocation, retained heap, GC, cohort maintenance, or demultiplexing erases
   gross time savings;
9. more than 50% of observed cohorts are singleton after active-lane
   partitioning;
10. S/C/V/E or another retired-family translation preserves the load-bearing
    work;
11. fixed costs do not amortize over both bound consumer workloads;
12. the scalar path is not atomically deleted after two-consumer acceptance; or
13. PL-BE CI-low is `<= 0`.

There is no partial family credit. A width subset, JSON-only win, diagnostics-
off win, synthetic batch, or future-consumer estimate cannot keep the family
alive after a kill.

## Value and Keyframes denominator quarantine

The external product denominator remains unchanged and entirely uncredited:

| Authority | Count |
|---|---:|
| full Webref raw / active | `1,717 / 1,653` |
| property/function/type raw / active | `1,503 / 1,439` |
| aliases | `64` |
| manual/prose rows | `109` |
| Values 5 overlay | `60` |
| token-equivalent decisions | `25` |
| entry points | `10` |
| tree algorithms | `11` |
| Keyframes references / files | `53 / 51` |

N-CBLC does not implement or validate any of these rows. Value owns CSS
grammar, recovery, typed products, canonical inverses, and UI. Keyframes is a
consumer through Value. No parser-to-Fourier edge exists.

## Dispatch and credit boundary

Disposition: `HOLD_BORN_RED / PL-BE_ONLY / UNDISPATCHED`.

No implementation or prototype is authorized. Before any future dispatch, a
separate owner ruling must bind two live caller-owned batch boundaries, the
exact 29-name source authority, the 64-case bytes, three orders, production
predicates, 23 controls, 20,544 correctness/isolation checks, 152 economics
rows, commands/process isolation, complete products, and raw receipt schema.

This contract grants exactly zero source implementation, correctness,
performance, product, CSS, WPT, Browser, Value, Keyframes, BBNF, package, API,
candidate, release, rebind, deletion, or law credit.

## Terminal receipt

- local hypothesis: `HOLD_BORN_RED`;
- world novelty: `REJECTED`;
- active law: `PL-BE ONLY`;
- authenticated parser-name denominator: `29/29 SOURCE-BOUND`;
- owned production batch consumers: `0/2`;
- correctness invocations/results/equalities executed: `0/720`, `0/1,536`,
  `0/20,544`;
- controls executed: `0/23`;
- economics rows executed: `0/152`;
- implementation, task, root, parser, test, build, benchmark, package, Browser,
  or product execution: `NO`;
- dispatch: `NO`;
- downstream credit: `0`.
