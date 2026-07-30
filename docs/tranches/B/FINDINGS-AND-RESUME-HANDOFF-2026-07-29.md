# Parse-that findings and resume handoff

Date: 2026-07-29

Status: **ACTIVE FORMATION — RED — NO RELEASE**

## Exact resume coordinate

- Repository:
  `/Users/mkbabb/Programming/parse-that-css-totality`
- Branch: `codex/css-totality-combinators-20260729`
- Source/evidence HEAD:
  `5822ae2` (`perf(parser-prototype): falsify generic source-leaf widening`)
- P1 registry coordinate:
  `69f72f7` (`docs(parser-tranche): bind the row-complete P1 subject
  registry`)
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
Value-owned full CSS grammar and parse-that's JSON grammar. No tokenizer,
token array, token-event tape, scanner facade, separate lexing stage,
raw-source alias or fallback parser may appear.

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
8. Current correctness and structural gates are green: focused P2-L 8/8,
   S regressions 13/13, package 14/14
   files and 134/134 tests; strict TypeScript; production build; manifest,
   surface, subpath, packrat, no-span and no-dead-combinator proofs.

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
4. Balanced-discard fusion is narrower than recursive CSS AST construction.
   Keep it only as incompatible private research until the same exact
   generic semantic shape is demanded by both Value and JSON. Otherwise
   retire it as overfit.
5. The S8 mixed diagnostics-off/on trace has named candidate `parseState`
   and `mergeLabels` deoptimizations. It is not a clean hot-only seal.
6. No multiprocess bootstrap is warranted for S8 because the 96-leaf point
   estimate is already RED.
7. S unordered is retired: it enumerates all available arms, has no
   disjoint-FIRST route, and is slower than the accepted-M2 idiomatic control
   on every success/internal/result point.
8. D unordered is correctness-green but performance-RED. Formal
   success/internal/result ranges are 1.427–1.525× at 4, 2.708–3.406× at 8,
   4.607–5.403× at 16 and 9.559–12.212× at 33; the 9.559× AB point prevents
   bootstrap or admission. Every formal fixture is disjoint
   (`residuals: 0`); overlap correctness exists, but residual-overlap
   performance is unmeasured. Candidate grammar heap is about 1.9–2.6×
   control.
9. U's reported four-run production JSON range of +21.3% to +45.4% has no
   raw log in its manifest and is unsealed. The guard remains RED, but that
   range carries no evidence credit. P2-L seals a later unchanged-production
   RED run at +82.7%; private prototypes do not cause it and receive no
   waiver.
10. P2-L success ranges from 0.0718× to 1.3079×. Callback loops,
    declarative ASCII tables, and a public sticky wrapper are killed. The
    generic node is held only as a private shaped-product fixture; native
    sticky RegExp remains the KISS incumbent.
11. P1 is complete, P2 is active, and P3 plus formation Clean A/B remain
    blocked. Value stylesheet recovery and live Value/JSON receipts are later
    execution work, not isolated formation proof.

## Next executable transaction

Resume B.W0 by composing the smallest complete isolated Value- and
JSON-shaped products. Do not reopen unordered or recursion unless a shaped
product consumes the exact mechanism.

### Subject

Use the held private source leaf, S7 recovery, exact spans, recursion only
where structurally necessary, and consumer projection to form equal
stylesheet- and JSON-shaped products. Keep CSS grammar/domain types in Value;
the parse-that fixture expresses only generic mechanics.

### Required laws

- exact UTF-16 code-unit positions across CRLF, astral characters, lone
  surrogates, NUL and CSS-style escapes;
- identifier/name, escape, number, dimension, percentage, string, URL,
  balanced-delimiter and JSON recursive shapes only where the isolated
  products use them;
- one generic capture/span representation, not a family of CSS-specialized
  span builders;
- failure frontier, authored labels, immutable recovery evidence and scalar
  rollback identical to accepted M2;
- no decoded-token object, token list, scanner result, global trivia layer or
  raw-source alias;
- cold/hot, allocation, CPU, IC/deopt/GC and equal-result measurements at
  frozen small and denominator scales.

### Admission order

1. Freeze the smallest isolated Value-shaped and JSON-shaped product corpus,
   products, spans, diagnostics, recovery and failure forms.
2. Compose them only from the held private runtime mechanisms; add no public
   or CSS/domain surface.
3. Compare equal products against accepted M2/consumer controls at the exact
   same boundary.
4. Retire any mechanism that requires a second parser path, scanner-shaped
   product, or unconsumed generality.
5. Run single-process AB/BA points first. Run the seven-process exact
   bootstrap only if every binding point estimate is at least 10×.
6. Bank the source/evidence transaction, then reconcile
   `B.md`, `PROGRESS.md`, `waves/W0.md`, `coordination/CONSTELLATION.md` and
   `FINAL.md`.
7. Send the existing Value audit task one compact safe-boundary receipt.

Do not begin Value-owned CSS grammar work, production-source execution,
candidate packing or consumer migration from this repository.

## Verification commands

From `/Users/mkbabb/Programming/parse-that-css-totality/typescript`:

```sh
npx tsc --noEmit --project tsconfig.json
npx vitest run --config test/prototypes/pass3/l/vitest.config.ts
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
```

## Canonical reading order

1. `B.md`
2. `PROGRESS.md`
3. `waves/W0.md`
4. `coordination/CONSTELLATION.md`
5. `FINAL.md`
6. this handoff
7. `research/P1-HASH-BOUND-REGISTRY-2026-07-29.md`
8. `artifacts/pass3/s7-immutable-recovery/README.md`
9. `artifacts/pass3/s8-bounded-recursion/README.md`
10. `artifacts/pass3/u-unordered/README.md`
11. `artifacts/pass3/l-source-leaves/README.md`

Formation remains RED. Execution has not begun. `NO RELEASE`.
