# Tranche B — PROGRESS

Updated: 2026-07-29

Tranche status: `in_progress`

Active wave: `B.W0 - Candidate-to-Release Closure`

Formation status: **RED — S7 locally clears terminal/sequence and generic
recovery; U correctness is green but performance is RED; P1 lacks a
row-complete hash-bound registry, P2/P3 are blocked, and every-subject proof
remains open**

Release status: **NO RELEASE**

## Formation ledger

| Boundary | Evidence | Disposition |
|---|---|---|
| Archaeology | `research/PARSE-THAT-SESSION-ARCHAEOLOGY-2026-07-29.md` | Banked; prior scanner-shaped CSS attempts and stale completion claims rejected. |
| Round zero | `research/ROUND-ZERO-PARSE-THAT-PORTFOLIO-2026-07-29.md` | Banked portfolio; incompatible families preserved for evidence. |
| Pass 1 research adjudication/agglomeration | `research/PASS-1-SOL-ADJUDICATION-2026-07-29.md`, `research/PASS-1-SOL-AGGLOMERATION-2026-07-29.md` | Preliminary research only: R/E/V/K retired and S/D remained candidates; no row-complete hash-bound P1 credit. |
| M1 | `de36d57` predecessor formation | Parse-owned recovery and raw-memo isolation proceeded to M2. |
| M2 | `de36d57` | Banked run-local recovery diagnostics and source-owned raw memo cells. |
| M3 | `90d4ec5` | Correctness evidence banked; performance gate RED; rejected, no release. |
| S1 | `0067c31` | Large source-direct signal banked; admission framing withdrawn by XR-21. |
| S2 | `96ad567` | Exact sequence evidence banked; admission framing withdrawn by XR-18/XR-21. |
| S amendment | `2fc18dc`, `audit/PASS-3-S-EVIDENCE-AMENDMENT-2026-07-29.md` | Corrected 96-name matched-boundary CI-low 9.033× and immutable-result CI-low 4.804×: **RED**. |
| S3 recovery | `2fc18dc` private prototype | Eight focused tests and strict TypeScript green; first corrected sample 9.365× parse state / 4.828× immutable result: **HELD, RED**. |
| Accepted-M2 control | `c480578`, `artifacts/pass3/s-m2-control/` | Five corrected processes against `de36d57`: matched-boundary CI-low 8.179×, internal 8.698×, immutable result 4.420×. **RED**. |
| S4 authored-span sequence | `75b76dd`, `artifacts/pass3/s4-spanned-sequence/` | Direct authored-span projection and adaptive winner-depth table improve accepted-M2 CI-low to 9.063× matched, 9.017× internal and 4.573× result. **HELD, RED**. |
| S5 consumer-owned result | `926a3ad`, `artifacts/pass3/s5-consumer-result/` | The unconsumed compiled `.result` surface is pruned; a colocated consumer projector preserves equal immutable work and raises result CI-low to 7.254×. Matched 8.985× and internal 9.040× receive no advancement credit. **HELD, RED**. |
| S6 run-owned successor state | `062c147`, `artifacts/pass3/s6-run-state/` | A scalar run-owned state, matched prospective `parseState` boundary, shared frozen empty evidence and consumer-owned success envelope clear the seven-process 96-name terminal/sequence CI-low at 10.020× matched, 11.022× internal and 10.263× result. The 753-name corresponding lows are 72.853×, 75.768× and 76.902×. **HELD — LOCAL TERMINAL/SEQUENCE GREEN; FORMATION OPEN**. |
| S7 immutable recovery | `20b5f52`, `artifacts/pass3/s7-immutable-recovery/` | Diagnostic collection now resets the frontier, freezes each entry and nested evidence once, retains an O(1) run builder, and seals only the outer collection at consumer projection. Seven-process 96-name CI-lows are 10.405× matched, 11.285× internal, 10.257× result, 20.569× late, 12.894× failure and 39.532× diagnostic failure; every 753-name low exceeds 75×. **HELD — LOCAL GENERIC RECOVERY GREEN; FORMATION OPEN**. |
| S8 bounded recursion | `27bf872`, `artifacts/pass3/s8-bounded-recursion/` | Cached generic recursion, parse-owned live/max depth and sticky typed nesting faults are correctness-green. Generic 96-leaf recursive span success/internal/result is only 1.270×/1.212×/1.331×; balanced-discard fusion is only 8.400×/8.842×/8.561× at 96 despite 57.819×/61.403×/61.507× at 753. **HELD — CORRECTNESS GREEN, PERFORMANCE RED; FORMATION OPEN**. |
| U unordered composition | `19ad1ac`, `artifacts/pass3/u-unordered/` | Scannerless S/D hostile correctness is 37/37. S has no disjoint-FIRST route and is retired as a family. D keeps compiled-FIRST disjoint dispatch plus bounded residual overlap search, but formal success/internal/result points are only 1.427–1.525× at 4, 2.708–3.406× at 8, 4.607–5.403× at 16 and 9.559–12.212× at 33; one 33-member order is below 10×. **HELD — CORRECTNESS GREEN, PERFORMANCE RED; NO BOOTSTRAP**. |

