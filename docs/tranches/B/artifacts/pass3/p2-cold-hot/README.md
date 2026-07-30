# P2-C cold/hot dispatch assay

Date: 2026-07-29

Accepted-M2 control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **CORRECTNESS GREEN; COMPILED TABLE KILL; PERFORMANCE RED; NO BOOTSTRAP; NO RELEASE**

## Subject

This private, scannerless assay closes P1's cold/hot dispatch row against the
current staged kernel. It uses the 753 canonical, non-alias, non-custom
property names from `@webref/css@8.7.1` at frozen scales
4/8/16/33/96/753. Every parser returns an authored UTF-16 span and must reach
EOF; the failure product is also compared exactly.

The accepted-M2 control is the idiomatic `any(...string()).skip(eof())`
expression with equal per-arm span projection. The candidate is the staged
`choice(...literal().spanned()).eof()` graph. Before timing, the harness
compares complete values, offsets, spans, error status, frontier, labels,
diagnostics and faults.

Five planes are measured with eleven alternating AB/BA batches:

- grammar construction;
- construction plus the first complete parse;
- stabilized hot parsing;
- stabilized parsing across six alternating grammar shapes;
- stabilized failure.

An independent eight-name UTF-16 corpus forces five non-ASCII FIRST edges,
including BMP and astral-leading names. No CSS type or grammar rule enters
parse-that; names are only a frozen source-direct dispatch corpus.

## Frozen input

- Package: `@webref/css@8.7.1`
- npm tarball SHA-256:
  `5bab9172d75ed7eae949ea054e1a9465e213ee95004e52e8cc5705dd2278d426`
- `css.json` SHA-256:
  `f51f851e2f1f0ed39839f79b8dab35bb0aa398afbbcf0a110b18ac445d98aef2`
- Ordered 753-name list SHA-256:
  `3094a4c78013d5ab853574ac0e6206c735dad5dbab9e9ba1842b1b7daab84d8a`

`properties-753.json` preserves the exact derived list rather than relying on
a mutable package installation.

## Equal-plane performance

Ratios are accepted-M2 control/candidate medians:

| Names | Construction | Build + first parse | Stabilized hot | Alternating shapes | Failure hot |
|---:|---:|---:|---:|---:|---:|
| 4 | 0.0597× | 0.0846× | 0.8640× | 0.8580× | 3.1073× |
| 8 | 0.0624× | 0.0763× | 0.9496× | 0.9087× | 3.1915× |
| 16 | 0.0697× | 0.0747× | 1.3479× | 1.3741× | 6.5103× |
| 33 | 0.0742× | 0.0766× | 1.9730× | 2.6005× | 11.5518× |
| 96 | 0.0749× | 0.0696× | 3.7572× | 5.7236× | 21.2509× |
| 753 | 0.0785× | 0.0840× | 10.3800× | 19.1611× | 97.2095× |

The candidate is approximately 12.7–16.8× slower to construct and
11.9–14.4× slower for construction plus the first parse. Stabilized success
loses at 4/8, reaches only 1.35–3.76× at 16/33/96, and clears 10× only at the
largest 753-name point. Alternating grammar shapes do not change the
small-scale ruling.

The UTF-16 cold-edge plan contains five `cold` map edges. It reaches only
1.4996× stabilized and 0.1406× build-plus-first-parse.

Every binding scale does not clear 10×, so exact-bootstrap sampling would add
no decision information and was not run.

## Allocation and profile evidence

The 4-member retained-heap control sample is negative and unusable. At
8/16 members candidate grammar heap is approximately 1.34×/1.01× control; at
33/96/753 it falls to approximately 0.81×/0.76×/0.66×. Candidate result heap
is smaller in the stable 16–753 rows. Those favorable large-scale memory rows
do not waive the cold and small-scale throughput failures.

The mixed CPU profile is dominated by garbage collection and
`buildTerminalTable`, which accounts for the construction loss. The V8 log
contains 438 Scavenge/Mark-Compact lines, 59 bailout lines and 213
dependent-code marking lines. It includes loaders and both candidates, so it
is not a clean hot-only optimizer seal.

The unchanged production `proof:perf` guard is green at +6.3% JSON and 73.5%
faster first-character dispatch. It is a regression guard, not formal
admission and not causal evidence for this private prototype.

## Ruling

The compiled terminal-table family is terminally retired as the general
runtime candidate:

- compilation dominates cold work;
- small and middle exact-product success planes miss 10×;
- Unicode cold edges miss the floor;
- the one 753-name hot point cannot waive smaller scales, cold starts or
  exact-bootstrap absence;
- retaining a separate compiled fast path would violate the one-runtime and
  two-consumer laws.

The generic laws established by S7 remain useful: run-owned scalar state,
single rollback, immutable recovery evidence and consumer-owned result
projection. The staged graph, prefix table and compiled parser surface do not
advance. P2 remains open for row-complete reconciliation; P3, formation
proof, execution, consumers and release receive no credit.
