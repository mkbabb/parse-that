# P2 — epoch-aware relocation algebra

Status: `PAPER_V5_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 90 charged LOC`.

P2 retains v4's closed `Point`, `Interval`, `Eof`, `LineColumnAnchor`, and
`DepthDelta` algebra. It consumes E02 and emits one immutable E03 map over
coordinate atoms. Replacement-start/insertion bias, intersection, EOF and
failed-arm dependencies, line/column recomputation, source-slice replay,
composition, and recovery/diagnostic invalidation are exact. An epoch change
invalidates `DepthDelta`; P3 alone compares target depth and products.

P2 owns `validateEditReplay / EDIT_REPLAY_MISMATCH`, covering parent path,
nonidentity edit, UTF-16 replay, source hash, bias, composition, and epoch.
It returns E20 from the production leaf used by P6 controls.

## Cross-interface edges

| Edge | Direction | Signature |
|---|---|---|
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` |
| `E03` | `P2 -> P3` | `relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult` |
| `E14` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` |
| `E20` | `P2 -> P6` | `relocationValidation(input: P2ValidationInput) -> OwnerValidationReceipt<P2>` |

No other edge exists. No target product, callback, public edit API, fallback,
CSS grammar, or parser→Fourier edge is authorized.
