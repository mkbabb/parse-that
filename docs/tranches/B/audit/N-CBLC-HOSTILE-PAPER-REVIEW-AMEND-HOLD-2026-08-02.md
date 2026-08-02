# N-CBLC hostile paper review — AMEND/HOLD

Date: 2026-08-02

Status: **AMEND/HOLD — PAPER ONLY — F0 DISPATCH WITHHELD — ZERO CREDIT**

## Coordinate and scope

This review preserves the source-only N-CBLC contract at SHA-256
`41181ff5088660e2c4b9b8df2392d3812d0119a4dc63b279c86dfab64fd8e067`.
It does not amend that immutable file, implement a lane runtime, create an F0
root, dispatch a task or reviewer, run a parser/benchmark, select PL-BE, or
grant source, correctness, performance, product, consumer, law, package, API,
candidate, release, deletion, or rebind credit.

Disposition remains `HOLD_BORN_RED / PL-BE_ONLY`. World novelty remains
rejected. Cross-input caller-bounded batching is provisionally orthogonal as a
problem boundary; its mechanism is not yet orthogonal.

## First material defect

```text
NCBLC_LANE_SEMANTICS_CLOSURE_ABSENT
```

The frozen 64-case matrix names `data-dependent chain` and `callback/effect`
without binding a parser graph, exact lane-to-batch assignment, divergent
continuation identities, shared-effect witness, or global callback order.
Those labels can be satisfied by tame rows that never reach the family-defining
scheduler/effect conflict.

Current `Parser.chain` constructs `fn(state.value).parser` dynamically. Two
lanes may therefore choose freshly allocated, nonidentical continuation parser
objects. A lane candidate has only two possible implementation shapes:

1. regroup/dispatch lanes by continuation `Parser` identity, which introduces
   the runtime map/parser-array scheduler forbidden by the C-family law; or
2. scalarize each divergent continuation, which can erase the claimed closure-
   call reduction and leave singleton cohorts.

Until an exact hostile row reaches both paths, the family can false-green by
testing only shared/static continuations.

## Required byte-bound witnesses

The amended contract must replace, not append to, the two vague behavior labels
inside the existing 64 logical cells.

### W1 — divergent dynamic chain

Parser graph:

```text
regex(/[ab]/).chain(v => string(v === "a" ? "x" : "y"))
```

The callback creates a new continuation parser object on every invocation. The
width-8 caller-order vector is exactly:

```text
["ax", "by", "ay", "bx", "ax", "by", "ay", "bx"]
```

It reaches both continuation identities and both success/failure products.
The case record binds input UTF-16 bytes, lane ordinal, batch ordinal, callback
ordinal, returned parser object identity, selected continuation identity,
cohort membership, closure-call count, and the complete scalar/candidate lane
product. The four UTF-16 classes remain separate exact fixture-byte variants;
no label or generator summary substitutes for their bytes.

Disposition:

- identity regrouping or parser-array/map scheduling: `FOLD C`;
- scalar continuation work: `PRUNE` unless the same width-generic runtime still
  reduces closure calls and the singleton-cohort gate remains GREEN;
- value/state/identity/order drift: `KILL`.

### W2 — shared caller-order effect

The second witness owns one shared mutable counter/log for the whole frozen
caller-order batch:

```text
counter = 0
log = []
regex(/[ab]/).map(v => {
  ordinal = ++counter
  log.push([ordinal, v])
  return {v, ordinal}
})
```

The width-8 vector is exactly:

```text
["a", "b", "b", "a", "a", "b", "a", "b"]
```

The fresh scalar oracle parses lanes sequentially in caller order with the same
counter/log instance. Candidate global trace, per-lane value, callback ordinal,
effect count, log bytes, and final counter must exactly equal that sequential
trace. Per-lane traces alone are insufficient. Reorder, duplication, omission,
parallel-effect racing, or hidden lane-local counters are `KILL`.

## Corrected correctness arithmetic

The old `20,544` total undercounts batch-wide graph identity and effect
semantics. The amended denominator is:

