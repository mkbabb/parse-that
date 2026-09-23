# Pass 1 Sol agglomeration: repair the closure runtime, do not add an engine

## Receipt

- Formation base: `ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42`
- Pass 1 fanout base: `79ef4b8`
- Agglomerated executable head: `17a8a4db0d334c8e0bb8082b6918c4ca5dc8a622`
- Inputs read in full:
  - `ROUND-ZERO-PARSE-THAT-PORTFOLIO-2026-07-29.md`
  - `PASS-1-SOL-ADJUDICATION-2026-07-29.md`
  - `typescript/test/runtime-kernel.probe.test.ts`
  - every `kernel.ts`, `kernel.test.ts`, and `profile.test.ts` under
    `typescript/test/prototypes/pass1/{r,e,vk}/`
- Independent rerun: R 9/9, E 9/9, and VK 10/10 focused laws green;
  `npx tsc --noEmit` green.
- Adjudicator: GPT Sol, `xhigh`
- Status: **PASS 1 AGGLOMERATED / NO FAMILY ADVANCES / NO RELEASE**

This receipt judges the executable source and raw measurements, not the
prototype authors' labels. It does not select a new runtime. It selects one
smaller next control: repair the current closure runtime in place and require
deletion of displaced state and rollback machinery.

## Terminal Pass 1 dispositions

| Family | Disposition | Decisive result |
|---|---|---|
| R | **KILL** | Correct transaction laws, but equal-product warmed success and mismatch are 4.01–4.66× the 1.0 closure control in two fresh processes; the hard limit was 1.05×. |
| E | **KILL** | The recognition sink is 57% faster than projected capture, but remains about 2.98× the equal direct closure; the executable counterexample cannot express arbitrary `.chain(value => parser)` without the forbidden general eager value/parser mechanism. |
| V | **KILL** | Stack safe through depth 10,000, but warmed V is 3.33× on rotating literals, 2.98× on fixed sequence, and 1.51–2.34× on mismatch; the hard limit was 1.10×. |
| K | **KILL** | Stack safe and slightly faster than V on shallow literals, but still 2.66× on rotating literals, 2.98× on fixed sequence, and 1.76–2.66× on mismatch; the hard limit was 1.15×. Its allocation count is asserted, not measured. |

There is no `ADVANCE` result. S and D were not executed and remain banked
research only; neither opens in Pass 2. K does not advance by folding into V
because V independently triggered its own kill condition.

The behavioral laws proven by R, the numeric span/sink observation proven by E,
and the explicit-depth fixtures proven by V/K are banked as tests and design
constraints. Their runtimes are not banked as production candidates.

## Harness-law correction

The command law in the Pass 1 adjudication is invalid for nested prototype
files.

`typescript/vitest.config.ts` contains:

```ts
test: {
    include: ["test/*.test.ts"],
}
```

Therefore:

- the top-level baseline command
  `npx vitest run test/runtime-kernel.probe.test.ts` is discoverable;
- a nested focused law needs
  `npx vitest run --config vite.config.ts
  test/prototypes/pass1/<unit>/kernel.test.ts`;
- `npx vitest run test/prototypes/pass1/<unit>/kernel.test.ts` reports no test
  files;
- `--config vite.config.ts` does not make `profile.test.ts` a benchmark.
  Vitest's benchmark default matches `*.bench.*` and `*.benchmark.*`, not
  `*.test.*`.

Pass 1 profiles therefore required an external benchmark include configuration.
The alternative is to rename a profile to `profile.bench.ts`. A future receipt
must not report the adjudication's literal nested commands as green. Pass 2
profiles use `.bench.ts`; focused nested laws use `--config vite.config.ts`.

The last shared checkpoint expectation is also intentionally a baseline-defect
receipt, not the target law. Once the production transaction lands, its target
must be amended from furthest 1 / `"!"` to furthest 2 / `"z"` while retaining
offset 0, value `"seed"`, and zero committed recovered diagnostics.

## Evidence durability and measurement boundary

The relevant raw files currently exist at:

- R:
  - `/tmp/p1-r-profile-run1.json`
  - `/tmp/p1-r-profile-run2.json`
- E:
  - `/tmp/p1-e-bench-final-1.json`
  - `/tmp/p1-e-bench-final-2.json`
  - `/tmp/p1-e-cpu-final/`
