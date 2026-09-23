# Round-zero parse-that architecture portfolio

## Evidence header

- **Master base:** `ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42`
- **Judgment route:** GPT Sol, `xhigh`
- **Status:** `0% CONVERGED / NO RELEASE`
- **Ownership boundary:** parse-that owns only reusable combinators, spans, recovery, and runtime required by live consumers; Value owns the CSS grammar, CSS consumer, and UI; BBNF may consume or inform the selected generic contract after W3 and owns no competing CSS grammar.

## Round-zero portfolio: generic parse-that uplift

Status: `PORTFOLIO_BANKED / 0% CONVERGED`. Six mechanism-distinct families survive. No route is selected, no code was edited, and no historical performance receipt is promotion evidence.

### Binding laws for every family

1. Scannerless means every terminal reads the original source directly. No token array, token iterator, or explicit lexing pass may exist. A leaf may maximal-munch its own terminal.
2. One transaction must distinguish:

   - rollback: cursor, captures/events, recovered diagnostics, semantic stack;
   - monotone: work spent, furthest-failure join, maximum observed depth;
   - live-state: current nesting depth, decremented on return.

   Rolling back work permits adversarial retries to evade resource limits; rolling back the furthest failure destroys error truth.
3. `undefined` is a value, never an implicit discard marker. Discard is a construction-time effect such as `discard(p)`.
4. Spans are source-relative projection. Internal hot paths carry numeric start/end registers or columnar arrays; span objects and substrings materialize only when consumed.
5. Recovery is part of the same transaction. A recovered diagnostic committed inside an alternative must disappear if its enclosing alternative later fails.
6. Repetition and recovery must prove progress. Resource exhaustion is a fault, not a recoverable mismatch.
7. Unicode operates on the declared source domain. For JavaScript strings, offsets remain original UTF-16 positions even if a leaf interprets normalized code points.
8. Parse-that owns reusable runtime/combinators only. Value owns CSS grammar, CSS semantics, and its prototype. BBNF may consume after W3; it does not introduce a competing grammar.
9. Every candidate remains `NO RELEASE` until the Value-owned scannerless CSS prototype consumes it and a second generic grammar independently exercises the same primitive.
10. Promotion uses equal outputs and separately measures grammar construction, cold parse, warmed parse, failure, recovery, retained output, heap/GC, and representative input distributions.

### Ground-truth defects the uplift must consolidate

- Current alternation restores only cursor/error state, not a complete semantic transaction.
- Current recovery writes through module-global collected diagnostics, defeating true run-local reentrancy and enclosing-branch rollback.
- `all()` advertises an exact tuple type while deleting successful `undefined` slots at runtime.
- Public `dispatch()` is ASCII-first-code-unit only.
- Span-producing combinators were correctly removed for having no consumers. They must not return as a parallel `*Span` API family.
- `lazy()` uses the JavaScript call stack; deeply nested input has no explicit, typed depth fault.
- The former recursive tagged-union `SpanParser` switch was measured 10–14% slower and killed. Renaming it is not novelty.
- Signed Value currently has no parse-that import. Historical declarations cannot justify any new public surface.

## Family registry

### R — Journaled run algebra

Load-bearing mechanism: retain closure combinators, but replace partial `ParserState` rollback with one run-local transaction algebra.

A stable-shape `Run` owns source, cursor, output/capture lengths, recovered diagnostics, resource counters, and failure frontier. Combinators use scalar checkpoint locals; branch failure truncates semantic journals while joining failure evidence. Leaves write numeric span registers. Exact sequence preallocates an N-slot array and preserves every value. Unordered composition uses a remaining-member bitmask plus FIRST routing; overlapping branches use transaction-backed search with a declared ambiguity rule.

This family unifies transactions, recovery, exact sequence, spans, resources, and reentrancy without introducing a compiler or VM. Its unresolved ceiling is closure-call polymorphism and JavaScript-stack recursion.

Prototype cap: 450 LOC production-shaped code, 250 LOC laws/bench harness. Public API cap: at most six candidate operations, all under `@mkbabb/parse-that/core` except diagnostic rendering:

