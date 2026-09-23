# P7 — rebased structural hostiles and honest executable-budget RED

Status: `PAPER_V4_RED / P7_EXECUTABLE_AST_BUDGET_UNBOUND / ZERO_CREDIT`.
Future ceiling: `1 module / 110 charged LOC`. Paper ceiling: `120 nonblank lines`.

## Source authority and own-reason ordering

P7 owns raw source/prose/interface pins, source parser, AST representation,
adapter, verifier, harness, observer, audit wrapper, dependency graph, metric
counter, and structural receipts. All executable bytes and transitive code for
those roles belong to the single P7 module and its 110-LOC ceiling; “external,”
tool, dependency, generated, test-only, owner-side, or harness labels exclude
nothing.

For `IS_SOURCE_HASH`, the original authorized pin remains and
`leafSourceHash` owns rejection. For every other structural mutation, the audit
authority seals mutated bytes first and issues a canonical `RebasedSourcePin`
over exact source/interface/prose bytes; production accepts that pin, then the
named structural leaf alone rejects. Rebase capability exists only in the
audit wrapper and cannot enter production input. Thus source hash cannot
preempt structural own-reason controls.

| Injector | Sole production leaf/code | Rebase/control |
|---|---|---|
| `IS_MODULE_EXTRA` | `leafModuleSet` / `SOURCE_MODULE_SET` | rebase; erase module |
| `IS_SOURCE_HASH` | `leafSourceHash` / `SOURCE_HASH_MISMATCH` | no rebase; restore byte |
| `IS_PROSE_HASH` | `leafProseHash` / `PROSE_HASH_MISMATCH` | source rebase only; restore prose |
| `IS_EDGE_MISSING` | `leafEdgeGraph` / `EDGE_MISSING` | rebase; restore edge |
| `IS_EDGE_REVERSE` | `leafReverseEdge` / `EDGE_REVERSE` | rebase; erase edge |
| `IS_DYNAMIC_IMPORT` | `leafDynamicImport` / `DYNAMIC_IMPORT` | rebase; static import |
| `IS_EVAL` | `leafDynamicCode` / `DYNAMIC_CODE` | rebase; direct call |
| `IS_REFLECT` | `leafReflection` / `REFLECTION_EDGE` | rebase; direct owned access |
| `IS_DEP_HIDDEN` | `leafDependencyGraph` / `DEPENDENCY_HIDDEN` | rebase; declare/remove dep |
| `IS_FORBIDDEN_SUBSTRATE` | `leafForbiddenSubstrate` / `FORBIDDEN_SUBSTRATE` | rebase; direct scalar state |
| `IS_LOC_MODULE` | `leafModuleBudget` / `MODULE_LOC_EXCEEDED` | rebase; remove charged unit |
| `IS_LOC_TOTAL` | `leafTotalBudget` / `TOTAL_LOC_EXCEEDED` | rebase; remove charged unit |
| `IS_AST_TOOL` | `leafAstToolPin` / `AST_TOOL_PIN_MISMATCH` | rebase source only; restore tool |
| `IS_CLAIM_SOURCE` | `leafClaimSourceJoin` / `CLAIM_SOURCE_DRIFT` | rebase; restore join |

Exact future receipt denominator is `240`: baseline `14`, owner rejection
`14`, owner-bypass `14`, all non-owner retentions `14*13=182`, erasure `14`,
unknown `1`, duplicate `1`. Chronology matches P6. Receipt schema adds
`originalPin`, `rebasedPin?`, `sourceBytesHash`, `astRoot`, `ownerLeaf`, and
`structuralOutcome`; no summary replaces raw bytes.

Closed bans include hidden evaluator, second parse/reparse, runtime discovery,
dynamic code, reflection, hidden dependency, scanner/token/index/tape/CST/
forest, event-region projection, opcode/PC/VM, generated fallback, dual/scalar
parser path, CSS grammar in parse-that, and direct parser→Fourier authority.

## Honest budget disposition

The exact eight future ceilings are `120/155/90/150/70/85/70/110 = 850`.
V4 does not possess selected P7 source-parser/AST-tool bytes or an exact charged
LOC count for their transitive executable work. It therefore cannot prove the
P7 110-LOC or global 850-LOC ceiling. Excluding those bytes would repeat B3.
The packet is terminal paper RED at `P7_EXECUTABLE_AST_BUDGET_UNBOUND` until a
later owner ruling supplies an eight-module implementation whose complete
source graph and charged counts fit; no review or source follows this packet.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E12` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` | exact bytes, epoch selection, leaves, and budgets |
| `E13` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` | codec, RAW leaves, VALUE collateral, and budgets |
| `E14` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` | biases, composition, leaf, and no reverse edge |
| `E15` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` | graph Coordinate closure, sole visitor, leaves, and budget |
| `E16` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` | epoch lookup, sealed traces, leaf, and budget |
| `E17` | `P5 -> P7` | `freshControlClaim() -> InterfaceClaim<FreshControlAuthority>` | membership/root/executor/chronology/leaves and budget |
| `E18` | `P6 -> P7` | `byteHostileClaim() -> InterfaceClaim<ByteHostileManifest>` | 19 rows, typed owner edges, 420 receipts, chronology, and budget |

No other edge exists. No AST/parser execution, budget credit, favorable result,
or exception is implied by this paper contract.