## Current executable state

- Branch: `codex/css-totality-combinators-20260729`.
- Latest source/evidence coordinate:
  `19ad1ac` (`perf(parser-prototype): bank scannerless unordered S/D
  tournament`).
- Latest canonical authority reconciliation:
  `8373167f1088f337af6096a9c9d2a5463ebd5d54`
  (`docs(parser-tranche): reconcile U falsification and formation boundary`).
- P-B1 authority head: `302c623b4ffddf76bc4ee042cad1d3c5e739ef9d`.
- Source/evidence coordinates include `c480578`
  (`perf(runtime-prototype): bind corrected S assay to accepted M2 control`),
  `2fc18dc`, S4 at `75b76dd`, S5 at `926a3ad`, S6 at `062c147`, S7 at
  `20b5f52`, S8 at `27bf872`, and U at `19ad1ac`. None confers formation or
  execution credit.
- S/recovery evidence commit:
  `2fc18dc1ec3a0541b85e9e440fca85028844673c`.
- Canonical authority before P-B1:
  `f3ed3b6` (`docs(parser-tranche): form canonical candidate-to-release
  authority and exact constellation order`).
- P-B1 authority is `302c623`; the root receipt reported at SHA prefix
  `060995` is `P.exec.PB1-order-ack`. It is an execution-phase acknowledgment
  of future execution order/authority, feeds private freeze only after
  formation admission, and does not feed P1. It carries zero formation,
  candidate, consumption, proof or release credit.
- The post-S4 authority reconciliation is banked at `6f893be`. After each
  source or authority bank, the untracked `data` symlink is the only expected
  status entry and remains untouched.
- Fresh U gates: focused U plus S-kernel suite 37/37; package suite 14/14
  files and 134/134 tests; strict TypeScript; production build; manifest,
  no-CSS-surface, subpath, packrat, no-span and no-dead-combinator proofs
  green. The unchanged production JSON `proof:perf` guard is currently RED
  across four fresh runs at +21.3% to +45.4% against its 15% checked-in
  threshold. U changes only private prototype/test files, so this movement is
  not attributed to a production diff and receives no waiver.
- Earlier S8 gates: focused hostile suite 13/13; package suite 14/14 files and
  134/134 tests; strict TypeScript; production build; manifest,
  no-CSS-surface, subpath, packrat, no-span and no-dead-combinator proofs all
  green. The unchanged production JSON `proof:perf` point guard is green on
  the final isolated rerun at +9.0% against 15%; it remains a regression
  guard, not formal ≥10× admission credit.
- Corrected five-process 96-name matched-boundary sequence:
  CI-low 9.033×, median 9.655×, high 9.986×.
