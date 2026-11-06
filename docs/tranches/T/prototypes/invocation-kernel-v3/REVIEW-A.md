# Invocation-kernel v3 independent review A

Status: **RED for production transposition; estimated 75–80% convergence to the
adjudicated execution carrier**.

Reviewer: `/root/pt_invocation_v3_reviewer_a2`, session
`019f7713-abc7-72e3-b11f-2ef1800e4eb9`. Root verified recorded metadata as
`gpt-5.6-sol`, `xhigh`. The reviewer did not read another v3 review, made no
repository change, and used disposable probes only.

This is one skeptical input, not the final verdict. Independent review B and a
fresh adjudicator must reproduce or overturn each numbered finding.

## Replayed machine facts

In a disposable mirror under Node 26/npm 11, all documented commands passed:

- strict typecheck;
- 31/31 full tests and the named hostile suite;
- 1,654,175 bounded exhaustive oracle comparisons and 10,000 seeded cases;
- three consecutive clean left-recursion and limit runs;
- state measurement with journal high-water 10,000, final journal length zero,
  continuation high-water three, and no live terminal transaction/head/cell;
- clean build, packed ESM consumer, declaration consumer with
  `skipLibCheck: false`, and dry-run archive manifest.

The tarball contained the fifteen declared files only. Fresh distribution hashes
matched the repository distribution. These passing facts do not close the defects
below.

## Numbered findings for adjudication

### A1 — execution is not host-stack independent across SCCs

`machine.ts` calls `#solveRule()` directly from `#evaluate()` for a rule in
another SCC, and each solver recursively enters `#evaluate()`. The documented
100,000-code-unit H08 witness stays within one right-guarded SCC and does not
exercise this structure. A disposable consumer with 1,000 separately recursive
SCCs succeeded; 1,250 threw `RangeError: Maximum call stack size exceeded`.

The binding contract requires the evaluator's recursive control to live on the
explicit continuation/head machine. This is an architectural contradiction, not a
missing threshold test.

### A2 — an inner choice can swallow a cut aimed at an outer choice

A failure carrying outer choice identity 1 reaches inner choice identity 2 and
falls through the ordinary backtracking branch rather than passing through. The
grammar

```text
choice(sequence(commit("a"), choice(sequence("b", "x"), "b")), "ab")
```

succeeds on `"ab"`. The adjudicated scoped-control law requires a foreign token
aimed at a live outer choice to traverse the inner choice unchanged. Existing
tests cover inner-owned cuts and repetition interception, not this direction.

### A3 — the literal rule-cell transition contract is substituted

`RuleCell` declares `Evaluating`, `Growing`, and `Done`, but recursive approximants
live only in `Head.participants`. The rule table receives terminal `Done` writes;
`Evaluating`/`Growing` are emitted as synthetic trace labels rather than observable
table transitions. `transitionalRuleCells` therefore cannot witness the live
participants whose transition contract it purports to measure.

The narrower README architecture—head-owned approximants and only journalled
terminal `Done` cells—appears coherent in the reviewed cases, but it is a contract
substitution. A fresh adjudicator must either prove and supersede the binding
rule-table law or require actual journalled states; a trace label cannot silently
stand in for state.

### A4 — exception event traces remain unbalanced

Forced cleanup aborts transactions and truncates choice/head arrays without
emitting corresponding terminal close/abort events. A mapping exception left the
state census clean but produced `choice-open=1`, `choice-close=0`. L05 checks only
census fields and never passes a throw trace to `verifyTrace`; resource-result
traces do balance.

Terminal state cleanup is supported. The stronger event/provenance invariant on
exception paths is unproved and contradicted by the disposable trace.

### A5 — the packed public API exposes the sealed internal graph

Parser values themselves are frozen, keyless, invariant, and unforgeable in the
reviewed probes. Separately, exported `GrammarBuilder` exposes `_sealedGraph()`;
the method appears in generated declarations and compiled from a strict packed
consumer. It reveals nodes, transforms, captured values, rules, SCCs, and effect
sets through the root package API. An underscore is naming convention, not
encapsulation.

## Claim dispositions

### Supported within the stated boundary

- The carrier is a clean break: no v2 import, alias, fallback, or compatibility
  route was found.
- Parser objects are frozen/keyless and their generic parameter is invariant.
- Graph/rule/node arrays are frozen; duplicate and dangling rules fail; two builds
  produced stable graph JSON. Callback/value captures remain shallow ownership
  boundaries.
- Diagnostic/recovery/cut/rule effects reach a conservative fixed point, though
  the implementation globally iterates rather than explicitly executing the SCC
  condensation DAG.
- Astral literal and recovery probes report UTF-16 code-unit offset 2. Rust/WASM
  parity remains outside the claim.
- Local evidence/recovery, first-write memo journal, rollback/replay, compaction,
  bounded direct/indirect/mutual/nullable/late/mixed recursion, and typed resource
  cleanup behaved as documented.
- The independent oracle imports no runtime internals and derives SCCs itself.
  Its language is bounded and does not cover cut, recovery, memo, resources, or
  callback semantics.
- Packed ESM, strict declarations, archive allowlist, and deterministic build
  claims passed, subject to the public graph leak.

### Partial or unproved

- Callback impurity is explicitly outside deterministic semantics, but callback
  return values are memo-aliased within a run. `succeed(object)` and recovery
  fallback objects are retained by reference across invocations; later mutation is
  visible. A borrowed/reference ownership contract is required.
- All ten inherited classes have named inversions, but not every literal falsifier
  is promoted: H05 becomes seal rejection, H07 is not the exact 10,001-input
  witness, and the literal external-freeze/rule-table requirement is not met.
- Tests are external and concern-grouped, but lack direct state-journal,
  right-guard-classifier, foreign-control, deep cross-SCC, and throw-trace mirrors.

## Smallest clean-break revision

Before another production decision, a superseding v3 machine revision must:

1. represent inter-SCC solving as explicit continuation/head frames in the single
   run loop;
2. formalize foreign cut-token propagation and promote both nesting directions;
3. either journal real rule transitions or obtain a superseding adjudicated
   contract for head-owned approximants;
4. emit and verify terminal abort/close trace events on exception cleanup;
5. remove `_sealedGraph()` from the public runtime and declaration surface;
6. add literal external mirrors for every inherited falsifier and direct tests for
   each missing structural boundary.

The package harness, public result/types, graph/effect work after hiding internals,
and oracle infrastructure may be retained as evidence. `RunMachine` and the
recursive rule-state design are not authorized for transposition by this review.
