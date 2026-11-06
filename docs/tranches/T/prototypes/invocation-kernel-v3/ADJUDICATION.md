# Invocation-kernel v3 execution adjudication

Status: **V3 FALSIFIED; V4 REQUIRED; production transposition remains prohibited.**

Declared adjudicator model: `gpt-5.6-sol`, reasoning effort `xhigh`. This was a
fresh adjudication. Neither review was treated as authority, no sub-agent was
used, and every numbered finding was reduced independently from source and a
disposable probe.

## Authority and pinned subject

The reviewed parse-that checkout was at
`ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42` under Node `v26.0.0` and npm
`11.12.1`. The prototype is not tracked by that commit: `git ls-files` reports
zero files below this directory. Therefore the commit alone does not identify
the subject.

The sorted SHA-256 ledger of the 39 non-review, non-adjudication files has digest
`aab52f429856122bcf8ad54d626ab9ad91ec7fa055e686ac0597543903cc5483`.
The review digests are:

| input | SHA-256 |
|---|---|
| `REVIEW-A.md` | `9822dd6b12b931608ecfee4716c87812228ec2022a998b8c1e7a77852ca10dbe` |
| `REVIEW-B.md` | `07277fd73230b45881324aac0bd59d1314616dbf5bb9c83595e175050c830c60` |

All probes were created below a fresh `mktemp` directory. Clean/build/package
commands ran against a disposable mirror with the workspace TypeScript toolchain
linked read-only. No prototype source, test, generated artifact, review, campaign
file, production file, or Value file was changed.

## Ruling

All fifteen numbered findings identify real defects. Two composite details need
correction: Review B's `1,664,175` in B4 is a typo for `1,654,175`, and the exact
nested-map overflow threshold in B6 is host/process dependent. Those corrections
do not weaken either structural finding.

| finding | ruling | decisive independent evidence |
|---|---|---|
| A1 | **CORRECT** | A chain of 1,000 separately recursive SCCs succeeded; 1,250 sealed successfully and then execution threw `RangeError`. `#evaluate` directly calls `#solveRule` at `src/machine.ts:572`, while the solver directly re-enters `#evaluate` at lines 339 and 375. |
| A2 | **CORRECT** | The exact foreign-cut grammar on `"ab"` returned success `['a','b']` at offset 2. The choice failure path at `src/machine.ts:636-660` backtracks whenever the token is not the inner frame's ID; it has no foreign-live-token propagation branch. |
| A3 | **CORRECT** | `RuleCell` declares `Evaluating/Growing/Done` at `src/state.ts:64-67`, but participant admission only calls `#recordTransition` at `src/machine.ts:230-231`, 260-261, and 297-298. The first rule-table write is terminal `Done` at lines 395-400. A direct-LR trace emitted all three labels while `transitionalRuleCells` remained zero. |
| A4 | **CORRECT** | A throwing map inside one choice preserved `Error("boom")` and produced zero live transactions/choices/heads, but trace counts were `choice-open=1`, `choice-close=0`. Forced cleanup truncates the arrays at `src/machine.ts:761-770` without closure events. |
| A5 | **CORRECT** | A strict installed declaration consumer compiled `g._sealedGraph()`. The returned graph contained the original map callback by identity. `src/index.ts:13` exports the concrete builder and `src/graph.ts:437-440` exposes the capability. |
| B1 | **CORRECT** | `minimumConsumption` delegates recovery to its child at `src/recursion.ts:18-22`, although recovery can succeed at its entry. The exact witness was falsely classified right-guarded and returned `['a',['a','a']]`; an independent simultaneous recurrence stabilized at `[['a','a'],'a']`. |
| B2 | **CORRECT** | The exact unreachable-callback grammar threw `Error("unreachable-b")` once instead of returning prefix success `"a"`. `#prepopulate` creates every SCC-rule/source-offset participant at `src/machine.ts:273-301`, and the simultaneous solver evaluates all of them. |
| B3 | **CORRECT** | Independently reproduced by the same throw probe as A4. Numeric cleanup is real; balanced provenance on exception is false. |
| B4 | **CORRECT, COUNT CORRECTED** | `OracleAnswer` has only success/failure at `test/oracle-support.ts:12-15`; the AST has only epsilon/literal/reference/sequence/choice at lines 3-8. Control, recovery, memo, resources, and throws are absent, and no corpus/category/result digest is emitted. The real exhaustive count is `1,654,175`, not `1,664,175`. |
| B5 | **CORRECT** | Every semantic/type test imports `../src/index.js`. `scripts/test-packed.mjs` executes one literal runtime smoke and compiles one declaration smoke; it never copies or executes the public suite. Installed ESM/declaration smoke, root identity, deep-subpath rejection, and the archive allowlist nevertheless passed. |
| B6 | **CORRECT, THRESHOLD CORRECTED** | Tarjan's `visit` recurses at `src/graph.ts:137-150`; effect traversal recurses at lines 314-343. In this fresh Node 26 process, 7,500 and 10,000 nested maps sealed, 15,000 overflowed; a 4,000-rule chain sealed and a 5,000-rule chain overflowed. The 7,500 number is not portable, but legal graph sealing is host-stack bounded. |
| B7 | **CORRECT** | Independently reproduced by the same installed-consumer graph/callback leak as A5. Frozen graph data is still leaked authority. |
| B8 | **CORRECT** | Memo/rule keys are interpolated strings at `src/machine.ts:109-115`; stores and journal entries use `string` at `src/state.ts:69-90`, and transaction deduplication constructs another composite string at line 127. `utf16Offset` aliases an unchecked cast (`src/index.ts:110-111`, `src/types.ts:81`) and returned `-1`, `-0.5`, `NaN`, `Infinity`, and negative zero unchanged. |
| B9 | **CORRECT** | Mutating a first `succeed(object)` result changed the next invocation; recovery fallback behaved the same. A memoized zero-width map executed once and returned the identical callback object at both uses. The behavior may be valid borrowing, but no constant/fallback/callback value-ownership contract or identity test exists. |
| B10 | **CORRECT, NARROWED** | The six-module production import graph is acyclic, so module SCC removal is supported. The RED fact is ownership/isomorphism: `src/machine.ts` owns execution, choice, memo, LR, limits, trace, and cleanup in 809 lines; all tests are flat; and packed execution is smoke-only. Line count alone is not the ruling. |

