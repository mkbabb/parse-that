# P6-SIR Sol design and Luna dispatch

Date: 2026-07-30

Status: **DESIGN/DISPATCH ONLY — ZERO CREDIT — NO RELEASE**

## Decision

P6 tests one mechanism only: a parser step returns one signed integer.

```text
Step = (runState, cursor) => signed integer

result >= 0  success; result is the next UTF-16 cursor
result == -1 routine mismatch; frontier evidence remains in runState
result == -2 typed fault; the sticky typed fault remains in runState
```

The ordinary semantic value remains in run state. No object, tuple, region
handle or state object is the hot control return.

This is the scalar observation split from P4 Region-Slot Return ABI. It is not
the P4 RSR family: regions, numeric/reference slabs, journals, output slots,
accepted-root reachability, deferred allocation and root finalization remain
pruned.

## Immutable coordinates

- accepted control:
  `de36d57dccdd20068b8c11a78f6e83d42e7d681f`;
- P4 owner adjudication:
  `270feca0d48ef7caab3d44ad9bcc62d9a6687870`;
- corrected P4 jury A1 manifest:
  `3297c808d66ed3c528134a2567a4f85ba7602769270868abfd701fa80ce0b311`;
- P5 executable negative evidence:
  `0bc0d37bfadf62ddde432686947309cc1741325e`;
- canonical P5/P6 routing:
  `3dca3330aae757a5b476ec2bc4ff0aa35ec339a9`;
- accepted-M2 source SHA-256:

```text
efec8b86685cdc592aae0a6c179b59bac257b31395f01ae4c07bf5fb8458348b  json.ts
4962e0212883ba16bc8a7639a8668d86c4fc8030ba9a49efb6126f3ba46cd8f5  parser.ts
ff9eb71f301e646d899b1f63c4ff85326991ad1b98a6b219748babead1b7f125  state.ts
```

The Luna continuation must use an immutable archive of accepted M2 and bundle
its exported live `jsonParser`. It may not rebuild the timed control from
candidate-shaped primitives.

## Novelty falsification

An encoding rename is not P6. The packet must prove all rows below before
timing.

| Predecessor | Its control ABI | P6 inverse |
|---|---|---|
| P3 direct closure `19c1e12` | `(state) => state`; every leaf/combinator mutates `state.offset` and branches on mutable `state.isError` | `(state, cursor) => integer`; internal success returns cursor, internal mismatch returns `-1`; `state.offset`/`state.isError` are projected once at the root and are not hot control flow |
| P4 RSR design | signed step plus region indices, checkpoints, numeric/reference slabs, output slots and finalizer | signed scalar only; no region/slab/output-slot/finalizer structure or deferred product walk |
| Luna F2 | region objects/arrays and region-switched runtime | no region object, region array, family switch or runtime route |
| P5 EUW `0bc0d37` | cursor or state success plus frozen singleton thrown on routine mismatch | routine mismatch is an ordinary negative integer; no throw/catch occurs on the routine path |
| accepted M2 | `(state) => state` and mutable error status | exact control only; no candidate compatibility executor, wrapper or fallback |

The taxonomy is RED if any candidate step:

- returns `runState`, an object, tuple, array or region handle;
- mutates or reads `runState.offset` or `runState.isError` between combinators
  as its internal success/failure discriminator;
- throws/catches routine mismatch;
- materializes a region, slab, journal, token, instruction, scanner result or
  generated parser;
- selects between internal/external, old/new or control/candidate executors at
  parse time; or
- uses a wrapper, shim, fallback, compatibility alias or alternate grammar.

The root may set the public final offset/error once after the signed step
returns. Typed faults remain separate from routine mismatch through the `-2`
tag and the run-state fault value.

## Minimal combinator surface

Implement only the generic surface consumed by the live dispatch JSON assay:

```text
literal
sticky regex leaf
map
or
then / next / skip
trim
wrap
sepBy
lazy
first-code-unit dispatch
public parseState/result projection
```