```text
batch graph identities = 720 batches × 29 parser names = 20,880
lane isolation         = 1,536 lane results × 4 assertions = 6,144
global effect traces   = 720 batches × 1 trace equality = 720
isolation subtotal     = 20,880 + 6,144 + 720 = 27,744
state fields           = 1,536 lane results × 12 fields = 18,432
total equalities       = 27,744 + 18,432 = 46,176
```

The 720 batch invocations and 1,536 lane results remain unchanged. Each of the
29 graph identities is checked per batch, not once per logical case. The four
lane assertions are checked per lane result. The callback/effect trace is one
batch-global equality, in addition to per-lane products.

## Complete typed comparator amendment

Every state field, value, continuation receipt, trace, and product uses one
typed JavaScript graph comparator. It must preserve and compare:

- prototypes and array/typed-array identity;
- own string and symbol keys;
- property descriptors without invoking accessors;
- holes versus `undefined`, `-0`, `NaN`, infinities, and bigint/tagged bytes;
- cycles, left/right alias bijection, shared identity, and non-aliasing;
- ordering, deep immutability, parser object identity, and source identity.

JSON stringify, digest/sink equality, one-way alias maps, enumerable-only
comparison, and label-only effect equality are RED.

## PL-BE executable-law amendment

The active authority pair is:

- constellation amendment SHA-256
  `1317ab01af574bc0d310fdef3435b7239c255b9f18e4ea3f658d432aa1595a61`;
- parser performance-law portfolio SHA-256
  `f58442ede34e190d7260385001abd2e958c1aaea39bc20a4ed1939939a8bf9c2`.

The 152 economics cells are a denominator only. Before F0 they must each bind
exact fixture bytes and selection vectors; arm/build/product hashes; trial,
warmup and aggregate counts; seven fresh process IDs/seeds; balanced AB/BA
order; compile-cache policy; cold/hot boundaries; raw unit-bearing fields; and
the exact ordered `7^7` joint bootstrap enumeration/index convention.

PL-BE must additionally bind conversion authority and inputs for nanoseconds,
allocation bytes, retained bytes, GC nanoseconds, package bytes, migration and
validation time, batch frequency, cohort distribution, scalar-path deletion,
and both real consumer workloads. `NetBenefit` keeps units and joint
uncertainty; it cannot fall through to a ratio or convert source/LOC into time
without a measured conversion. Missing trials, processes, bootstrap bytes, or
conversion inputs leaves the cell `RED / NOT LOCALLY EXECUTABLE`.

## Consumer and novelty disposition

The existing `0/2` owned caller-batch consumers remains a correct fail-closed
gate. A synthetic caller, future Value plan, or Keyframes reference is not a
consumer. No public API, scalar deletion, or PL-BE admission exists before two
exact production boundaries own already-independent input batches.

The amended paper must preserve:

- `FOLD C` when continuation identity scheduling carries the mechanism;
- `PRUNE` when scalarized continuation work defeats closure-call/singleton
  gates;
- `KILL` on global trace or complete-product drift;
- `HOLD` only if the same width-generic runtime proves W1 and W2 without a
  forbidden substrate and retains PL-BE plausibility.

## Exact next boundary

1. Preserve the contract SHA above as immutable v0 chronology.
2. Author one paper-only v1 amendment binding W1/W2 exact bytes, continuation
   and cohort receipts, closure-call counts, the `46,176` denominator, typed
   comparator, and exact PL-BE evidence schema.
3. Keep implementation, F0 root, parser/test/build/benchmark execution, and
   consumer/API work closed.
4. After owner freeze/hash, obtain two separately authorized independent paper
   reviews. This review dispatches neither.
5. Any unresolved scheduler/scalar fork, consumer deficit, law-schema gap, or
   review dissent remains `AMEND/HOLD`; there is no automatic F0.

## Terminal receipt

- contract: `41181ff5088660e2c4b9b8df2392d3812d0119a4dc63b279c86dfab64fd8e067`;
- review: `AMEND/HOLD`;
- corrected equality denominator: `46,176`;
- consumers: `0/2`;
- F0/source/execution/review dispatch: `0 / NONE`;
- product/law/downstream credit: `0`.