No numbered finding is **INCORRECT** or **UNPROVEN** after reduction. The two
corrections above apply to details inside otherwise correct findings.

## Exact semantic reductions

### Cross-SCC host-stack dependence

The disposable grammar was:

```text
Ri <- "a" Ri / R(i+1)
Rlast <- "a" Rlast / epsilon
```

Each `Ri` is its own recursive SCC and an empty input forces the next SCC. At
1,250 rules, sealing completed and the error occurred specifically during
`parseFull`. Thus H08 proves input-depth independence only for the current
right-guarded single-SCC path. It does not prove the run machine is iterative.

Graph construction has the same independent defect: recursive Tarjan and effect
walks make sealing host-stack bounded even before a run exists.

### Scoped foreign cut

The exact probe was:

```text
choice(
  sequence(commit("a"), choice(sequence("b", "x"), "b")),
  "ab"
) on "ab"
```

Observed:

```json
{"kind":"success","value":["a","b"],"offset":2,"diagnostics":[]}
```

The outer cut owns choice 1. Inner choice 2 must not consume or backtrack across a
failure carrying token 1. The correct result is a committed failure at offset 2
expecting `"x"`; the token passes unchanged until choice 1 discharges it.

The v4 control rule is exact:

1. success with the current choice's token closes that choice and clears the token;
2. failure with the current choice's token closes it as committed failure;
3. success or failure with a different live token passes through without trying a
   sibling;
4. a token with no live owner, or a conflicting second token, is an invariant
   resource failure;
5. repetition, recovery, memo, rule heads, and transactions never become visible
   owners.

### Recovery-aware fixed point and value witness

The grammar was:

```text
A <- unwrap(recover("x", null) A)
     unwrap(recover("x", null) A)
   / "a"
```

on `"aaa"`. Recovery of `"x"` succeeds without consumption on this input. An
independent previous-generation recurrence produced:

```text
generation 1: "a"                     at offset 1
generation 2: ["a", "a"]              at offset 2
generation 3: [["a", "a"], "a"]       at offset 3
generation 4: unchanged
```

V3 reported `isRightGuarded=true` and returned `['a',['a','a']]` at offset 3.
Consumption equality does not make those values equivalent: the binding
simultaneous semantics is left-associated in this witness.

