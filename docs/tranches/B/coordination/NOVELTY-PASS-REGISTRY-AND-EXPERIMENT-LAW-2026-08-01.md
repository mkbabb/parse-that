# Novelty pass registry and experiment law

Date: 2026-08-01

Last amended: 2026-08-02

Status: **N1-A4 COMMITTED — N2-F0/N2A TERMINAL MECHANICS RED — N2B TERMINAL SCIENTIFIC-RUNNER RED — N2C SAME-TASK SOURCE-ONLY AUTHORIZED/NOT SENT — ZERO DOWNSTREAM CREDIT**

## Scope

This registry operationalizes
`../research/NOVELTY-FIRST-MECHANISM-ATLAS-2026-08-01.md`. It does not
select a performance law, admit a runtime, modify product source, or authorize
a package/release edge.

## Pass registry

Novelty passes `N1`–`N3` are distinct from performance-law passes `L1`–`L3`.
They may produce inputs to the law portfolio but cannot satisfy it by name.

| Unit | Model/role | Inputs | Output | State |
|---|---|---|---|---|
| `N1.RG` | GPT Sol xhigh, independent genealogy/falsification | family charter, live parser source, P1–P6 evidence, supplied primary sources | independent alias/retirement view | `COMPLETE; READ-ONLY` |
| `N1.RH` | GPT Sol xhigh, independent host/economics | family charter, Node 26/V8 14.6, live benches/source, active law families | independent reachability/cost view | `COMPLETE; READ-ONLY` |
| `N1.O` | parser owner, synthesis/adjudication | `N1.RG`, `N1.RH`, independent root/consumer audits | atlas, matrix, registry, closed schemas, semantic closure, handoff | `N1-A/A1/A2/A3 IMMUTABLE; N1-A4 COMMITTED AT 81b2a0a` |
| `N2.IETM` | GPT Luna xhigh, isolated prototype | committed independently accepted N1-A4 packet, prior-art adjudication, and current N2b/N2c owner ruling only | source-only pure-DI/version-object/complete-product validator, then separately authorized future probe | `F0/N2A TERMINAL MECHANICS RED; N2B TERMINAL SCIENTIFIC-RUNNER RED; SAME TASK 019fb12c-2624-7732-909a-e1e87ce7ef24 MAY RECEIVE ONE TWO-FILE N2C SOURCE-ONLY TRANSACTION; NOT SENT; ZERO CREDIT` |
| `N2.DNF` / `N-DNF-BIR` | GPT Luna xhigh, isolated falsifier | established fusion/staging/CST/parse-print prior art plus exact S/C/V/E non-isomorphism predicate | parse-that-specific bidirectional direct-source integration proof or retirement | `NO-GO; SECOND BORN-RED INTEGRATION HOLD; NO NOVELTY CLAIM` |
| `N2.WRR` | GPT Luna xhigh, isolated falsifier | sealed N1 packet and explicit V/E/BBNF-WASM non-isomorphism predicate | WASM boundary proof or retirement | `NO-GO; BORN-RED HOLD` |
| `N2.GLL` | GPT Luna xhigh, tiny fatal probe | sealed N1 packet, real ambiguity/left-recursion counterexample | descriptor/GSS counters and exact product | `NO-GO; FATAL-ONLY HOLD` |
| `N3.C*` | fresh GPT Sol xhigh critics, one per executed N2 packet | immutable N2 root/manifest/raw only | equality, arithmetic, genealogy, hostiles | `BLOCKED ON N2` |
| `N3.O` | parser owner, agglomeration | all sealed N2/N3 evidence | KEEP/FOLD/MOVE/SPLIT/PRUNE, gaps, convergence | `BLOCKED ON N3` |
| `L1`–`L3`, Clean A/B | existing performance-law authority | only immutable admitted novelty evidence | law selection or no-runtime result | `UNCHANGED; 0/5 PER FAMILY` |

