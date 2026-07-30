# Pass 3 S7 immutable recovery

Date: 2026-07-29

Source parent: `b7b102035a53911356284558626a0415b330f229`

Control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **HELD — LOCAL RECOVERY GREEN; FORMATION OPEN**

S7 carries the S6 run-owned state through successful recovery and removes
three mismatches between the candidate contract and the timed consumer:

1. collecting a diagnostic now resets the current error frontier exactly as
   accepted M2 does, so a successful recovery returns `furthest = -1`;
2. each parse-owned diagnostic and every nested evidence array/object is
   frozen once at collection, while the outer run-owned list remains an O(1)
   mutable builder during parsing;
3. the consumer projector seals that outer list and reuses the already
   immutable evidence instead of cloning and freezing it a second time.

`Compiled.parseState` now delegates to the sole `StagedParser` boundary.
Tests, hot profiles and matched timings therefore cannot bypass packrat
entry/exit, sticky-fault promotion or diagnostic display. The benchmark calls
the resulting closed `parseState` function directly rather than wrapping it
in a candidate-only arrow.

The candidate and control still return equal values, UTF-16 spans, offsets,
error status, frontiers, expected labels and recovery diagnostics. The
candidate adds a typed non-progress fault; that hostile extension is assayed
separately and is not substituted for M2 behavior in the equal plane.

## Exact seven-process result

Each process preserves eleven AB/BA batches. The confidence files enumerate
all `7^7 = 823,543` resamples of the seven-process median.

| 96-name recovery plane | Exact-bootstrap 95% low | Median | 95% high |
|---|---:|---:|---:|
| matched `parseState` | 10.405× | 10.484× | 10.845× |
| raw internal | 11.285× | 11.869× | 12.588× |
| immutable consumer result | 10.257× | 10.584× | 10.668× |
| late success | 20.569× | 20.946× | 22.001× |
| unknown-head failure | 12.894× | 13.229× | 13.684× |
| diagnostics-on recovery | 39.532× | 40.962× | 43.286× |

| 753-name recovery plane | Exact-bootstrap 95% low | Median | 95% high |
|---|---:|---:|---:|
| matched `parseState` | 79.634× | 81.730× | 131.240× |
| raw internal | 88.585× | 100.253× | 103.219× |
| immutable consumer result | 75.499× | 77.216× | 88.642× |
| late success | 215.153× | 221.696× | 235.800× |
| unknown-head failure | 99.144× | 101.971× | 110.612× |
| diagnostics-on recovery | 657.352× | 666.842× | 721.426× |

One 96-name result process measured 9.792×. It remains in the raw seal; the
predeclared exact-bootstrap median lower bound, not an observed minimum,
governs admission. Earlier exploratory runs were invalidated whenever source
or the timed boundary changed and are not mixed into this seal.

These results close only the local S terminal/sequence/recovery family. They
do not establish full CSS recovery, bounded recursion, unordered
composition, CSS-needed leaves, live Value/JSON consumption, full-subject
P1→P2→P3, formation Clean A/B or formation admission.

## Correctness and package evidence

- Focused hostile suite: 9/9 green, including two successful recoveries in
  one run, immutable diagnostics and nested evidence, frontier reset,
  duplicate-label de-duplication, transactional rollback and typed
  non-progress fault.
- Package suite: 14/14 files and 134/134 tests green.
- Strict TypeScript and build: green.
- Manifest, no-CSS-surface, subpath, packrat cross-input/reentrant/
  large-offset/armed, no-span-surface and no-dead-combinator checks: green.
- The unchanged production JSON performance guard is green at +11.2%
  against its 15% threshold; it remains a regression guard and supplies no
  formal S admission credit.

## Profile findings

The 753-name, three-million-parse recovery profiles observed 266.447 ms
staged and 27,981.108 ms closure. Staged top self samples were 103 in the
compiled sequence, 26 in `StagedParser.parseState`, ten in diagnostic
collection and 31 in GC. The closure profile put 7,179 in `stringParser`,
3,103 in `anyParser`, 1,411 in rollback and 1,013 in frontier merging.

The V8 trace reports 45 scavenges, three mark-compacts, 41 bailouts and 29
dependent-code deoptimizations across the complete vite-node process. No
named bailout targets a candidate state, boundary, diagnostic or kernel
function.

The standalone IC assay found only monomorphic transitions in the staged
boundary, recovery runner and diagnostic collector. One `charCodeAt`
transition in the compiled sequence became polymorphic across mixed source
string representations; no candidate site became megamorphic. The compact
method/count summary is banked; the 2.9 MB raw IC log is not.

## Source and standards seal

- Kernel SHA-256:
  `9d38040b6ab0a3f47c1c5bc9e85ae3b83eb214a07ac09fe9f30b2a19720a0839`.
- Focused test SHA-256:
  `38a5761b16d1b07a466e00b422937c6c530f72112b5a2833023ab48485bd1ce1`.
- Profile SHA-256:
  `6913480bc29a0a1bfd4f4377d4c862de67142a903935aee188754ff68770ee69`.
- Hot profile SHA-256:
  `e15db7af54090ffda6e5078ad8ecc6504ade559cc24835d7d83a9f41523ed906`.
- Consumer result SHA-256:
  `a8e51a026e1dca7e70c0dacc8788d57b0433b1c593db29975446f1f874f0721f`.
- Run state SHA-256:
  `9aa675078eb4b11e4112cad4a4ef0653e289a900d07a414a7adf107a48b8360f`.
- Node `26.0.0`; V8 `14.6.202.33-node.19`; Darwin arm64.
- `@webref/css@8.7.1`, SHA-1
  `481d6fd53548a0248eab2785739835d4cb2fac10`, integrity
  `sha512-O60bIKYKl5RpLYsWOnOlWzBCEa2NYKapaeg28gOxsjfHHFK51BWRFcwFNJG04lcZxE6yzrEhWzsW35Bjv5RRXA==`.
- No CSS grammar, scanner/token plane, production file, public subpath,
  candidate pack or release is introduced.
