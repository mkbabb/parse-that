# N2 IETM paper packet v4 status and machine manifest

Status: `PAPER_V4_RED / P7_EXECUTABLE_AST_BUDGET_UNBOUND / ZERO_CREDIT`.

## Frozen inputs

- v3 commit/tree: `1fae739bb251541a37df17dd4a3dc54b793b5835` /
  `6f5c9106c5e163dac6fe5e412dfff6c5e98b1c47`;
- v3 manifest: `b79b03030a38ff1724d6f20c25fef7ffbb1820246e840ea085b63ed73905e322`;
- A3 intake/commit: `ed034fdf63e88a0d5a8ec45592d7feaa3ab87e6658a6a5e55b6e75c8589af987` /
  `b1ecf63ec89c5e6c048345dc49778f675be14bfa`;
- B3 intake/commit: `05801768e70bb74380a964745c70305e131ee65082770ed9b5c81e55647c7992` /
  `2271d4bfe66b2775ba495e4d7613082634fbd1fc`;
- resurrection HANDOFF/STATE/checksums:
  `6bdb6a85ba632f3c9473383d9afff2803df83218d20c4d677439a38e2917f6f5` /
  `dc39257f59bfe3ff8a3f92ae5bf4ae2a6aeed53405d92e79158a796b9ee941e6` /
  `30aefb55903ea87d950c90573d53c2845188f7186f67920598c8aa294cc4e42b`.

V1–v3 remain immutable. V4 closes the A3/B3 authority, epoch, candidate,
coordinate, bundle, hostile, chronology, and edge contracts on paper. It does
not claim the executable budget is feasible: P7's actual source-parser/AST-tool
bytes and transitive charged LOC are unbound, so the honest disposition is RED.

## Closed machine manifest

This canonical JSON block is the only machine manifest. P0–P7 prose and edge
tables must match it exactly; a mismatch is `V4_MACHINE_MANIFEST_DRIFT`.

```json
{
  "schema": "parse-that/n2-ietm-paper-v4-manifest/v1",
  "status": "PAPER_V4_RED",
  "fatalReason": "P7_EXECUTABLE_AST_BUDGET_UNBOUND",
  "files": 10,
  "interfaces": ["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7"],
  "budgets": {"P0": 120, "P1": 155, "P2": 90, "P3": 150, "P4": 70, "P5": 85, "P6": 70, "P7": 110, "total": 850},
  "p7ActualChargedLoc": null,
  "edgeCount": 25,
  "edges": [
    ["E01", "P1", "P0", "decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue"],
    ["E02", "P0", "P2", "openLedger(root: LedgerRoot) -> VersionLedgerView"],
    ["E03", "P2", "P3", "relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult"],
    ["E04", "P0", "P4", "selectEffectTable(root: LedgerRoot, sourceVersion: U53, identityEpochId: Id) -> SelectedEffectTable"],
    ["E05", "P5", "P3", "freshControl(row: RowIdentity) -> FreshControlReceipt"],
    ["E06", "P5", "P4", "freshControl(row: RowIdentity) -> FreshControlReceipt"],
    ["E07", "P1", "P6", "rawCodecValidation(raw: ByteString) -> OwnerValidationReceipt<P1Raw>"],
    ["E08", "P1", "P6", "canonicalValueValidation(value: CanonicalValue, collateral: CollateralManifest) -> OwnerValidationReceipt<P1Value>"],
    ["E09", "P1", "P3", "decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue"],
    ["E10", "P1", "P4", "decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue"],
    ["E11", "P1", "P5", "decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue"],
    ["E12", "P0", "P7", "declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>"],
    ["E13", "P1", "P7", "canonicalCodecClaim() -> InterfaceClaim<CanonicalCodec>"],
    ["E14", "P2", "P7", "relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>"],
    ["E15", "P3", "P7", "coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>"],
    ["E16", "P4", "P7", "effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>"],
    ["E17", "P5", "P7", "freshControlClaim() -> InterfaceClaim<FreshControlAuthority>"],
    ["E18", "P6", "P7", "byteHostileClaim() -> InterfaceClaim<ByteHostileManifest>"],
    ["E19", "P0", "P6", "declarationValidation(input: P0ValidationInput) -> OwnerValidationReceipt<P0>"],
    ["E20", "P2", "P6", "relocationValidation(input: P2ValidationInput) -> OwnerValidationReceipt<P2>"],
    ["E21", "P3", "P6", "productValidation(input: P3ValidationInput) -> OwnerValidationReceipt<P3>"],
    ["E22", "P4", "P6", "effectValidation(input: P4ValidationInput) -> OwnerValidationReceipt<P4>"],
    ["E23", "P5", "P6", "bundleRunValidation(input: P5ValidationInput) -> OwnerValidationReceipt<P5>"],
    ["E24", "P5", "P3", "candidateRun(row: RowIdentity) -> CandidateRunReceipt"],
    ["E25", "P5", "P4", "candidateRun(row: RowIdentity) -> CandidateRunReceipt"]
  ],
  "controls": {
    "P6": {"injectors": 19, "baseline": 19, "ownerReject": 19, "ownerBypass": 19, "nonownerRetention": 342, "erasure": 19, "unknown": 1, "duplicate": 1, "total": 420},
    "P7": {"injectors": 14, "baseline": 14, "ownerReject": 14, "ownerBypass": 14, "nonownerRetention": 182, "erasure": 14, "unknown": 1, "duplicate": 1, "total": 240},
    "totalReceipts": 660
  },
  "ownership": {"candidateExecutor": "P5", "controlExecutor": "P5", "productComparator": "P3", "effectComparator": "P4", "auditChronology": "P6", "sourceAstVerifier": "P7"},
  "forbidden": ["hidden-evaluator", "reparse", "callback-outside-P5", "fallback", "dual-path", "scanner-token-index-tape", "css-grammar-in-parse-that", "parse-that-to-fourier"],
  "credit": {"authority": 0, "scientific": 0, "equivalence": 0, "performance": 0, "novelty": 0, "css": 0, "product": 0, "law": 0, "release": 0},
  "authorized": {"paperV4": true, "reviewA4": false, "reviewB4": false, "n2e": false, "source": false, "execution": false, "prototype": false, "benchmark": false}
}
```

## Boundary

- exact topology: `8 interfaces + PAPER-READY + PAPER-MANIFEST`;
- P0–P5 production-validation edges into P6: `7` including P1 RAW/VALUE;
- edge rows: each E01–E25 must occur exactly twice at endpoints;
- future hostile receipts: `420 + 240 = 660`;
- all retrospective and prospective credit: `0`;
- A4/B4 reviews: `NOT AUTHORIZED / NOT DISPATCHED`;
- N2e/source/Node/AST/parser/prototype/benchmark/product work: `WITHHELD`;
- next action: later owner/root adjudication of the explicit P7 budget RED;
  this packet cannot self-release a correction, review, or implementation.

`PAPER-MANIFEST.sha256` covers all nine non-manifest files.