- `run`
- `capture`
- `discard`
- `seq`
- `unordered`
- `recover`

Existing `Parser`, `literal/string`, `regex`, `choice/any`, and `lazy` are reused or replaced, not duplicated.

Kill conditions:

- one rollback participant remains manually restored outside `Run`;
- a recovery diagnostic leaks from a failed outer branch;
- hot parse regresses current equivalent-output combinators by more than 5%;
- implementation requires parallel span and value combinator hierarchies.

### E — Recognition/projection split

Load-bearing mechanism: parsing emits a transactional, columnar recognition record; semantic values are projected only after commit.

The hot run holds numeric cursor/status fields and append-only columns such as kind/start/end/slot. A recognition-only sink counts without constructing events. Exact sequence writes fixed slot IDs. Unordered composition writes member IDs, independent of input order. Recovery writes diagnostic events to the same truncatable sink. Materialization becomes a separate consumer-owned projection, so recognition, spans, and AST construction cease competing inside one polymorphic `state.value`.

This family most strongly consolidates span allocation, rollback, recognition-only mode, exact slots, and retained-output accounting. Its hard gap is value-dependent parsing: `.chain(value => parser)` cannot always defer semantic computation. A narrowly typed eager-scalar register may solve this; a general arbitrary semantic stack would recreate the old value channel.

Prototype cap: 550 LOC runtime/projector, 300 LOC laws/bench. Public API cap: four candidates:

- `run`
- `events`
- `project`
- `recognize`

Capture/event schema stays internal until two grammars prove it reusable.

Kill conditions:

- CSS needs arbitrary eager AST construction inside most rules;
- event projection duplicates a second authoritative parse tree;
- retained columnar output costs more than equal AST output;
- generic semantic actions force an untyped escape hatch.

### S — Staged closure specialization

Load-bearing mechanism: combinators build a grammar graph; `.compile()` performs nullable/FIRST/effect/span-liveness/SCC analysis and links a specialized source-direct closure graph.

Variants S1 and S2 remain one family because the shared architectural center is staging:

- S1: CSP-safe closure linker; no dynamic source generation.
- S2: generated JavaScript functions for environments permitting it.

The compiler fuses exact sequences, eliminates discarded values, inserts checkpoints only around fallible effects, specializes unordered bitmask loops, minimizes recursive thunks through SCCs, and builds ASCII/non-ASCII/escape dispatch tiers. There is no token stage.

This family unifies V8 specialization, exact sequence, FIRST dispatch, span liveness, unordered composition, and recursion analysis. It proliferates a grammar compiler and duplicates part of BBNF analysis, so its reuse burden is high.

Prototype cap: 700 LOC compiler/runtime, 300 LOC probes. Public API cap: two additions under `@mkbabb/parse-that/core`:

- `compile`
- `inspectPlan` only if diagnostics genuinely consume it; otherwise internal.

Kill conditions:

- graph construction exceeds 10% of amortized use for ordinary authored parsers;
- opaque `.map`/`.chain` callbacks prevent useful analysis on the CSS consumer;
- S1 cannot remove megamorphic calls and S2 is required for every win;
- compiler analysis duplicates BBNF without a second direct consumer.

### V — Flat instruction machine

Load-bearing mechanism: combinators lower to packed op/operand arrays executed by one iterative VM over the source.

This is materially different from the killed recursive tagged-union experiment: it removes recursive per-parser switch calls and closure graphs. The VM owns explicit call, checkpoint, capture, recovery, and resource stacks. Exact sequence reserves fixed output slots. Unordered composition is a bitmask opcode or compiled loop. Recursion is stack-safe and bounded. Leaves remain direct-source opcodes; no tokens are produced.

This family consolidates JavaScript-stack safety, transactionality, recovery, exact output, unordered state, and call-site polymorphism into one runtime mechanism. It adds both a lowering step and a VM, with real branch-dispatch and debugging costs.

Prototype cap: 650 LOC VM/lowering, 300 LOC probes. Public API cap: one candidate, `compile`, under `@mkbabb/parse-that/core`; bytecode and VM remain internal.

Kill conditions:

