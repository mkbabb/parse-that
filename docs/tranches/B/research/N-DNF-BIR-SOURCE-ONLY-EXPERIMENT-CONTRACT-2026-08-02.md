# N-DNF-BIR source-only experiment contract

Date: 2026-08-02

Status: **HOLD BORN-RED LOCAL INTEGRATION HYPOTHESIS — WORLD NOVELTY REJECTED — SOURCE ONLY — UNDISPATCHED — ZERO LAW/PRODUCT CREDIT**

## Scope and coordinate

This document banks a prior-art-aware research contract only. It creates no
task, evidence root, compiler, grammar, generated source, test, benchmark,
package, parser execution, candidate, public API, Value mutation, or release
credit.

- repository: `/Users/mkbabb/Programming/parse-that-css-totality`;
- branch: `codex/css-totality-combinators-20260729`;
- source coordinate read for this contract:
  `900638a832d0dd4f3fb359d4979fb3b3aebfff09`;
- N2b remains an independent active lane and is neither read, modified,
  dispatched, paused, or credited here;
- N-DNF-BIR remains undispatched.

`BIR` is a provisional name for a build-only opaque representation. It is not
an existing type, API, runtime surface, package export, or implementation.

## Prior-art ruling

Scanner/combinator fusion, staged direct code, lossless concrete-syntax-tree
construction, and bidirectional parse/print systems are established prior art.
The world-novelty claim is therefore `REJECTED`.

The only retained hypothesis is local: can a build-only parse-that grammar and
named-action description emit a self-contained scannerless parser that removes
the load-bearing work of the retired S, C, V, and E families while preserving
the complete parse-that/Value product? The hypothesis begins RED and earns no
credit from its name, source size, or resemblance to prior systems.

## Reproduced source archaeology

### Parse-that runtime

| Ground truth | Current evidence | Consequence |
|---|---|---|
| `Parser.parser` and `Parser.context` are public mutable fields | `typescript/src/parse/parser.ts:24-31` | A consumer can replace either; `ParserContext` cannot certify provenance or representability. |
| `ParserContext` is a debug projection | `typescript/src/parse/state.ts:225-240` | It is not an IR, grammar, trust boundary, action registry, or compilation authority. |
| `map` and `mapState` omit their callbacks from context | `parser.ts:156-202` | Context cannot reconstruct or hash their semantics. |
| custom `regex` callback is omitted from context | `typescript/src/parse/leaf.ts:236-288` records only the `RegExp` | Callback identity and effects are opaque. |
| `dispatch` constructs runtime `Int8Array`, `Map`, and parser arrays | `leaf.ts:99-155` | Reusing this runtime table is C-family execution, not build-only direct emission. |
| ordinary combinators construct `ParserFunction` closure graphs | `parser.ts` and `leaf.ts` constructors | Traversing or retaining those closures in the artifact is S-family staging/fallback. |

`ParserContext` is never authoritative in this family. A future build-only
front-end must receive a separately trusted, immutable description; it may not
infer permission from current parser/context objects.

### JSON control

`typescript/src/parse/parsers/json.ts:15-52` contains anonymous semantic
actions, two `Parser.lazy` callbacks, runtime `dispatch`, and exports
`jsonValue.trim()` without EOF. `typescript/test/json-vectors.test.ts:22-31`
only asserts that valid-vector results are not `undefined`. The large-dataset
benchmark imports the handwritten `typescript/test/benchmarks/parse-that.ts`
parser as `HandParser` (`json-comprehensive.bench.ts:4-5,48-54`), not the
public combinator `jsonParser` under this build-only contract.

JSON is therefore a representation and replacement assay, not existing proof
that the source grammar is compilable, whole-document exact, or performance
admissible.

### Value consumer and denominator

Value currently has no parse-that dependency. The public CSS door has exactly
52 symbols: 19 runtime exports and 33 type exports. Current consumption and
implementation facts are:

| Surface | Frozen count |
|---|---:|
| string consumers / languages | `10 / 9` |
| serializers | `2` |
| collectors | `7` |
| `grammar.ts` | `483` lines |
| `stylesheet.ts` | `899` lines |
| `timeline.ts` | `124` lines |
| `syntax.ts` | `101` lines |
| total current CSS internals | `1,607` lines |
| current product floor | `83` productions / `325` probes |
| full Webref raw / active | `1,717 / 1,653` |
| property/function/type raw / active | `1,503 / 1,439` |
| explicit aliases | `64` |
| manual/prose contracts | `109` |
| token-equivalent decisions | `25` |
| entry points | `10` |
| tree algorithms | `11` |
| Values 5 overlay | `60` |
| Keyframes obligations | `53` references / `51` files |

These are different denominators. The 83/325 floor is not full CSS coverage;
the 52-symbol public door is not grammar coverage; the 1,607-line input is not
deletion credit; and Keyframes counts are consumer obligations, not parser
throughput rows.

C14's CST/token-trivia partition is forbidden in this family. It cannot be
used as a source plane, recovery plane, fidelity shortcut, comparator, or
generated-product intermediate.