This packet creates no task or evidence root. N1-A4 and the prior-art
adjudication are committed together at `81b2a0aacebc126ac1a093407cb2e24ed5d78ee8`.
The first formation-only N-IETM root and its N2a correction on the pre-existing
Luna task are frozen terminal mechanics RED. N2b is frozen terminal
scientific-runner RED: its source-resolution mechanics passed, but its runner,
hardcoded gates, relocation/product plane, and raw authority did not. Exactly
one same-task, non-overlapping two-file N2c source-only transaction is
authorized but not sent under
[`../audit/NOVELTY-N2B-TERMINAL-SCIENTIFIC-RUNNER-RED-OWNER-INTAKE-AND-N2C-SOURCE-ONLY-RULING-2026-08-02.md`](../audit/NOVELTY-N2B-TERMINAL-SCIENTIFIC-RUNNER-RED-OWNER-INTAKE-AND-N2C-SOURCE-ONLY-RULING-2026-08-02.md),
SHA-256
`35e72f24a4505e1d6f060ea47c0eecf2b470864ae43aea48490a5ce17914b2c4`.
The immutable N2-F0 predecessor ruling remains
`7c3cda9b8011c5efec3c1c3b2fa33342698a4a8fa9acf2524f75fbdbc8f64071`.
N-DNF-BIR and N-WRR
cannot start merely because they have
names: their source-only non-isomorphism proofs are born-RED. N-GLL is a
one-probe falsifier, not a portfolio center, and has no current dispatch.
Current packrat and the public API may not be patched or widened.

## Root lifecycle

1. Every stage receives a fresh path that is proven absent before dispatch and
   does not overlap another writer.
2. An interrupted, partially written, cleared, or schema-divergent root freezes
   forever as failed archaeology. It is never resumed or resealed.
3. A1 is the binding counterexample: 13 files, no manifest, contradictory
   receipt/integrity chronology. No future stage reads or writes it.
4. Sol freezes schemas, fixtures, rows, products, laws, and hostiles before Luna
   receives a dispatch. Luna cannot rewrite a schema after observing timing.
5. One serial owner integrates source documents. Prototype and critic writers
   own disjoint absent roots. No overlapping writer is permitted.

## Closed evidence registry

The binding source schema is
`NOVELTY-EVIDENCE-REGISTRY.schema.json`. Its top-level tagged union contains
exactly:

```text
AUTHORITY | RUN | ARM | BUILD | FIXTURE | ROW |
PRODUCT | LAW | HOSTILE | RECEIPT
```

Every object sets `additionalProperties: false`, carries the schema SHA-256,
and names immutable artifacts by path, byte count, and SHA-256. A digest or
aggregate sink is never a substitute for the bound bytes.

### N1-A1 collection-semantics correction

Commit `a04a7e658bee32a1fb252a4e5b4f3ce359a5947d` is immutable N1-A
chronology. Its schema closed individual record shapes but did not close the
registry set: an empty array, dangling references, incompatible N-IETM law
membership, and evidence-authored authority/root claims could pass shape
validation. N1-A therefore grants no N2 dispatch authority.

N1-A1 commit `914957fb354e80b51207118f1cc5f01564111b7a` added exactly one production collection validator,
`NOVELTY-EVIDENCE-REGISTRY.semantic.mjs`. Its call boundary receives
`records`, trusted `schemaBytes`, an externally pinned `expectedRoot`, an
externally pinned `trustedPolicy`, and an injected `artifactReader`. Submitted
AUTHORITY or `rootWasAbsent` claims cannot expand those inputs. The validator
enforces exact nonempty packet counts; global IDs and schema SHA; typed and
phase-consistent foreign keys; exhaustive `RECEIPT.recordIds`; authority,
root, law-unit, family/role, and N-IETM→PL-BE compatibility; required record
reachability; raw/sample/counter relations; disjoint exact registry/raw
inventories; canonical root-contained regular artifact paths, bytes, and SHA;
and a noninterrupted absent root.

The schema-valid gold registry contains ten records. The same production
validator accepts the gold packet and reversed-order control and rejects
`48/48` one-owner mutants with their independently literal expected codes.
The mutant records contain no expected-code oracle and no shadow validator
exists. Exact source identities are:

| Artifact | SHA-256 |
|---|---|
| schema | `9f8340af85a5efb06402c9c9d22ce4d84037ca0c9295a88e8cef1ef88ceb3d39` |
| semantic validator | `050e7e522d64e8f07d92dcb8dab0b8b02b8cb3477c1ab7a7df93542547dcce9e` |
| hostile runner | `7057bd6609cee2da38c96e15b96acbabbc97f7715bf80621808b291e3a3cbc6f` |
| gold registry | `fd10a215fed926ff71ad078f80494054a45c58eb875947bbb600139839c408a3` |
| hostile definitions | `d9153ffca08b243512a78b23749780e539af86a074858513edbfb3265bdb1064` |
| executable results | `be377bbc82e43f5959a87c463bc499ca63edec2b59eab532239c60fc9a4b7d05` |
| 14-entry manifest | `28dee01cbbe0f1fc8e37662d61a7ba846fceb9b91f67f2b4ea9f65a5780ed319` |

Those identities are immutable N1-A1 chronology. A fresh audit then found
product-cross-swap, opaque-raw, and lexical-path false-greens; N1-A1 therefore
does not authorize N2.

### N1-A2 relational/raw/path correction

N1-A2 adds three missing closure laws without changing the external trust
boundary:

1. every ROW product must equal its resolved FIXTURE `expectedProductId`; a
   trusted two-fixture/two-product/two-row cross-swap has its own rejection;
2. `NOVELTY-RAW-ROW.schema.json` strictly closes each authenticated NDJSON
   line, and the validator derives row/run/arm/fixture/product identities,
   fixture bytes/vector paths, selected indices, raw nanoseconds, aggregate
   iterations, and mechanism counters from those exact bytes; every registry
   row has exactly one raw line, every raw line has one registry row, and every
   trusted raw file is nonempty and consumed; and
3. artifact paths use forward-slash repo-relative lexical normal form with no
   backslash, absolute path, empty, `.`, or `..` segment.

The corrected ten-record gold packet has one internally exact raw row. The
same production validator accepts gold and reversed-order controls `2/2` and
rejects all `71/71` one-owner hostiles, preserving the prior `48/48` while
adding the cross-swap, raw derivation/identity/cardinality/schema, and lexical
path cases. Exact N1-A2 identities are:

| Artifact | SHA-256 |
|---|---|
| registry schema | `9f8340af85a5efb06402c9c9d22ce4d84037ca0c9295a88e8cef1ef88ceb3d39` |
| raw-row schema | `483c7eb1a73a5402ed2f82126b2effd8498e040cd9daf03785f78e2581bfb54e` |
| semantic validator | `0ec4faffccd3b96e28885ed9802cebf42289bf143d920f916a92e2a155f7743a` |
| hostile runner | `d24f0950fadeb3902fb110957c066707da6f66a504ed662b4701be137c73addc` |
| gold registry | `d7449f4ffe676d4c9bb9dc723d0b9b3d3a949818e9c0d535e3ced7db0147d174` |
| hostile definitions | `1332fcd869b43b5087f3bdee60244118dcc0cafb5e98317f776b24c4dc6e4380` |
| executable results | `fe378225e4f2e507fe6a2aa5eaf1acb78aa8ea3adec32f0409c5d99a1d43185e` |
| exact raw NDJSON | `f1e6f2d777c758fb676eec126bc9527a74fcc9da1245d9781aa2b7c0d3f0844d` |
| 15-entry manifest | `032502dab34fc9bd1ed46a2bb9b43228e077e79f97f65e84253fbeaad66fc68b` |

The next fresh audit found that N1-A2 still allowed sink substitution, caller-
owned RUN/ROW fields, rounded adjacent large counters, and duplicate JSON keys.
N1-A2 is therefore immutable chronology, not N2 authority.

### N1-A3 authenticated ROW/RUN correction

N1-A3 preserves the N1-A2 graph and adds four source-only closure laws:

1. every performance-bearing ROW field, all artifact descriptors, and the
   sink are derived from the authenticated raw line;
2. the full resolved RUN projection—root, process identity, seed/order,
   runtime, environment, compile-cache canary, and every command field and
   stream descriptor—is derived from those same bytes;
3. counters are canonical unsigned decimal strings compared with `BigInt`,
   while remaining numeric registry/raw scalars are schema-bounded to
   `Number.MAX_SAFE_INTEGER`; and
4. a source-owned recursive JSON parser rejects decoded duplicate object keys
   at every depth before the raw schema is evaluated.