- warmed equal-output parsing loses by more than 10% on two representative grammars;
- instruction dispatch recreates the killed switch result without reducing total calls;
- source maps/debug traces require a parallel parser graph at runtime;
- VM and closure runtime both remain necessary in production.

### D — Tagged residual derivatives

Load-bearing mechanism: combinators denote a grammar algebra; parsing advances by cached source-character derivatives. Capturing transitions carry span tags, and unordered composition is the algebraic shuffle/interleave operator rather than factorial permutation expansion.

Residual states can become dense integer tables after discovery. Recursion is a fixed point; nullable/expected evidence is intrinsic. Unicode classes and CSS escape-aware name transitions can share a classified code-point alphabet without tokenization.

This is the most orthogonal family and the only one where unordered grammar is native rather than bolted onto ordered combinators. Its hard gaps are state explosion, tagged captures, longest-match terminal semantics, semantic actions, and practical recovery.

Prototype hard cap: 800 LOC including state-count instrumentation. Public API additions: zero until the experiment survives. It is research-only and `NO RELEASE`.

Kill conditions:

- 8-member unordered composition exceeds 10,000 residual states;
- captures require rebuilding an event VM of comparable size;
- compile memory exceeds 4× staged-closure S on the same grammar;
- recovery cannot retain exact spans without ad hoc side channels.

### K — Trampolined continuation effects

Load-bearing mechanism: parsers are CPS/selective computations with explicit success, mismatch, fault, and recovery handlers; execution is trampolined.

Cursor and span endpoints travel as primitive continuation arguments. Transaction journals are handled effects. Exact sequence is a typed continuation chain. Unordered composition schedules `(position, remainingMask)` continuations. Deep recursion becomes stack-safe without a bytecode format.

This family gives the cleanest recovery and control semantics, but V8 may allocate continuation closures and bounce records faster than it eliminates call-stack risk. Defunctionalizing those continuations turns it into Family V; that is a retirement path, not a seventh variant.

Prototype cap: 500 LOC runtime, 250 LOC probes. Public API additions: zero during research.

Kill conditions:

- more than one transient allocation per successful leaf;
- warmed parse loses by more than 15%;
- eliminating allocation requires a tag/op switch, in which case fold the evidence into V and retire K;
- TypeScript inference requires user-visible continuation types.

## Cross-family prototype lanes

### Lane P0 — Transaction algebra first

Run R and E independently.

Born-RED cases:

- left alternative emits, records recovery, advances, then fails; right succeeds;
- cursor/events/recovered diagnostics restore exactly;
- furthest expected-set retains both attempted arms;
- work count remains monotone across rollback;
- foreign/stale run result cannot be committed;
- recovery sync succeeds without progress: typed fault;
- recognition-only and output-producing modes consume identical input and report identical failures.

This lane must close before any CSS grammar prototype relies on recovery.

### Lane P1 — Direct-source span and exact value law

Run R, E, and S.

Cases:

- successful sequence `[undefined, false, 0, "", span]` preserves five slots;
- explicit `discard()` alone removes a slot;
- nested rollback leaves no span/event residue;
- no substring allocation for discarded literals or name probes;
- source positions remain original UTF-16 offsets across CRLF, astral characters, lone surrogate, NUL, and CSS-style escapes;
- `capture(p)` has one representation, not `regexSpan/stringSpan/manySpan`.

### Lane P2 — Unordered composition tournament

Run R, S, V, and D.

Use both grammar-neutral fixtures and CSS value-definition shapes:

- `&&`: every required member exactly once, any order;
- `||`: one or more distinct members, any order;
- optional and repeated members;
- disjoint FIRST fast path;
- overlapping FIRST requiring search;
- duplicate input;
- nullable member rejection;
- 4, 8, 16, and 33 members;
- adversarial branch whose locally longest match prevents the globally valid parse.

Record explored states, checkpoints, allocations, and throughput. A greedy parser that misses the globally valid parse fails correctness.

### Lane P3 — Recursion/depth and recovery

Run R, V, and K.

Cases:

- nested blocks/functions at depths 10, 1,000, 10,000;
- graceful `Nesting` fault at configured limit;
- no `RangeError: Maximum call stack size exceeded`;
- mutually recursive rules;
- non-progressing repeat;
- recovery inside recursion followed by enclosing rollback;
- work budget cannot be reset through alternation.

