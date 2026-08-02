# N-DNF-BIR hostile paper review — AMEND/HOLD

Date: 2026-08-02

Status: **AMEND/HOLD — PAPER ONLY — F0/F1 DISPATCH WITHHELD — ZERO CREDIT**

## Coordinate and scope

This review preserves the source-only N-DNF-BIR contract at SHA-256
`9a855c826997161b09d1096b3cd488aef6502280f29a23a52f359bf4749f363b`.
It does not amend that immutable file, choose a grammar authority, implement a
compiler/normalizer/emitter, create F0/F1, generate source, dispatch a task or
reviewer, execute JSON/CSS/parser tests, or grant translation, deletion,
correctness, performance, product, law, consumer, package, API, candidate,
release, or rebind credit.

World novelty remains rejected. The viable local hypothesis is a build-time
AOT compiler that emits one concrete scannerless direct-control artifact with
statically owned actions and no runtime graph, table, opcode loop, token plane,
event/CST projection, or fallback.

## First material defect

```text
NDBIR_TRANSLATION_AUTHORITY_ABSENT
```

The contract assigns the family-defining work to provisional `Grammar<T>` and
`ActionRef` descriptions plus normalization and emission, but its proposed
six-file F0 contains no normalizer source, emitter source, or generated
artifact. The mechanism cannot be inspected, translated, or falsified.

The atlas says authored combinators remain the grammar. The contract instead
permits a separately trusted Value-authored grammar/action description. Without
one chosen source authority, a human can manually pre-encode prioritized
choice, recovery, dispatch, rollback, and product construction into the build
IR and leave a trivial printer. That moves the hard work into manual grammar
reauthoring while claiming compiler and deletion credit.

The paper must choose exactly one mutually exclusive authority:

1. `TRANSLATE_EXISTING`: translate authenticated existing grammar source and
   bind a total source-node-to-lower-node witness; or
2. `NEW_CONSUMER_DSL`: admit a newly authored consumer grammar/action DSL and
   assign exactly zero translation and incumbent-deletion credit until an
   independently measured atomic consumer replacement.

A hybrid, per-production choice, human-authored lower form, or unspecified
authority is terminal RED.

## Independent secondary defects

### 1. ActionRef identity is not action closure

A name, hash, and closed input/output type do not prove executable purity. The
contract lacks action body bytes/AST, transitive dependency closure, imported
intrinsics, capability policy, mutable global/environment reads, clock/random/
I/O bans, allocation/freeze behavior, exception contract, and output ownership.

Required code:

```text
NDBIR_ACTION_CLOSURE_UNBOUND
```

### 2. Normalization has no preservation calculus

“Greibach-like” is a direction, not a proof. No per-node relation preserves
ordered/prioritized choice, consumed versus unconsumed failure, furthest
frontier, expected labels, rollback, recovery synchronization, diagnostics,
UTF-16 spans/provenance, recursion, typed depth fault, semantic action order,
or state growth. State explosion and lookahead duplication are unbounded.

Required codes:

```text
NDBIR_NORMALIZATION_WITNESS_MISSING
NDBIR_STATE_GROWTH_UNBOUNDED
```

### 3. Value action ownership is unresolved

Value owns CSS grammar/actions and parse-that owns the generic build compiler,
but the contract does not classify where Value action bodies live, who audits
their capabilities, which outputs are parse-that ABI values versus Value AST,
or whether generated source embeds Value-owned code. An ownership label cannot
replace a byte/AST/interface boundary.

Required code:

```text
NDBIR_VALUE_ACTION_OWNERSHIP_UNRESOLVED
```

### 4. JSON is an insufficient semantic witness

The proposed JSON smoke route does not reach arbitrary/data-dependent `chain`,
recovery/diagnostics, unordered `&&`/`||`, CSS escape/name longest match,
lookahead/frontier interaction, opaque syntax, or Value product construction.
Adding EOF also changes the current exported `jsonValue.trim()` behavior and
must be separately adjudicated rather than silently credited as equivalence.

Required codes:

```text
NDBIR_SEMANTIC_DENOMINATOR_INCOMPLETE
NDBIR_EOF_BEHAVIOR_UNADJUDICATED
```

## Required paper decomposition

The six-file cap is pruned. Before any source packet, a paper amendment must
separate and independently hash these interfaces:

| Interface | Required authority and output |
|---|---|
| `T0-SOURCE-AUTHORITY` | exactly one authority choice; exact source bytes/AST/grammar IDs; translation/deletion-credit law |
| `T1-ACTION-CLOSURE` | action body bytes/AST, typed inputs/outputs, transitive deps, intrinsic/capability allowlist, ambient-read bans, ownership |
| `T2-LOWER-NORMALIZE` | reviewable lower form and total source-node→lower-node relation; no manually supplied lower node |
| `T3-PRESERVATION-WITNESS` | per-node choice/failure/rollback/diagnostic/recovery/span/recursion/state-growth equations and counterexamples |
| `T4-DIRECT-EMITTER` | lower-node→concrete direct-control source mapping; static actions; no runtime graph/table/opcode/event/token/fallback |
| `T5-OUTPUT-AUDITOR` | external generated-byte/AST/call-data-graph verifier, compiler/grammar/action/emitter hashes, forbidden edges |
| `T6-PRODUCT-DENOMINATOR` | JSON plus chain/recovery/unordered/lookahead and later Value CSS obligations, each with complete immutable products |

