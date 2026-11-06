# Invocation kernel v2

Status: **FALSIFIED by the first hostile audit; retained as executable evidence**.

## WHAT

This is the second executable Tranche T invocation-kernel prototype. It is
isolated from shipping source and deliberately replaces, rather than extends,
the falsified first prototype.

The public surface is an opaque `Parser<T>`, typed combinators, `parseFull`,
`parsePrefix`, and one discriminated result algebra. `Run`, `Step`, parser
construction, definition nodes, memo cells, and choice frames remain private.
Every parse creates a new `Run`; immutable definition objects are memo keys, so
there is no process-global parser-number allocator.

The prototype also encodes:

- branded UTF-16 offsets;
- nearest-choice commitment, with inner cuts unable to poison an outer choice;
- checkpoints covering cursor, value, evidence, diagnostics, recovery depth,
  the transactional memo journal, choice frames, and LR stack/head/growth
  frontiers;
- entry-relative evidence and diagnostic deltas in memo answers;
- explicit rejection or replay of diagnostic-producing memo entries, and
  unconditional rejection of memoized cut effects;
- `Empty`, `Evaluating`, `Growing`, and `Done` memo-cell states;
- fixed-point growth for direct, indirect, mutual, and nullable left recursion,
  with a 10,000-round hard budget;
- zero-width repetition failure and exception-safe invocation ownership.

## WHY

The first prototype let cached answers own caller commitment and represented a
parse as a process-wide mutable machine. That shape cannot make nested parses,
speculation, recovery, or left recursion compositional. V2 moves all mutable
authority into an invocation and keeps choice commitment out of cache entries.

## Verification

Run from the repository root:

```sh
./typescript/node_modules/.bin/tsc \
  -p docs/tranches/T/prototypes/invocation-kernel-v2/tsconfig.json

PT_V2_OUT="$(mktemp -d)"
./typescript/node_modules/.bin/tsc \
  -p docs/tranches/T/prototypes/invocation-kernel-v2/tsconfig.json \
  --noEmit false --outDir "$PT_V2_OUT"
node "$PT_V2_OUT/runtime.test.js"
```

The strict type test proves tuple/choice inference, result narrowing, parser
invariance, and offset branding. The runtime test proves cross-source and nested
isolation, speculative memo rollback, memo-after-cut behavior, diagnostic memo
replay/rejection, inner/outer cut scoping, full/prefix parsing, multibyte UTF-16
offsets, zero-width repetition termination, throw unwind, and direct/indirect/
mutual/nullable/budgeted/throwing LR.

## Boundary of proof

This is executable architecture, not a shipping parser. It does not yet prove
memory bounds, production error formatting, recovery synchronization, semantic
predicate handling, or parity with the Rust engine. The 10,000-round LR budget
is a fail-closed wall; the prototype does not claim a static termination proof.
Rules are intrinsically memoized and replay entry-relative diagnostics, but
cut-bearing LR rules are not yet statically rejected. Shipping adoption must
either add that effect proof or make rule commitment an explicit replayable
effect before the kernel can be considered complete.

## Hostile counterexamples

The first hostile audit found five shipping-critical failures not covered by the
green examples:

- recovery restores cursor/evidence but not `rootCommitted`, so a consumed inner
  cut marks a later unrelated failure committed;
- every rule advertises `Effect.None`; a cached rule therefore drops an executed
  cut and can be wrapped in ordinary memo despite its transitive cut effect;
- growth-budget exit leaves a reachable `Growing` cell whose 10,000-byte partial
  answer can be reused by a later alternative to produce fail-open success;
- nullable growth rejects a rule first reached in a later round (`A <- A B / ε`,
  `B <- "x"`), stopping at the empty seed;
- ordinary memo can cache an answer dependent on an earlier LR seed and freeze the
  growth frontier (`M = memo(A "a")`, `A <- M / "x"`).

V3 must make failure/control state transactional, compute transitive rule effects,
leave every LR exit terminal, admit late-discovered nullable participants, and
either version ordinary memo by LR head/seed or reject rule-dependent memo. It
also needs state-transition assertions, a bounded grammar oracle, and memory/deep
recursion evidence before production adoption.