R may survive only as the shallow/high-throughput route if it faults before the JS stack limit with margin; V/K must demonstrate stack-independent depth.

### Lane P4 — Unicode/name dispatch

Run R, S, V, and D against a shared direct-source leaf contract:

- ASCII case folding;
- non-ASCII starts;
- escaped starts and escaped interior code points;
- invalid escape;
- astral and lone-surrogate inputs;
- raw span plus canonical comparison without unconditional substring creation;
- 16, 128, and 512-name tables;
- collision verification for any rolling hash.

Do not publish `dispatchName` merely because this lane needs one. The primitive must be framed generically and consumed by CSS plus another grammar, or remain Value-private.

### Lane P5 — V8 assay

Every surviving prototype runs in fresh, isolated processes with:

- grammar construction only;
- first/cold parse;
- warmed valid parse;
- warmed mismatch;
- recovery-heavy parse;
- recognition-only;
- equal retained output;
- heap/GC;
- CPU profile;
- opt/deopt trace;
- representative weighted distribution and hostile tail.

Compare equal products. The old retained-heap proof, construction-per-sample runs, and hand-selected late dispatch arms are compatibility history only.

## KISS and ownership budget

The selected production design receives these aggregate caps:

- at most one execution runtime;
- at most one transaction representation;
- at most one span/capture representation;
- at most one exact-sequence operation;
- at most one configurable unordered operation;
- at most one recovery mechanism;
- no public CSS-specific leaf;
- no parallel old/new combinator hierarchy;
- no more than six net-new public exports;
- target net production uplift ≤1,200 LOC after deleting displaced code;
- hard ceiling 1,600 LOC; exceeding it reopens family selection.

Family consolidation ranking, without selecting a winner:

- R: high consolidation, lowest new-mechanism count.
- E: highest output/span/recovery consolidation, moderate projection mechanism.
- S: high optimization consolidation, high compiler proliferation.
- V: high runtime/control consolidation, high lowering/VM cost.
- D: conceptual totality, unacceptable production complexity until falsification probes pass.
- K: semantic consolidation, likely allocation proliferation; folds into V if defunctionalized.

Exact ownership:

- parse-that candidates live only in `typescript/src/parse/**`.
- Public runtime/combinators, if earned: `@mkbabb/parse-that/core`.
- Diagnostic formatting/types only: `@mkbabb/parse-that/diagnostics`.
- Packrat remains isolated at `@mkbabb/parse-that/packrat`; no new CSS work may make it an implicit default.
- Value owns the scannerless CSS grammar and every CSS-specific terminal/profile.
- BBNF consumes the chosen generic contract only after W3; it does not author a second CSS grammar.

Release disposition: all P0–P5 prototypes are `NO RELEASE`. If one architecture survives the Value CSS consumer, a second generic grammar, equivalent-plane performance gates, and deletion audit, land it as a clean parse-that `2.0.0` major cut. If reuse or performance remains unproved, bank the prototype and publish nothing.

## Reworded variants rejected at round zero

- Recursive tagged nodes plus a switch: the killed SpanParser route.
- `regexSpan`, `stringSpan`, `manySpan`, and friends: parallel span hierarchy.
- A monolithic CSS parser wrapped in one `Parser`: scanner hidden behind a combinator.
- Token/event tape used as parser input: explicit lexing.
- `dispatch2`, trie depth, or a larger lookup table presented as an architecture.
- Existing `ParserState` plus more manual saved offsets: not a transaction.
- Immutable state object per parser call: known allocation mechanism without a new proof.
- Greedy unordered parsing claimed as general `&&`/`||` support.
- A CSS-specific source adapter promoted to parse-that before second-grammar consumption.
- Interpreter tree with one switch per recursive parser node: same failed mechanism as tagged SpanParser at a different granularity.

Recommended immediate executable fanout: P0 with R/E, P2 with V/D, and P3 with K as the deliberately underexplored route. These three lanes maximize information gain while remaining file-disjoint and keep six incompatible families alive for the required later synthesis and critique passes.
