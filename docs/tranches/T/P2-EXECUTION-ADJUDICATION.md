# P2 execution adjudication — invocation kernel v2

Status: **V2 FALSIFIED; V3 REQUIRED; this ruling supersedes every positive v2
execution judgment.**

## Authority and pinned subject

This is a fresh adjudication, not a vote or a merge of the hostile reports. Each
claim below was independently reduced against the files at parse-that
`ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42` with these SHA-256 values:

| file | SHA-256 |
|---|---|
| `kernel.ts` | `afe7f4638c74b12cfbe60e5ab24bed333af8bde9085e3a7e0a7b450ff5b80365` |
| `runtime.test.ts` | `a000c93d178e02464f7a3604dc80bca3ed2f302a6d73206409238371e09f8bc9` |
| `type.test.ts` | `223df75d5be82af5b16592b1da6d1f1c70f6ef7ed993a43f2d6ecffa407d2f97` |
| `package.json` | `e3ab42653fc398c0fe84dcbcc19dc3140227dc949f856b5dc62ff9944f34e82e` |

Declared adjudicator model: `gpt-5.6-sol`, reasoning effort `xhigh`. Recorded
session metadata remains subject to the campaign model-truth gate.

## Ruling

All ten hostile claims are **CORRECT**. None is merely a missing test. The first
eight are semantic counterexamples, the ninth is a direct space-bound violation,
and the tenth prevents the prototype from proving its advertised package surface.

| # | hostile claim | ruling | minimal decisive evidence |
|---:|---|---|---|
| 1 | `rootCommitted` and recovered cut are not transactional | **CORRECT** | A recovered inner committed failure followed by an unrelated failure at UTF-16 offset 2 returns `committed:true`. `Checkpoint` omits `rootCommitted` (lines 76–91, 208–230), while `choice` mutates it at lines 643–645. |
| 2 | `many` hides a choice frame and swallows a visible cut | **CORRECT** | `parseFull(choice(many(sequence(commit("a"), "b")), "a"), "a")` succeeds with `"a"`. `many` pushes the nearest frame at lines 690–692, so `commit` at lines 677–678 targets repetition machinery rather than the enclosing grammar choice. |
| 3 | rule effects are fixed to `None`; cached cut/diagnostic policy is unsound | **CORRECT** | `rule` hard-codes `Effect.None` at line 812. `memo(map(cutRule, identity))` is therefore accepted. After the rule is primed outside a choice, its cached answer replays without the cut and an enclosing fallback succeeds. The same false `None` lets a diagnostic rule bypass the default diagnostic-effect rejection. |
| 4 | recovery diagnostics can be selected from ambient evidence | **CORRECT** | Two sequential recoveries, the first failing at offset 1 on `"x"` and the second locally failing at offset 0 on `"z"`, emit two `"x"` diagnostics. `recover` reads the shared `run.evidence` at line 728 rather than a child-local failure, then restores and re-merges it at lines 733–735. |
| 5 | ordinary memo can freeze an LR approximant | **CORRECT** | For `A <- M / "x"`, `M = memo(A "a")`, `parseFull(A, "xaa")` stops after `"xa"` and returns EOF failure at offset 2. `M` cached the prior growth generation and the next LR round cannot observe the improved root. |
| 6 | late-discovered nullable/LR participants are rejected | **CORRECT** | For `A <- A B / ε`, `B <- "x"`, `parseFull(A, "x")` returns the empty approximation and then EOF failure at offset 0. `recallRule` synthesizes failure for an empty rule absent from the already-fixed `head.involved` set at lines 415–422. |
| 7 | growth-budget backtracking can reuse a partial `Growing` answer | **CORRECT** | On 10,001 `a`s, `choice(Budgeted, Budgeted "a")` succeeds with length 10,001: the first alternative hits the wall, the second reuses the reachable 10,000-byte `Growing` cell. The early return at lines 447–450 bypasses the terminalization loop at lines 466–480; rule cells are not in the rollback journal. |
| 8 | deep right recursion consumes the JavaScript call stack | **CORRECT** | A non-left-recursive `R <- "a" R / ε` on 5,000 `a`s throws `RangeError: Maximum call stack size exceeded`. Definition evaluation is host recursion through `Step`/`def.step`, not an explicit continuation machine. |
| 9 | an ordinary memo miss retains two undo closures per cell | **CORRECT** | A miss calls `setMemo` for `Evaluating` and `Done` (lines 788–795); every call pushes a closure (lines 294–306). Successful execution never advances or compacts a journal base. Thus `N` distinct successful misses retain exactly `2N` closures until the `Run` dies, in addition to the cells. |
| 10 | no executable npm test or pack surface exists | **CORRECT** | `npm test` reports `Missing script: "test"`; `npm pack --dry-run --json` reports `Invalid package, must have name and version`. The manifest contains only `private` and `type`. |

