# Invocation-kernel v3 independent review B

Status: **REJECT; v3 is semantically falsified**.

Reviewer: `/root/pt_invocation_v3_reviewer_b`, session
`019f7722-71cf-7882-8804-714f546e9a73`. Root verified recorded metadata as
`gpt-5.6-sol`, `xhigh`. The reviewer read no v3 review/critic/adjudication or agent
output, changed no repository file, and ran disposable probes only under
`/tmp/parse-that-v3-review-b.nUusDi`.

This is the second skeptical input. A fresh adjudicator must reproduce or overturn
each numbered finding before selecting a successor.

## Replayed machine facts

On Node 26.0.0/npm 11.12.1 in a disposable copy:

- strict typecheck and 31/31 tests passed;
- the 13,025 × 127 exhaustive corpus produced 1,654,175 passing comparisons;
- all 10,000 seeded cases at `0x5eedc0de`, the hostile suite, and three fresh LR/
  limit processes passed;
- state measurement twice retained journal high-water 10,000, final journal zero,
  continuation high-water three, and zero live heads/transactions/transitional
  cells; heap deltas were intentionally observed, not thresholded;
- clean build, dry pack, packed ESM/declaration smoke, and two byte-identical packs
  passed; archive SHA-1 was `7eab871ca647bbdcd7ba1979f99dbc407ef4772b`,
  with fifteen files and 16,523 packed bytes;
- runtime root exports are exactly `GrammarBuilder`, `createGrammar`, `parseFull`,
  `parsePrefix`, and `utf16Offset`; declarations contain no `any`;
- the six-module production import graph is acyclic, while `machine.ts` is 809
  lines and owns run, choice, memo, LR, budget, trace, and cleanup;
- candidate/tranche files are untracked, so a clean repository-status gate does
  not pass.

These are genuine bounded facts; they do not negate the semantic failures below.

## Numbered findings for adjudication

### B1 — recovery makes the right-guard proof unsound and changes values

`minimumConsumption` delegates `recover` to its child, but runtime recovery can
succeed at the frame's entry offset. The proof therefore certifies same-offset
recursion as consuming and selects the asynchronous worklist instead of simultaneous
generations.

For grammar

```text
A <- unwrap(recover("x", null) A)
     unwrap(recover("x", null) A)
   / "a"
```

on `"aaa"`, the binding simultaneous generations produce:

```text
g1 = "a"
g2 = ["a", "a"]
g3 = [["a", "a"], "a"]
```

V3 instead returns `['a', ['a', 'a']]` at offset 3. The exact probe is
`probe-right-guard-value.mjs`; a 159,286-case differential found the same family.
This is both a false-positive guard proof and an observable fixed-point error.

### B2 — whole-input prepopulation evaluates unreachable callbacks

The unguarded simultaneous engine prepopulates every SCC rule at every source
offset and evaluates each participant. For

```text
A <- A / map("b", throw "unreachable-b") / "a"
parsePrefix(A, "ab")
```

the root can settle to `"a"` at offset 1 without reaching the callback. V3 evaluates
`A@1` and returns the callback throw. The binding requires entry-qualified active
participants, not whole-input eager semantic evaluation—especially across an
opaque callback boundary.

### B3 — callback-throw traces are unbalanced

A callback throw bypasses typed frame cleanup. Forced terminalization zeroes the
numeric choice/transaction/journal census but clears choices without `choice-close`.
The probe observes one open, zero close. L05 hides the failure by disabling trace;
the existing verifier would reject it. Numeric cleanup and preservation of the
original throw are supported; trace/proof totality is contradicted.

### B4 — the structural oracle omits binding control semantics

The oracle has no committed owner and collapses every non-success to ordinary
failure. Its generated language contains only epsilon/literal/reference/sequence/
choice; it does not hand-model recovery, cut, resource, rollback, memo replay, or
callback throw. It emits no category coverage, seed digest, or result digest. The
1,664,175 passing comparisons are real but cannot discover B1–B3.

### B5 — packed-consumer equivalence is smoke-only

The packed harness runs one literal ESM example and compiles one declaration
example. The 31 semantic/type tests still import source. Package identity, root
export, deep-subpath rejection, allowlisted file kinds, and pack determinism pass,
but there is no checked artifact manifest or tarball replay of the public suite.

