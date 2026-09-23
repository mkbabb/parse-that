# Unordered composition tournament

Date: 2026-07-29

Source parent: `1c9d92a5abacac84ca246710948bf1e23888d669`

Accepted-M2 control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **CORRECTNESS GREEN; PERFORMANCE RED; NO BOOTSTRAP; NO RELEASE**

## What was implemented

This private prototype carries the banked S7 run state into generic,
scannerless unordered composition. It introduces no production source,
public export, CSS grammar, token array, scanner facade, event tape or second
parser path.

- `&&` requires every authored member minimum in any order.
- `||` accepts one or more distinct members in any order.
- authored tuple slots remain stable across input order;
- optional and bounded-repeat slots are typed;
- top-level choice arms remain globally backtrackable through `map` and
  `span` projections;
- non-nullability and UTF-16 FIRST codes are derived from the generic grammar
  graph before parsing;
- speculative offsets, values and recovery diagnostics roll back together;
- a chosen recovery keeps its immutable diagnostic;
- searches stop at a declared state cap with one typed
  `UnorderedStateLimit`;
- 4, 8, 16 and 33 member fixtures materialize no permutations.

Two deliberately incompatible private families were measured:

1. **S transaction/bitmask** enumerates available arms in authored order and
   backtracks transactionally. It does not have disjoint-FIRST routing.
2. **D residual/FIRST** uses cached residual routes for overlap. For a
   provably disjoint, non-repeating graph it deletes residual `Map`/`Set`,
   string-key and `BigInt` work from the hot loop and keeps only the compiled
   FIRST route plus scalar member state. Diagnostics-on falls back to the
   exact generic search so failure labels remain identical.

The S family is retired: it has no unique surviving mechanism, performs
fewer useful operations than neither control nor D, and is slower than the
accepted-M2 idiomatic expression on every success/internal/result point. The
D mechanism remains private because it is correct, bounded and improves with
member count, but it does not clear the binding floor.

## Correctness

The focused U/S-kernel suite is 37/37 green. It includes:

- every input permutation used by the fixture;
- overlapping members and a locally greedy choice that must reopen beneath
  `map` and `span`;
- optional, repeated, empty-all and nonempty-some semantics;
- duplicate rejection and nullable-member compile rejection;
- rejected and selected recovery paths;
- exact authored slots and UTF-16 spans;
- exact diagnostics-on failure frontier and labels;
- disjoint 4/8/16/33 cases;
- a 16-way hostile ambiguity stopped at exactly 1,000 explored states.

The package suite is 14/14 files and 134/134 tests. Strict TypeScript,
production build, manifest, no-CSS-surface, subpath, packrat, no-span and
no-dead-combinator proofs are green.

## Equal-plane performance

`profile-idiomatic-final.json` is the binding single-process AB/BA point
assay. Its accepted-M2 control is the public combinator expression
`any(...members).many(count,count).eof()`, followed only by authored-slot
projection and failure-value normalization. Values, offsets, authored slots,
UTF-16 spans, diagnostics and failure state are compared before timing.

Ratios are control/candidate:

| Members | Family | Success AB | Success BA | Internal | Result | Failure |
|---:|:---:|---:|---:|---:|---:|---:|
| 4 | S | 0.288× | 0.295× | 0.315× | 0.315× | 0.394× |
| 4 | D | 1.478× | 1.525× | 1.466× | 1.427× | 2.371× |
| 8 | S | 0.383× | 0.375× | 0.368× | 0.400× | 0.333× |
| 8 | D | 2.708× | 2.926× | 2.990× | 3.406× | 3.404× |
| 16 | S | 0.516× | 0.449× | 0.491× | 0.491× | 0.316× |
| 16 | D | 4.607× | 5.378× | 5.403× | 5.273× | 6.156× |
| 33 | S | 0.564× | 0.549× | 0.559× | 0.467× | 0.330× |
| 33 | D | 9.559× | 11.352× | 12.212× | 10.450× | 11.217× |

D reduces disjoint attempts from S's `10/36/136/561` to `4/8/16/33`.
Nevertheless, its 33-member success AB point is 9.559× and every smaller
scale is below 10×. The every-scale/result-plane proof is therefore RED and
the seven-process bootstrap is not run.

`profile-disjoint-fast.json` retains a stronger handwritten
transaction/bitmask ceiling. Against that control D is only 4.05–4.13× at
four members and 15.89–17.09× at 33; S is slower than the control throughout.
`profile-abba.json` is the pre-optimization falsification in which both
families were below 2.199×. These are adversarial audit evidence, not
alternate admission controls.

Retained candidate grammar heap is also larger than either control:
approximately 5.6/10.2/19.4/39.8 KB for D at 4/8/16/33 versus
2.2/5.2/10.0/21.2 KB for the idiomatic control.

## CPU and deoptimization evidence

The 33-member hot run parses two million equal products in 1,045.843 ms for
D versus 12,286.408 ms for the idiomatic control. Candidate CPU samples
concentrate in `disjointRoot`, terminal alphabet lookup and value projection.
Control samples concentrate in `stringParser`, `anyParser`,
`mergeErrorState` and `many`.

The V8 log contains 79 deopt lines across loaders, TypeScript tooling, source
maps and the assay. One line maps to unordered candidate source and four to
the profile harness; this is not a clean hot-only deopt seal. The raw log and
both CPU profiles are retained.

## Gate caveat

The unchanged production JSON guard failed four fresh runs at +21.3% to
+45.4% versus its checked-in baseline, after S8 had measured +9.0%.
This transaction changes private test/prototype files only, so it cannot
attribute the movement to a production source delta. The gate remains RED;
it is neither waived nor silently recorded green.

## Remainder

The unordered transaction is terminally banked as partial evidence:

- S is retired.
- D remains a private candidate mechanism only.
- isolated formation proof remains RED.
- P1 remains in progress; P2/P3 and formation Clean A/B remain blocked.
- Value/JSON live consumption, candidate packing and release belong to the
  later execution chain, not this isolated formation proof.
- BBNF follows only after `V.L6.css-path-abi-freeze`.

The next source transaction is the generic CSS-needed leaf tournament.
