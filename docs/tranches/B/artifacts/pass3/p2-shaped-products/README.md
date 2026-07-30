# P2 shaped-product differential

Status: **CORRECTNESS GREEN; PERFORMANCE RED; STAGED FAMILY KILL; NO RELEASE**

This private transaction composes two complete isolated products from the
same scannerless staged combinators:

1. a recursive JSON value parser with leading/trailing trivia, exact root
   span, arrays, objects, strings, numbers, booleans, null, EOF, and the
   frozen 33-valid/7-invalid corpus;
2. a domain-neutral stylesheet-shaped fixture exercising source names and
   escapes, numbers, dimensions, percentages, quoted strings, URLs, nested
   balanced calls, exact UTF-16 spans, consumer projection, opaque recovery,
   immutable diagnostics, CRLF, astral code units, lone surrogates, and NUL.

The second product is deliberately not a CSS grammar, CSS AST, Value
consumer, public parser, or full-spec claim. Value remains the sole CSS
grammar/consumer owner. The fixture only tests whether the same generic
runtime mechanics can carry the shapes Value later consumes.

The staged graph gained only the two nodes both products consume: `repeat`
and `eof`; separated repetition is ordinary `then`/`many`/`choice`
composition, and recursion uses the already-existing cached `lazy` edge.
Leaves remain source-direct. There is no token, token-event tape, scanner result,
decoded-token object, global trivia layer, source copy, raw-source alias,
fallback parser, generated code, VM, or public API.

## Frozen differential

- Runtime: Node `v26.0.0`, V8 `14.6.202.33-node.19`.
- Control: accepted M2 source at
  `/tmp/parse-that-m2-baseline-20260729/typescript`, commit `de36d57`.
- Scales: 8, 96, and 753 JSON entries or fixture statements.
- Planes: state product, direct value, immutable result projection, and one
  failure for each grammar.
- Timing: eleven alternating AB/BA batches per point; ratio is control median
  divided by candidate median.
- Admission: seven-process exact bootstrap is omitted unless every binding
  estimate is at least 10×.

All 18 successful state/value/result products are exactly equal, including
offsets, spans, successful recovery diagnostics, frontier, labels, and
faults. Both failure products have equal offsets, frontiers, labels,
diagnostics, and faults. The candidate intentionally clears the stale
rejected value through scalar rollback; M2 retains an intermediate array on
the JSON mismatch. That correction is explicit rather than misreported as
byte-for-byte failure-state equality.

The unprofiled `profile-abba.json` records 20 points:

- JSON: **0.8728–1.0021×**;
- stylesheet-shaped fixture: **1.0937–1.2920×**;
- JSON mismatch: **1.1658×**;
- fixture mismatch: **1.2041×**.

No point approaches 10×, so there is no bootstrap and no performance
admission. The retained 96-statement state sample is about **1.173×** the
control heap (`70,739` versus `60,684` bytes per retained result); external
and array-buffer deltas are not used as admission evidence.

## V8 evidence and ruling

The CPU profile identifies garbage collection plus the candidate and M2
diagnostic collectors as the largest timed product work. Native RegExp,
literal dispatch, staged leaf projection, repetition, and rollback remain
visible but do not reveal an order-of-magnitude seam. The mixed
`v8-deopt-gc.log` contains 126 scavenges/mark-compacts, 80 bailouts, and 101
dependent-code invalidations across loading, success, recovery, failure, and
allocation sampling. It is retained as falsification evidence, not a clean
hot-only seal.

The staged full-product family is therefore **KILL**. P2-L already showed
that callback and ASCII leaf replacement loses to native sticky RegExp; this
transaction shows that complete product composition does not recover that
loss. Earlier passes separately falsified a VM, trampoline, event projection,
and generated-code dependency. Reopening those families without a new
consumed mechanism would add a second runtime, not simplify parse-that.

The private product corpus and source remain reproducible evidence. They
grant no public source leaf, `compile`, span wrapper, result API, candidate
pack, consumer receipt, P3, formation proof, admission, release, Value
execution, or BBNF credit.

The ordinary package suite remains 14/14 files and 134/134 tests because the
private product suite is isolated; its focused 8/8 tests, S 13/13
regressions, P2-L 8/8 regressions, strict TypeScript, build, and structural
proofs are green. The unchanged production `proof:perf` was volatile in this
boundary: one fresh run passed at +13.2%, while the sealed artifact rerun is
RED at +25.6% against the 15% threshold. The private-only transaction cannot
cause a production-source regression, but the RED rerun is not waived.