## Ownership boundary

### Parse-that owns

- a build-only opaque `Grammar<T>` description and named `ActionRef` identity;
- trusted construction provenance and immutable compiler/grammar/action hashes;
- deterministic normalization and a direct-source emitter;
- a generated-source structural auditor;
- scalar offset, rollback, typed fault, diagnostics, recovery, UTF-16 spans,
  provenance, and result ABI;
- the generic representability and non-isomorphism laws.

`Grammar<T>` and `ActionRef` are contract names only. They are not approved
exports, and this packet does not authorize their implementation or shape.

### Value owns

- the CSS grammar and all CSS semantic actions;
- CSS recovery, typed products, opaque nodes, source fidelity, and canonical
  printers;
- selectors, at-rules, Value Definition Syntax, timeline/path/transform
  domains, collectors, serializers, and the public 52-symbol CSS surface;
- later full-denominator and Keyframes consumer execution.

No parse-that artifact may contain CSS productions or Value action bodies.
No Value artifact may become a competing generic parser runtime or compiler.

## Generated-artifact invariant

Any future generated parser must be one self-contained direct-source artifact.
At load and parse time it contains and imports none of the following:

- BIR, `Grammar`, `ActionRef`, `Parser`, combinators, or compiler;
- runtime grammar, parser arrays, closure graph, table/graph interpreter,
  opcode loop, instruction stream, event journal, region log, CST, or forest;
- tokenizer, token object/array, token index, event tape, scanner facade, or
  separate lexing stage;
- compatibility fallback, dynamic compilation, or alternate parser path.

The artifact binds compiler, grammar, action, normalization, emitter, and
generated-source hashes. A hash mismatch is terminal RED. Build-only metadata
does not ship unless package economics and two consumers separately justify it.

## Representability contract

| Construct | Initial disposition | Exact condition |
|---|---|---|
| `string` | direct | fixed UTF-16 literal and exact failure frontier |
| `eof` | direct | exact terminal offset and failure product |
| RegExp | direct only for sealed subset | statically bounded, source-audited expression with exact sticky semantics and no callback |
| structural `then`/`skip`/`next`/`or`/`all`/`wrap`/bounded repetition | direct | all children representable; scalar rollback/fault/diagnostic law preserved |
| `lazy` | conditional | named finite recursion only; no arbitrary closure capture |
| `dispatch` | conditional | named finite branches normalized into direct control flow; no runtime table/map/parser array |
| `map` | conditional | named pure `ActionRef`; action identity and closed input/output types sealed |
| `mapState` | conditional | named action returning a closed immutable complete product |
| `chain` | conditional | finite named tag arms proven exhaustive; no input-dependent parser construction |
| unordered `&&` / `||` | conditional | finite direct expansion with exact slots, spans, ordering, diagnostics, and failure behavior |
| custom parser/callback/RegExp callback/debug/effect/environment read | fatal | opaque semantics cannot enter the build grammar |

No context inspection may upgrade an opaque row. Representability comes only
from trusted build-grammar construction and named immutable actions.

## Smallest F0 source-only packet

F0 is exactly six proposed source artifacts. None is created or executed by
this contract.

| Artifact | Required content |
|---|---|
| `bir-contract.ts` | provisional opaque grammar/action contracts, trusted-provenance rules, representability tagged union, forbidden runtime surfaces |
| `json-grammar.ts` | JSON grammar description using only allowed build constructs, explicit EOF, finite named recursion/dispatch, no semantic closures |
| `json-actions.ts` | named pure actions with stable identities and closed input/output contracts; no ambient reads or effects |
| `source-audit.mjs` | one production structural predicate set for generated-source non-isomorphism, forbidden planes, fallback, provenance, and leaf/control bypasses |
| `DENOMINATOR.json` | exact source hashes, six-file inventory, JSON rows, Value/full-CSS counts, hostile IDs, production predicates, zero-credit state |
| `SOURCE-READY.md` | human handoff with exact RED reasons, missing rows, hashes, and explicit no-codegen/no-execution/no-credit disposition |

There is no seventh registry, validator, schema theater, generated output, raw
benchmark, or shadow audit. The packet remains source-only until a later owner
ruling explicitly authorizes a fresh isolated materialization.

## Mandatory F0 RED reasons

F0 is not source-ready today. It must report at least these four independent
owning reasons:

| Code | Owning defect |
|---|---|
| `JSON_ACTION_IDENTITY_OPAQUE` | current anonymous JSON actions have no sealed `ActionRef` identity or closed purity proof |
| `PARSER_CONTEXT_NOT_AUTHORITY` | mutable/incomplete/forgeable context cannot supply grammar, action, or provenance authority |
| `VALUE_AUTHORED_BUILD_GRAMMAR_ABSENT` | Value has no authored build-only CSS grammar/action packet for this route |
| `FULL_CSS_ROW_BINDING_INCOMPLETE` | the 83/325 floor does not bind the 1,717/1,653, 1,503/1,439, manual, algorithm, Values 5, and Keyframes denominators |

