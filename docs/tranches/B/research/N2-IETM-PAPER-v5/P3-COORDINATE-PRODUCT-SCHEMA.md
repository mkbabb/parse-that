# P3 — coordinate-complete products and observation comparison

Status: `PAPER_V5_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 150 charged LOC`.

P3 retains v4's closed typed memo entry, complete product, dependency-read,
terminal/fault/recovery/diagnostic/selection/span, graph descriptor, symbol,
hole, cycle, alias, prototype, and immutability schemas.

`CoordinateValue` remains a closed `Semantic` value at roots, slots,
array/object properties, symbol descriptors, aliases, and cycles. One generated
visitor traverses every semantic, descriptor, slot, property, node, memo field,
and product field once per graph identity, relocates every coordinate through
E03, and preserves all graph identity. No second visitor or digest equality is
legal.

## Actual observation authority

P3 receives candidate output only through E24 and fresh control only through
E05. Both are post-run P5 `ObservationSeal` receipts bound to an independently
sealed pre-run input pin, E26 selection, role, executable/harness, command,
actual product bytes, chronology, and capability/freshness receipts. P3
decodes the actual bound product bytes through E09. Evidence cannot submit a
product, summary, sink, or output hash.

P3 owns:

| Leaf | Code |
|---|---|
| `validateTargetDepth` | `TARGET_DEPTH_MISMATCH` |
| `validateTargetProduct` | `TARGET_PRODUCT_MISMATCH` |

E21 returns the same production comparator's typed receipt and P1-derived
before/after collateral. P6 owns no copy.

## Cross-interface edges

| Edge | Direction | Signature |
|---|---|---|
| `E03` | `P2 -> P3` | `relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult` |
| `E05` | `P5 -> P3` | `freshControl(selection: ExperimentSelectionReceipt) -> ControlObservationSeal` |
| `E09` | `P1 -> P3` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` |
| `E15` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` |
| `E21` | `P3 -> P6` | `productValidation(input: P3ValidationInput) -> OwnerValidationReceipt<P3>` |
| `E24` | `P5 -> P3` | `candidateRun(selection: ExperimentSelectionReceipt) -> CandidateObservationSeal` |

No other edge exists. No evidence-authored output, reparse, callback, fallback,
dual path, CSS grammar, or Fourier edge is permitted.
