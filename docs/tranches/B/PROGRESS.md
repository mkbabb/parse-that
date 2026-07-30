# Tranche B — PROGRESS

Updated: 2026-07-29

Tranche status: `in_progress`

Active wave: `B.W0 - Candidate-to-Release Closure`

Formation status: **RED — P1 and P2 are row-complete; every implemented
replacement family is retired; P3, an every-subject ≥10× prototype and both
formation clean audits remain open or RED**

Release status: **NO RELEASE**

## Formation ledger

| Boundary | Evidence | Disposition |
|---|---|---|
| Archaeology | `research/PARSE-THAT-SESSION-ARCHAEOLOGY-2026-07-29.md` | Banked; prior scanner-shaped CSS attempts and stale completion claims rejected. |
| Round zero | `research/ROUND-ZERO-PARSE-THAT-PORTFOLIO-2026-07-29.md` | Banked portfolio; incompatible families preserved for evidence. |
| Pass 1 research adjudication/agglomeration | `research/PASS-1-SOL-ADJUDICATION-2026-07-29.md`, `research/PASS-1-SOL-AGGLOMERATION-2026-07-29.md` | Preliminary research only: R/E/V/K retired and S/D remained candidates; later reconciled by P1. |
| P1 full-subject reconciliation | `69f72f7`, `research/P1-HASH-BOUND-REGISTRY-2026-07-29.md` | Twenty hash-bound rows: 8 GREEN, 7 OPEN, 4 RED, 1 OPEN/ROUTED. **P1 COMPLETE; FORMATION RED; ZERO LATER CREDIT**. |
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
| U unordered composition | `19ad1ac`, `artifacts/pass3/u-unordered/` | U contributes 24 correctness cases (12 per S/D family) plus 13 S-kernel regressions. S has no disjoint-FIRST route and is retired. D proves overlap correctness, but every formal performance fixture is disjoint (`residuals: 0`); disjoint points are only 1.427–1.525× at 4, 2.708–3.406× at 8, 4.607–5.403× at 16 and 9.559–12.212× at 33. **HELD — CORRECTNESS GREEN, PERFORMANCE/OVERLAP ASSAY RED; NO BOOTSTRAP**. |
| P2-L generic source leaves | `5822ae2`, `artifacts/pass3/l-source-leaves/` | Callback, sticky, and declarative ASCII families preserve 51/51 exact capture/value/failure products at 8/64/4096 UTF-16 units. Success is 0.0718–1.3079× and failure 1.1075–1.5381×; no bootstrap. All three production/public widenings are killed; the generic node is held only as a private shaped-product fixture. **CORRECTNESS GREEN; PERFORMANCE RED; TERMINAL P2 EVIDENCE**. |
| P2 shaped products | `d62b73a`, `artifacts/pass3/p2-shaped-products/` | Recursive JSON passes the frozen 33-valid/7-invalid corpus; the domain-neutral stylesheet-shaped product carries exact spans, nested calls, URL, scalar leaves and successful opaque recovery. Twenty equal AB/BA points put JSON at 0.8728–1.0021×, the fixture at 1.0937–1.2920× and failures at 1.1658–1.2041×; heap is ~1.166× control. **CORRECTNESS GREEN; PERFORMANCE RED; STAGED FAMILY KILL; TERMINAL P2 EVIDENCE**. |
| P2-UO mixed-overlap unordered | `68055bd`, `artifacts/pass3/p2-unordered-overlap/` | Every 4/8/16/33-member success uses D's live residual route while returning equal slots, UTF-16 spans, immutable recovery diagnostics and failures. Twenty AB/BA points are 0.7362–2.2994×; several binding planes lose and stable 8/16/33-member grammar heap is ~2.06–2.40× control. **CORRECTNESS GREEN; PERFORMANCE RED; D KILL; NO BOOTSTRAP; TERMINAL P2 EVIDENCE**. |
| P2-C cold/hot dispatch | `d323f56`, `artifacts/pass3/p2-cold-hot/` | Equal EOF/span products at 4/8/16/33/96/753 measure construction, build+first parse, stabilized hot, alternating shapes, failure and Unicode cold edges. Construction is 0.0597–0.0785×, cold end-to-end 0.0696–0.0846×, small/middle hot below 3.758× and Unicode hot 1.500×. **CORRECTNESS GREEN; COMPILED TABLE KILL; NO BOOTSTRAP**. |
| P2 full-subject disposition | `c3d42d4`, `research/P2-FULL-SUBJECT-DISPOSITION-2026-07-29.md` | All twenty P1 rows have exact KEEP/KILL/RED/ROUTED outcomes. Every implemented replacement family is retired; surviving mechanisms are laws/fixtures, not a candidate. **P2 COMPLETE; FORMATION RED; P3 NEXT**. |