The gold keeps ten records and one raw row but deliberately uses distinct
authenticated descriptors for command streams, GC, deopt, IC, allocation,
and sink. The same production validator accepts both controls `2/2` and
rejects `102/102` one-owner hostiles, including all prior `71/71`. Exact N1-A3
identities are:

| Artifact | SHA-256 |
|---|---|
| registry schema | `0298093d279364c26f0b2cc7c6d05b2c5e082b86f2104690a9597a13dcd55317` |
| raw-row schema | `fc51edf187deb239ce4e55eb89e5566e456d19d80661f1a9b6196fdd553e61f6` |
| semantic validator | `53998004bc3e85ec486c82052f18d416abb3286a71e52ee75a11568461ac5d1f` |
| hostile runner | `157bedb86a1e3afcc9190d9b0c04d71fa7dacc75230ad32bd3814ee68442f692` |
| gold registry | `dffe95ef86a13debb373ae3c20cb48f612e24d6771348899533f5da1cf7bf1ca` |
| hostile definitions | `9107a27ee6a3b53c62963fcf73097384a330f814eb614e4d60f83f08fa550e7e` |
| executable results | `0d4dc73db88aa958b9fc417ead591fc3cc8bbf23b2865f04538c7fb9d7a130cc` |
| exact raw NDJSON | `2e33d38adb13d038553b6f1801f0e5c4f35cbe8d2ba79e103c4ca0f4097a3896` |
| 15-entry manifest | `a6a54678c54451ba5ce225534a82baa6e378b5c6e09ca420783d8f812490d23f` |

N1-A3 remained source validation only. Its next fresh audit reproduced the
packet and then found the numeric/registry-byte defect recorded below; A3 is
therefore immutable false-green chronology and cannot authorize `N2.IETM`.

### N1-A4 byte-owned numeric/Unicode correction

The fresh N1-A3 audit found a pre-schema false-green: raw PID
`1.0000000000000000001` rounded through `Number(...)` to registry PID `1`.
The CLI's `JSON.parse` registry boundary retained the same numeric, duplicate-
key, and Unicode exposure. N1-A4 makes the public entry byte-owned in both
domains, admits only canonical safe-integer number tokens and Unicode-scalar
strings, rejects invalid UTF-8 and decoded duplicate keys, bounds declared
counts, and removes locale collation from exact Set membership.

Its fresh independent audit is CLEAN: baseline 10 records/1 raw row, controls
`8/8`, hostiles `130/130` exact-own-reason, manifest `15/15`, TypeScript/tests/
static proofs green, and the N2 root absent. Exact current identities are:

| Artifact | SHA-256 |
|---|---|
| registry schema | `9520d29a401947527ea8e26a19180cdb0797c253f0f6253cc9662b04ad8aeb23` |
| raw-row schema | `48507dccc084755c9b3dea4bf39d0dbb1ce30b3d49e8157b656c3d48b3af8e8d` |
| semantic validator | `3976b24b0327e8fab0f38771a8736d75bc3d52741c0c1ffc8e9291f2f253c992` |
| hostile runner | `2fb2e23e05ee2f14127304ce51f9bb5c8ddead358f2c42532f57a5ed8ef0ea39` |
| gold registry | `633d1d7fdc28b703667a00bc5c54a440e2f1cb33cde3b1c910f02e2b2cf096cf` |
| hostile definitions | `f9f3d6970459d8492546b74ca3c9238602c6b30576628b3c93dc791886882cfb` |
| executable results | `154450d4337088848821e8ae58342dd2d2ccd64e60a8cf86b42e99ac832dfa1a` |
| exact raw NDJSON | `c4b0a43d3831ecf685274728aa8a3ae67d14a173cf816357ffbd571dabfd6c9d` |
| 15-entry manifest | `f5d51872a5a72024bd46473695ddd26deee1460a50110315e29f4b1f62edaf26` |