### Exact counterexample results

The counterexamples were run from the repository root after compiling to a fresh
`mktemp -d` output directory. String arguments below abbreviate `literal(...)`;
all results are the observed JSON, not predicted values.

```text
recover(choice(sequence(commit("a"), "b"), "q"), "r")
  then "a", "c", unrelated "z" on "acx"
=> {"kind":"failure","offset":2,"expected":["\"z\""],"committed":true,
    "diagnostics":[{"offset":1,"expected":["\"b\""],"found":"cx"}]}

choice(many(sequence(commit("a"), "b")), "a") on "a"
=> {"kind":"success","value":"a","offset":1,"diagnostics":[]}

prime cutRule in recovery; memo(map(cutRule, identity)); then choose
sequence(wrapped, "b") / "a" on "a"
=> {"kind":"success","value":["r","a"],"offset":1,
    "diagnostics":[{"offset":1,"expected":["\"x\""],"found":""}]}

recover(sequence("a", "x"), "one") then recover("z", "two") on "a"
=> diagnostics [{offset:1, expected:["\"x\""]},
                {offset:1, expected:["\"x\""]}]

A <- memo(A "a") / "x" on "xaa"
=> {"kind":"failure","offset":2,"expected":["<end-of-input>"],
    "committed":false,"diagnostics":[]}

A <- A B / ε; B <- "x" on "x"
=> {"kind":"failure","offset":0,"expected":["<end-of-input>"],
    "committed":false,"diagnostics":[]}

choice(Budgeted, sequence(Budgeted, "a")) on "a" x 10,001
=> {"kind":"success","offset":10001,"valueLength":10001}

R <- "a" R / ε on "a" x 5,000
=> {"name":"RangeError","message":"Maximum call stack size exceeded"}
```

The compile and baseline commands were:

```sh
./typescript/node_modules/.bin/tsc \
  -p docs/tranches/T/prototypes/invocation-kernel-v2/tsconfig.json

PT_V2_OUT="$(mktemp -d)"
./typescript/node_modules/.bin/tsc \
  -p docs/tranches/T/prototypes/invocation-kernel-v2/tsconfig.json \
  --noEmit false --outDir "$PT_V2_OUT"
node "$PT_V2_OUT/runtime.test.js"

(cd docs/tranches/T/prototypes/invocation-kernel-v2 && npm test)
(cd docs/tranches/T/prototypes/invocation-kernel-v2 && npm pack --dry-run --json)
```

The first two commands were green. The runtime baseline printed its advertised
ten-field success object. The npm commands failed with the errors ruled above.

## Facts that survive v2 falsification

These facts were independently re-proved and may be transposed into v3. They do
not rescue v2 as a whole.