V4 sealing must compute two recovery-aware, graph-wide fixed points iteratively:

- `nullable(node)`: whether a successful derivation can consume zero code units;
- `minimumGuaranteedConsumption(node)`: the least UTF-16 consumption across
  successful derivations, with an explicit `unproductive` element until a success
  derivation is established.

`recover` has `nullable=true` and minimum zero regardless of its child's minimum.
`many` and epsilon also contribute zero; a literal contributes its UTF-16 length;
sequence adds established minima; choice takes the least established alternative;
map/commit/memo preserve their child; calls read the current rule approximation.
Empty literals therefore contribute zero. The analysis iterates over the sealed
condensation graph to stability and never recurses through the host stack.

A right-guard certificate is valid only when every path to an intra-SCC call has
a strictly positive established prefix under this fixed point. A missing or
unproductive prefix cannot be guessed positive. The exact witness above must select
simultaneous generations.

### Demand-driven recursive participants

The exact eager-callback probe was:

```text
A <- A / map("b", throw "unreachable-b") / "a"
parsePrefix(A, "ab")
```

Observed: the callback ran once and its error escaped. The root result should be
`"a"` at offset 1 and callback count zero.

V4 heads are keyed by `(sealed SCC, root entry)` but contain only entry-qualified
participants reached while evaluating the active root or an already active
participant. An intra-SCC call admits `(rule, entry)` with the failure seed and
enqueues it for the next snapshot. A generation continues when an answer improves
or a participant is newly admitted. It stops only when neither occurs. There is no
loop over every input offset and no speculative execution of an opaque callback at
an unreachable entry.

Right-guarded dependencies use the same demand admission and explicit scheduler;
they do not call a nested solver on the JavaScript stack. Unguarded/equal-offset
cycles read one immutable previous-generation snapshot. Both modes share terminal
cleanup and the same improvement order.

### Rule cells, head approximants, and valid supersession

A3 is a literal violation of the v3 binding: trace labels are not table mutations.
Nevertheless the narrower head-owned design is valid and is the smaller v4
contract, provided it is stated honestly:

- the invocation rule cache has only `Done(answer)` cells;
- `Evaluating` and `Growing` are phases of head-owned `Participant` records, never
  cache states and never visible to another head;
- a participant is admitted, improved, and discarded inside one head; only fixed
  point terminalization may journal a `Done` cache write;
- rollback restores those `Done` writes through the ordinary typed journal;
  resource failure and throw discard all head participants before exposure;
- debug census separately counts live head participants and cache cells;
- every trace transition is emitted by the actual mutation it names. Synthetic
  `RuleCell` transitions are forbidden.

This supersedes rather than silently edits P2 invariants 4-6. The safety argument
is stronger than journalled approximants: head-local approximants have no authority
outside their head, so there is nothing global to roll back before terminal `Done`.
V3 cannot claim this supersession retroactively; v4 must promote it as an explicit
carrier and trace contract.

### Exception state and proof closure

The throw probe observed:

```json
{"thrown":"boom","opens":1,"closes":0,"journalLength":0,
 "liveTransactions":0,"liveChoices":0,"liveHeads":0}
```

V4 invokes callbacks from the iterative loop behind one guarded boundary. A throw
becomes an internal terminal reason long enough to unwind every continuation,
rollback/commit mark, visible choice, and head in LIFO order. Each open event must
receive a matching `close` or `abort` event. The terminal report is frozen and
delivered only after the independent verifier accepts it; then the original error
is rethrown. Array truncation is not proof closure. A debug observer cannot replace
an already active parser-callback exception.

### Public capability and value ownership

The installed package correctly rejects deep subpath import, but its root builder
still returns the private graph by method call. V4 exports no concrete builder class
and no `_sealedGraph`, `bindingOf`, node, callback, rule-table, run, or executor
capability. `createGrammar()` returns only a public opaque builder interface. The
runtime keeps graph acquisition in a module-private WeakMap capability. Sanitized,
deterministic inspection may return value/callback placeholders, never original
references.

V4 uses the following value-ownership law because arbitrary JavaScript values
cannot be generally cloned or deeply frozen:

- `succeed` values and recovery fallbacks are borrowed immutable-by-contract
  references retained by the sealed grammar and may have the same identity across
  invocations;
