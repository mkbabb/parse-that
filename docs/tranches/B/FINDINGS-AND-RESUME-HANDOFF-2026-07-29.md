# Parse-that findings and resume handoff

Date: 2026-07-29

Status: **ACTIVE FORMATION — RED — NO RELEASE**

## Exact resume coordinate

- Repository:
  `/Users/mkbabb/Programming/parse-that-css-totality`
- Branch: `codex/css-totality-combinators-20260729`
- Source/evidence HEAD:
  `19c1e12` (`perf(parser-prototype): falsify the direct closure surface on
  complete products`)
- P1 registry coordinate:
  `69f72f7` (`docs(parser-tranche): bind the row-complete P1 subject
  registry`)
- Canonical owner authority:
  `730c244` (`docs(parser-tranche): bind same-FIRST recovery law into P3`).
- P2 registry coordinate:
  `c3d42d4` (`docs(parser-research): complete the P2 full-subject
  disposition`).
- P3 registry coordinate:
  `43d7d4a` (`docs(parser-research): complete the P3 full-subject
  disposition`).
- Corrected P1 root intake:
  `abc9479d7ea5fa4c76deca752428faf8b332f280e6e637de12b12b25e8e2ad6c`;
  P1-only, zero later credit.
- P2 shaped-product manifest-file SHA-256:
  `ec8ebeeb1077862621be126a17f12480680f60593784ad748af25eca7969a159`.
- P2-UO manifest-file SHA-256:
  `d9253a49c7fcbe970712cc4245711cfdb1a5891bdafb7507720cb1d033a87bfd`.
- P2-C manifest-file SHA-256:
  `850af1b66956e2b66637e1f0d49fd1a5d229397a9fd7ad4d2daf4bdd02ef879e`.
- P3 same-FIRST manifest-file SHA-256:
  `90115ccd7b567591c56e68870605331f99078be4baf246a10e246649829ae49e`.
- P3 direct-closure manifest-file SHA-256:
  `b14b2d0d138c9d6900a7dcd956c9d2b71a8b3ff3384d6fd6d2e619486bad5fe6`.
- Accepted M2 control worktree:
  `/tmp/parse-that-m2-baseline-20260729`
- Accepted M2 coordinate:
  `de36d57dccdd20068b8c11a78f6e83d42e7d681f`
- Live production-source coordinate: rejected M3 `90d4ec5` across
  `lazy.ts`, `leaf.ts`, `parser.ts`, `state.ts`, and `utils.ts`; 221
  additions / 264 deletions versus M2. M2 is the control, not live source.
- Tracked tree: clean at handoff.
- Expected untracked entry: `data`, a user-owned symlink. Do not stage,
  modify or remove it.

The operator instruction for this resume is **do not spawn new tasks or chat
sessions**. Continue with one serial writer. This transient instruction is
not release law and must not be hardcoded into the wave DAG.

## Goal and ownership

The active goal is a scannerless, idiomatic parse-that runtime proven by a
Value-owned full CSS grammar and logical `parse-that#jsonParser`. The latter
is a package consumer, not a repository. No tokenizer, token array,
token-event tape, scanner facade, separate lexing stage, raw-source alias or
fallback parser may appear.

- parse-that owns only reusable combinators, run state, spans, diagnostics,
  recovery, recursion, unordered composition, memo policy and performance;
- Value owns the sole CSS grammar, CSS AST/results, canonical inverses,
  transform/path domains, public CSS behavior, consumer and UI;
- Keyframes consumes the Value surface and owns no replacement parser;
- BBNF receives only the frozen generic ABI after Value
  `V.L6.css-path-abi-freeze`.

`P.exec.PB1-order-ack` at reported SHA prefix `060995` is execution-order
acknowledgment only. It supplies zero P1, formation, candidate, proof,
consumer, publication or release credit.

## Findings

### What is banked and locally green

1. M2 at `de36d57` is the frozen control for run-local recovery and raw memo
   source/run isolation.
2. S6 at `062c147` locally clears terminal/sequence at the 96 and 753 binding
   scales.
3. S7 at `20b5f52` locally clears generic successful recovery on the
   predeclared seven-process exact-bootstrap plane. Its 96-name CI-lows are
   10.405× matched, 11.285× internal, 10.257× result, 20.569× late,
   12.894× failure and 39.532× diagnostic failure.