| fact | ruling | reproduced evidence |
|---|---|---|
| Public parser opacity | **CORRECT, bounded** | A produced parser is frozen, has `Object.keys(...) = []`, and a forged `{}` is rejected with `TypeError`. The evaluator remains private behind a `WeakMap`. This proves surface opacity, not graph sealing or semantic immutability of callback captures. |
| Result and combinator types | **CORRECT for the tested surface** | Strict `tsc` accepts result narrowing, tuple and choice inference, and all `@ts-expect-error` witnesses. It does not establish effects or package declarations. |
| Branded UTF-16 offsets | **CORRECT for the TS boundary** | An ordinary number is rejected as `Offset`; parsing `😀` advances from 0 to 2. No cross-runtime coordinate proof follows. |
| Invocation isolation | **CORRECT for non-shared user captures** | Repeated cross-source parses and a nested parse leave the outer parse successful; each `execute` allocates a new `Run`. |
| Basic LR examples | **CORRECT, non-total** | Direct `1+1+1` evaluates to 3; the existing indirect, mutual, nullable fixed-point, and throw-unwind fixtures pass. The counterexamples above bound this claim sharply. |
| Speculative ordinary-memo rollback | **CORRECT for completed memo cells** | In `choice(memo("a") "x", memo("a") "b")` on `"ab"`, the parser succeeds and the mapped memo body is called twice, proving the abandoned cell was removed. Rule cells are not covered. |
| Diagnostic replay where evidence is local | **CORRECT, conditional** | `memo(recover("x", fallback), {effects:"replay"})` called twice at offset 1 emits exactly two offset-1 `"x"` diagnostics. Ambient evidence and false rule effects invalidate the general claim. |

Focused reproduction output:

```json
{"keys":[],"frozen":true,"forged":"TypeError","rollbackKind":"success",
 "calls":2,"replayKind":"success","replayOffsets":[1,1],
 "replayExpected":[["\"x\""],["\"x\""]],"lrKind":"success",
 "lrValue":3,"isolatedKind":"success"}
```

## V3 architectural ruling

V3 is not a patch to the mutable `Step` machine. The smallest defensible kernel is
an immutable, sealed grammar graph plus one iterative run machine. The following
decisions are binding until executable evidence disproves them.

### 1. Seal the complete definition graph

Parser construction produces opaque references into a builder. `seal()` resolves
all rule references, rejects dangling or multiply-defined rules, freezes every
node, computes rule-call SCCs, computes reverse edges, and derives a transitive
effect summary to a least fixed point over the SCC condensation DAG. A rule thunk
must not remain capable of constructing or changing its body after sealing.

The effect summary has at least `diagnostic`, `recover`, `cut`, and
`ruleDependent`. `cut` and `ruleDependent` are semantic cache-policy inputs, not
documentation. User mapping callbacks are immutable references but remain an
explicit impurity boundary; the kernel promises no replay of their external side
effects.

This graph makes two simple cache rules possible:

- ordinary `memo` rejects any transitive rule dependency and any transitive cut;
  users factor reusable recursive work into a named rule instead;
- a cut-bearing nonrecursive rule executes uncached, while a recursive SCC with an
  outward cut is rejected at seal time. Local diagnostics may be cached only as
  entry-relative answer data and replayed under an explicit policy.

This deliberately rejects more programs instead of introducing generation-keyed
ordinary memo or caller-dependent cached cut tokens. It is the smaller correct
alternative. A later relaxation requires a new proof, not a compatibility path.

### 2. Replace shared `failed`/`evidence` state with explicit outcomes

Every node evaluation yields one of:

```text
Success(value, next, diagnostics, control)
Failure(localEvidence, diagnostics, control)
ResourceFailure(kind, localEvidence)
```

Failure evidence belongs to that evaluation. Ordered choice explicitly combines
failed-alternative evidence; recovery renders the returned child failure and
cannot inspect an ambient winner. `ResourceFailure` is not a recoverable mismatch
unless a public option explicitly says so.

Only grammar `choice` nodes allocate run-local, monotonically increasing visible
choice identities. `many`, lookahead, recovery, memo, and LR bookkeeping never
pretend to be choices. A cut carries the exact live choice identity it targets.
Sequence propagates it; the owning choice either consumes it on success or turns a
matching failed alternative into committed failure. Tokens aimed at an outer live
choice pass through; stale or doubly discharged identities are invariant failures.

### 3. Use a typed transaction journal with compaction

Checkpoints own scalar snapshots plus a journal mark. Mutable sparse stores use a
closed `JournalEntry` union containing the table kind, typed key, and previous
cell; there are no undo closures. A write barrier records only the first mutation
of one address in one transaction. Rollback exhaustively restores entries in
reverse order. Commit discards records older than the earliest live parent mark;
with no live checkpoint the journal is empty.

