# Pass 1 Sol adjudication: parse-that executable fanout

## Receipt

- Formation base: `ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42`
- Fanout receipt: `79ef4b8` (formation base plus the banked portfolio and
  shared born-RED probe)
- Input: round-zero families R/E/S/V/D/K and the shared runtime-kernel probe
- Adjudicator: GPT Sol, `xhigh`
- Status: `PASS 1 FORMED / 0% CONVERGED / NO RELEASE`
- Scope: generic parse-that mechanisms only
- Owners: parse-that owns reusable runtime/combinators; Value owns CSS grammar,
  CSS semantics, and UI; BBNF receives one boundary packet after W3

Pass 1 is three executable units, not six miniature frameworks. It tests the
three load-bearing uncertainties before spending code on unordered CSS grammar
or static grammar analysis:

1. can closure combinators become transactionally sound without becoming a new
   runtime;
2. can recognition/projection actually remove hot semantic allocation without
   recreating a second tree;
3. does explicit control need a VM, or can a trampoline retain the simpler
   combinator model without allocation collapse?

No unit edits `typescript/src/**`, adds an export, authors CSS, or claims a
production winner. S and D remain live research families; they are deliberately
not implemented before the smaller runtime questions produce evidence.

## Shared-law correction

The last checkpoint case in
`typescript/test/runtime-kernel.probe.test.ts` conflates transactional rollback
with failure-evidence rollback.

For the source `a?x`, the rejected arm successfully recovers through offset 2
and then fails on `string("z")`. The later arm succeeds through offset 1, after
which the enclosing `string("!")` fails. Correct final state is:

```ts
{
    offset: 0,
    value: "seed",
    isError: true,
    furthest: 2,
    expected: ['"z"'],
    diagnostics: 0,
}
```

The checkpoint restores:

- cursor and semantic value;
- capture/event/output lengths;
- recovered-diagnostic length;
- live nesting depth and other branch-local effects.

It does **not** restore:

- furthest-failure offset and the expected-set joined at that offset;
- total work spent;
- maximum observed depth.

Suggestions and secondary spans belong to the furthest-failure join, not the
rollback journal. Advancing the frontier replaces them; a tie joins them.
Recovered diagnostics are committed semantic effects and therefore truncate
when their enclosing branch is rejected.

Pass 1 prototype tests must use the corrected expectation. The shared file is
not amended during prototype fanout because it is a baseline defect receipt,
not a candidate implementation.

## Fanout and file ownership

| Unit | Families tested | Worktree | Exclusive files | Hard implementation cap |
|---|---|---|---|---:|
| P1-R | R | `/Users/mkbabb/Programming/parse-that-css-totality-p1-r` | `typescript/test/prototypes/pass1/r/**` | 280 LOC |
| P1-E | E | `/Users/mkbabb/Programming/parse-that-css-totality-p1-e` | `typescript/test/prototypes/pass1/e/**` | 320 LOC |
| P1-VK | V and K | `/Users/mkbabb/Programming/parse-that-css-totality-p1-vk` | `typescript/test/prototypes/pass1/vk/**` | 420 LOC combined |

Each cap counts runtime/prototype code but not fixtures, tests, or the profile
driver. Each unit has a further 260-LOC cap for tests plus profiles. Generated
files and copied source are forbidden. A cap overrun stops the unit; it does not
earn a documentation exception.

The parent creates the sibling worktrees from the same base:

```sh
git worktree add -b codex/css-totality-p1-r \
  /Users/mkbabb/Programming/parse-that-css-totality-p1-r 79ef4b8
git worktree add -b codex/css-totality-p1-e \
  /Users/mkbabb/Programming/parse-that-css-totality-p1-e 79ef4b8
git worktree add -b codex/css-totality-p1-vk \
  /Users/mkbabb/Programming/parse-that-css-totality-p1-vk 79ef4b8
```

Agents may add only `kernel.ts`, `kernel.test.ts`, and `profile.test.ts` inside
their exclusive directory. They return the diff, LOC count, commands, raw
profile JSON, and kill-condition disposition. They do not commit.

## Unit P1-R: run-owned journaled closures

### Question

Can the existing closure architecture gain a complete transaction and exact
result contract with fewer mechanisms than a compiler, VM, or compatibility
layer?

This is a falsification of the already-routed opaque run/result proposal, not a
novelty claim. The prototype must expose any casualty rather than hide it behind
legacy aliases.

### Minimal mechanism

- One immutable parser definition: a closure receiving one run.
- One run-local mutable record with source, cursor, semantic value, recovered
  diagnostics, failure frontier, work count, live depth, and max depth.
- One scalar checkpoint containing only rollback fields and journal lengths.
- One fresh, opaque result returned by each invocation. Parser definitions store
  no last state and all diagnostic/memo data are run-owned.
- Four construction operations only: `literal`, exact `seq`, `choice`, and
  `recover`.
- One internal `capture` operation may record numeric start/end. It must not
  materialize a substring or create a parallel span-parser family.
