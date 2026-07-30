# Parse-that findings and resume handoff

Date: 2026-07-29

Status: **ACTIVE FORMATION — RED — NO RELEASE**

## Exact resume coordinate

- Repository:
  `/Users/mkbabb/Programming/parse-that-css-totality`
- Branch: `codex/css-totality-combinators-20260729`
- Source/evidence HEAD:
  `27bf87208070a59991276632eb4ba09417d9a490`
- Canonical authority HEAD:
  `b4293199368bbea31e386accb6c6e10a4ff77bc1`
- Accepted M2 control worktree:
  `/tmp/parse-that-m2-baseline-20260729`
- Accepted M2 coordinate:
  `de36d57dccdd20068b8c11a78f6e83d42e7d681f`
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
5. Current package gates are green: focused S suite 13/13; package 14/14
   files and 134/134 tests; strict TypeScript; production build; manifest,
   surface, subpath, packrat, no-span and no-dead-combinator proofs.

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
7. Unordered composition, generic CSS-needed leaves, Value stylesheet
   recovery, live Value/JSON receipts, P1→P2→P3 and both formation clean
   audits remain open.

## Next executable transaction

Resume B.W0 with the unordered-composition tournament. Do not reopen
recursion first.

### Subject

Prototype two private incompatible families against the same authored
combinator fixtures:

1. **S transaction/bitmask** — remaining-member mask, deterministic authored
   slots, FIRST routing for disjoint members, transaction-backed search for
   overlaps.
2. **D residual derivative** — cached source-direct residual states with
   state-count instrumentation and no capture/event/token plane.

### Required laws

- `&&`: every required member exactly once in any order;
- `||`: one or more distinct members in any order;
- optional and repeated members;
- disjoint FIRST fast path;
- overlapping FIRST with globally valid backtracking;
- duplicate input;
- nullable-member rejection before parsing;
- 4, 8, 16 and 33 members;
- a locally longest branch that prevents the globally valid parse;
- deterministic output in authored member slots;
- exact UTF-16 spans, diagnostics and speculative-effect rollback;
- successful recovery survives only on the chosen path;
- declared explored-state cap; exceeding it returns one typed fault before
  allocation or search explosion.

Do not claim generic `&&`/`||` support from a greedy parser. Do not materialize
permutations, tokens, events or a scanner-shaped intermediate product.

### Admission order

1. Implement hostile correctness fixtures in the private S/D paths.
2. Record source, state-count, checkpoint and allocation point evidence at
   4/8/16/33 members.
3. Retire any family that exceeds 10,000 residual/explored states, loses an
   exact product, or needs a public/CSS-specialized surface.
4. Compare equal values, authored slots, spans, diagnostics, recovery and
   failures against the accepted-M2 closure control.
5. Run single-process AB/BA points first. Run the seven-process exact
   bootstrap only if every binding point estimate is at least 10×.
6. Bank the source/evidence transaction, then reconcile
   `B.md`, `PROGRESS.md`, `waves/W0.md`, `coordination/CONSTELLATION.md` and
   `FINAL.md`.
7. Send the existing Value audit task one compact safe-boundary receipt.

After unordered adjudication, proceed to generic CSS-needed leaf prototypes.
Do not begin Value-owned CSS grammar work, production-source execution,
candidate packing or consumer migration from this repository.

## Verification commands

From `/Users/mkbabb/Programming/parse-that-css-totality/typescript`:

```sh
npx tsc --noEmit --project tsconfig.json
npx vitest run --config vite.config.ts test/prototypes/pass3/s/kernel.test.ts
npx vitest run
npm run build
npm run proof:all
```

From the repository root:

```sh
git diff --check
git status --short
shasum -a 256 -c \
  docs/tranches/B/artifacts/pass3/s8-bounded-recursion/MANIFEST.sha256
```

## Canonical reading order

1. `B.md`
2. `PROGRESS.md`
3. `waves/W0.md`
4. `coordination/CONSTELLATION.md`
5. `FINAL.md`
6. this handoff
7. `artifacts/pass3/s7-immutable-recovery/README.md`
8. `artifacts/pass3/s8-bounded-recursion/README.md`

Formation remains RED. Execution has not begun. `NO RELEASE`.