- Corrected five-process immutable-result sequence:
  CI-low 4.804×, median 5.008×, high 5.060×.
- Corrected five-process sequence against accepted M2:
  matched-boundary CI-low 8.179×, raw-internal CI-low 8.698×, and
  immutable-result CI-low 4.420×.
- S4 five-process sequence against accepted M2:
  matched-boundary CI-low 9.063×, raw-internal CI-low 9.017×, and
  immutable-result CI-low 4.573×. All remain RED.
- S5 five-process sequence against accepted M2:
  matched-boundary CI-low 8.985×, raw-internal CI-low 9.040×, and
  immutable-result CI-low 7.254×. The result improvement is held; unchanged
  parser-source planes receive no advancement credit. All remain RED.
- S6 seven-process 96-name sequence against accepted M2:
  matched-boundary CI-low 10.020×, raw-internal CI-low 11.022×, and
  consumer-result CI-low 10.263×. This closes only the local
  terminal/sequence family.
- S6 seven-process 753-name sequence against accepted M2:
  matched-boundary CI-low 72.853×, raw-internal CI-low 75.768×, and
  consumer-result CI-low 76.902×.
- S6 profiles bank matched CPU, GC/deopt trace and compact IC evidence.
  Candidate ranges showed no polymorphic or megamorphic IC transition. The
  original five-process seal contained 9.586× matched and 9.780× result
  observations; source and thresholds were unchanged before the predeclared
  seven-process exact bootstrap cleared the bound.
- S7 seven-process 96-name recovery against accepted M2:
  matched-boundary CI-low 10.405×, raw-internal 11.285×, consumer-result
  10.257×, late-match 20.569×, failure 12.894× and diagnostic-failure
  39.532×. One raw consumer-result process measured 9.792×; it remains
  disclosed, while the predeclared exact-bootstrap median CI-low is green.
- S7 seven-process 753-name recovery against accepted M2:
  matched-boundary CI-low 79.634×, raw-internal 88.585×, consumer-result
  75.499×, late-match 215.153×, failure 99.144× and diagnostic-failure
  657.352×.
- S7 seals CPU, hot-loop, GC/deopt and IC evidence to the final source
  hashes. The staged boundary has no named bailout; its parse-state ICs are
  monomorphic. This is generic local recovery proof only, not Value CSS
  recovery, a live-consumer receipt or full-subject admission.
- S8 single-process 96-leaf recursive authored-span points:
  generic cached recursion 1.270× success, 1.212× internal and 1.331×
  consumer result; balanced-discard fusion 8.400×, 8.842× and 8.561×.
  Both are binding RED, so no multiprocess bootstrap or advancement follows.
- S8 single-process 753-leaf balanced-discard points are 57.819× success,
  61.403× internal, 61.507× result, 3479.009× failure and 44.857×
  diagnostic failure. This large signal keeps the incompatible family alive
  for consumer adjudication but cannot waive the 96-leaf RED scale.
- S8 CPU and mixed diagnostics-off/on GC/deopt evidence is banked. The mixed
  trace records candidate `parseState` and `mergeLabels` deoptimizations and
  is not a clean hot-only seal.
- U S/D correctness is green for exact authored slots, UTF-16 spans,
  projected locally greedy choice reopening, recovery rollback, successful
  immutable recovery evidence, exact diagnostics-on labels, optional/repeat,
  4/8/16/33 members and typed state-cap termination.
- U S performs no disjoint-FIRST routing: it enumerates available arms and is
  retired as a family. D's disjoint path reduces attempts from
  10/36/136/561 to 4/8/16/33, but the binding accepted-M2 point assay remains
  RED. Its single 33-member AB/BA set ranges from 9.559× to 12.212×; smaller
  scales range from 1.427× to 6.156×. No exact bootstrap follows.