- map return values are borrowed references owned by that callback; memo/rule reuse
  within one invocation may return the identical reference;
- the kernel never mutates, clones, or freezes user values and promises no replay of
  external callback side effects;
- user mutation makes semantic determinism their responsibility.

Runtime identity tests and README/declaration documentation must state this policy.
Graph freezing is shallow structural ownership, not ownership of captured values.

### Typed addresses and checked coordinates

V4 memo and rule storage uses nested structured maps keyed by branded `NodeId` or
`RuleId` and checked `Utf16Offset`; no float key, delimited string, or reparsing is
allowed. `JournalEntry` is a closed union with typed addresses:

```text
MemoAddress { node: NodeId, offset: Utf16Offset }
RuleAddress { rule: RuleId, offset: Utf16Offset }
```

The first-write barrier deduplicates by table plus the two typed key components,
not by string concatenation. Head participant maps use the same structured key
domain.

The public `utf16Offset(number)` constructor throws `RangeError` unless the value is
a nonnegative safe integer; negative zero is normalized to positive zero. Source-
bounded validation occurs where an offset is paired with a source. Hot internal
arithmetic may use a private unchecked conversion only after a local range proof;
that conversion is absent from runtime exports and declarations.

## Inherited falsifier accounting

The current README statement that all ten counterexamples were "permanently
promoted" is too broad. The exact accounting is **six structural/literal-family
promotions and four deliberate policy/measurement replacements**:

| inherited ID | disposition in v3 |
|---|---|
| H01 | literal recovered-commitment promotion |
| H02 | literal repetition/cut promotion |
| H03 | replacement by transitive cut/diagnostic seal rejection |
| H04 | literal sequential-recovery promotion |
| H05 | replacement by all rule-dependent ordinary-memo rejection |
| H06 | literal grammar-family promotion in L03 (`A <- A B / epsilon`, `B <- "x"`), although the named H06 test itself is a different right-guard fixture |
| H07 | replacement by a smaller explicit step-resource fixture, not the 10,001-input witness |
| H08 | literal right-recursion family promoted at the stronger 100,000-code-unit size |
| H09 | replacement by typed first-write journal/compaction measurements |
| H10 | literal executable package-command family promotion |

Only H01, H02, H04, and the H10 commands reproduce the documented witness/command
verbatim; H06 and H08 strengthen or vary the input while retaining the exact grammar
family. Thus "six" is the correct family count, not a claim of six byte-for-byte
witnesses. All ten families have some current evidence, but four are not literal
falsifier promotions and A3 shows that one new binding requirement was substituted.

An additional exact probe confirmed that the inherited H06 grammar succeeds with
value 1 on `"x"`; the inherited H05 construction is rejected at seal; and the
10,001-input H07 shape returns typed resource failure only after selecting an
explicit v3 step budget. These are useful bounded facts, not grounds to rename the
four replacements as literal tests.

## Verification replay

All commands below ran in the disposable mirror, not in the prototype working tree.

| gate | observed result |
|---|---|
| strict `typecheck` | exit 0 |
| full `npm test` | 31 tests, 31 pass, 0 fail/skip/todo |
| bounded exhaustive oracle | 13,025 grammars x 127 inputs = 1,654,175 comparisons, twice |
| generated oracle | seed `0x5eedc0de` = 1,592,639,710; 10,000 compared, zero discarded, twice |
| hostile suite | all graph/machine/LR/limits/oracle/properties/deep/package tests passed |
| fresh LR/limit processes | three consecutive 7/7 LR and 4/4 limit passes |
| 100,000 right recursion | pass; continuation high-water remained below 32 |
| state measurement run 1 | journal high-water 10,000; final journal 0; continuations 3; zero live transactions/heads/transitional cells; heap delta 13,382,048 bytes |
| state measurement run 2 | same deterministic fields; heap delta 11,189,456 bytes |
| clean then build | exit 0 from absent `dist` |
| generated distribution | all 12 file hashes matched the checked prototype `dist`; aggregate hash ledger `15a2f91637f137fe88c285606daeadb0355a40c025e7e11ac2e8ba9fe66d2c6a` |
| dry pack | 15 allowlisted files, 16,523 bytes, SHA-1 `7eab871ca647bbdcd7ba1979f99dbc407ef4772b` |
| pack determinism | two fresh tarballs byte-identical; SHA-256 `49eb60ff3886944863dbc9eba1e08f04fadec8198b02d45e514e493e9eb92889` |
| installed ESM consumer | root execution and identity passed; undeclared deep subpath rejected |
| installed declaration consumer | strict `NodeNext`, `skipLibCheck:false`, exit 0; it also compiled the forbidden `_sealedGraph()` and unchecked negative offset, confirming A5/B7/B8 |