- VK:
  - `/tmp/p1-vk-equal-bench-1.json`
  - `/tmp/p1-vk-equal-bench-2.json`
  - `/tmp/p1-vk-memory-bench.json`
  - `/tmp/p1-vk-optimizer-bench.json`
  - `/tmp/p1-vk-opt.log`
  - `/tmp/p1-vk.cpuprofile`
  - `/tmp/p1-vk-vitest.config.ts`

These are non-durable temporary artifacts. They may disappear on restart and
must not be the only evidence cited by a later tranche. The gate medians and
critical qualifications are copied below. CPU profiles, optimizer logs, heap
receipts, or benchmark JSON needed after Pass 1 must be copied into a durable
tranche evidence directory before the Pass 1 prototype directories are pruned.

All reported final profile processes used Node `26.0.0`, V8
`14.6.202.33-node.19`, and Darwin arm64. Zero minima in several Tinybench rows
are timer-resolution artifacts; medians, not those minima, drive disposition.

## Shared baseline facts

The top-level 1.0 probe remains born red on all seven rows:

1. `all()` deletes a successful `undefined` slot;
2. regex failure at EOF omits its frontier label;
3. non-ASCII `dispatch()` corrupts lookup;
4. a raw memo cell crosses source strings;
5. recovered diagnostics survive into a later parse;
6. speculative failure restores neither semantic value nor recovered
   diagnostics, although it does retain the corrected furthest-2 evidence;
7. recursive `lazy()` reaches `RangeError`.

The sixth row's checked expected value is historically wrong, as already
corrected by the Pass 1 adjudication. The baseline's observed furthest 2 /
`"z"` is failure-evidence truth, while its leaked diagnostic and value `"a"`
remain transaction defects.

These defects are not evidence for a second runtime. They are the born-red
acceptance set for in-place consolidation.

## R cross-critique

### What the executable proves

R is 269 implementation LOC against a 280 cap. Its laws plus profile are
175 + 83 = 258 LOC against a 260 cap. The focused 9 tests cover the ten routed
obligations, combining runtime and type agreement in one test.

The source has one run record, one checkpoint shape, and one `restore()`
operation. Cursor, semantic value, diagnostic length, capture length, and live
depth restore there. Frontier labels, work, and maximum depth do not. Recovery
uses that same restore path. Exact sequence allocates one fixed output and
retains `undefined`, `false`, `0`, `""`, and a numeric capture. The corrected
`a?x` fixture returns:

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

The final source removed a per-wrapper `Invocation` object. Internal calls
return one run-owned symbol and store a scalar status on the run; replaying a
symbol from another run yields `ForeignResult`. This demonstrates that
cross-run result safety does not require a public second result type or a fresh
object per combinator call.

### Equal-product profile

R's profile preflights the comparable semantic product for rotating choice,
mismatch, fixed sequence, and the fixed capture fixture. Both sides return
kind, value, cursor, furthest offset, and expected labels. Recovery and
transaction rows have no 1.0 equal-law comparator and do not decide the
throughput kill.

Times below are medians in ns/op:

| Plane | Run | 1.0 | R | R / 1.0 |
|---|---:|---:|---:|---:|
| rotating success | 1 | 83 | 375 | 4.52× |
| rotating success | 2 | 83 | 333 | 4.01× |
| six-way mismatch | 1 | 125 | 583 | 4.66× |
| six-way mismatch | 2 | 125 | 542 | 4.34× |
| fixed 12 sequence | 1 | 84 | 375 | 4.46× |
| fixed 12 sequence | 2 | 83 | 333 | 4.01× |
| fixed capture | 1 | 42 | 208 | 4.95× |
| fixed capture | 2 | 42 | 208 | 4.95× |

This is not a marginal regression. R loses after per-parser result allocation
was removed, so the original allocation concern is not being hidden.

### Claims that are not measurements

- `resultAllocations: 1` is a source-level counter claim. It does not count the
  run record, symbol, journal arrays, evidence snapshots, spread object, frozen
  arrays, or final outcome allocation.
- The 1.0 capture control maps a fixed offset-zero literal to a fixed span. It
  is equal for that fixture, not a general legacy capture implementation.
- Bundle size, core SCC removal, loader identity, and optimizer attribution were
  not measured by R.