The compiler/normalizer/emitter source contract must be reviewable; identity
hashes without source bytes are insufficient. Each lower node binds the exact
source node(s), preservation witness, emitted AST region, action closure, and
source/product rows. No interface may both produce and approve its own proof.

## Action-closure law

Every `ActionRef` is derived from an externally frozen action record containing
body bytes and pinned AST, input/output type hashes, imported module/file/export
bytes, transitive dependency graph, permitted pure intrinsics, capability bans,
exception behavior, allocation/freeze contract, and owner. The closure hash is
over the whole record and dependency hashes, not the action name.

Clock, randomness, process/environment, DOM, filesystem, network, mutable
module/global state, dynamic import/eval/function construction, reflection over
unowned objects, and unversioned callbacks are forbidden. Value-owned action
bodies remain Value inputs to the build; parse-that may verify/emit the closed
record but does not acquire CSS semantics or public API ownership.

## Per-node preservation witness

For every source node, the paper relation must bind:

- ordered-choice arm order, commit/consumption law, rollback checkpoint, and
  ordinary mismatch result;
- success value/action order, final offset, slots/spans, selection, provenance,
  and graph/descriptor identity;
- failure frontier, expected/suggestion/secondary-span bytes, found value, and
  typed fault;
- recovery entry/sync/exit, diagnostics order, line/column and source slice;
- recursion/lazy knot, live/max depth, nesting limit/fault, and zero-width
  progress;
- normalized state count, generated branch count/bytes, duplicated action
  count, and declared growth bound.

One missing or human-waived witness is `NDBIR_NORMALIZATION_WITNESS_MISSING`.
Unbounded or denominator-dependent state/source growth is RED before emission.

## Later F1 boundary — not authorized

Only after the amended paper packet and two independent paper reviews may an
owner consider one fresh F1. F1 would be limited to generated JSON artifact
bytes, exact source/command/toolchain receipts, external generated-source audit,
and differential complete products against the pinned semantic envelope.

F1 must include named rows for prioritized choice, chain, recovery,
diagnostics, recursion/depth, lookahead/frontier, Unicode/UTF-16, and unordered
composition in addition to JSON success/failure. EOF behavior is a separately
named decision and product plane. CSS remains a later Value-owned boundary;
JSON cannot grant CSS or full-denominator credit.

No F1 source, command, root, compiler, generated bytes, or execution is
authorized by this review.

## KEEP/FOLD/MOVE/SPLIT/PRUNE

- `KEEP`: prior-art/world-novelty rejection, zero-credit law, one direct
  artifact, complete products, UTF-16/spans/recovery/diagnostic fidelity, no
  scanner/token/CST/event/runtime fallback.
- `FOLD`: generic staging and deterministic fusion claims into S2/prior art.
- `MOVE`: action closure, normalization, preservation, emission, and output
  audit into explicit paper interfaces T1–T5.
- `SPLIT`: source authority from backend; JSON from CSS; paper/source from
  execution; translation credit from consumer replacement/deletion credit.
- `PRUNE`: six-file cap, identity-only `ActionRef` proof, human-authored lower
  form, and source-ready wording before compiler/witness authority.
- `HOLD`: only the local build-time AOT direct-artifact integration hypothesis.

## Born-RED owner codes

The paper amendment is not review-ready until it binds at least:

```text
NDBIR_TRANSLATION_AUTHORITY_ABSENT
NDBIR_COMPILER_SOURCE_ABSENT
NDBIR_ACTION_CLOSURE_UNBOUND
NDBIR_NORMALIZATION_WITNESS_MISSING
NDBIR_STATE_GROWTH_UNBOUNDED
NDBIR_VALUE_ACTION_OWNERSHIP_UNRESOLVED
NDBIR_SEMANTIC_DENOMINATOR_INCOMPLETE
NDBIR_EOF_BEHAVIOR_UNADJUDICATED
NDBIR_OUTPUT_UNAUDITABLE
```

Each code owns a concrete paper counterexample and cannot be suppressed by a
different code. A prose hash or source label without its bytes/AST/graph is
RED.

## Exact next boundary

1. Preserve the contract SHA above as immutable v0 chronology.
2. Author one paper-only v1 amendment choosing exactly one T0 authority and
   closing T1–T6 with explicit byte/AST/interface rows.
3. Keep F0/F1, compiler, normalizer, emitter, generated source, JSON/CSS
   execution, product mutation, package/API, and deletion closed.
4. Freeze/hash the amended paper, then obtain two separately authorized
   independent non-author paper reviews. This review dispatches neither.
5. Any undecided authority, absent source contract, unbound closure, missing
   witness, unauditable output, or review dissent remains `AMEND/HOLD`; there
   is no automatic F1.

## Terminal receipt

- contract: `9a855c826997161b09d1096b3cd488aef6502280f29a23a52f359bf4749f363b`;
- review: `AMEND/HOLD`;
- world novelty: `REJECTED`;
- translation/deletion credit: `0 / 0`;
- F0/F1/source/execution/review dispatch: `0 / NONE`;
- product/law/downstream credit: `0`.