Closing one reason cannot mask another. A document that calls the packet
GREEN, READY, or executable while any remains is itself RED.

## Non-isomorphism and hostile matrix

The source auditor uses the same production predicate implementation for gold,
hostiles, leaf subsets, and controls. Mutants contain no expected-code oracle;
expected codes are independent test literals. A label-only pattern check,
separate hostile validator, or hardcoded mutant recognition is fatal.

| Code | Must reject |
|---|---|
| `NDBIR_S_RUNTIME_STAGING` | runtime grammar, `ParserFunction` graph, closure traversal, or retained combinator graph |
| `NDBIR_C_RUNTIME_TABLE` | runtime `Map`, dispatch table, parser array, graph interpreter, or equivalent indirect executor |
| `NDBIR_V_OPCODE_LOOP` | program counter, opcode, instruction stream, bytecode, or generic VM loop |
| `NDBIR_E_DEFERRED_PRODUCT` | event/capture/region journal followed by typed product projection |
| `NDBIR_TOKEN_PLANE` | token object or token array |
| `NDBIR_INDEX_PLANE` | token/trivia/source index used as a second parser input |
| `NDBIR_TAPE_PLANE` | token/event/control tape |
| `NDBIR_CST_PROJECTION` | CST/segment/trivia tree followed by semantic projection |
| `NDBIR_FOREST_PROJECTION` | parse forest or GSS result followed by semantic projection |
| `NDBIR_SCANNER_FACADE` | scanner/lexer facade or separate lexical pass |
| `NDBIR_RUNTIME_FALLBACK` | import/call/branch to incumbent parser, compiler, combinator, or alternate path |
| `NDBIR_LEAF_ONLY_BYPASS` | forbidden mechanism outside the leaf-only audited slice |
| `NDBIR_CONTROL_OF_CONTROL` | auditor bypass, predicate erasure, or gold/hostile predicate divergence |

Hostiles must include nested, failure, recovery, Unicode, opaque, and action
paths—not just literal leaves. Control-of-control includes harmless direct
source remaining GREEN, erased mutation becoming GREEN, each forbidden family
failing under its unique code, and a leaf-clean/whole-artifact-dirty case.

## Fidelity without CST or mapping plane

Typed and opaque nodes carry original UTF-16 spans and provenance directly.
Unchanged re-emission uses the original source slice. Bounded edits splice
span-owned source. Canonical print is a separate Value-owned semantic and
idempotent operation; it is not lossless re-emission and cannot repair parser
fidelity after the fact.

CSS normalized and original cursors are scalar parser state. There is no
normalized-source buffer, cursor mapping array, trivia partition, CST, segment
table, or token index. Exact controls cover:

- CR, FF, CRLF, and NULL preprocessing behavior;
- lone surrogates, astral scalars, and UTF-16 offset accounting;
- typed and opaque spans/provenance;
- bounded edit windows and unchanged source slices;
- recovery/failure frontiers, diagnostics, rollback, and found text; and
- canonical-print semantic equality plus serialize/parse idempotence.

## Economics and incompatible laws

The evidence planes stay separate:

1. build/normalization/emission/audit time;
2. generated source and installed package bytes;
3. import/load and build-plus-first parse;
4. stabilized hot and alternating grammar/input shapes;
5. failure, recovery, diagnostics, and complete immutable products;
6. allocations, retained heap, GC, deopt, and inline-cache behavior; and
7. consumer migration, validation, and measured deletion.

PL-3X uses its median bootstrap. PL-2X uses its geometric-mean bootstrap.
PL-BE uses unit-bearing end-to-end NetBenefit and joint uncertainty. No law
falls through to another, and historical 10x remains comparison-only. Unequal
products, one-sided warmup, shared executor, label-only CSS, or a generated
recognizer compared with a value-building parser is invalid.

Static generated-byte reduction, theoretical dispatch complexity, and future
deletion are not performance results. Deletion credit is exactly zero before
consumer acceptance.

## Replacement order and KISS boundary

If a later, separately authorized experiment ever passes source, correctness,
performance, and clean-audit gates:

1. JSON may replace only the current JSON grammar, atomically and without a
   fallback or compatibility export.
2. Value may later replace its 1,607-line CSS internals only as one atomic
   Value-owned migration that preserves the public 52-symbol CSS surface and
   every consumer/denominator obligation.
3. No old and new parser paths coexist; no generated runtime compiler ships;
   no unconsumed build surface remains.

Until then, current source is untouched and deletion remains zero.

## Terminal receipt

- verdict: `HOLD BORN-RED LOCAL INTEGRATION HYPOTHESIS`;
- world novelty: `REJECTED`;
- F0 artifacts materialized: `0/6`;
- mandatory RED reasons open: `4/4`;
- source audit executed: `NO`;
- code generation/parser/test/build/benchmark/package execution: `NO`;
- task/root dispatch: `NO`;
- N2b coordination or credit change: `NONE`;
- product, CSS, law, candidate, API, package, release, downstream credit: `0`.