- R still uses the host call stack. It proves a configured shallow fault before
  host exhaustion; it does not make recursion stack independent.

### R casualties

- `Parser.state` and parser-retained last-result behavior disappear.
- State/result divergence closes only by replacing the legacy result contract.
- Parser class and loader identity are not preserved by the function-only
  prototype.
- The core `parser.ts` / `leaf.ts` / `utils.ts` import SCC is bypassed, not
  removed.
- The fresh evidence-rich outcome increases allocation and bundle surface.
- Exact `undefined` slots deliberately break the old runtime behavior.
- No compatibility facade is allowed, so existing state, diagnostics, debug,
  and subclass consumers would require a major-cut migration.

Disposition: **KILL R as a replacement runtime. Bank its transaction laws and
scalar foreign-run token technique.**

## E cross-critique

### What the executable proves

E is 279 implementation LOC against 320. Its laws plus profile are
164 + 96 = exactly 260 LOC. Nine focused tests are green.

The recognizer reads the source directly. Its journal is four flat columns:
kind, start, end, and slot. Failed alternatives centrally truncate all four
columns while work and furthest offset remain monotone. Recognition-only mode
has no journal. Exact projection preserves the five falsy/capture slots.
Nested capture uses original UTF-16 offsets. One scalar chooses among five
prebuilt parsers.

The journal is consumed by a projector after recognition and is not used to
drive recognition. Thus the source does not secretly introduce a token stream
as parser input.

### Equal-product profile

The two final Vitest JSON files agree on the capture medians:

| Capture plane | Run 1 | Run 2 |
|---|---:|---:|
| projected E | 291 ns | 291 ns |
| recognition-only E | 125 ns | 125 ns |
| equal direct closure output | 42 ns | 42 ns |

Recognition-only is 57.0% faster than projected E, clearing E's local 15%
sink-versus-projection threshold. It is nevertheless 2.98× the direct closure,
and projected E is 6.93× that closure.

The retained serialized output is 235 bytes for both candidate and closure in
the manual profile source. The law also compares their JSON bytes. That is
serialization equality, not retained-heap equality. The final durable Vitest
JSON does not contain a GC heap delta, and an independent ordinary rerun
reported heap values as `null` because its worker lacked exposed GC.

### Decisive generality failure

The executable names an unbounded length-prefix counterexample:

```ts
count => literal("F".repeat(count), ...)
```

The five-way scalar can select only prebuilt parsers. Expressing this ordinary
value-dependent `.chain(value => parser)` requires a general eager semantic
value and parser construction during the run, precisely the mechanism E was
forbidden to recreate. Keeping the legacy closure runtime beside E would also
violate the one-runtime budget.

The capture-heavy fixture additionally shows why the projected form loses: 12
capture rows are held across four journal arrays and then materialized again as
12 final span objects. The journal is transient, but on this fixture it
duplicates the complete information in the output before being discarded.

### Claims that are not measurements

- The profile's `allocationModel` values are constants authored in the source,
  not allocator instrumentation.
- The manual seven-sample profile runs at module evaluation, separately from
  Tinybench. Its console JSON was not durably captured by the final Vitest JSON.
- No arbitrary chain, recovery, diagnostics, or generic consumer executes on
  E.
- No heap receipt proves that equal serialized bytes imply equal retained
  bytes.
- The direct closure is a narrow hand loop, not a complete 1.0 Parser grammar;
  it is nevertheless the correct smaller control for the capture claim.

### E casualties

- Arbitrary `.chain`, semantic callbacks, and dynamic parser selection.
- Recovery and its transactional diagnostics.
- Expected-label joins; E records only a furthest offset.
- Parser/result/class identity and every compatibility surface.
- A second projection phase plus four transient event arrays.
- General AST projection without making the journal an AST duplicate.

Disposition: **KILL E as the sole generic runtime. Bank only the source-direct
numeric capture and recognition-only sink observation; do not publish its event
schema or add a parallel recognize/project API.**

## V cross-critique

### What the executable proves

V and K together occupy the exact 420 implementation LOC cap and exact
133 + 127 = 260 law/profile cap. Ten focused tests are green.

V lowers a construction graph to packed numeric op and operand arrays, then
executes an explicit instruction stack, return stack, recursive-call markers,
choice stack, and progress stack. The returned kernel closes over the packed
arrays and literals; the temporary construction node array is not referenced
by `parse()`. V therefore does not visibly retain both the construction graph
and executable graph.