The detailed audit is
[`../audit/NOVELTY-N1-A4-OWNER-AUDIT-2026-08-01.md`](../audit/NOVELTY-N1-A4-OWNER-AUDIT-2026-08-01.md).
Algorithmic novelty is separately rejected by
[`../research/N-IETM-PRIOR-ART-ADJUDICATION-2026-08-01.md`](../research/N-IETM-PRIOR-ART-ADJUDICATION-2026-08-01.md).
The committed-pin and CSS C3/C4 dependency chronology is
[`PARSER-CSS-RESUMPTION-SAFE-BOUNDARY-2026-08-01.md`](PARSER-CSS-RESUMPTION-SAFE-BOUNDARY-2026-08-01.md).
Its active-N2 wording is historical and superseded by the N2-F0 owner ruling
above.

Canonical product encoding must preserve:

- array holes separately from `undefined`;
- `false`, `0`, `-0`, `NaN`, infinities, and empty strings;
- object keys and complete typed value bytes;
- authored slots and original UTF-16 spans;
- terminal offset/status and failure offset/frontier;
- ordinary mismatch and sticky typed fault;
- rollback state, successful recovery, immutable diagnostics, and provenance;
- freeze/extensibility proof for every public aggregate.

The candidate, semantic-law envelope, Value product, Keyframes product, and
standards denominator use different product IDs. Sharing a digest, sink, or
handwritten executor does not establish equality.

## Process and cache isolation

- The controller imports no parser, candidate, control, or consumer module.
- Each arm starts in a fresh OS child and imports only its bound artifact.
- Environment is fixed to `NODE_DISABLE_COMPILE_CACHE=1`, empty
  `NODE_OPTIONS`, and absent `NODE_COMPILE_CACHE`.
- A startup canary proves neither imported code nor the arm programmatically
  enables the compile cache. A contaminated child is ineligible, not retried.
- Use seven independent complementary AB/BA blocks with bound PIDs, process
  start identities, seeds, order, selected indices, and vectors. No retry,
  outlier removal, process substitution, or fixed-order minimum is permitted.
- Exact accepted M2 and an independently rebuilt M2 artifact are separate
  controls. Current M3-derived rollback/depth obligations live in the semantic
  product, not the speed denominator.

## Raw receipt contract

Each raw row binds:

- authority, schema, source, artifact, build, fixture, vector, row, product,
  law, and hostile hashes;
- exact fixture bytes and selected indices;
- canonical product bytes and freeze proof before timing;
- raw integer nanoseconds, warmup counts, aggregate counts, PIDs, process start
  identity, seed, AB/BA order, and cold subintervals;
- commands, exits, stdout/stderr bytes and hashes;
- allocation controls, retained/peak heap, complete GC/deopt/IC bytes;
- package, source, import, and export graphs; and
- mechanism counters proving the candidate route was reached.

Every batch and full run deep-compares products and aggregate sinks before its
timing is eligible. Conditional equality, unreachable fixtures, and
recognizer-vs-parser work are fatal.

## Measurement boundaries

```text
Cold = child startup + import/evaluation + build/instantiate
     + first CompleteParse

CompleteParse = routing + matching + traversal/control
              + rollback/commit + typed values + UTF-16 spans
              + ordinary failure + typed fault
              + recovery + diagnostics + provenance
              + consumer projection + deep freeze
              + allocation + attributable GC/deopt/IC
```

AOT build time and emitted bytes are reported separately even when performed
off the runtime path. WASM includes UTF-16 transfer, every JS/WASM crossing,
module compile/import/tier-up, region writes, and JS projection. Incremental
rows include edit mapping, dependency invalidation, rerun, relocation, product
patch/freeze, retained memory, and GC.

## Truthful Pass-2 subject suites

Suites are scored separately. No suite borrows another's credit.

### A. Generic zero-CSS product

- Webref-name dispatch at 4/33/753, early/late/miss/Unicode plus EOF;
- six same-FIRST permutations with diagnostics and exact frontier/provenance;
- `jsonParser` plus EOF/final-offset assertion over normal recursion and a typed
  pre-`RangeError` depth fault; and
- candidate mechanism counters greater than zero.

M2 is the speed control. The full semantic-law envelope owns rollback and depth
correctness. The 753 rows are name dispatch only and earn no CSS conformance.

### B. Value-owned consumer product

- a real nested CSS value;
- a mixed stylesheet containing `@property`, `@function`, unknown `@media`, a
  style rule, `@keyframes`, and collectors;