Diagnostics and failure evidence are outcome data, not ambient journal entries.
Control tokens and visible-choice stack positions are part of the scalar mark.
Rule and ordinary memo tables obey the same journal protocol, so speculative rule
growth cannot escape rollback.

### 4. Interpret with explicit continuations

Sealed nodes are executed by one loop over a discriminated continuation stack.
Sequence, choice, mapping, repetition, recovery, calls, memo, and LR growth each
have explicit frames. Parser nesting never recurses through the JavaScript host
stack; only a user callback invocation uses a direct host call. Callback throws
unwind the run through one terminal cleanup path and then rethrow.

### 5. Grow LR SCCs by worklist generations

For `(sealedScc, entryOffset)`, create one head generation with terminally owned
cells, an active-participant set, a worklist, and reverse dependencies. An empty
rule reached in a later round joins the current generation if it belongs to the
sealed SCC. A strictly better answer or newly admitted participant enqueues its
dependents. Improvement is ordered deterministically: success beats failure,
greater consumed offset beats shorter, and an equal-length established answer is
stable while failure evidence is merged separately.

The generation ends only when the worklist is empty or a typed resource limit is
hit. **Every** exit—initial failure, fixed point, budget, rollback, callback throw,
or invariant failure—converts each reachable participant to `Done` with a terminal
answer or evicts it. No `Evaluating` or `Growing` cell may be observed after the
head exits. Resource exhaustion can never expose a partial success.

## Required state invariants

Assertions are enabled in the prototype and an independent trace verifier checks
the same event stream in tests. V3 does not pass by examples alone.

1. Every node and rule reference belongs to one sealed graph; SCC, reverse-edge,
   and transitive-effect tables are complete and byte-stable across two seals.
2. Continuation, visible-choice, checkpoint, and LR-head stacks are balanced on
   success, failure, resource failure, rollback, and throw.
3. A checkpoint closes exactly once. Journal length never precedes its base, no
   record is a closure, an address is logged at most once per transaction, and the
   journal is empty whenever no checkpoint is live.
4. Memo transitions are only `Empty -> Evaluating -> Growing* -> Done` or a full
   rollback to the recorded prior state. `Done -> Growing` is impossible.
5. Every LR participant belongs to the head's sealed SCC and entry offset;
   generations and best consumed offsets are monotone; worklist membership and
   queued bits agree.
6. No terminal run, terminal head, or committed/rolled-back transaction exposes an
   `Evaluating` or `Growing` cell.
7. Failure evidence is entry-qualified and evaluation-local. Choice is the only
   component that merges sibling evidence; recovery consumes exactly its child's
   failure once.
8. Every cut target is a live visible choice. Repetition cannot intercept it; the
   owner discharges it exactly once; terminal success carries no stale target.
9. Cached diagnostics are entry-relative, replay exactly once per cache use, and
   cannot include pre-entry ambient evidence.
10. Return from `parseFull`/`parsePrefix` leaves no frame, choice, checkpoint, head,
    or journal entry. A typed terminal answer is the only remaining authority.

## Bounded independent grammar oracle

The oracle must not import the VM, memo cells, SCC grow code, effect analysis, or
transaction implementation. It interprets a small structural grammar AST by
finite semantic approximants: all rule calls use the previous simultaneous
generation, and generations continue until the finite input-position relation is
stable. Ordered choice is evaluated in source order per approximant.

The mandatory corpus is:

- exhaustive canonical grammars over `ε`, `"a"`, `"b"`, sequence, ordered
  choice, and up to two named rule references, with at most six structural nodes;
- every binary input of length zero through six for every exhaustive grammar;
- 10,000 seed-recorded generated cases with up to three rules, twelve nodes, and
  input length twelve, including direct, indirect, mutual, nullable, late-admitted,
  productive, and unproductive recursion;
- hand-modelled control traces for nested/sibling choices, cuts through repetition,
  recovery, rollback, diagnostic replay, resource exhaustion, and callback throw.

Compare success/failure, consumed UTF-16 offset, committed owner, and deterministic
expected-label set. Values are compared for literal/tuple fixtures; arbitrary map
callbacks are outside the structural oracle. Any oracle/VM disagreement is born
RED and minimized before implementation proceeds. Oracle exhaustion itself is a
test failure, never an ignored case.