V completes depths 10, 1,000, and 10,000 without the host stack, returns typed
`Nesting` and `Progress` faults, preserves work/frontier evidence through
choice rollback, and equals K on the tested semantic products.

### Equal-product profile

The direct comparator is built from the production Parser/all/any/lazy closure
runtime with a narrow count-producing literal. Preflight checks choice early,
late, mismatch, and hostile transaction products. Fixed sequence is not in the
profile preflight loop, although its behavior is covered by the shared fixture
and source inspection.

| Plane | Run | 1.0 | V | V / 1.0 |
|---|---:|---:|---:|---:|
| rotating literals | 1 | 125 ns | 417 ns | 3.34× |
| rotating literals | 2 | 125 ns | 416 ns | 3.33× |
| fixed sequence | 1 | 84 ns | 250 ns | 2.98× |
| fixed sequence | 2 | 84 ns | 250 ns | 2.98× |
| hostile mismatch | 1 | 125 ns | 292 ns | 2.34× |
| hostile mismatch | 2 | 166 ns | 250 ns | 1.51× |

Every relevant row exceeds V's 1.10× hard limit in both fresh processes.

V's depth-10,000 median is 1.140 ms then 1.030 ms. This proves useful
stack-independent control, but it does not excuse the shallow regression.

### Claims that are not measurements

- `retainedBytes: 276` counts typed-array payload and literal code units, not
  object headers, arrays, closures, or the returned kernel.
- The optimizer run's non-durable GC estimate reports approximately 1,325
  bytes/V grammar, 1,355 bytes/K grammar, and 1,748 bytes/direct grammar. It is
  a useful observation, not a bundle or retained-runtime proof.
- The 100,000-scalar rows have one timed sample. Heap bytes come from a
  separate console receipt, not those JSON rows.
- `/tmp/p1-vk-opt.log` contains optimization and deoptimization events,
  including V/K parse and retry activity, but no attribution analysis proves a
  repair path.
- A CPU profile exists but has not been interpreted into a gate.

### V casualties

- Semantic values, exact tuples, captures, recovery, diagnostics, memoization,
  and `.chain` are absent.
- Lowering/compiler identity replaces Parser identity.
- Debug/source mapping is absent; retaining a Parser graph to supply it would
  trigger a kill condition.
- Compatibility would require the prohibited dual closure/VM runtime.
- Packed dispatch reproduces a costly opcode switch on shallow parsing.

Disposition: **KILL V. Bank only its explicit-depth and progress-fault
fixtures. Do not open a production VM or `compile` API.**

## K cross-critique

### What the executable proves

K builds continuation closures and executes them through one bounce loop. It
matches V on the tested cursor, node count, frontier, expected labels, work,
live depth, maximum depth, and typed faults. Depth 10,000 completes in 1.251 ms
then 1.137 ms.

K is consistently a little faster than V on rotating shallow literals and a
little slower on deep recursion. Neither relationship approaches the closure
control.

| Plane | Run | 1.0 | K | K / 1.0 |
|---|---:|---:|---:|---:|
| rotating literals | 1 | 125 ns | 334 ns | 2.67× |
| rotating literals | 2 | 125 ns | 333 ns | 2.66× |
| fixed sequence | 1 | 84 ns | 250 ns | 2.98× |
| fixed sequence | 2 | 84 ns | 250 ns | 2.98× |
| hostile mismatch | 1 | 125 ns | 333 ns | 2.66× |
| hostile mismatch | 2 | 166 ns | 292 ns | 1.76× |

All rows exceed K's 1.15× hard limit.

### Allocation claim correction

`transientAllocations: 6` and `executionContainers: 6` are literal constants in
the returned metrics. They are not incremented by allocation sites. A K run
visibly constructs a run object, frontier object, expected array, progress
array, success array, mismatch array, choice array, outcome, and metrics
object. The asserted six therefore undercounts actual transient objects and is
already greater than one for a one-leaf successful parse.

Removing continuation stacks by encoding continuation identity as numeric tags
would defunctionalize K into V. Since V is also killed, that route has no live
receiver.

### K casualties

- More than one transient execution object on a one-leaf success.
- Semantic values, capture, recovery, diagnostics, and arbitrary chain are
  absent.