4. S8 at `27bf872` proves bounded-recursion correctness: cached lazy edges,
   mutual recursion, parse-owned live/max depth, sticky typed nesting before
   host exhaustion, exact rollback, missing-close frontier, and depth restore
   after a thrown projection.
5. U at `19ad1ac` proves scannerless unordered correctness at 4/8/16/33:
   authored slots and UTF-16 spans, `&&`/`||`, optional/repeat, projected
   locally greedy backtracking, exact recovery rollback/selection,
   diagnostics-on labels and typed state-cap termination.
6. P1 is row-complete and hash-bound at `69f72f7`: 8 GREEN, 7 OPEN, 4 RED,
   and 1 OPEN/ROUTED. This completes reconciliation only.
7. P2-L at `5822ae2` proves 51/51 equal CSS/JSON-shaped leaf capture, value,
   and failure products across 8/64/4096 UTF-16 units. Its private generic
   leaf preserves exact nonzero spans, labels, rollback, projection throws
   and immutable recovery.
8. P2-L's focused 8/8 plus 13/13 S regressions, package 14/14 files and
   134/134 tests, strict TypeScript, production build and structural proofs
   were green at its bank.
9. P2 shaped products at `d62b73a` pass the frozen 33-valid/7-invalid JSON
   corpus and a domain-neutral stylesheet-shaped corpus with exact spans,
   scalar leaves, URL, nested balanced calls, opaque recovery, immutable
   diagnostics and hostile UTF-16.
10. P2-UO at `68055bd` proves the live D residual path on equal
    4/8/16/33-member products. Every success includes global prefix reopening,
    exact authored slots and UTF-16 spans, repeated FIRST buckets, and one
    immutable successful recovery diagnostic.
11. Current correctness and structural gates are green: focused U/S kernel
    41/41 (28 unordered plus 13 shared regressions), package 14/14 files and
    134/134 tests, strict TypeScript, production build, manifest and
    `proof:all`.
12. P2-C at `d323f56` compares exact EOF/span products across
    4/8/16/33/96/753-name construction, cold, hot, alternating, failure and
    Unicode FIRST planes. The frozen Webref corpus and generated evidence are
    hash-bound.
13. P2 is row-complete at `c3d42d4`: all twenty P1 rows have an exact
    KEEP/KILL/RED/ROUTED disposition.
14. P3 same-FIRST recovery at `f4b9abb` seals all six permutations with
    diagnostics off and on. Successful values, authored slots, UTF-16 spans,
    final offsets and status are equal; diagnostics-on complete views are
    equal.
15. P3 direct closure at `19c1e12` passes 36 equal warmed success
    projections, two failure-state subsets, candidate-only frozen
    33-valid/7-invalid JSON checks, bounded recovery and typed nesting.
    Complete state, failure-result, invalid-M2, build-plus-first/cold,
    alternating-shape, bootstrap and scaled diagnostics-on recovery planes
    remain RED.
16. P3 is row-complete at `43d7d4a`; all twenty subjects have terminal
    findings and no candidate survives.

Value R2 formation is independently admitted with zero parser execution,
product, release, or constellation-close credit: root receipt `0c151de9…`,
binding `a27d72a4…`, root quartet `b4d46ec1…`/`f77870b0…`/`9073d0f7…`/
`f2cc76f1…`, and owner verification `7865862a…`.

These are private formation-research results. None is an admitted runtime,
candidate pack, consumer receipt or release.

### What is half-formed or rejected

1. Full CSS coverage has **not** been implemented in parse-that. That is
   correct ownership: Value must author and consume the sole grammar after
   formation admission and the immutable candidate boundary.
2. S8 generic recursive success/result is performance-RED at the 96-leaf
   authored-span scale: 1.270× success, 1.212× internal and 1.331× result.
3. S8 balanced-discard fusion is also RED at that binding scale:
   8.400×/8.842×/8.561×, despite a 57.819×/61.403×/61.507× full-denominator
   signal at 753 leaves.
4. Balanced-discard fusion is narrower than recursive CSS AST construction
   and later shaped-product evidence did not rescue it. It is retired as an
   overfit private alternative.
5. The S8 mixed diagnostics-off/on trace has named candidate `parseState`
   and `mergeLabels` deoptimizations. It is not a clean hot-only seal.