- current honest fail-whole behavior for a malformed known declaration;
- an opaque unknown at-rule; and
- one Keyframes projection over frames, timing, composition, registries,
  options, diagnostics, and retained stylesheet provenance.

The Value artifact returns its AST, issues, collectors, and canonical
serialize/reparse result. Keyframes returns its resolved animation product.
Current Value has no parse-that import; a shared handwritten body or label-only
“recovery” row is ineligible.

### C. Standards product

The initial isolated boundary contains exactly the nine already bound
WPT-derived seeds. They are seeds, not coverage. The frozen full WPT/browser
matrix is later Value-owned execution work and never parser-throughput credit.

## Family-specific fatal order

### N-IETM

1. Run `OHM-ALGORITHM-EQUIVALENCE` and `GPEG-STRUCTURE-EQUIVALENCE`
   against pinned prior-art controls. Reproduction earns no novelty credit.
2. Treat `ParserContext` as audit prose only: it is public, mutable,
   incomplete, and forgeable. Authorize reuse only through an unexported
   `WeakMap<Parser, NodeProof>` populated by trusted library constructors.
3. Initially certify only callback-free `string`, `eof`, and closed structural
   compositions of certified children. Arbitrary `new Parser`, `map`,
   `mapState`, `chain`, `call`, `debug`, `lazy`, custom parsers, custom RegExp, and
   effectful recovery are opaque and rerun. RegExp reads to EOF absent a
   separately proved bounded subset.
4. Freeze an immutable edit stream covering insert/delete/replace at BOF,
   comments, strings, escapes, declaration boundaries, nested functions,
   failed choices, negative lookahead, malformed frontiers, and EOF.
5. Use a private immutable `SourceVersion` and completed `MemoEntry` binding
   grammar epoch, rule, start, entry depth, match/examined lengths, examined
   EOF, source-slice hash, relocatable immutable product, relative failure
   frontier, and max-depth delta; index entries in a persistent shift interval
   tree. Do not reuse in-progress left-recursion state.
6. Parse version zero cold and construct the index. Invalidate examined rather
   than consumed intervals, remove starts in the replaced domain, lazy-shift
   safe right-hand entries, revalidate slice/EOF, rebase nested spans, and replay
   ordered failure contribution.
7. For every edit, compare the complete candidate product to a new isolated
   full M2 parse plus semantic-law assertions.
8. Require stable graph/action/environment/diagnostic-policy version,
   relocatable anchor, consumed and full
   read interval, failed-arm/negative-result dependencies, child dependencies,
   effect summary, and complete product in every reusable entry.
9. Semantic/effect callbacks always rerun and reconstruct fresh values. Reuse
   only recognition, offset, and selected branch under complete dependency
   proof. Never persist LR seed/head/in-progress growth or transient epoch
   state.
10. Require exact values/spans/slots/frontier/fault/rollback/recovery/
   diagnostics/provenance/depth, branching isolation, arbitrary source-read
   and environment identity, and effect-exactly-once.
11. Mandatory first witnesses are `string("ab").or(string(""))`, editing `"a!"`
   at `[1,2)` to `"ab"`, and appending a closer to an unterminated CSS
   comment/string that examined EOF.
12. Independently mutate captured state, module globals, undeclared source
   reads, effects, diagnostic policy, UTF-16 relocation, and branched versions;
   require effect-exactly-once and per-leaf control-of-control.
13. Measure dynamic work actually skipped and complete K-edit economics, not
   static certified-node count.
14. Kill on the first stale read, recovery/provenance mismatch, routine
   whole-tree invalidation, unbounded retained heap, or non-positive measured
   break-even at the declared K. Cold overhead remains visible. N-IETM targets
   PL-BE only; local 2x/3x edit ratios are descriptive and grant no strict-law
   milestone.

### N-DNF-BIR

Scanner/combinator fusion, staged direct code, lossless CST, and bidirectional
parse/print are prior art; this route makes no novelty claim. Before
implementation, prove exact non-isomorphism to S/C/V/E and show that the
emitted runtime contains no `ParserFunction` graph traversal, closure-choice
executor, generic table/opcode loop, or fallback. A token/index/tape, scanner
stage, or CST/event/region followed by separate typed projection is fatal.
Then assay normalization growth, emitted bytes, import/first/hot, opaque
actions, `.chain`, recovery, CSS escapes, longest-match, unordered values,
complete products, and Value-owned grammar boundaries.