- Continuation types cannot become public without violating the API law.
- Debuggability and compatibility need a parallel graph/runtime.
- Allocation repair collapses into the killed V mechanism.

Disposition: **KILL K and retire its runtime mechanism. Bank its bounce-law
fixtures only.**

## Cross-family synthesis

Pass 1 answers the three formation questions:

1. A complete closure transaction is behaviorally small, but replacing the
   result/run contract multiplies hot cost. R's laws survive; its runtime does
   not.
2. Recognition-only avoids projection allocation, but a separate columnar
   journal is slower than the direct closure and cannot carry arbitrary generic
   chain semantics without recreating the value channel. E is not the sole
   runtime.
3. Explicit control solves depth totality. Both the VM and trampoline lose the
   shallow workload by multiples, and K's allocation evidence is not genuine.

The next control is therefore **an in-place repair of the current closure
runtime**.

It is not:

- the R prototype copied into production;
- a VM, trampoline, compiler, bytecode format, or public `compile`;
- an E recognize/project sibling runtime;
- a token stream, event tape used as parser input, or source normalization
  copy;
- a CSS-specialized parse-that leaf.

The closure control remains the fastest executable route. Pass 2 tests whether
its existing state, diagnostics, memo, rollback, sequence, and depth mechanisms
can be consolidated by deletion without changing its hot execution model.

## Pass 2: one sequential executable boundary

Pass 2 contains exactly two code units. They are sequential, not a fanout.
P2-C2 cannot start until P2-C1 is green and its deletions are counted. Failure
of either unit stops Pass 2; it does not open V, K, S, D, or a compatibility
layer.

### P2-C1 — delete retained/global run ownership

**Purpose:** make a parse own its result, diagnostics, and memo identity while
retaining the current Parser closure and ParserState execution model.

**Owned production files:**

- `typescript/src/parse/state.ts`
- `typescript/src/parse/parser.ts`
- `typescript/src/parse/utils.ts`
- only the source-identity portion of `typescript/src/parse/packrat.ts`
- associated barrels only to remove exports

**Hard caps:**

- at most 170 gross production additions;
- at least 190 production deletions;
- net production delta at most -20 LOC;
- tests plus `.bench.ts` profile at most 240 LOC;
- zero public export additions;
- no alias, deprecated shim, facade, or second Parser/result type.

**Required deletion/consolidation:**

- delete `Parser.state` and all last-result writes;
- delete module-global recovered-diagnostic storage and its zero-argument
  collection contract;
- make diagnostics part of the returned parse-owned state/result;
- bind raw memo cells to their source/run so direct invocation cannot reuse a
  cell across strings;
- retain one Parser constructor identity across root/core imports;
- do not add a new import edge that enlarges the core SCC.

**Born-red behavioral gates:**

1. regex EOF records its label at furthest 0;
2. two nested and two sequential parses share no diagnostic, memo, result, or
   mutable parser-definition state;
3. a raw memoized word parses `"hello"` then `"world"` as two sources;
4. a fresh `parseState()` result is returned on every invocation and Parser
   retains none;
5. recovery from one parse is absent from the next;
6. root/core imports resolve to one Parser identity;
7. all current non-Pass-1 tests, manifest/subpath gates, and declaration build
   stay green.

**Performance and size gates:**

- two fresh-process equal-product runs;
- rotating valid and six-way mismatch no more than 2% slower than
  `17a8a4d` at median;
- recovery-valid and recovery-hit no more than 5% slower;
- built core and root bundle bytes do not increase;
- no per-parser-call result object or diagnostic array allocation on a
  diagnostics-free success.

**Kill:** any process-global mutable run result remains, any compatibility shim
appears, deletion/LOC/API caps fail, loader identity splits, or either hot plane
exceeds its limit.

### P2-C2 — one checkpoint, exact sequence, and bounded closure depth

**Blocker:** P2-C1 is green and banked.

**Purpose:** replace every manual speculative rollback in the current closure
runtime with one internal transaction representation; make the existing exact
sequence and recovery obey the corrected laws; add a bounded typed depth fault
without changing to explicit control.

**Owned production files:**

- `typescript/src/parse/state.ts`
- `typescript/src/parse/parser.ts`
- `typescript/src/parse/leaf.ts`
- the now parse-owned diagnostic helpers from P2-C1