- U retains equal-plane raw data, state/allocation points, two CPU profiles
  and a V8 deopt log at `artifacts/pass3/u-unordered/`. Candidate grammar
  retained heap is approximately 1.9–2.6× the idiomatic control. The deopt
  trace is not a clean hot-only seal.
- Corrected 753-name sequence: one process at 78.839×; not a confidence
  bound and not admission.
- Corrected 96-name recovery: one process at 9.365× matched-boundary and
  4.828× immutable-result; not admission.

## Active decisions

1. S is private research and cannot become a second exported runtime.
2. Duplicate new-frontier labels are repaired in the prototype.
3. Prefix-winner tables and source-direct one-terminal suffix fusion are
   retained for critique because they improve the corrected plane without a
   scanner or cartesian expansion.
4. Dense 128-column ASCII tables were assayed and killed: they regressed
   speed and inflated the 96-name table from about 61 KB to about 274 KB.
5. Direct authored-span projection for the consumed one-code-unit sequence is
   held because it improves every small success plane and reduces the table
   to 58,730 bytes without changing the graph or public surface.
6. Arithmetic/sentinel alphabets, packed winner/depth, two-code-unit buckets,
   conditional frontier clearing, projection branches and row-displaced
   tables were measured and killed.
7. Deep immutable diagnostic copying/freezing was a measured Amdahl
   bottleneck. S7 freezes each diagnostic and nested evidence once at
   collection, uses one mutable O(1) outer builder during the run, and seals
   that outer list at consumer projection. The compiler's unconsumed
   `.result` method and result types remain pruned; failure/fault results
   retain immutable provenance. Equal timed consumer projection remains
   mandatory in admission.
8. Value needs no generic public API widening. Successful immutable
   recovery diagnostics and opaque unknown syntax remain Value-owned result
   shapes supported by generic parse provenance.
9. The named second non-CSS consumer is parse-that's `jsonParser`.
10. `/utils` remains unresolved until two consumer receipts exist; otherwise
   it is pruned.
11. Generic cached recursion is correctness-green but performance-RED.
    Balanced-discard fusion remains private incompatible research: it may
    survive only if a real Value/JSON-shaped product proves the same semantic
    need at both binding scales. It is not recursive CSS AST proof.
12. S unordered is retired. D unordered remains private and partial; its
    correctness bank does not satisfy the every-scale ≥10× proof.

## Formation and release chains

Formation:

`full-subject P1 → full-subject P2 → full-subject P3 → isolated every-scale
and result-plane equivalent-product ≥10× prototype proof → formation Clean A
→ formation Clean B → formation admission`

Execution:

`private/formal source freeze → immutable unpublished pack → Value CSS +
jsonParser consume the exact SHA → equivalent output, deletion and formal
consumer CI-low proof → execution Clean A → execution Clean B → parse-that
release → Value released-coordinate rebind → BBNF receipt after
V.L6.css-path-abi-freeze`

The final receipt is specifically gated by Value
`V.L6.css-path-abi-freeze`.

Formation admission creates zero execution credit. No later state in either
chain may be recorded while an earlier arrow is RED.

## Next executable boundary

1. Build the row-complete hash-bound P1 registry without narrowing its
   transaction, span, recovery, recursion, unordered, allocation or result
   obligations. P2/P3 remain blocked until that registry is complete.
2. Carry the S7 run-owned state and U findings into generic CSS-needed leaf
   prototypes. Re-adjudicate recursion only against an isolated
   Value/JSON-shaped recursive AST and nested-span product; generic recursion
   and the narrow balanced-discard fusion are presently RED.
3. Preserve the locally green terminal/sequence and generic-recovery evidence
   without treating it as P3, every-subject proof, formation admission or
   execution credit.
4. Run formation Clean A/B only after the isolated prototype proof is green.
   Production-source freeze and packing remain later execution boundaries.

`FINAL.md` remains an open gate ledger. Tranche B is not closeable.