## Current executable state

- Branch: `codex/css-totality-combinators-20260729`.
- Latest source/evidence coordinate:
  `d323f56` (`perf(parser-prototype): falsify compiled dispatch across cold
  and hot planes`).
- Latest canonical authority reconciliation:
  `d76b543` (`docs(parser-tranche): bind the P2-UO authority coordinate`);
  the P2-complete authority reconciliation is being banked after `c3d42d4`.
- Corrected P1 root intake:
  `abc9479d7ea5fa4c76deca752428faf8b332f280e6e637de12b12b25e8e2ad6c`;
  it binds committed `c9c2108` bytes, P1 only, and grants no later credit.
- P2 shaped-product objects at `d62b73a`: staged kernel
  `387ea2d848185e9681b40366470f1a3c1ac9e88b`, fixtures
  `772ab78f87f080473f78f2f3963677df5fa89e79`, product grammar
  `537be68f2a1e1f8742a12e397dd28c2ec4878576`, hostile tests
  `6610049d0e722f9083b115edea657f341b65bd87`, profile
  `4804897509b687d726907e0b9e5bbc0f20ed5ef6`; manifest-file SHA-256
  `ec8ebeeb1077862621be126a17f12480680f60593784ad748af25eca7969a159`.
- P2-UO objects at `68055bd`: manifest-file SHA-256
  `d9253a49c7fcbe970712cc4245711cfdb1a5891bdafb7507720cb1d033a87bfd`;
  it binds the source, exact profile, allocation rows, CPU profile, normalized
  V8 log and production guard.
- P2-C objects at `d323f56`: manifest-file SHA-256
  `850af1b66956e2b66637e1f0d49fd1a5d229397a9fd7ad4d2daf4bdd02ef879e`;
  it binds the profile, frozen 753-name corpus, allocation rows, CPU profile,
  normalized V8 log and production guard.
- P-B1 authority head: `302c623b4ffddf76bc4ee042cad1d3c5e739ef9d`.
- Source/evidence coordinates include `c480578`
  (`perf(runtime-prototype): bind corrected S assay to accepted M2 control`),
  `2fc18dc`, S4 at `75b76dd`, S5 at `926a3ad`, S6 at `062c147`, S7 at
  `20b5f52`, S8 at `27bf872`, U at `19ad1ac`, P2-L at `5822ae2`, shaped
  products at `d62b73a`, mixed-overlap U at `68055bd`, cold/hot dispatch at
  `d323f56`, and the P2 registry at `c3d42d4`. None confers formation
  admission or execution credit.
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
- Live production parser source is the rejected M3 coordinate `90d4ec5`
  across `lazy.ts`, `leaf.ts`, `parser.ts`, `state.ts`, and `utils.ts`
  (221 additions / 264 deletions versus M2). M2 at `de36d57` is the accepted
  performance control, not the live production source.
- Value R2 formation remains admitted with zero parser execution/product/
  release credit: root receipt `0c151de9…`, binding `a27d72a4…`, root quartet
  `b4d46ec1…`/`f77870b0…`/`9073d0f7…`/`f2cc76f1…`, owner verification
  `7865862a…`.
- Fresh P2-L gates: focused leaves 8/8 and S regressions 13/13; package suite
  14/14 files and 134/134 tests; strict TypeScript; production build;
  manifest, no-CSS-surface, subpath, packrat, no-span and no-dead-combinator
  proofs green. Its sealed unchanged-production `proof:perf` run is RED at
  +82.7% against 15%; private prototype changes cannot cause the production
  regression, but it is not waived.
- Fresh shaped-product gates: focused products 8/8, P2-L 8/8 and S
  regressions 13/13; frozen JSON 33 valid/7 invalid; package suite 14/14 files
  and 134/134 tests; strict TypeScript; production build; manifest,
  no-CSS-surface, subpath, packrat, no-span and no-dead-combinator proofs
  green. One ordinary production `proof:perf` run passed at +13.2%; the
  sealed rerun is RED at +25.6% against 15%. The private transaction changes
  no production source, so neither run is causal or formal admission; the
  sealed RED result is not waived.
- Fresh P2-UO gates: focused U/S kernel 41/41 (28 unordered plus 13 shared
  regressions); package 14/14 files and 134/134 tests; strict TypeScript;
  production build; manifest and `proof:all` green. Its sealed production
  guard records +8.4% JSON and is a regression guard only, not formal
  admission or causal prototype evidence.
- Fresh P2-C gates: package 14/14 files and 134/134 tests; strict TypeScript;
  production build; artifact manifest and `proof:all` green. Its sealed
  production guard records +6.3% JSON and is a regression guard only.