These green results support the bounded package, journal, direct recursion, and
structural-oracle organs. They do not exercise or contradict the reproduced RED
structures.

The package bytes are deterministic, but repository status is not acceptable for
closure. The checkout had 72 porcelain entries with `--untracked-files=all`; the
top-level short status includes `?? docs/tranches/T/`, and the v3 prototype has zero
tracked files. A dry pack from an untracked bank is evidence, not a releasable
artifact receipt.

## Oracle ruling and v4 receipt

The structural oracle is algorithmically independent in its bounded language and
its exhaustive/generated counts are real. Its control claim is RED. P01 is a trace
test over the VM itself, not an independent control oracle.

V4 keeps the finite-approximant idea but separates the implementation into:

- `test/oracle/model.ts`: AST, independent SCC/relation solver, control model, and
  canonical result encoding; it imports no `src/` module and shares no graph,
  nullable/consumption, head, cache, journal, or trace code;
- `test/oracle/corpus.ts`: deterministic canonical and seed-recorded generation;
- `test/oracle/adapter.ts`: the only module that compiles oracle AST into the public
  package and compares VM results;
- `test/oracle/receipt.test.ts`: import-allowlist, coverage, digest, exhaustion, and
  discrepancy gates.

The receipt JSON has a versioned schema and at least these exact fields:

```text
schema
seed
structural.grammars = 13025
structural.inputs = 127
structural.comparisons = 1654175
generated.cases = 10000
generated.discarded = 0
generated.categories.{direct,indirect,mutual,nullable,lateAdmitted,
                      productive,unproductive} > 0
control.categories.{nestedCut,siblingCut,foreignCut,cutThroughMany,
                    recovery,recoveredCut,memoRollback,memoReplay,
                    resource,callbackThrow,staleToken,conflictingToken} > 0
corpusSha256
oracleResultSha256
vmResultSha256
discrepancies = 0
```

The three digests are 64 lowercase hexadecimal characters and byte-identical in
two fresh processes. `oracleResultSha256` is established and pinned before the VM
implementation; `vmResultSha256` must equal it. Coverage is counted from explicit
case metadata, not inferred from a green aggregate. Oracle exhaustion is a failing
case. The B1 associativity/value witness, B2 unreachable callback, foreign cut,
resource terminality, and exception abort trace are mandatory named control cases.

## V4 clean-break successor

The smallest successor is **invocation-kernel-v4**. V3 cannot be repaired without
changing its carriers: inter-SCC control must move into the continuation machine;
whole-input prepopulation must become active-participant demand; right-guard proof
must become a sealed fixed point; cache/transient rule state must be retyped; and
exception cleanup must become a traced unwind. Calling that patched v3 would hide
the same kind of contract substitution proved by A3.

V4 is a new isolated package. It has no v3 alias, shim, compatibility overload,
fallback executor, dual package route, or production import. V3 remains read-only
as a falsifier and bounded-organ donor.

### Goldilocks production topology

The exact prototype topology is:

| module | sole ownership |
|---|---|
| `src/types.ts` | public invariant parser/rule types, results, diagnostics, options, checked UTF-16 constructor |
| `src/model.ts` | branded node/rule IDs, draft/sealed node algebra, effects, graph records, callback/value boundary types |
| `src/seal.ts` | iterative reachability, iterative SCC/reverse edges, effect closure, nullable/minimum-consumption fixed points, right-guard certificates |
| `src/parser.ts` | opaque WeakMap bindings, public builder operations, duplicate/dangling checks, sanitized inspection; no executor/graph escape |
| `src/outcome.ts` | success/failure/resource values, local evidence, relative diagnostics, improvement order |
| `src/journal.ts` | structured memo/rule addresses, terminal cache stores, checkpoints, first-write barrier, rollback/compaction |
| `src/control.ts` | visible choice owners, foreign-token law, transaction/control frames, unwind actions |
| `src/lr.ts` | head-owned participants, demand admission, simultaneous snapshots/worklists, terminal `Done` publication |
| `src/run.ts` | the single iterative dispatch loop, including inter-SCC solve continuations and callback boundary |
| `src/debug.ts` | truthful event emission, reports, terminal proof/census integration |
| `src/index.ts` | import-only public sink |

