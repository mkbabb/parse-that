# P3 — coordinate-complete semantic graph, products, and validation

Status: `PAPER_V4 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 150 charged LOC`. Paper ceiling: `120 nonblank lines`.

## Closed values and sole visitor

P3 retains v3's exact ID/hash/integer/cardinality vocabulary, 28-field
`TypedMemoEntry`, nine-field `CompleteProduct`, dependency-read variants,
terminal/fault/recovery/diagnostic/selection/span schemas, prototype/
descriptor/symbol/hole/cycle/alias equality, and frozen-graph law.

V4 closes the missing graph coordinate domain:

```text
Semantic = Null | Boolean | String | Integer | NumberTag | Undefined
         | ByteString | GraphRef | CoordinateValue(value:Coordinate)
Descriptor = Data(enumerable,configurable,writable,value:Semantic)
           | Accessor(enumerable,configurable,getHash?,setHash?)
Slot = {index:U53,value:Semantic}
```

`CoordinateValue` is permitted at roots, slots, array/object properties,
symbol descriptors, shared aliases, and cycles through `GraphRef`. P3's one
generated visitor traverses every `Semantic`, `Descriptor`, `Slot`, property,
node, memo field, and complete-product field exactly once per graph identity;
it relocates every reachable Coordinate through E03 while preserving aliases,
cycles, prototypes, descriptors, holes, symbols, order, and frozen state.
Unknown coordinate paths, second visitors, and digest-only equality are RED.

## Owner-bound candidate and control

P3 receives expected control only through E05 and candidate output only through
E24. Both receipts are P5-rooted and name sourceVersion/identityEpochId,
executor, command, artifact, bundle root, raw product bytes, chronology, and
external pins. P3 decodes those bytes through E09. Candidate bytes cannot be
submitted directly, copied from control, or replaced by a summary. P3 compares
relocated candidate to fresh control only after both independent seals exist.

P3 owns `validateTargetDepth` and `validateTargetProduct`. E21 proves the same
production comparator reached the named leaf and binds exact typed outcome,
input roots, collateral root, and complete product. P6 owns neither leaf.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E03` | `P2 -> P3` | `relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult` | coordinate atoms only; epoch change invalidates |
| `E05` | `P5 -> P3` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | owner-rooted control product/effects/provenance bytes |
| `E09` | `P1 -> P3` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | P5-authenticated candidate/control product bytes only |
| `E15` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` | graph Coordinate closure, sole visitor, leaves, and budget |
| `E21` | `P3 -> P6` | `productValidation(input: P3ValidationInput) -> OwnerValidationReceipt<P3>` | reachable depth/product leaves; typed complete-product outcome |
| `E24` | `P5 -> P3` | `candidateRun(row: RowIdentity) -> CandidateRunReceipt` | owner-executed candidate bytes sealed before control exposure |

No other edge exists. No evidence-authored candidate, hidden evaluator,
reparse, callback, fallback, scalar dual path, CSS grammar, or Fourier edge is
permitted.
