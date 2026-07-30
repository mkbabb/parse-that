# P2-L generic source-leaf tournament

Status: **CORRECTNESS GREEN; PERFORMANCE RED; NO RELEASE**

This private assay compares three scannerless combinator-leaf families with
the accepted-M2 production `regex` leaf at `de36d57`:

1. `callback`: a generic `sourceLeaf(label, matchEnd, project, firstCodes)`
   whose consumer-owned matcher reads the source directly;
2. `sticky`: the same node with a V8 sticky RegExp matcher;
3. `ascii`: one declarative two-table ASCII run built on the same node.

No family creates tokens, a token/event tape, a scanner result, a second
parse pass, a raw-source alias, or a CSS/domain result. CSS- and JSON-shaped
number, name, escape, and string policies remain fixture-owned. The generic
node commits one end offset and one projected value through the existing
run-state/span/recovery machinery.

## Frozen method

- Runtime: Node `v26.0.0`, V8 `14.6.202.33-node.19`.
- Control: `/tmp/parse-that-m2-baseline-20260729/typescript` at `de36d57`.
- Scales: 8, 64, and 4,096 UTF-16 code units.
- Shapes: ASCII name, CSS-shaped name/escape, CSS number, JSON number, and
  JSON string.
- Planes: captured source plus consumer value projection for both number
  shapes and JSON string.
- Boundary: fresh production `Parser.parseState` versus fresh private
  `StagedParser.parseState`; both return equal values, UTF-16 spans, offsets,
  failure status/frontier/labels, and diagnostics.
- Timing: eleven within-process batches per point, alternating
  control/candidate then candidate/control. The recorded ratio is
  `control median / candidate median`.
- Admission: no bootstrap follows unless every binding point estimate is at
  least 10×.

`profile-abba.json` contains 51 success/failure points. All 51 equal-product
checks are true. Success ratios range from **0.0718× to 1.3079×**; failure
ratios range from **1.1075× to 1.5381×**. No point reaches 10×, so the
bootstrap is correctly omitted.

The manual callback is sometimes faster on an eight-code-unit leaf or an
immediate failure, but loses badly as successful runs lengthen. The
declarative ASCII tables likewise regress longer successes. The sticky
family stays near parity and modestly improves failures, but it does not
justify a second public leaf or compiler seam. This agrees with V8's
documented RegExp tier-up/JIT design and its optimized loop bytecodes:
<https://v8.dev/blog/regexp-tier-up>.

## VM and allocation findings

`p2-source-leaves.cpuprofile` identifies native RegExp bodies, consumer
projection, candidate matchers, parse-state boundaries, and garbage
collection as the principal timed work. `v8-deopt-gc.log` records 355
scavenges, 34 mark-compacts, 140 bailouts, and 105 dependent-code
invalidations across module loading, all families, all shapes, success,
failure, capture, value projection, and heap measurement. It is deliberately
not called a clean hot-only seal. After the second numeric-loop pass removed
out-of-bounds reads, one `Insufficient type feedback for unary operation`
bailout remains in each manual numeric matcher; there is no named
`jsonStringEnd` or `cssNameEnd` bailout.

The retained-heap sample is directional, not formal: stable rows put the
private compiled leaf at roughly 1.9–2.4× the incumbent parser object, while
the first control row is negative from GC noise. No memory admission claim
is made.

V8's profiler and hidden-class guidance are the instrumentation authority:
<https://v8.dev/docs/profile> and
<https://v8.dev/docs/hidden-classes>. The mixed trace is retained because it
falsifies a clean seal; it cannot prove one.

The unchanged production `proof:perf` guard is also sealed here. Its recorded
run is RED at **+82.7%** for JSON versus the checked-in 15% threshold
(`3184ns` current, `1742ns` baseline). This transaction changes only private
prototype/tests/evidence, so it cannot cause a production-source regression;
the gate is nevertheless not waived or converted into formation credit.

## Ruling

- `callback` generic production widening: **KILL**. It is not a speed
  primitive and regresses long successful scans.
- `ascii` table family: **KILL**. It adds retained structure and loses to
  Irregexp as runs lengthen.
- `sticky` wrapper as a new public family: **KILL**. Near-parity success and
  small failure wins do not repay another surface.
- private `sourceLeaf`: **HOLD only as a P2 fixture seam** for composing
  exact shaped products and testing projections; it has no production,
  formation-proof, consumer, API, or release credit.
- production direction: retain the incumbent scannerless sticky RegExp leaf
  unless a later full-product compiler can fuse it with adjacent consumed
  combinators and clear the formal every-scale product bar. Do not replace
  native RegExp with JavaScript character loops.
