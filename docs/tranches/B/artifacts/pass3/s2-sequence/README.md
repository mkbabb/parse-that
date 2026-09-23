# Pass 3 S2: source-direct sequence evidence

Date: 2026-07-29

Base: `0067c31e11919444f97237d57735cc274b1782be`

Disposition: **HELD — CORRECTED 96-NAME CI-LOW IS RED**

Release: **NO RELEASE**

Binding amendment:
`../../../audit/PASS-3-S-EVIDENCE-AMENDMENT-2026-07-29.md`.

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

Both sides returned equal products, but the historical harness did not assert
that the property value/span consumed the full name. In Webref order, 487 of
753 inputs were shadowed by an earlier prefix. The historical plane is an
ordered-prefix choice assay, not 753 successful property classifications.

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

## Historical five-process ordered-prefix result

The 753-name sequence plan contains 754 terminal leaves, 4,838 trie states,
130,626 transition cells, and 271,056 bytes of typed tables.

| Plane | Observed minimum | Median | Maximum | Exact bootstrap 95% low |
| --- | ---: | ---: | ---: | ---: |
| rotating success | 60.77× | 71.52× | 85.50× | 60.77× |
| late success | 207.76× | 235.85× | 274.86× | 207.76× |
| unknown-head failure | 560.27× | 570.02× | 677.82× | 560.27× |
| rotating diagnostics-on tail failure | 597.44× | 647.54× | 742.05× | 597.44× |

The bootstrap file enumerates all `5^5 = 3,125` resamples of the historical
five-process median. It does not establish admission because the timing
boundary and semantic denominator were not equal.

Construction cost was 1.85–2.34× the closure graph and amortized after
17.05–23.33 rotating parses. Median retained counters per grammar were
413,337 bytes of closure `heapUsed`, versus 311,323 bytes of candidate
`heapUsed` plus 271,056 bytes of candidate `arrayBuffers`. That approximate
1.41× ratio applies only to the authored-per-leaf-span control. The corrected
harness also records an outer-span control; the corrected 753-name observation
is about 1.36× authored-span and 2.15× outer-span.

## V8 profile

Under heap profiling, three million full-denominator sequence parses took:

- closure: 21,732.26 ms;
- candidate: 321.06 ms;
- ratio: 67.69×.

The CPU profiles contain 16,115 closure samples and 448 candidate samples; 201
candidate samples map to the staged kernel. Source-mapped candidate functions
optimized and had no attributable deoptimization. Candidate construction
helpers were dependency-deoptimized; the complete process deoptimizations
cannot all be called unrelated.

Each historical trace's first 48 GC events were 45 scavenges and three
mark-compacts, not 48 scavenges. Pause observations are not a general
GC-latency claim.

## Scale caveat

The frozen 96-name sequence sample measured:

- rotating success: 9.61×;
- late success: 20.65×;
- unknown-head failure: 62.96×;
- rotating diagnostics-on tail failure: 17.45×.

The corrected five-process whole-name assay runs both sides through
`Parser.parseState`, alternates AB/BA, retains batches, and asserts full
values/spans. Its matched-boundary rotating CI-low is **9.033×**, median
9.655×, and high 9.986×. S2 does not advance. The corrected immutable-result
CI-low is 4.804×.

## Gates and remainder

Local evidence only:

- focused prototype: 6/6;
- strict TypeScript;
- historical equal products, not 753 full-name successes;
- five independent historical processes with an unequal top-level boundary;
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
