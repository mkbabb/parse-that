# P0 — declaration, experiment selection, and epoch authority

Status: `PAPER_V5_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 120 charged LOC`.

## Canonical authority

An external owner pins canonical `DeclarationBytes` and `LedgerBytes` before
any candidate or control pre-run pin. P1 alone decodes them. The root is:

```text
LedgerRoot = SHA256("parse-that:N2:IETM:ledger:v5\0" ||
                    DeclarationBytes || LedgerBytes)
```

```text
VersionRecord = {sourceVersion,parentVersion,edit,sourceUtf16,sourceHash,
                 identityEpochId}
IdentityEpoch = {identityEpochId,effectTableBytes,effectTableHash}
EffectIdentity = {identityEpochId,eventId,rowId,phase,ordinal,actionSlotId,
                  cardinality}
ExperimentRow = {rowId,rowOrdinal,fixtureId,sourceVersion,identityEpochId,
                 candidateArtifactId,controlArtifactId,rolePolicy}
```

Action/callback/environment hashes are absent: P5 derives invocation authority
from authenticated invoked blobs and captures. `actionSlotId` is only a closed
grammar row key and grants no executable or capability truth.

There are at least two immutable versions and one nonidentity edit. Every
version binds exactly one epoch. Effect keys are unique over
`{identityEpochId,eventId,rowId,phase,ordinal}`. An epoch mismatch invalidates
reuse before event comparison.

## Ledger-derived selection

`LedgerBytes` carries one owner-pinned `activeExperimentRowOrdinal`. P0 selects
that exact declared `ExperimentRow`; no function argument, external label,
command, fixture, or evidence may choose a row. E26 returns:

```text
ExperimentSelectionReceipt = {ledgerRoot,rowId,rowOrdinal,fixtureId,
 sourceVersion,identityEpochId,candidateArtifactId,controlArtifactId,
 rolePolicy,selectionHash,immutable}
```

P5 pre-run pins must consume this exact receipt. Candidate/control role and
artifact must match `rolePolicy`; missing, duplicate, fallback, prefix, or
caller-selected rows are RED.

## Production leaves

| Leaf | Invariant | Code |
|---|---|---|
| `validateDeclarationHash` | pinned declaration equals canonical bytes | `DECLARATION_HASH_MISMATCH` |
| `validateLedgerRoot` | pinned root equals both canonical components | `LEDGER_ROOT_MISMATCH` |
| `validateVersionParent` | parent/edit/source hash/epoch are coherent | `VERSION_PARENT_INVALID` |
| `validateEffectKey` | epoch-qualified keys/order/cardinality are closed | `EFFECT_KEY_INVALID` |
| `validateExperimentSelection` | selected row/ordinal/fixture/version/epoch/artifacts/roles equal the ledger | `EXPERIMENT_SELECTION_MISMATCH` |

Every leaf returns E19 from the same production predicate function used by P6
controls. P0 receives no suppression argument.

## Cross-interface edges

| Edge | Direction | Signature |
|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` |
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` |
| `E04` | `P0 -> P4` | `selectEffectTable(root: LedgerRoot, sourceVersion: U53, identityEpochId: Id) -> SelectedEffectTable` |
| `E12` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` |
| `E19` | `P0 -> P6` | `declarationValidation(input: P0ValidationInput) -> OwnerValidationReceipt<P0>` |
| `E26` | `P0 -> P5` | `selectExperiment(root: LedgerRoot) -> ExperimentSelectionReceipt` |

No other edge exists. P0 owns no executor, output root, caller hash, CSS
grammar, fallback, or parser→Fourier edge.