The import graph follows that ownership direction and contains no feature SCC.
No module imports `src/index.ts`. `run.ts` schedules LR work but does not implement
head algorithms; `lr.ts` cannot recurse into `run.ts` and instead returns typed
work requests. This is the split that removes six invariants from one monolith
without creating one-file-per-frame fragmentation.

Tests mirror source paths exactly (`test/types.test.ts`, `test/model.test.ts`, ...,
`test/debug.test.ts`, `test/index.test.ts`). Independent oracle files live only
under `test/oracle/`; pack/install orchestration lives only under `test/package/`.
The reusable public suite lives under `test/public/` and imports the package name,
never `../src`. The identical compiled public-suite files and their SHA-256 ledger
run first against the fresh local build and then, unchanged, inside the disposable
packed consumer. Internal tests are not misrepresented as packed public tests.

### Born-RED v4 external tests

Before v4 implementation, each test below must fail against v3 for the named
reason and retain its ID:

| ID | external witness and required v4 result |
|---|---|
| V4-R01 | 1,250 separately recursive SCCs seal, then execute without `RangeError`; a 10,000-SCC stress runs in the extended gate |
| V4-R02 | 15,000 nested maps and a 5,000-rule acyclic chain seal iteratively |
| V4-R03 | exact foreign-cut grammar returns committed failure at offset 2 expecting `"x"` |
| V4-R04 | exact recovery/right-guard grammar selects simultaneous mode and returns `[["a","a"],"a"]` |
| V4-R05 | exact prepopulation grammar returns prefix `"a"` at offset 1 with unreachable callback count zero |
| V4-R06 | throwing callback preserves the original throw, zeroes state, and balances every open with close/abort in the independent verifier |
| V4-R07 | root runtime has no graph/executor method; packed strict TS consumer rejects `_sealedGraph`; callback identity cannot be recovered |
| V4-R08 | trace events correspond to actual head-participant/cache mutations; no synthetic RuleCell transition and no transient cache variant exists |
| V4-R09 | source/type gate rejects string-composed memo/rule/head addresses and proves the closed structured journal union exhaustively |
| V4-R10 | checked UTF-16 constructor rejects negative, fractional, `NaN`, infinite, and unsafe values and normalizes negative zero |
| V4-R11 | constant, fallback, callback, and memo identity probes match the documented borrowed-reference policy |
| V4-R12 | independent structural/control oracle emits nonzero required categories and stable corpus/oracle/VM digests with zero discrepancies |
| V4-R13 | the same hashed public suite passes fresh build and installed tarball; source imports and smoke substitution fail the gate |
| V4-R14 | source/test graph gate proves the module ownership table and source-isomorphic mirrors with zero unresolved edge or feature SCC |

The exact ten inherited H01-H10 families remain as external gates. V4 also adds
verbatim fixtures for the H06 `"x"` input and the 10,001-input H07 shape so the
literal-versus-policy accounting cannot drift again.

### Retained v3 organs

V4 may transpose only these bounded organs after their new external tests exist:

- frozen null-prototype parser references and invariant public generics;
- draft/fully sealed graph separation, duplicate/dangling rejection, frozen node
  arrays, reverse dependencies, and the four effect dimensions;
- full/prefix discriminated result algebra and correct observed UTF-16 parse
  offsets, with the constructor replaced;
- evaluation-local outcomes/evidence, relative diagnostic replay, and recovery of
  exactly one child failure;
- visible grammar-choice identities, with foreign propagation repaired;
- typed terminal resource results;
- first-write transaction journaling, rollback, and no-parent compaction, after
  string keys are replaced;
- head-owned approximants and journalled terminal `Done` publication, under the
  superseding contract above;
- deterministic improvement ordering and the bounded direct/indirect/mutual/
  nullable/mixed LR fixtures;
