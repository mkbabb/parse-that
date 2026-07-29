# Pass 3 S2: source-direct sequence evidence

Date: 2026-07-29

Base: `0067c31e11919444f97237d57735cc274b1782be`

Disposition: **ADVANCE AS AN ISOLATED COMPOSED-GRAPH PROTOTYPE**

Release: **NO RELEASE**

## Question

Can the advancing source-direct terminal feed an exact transactional sequence
without materializing tokens, expanding a cartesian grammar, delegating to the
incumbent parser graph, or losing values, spans, rollback, and diagnostics?

The equal-product graph is:

```text
sequence(
  choice(...753 authored property literals, each exact-spanned),
  exact-spanned literal(":")
)
```

The closure control is the corresponding parse-that graph:

```text
all(
  any(...753 exact-spanned string parsers),
  exact-spanned string(":")
)
```

Both sides return the same two-value array, both exact UTF-16 spans, final
offset, error bit, rollback offset, furthest failure frontier, ordered expected
labels, and diagnostics. Equality is checked for all 753 successes, the
unknown-property failure, and all 753 property-success/colon-failure cases
before timing.

## Mechanism

- `sequence` is an authored graph node, not a scanner or token stage.
- Each child is compiled independently. The property choice retains the
  compact source-direct trie; the single colon leaf uses a direct
  char-code/string terminal with no table.
- The two-child hot shape is one unrolled transaction. Longer sequences use
  one indexed transaction loop.
- Failure restores offset, value, and parse-owned diagnostic length through
  the existing scalar rollback choke point while preserving the monotone
  furthest frontier and expected labels.
- `map` and `spanned` can wrap a sequence and retain their exact value/span
  semantics.
- A choice of composed sequences is deliberately rejected. There is no
  sequential fallback and no cartesian expansion.

## Five-process full-denominator result

The 753-name sequence plan contains 754 terminal leaves, 4,838 trie states,
130,626 transition cells, and 271,056 bytes of typed tables.

| Plane | Observed minimum | Median | Maximum | Exact bootstrap 95% low |
| --- | ---: | ---: | ---: | ---: |
| rotating success | 60.77× | 71.52× | 85.50× | 60.77× |
| late success | 207.76× | 235.85× | 274.86× | 207.76× |
| unknown-head failure | 560.27× | 570.02× | 677.82× | 560.27× |
| rotating diagnostics-on tail failure | 597.44× | 647.54× | 742.05× | 597.44× |

The bootstrap file enumerates all `5^5 = 3,125` resamples of the five-process
median. This establishes the ≥10× lower bound for this exact full-denominator
sequence assay only. It is not the final full-CSS admission result.

Construction cost was 1.85–2.34× the closure graph and amortized after
17.05–23.33 rotating parses. Median retained counters per grammar were
413,337 bytes of closure `heapUsed`, versus 311,323 bytes of candidate
`heapUsed` plus 271,056 bytes of candidate `arrayBuffers`. The approximate
candidate construction footprint therefore remains about 1.41× the closure
control.

## V8 profile

Under heap profiling, three million full-denominator sequence parses took:

- closure: 21,732.26 ms;
- candidate: 321.06 ms;
- ratio: 67.69×.

The CPU profiles contain 16,115 closure samples and 448 candidate samples; 201
candidate samples map to the staged kernel. Source-mapped candidate functions
optimized and had no attributable deoptimization. The complete processes
contained 17 and 15 startup/driver/dependency deoptimizations respectively.

The closure and candidate traces recorded 195 and 180 scavenges, with 16.354
ms and 10.117 ms cumulative pause respectively. These are profiler-run
observations, not a general GC-latency claim.

## Scale caveat

The frozen 96-name sequence sample measured:

- rotating success: 9.61×;
- late success: 20.65×;
- unknown-head failure: 62.96×;
- rotating diagnostics-on tail failure: 17.45×.

The 96-name rotating plane does not clear 10×. S2 advances because the frozen
standards denominator and its exact bootstrap lower bound clear the bar, but
the short-corpus overhead must remain visible. It prohibits a claim that every
grammar size or individual input is ten times faster.

## Gates and remainder

Green:

- focused prototype: 6/6;
- strict TypeScript;
- all 753 success and tail-failure semantic products;
- five independent full-denominator processes;
- CPU, heap, IC, optimization, deoptimization, and GC artifacts.

Still open:

1. recovery nodes that can return a successful value with immutable
   parse-owned diagnostics;
2. bounded recursion/SCCs and memo policy;
3. unordered `&&`/`||` composition;
4. CSS identifier, escape, number, string, block, source-projection, and
   synchronization leaves;
5. a non-explosive compiled choice for composed graphs;
6. Value-owned CSS Syntax/VDS/selectors/at-rules/Webref/WPT/browser coverage;
7. live Value and Keyframes consumption;
8. Luna critique, final Sol agglomeration, and two clean adversarial passes.

S2 adds no public subpath, CSS type, scanner plane, release candidate, or
successor package.
