# P3 — exhaustive memo/product schema and sole visitor

Status: `PAPER_V2 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 160 charged LOC`. Paper budget: `100 nonblank lines`.

## Closed constructors

P3 owns and generates the only full-product decode/freeze/visit/relocate/
compare implementation. Closed constructors are:

```text
Atom = Null | Boolean | String | SemanticInteger | NumberTag(-0|NaN|±Infinity)
     | Undefined | ByteString | CoordinateAtom | GraphRef
GraphNode = ObjectNode | ArrayNode
DependencyRead = Consumed | Lookahead | Negative | FailedArm | RecoverySync
               | DiagnosticFrontier | EofRead
Terminal = Success | Mismatch | TypedFault(Nesting)
```

`TypedMemoEntry` has exactly 28 fields:

```text
parserId, ruleId, identityEpochId, candidateArtifactHash, harnessHash,
runId, rowId, sourceVersion, sourceHash, start, finalOffset, consumed,
examined, dependencies[1..*], examinedUtf16, examinedHash, valueGraph,
slots[0..*], spans[0..*], terminal, frontier, expected[0..*],
suggestions[0..*], secondarySpans[0..*], rollback, recovery[0..*],
diagnostics[0..*], selection[0..*]
```

Its `CompleteProduct` has exactly 8 fields: `memoEntry`, `provenance[1..*]`,
`sourceSlices[1..*]`, `entryDepth`, `maxDepthDelta`, `fault`,
`observedEffects[0..*]`, `frozenGraph`. Every point/interval/line-column/depth
occurrence in all named constructors uses a P2 `CoordinateAtom`; semantic
integers cannot relocate. Optionality is represented only by explicit
`Null`; arrays preserve order/cardinality/hole policy declared above.

Candidate input is P1-decoded canonical `CandidateReceiptBytes` containing the
exact 28-field entry, product, candidate artifact/harness/source/run/row hashes,
and immutability proof. P3 applies E03 with a generated exhaustive visitor,
then joins the entire relocated state to E05's fresh target candidate. It also
joins effects to P4's separately adjudicated result; an unused target field or
product-only comparison is RED.

Graph equality covers prototypes, symbols, holes, descriptors, cycles, alias
bijection, typed bytes, `Object.is` numbers, order, and frozen state without
accessor invocation.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E03` | `P2 -> P3` | `relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult` | distinct versions; P2 coordinate atoms only |
| `E05` | `P5 -> P3` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | owner target product/effects/provenance bytes |
| `E09` | `P1 -> P3` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | candidate memo/product bytes only |
| `E15` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` | constructors, fields, cardinalities, sole generated visitor |

No other edge exists. Evidence-authored schemas/manifests, P2 product access,
untyped coordinates, omitted provenance, lossy equality, or second traversal
is RED. No CSS/product parser or execution is authorized.
