# Invocation kernel V3

Status: **executable Tranche T prototype; not shipping parse-that code**.

This clean-break prototype answers the V2 falsification in
`P2-EXECUTION-ADJUDICATION.md`. It does not patch, import, alias, or retain the V2
`Step` machine. It proves a smaller architecture:

- construction yields frozen, opaque, invariant `Parser<T>` references;
- `seal()` rejects dangling/duplicate rules, freezes the graph, computes rule
  SCCs/reverse edges, and closes diagnostic/recovery/cut/rule effects to a fixed
  point;
- execution uses heap continuation frames and invocation-local outcomes, visible
  choice identities, typed resource failures, and a closed typed journal;
- ordinary memo rejects transitive rule/cut effects and requires explicit replay
  for local recovery diagnostics;
- recursive cells are head-owned while growing and become journalled `Done`
  answers only at a terminal fixed point; budget and throw exits evict every
  transient cell;
- non-left, right-guarded recursion uses a dependency worklist; unguarded SCCs use
  simultaneous generations so equal-offset values agree with the independent
  structural oracle.

## Why this is the small correct shape

V2 mixed ambient cursor, evidence, diagnostics, commitment, memo, and LR state.
That made recovery select unrelated evidence, repetition masquerade as a choice,
cached answers lose cuts, ordinary memo freeze LR approximants, and budget exits
leak `Growing` cells. V3 makes failure/control/diagnostics result data. Only
grammar choices allocate control owners. Memo and terminal rule writes pass
through one first-write transaction journal; transient recursive approximants
never become generally observable.

The builder deliberately rejects programs whose caching proof would require a
caller- or generation-dependent key. This is a clean break, not a compatibility
route.

## Modules

- `src/graph.ts` owns construction, sealing, SCCs, reverse edges, and effect
  closure.
- `src/machine.ts` owns continuations, visible choices, recursive generations,
  resource exits, and terminal cleanup.
- `src/recursion.ts` owns the conservative right-guard proof selecting the fast
  dependency worklist versus simultaneous SCC generations.
- `src/state.ts` owns outcomes, evidence, relative cache answers, improvement,
  and the typed transaction journal.
- `src/types.ts` owns the public invariant parser, UTF-16 coordinate, result,
  diagnostic, option, and debug contracts.
- `src/index.ts` is the only declared package export.
- `test/` is external and source-isomorphic by concern; no test is co-located in
  production files.

## Executable proofs

The named hostile tests permanently promote all ten V2 counterexamples:

| V2 failure | V3 proof |
|---|---|
| stale recovered commitment | `H01` |
| repetition intercepts cut | `H02` |
| false rule effects permit unsound memo | `G03`, `G04` |
| ambient recovery evidence | `H04` |
| ordinary memo freezes LR | seal-time `G03` rejection |
| late recursive participants | `L02`, `L03` |
| budget exposes partial growth | `H07` |
| host-stack right recursion | `H08` at 100,000 code units |
| two undo closures per memo miss | `H09`, `P02`, `measure:state` |
| no package surface | `test`, dry-run pack, and `test:packed` |

Additional fixtures cover direct, indirect, mutual, nullable, nested,
multiple-entry-head, mixed left/right, unproductive, exception, memo replay,
diagnostic isolation, prefix/full, astral UTF-16, and transition traces.

The independent oracle imports no VM, graph, SCC, journal, or cache code. It
uses finite simultaneous approximants within independently derived SCCs. Its
deterministic corpus is:

- all 13,025 canonical two-rule grammars over epsilon, `"a"`, `"b"`, sequence,
  ordered choice, and either rule reference, with at most six structural nodes
  across both bodies;
- all 127 binary inputs of lengths zero through six for every canonical grammar
  (1,654,175 comparisons);
- 10,000 generated one-to-three-rule cases at recorded seed `0x5eedc0de`, up to
  twelve structural-budget units and twelve input code units, with zero discarded
  cases.

The trace verifier independently balances choice/head events, proves every cut
target was live, accepts only the declared rule transitions, and asserts zero
live transactions, choices, heads, journal entries, or transitional cells at
every public terminal result.

Measured on the fixed 10,000-address memo fixture, the journal high-water is
exactly 10,000 first-written addresses, post-run journal length is zero,
continuation high-water is three, and live transaction/head/transitional counts
are zero. The measurement reports the observed heap delta rather than installing
a machine-specific threshold.

## Exact commands

Run from the parse-that repository root:

```sh
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run typecheck
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 test
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:hostile
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run measure:state
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run clean
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run build
npm --prefix docs/tranches/T/prototypes/invocation-kernel-v3 run test:packed
(cd docs/tranches/T/prototypes/invocation-kernel-v3 && npm pack --dry-run --json)
```

`npm test` starts from a fresh test output directory. `test:packed` starts from a
fresh build, packs the declared files, installs the tarball into a disposable ESM
consumer, runs through the package export, and compiles a separate declaration
consumer. The dry-run artifact contains only the manifest, README, license,
JavaScript, and declarations: no TypeScript sources, tests, source maps, or
ambient workspace files.

## Deliberate limits and remaining RED facts

- This is an isolated prototype. No shipping parse-that module or consumer has
  been transposed; that remains RED until the hostile/adjudication loop accepts
  this carrier.
- The structural oracle is exhaustive only for its stated bounded language and
  generated only for its recorded 10,000-case distribution. Larger graphs and
  inputs remain outside that proof.
- User mapping callbacks are opaque impurity boundaries. Their returned values
  are cached; replay of external callback side effects is not promised.
- The conservative right-guard analysis optimizes only cycles whose recursive
  calls have a guaranteed consuming prefix in the defining rule. Other cycles
  intentionally take the simpler simultaneous path.
- The default step budget is a prototype policy, not a finalized public resource
  contract. Resource exhaustion is terminal and non-backtrackable, but production
  configuration/naming remains undecided.
- UTF-16 is proved at the TypeScript/public result boundary only. Rust/WASM
  coordinate parity and packed-consumer adoption remain separate Tranche T/U
  gates.
- No cross-invocation cache exists. Each run owns its memo/rule tables by design.