### B6 — graph sealing still uses the host stack

Tarjan and effect traversal are recursive. Sealing 7,500 nested map nodes and a
5,000-rule acyclic chain throws `RangeError`; a 4,000-rule chain succeeds. The
100,000-code-unit runtime proof remains valid, but construction is not total for
deep legal graphs.

### B7 — public graph opacity is false

`GrammarBuilder._sealedGraph()` is public in runtime and declarations and returns
the frozen internal graph including original callback references. A probe confirms
callback identity exposure. Parser objects themselves remain frozen, keyless, and
unforgeable; builder capability leakage is a separate contradiction.

### B8 — journal keys and UTF-16 branding substitute structure/validation

Memo/journal address keys are composite strings rather than typed parser/rule plus
offset keys. `utf16Offset` is an exported unchecked cast and accepts `-1`, `-0.5`,
`NaN`, and `Infinity` unchanged. Astral parse coordinates themselves are correct;
the public constructor boundary is not.

### B9 — constant and fallback value ownership is unspecified

`succeed(object)` returns the same mutable object across invocations; mutation of
the first result changes the second. This may be a borrowed-reference policy, but
no copy/freeze/borrow contract is stated or tested.

### B10 — Goldilocks and source/packed isomorphism remain RED

Source modules are acyclic and tests are outside production. `machine.ts` retains
six major invariants in 809 lines, tests are flat concern files rather than a
source-isomorphic tree, and the packed harness does not run the same tests. Passing
positive fixtures do not prove the boundary.

## Supported bounded areas

- Clean break from v2; frozen null-prototype parser references and rejection of a
  forged parser.
- Frozen graph/node/rule/SCC arrays, duplicate/dangling rejection, and bounded SCC/
  reverse/effect closure.
- Current full/prefix result law and UTF-16 parse offsets.
- Existing inner-owned cut/repetition fixtures, outcome-local evidence/recovery,
  ordinary memo rejection/replay, first-write journal/rollback/compaction, and zero
  retained undo closures.
- Bounded direct/indirect/mutual/nullable recursion and typed resource cleanup.
- Independent structural relation evaluator within its declared narrow language.
- Package identity, ESM/declaration smoke, file-kind allowlist, and deterministic
  pack bytes, subject to B5 and the dirty/untracked status.

## Ten inherited counterexamples

Six are literal promotions: recovered commitment, repetition intercepting cut,
ambient recovery evidence, late nullable participant, deep right recursion, and
the package-harness failure family. Four are policy/measurement replacements:
transitive cut/diagnostic memo rejection, LR-dependent memo rejection, a smaller
explicit-budget resource test, and journal measurements replacing the `2N` closure
observation. Therefore “all ten permanently promoted” is too strong.

## Wave-level disposition

| Candidate wave | Review-B ruling |
|---|---|
| V3.0 package harness | mostly supported; four inherited cases are replacements |
| V3.1 graph/effects | bounded only; public graph and recursive sealing are RED |
| V3.2 machine/transactions | partial; numeric cleanup passes, throw trace fails |
| V3.3 LR generations | contradicted by B1 and B2 |
| V3.4 oracle/properties | contradicted by B4 and failure to catch B1/B2 |
| V3.5 packed closure | contradicted by source-only tests and unclean status |

Command-exit count materially overstates convergence. Production transpose has no
authority.

## Smallest clean-break successor proposed by reviewer B

1. Replace recursive `minimumConsumption` with a sealed least-fixed-point nullable/
   minimum-guaranteed-consumption analysis; recovery contributes zero.
2. Delete whole-input SCC prepopulation. Demand only entry-qualified participants
   reached from the active head, with simultaneous snapshots for equal-offset SCC
   growth and explicit continuation work for proved consuming recursion.
3. Promote the exact associativity, unreachable callback, and throw-trace probes.
   Extend the independent control oracle to committed owner, recovery, resource,
   rollback, and throw with category/result digests.
4. Replay the same public suite from the packed artifact, hide `_sealedGraph`, use
   structured keys, and remove or validate the unchecked offset constructor.
5. Make sealing iterative and split the machine only along proved invariant and
   dependency boundaries.

No alias, shim, fallback evaluator, dual package route, or production transpose may
accompany that successor.