6. No multiprocess bootstrap is warranted for S8 because the 96-leaf point
   estimate is already RED.
7. S unordered is retired: it enumerates all available arms, has no
   disjoint-FIRST route, and is slower than the accepted-M2 idiomatic control
   on every success/internal/result point.
8. The first D assay was correctness-green but performance-RED. Formal
   success/internal/result ranges are 1.427–1.525× at 4, 2.708–3.406× at 8,
   4.607–5.403× at 16 and 9.559–12.212× at 33; the 9.559× AB point prevents
   bootstrap or admission. Every formal fixture is disjoint
   (`residuals: 0`); overlap correctness existed without a residual-route
   performance result. Candidate grammar heap was about 1.9–2.6× control.
9. U's reported four-run production JSON range of +21.3% to +45.4% has no
   raw log in its manifest and is unsealed. The guard remains RED, but that
   range carries no evidence credit. P2-L seals a later unchanged-production
   RED run at +82.7%; private prototypes do not cause it and receive no
   waiver.
10. P2-L success ranges from 0.0718× to 1.3079×. Callback loops,
    declarative ASCII tables, and a public sticky wrapper are killed. The
    native sticky RegExp remains the KISS incumbent.
11. Shaped JSON is 0.8728–1.0021×, the stylesheet-shaped fixture
    1.0937–1.2920×, failures 1.1658–1.2041×, and retained heap about 1.166×
    control. Complete products do not rescue the leaf loss. The staged
    full-product family, balanced-discard alternative and private source-leaf
    candidate are killed; their evidence remains reproducible.
12. P1/P2/P3 are complete as row-bound adjudication; isolated proof remains
    RED and formation Clean A/B remain blocked. Value stylesheet recovery and
    live Value plus logical `parse-that#jsonParser` receipts are later
    execution work, not isolated formation proof.
13. P2-UO closes the missing D assay at only 0.7362–2.2994× across twenty
    equal AB/BA state/value/internal/result/failure points. Several binding
    planes are slower than control; stable 8/16/33-member grammar heap is
    about 2.06–2.40× control. D is terminally killed with S and no unordered
    candidate survives.
14. P2-UO recovery has a unique FIRST code. It proves successful immutable
    recovery in a mixed-overlap product, but not same-FIRST speculative
    recovery-frontier equality.
15. P2-C puts compiled construction at 0.0597–0.0785×, build-plus-first-parse
    at 0.0696–0.0846×, stabilized success below 10× at every scale under 753,
    and Unicode cold routing at 1.4996× hot. The staged graph, prefix table and
    compiled parser surface are terminally retired.
16. No replacement candidate survives P2. The surviving transaction,
    run-state, slot/span, recovery and consumer-result mechanisms are
    behavioral laws around the incumbent closure control, not a candidate.
17. `/utils` has no live source consumer and only one Value prototype use;
    packrat has no live Value plus logical `parse-that#jsonParser`
    consumption. Both are excluded from a successor unless two exact consumer
    receipts prove otherwise.
18. P3 same-FIRST closes the outstanding hostile gap by falsifying D, not by
    repairing it. With diagnostics disabled, four recovery frontiers differ:
    M2 is `10/6/1/1/10/5`, D is `10/10/2/2/10/6`; diagnostics enabled makes
    D converge to M2. The cause is reordered speculative provenance, not
    rollback leakage. Accepted-M2 closure traversal is the smallest law.
19. P3 direct closure is only 1.0656–1.5238× on warmed success projections.
    Prewarmed construction calls are 1.7118–1.9534× and grammar heap 40.5%
    smaller, but retained parse-state heap is 12.4% larger. Its omitted
    equivalence, cold, shape and bootstrap planes remain RED. The candidate
    is killed.
20. P1/P2/P3 are complete; isolated every-subject proof remains RED because
    no candidate exists. Formation Clean A/B, packing and execution cannot
    begin.
21. A fresh canonical-document replay leaves every structural proof green
    but `proof:perf` RED at +16.0% JSON against the 15% guard (2,022 ns
    versus 1,742 ns). The document-only diff is not causal and the RED result
    is not waived.

## Next executable transaction

Resume B.W0 after complete P3. Every implemented replacement family is
terminally retired.

### Subject