- `seq` allocates exactly one fixed-length output and preserves successful
  `undefined`, `false`, `0`, and `""`. There is no implicit discard rule.

Candidate public API count: **zero**. Candidate internal operation count:
**five**, including `capture`.

### Born-RED obligations

The prototype test must first demonstrate the equivalent baseline defect, then
pass all of these against P1-R:

1. the corrected `a?x` checkpoint result above;
2. a failed outer branch truncates a nested recovered diagnostic;
3. failures tied at one furthest offset join labels without duplication;
4. work remains monotone across five rejected alternatives;
5. `[undefined, false, 0, "", capture]` retains five exact slots;
6. two nested and two sequential runs share no diagnostics, memo, result, or
   mutable parser state;
7. a parser result from another source/run cannot be committed;
8. recovery sync that does not advance returns a typed fault;
9. configured nesting faults before the host stack with a safety margin;
10. runtime output and TypeScript tuple type agree exactly.

The receipt must also name, without fixing, the observed casualties around
`Parser.state`, state/result divergence, loader identity, the core import SCC,
bundle size, and compatibility. A shim is a failed result.

### Commands

```sh
cd /Users/mkbabb/Programming/parse-that-css-totality-p1-r/typescript
npx vitest run test/runtime-kernel.probe.test.ts
npx vitest run test/prototypes/pass1/r/kernel.test.ts
npx vitest bench --run test/prototypes/pass1/r/profile.test.ts
npx tsc --noEmit
```

The first command remains RED on the 1.0 baseline. The latter three must be
GREEN for the isolated prototype.

### Kill conditions

- any rollback participant is restored outside the checkpoint operation;
- any process-global mutable run data remains;
- parser definitions retain their last result;
- diagnostic rollback also rolls back furthest/work/max-depth evidence;
- recovery needs a second transaction mechanism;
- equivalent warmed success or mismatch is over 5% slower than the 1.0 closure
  baseline in two fresh-process reruns;
- the implementation or API cap is exceeded.

### Must not implement

No CSS leaf, unordered combinator, packrat rewrite, generated code, VM,
trampoline, compatibility facade, public export, diagnostic renderer, or
general event tape.

## Unit P1-E: columnar recognition and projection

### Question

Can recognition/projection eliminate retained allocation while still supporting
the value-dependent decisions that real combinator grammars require?

### Minimal mechanism

- One source-direct closure recognizer with cursor, monotone failure/work
  evidence, and a truncatable flat numeric event journal.
- The event journal stores only `kind/start/end/slot` columns. It is not a token
  stream and is never parser input.
- One projector runs after successful recognition and produces the exact result.
- One recognition-only sink consumes identically but retains no event output.
- Four construction operations only: `literal`, exact `seq`, `choice`, and
  `capture`.
- One deliberately narrow eager scalar register may select a prebuilt parser.
  Arbitrary callback values or parser construction during a run are forbidden.

Candidate public API count: **zero**. The event schema remains private.

### Born-RED obligations

1. output-producing and recognition-only runs consume the same offset and return
   the same failure frontier on every fixture;
2. rejected alternatives restore event length but retain work/failure evidence;
3. exact sequence projects `[undefined, false, 0, "", span]`;
4. nested capture stores original UTF-16 offsets and materializes no substring
   in recognition-only mode;
5. a five-way prebuilt-parser selection works from one eager scalar;
6. a named counterexample shows whether arbitrary `.chain(value => parser)` can
   be expressed without an untyped semantic stack;
7. projected retained output is byte-for-byte equivalent to the closure
   fixture's output;
8. source/event/result data from one run cannot leak to another.

### Commands

```sh
cd /Users/mkbabb/Programming/parse-that-css-totality-p1-e/typescript
npx vitest run test/runtime-kernel.probe.test.ts
npx vitest run test/prototypes/pass1/e/kernel.test.ts
npx vitest bench --run test/prototypes/pass1/e/profile.test.ts
npx tsc --noEmit
```

### Kill conditions

- the journal becomes input to a second parser;
- projection requires an event for every discarded literal;
- arbitrary semantic values demand a general untyped stack;
- the event record duplicates the final AST;
- equal retained output exceeds the closure prototype's retained bytes;
- recognition-only is not at least 15% faster on capture-heavy input;
- the implementation or API cap is exceeded.

### Must not implement

No CSS grammar or token kinds, AST schema, recovery, unordered composition,
compiler, bytecode, public event API, general semantic stack, or source
normalization copy.

## Unit P1-VK: explicit-control tournament

### Question

Is stack-independent recursion best represented by a small flat instruction
machine, or can trampolined continuations preserve a simpler execution model
without transient-allocation failure?

### Minimal mechanism

Two independent internal implementations consume the same construction fixture:

- **V:** packed numeric op/operand arrays plus explicit instruction, call, and
  choice stacks; supported ops are `literal`, `seq`, `choice`, `call`, `return`,
  `accept`, and `fail`.
- **K:** construction-time continuations plus one trampoline loop with explicit
  success, mismatch, and fault bounces; supported constructions are `literal`,
  `seq`, `choice`, and `lazy`.

