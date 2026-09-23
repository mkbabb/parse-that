# Pass 3 S8 bounded recursion

Date: 2026-07-29

Source parent: `b1f99b4b5418ea3964c0fa19187ad728d2dff825`

Control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **HELD — CORRECTNESS GREEN, PERFORMANCE RED; FORMATION OPEN**

S8 carries S7 into parse-owned bounded recursion without reviving the killed
V/K VM or trampoline families. It retains two incompatible private research
families because the evidence does not justify agglomeration:

1. **Generic cached recursion** adds a `lazy` graph edge, cached graph
   compilation, generic choice, exact `next`/`skip`, parse-owned live and
   maximum depth, and a sticky typed `Nesting` fault before the host stack.
   It supports mutual recursion and arbitrary sequence/map products, but is
   materially slower than accepted M2 on successful recursive products.
2. **Balanced-discard fusion** recognizes the authored
   `lazy(choice(open.next(self).skip(close), leaf))` graph and lowers only
   that exact generic combinator meaning into one source-direct runner. It
   materializes no token, scanner result, event tape or second parser route.
   It is valid only when the authored grammar discards delimiters and nesting
   structure. It does not prove recursive CSS AST construction and is not a
   proposed public combinator or API.

Both families preserve equal values, authored UTF-16 leaf spans, offsets,
error state, failure frontier, expected labels and diagnostics on the timed
accepted-M2 plane. Candidate-only hostile evidence separately proves a
configured resource fault before `RangeError`.

## Correctness result

The focused hostile suite is 13/13 green. It proves:

- depth-10 recursive sequence/map success and depth-10,000 typed termination;
- configurable positive safe-integer limits;
- sticky `{ kind: "Nesting", offset, limit }` without fallback execution;
- live depth returns to zero and maximum depth remains monotone;
- consuming mutual recursion;
- balanced-discard fusion preserves the inner authored span;
- missing close rolls back to offset zero while retaining the exact close
  frontier and label;
- a throwing user projection restores live depth;
- all prior S7 terminal, span, transaction and immutable-recovery laws.

The package suite is 14/14 files and 134/134 tests; strict TypeScript,
production build, manifest, no-CSS-surface, subpath, packrat, no-span and
no-dead-combinator proofs are green. The unchanged production JSON point
guard is green at +9.0% against its 15% threshold. These package gates do not
convert the RED recursion performance rows into admission.

## Performance result

These are single-process, eleven-batch AB/BA point estimates, not confidence
bounds. A RED point estimate cannot advance to exact-bootstrap admission.
Depth is 16; the leaves are deterministic samples of the frozen
`@webref/css@8.7.1` 753-property denominator.

| Family / scale | success | raw internal | consumer result | failure | diagnostic failure |
|---|---:|---:|---:|---:|---:|
| generic / 96 | 1.270× | 1.212× | 1.331× | 26.735× | 11.384× |
| fused / 96 | 8.400× | 8.842× | 8.561× | 213.356× | 14.133× |
| fused / 753 | 57.819× | 61.403× | 61.507× | 3479.009× | 44.857× |

The result is binding:

- generic recursive success/result is **RED** and cannot replace the closure;
- balanced-discard fusion is **RED** at the 96-leaf binding scale despite a
  large full-denominator signal;
- the 753-leaf signal keeps the fusion available for later consumer
  adjudication but grants no P1/P2/P3, formation or release credit;
- no multiprocess bootstrap is run for a family that already fails its point
  estimate.

A final-source one-process S7 recovery replay remains green at 10.527×
matched, 12.263× internal, 10.130× result, 20.600× late, 12.706× failure and
40.654× diagnostic failure. This is a regression check only. S7's admitted
local evidence remains its immutable `20b5f52` source and seven-process seal;
the replay does not transfer that credit to S8.

## CPU, GC and deoptimization findings

The generic 96-leaf CPU profile assigns candidate samples primarily to the
per-depth anonymous runners, terminal alphabet lookup, label merging and
rollback. That corroborates the RED success/result measurements.

The fused 753-leaf CPU profile puts construction outside the hot path and
concentrates candidate samples in the closed source-direct runner. The mixed
96-leaf trace recorded 30 scavenges, three mark-compacts and 99 bailout
lines across candidate, baseline, loaders and source maps. Candidate
`parseState` and `mergeLabels` each deoptimized for insufficient named-access
feedback when the assay switched from diagnostics-off to diagnostics-on.
This is candid mixed-mode evidence, not a clean hot-only deopt seal.

## Source seal

- Kernel SHA-256:
  `21f253080b49fb4834dbaaa96e2a440f08f257476af1e80eb2813e160ed9863d`.
- Focused test SHA-256:
  `1e4ccf29ca18cf3912fd8d9f73f63d0434c60919af95fbd01d25597e818ce67a`.
- Run state SHA-256:
  `33ba7f6e7791241d0b46d490fb95437c1707f88c2dc2951b999394ae2c046033`.
- Recursion profile SHA-256:
  `279808548cd0c5d61510f0c359c43ebfca6fae27fa9dc73dd5f6725e73f83fab`.
- Node `26.0.0`; V8 `14.6.202.33-node.19`; Darwin arm64.
- `@webref/css@8.7.1`, SHA-1
  `481d6fd53548a0248eab2785739835d4cb2fac10`, integrity
  `sha512-O60bIKYKl5RpLYsWOnOlWzBCEa2NYKapaeg28gOxsjfHHFK51BWRFcwFNJG04lcZxE6yzrEhWzsW35Bjv5RRXA==`.

No production file, public export, CSS grammar, candidate pack or release is
introduced.

## Remainder

Recursion stays open. The next pass must use a real Value/JSON-shaped
recursive AST product, preserve exact nested spans and recovery, and either:

1. generalize a small consumed source-direct SCC lowering that clears the
   96 and 753 binding scales plus result materialization; or
2. retire balanced-discard fusion as overfit and keep only the typed closure
   limit until full-consumer evidence warrants another mechanism.

Unordered composition, generic CSS-needed leaves, full Value-owned CSS
coverage, live consumers, P1→P2→P3 and both clean audit pairs also remain
open. Status is `NO RELEASE`.
