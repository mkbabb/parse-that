# P2 — epoch-aware relocation algebra and production edit validation

Status: `PAPER_V4 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 90 charged LOC`. Paper ceiling: `120 nonblank lines`.

P2 owns only `Point`, `Interval`, `Eof`, `LineColumnAnchor`, `DepthDelta`, and
authenticated edit-chain algebra. It consumes E02 and returns a total immutable
E03 map over those atoms plus closed invalidation reasons. It never receives a
P3 graph/product, P4 event, P5 receipt, or candidate callback.

Replacement-start bias, insertion bias, interval intersection, EOF dependency,
line/column recomputation, composition, source-slice replay, and negative/
failed-arm/recovery/diagnostic invalidation remain exact v3 law. `DepthDelta`
relocates unchanged only when source and target `identityEpochId` match; an
epoch change invalidates before P3 comparison. P3 alone compares target depth,
limit, fault, and graph values.

P2 owns one production leaf, `validateEditReplay`, covering parent path,
nonidentity edit, UTF-16 replay, source hash, biases, composition, and epoch
transition. It returns E20. A P6 VALUE audit mutation rebases only the exact
outer/hash collateral named in its manifest, so this production leaf—not a
source hash or P6 shadow—owns `EDIT_REPLAY_MISMATCH`.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` | versions bind sourceVersion to identityEpochId |
| `E03` | `P2 -> P3` | `relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult` | coordinate atoms only; epoch change invalidates |
| `E14` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` | biases, composition, leaf, and no reverse edge |
| `E20` | `P2 -> P6` | `relocationValidation(input: P2ValidationInput) -> OwnerValidationReceipt<P2>` | reachable edit-replay leaf; typed outcome and collateral root |

No other edge exists. Same-version/empty-chain proof, target-state access,
product visitor, caller map, hidden callback, or direct parser→Fourier edge is
RED. No rope/index/public edit API or execution is authorized.