### N-WRR

Before implementation, prove that compiled WASM control plus linear-memory
layout and sparse eligibility remove load-bearing JS work beyond the existing
BBNF VM/check/formatter benches. Kill as V/E/L/F2 when only the host or storage
representation changes. Then assay UTF-16 transfer, crossings, short/large
inputs, compile/import/tier-up, sparse memo touches, region high-water, exact
immutable projection, callbacks, recovery, and package bytes.

### N-GLL

Run only if one bound fixture produces nonzero concurrent descriptors and a
shared GSS tail. Measure descriptors, GSS edges, forest nodes, typed projection,
retained heap, recovery, and deterministic JSON overhead. Kill on a single
live descriptor, no shared tail, forest/product duplication, or the first
binding deterministic-law miss. Do not proceed to CSS breadth.

## Law evaluators

- PL-3X uses its predeclared median statistic and exact ordered `7^7`
  bootstrap. Every binding CI-low must be at least 3.
- PL-2X uses its distinct predeclared geometric-mean statistic and exact
  ordered `7^7` bootstrap. Every binding CI-low must be at least 2.
- PL-BE uses unit-bearing NetBenefit with joint uncertainty:

```text
NetBenefit(K) = sum(control complete-work time)
              - sum(candidate complete-work time)
              - candidate incremental allocation/GC
              - startup/package
              - measured migration/validation
```

It never falls back to a ratio. Source/LOC/deletion counts remain separate and
cannot be converted into time without a measured conversion. Historical 10x is
reported unchanged as a comparator only.

N-IETM is ineligible for PL-3X and PL-2X under the active every-row contracts
because cold build/index work is additive. Its local edit ratios may be emitted
only as descriptive rows. Its sole admission hypothesis is PL-BE.

## Mandatory hostile controls

The frozen HOSTILE registry contains at least:

- no-op/erased mutation becoming GREEN;
- randomized parser/rule/action IDs;
- A/A and B/B neutral-ineligible controls;
- shared-executor or self/self rejection;
- arm-swap inversion;
- conditional-product mismatch;
- route erasure and fixture erasure;
- compile-cache contamination;
- missing fixture bytes and schema drift;
- ratio and bootstrap corruption;
- label-only fault/rollback/recovery rows;
- hardcoded mutant or selected-index knowledge; and
- synthetic vectors on which PL-3X, PL-2X, and PL-BE return different rulings.

A hostile failure freezes the root and routes a fresh correction root only
after owner adjudication. Raw bytes are never overwritten.

## Boundary receipt

At N1-A4 correction close:

- N1 research views: `2/2` complete;
- owner synthesis: `1/1` complete in immutable N1-A chronology;
- N1-A1 collection-semantics correction: immutable at `914957f`, superseded
  as authority by its fresh audit findings;
- N1-A2 relational/raw/path correction: immutable at `e663a91`, superseded as
  authority by its fresh audit findings;
- N1-A3 correction: gold controls `2/2`, hostiles `102/102`, raw rows `1/1`,
  fresh independent audit found numeric/registry-byte false-greens; immutable;
- N1-A4 correction: controls `8/8`, hostiles `130/130`, raw rows `1/1`,
  fresh independent acceptance `1/1`, committed at `81b2a0a`;
- N2-F0/N2a: two terminal mechanics attempts on the sole existing Luna task;
  N2b: terminal scientific-runner RED with source-resolution-only mechanics;
  no sealed scientific result, timing, prototype, law, or downstream credit;
  one two-file N2c source-only transaction on that same task is authorized but
  not sent;
- candidate families: N-IETM algorithmic substrate `FOLD PRIOR ART`, local
  parse-that integration hypothesis `HOLD/TEST`; N-DNF-BIR is a second
  prior-art-bound integration `HOLD`, N-WRR born-RED `HOLD`; N-GLL
  fatal-only `HOLD`; all other axes dispositioned;
- prototypes, benchmark rows, product/CSS/WPT coverage, law milestones,
  candidate, package, consumer, API, release, Value/Keyframes/BBNF/Fourier
  credit: exactly zero.
