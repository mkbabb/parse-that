# Banked V-Next Sol Research — 2026-07-18

## Bank state

- **Status:** research bank; uncommitted; not execution authority.
- **Origin:** value.js V-next P-band hostile review.
- **Current V-next ruling:** published parse-that powers the full-CSS prototype;
  only the smallest necessity-proven non-novel compatible patch may land there;
  every breaking blocker routes to the active major session.
- **Future trigger:** an explicitly opened major parse-that/BBNF session.
- **Quarantine:** the value/keyframes `vnext/r1-opus-refuted/` corpus was not
  read and cannot ground this packet.

This record deliberately preserves proposals that V-next rejected or routed.
Rejection from the bounded tranche is not a finding that an idea lacks merit.

## Pinned observations

| Artifact | Observation at banking time |
|---|---|
| Repository | `/Users/mkbabb/Programming/parse-that`, `master@ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42` |
| npm package | `typescript/package.json`: `@mkbabb/parse-that@1.0.0` |
| npm tag | repository tag `v1.0.0` at `7eab78c` |
| Published exports | root, `/core`, `/diagnostics`, `/packrat`, `/utils`; separate ESM/CJS conditions |
| Rust runtime | distinct `rust/parse_that` artifact; never interchangeable with the npm package |
| BBNF | `/Users/mkbabb/Programming/bbnf-lang`, observed `master@b3cf48e3bc8f` |
| Dirty preservation | parse-that already had untracked `.gitmodules`, instruction/precept material, Rust cargo material, and a rustc ICE record; this bank adds files only |

Every future session must re-pin. These are provenance, not predictions of
later HEAD or registry state.

## Thrice cell

| Role | Sol agent | Lens |
|---|---|---|
| Hostile A | Huygens `/root/p_skeptic_a` | execution state, combinators, package DAG, runtime/type truth, tests |
| Hostile B | Mendel `/root/p_skeptic_b` | adoption order, corpus/fidelity, Tape/SoA, BBNF independence, craters |
| Adjudicator | Bernoulli `/root/p_adjudicator` | independent reproduction, mechanism agglomeration, proof/disproof, scope reconciliation |

All ran `gpt-5.6-sol` at `ultra`. No agent changed parse-that source.

## Independently reproduced defects

### PT-GLOBAL-DIAGNOSTICS

- Anchors: `typescript/src/parse/utils.ts:5-18,95-148`.
- Observed: two sequential recovered parses produced diagnostic counts
  `{afterOne: 1, afterTwo: 2}`.
- Mechanism: enablement and recovered-diagnostic storage are module-global.
- Risk: cross-run contamination, nested parse corruption, test-order dependence.

### PT-RAW-CROSS-SOURCE-MEMO

- Anchors: public raw `.parser` at `typescript/src/parse/parser.ts:24-32`;
  epoch wrapper only around `parseState()` at `:34-48`.
- Observed: running one memoized parser on `"hello"`, then `"world"`, returned
  `"hello"` twice through the raw path.
- Mechanism: the public bypass skips invocation/epoch ownership.

### PT-NESTED-RECOVERY-ROLLBACK

- Anchor: `typescript/src/parse/parser.ts:653-681` calls a global
  `popLastDiagnostic()`.
- Observed: an outer failed recovery whose synchronizer executed an inner
  recovery popped the inner item and retained the rolled-back outer diagnostic.
- Mechanism: rollback is stack-global rather than transaction/checkpoint-owned.

### PT-STATE-RESULT-DIVERGENCE

- Anchors: `typescript/src/parse/parser.ts:51-78`.
- Observed for `ab` against `aX`: returned failed state was approximately
  `{offset:0,value:'a'}`, last-run observer approximately
  `{offset:1,value:undefined}`, while declared `parse(): T` returned
  `undefined` on failure.
- Mechanism: returned state, synthesized observer, and public result type encode
  different failure contracts.

### PT-COMBINATOR-RUNTIME-TYPE-DIVERGENCE

- Anchors: `leaf.ts:166-271`, `parser.ts:251-303,392-430,480-520`,
  `dist/leaf.d.ts:25`, `dist/parser.d.ts:12,21,41,47`.
- Strict TypeScript accepted values whose runtime shapes differed:
  - failed parse as `string`, runtime `undefined`;
  - `all(a, /\s*/, b)` as a three-tuple, runtime `['a','b']`;
  - nondiscarding `wrap`/`trim` as the inner type, runtime arrays;
  - negative assertion as `string`, runtime `undefined`.
- `mapState` aliases prior diagnostic arrays, while `ParserState.clone()` drops
  diagnostics (`parser.ts:162-180`, `state.ts:101-109`).