## Ordered executable v3 waves

### V3.0 — freeze the falsifier and create a real package harness

Land the ten counterexamples above as external tests, retain v2 read-only, and add
`name`, `version`, `scripts`, `files`, and `exports` to the isolated v3 package.

Exact gates:

```sh
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run typecheck
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 test
(cd docs/tranches/T/prototypes/invocation-kernel-v3 && npm pack --dry-run --json)
```

The typecheck and package commands must execute rather than default; all ten
counterexamples must be RED before v3 implementation and retain their named IDs.
The dry-run file list contains only manifest, declaration, JavaScript, README, and
license artifacts—never `.ts`, test, source-map, or ambient workspace files.

### V3.1 — sealed graph, SCCs, and effect closure

Implement the builder/seal boundary, immutable node graph, rule-call SCCs, reverse
edges, and least-fixed-point effects. Delete lazy rule-body construction from the
execution path.

Exact gates:

```sh
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:graph
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:types
```

Two independent seals emit byte-identical graph/effect JSON; mutation, dangling
references, duplicate rule definitions, cut-bearing recursive SCCs, and ordinary
memo over transitive rule/cut effects are rejected by named tests. All parser
objects and internal graph nodes are frozen after seal.

### V3.2 — iterative outcomes, visible choices, and transactions

Implement the continuation loop, explicit outcomes/local evidence, visible choice
IDs, typed journal, write barrier, and journal compaction for nonrecursive nodes.

Exact gates:

```sh
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:machine
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:deep
```

Claims 1–4, 8, and 9 invert to green. Right recursion on 100,000 `a`s completes
without `RangeError`; maximum host stack depth is input-independent. At every
observable settle point the trace verifier accepts all ten invariants. For a
successful outer alternative containing `N` memo writes, journal length returns to
zero at choice commit; there are zero retained undo closures.

### V3.3 — terminal memo and LR worklist generations

Add rule memo cells, SCC heads, generation worklists, newly admitted participants,
terminal cleanup, and typed resource budgets. Keep ordinary rule-dependent memo
rejected.

Exact gates:

```sh
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:lr
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:limits
```

Claims 5–7 invert to green. Direct, indirect, mutual, nullable, late-participant,
multiple-head, throw, rollback, and budget fixtures pass in three consecutive
fresh processes. After every terminal path, a debug census reports zero reachable
`Evaluating`/`Growing` cells. Budgeted alternatives return typed resource failure
and can never be converted to success by backtracking.

### V3.4 — oracle, properties, and deterministic memory proof

Implement the independent oracle and the full bounded corpus. Record generated
seeds, minimize discrepancies, and measure the compact journal and continuation
stack on fixed inputs.

Exact gates:

```sh
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:oracle
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:properties
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run measure:state
```

There are zero oracle discrepancies, zero discarded generated cases, and zero
invariant violations. Repeated runs emit byte-identical seed/result JSON. Measured
journal high-water equals changes since the oldest live checkpoint, continuation
depth is linear but heap-resident, and post-parse live transaction/head counts are
zero.

### V3.5 — packed-consumer proof and hostile closure

Build once, pack, install the tarball into disposable ESM and declaration
consumers, and execute the same public tests only through declared exports.

Exact gates:

```sh
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run clean
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run build
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 test
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:packed
git -C /Users/mkbabb/Programming/parse-that status --short
```

Build and tests pass from an empty output directory; `npm pack --dry-run --json`
matches the checked artifact manifest; ESM identity and declarations work without
workspace source imports. Two fresh hostile audits are consecutively clean and a
fresh adjudicator resolves every finding. Only then may Tranche T transpose v3
into shipping source.

## Supersession consequence

V2 remains as a falsifier and source of bounded carriers only. Its mutable
`Step`/`Run` implementation, `ChoiceFrame`, closure journal, fixed `involved` set,
and early growth-budget return are prohibited implementation ancestors: they may
not be patched forward, aliased, or retained as a fallback. V3 must be developed as
the clean-break graph and machine above, and this adjudication stays RED until all
V3.0–V3.5 gates pass.
