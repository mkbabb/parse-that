# P7 — external source/AST/dependency/budget verifier

Status: `PAPER_V3 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 60 charged LOC`. Paper budget: `100 nonblank lines`.

## External verifier and charged metrics

P7 accepts frozen raw source/interface/prose bytes and external SHA-256 pins
plus immutable owner pins for the exact AST tool artifact/runtime. Candidate
modules cannot call, configure, suppress, replace, or self-approve it. Its
adapter, harness, observer, and audit logic count in P7; no ninth helper exists.

Exactly eight executable modules exist with ceilings `120/170/110/160/70/60/
100/60`, total `850`. Every owner, observer, harness, comparator, auditor,
verifier, generated helper, embedded schema/table, and runtime support module
required by the mechanism counts. Charged LOC is
`max(normalizedPhysicalLogicLines, ASTLogicUnits)`: comments/blank-only lines
are removed; every declaration, statement, branch, case/catch, function,
schema/table entry, generated node, and embedded fixture row is one AST unit.

P7 derives modules, imports/exports, symbols, call/data graphs, tables,
interface rows, hashes, dependencies, and budgets. Closed bans include dynamic
import, eval/Function, runtime discovery, computed unowned access, Proxy,
Reflect/unpinned reflection, hidden/optional dependencies, filesystem/network/
process/environment/clock/random capability, self-verification, scanner/token/
index/tape/CST/forest, event-region projection, runtime grammar/compiler/table,
opcode/PC/VM, generated fallback, dual/scalar parser path, parser→Fourier, and
CSS grammar inside parse-that.

## Closed source/AST hostile table

| Injector | Exact raw-source/AST mutation | Sole production leaf | Exact code | Control |
|---|---|---|---|---|
| `IS_MODULE_EXTRA` | add ninth module | `leafModuleSet` | `SOURCE_MODULE_SET` | erase module |
| `IS_SOURCE_HASH` | flip source byte | `leafSourceHash` | `SOURCE_HASH_MISMATCH` | restore byte |
| `IS_PROSE_HASH` | flip prose byte | `leafProseHash` | `PROSE_HASH_MISMATCH` | restore byte |
| `IS_EDGE_MISSING` | remove one declared call edge | `leafEdgeGraph` | `EDGE_MISSING` | restore edge |
| `IS_EDGE_REVERSE` | add reverse call/data edge | `leafReverseEdge` | `EDGE_REVERSE` | erase edge |
| `IS_DYNAMIC_IMPORT` | add dynamic import AST node | `leafDynamicImport` | `DYNAMIC_IMPORT` | static import |
| `IS_EVAL` | add eval/Function call | `leafDynamicCode` | `DYNAMIC_CODE` | direct call |
| `IS_REFLECT` | add Proxy/Reflect access | `leafReflection` | `REFLECTION_EDGE` | direct owned access |
| `IS_DEP_HIDDEN` | add undeclared dependency | `leafDependencyGraph` | `DEPENDENCY_HIDDEN` | declare/remove dep |
| `IS_FORBIDDEN_SUBSTRATE` | add opcode/token/tape node | `leafForbiddenSubstrate` | `FORBIDDEN_SUBSTRATE` | direct scalar state |
| `IS_LOC_MODULE` | exceed one module ceiling | `leafModuleBudget` | `MODULE_LOC_EXCEEDED` | remove charged unit |
| `IS_LOC_TOTAL` | exceed total ceiling | `leafTotalBudget` | `TOTAL_LOC_EXCEEDED` | remove charged unit |
| `IS_AST_TOOL` | replace AST artifact/runtime pin | `leafAstToolPin` | `AST_TOOL_PIN_MISMATCH` | restore exact pin |
| `IS_CLAIM_SOURCE` | alter claim without source edge | `leafClaimSourceJoin` | `CLAIM_SOURCE_DRIFT` | restore exact join |

The table is closed: exactly 14 injectors/leaves/codes. Each uses the same
production verifier as baseline; owner suppression, all 13 non-owner
retentions, unknown/duplicate IDs, mutation erasure, and unchanged-byte proof
are mandatory. Codes arise from exact leaves, never messages.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E12` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` | exact bytes, tables, hashes, and identity ownership |
| `E13` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` | JSON classes, tag table, and byte-identity law |
| `E14` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` | biases, composition, invalidation, and no reverse edge |
| `E15` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` | exact constructors, payloads, cardinalities, and sole visitor |
| `E16` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` | exact lookup, cardinality, occurrence, order, and payload law |
| `E17` | `P5 -> P7` | `freshControlClaim() -> InterfaceClaim<FreshControlAuthority>` | raw blobs, command capture, closure, and exact typed projections |
| `E18` | `P6 -> P7` | `byteHostileClaim() -> InterfaceClaim<ByteHostileManifest>` | exact 19-row stage/injector/leaf/code/control table |

No other edge exists. Unlisted injector/leaf/code, message classification,
self-pinned AST tool, helper exclusion, or candidate self-verification is RED.
P7 cannot grant source/execution/credit; v3 runs no AST tool or hostile.