- the exhaustive structural corpus, recorded PRNG seed, and finite simultaneous
  approximant concept after oracle separation/extension;
- package identity, ESM-only root export policy, clean build, archive allowlist,
  and installed ESM/declaration craters after public-suite replay is added.

Retention means re-homing behind v4 types and tests, not importing v3 modules.

### Required deletions

The following are prohibited ancestors and must not be copied forward:

- recursive `#solveRule -> #evaluate -> #solveRule` control;
- whole-input `#prepopulate` and any eager callback evaluation;
- the current recursive `tarjan`, `localEffect`, `minimumConsumption`, and guard
  walk implementations;
- the choice branch that treats a foreign live cut as ordinary failure;
- transient `RuleCell` variants and synthetic rule-table transition labels;
- force cleanup by journal/array truncation without close/abort events;
- exported concrete `GrammarBuilder`, `_sealedGraph`, public/internal `bindingOf`,
  and all callback/value graph capability leaks;
- string memo/rule/head addresses and string journal deduplication;
- public unchecked `asOffset`/`utf16Offset` conversion;
- the flat test topology, source-only public tests, and packed smoke substitution;
- the combined oracle/compiler module without control categories and digests;
- checked-in v3 `dist` as an implementation source. V4 generates its own clean
  artifacts from v4 source.

## Production-transposition preconditions

No parse-that production edit is authorized until all of the following are true:

1. V4-R01 through V4-R14 are born RED against v3, then green against one v4
   implementation; H01-H10 and the exact new inherited mirrors also remain green.
2. Sealing and execution are host-stack independent on the pinned deep graph,
   cross-SCC, right-recursive, exception, and resource fixtures.
3. The independent receipt has the exact structural counts, nonzero category
   coverage, stable corpus/oracle/VM digests, zero discard, zero exhaustion, and
   zero discrepancy in two fresh processes.
4. Every terminal result and throw passes the independent state/trace verifier;
   there is no live frame, choice, transaction, head, participant, journal entry,
   or nonterminal cache cell.
5. Clean build, the same public suite locally and packed, ESM/Vite/worker/strict
   declaration craters, deep-subpath rejection, root identity, and archive
   allowlist all pass from empty directories.
6. Two clean builds and two packs are byte-identical with checked source/runtime/
   declaration/artifact graphs and hashes. The v4 files are tracked and the scoped
   repository status is clean; the current untracked-bank status cannot satisfy
   this gate.
7. Paired semantic, allocation, throughput, cold-start, and bundle measurements
   satisfy W7 with raw samples and confidence intervals; the current two heap
   observations are not a performance gate.
8. Two fresh hostile audits are consecutively clean and a fresh adjudicator resolves
   every finding with verified model metadata.
9. UTF-16/UTF-8/Rust/WASM coordinate conversion and checked boundary tests satisfy
   T.W6; current JavaScript UTF-16 evidence is not cross-runtime proof.
10. Immediately before any production cut, Value V-next coordination is re-read
    and re-pinned, its returned operation census is ingested, and the later packed
    Value-shaped crater runs without a workspace source edge or Value mutation.

The read-only Value re-pin during this adjudication exactly matched the coordination
file: HEAD `c654824e0b252cda7f8490b67f182a48c48cc0ed`, the recorded subject, and
NUL-porcelain SHA-256
`67abe419bb83f4de65ae898d27d6333244f09f4911367b7efb671780992f852b`.
The checkout remains actively dirty and outside this writer's authority. That
match confirms separation today; it is not a future adoption receipt.

V4 must not mutate Value, make Value formation depend on the candidate, infer CSS
requirements, change the published-1.0 lane, or offer a speculative release.
Value adoption remains a later versioned owner decision after the return packet in
`VALUE-VNEXT-COORDINATION.md` is complete.

## Supersession consequence

V3 remains a useful bounded evidence bank, but it is semantically falsified by
foreign control, recovery/right-guard value ordering, eager callback execution,
and cross-SCC recursion. It also violates graph opacity, checked-coordinate,
trace-totality, sealing-totality, oracle, topology, and packed-suite gates.

This adjudication supersedes positive v3 execution/transposition claims without
rewriting either review. There is one next carrier, invocation-kernel-v4, and one
eventual production path. No alias, shim, fallback executor, dual package route,
speculative Value mutation, or production edit is authorized.