Every combinator has one raw executor. `or` and `sepBy` may restore only the
scalar run-state fields they directly own. They may not introduce a
transaction object, lease, region or journal. Ordinary value arrays/objects
required by the JSON product are allowed; control-plane arrays/objects are
not.

`dispatch` is the accepted live first-code-unit shape. An ordered-choice JSON
root is an invalid substitute.

## Grammar and product

Author one idiomatic `makeJson(primitives)` combinator grammar and instantiate
it for:

1. equality-only accepted-M2 primitives;
2. the P6 candidate.

The timed control remains the exact accepted-M2 exported `jsonParser`.

Use the four exact P5 fixture bytes:

```text
{"a":[1,true,null,"x"]}
[{"b":2},false,"y",null]
{"nested":{"arr":[1,2,3]},"s":"hello"}
[0,{"x":[true,false]},-12.5e2,"\u0041"]
```

Before timing, each fixture must prove:

- native expected value equals exact accepted-M2 value;
- the equality-only rebuilt M2 grammar equals exact accepted-M2 public
  result;
- P6 value equals the native value; and
- P6 immutable public success result equals exact accepted M2.

The public result includes source, value, final UTF-16 offset, error,
furthest, expected, suggestions, secondary spans and diagnostics. This
success-only product deliberately favors P6; failure/recovery omissions
cannot rescue a raw loss.

## Fatal raw assay

Run exactly seven fresh paired OS processes. In each process:

- verify the taxonomy and four-fixture equality first;
- warm control and candidate equally, outside measured batches;
- run ten balanced alternating AB/BA batches;
- parse 2,000 fixture selections per arm per batch;
- use a deterministic xorshift32 permutation seeded uniquely per process;
- time the same immutable public result projection on both arms;
- record PID, executable, Node, V8, seed, batch order, per-batch nanoseconds
  and `control/candidate` ratio.

Admission for this cell is conjunctive:

```text
all seven raw ratios >= 10.0000000000
```

The first ratio below `10x` is terminal. Complete all seven already-launched
rows for a stable negative range, then stop. Do not compute bootstrap, run
CSS, profile, or add mechanism variants.

Only if all seven raw rows clear `10x` may Luna compute the exact-bootstrap
95% lower bound; that lower bound must also be `>=10x`.

## Conditional continuation

If and only if the fatal cell and bootstrap are green:

1. extend equal products to scale 4/33 success, terminal failure,
   diagnostics-on recovered success and typed fault;
2. seal allocation, retained heap, IC, optimization/deoptimization and GC;
3. request an immutable Value-owned real combinator CSS vertical using the
   same generic P6 primitives;
4. prove nonzero P6 mechanism reachability from that vertical; and
5. continue toward the full 1,439/1,653 denominator, all recovery/source
   fidelity planes and Keyframes consumer obligations.

Luna must not author a Value CSS grammar, edit Value, or substitute a
handwritten CSS reader. A green raw result returns a boundary request; it
does not grant CSS, formation, candidate or release credit.

## Luna packet

Continue the existing Luna task
`019fb16a-09d7-7d80-ae5f-3d894e25855d`. Do not create a task.

Sole output root:

```text
/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-luna/outputs
```

Keep the packet small:

```text
runtime.mjs
json-factory.mjs
worker.mjs
run.mjs
raw.json
TAXONOMY.json
RECEIPT.md
MANIFEST.sha256
```

`MANIFEST.sha256` binds the other seven files. Verify it twice after the last
write. `RECEIPT.md` reports exact row count, unique PIDs, ratio range,
equality/taxonomy disposition, bootstrap reached or withheld, and exact
remainder. No sentinel profile/CSS files are created when raw is RED.

After Luna seals, a fresh Sol adjudication must independently verify the
manifest, taxonomy, accepted-M2 binding, equality arithmetic and all raw
ratios. The present Sol design pass grants no implementation or adjudication
credit.

## Ownership and stop law

Parse-that owns only this private generic runtime research. Value owns the
sole CSS grammar/consumer/UI. BBNF remains blocked until
`V.L6.css-path-abi-freeze`.

No production source, public API, candidate pack, consumer migration,
formation audit, release or downstream edge starts from this dispatch.