- U gates: 24/24 unordered cases plus 13/13 S-kernel regressions; package
  suite 14/14
  files and 134/134 tests; strict TypeScript; production build; manifest,
  no-CSS-surface, subpath, packrat, no-span and no-dead-combinator proofs
  green. The reported four-run production JSON range of +21.3% to +45.4%
  has no raw entry in U's 18-entry manifest and is therefore **UNSEALED**.
  The guard remains RED, but that numeric range carries no evidence credit.
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
  diagnostic failure. That large signal kept the incompatible family alive
  through its next product challenge but could not waive the 96-leaf RED
  scale; SP and P2-C later retire it.
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
  scales range from 1.427× to 6.156×. Every timed fixture at that coordinate
  has `residuals: 0`.
- P2-UO closes the missing performance assay. Its 4/8/16/33-member products
  consult the live residual route 7/15/31/65 times and preserve equal
  state/value/internal/result/failure products. The twenty AB/BA ratios are
  0.7362–2.2994×, with multiple binding points below 1×. D is terminally
  retired; no bootstrap follows. Successful recovery is present but has a
  unique FIRST code, so same-FIRST speculative recovery under overlap remains
  an explicit hostile-audit item rather than a claimed result.
- P2-C closes cold/hot dispatch. Candidate/control construction ratios are
  0.0597–0.0785× and build-plus-first-parse ratios 0.0696–0.0846× across
  4/8/16/33/96/753. Stabilized exact-product success is
  0.8640/0.9496/1.3479/1.9730/3.7572/10.3800×; Unicode cold routing is
  1.4996× hot and 0.1406× cold. `buildTerminalTable` and GC dominate the CPU
  profile. The compiled graph/table surface is terminally retired.
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
3. Prefix-winner tables and one-terminal suffix fusion improved S7's warmed
   plane, but SP and P2-C show that the mechanism does not survive exact
   products, cold construction or small scales. It is retired.
4. Dense 128-column ASCII tables were assayed and killed: they regressed
   speed and inflated the 96-name table from about 61 KB to about 274 KB.
5. Direct authored-span projection remains a behavior/fixture law. The
   58,730-byte table that carried it does not survive P2-C.
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
10. `/utils` currently fails the two-consumer law and is pruned from a
    successor unless exact later receipts reverse the census.
11. Generic cached recursion is correctness-green but performance-RED.
    Recursive JSON and nested stylesheet-shaped calls now exercise the real
    product need; neither lifts the staged family above 1.0021× on JSON or
    1.2920× on the fixture. Balanced-discard fusion and the staged
    full-product family are killed as overfit/private alternatives. They are
    not recursive CSS AST proof.
12. Both unordered families are retired. S has no unique routing mechanism;
    D's live residual route is correct but only 0.7362–2.2994× and carries
    larger grammar heap. The correctness fixtures remain private research;
    no unordered runtime surface advances.
13. P2-L kills callback-loop, declarative ASCII-table, and public sticky
    wrapper widenings. P2 shaped products then kill the remaining private
    staged/source-leaf candidate path. Native sticky RegExp and the incumbent
    closure runtime remain the KISS control; the private corpus survives only
    to reproduce falsification.
14. P2-C kills the staged graph, prefix table and compiled parser surface as a
    general candidate. S7's scalar transaction, run-owned recovery and
    consumer projection survive only as laws; its warmed high-arity result is
    not a runtime admission.
15. `/utils` has no live consumer and only one Value prototype use. Packrat has
    no live Value/JSON consumer. Both are excluded from a successor unless P3
    binds two exact consumers; no alias or compatibility tier is allowed.

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

1. Begin P3 with the exact same-FIRST speculative-recovery overlap case. It
   must compare successful frontier, labels, spans and immutable diagnostic
   bytes against accepted M2; it may not widen the scalar checkpoint.
2. Form the smallest direct closure-kernel surface cut from the P2 survivor
   laws. Delete or exclude the compiled graph/table, unordered engine, generic
   source leaf, compiler-owned result, `/utils`, and unconsumed packrat
   helpers. Do not implement production execution in this formation pass.
3. Re-run the unchanged shaped stylesheet and JSON corpora plus
   4/8/16/33/96/753 cold/hot/result planes. Any new mechanism must clear the
   every-scale point floor before exact bootstrap.
4. Preserve P2's terminal retirements; a killed family may reopen only from a
   new exact two-consumer need, not a renamed prototype. Run
   formation Clean A/B only after the isolated prototype proof is green.
   Production-source freeze and packing remain later execution boundaries.

`FINAL.md` remains an open gate ledger. Tranche B is not closeable.
