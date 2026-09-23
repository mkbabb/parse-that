# P7 — external source/AST/dependency/budget verifier

Status: `PAPER_V2 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 60 charged LOC`. Paper budget: `100 nonblank lines`.

## External verifier and charged metrics

P7 is the only source/prose/forbidden-edge/budget hostile owner. It accepts
frozen source/interface/prose bytes and hashes plus immutable owner pins for the
AST tool. Candidate modules cannot call, configure, suppress, replace, or
self-approve it. Its adapter, harness, observer, and audit logic all reside in
P7 and count in 60 charged LOC; no ninth helper exists.

Exactly eight executable modules exist with ceilings `120/170/110/160/70/60/
100/60`, total `850`. Every owner, observer, harness, comparator, auditor,
verifier, generated helper, embedded schema/table, and runtime support module
required by the mechanism counts. The charged LOC for a module is
`max(normalizedPhysicalLogicLines, ASTLogicUnits)`: comments/blank-only lines
are removed; each declaration, statement, branch, case/catch, function,
schema/table entry, generated node, and embedded fixture row is one AST unit.

P7 derives exact modules, imports/exports, symbols, call/data graphs, literal
tables, interface edges, claim/source/prose hashes, and budgets. Closed bans:
dynamic import, eval/Function, runtime module discovery, computed access to
unowned objects, Proxy/Reflect-based discovery, unpinned reflection, hidden or
optional dependencies, filesystem/network/process/environment/clock/random
capabilities, candidate self-verification, scanner/token/index/tape/CST/forest,
event-region projection, runtime grammar/compiler/table, opcode/PC/VM,
generated/fallback/dual/scalar parser path, parser-to-Fourier, and CSS grammar
inside parse-that.

P7 owns concrete raw-source/AST mutants for missing/extra module, source/prose
hash drift, one-sided/hidden/reverse edge, unconsumed declaration, dynamic or
reflection edge, dependency omission, forbidden substrate, metric corruption,
helper exclusion, module excess, and per-module/total LOC overflow. Fixed codes
come from the verifier AST rules, never message classification.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E12` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` | exact bytes/hash/identity ownership |
| `E13` | `P1 -> P7` | `canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>` | exhaustive classes and byte-identity law |
| `E14` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` | biases, composition, invalidation, reached edit |
| `E15` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` | constructors, fields, cardinalities, sole generated visitor |
| `E16` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` | E04 identity plus E06 fresh observation |
| `E17` | `P5 -> P7` | `freshControlClaim() -> InterfaceClaim<FreshControlAuthority>` | actual bytes/commands/runtime/products/effects |
| `E18` | `P6 -> P7` | `byteHostileClaim() -> InterfaceClaim<ByteHostileManifest>` | closed IDs/table and controls-of-control |

No other edge exists. P7 cannot grant source/execution/credit; v2 runs no AST
tool or hostile.