Both track cursor, furthest/expected, work, live depth, and max depth. Both
produce the same small nested-node count rather than an AST. Neither implements
capture, recovery, or memoization. Instrument executed instructions/bounces and
transient execution allocations directly.

Candidate public API count: **zero**.

### Born-RED obligations

1. depths 10, 1,000, and 10,000 complete without `RangeError`;
2. a configured depth limit returns the same typed `Nesting` fault in V and K;
3. work cannot be reset through a failing recursive alternative;
4. mutual recursion consumes the same source and node count in both routes;
5. success, mismatch, failure frontier, and maximum depth are equal;
6. a non-progressing recursion returns a typed fault;
7. V reports op dispatches/calls/stack peaks; K reports bounces and transient
   allocations;
8. shallow warmed output equals a direct 1.0 closure fixture.

### Commands

```sh
cd /Users/mkbabb/Programming/parse-that-css-totality-p1-vk/typescript
npx vitest run test/runtime-kernel.probe.test.ts
npx vitest run test/prototypes/pass1/vk/kernel.test.ts
npx vitest bench --run test/prototypes/pass1/vk/profile.test.ts
npx tsc --noEmit
```

### Kill conditions

- V loses warmed valid and mismatch throughput by more than 10% against the
  equivalent 1.0 closure fixture on two fresh reruns;
- V retains both an instruction graph and a closure graph at execution time;
- K allocates more than one transient object per successful leaf;
- K loses warmed parsing by more than 15%;
- removing K allocation introduces an opcode/tag switch, in which case its
  evidence folds into V and K retires;
- user-visible continuation or instruction types are required;
- the combined implementation cap is exceeded.

### Must not implement

No CSS, tokens, captures, recovery, unordered composition, left recursion,
packrat, GLL descriptor sets, source generation, debug/source-map framework, or
public `compile`.

## Equal-product profile matrix

Each profile is a Vitest benchmark run in a fresh process. Report median,
minimum, maximum, iteration count, Node version, V8 version, platform, and raw
JSON. A comparison is invalid until both sides return the same semantic product,
offset, failure frontier, and diagnostic set.

| Plane | Fixture | Required measures |
|---|---|---|
| construction | 6-way literals; 12-member sequence; recursive grammar | ns/grammar and retained bytes |
| cold | first valid and first mismatch per new grammar | ns/parse |
| warm success | rotating early/middle/late literal; fixed sequence | ns/parse, work, allocations |
| warm failure | common prefix then EOF; hostile late mismatch | ns/parse, frontier, work |
| transaction | five rejected arms, one success | ns/parse, checkpoints, journal peak |
| recovery | R only: 90% valid/10% recovered and hostile rollback | ns/parse, diagnostics |
| capture | R/E: retained span output and recognition-only | ns/parse, retained bytes |
| recursion | VK: depth 10/1,000/10,000 | elapsed, stack peaks, bounces/ops |
| memory | 100,000 retained equal outputs under `--expose-gc` | bytes/output, heap delta |
| optimizer | warmed representative valid/failure | opt/deopt reasons and CPU profile |

Do not compare a recognizer to an AST producer, a failure without diagnostics to
one with diagnostics, or a hand-selected late dispatch arm to a weighted input
set.

## Family dispositions after round zero

| Family | Pass 1 disposition | Reason |
|---|---|---|
| R | `PROTOTYPE P1-R` | Smallest transaction/result reset; must prove soundness and ≤5% cost. |
| E | `PROTOTYPE P1-E` | Independently tests the strongest allocation claim and its `.chain` gap. |
| S | `BANKED LIVE` | Static specialization may matter after runtime semantics settle; implementing it now would multiply mechanisms and overlap BBNF analysis. |
| V | `PROTOTYPE P1-VK` | Smallest explicit-control baseline for stack safety. |
| D | `BANKED LIVE` | Native unordered semantics remains unique, but state explosion/capture/recovery are untouched; reopen for the unordered tournament. |
| K | `PROTOTYPE P1-VK` | Underexplored control route; retire into V only on measured allocation/defunctionalization evidence. |

No family is selected, promoted, or retired in this adjudication.

## Pass 1 agglomeration rule

Sol receives the three raw receipts together and performs one cross-critique.
The next pass may:

- advance R or E only if its transaction/result laws and equal-product profiles
  survive;
- fold K into V only under K's explicit kill condition;
- open S only against an observed closure/VM optimization ceiling;
- open D and the surviving ordinary runtime together for the unordered
  `&&`/`||` tournament;
- demand deletion/consolidation accounting before any source edit.

Status remains **NO RELEASE**. No parse-that version, public API, Value
dependency, CSS grammar, or BBNF boundary changes in Pass 1. Release remains
impossible until a generic substrate is consumed by the Value-owned scannerless
CSS grammar and one non-CSS grammar, wins equivalent-output behavior and
profiles, deletes displaced machinery, and survives the required later clean
adversarial passes.