### PT-NONASCII-DISPATCH

- Anchor: `typescript/src/parse/leaf.ts:100-143`.
- Observed: `dispatch({"é": ...})` failed.
- Mechanism: generic-looking dispatch silently implements an ASCII domain.

### PT-EOF-DIAGNOSTIC

- Anchor: `typescript/src/parse/leaf.ts:317-363`.
- Observed: regex failure at EOF did not merge expected/furthest evidence.

### PT-CORE-SCC-AND-BUNDLE

- Anchor: `typescript/src/parse/parser.ts:1-7` imports debug, diagnostics, leaf,
  and packrat sectors that import Parser back.
- Observed graph: parser/state/leaf/packrat/debug/lazy participate in a runtime
  SCC; built `dist/core.js` reaches a roughly 40 KiB packrat shared chunk.
- Mechanism: named entrypoint is not an inward dependency cut.

### PT-LOADER-IDENTITY

- Anchors: `typescript/package.json:7-32`, `typescript/vite.config.ts:14-21`.
- Observed: ESM Parser and CJS Parser compare unequal; cross-format
  `instanceof` fails. Same-condition root/core identity was observed to pass.
- Mechanism: separate implementations across loader conditions.

### PT-ARTIFACT-SKIP

- Anchors: source import in `typescript/test/reentrancy.test.ts:1-12`;
  distribution test skip at `test/dist-surface.test.ts:38-43`; `npm test` does
  not build first at `package.json:35-37`.
- Mechanism: source green can coexist with a missing or divergent package.

## Hostile A proposal: clean 1.1 reset

This was a serious alternative, not the current V-next plan.

### Public model candidate

- opaque `Parser<T>` with no public constructor/class identity, raw execution
  function, mutable state, flags, or process-global numeric id;
- discriminated `ParseResult<T>` from `parse`/`run`, plus an explicit
  `parseOrThrow` if evidence justifies it;
- one internal invocation object owning readonly source, cursor/checkpoints,
  commitment, diagnostics, recovery transactions, and lazy memo tables;
- per-run memoization keyed by parser object and offset;
- exactly typed functional operations: `choice`, positional `sequence`,
  explicit discard, `optional`, `repeat`, `label`, `cut`, `attempt`, `recover`,
  `spanned`, and checked custom leaves;
- UTF-16 string offsets as the TypeScript kernel input;
- core failure data inward, with formatting/recovery helpers/packrat outward;
- ESM-only as one candidate, retained only if a consumer census permits it;
- no compatibility barrels, aliases, shims, `Parser.state`, or dual API.

### Candidate order

1. Pack exact 1.0 and inventory every behavior/export/consumer casualty.
2. Freeze consumer semantics on complete CSS corpora.
3. Select and implement an isolated kernel.
4. Implement an exact combinator/capability surface.
5. Cut entry/build/declaration DAGs and externalize tests.
6. Pack an immutable candidate and run Node/browser/type/bundle/reentrancy craters.
7. Migrate consumers directly, measure suitability/uplift, then release exact bytes.

### Why V-next did not adopt it

The reproduced defects prove invariants and urgency, but they do not prove that
opaque/functional or ESM-only is the winning representation. The owner then
explicitly routed major/novel work to a separate BBNF session.

## Hostile B proposal: separate adoption, research, and uplift

### Central separation

1. Restore the pre-v4 value grammar on exact published parse-that.
2. Define a complete corpus and semantic-equivalence projection.
3. Research substrates without blocking restoration.
4. Classify BBNF as standalone oracle or shared-runtime witness.
5. Separate casualty census, direct migration, suitability, and uplift.

### Three-arm uplift control

- released value 3.1 plus parse-that 1.0;
- restored grammar plus parse-that 1.0;
- identical restored grammar plus the candidate.

The current regex parser is comparable only if it clears the same semantic
oracle. This avoids attributing grammar restoration gains to substrate work.

### Crater classes

1. **Casualty census:** install candidate into unmodified pinned consumers;
   expected REDs enumerate real breaks.
2. **Clean migration:** migrate accepted consumers directly to the new public
   surface; forbid adapters/private imports/version branches.
3. **Suitability/uplift:** run identical grammar/workloads against control and
   candidate with invocation counts and route coverage.

Every crater records tarball hash/integrity, `npm ls`, lockfile resolution,
absence of links, parser invocation counts, output/diagnostic parity, latency,
allocations/retained heap, startup, bundle delta, and named environment.

## Corpus and semantic-equivalence proposal

The future major session should begin with the corpus V-next P01 produces:

