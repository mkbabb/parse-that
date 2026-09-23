# Pass 3 S6 run-owned successor state

Date: 2026-07-29

Source parent: `ed0ccdda420b57fdd56bf62ccc9e5cc4ebb1117e`

Control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **HELD — LOCAL TERMINAL/SEQUENCE GREEN; FORMATION OPEN**

S6 replaces the private prototype's dependence on production `ParserState`
with one fresh, run-owned scalar state. It shares frozen empty evidence,
copy-on-writes recovery diagnostics, centralizes rollback, and compares the
accepted-M2 `Parser.parseState` boundary with a candidate `StagedParser`
boundary that performs packrat entry/exit, sticky-fault promotion and
diagnostic display. This is a prospective successor boundary, not a released
public API.

The terminal loop now relies on `charCodeAt` returning `NaN` out of bounds,
avoiding a separate length guard. The unique longest-first terminal table
uses its selected terminal index as the failure-label prefix and no longer
loads a redundant label-limit table on that hot path.

Successful consumer projection now returns only `kind`, `value` and
deep-frozen diagnostics. Failure and fault results retain immutable
offset/furthest/expected provenance. The TypeScript success envelope is
readonly but deliberately is not `Object.freeze`d: parse-that owns provenance
and immutable recovery evidence, while Value owns its top-level CSS result
shape. Timing a parser-owned wrapper that no consumer has requested would
both widen the runtime and measure the wrong ownership boundary.

## Exact seven-process result

Each process preserves eleven AB/BA batches. The confidence files enumerate
all `7^7 = 823,543` resamples of the seven-process median.

| 96-name plane | Exact-bootstrap 95% low | Median | 95% high |
|---|---:|---:|---:|
| matched `parseState` sequence | 10.020× | 10.259× | 10.889× |
| raw internal sequence | 11.022× | 11.179× | 11.364× |
| consumer result | 10.263× | 10.338× | 10.777× |
| late success | 24.094× | 25.066× | 25.573× |
| unknown-head failure | 42.200× | 43.219× | 44.107× |
| diagnostics-on tail failure | 30.539× | 31.085× | 31.471× |

| 753-name plane | Exact-bootstrap 95% low | Median | 95% high |
|---|---:|---:|---:|
| matched `parseState` sequence | 72.853× | 79.513× | 81.751× |
| raw internal sequence | 75.768× | 80.375× | 97.646× |
| consumer result | 76.902× | 83.046× | 86.981× |
| late success | 251.283× | 277.834× | 292.315× |
| unknown-head failure | 330.983× | 338.746× | 345.895× |
| diagnostics-on tail failure | 624.842× | 695.850× | 729.646× |

The first five-process seal contained a 9.586× matched observation and a
9.780× result observation. Source, thresholds and comparison plane were not
changed. Two additional predeclared independent processes expanded the seal
to seven; the exact seven-process lower bounds above are the admission
numbers. This disclosure prevents the later green bound from erasing the
observed variance.

These results close only the local S terminal/sequence family. They do not
admit formation. Equivalent ≥10× lower bounds for recovery, recursion,
unordered composition, CSS leaves and the live Value/JSON consumers remain
open, as do formation P1→P2→P3 and both formation-clean passes.

## Correctness and package evidence

- Focused hostile suite: 9/9 green.
- Package suite: 14/14 files and 134/134 tests green.
- Strict TypeScript and build: green.
- Manifest, no-CSS-surface, subpath, packrat cross-input/reentrant/
  large-offset/armed, no-span-surface and no-dead-combinator checks: green.
- The unchanged production JSON performance guard: green on the final
  isolated rerun at +4.6% against its 15% threshold (the preceding green
  observations were +1.4% and -1.2%). It is a regression guard, not formal S
  admission.
- Shared frozen empty evidence cannot leak between runs; the first recovery
  diagnostic causes copy-on-write.
- Duplicate choice labels remain de-duplicated at nonzero offsets.
- Successful recovered output carries deep-frozen diagnostics while strict
  leaf parsing remains failure-explicit.

## Profile findings

The 753-name, three-million-parse CPU profiles put 76 staged self samples in
the compiled terminal loop, 27 in `StagedParser.parseState`, six in
`RunState`, and nine in GC. The matched closure puts 4,275 in `stringParser`,
2,108 in `anyParser`, 1,131 in rollback, 777 in error-frontier merging and 17
in GC. Hot elapsed observations were 167.179 ms staged and 18,170.717 ms
closure.

The full V8 trace reports 44 scavenges, three mark-compacts, 38 bailouts and
29 dependent-code deoptimizations across vite-node, loaders, source maps and
the benchmark. No named bailout targets `RunState`, `StagedParser.parseState`
or the compiled kernel; anonymous OSR events prevent a stronger claim.

A standalone bundled `--log-ic` run observed only initialization and
monomorphic `0→1` transitions in `RunState`, `parseState` and the compiled
sequence address ranges; it observed no candidate polymorphic or megamorphic
transition. Raw 40 MB vite-node and 2.8 MB standalone IC logs are deliberately
not banked. `profile/summary.json` records the method and counts, while the
CPU profiles and deopt/GC trace remain reproducible raw evidence.

## Standards and environment seal

- Kernel SHA-256:
  `fc1f9947c2ea13075c6574b82e1f0d6ea884b6c93cc881d2d916f7a0a55ac8e7`.
- Focused test SHA-256:
  `61e010c512252aa03753504ebdc01c20fdadbc7455dfd5a4a1c13dcd82d03b13`.
- Profile SHA-256:
  `0f4925e0e51cdab098a4ccbfb8e748d7881956f304271d90c6a7c4e4c5b85764`.
- Hot profile SHA-256:
  `ebfd9575a42825a4aea81241691423181d4f17fbe70c70ab86868b6a7ab52ad3`.
- Consumer result SHA-256:
  `e0488945d455b5936539465c99c8dcf15cb0ca530dc2e287552fc07a866247de`.
- Run state SHA-256:
  `0468862b95a6094cdd0c201918f9d504bab75f00e3c29b7888f76abe045a1c56`.
- Node `26.0.0`; V8 `14.6.202.33-node.19`; Darwin arm64.
- `@webref/css@8.7.1`, SHA-1
  `481d6fd53548a0248eab2785739835d4cb2fac10`, integrity
  `sha512-O60bIKYKl5RpLYsWOnOlWzBCEa2NYKapaeg28gOxsjfHHFK51BWRFcwFNJG04lcZxE6yzrEhWzsW35Bjv5RRXA==`.
- The 96-name assay is the frozen even sample; the 753-name assay contains
  every non-custom, non-legacy-alias Webref property.
- No CSS grammar, scanner, token plane, production file, public subpath or
  release is introduced.
