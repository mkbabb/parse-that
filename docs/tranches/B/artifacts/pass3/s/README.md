# Pass 3 S: source-direct staged terminal evidence

Date: 2026-07-29

Base: `90d4ec541ac2b6b66e5616b8a703910401daf261`

Branch: `codex/css-totality-combinators-20260729`

Disposition: **ADVANCE THE TERMINAL SUBFAMILY ONLY**

Release: **NO RELEASE**

## Boundary

This prototype tests one generic parse-that proposition: an idiomatically
authored graph of `literal`, `choice`, `map`, and `spanned` combinators can be
compiled into one source-direct terminal without a token array, token event
tape, scanner facade, generated parser, fallback runtime, or CSS-specific API.

It does not implement or own CSS. Value remains the sole CSS grammar,
consumer, canonical-inverse, path/transform, and UI owner. The Webref property
names are assay inputs only and are neither vendored nor exposed by parse-that.

## Frozen input and environment

- Node `26.0.0`; V8 `14.6.202.33-node.19`; Darwin arm64.
- `@webref/css@8.7.1`.
- Tarball SHA-1:
  `481d6fd53548a0248eab2785739835d4cb2fac10`.
- Tarball integrity:
  `sha512-O60bIKYKl5RpLYsWOnOlWzBCEa2NYKapaeg28gOxsjfHHFK51BWRFcwFNJG04lcZxE6yzrEhWzsW35Bjv5RRXA==`.
- Webref counts: 56 at-rules, 162 functions, 817 property rows, 158
  selectors, and 524 types. The assay removes custom properties and legacy
  aliases, leaving 753 canonical property names.
- Frozen closure control:
  `any(...names.map(name => spanned(string(name))))`.
- Candidate:
  `compile(choice(...names.map(name => literal(name).spanned())))`.
- Both sides return the same value, exact UTF-16 span, offset, error bit,
  furthest frontier, expected labels, and diagnostics for all 753 successes
  and a failure case before timing.

## Result

The compact candidate has 4,838 trie states, a 27-code-unit ASCII alphabet,
130,626 transition cells, no cold non-ASCII edge for this corpus, and 271,056
bytes of typed transition/accept/alphabet tables.

Five fresh processes produced these closure/candidate speed ratios:

| Plane | Observed minimum | Median | Maximum |
| --- | ---: | ---: | ---: |
| rotating 753-name success | 76.50× | 79.40× | 80.16× |
| late-branch success | 183.52× | 191.43× | 221.03× |
| ordinary failure | 435.56× | 494.38× | 528.31× |
| diagnostics-on failure | 1740.64× | 1850.77× | 1980.99× |

Construction cost was 1.78–3.72× the closure graph and amortized after
19.12–33.71 rotating parses in these processes.

The median retained counters per constructed grammar were:

| Counter | Closure | Candidate |
| --- | ---: | ---: |
| V8 `heapUsed` | 411,641 bytes | 310,104 bytes |
| `arrayBuffers` | 0 bytes | 271,056 bytes |
| `heapUsed + arrayBuffers` approximation | 411,641 bytes | 581,160 bytes |

The candidate therefore trades about 1.41× approximate retained construction
memory for the measured dispatch gain. `external` is recorded in every raw
file but is not added again because Node includes array-buffer backing in that
counter. This is an explicit cost, not a memory win.

The three-million-parse hot profile recorded 37,674.32 ms for the closure
control and 342.45 ms for the candidate under heap profiling (110.01×). CPU
profiles recorded 23,205 closure samples and 2,370 candidate samples. The
candidate graph accounted for 215 candidate-profile hits. V8 optimized the
candidate `parser`, `parseState`, and `mergeLabels` functions; none of those
functions deoptimized. The complete processes contained 42 and 38 unrelated
driver/dependency/startup deoptimizations respectively.

Both traced processes performed 48 scavenges. Cumulative recorded pause was
18.924 ms for the closure process and 34.019 ms for the candidate process.
The equal count is useful; the pause totals are profiler-run observations, not
a claim that the candidate improves GC latency.

The independent 96-name frozen sample remains above threshold at 12.14×
rotating, 20.62× late success, 65.58× ordinary failure, and 126.54×
diagnostics-on failure.

## Correctness and parsimony changes

- Preserves authored choice priority across prefix collisions and duplicates.
- Recognizes the empty literal at the trie root; this was found and repaired
  during independent audit before the final profiles.
- Preserves exact nonzero-offset and surrogate-pair UTF-16 spans.
- Preserves run isolation and does not mutate the authored graph.
- Uses one compact alphabet table, 16-bit transitions/accepts while the graph
  fits, and 32-bit tables only above that bound.
- Rejects unsupported graph nodes instead of retaining a second execution
  path.

## Gates

Green:

- focused prototype: 5/5;
- strict TypeScript;
- package tests: 134/134;
- production build;
- manifest, CSS-surface, subpath, packrat cross-input, packrat reentrancy,
  large-offset, armed-allocation, no-span-surface, and dead-combinator proofs.

The incumbent production M3 performance proof remains RED and M3 remains a
rejected prototype. This Pass 3 result does not rehabilitate or release M3.

## Ruling and remainder

Advance the mapped/spanned literal-choice terminal representation as the
leading terminal subfamily. Do not yet advance `compile` as a runtime surface.
The measured minimum is a conservative observed floor, not the required
bootstrap CI-low admission proof.

Still open:

1. exact sequence fusion and materialization;
2. arbitrary map/chain boundaries without a fallback runtime;
3. recovery and failure-product equivalence;
4. bounded recursion/SCC handling and memo policy;
5. unordered `&&`/`||` composition;
6. CSS escape/case/identifier/number/string/source-projection terminals;
7. Value-owned full CSS Syntax, VDS, selectors, at-rules, Webref, WPT, and
   browser differentials;
8. live Value/Keyframes consumption;
9. a formal ≥10× CI-low result over the complete equal-product workload;
10. the required Luna critique and final Sol agglomeration, followed by two
    clean adversarial passes.

## Reproduction

From `typescript/`:

```sh
npx vitest run --config test/prototypes/pass3/s/vitest.config.ts
npx tsc --noEmit --project tsconfig.json
node --expose-gc node_modules/vite-node/vite-node.mjs test/prototypes/pass3/s/profile.ts
P3_WEBREF_CSS=/path/to/@webref/css/css.json node --expose-gc node_modules/vite-node/vite-node.mjs test/prototypes/pass3/s/profile.ts
P3_WEBREF_CSS=/path/to/@webref/css/css.json P3_PROFILE_MODE=closure node --expose-gc node_modules/vite-node/vite-node.mjs test/prototypes/pass3/s/hot-profile.ts
P3_WEBREF_CSS=/path/to/@webref/css/css.json P3_PROFILE_MODE=staged node --expose-gc node_modules/vite-node/vite-node.mjs test/prototypes/pass3/s/hot-profile.ts
```

CPU, heap, IC, optimization, deoptimization, GC, five-process raw, sample, and
hot-run artefacts are colocated here. `MANIFEST.sha256` seals their exact
contents.