- archived pre-v4 fixtures and resurrected benchmarks;
- pinned value 3.1 outputs/errors;
- pinned CSSWG/WPT/Webref slices;
- real value/keyframes input snapshots with frequency weights;
- valid, malformed, recovery, Unicode, and pathological partitions;
- hashes of inputs and canonical token/CST/result/diagnostic projections;
- source-serialization and span-domain expectations.

No performance comparison is admissible until acceptance, recovery, spans,
diagnostics, and serialization are equivalent. Required measures include scan,
evidence recording, CST creation, recovery, complete value ingestion, traced
keyframes ingestion, allocation, retained heap, cold startup, warmed
distribution, and transitive bundle cost.

## Coordinate-domain proposal

Never use an unqualified `offset` across these systems:

```ts
type OriginalCodeUnitOffset = number & { readonly __brand: "original-code-unit" };
type ProcessedCodeUnitOffset = number & { readonly __brand: "processed-code-unit" };
type Utf8ByteOffset = number & { readonly __brand: "utf8-byte" };
type GrammarByteOffset = number & { readonly __brand: "grammar-byte" };
```

TypeScript exact source fidelity means
`serializeExact(cst) === originalString`. Byte identity additionally requires
the original bytes and decoding policy. Preprocessing maps every half-open
processed boundary back to the original string and must be tested with astral
characters, lone surrogates, combining marks, BOM, CRLF, NUL replacement,
escapes, malformed comments, and non-ASCII identifiers.

## Tape, SoA, scanner, and Pratt research

No result selected a generic substrate. A future session may compare:

1. production scanner to direct CST;
2. the same scanner to optional SoA evidence to CST;
3. independent BBNF recognition;
4. a duplicate-scanner anti-control used only for measurement.

The TypeScript `ParserFunction` currently closes over mutable `ParserState` and
leaves directly read `state.src`; Tape/SoA is therefore an ABI redesign, not a
free backend toggle. Rust BBNF SoA evidence does not prove a TypeScript CSS
token tape. Pratt remains a bounded candidate for local precedence grammars,
not a whole-CSS substrate.

## BBNF major-session questions

Current evidence says BBNF already has imports, `@host`, Rust/VM/TypeScript/WASM
targets, a modular CSS L4 tree, typechecking, and determinism tests. The future
session must baseline rather than pretend these are absent.

Adjudicate:

- versioned grammar IR and package ABI;
- namespaces/import resolution and stable symbol ids;
- host capability declaration and action purity;
- CST, diagnostic, recovery, span, and source-map ABI;
- module-import graph separately from recursive-rule graph;
- explicit recursion groups or deterministic source-located refusal;
- table and generated backend parity;
- standalone oracle versus shared-runtime witness;
- Rust-byte to JavaScript-UTF-16 boundary;
- readable/deterministic generated artifacts and ownership.

Required falsifiers include renamed production/module invariance, a novel
non-CSS recursive grammar, mutual-recursion support/refusal, undeclared host
call failure, two byte-identical regenerations, generated-output mutation
failure, backend projection parity, malformed termination, and shared-runtime
fault injection.

## Future major-session candidate waves

These are research-sized rows, not approved execution waves:

| Candidate | Question |
|---|---|
| B00 | Re-pin npm/Rust/BBNF artifacts, consumers, dirty state, and all defect reproducers. |
| B01 | Freeze the complete CSS semantic corpus and coordinate domains. |
| B02 | Compare cleaned-class/run-context and opaque-functional execution models. |
| B03 | Adjudicate exact result, combinator, commitment, recovery, and custom-leaf API. |
| B04 | Adjudicate memo/left-recursion architecture and unwind/reentrancy invariants. |
| B05 | Adjudicate core/diagnostic/memo/debug DAG and ESM/CJS/browser policy. |
| B06 | Prototype Tape/SoA and Pratt only against complete-corpus controls. |
| B07 | Baseline BBNF modules/IR/host/backends and reproduce residual gaps. |
| B08 | Adjudicate standalone-oracle/shared-witness and offset/source-map contracts. |
| B09 | Pack immutable candidates and run casualty/migration/suitability craters. |
| B10 | Run two consecutive hostile clean passes and return exact release/adoption decision. |

Each candidate must be challenged by two fresh hostile Sol agents and a third
fresh Sol adjudicator before it becomes a wave.

## Current bounded V-next disposition

V-next retained the defect evidence while selecting this narrow order:

```text
published 1.0 control
  → full-CSS prototype on unchanged artifact
  → necessity/minimality adjudication
  → optional smallest non-novel blocker repair
  → no-RC receipt or compatible 1.0.1 candidate
  → identical control/candidate crater when a candidate exists
  → packed direct/transitive consumers
  → acceptance digest handed to the sole release wave
```

Everything else in this bank is externally routed, not lost.