The direct closure-kernel cut is complete and killed at `19c1e12`. Continue
only if a genuinely new generic mechanism has one exact Value-shaped need,
one logical `parse-that#jsonParser`-shaped need and an executable reason it
can escape the measured success-product ceiling. Keep CSS grammar/domain
types in Value.

### Required laws

- preserve exact UTF-16 slots/spans, immutable recovery evidence, typed
  faults, failure frontiers and scalar rollback;
- preserve accepted-M2 traversal provenance and same-FIRST frontier bytes;
- keep the compiled graph/table, unordered engine, generic source leaf,
  compiler-owned result, `/utils`, unconsumed packrat and private direct
  closure runtime retired;
- preserve S7's generic laws without elevating its local subset to
  every-subject proof;
- no decoded-token object, token list, scanner result, global trivia layer or
  raw-source alias;
- no new registry/validator apparatus beyond the smallest exact evidence
  table.

### Admission order

1. State the novel generic mechanism and exact two-consumer need before
   source work. A renamed or recombined killed family is inadmissible.
2. Implement only an isolated private prototype with no compiler, table
   builder, tokenizer, scanner, VM, event tape, compatibility layer or second
   runtime.
3. Re-run the unchanged shaped stylesheet and JSON corpora plus
   4/8/16/33/96/753 cold/hot/result planes.
4. Run exact bootstrap only if every point estimate clears 10×. Otherwise
   retire the mechanism and keep formation RED.
5. Formation Clean A/B remain blocked until an isolated candidate clears the
   complete proof. Production freeze, packing and consumers remain later.

Do not begin Value-owned CSS grammar work, production-source execution,
candidate packing or consumer migration from this repository.

## Verification commands

From `/Users/mkbabb/Programming/parse-that-css-totality/typescript`:

```sh
npx tsc --noEmit --project tsconfig.json
npx vitest run --config test/prototypes/pass3/u/vitest.config.ts
npx vitest run --config test/prototypes/pass3/l/vitest.config.ts
npx vitest run --config test/prototypes/pass3/products/vitest.config.ts
npx vitest run --config test/prototypes/pass3/p3/vitest.config.ts
npx vitest run --config test/prototypes/pass3/s/vitest.config.ts
npx vitest run
npm run build
npm run proof:manifest
npm run proof:no-css-surface
# Run proof:perf and preserve its raw RED/GREEN output; do not waive it.
```

From the repository root:

```sh
git diff --check
git status --short
shasum -a 256 -c \
  docs/tranches/B/artifacts/pass3/l-source-leaves/MANIFEST.sha256
shasum -a 256 -c \
  docs/tranches/B/artifacts/pass3/p2-shaped-products/MANIFEST.sha256
shasum -a 256 -c \
  docs/tranches/B/artifacts/pass3/p2-unordered-overlap/MANIFEST.sha256
shasum -a 256 -c \
  docs/tranches/B/artifacts/pass3/p2-cold-hot/MANIFEST.sha256
shasum -a 256 -c \
  docs/tranches/B/artifacts/pass3/p3-same-first/MANIFEST.sha256
shasum -a 256 -c \
  docs/tranches/B/artifacts/pass3/p3-direct-closure/MANIFEST.sha256
```

## Canonical reading order

1. `B.md`
2. `PROGRESS.md`
3. `waves/W0.md`
4. `coordination/CONSTELLATION.md`
5. `FINAL.md`
6. this handoff
7. `research/P1-HASH-BOUND-REGISTRY-2026-07-29.md`
8. `research/P2-FULL-SUBJECT-DISPOSITION-2026-07-29.md`
9. `research/P3-FULL-SUBJECT-DISPOSITION-2026-07-29.md`
10. `artifacts/pass3/p3-direct-closure/README.md`
11. `artifacts/pass3/p3-same-first/README.md`
12. `artifacts/pass3/s7-immutable-recovery/README.md`
13. `artifacts/pass3/s8-bounded-recursion/README.md`
14. `artifacts/pass3/u-unordered/README.md`
15. `artifacts/pass3/l-source-leaves/README.md`
16. `artifacts/pass3/p2-shaped-products/README.md`
17. `artifacts/pass3/p2-unordered-overlap/README.md`
18. `artifacts/pass3/p2-cold-hot/README.md`

Formation remains RED. Execution has not begun. `NO RELEASE`.