**Hard caps:**

- at most 220 gross production additions;
- at least 260 production deletions;
- net production delta at most -40 LOC;
- tests plus `.bench.ts` profile at most 260 LOC;
- zero public export additions;
- one internal checkpoint representation and one restore choke point;
- one exact-sequence implementation, not arity-specific semantic copies.

**Required deletion/consolidation:**

- delete duplicated/manual cursor, value, diagnostic, and capture rollback;
- delete the three divergent `all()` result-writing paths and retain one exact
  fixed-length path;
- recovery uses the same checkpoint as choice/sequence;
- work, furthest labels, and maximum depth remain monotone;
- live depth, cursor, semantic value, and journal lengths roll back;
- existing generic `dispatch()` handles non-ASCII input without a
  CSS-specific API;
- configured closure depth faults before the host stack with a documented
  safety margin.

**Born-red behavioral gates:**

1. the corrected `a?x` result is offset 0, seed value, furthest 2, expected
   `"z"`, and zero recovered diagnostics;
2. outer rejection truncates a nested recovered diagnostic;
3. tied labels join once;
4. work and maximum depth cannot be reset through five rejected arms;
5. exact sequence returns `[undefined, false, 0, "", span]` with the exact
   TypeScript tuple type;
6. recovery sync without progress returns a typed fault;
7. configured nesting returns a typed fault before `RangeError`;
8. generic non-ASCII dispatch succeeds;
9. no rollback participant is restored outside the transaction operation;
10. the corrected top-level runtime-kernel probe is green.

**Performance and size gates:**

- compare the identical value, cursor, frontier, labels, and diagnostics;
- two fresh-process runs over rotating literals, fixed 12-member sequence,
  hostile mismatch, five rejected arms, 90/10 recovery, and existing JSON/CSV;
- warmed success or mismatch no more than 5% slower than the P2-C1 closure;
- fixed sequence no more than 2% slower;
- recovery no more than 5% slower;
- no increase in retained result bytes for equal output;
- no core/root bundle growth and no new import SCC.

**Kill:** any second transaction path, manual rollback residue, process-global
run evidence, per-leaf result allocation, shim, cap overrun, or performance
limit failure.

There is no P2-C3. Numeric capture/recognition work remains banked until a later
consumer gate has both:

1. a Value-owned scannerless CSS grammar using a private source-direct leaf;
2. a non-CSS grammar consuming the same generic behavior.

Only after both consumers prove the same need may parse-that consider one
generic capture operation. No token array, token iterator, event tape as parser
input, CSS terminal, CSS AST, or CSS semantic callback may enter parse-that
core. Value owns all CSS grammar, semantics, profiles, and UI.

## Prune and supersede ledger

This document supersedes, but does not falsify the historical receipts:

- Round zero's “six live families” and recommended immediate fanout are closed.
  R/E/V/K are killed above; S/D remain banked and inactive.
- The Pass 1 adjudication's family-disposition table is superseded by the
  terminal table in this document.
- Its nested focused-test and benchmark commands are superseded by the harness
  correction above.
- Its “no family selected” statement remains historically true for formation,
  but the next-control question is now answered: in-place closure repair.
- The last shared probe's furthest-1 target is superseded by the corrected
  furthest-2 law when P2-C2 edits production.

Before Pass 2 source work:

1. copy any raw JSON, heap, optimizer, or CPU evidence still needed from `/tmp`
   into a durable evidence directory;
2. retain this agglomeration's exact medians and dispositions;
3. prune the executable Pass 1 prototype directories rather than copying them
   into `typescript/src/**`;
4. do not resurrect the killed SpanParser/tagged-switch family, E event API,
   VM bytecode, or K continuations under new names;
5. update active tranche navigation so this document, not round zero or the
   fanout adjudication, routes the next work.

## Release boundary

Status remains **NO RELEASE**.

Pass 2 may repair generic parse-that behavior only. It may not publish a new
version, add a Value dependency, author CSS in parse-that, change a BBNF
boundary, or claim a production winner. Release still requires the repaired
generic closure substrate to be consumed by the Value-owned scannerless CSS
grammar and one non-CSS grammar, delete displaced machinery, pass equal-product
behavior and profiles, and survive a later clean adversarial review.
