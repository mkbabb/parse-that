# Tranche B — PROGRESS

Updated: 2026-07-29

Tranche status: `in_progress`

Active wave: `B.W0 - Candidate-to-Release Closure`

Formation status: **RED — S6 locally clears terminal/sequence; full-subject
P1→P2→P3 and every-subject proof remain open**

Release status: **NO RELEASE**

## Formation ledger

| Boundary | Evidence | Disposition |
|---|---|---|
| Archaeology | `research/PARSE-THAT-SESSION-ARCHAEOLOGY-2026-07-29.md` | Banked; prior scanner-shaped CSS attempts and stale completion claims rejected. |
| Round zero | `research/ROUND-ZERO-PARSE-THAT-PORTFOLIO-2026-07-29.md` | Banked portfolio; incompatible families preserved for evidence. |
| Pass 1 adjudication/agglomeration | `research/PASS-1-SOL-ADJUDICATION-2026-07-29.md`, `research/PASS-1-SOL-AGGLOMERATION-2026-07-29.md` | R/E/V/K retired; S/D remained research candidates. |
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

## Current executable state

- Branch: `codex/css-totality-combinators-20260729`.
- Latest source/evidence coordinate:
  `062c147` (`perf(pass3-s): bank run-owned state and 10x terminal evidence`).
- P-B1 authority head: `302c623b4ffddf76bc4ee042cad1d3c5e739ef9d`.
- Source/evidence coordinates include `c480578`
  (`perf(runtime-prototype): bind corrected S assay to accepted M2 control`),
  `2fc18dc`, S4 at `75b76dd`, S5 at `926a3ad`, and S6 at `062c147`. None
  confers formation or execution credit.
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
- Fresh S6 gates: focused hostile suite 9/9; package suite 14/14 files and
  134/134 tests; strict TypeScript; production build; manifest,
  no-CSS-surface, subpath, packrat, no-span and no-dead-combinator proofs all
  green. The unchanged production JSON `proof:perf` point guard is green on
  the final isolated rerun at +4.6% against 15%; it remains a regression
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
7. Deep immutable diagnostic copying/freezing is a measured Amdahl
   bottleneck. The compiler's unconsumed `.result` method and result types
   are pruned. The consumer owns its readonly success envelope; recovery
   diagnostics and all nested evidence remain deep-frozen, while
   failure/fault results retain immutable provenance. Equal timed consumer
   projection remains mandatory in admission.
8. Value needs no generic public API widening. Successful immutable
   recovery diagnostics and opaque unknown syntax remain Value-owned result
   shapes supported by generic parse provenance.
9. The named second non-CSS consumer is parse-that's `jsonParser`.
10. `/utils` remains unresolved until two consumer receipts exist; otherwise
   it is pruned.

## Formation and release chains

Formation:

`full-subject P1 → full-subject P2 → full-subject P3 → isolated every-scale
and result-plane equivalent-product ≥10× prototype proof → formation Clean A
→ formation Clean B → formation admission`

Execution:

`private/formal source freeze → immutable unpublished pack → Value CSS +
jsonParser consume the exact SHA → equivalent output, deletion and formal
consumer CI-low proof → execution Clean A → execution Clean B → parse-that
release → Value released-coordinate rebind → BBNF post-W3 receipt`

The final receipt is specifically gated by Value
`V.L6.css-path-abi-freeze`.

Formation admission creates zero execution credit. No later state in either
chain may be recorded while an earlier arrow is RED.

## Next executable boundary

1. Complete the current full-subject formation pass without narrowing its
   transaction, span, recovery, recursion, unordered, allocation or result
   obligations.
2. Carry the S6 run-owned state through equivalent recovery, bounded
   recursion, unordered composition and generic CSS-needed leaf prototypes;
   the historical recovery result plane remains RED.
3. Preserve the locally green terminal/sequence evidence without treating it
   as P3, every-subject proof, formation admission or execution credit.
4. Run formation Clean A/B only after the isolated prototype proof is green.
   Production-source freeze and packing remain later execution boundaries.

`FINAL.md` remains an open gate ledger. Tranche B is not closeable.
