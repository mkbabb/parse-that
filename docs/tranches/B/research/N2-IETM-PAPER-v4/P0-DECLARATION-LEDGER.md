# P0 — declaration, version-to-epoch authority, and production validation

Status: `PAPER_V4 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 120 charged LOC`. Paper ceiling: `120 nonblank lines`.

## Canonical authority

The owner supplies externally pinned canonical `DeclarationBytes` and
`LedgerBytes`; P0 decodes them only through P1. The noncircular root is
`LedgerRoot = SHA256("parse-that:N2:IETM:ledger:v4\0" || DeclarationBytes ||
LedgerBytes)`. The external pin fixes byte lengths and both component hashes
before candidate or control execution. Evidence cannot supply an expected
root, epoch, table, version, or validation result.

```text
VersionRecord = {sourceVersion,parentVersion,edit,sourceUtf16,sourceHash,
                 identityEpochId}
IdentityEpoch = {identityEpochId,effectTableBytes,effectTableHash}
EffectIdentity = {identityEpochId,eventId,rowId,phase,ordinal,grammarHash,
                  ruleHash,actionHash,callbackHash,environmentHash,cardinality}
```

There are at least two immutable versions and one nonidentity edit. Versions
are contiguous and acyclic. Every `sourceVersion` binds exactly one declared
`identityEpochId`; epoch changes invalidate reuse. Effect entries are unique
and ordered by canonical bytes of
`{identityEpochId,eventId,rowId,phase,ordinal}`. Repeated event keys across
epochs are legal only because the epoch is part of the key. Table bytes/hash
are embedded in and recomputed from `DeclarationBytes`.

E04 succeeds only when the named target `VersionRecord` binds the supplied
`identityEpochId`. It returns `{sourceVersion,identityEpochId,versionHash,
effectTableBytes,effectTableHash,entries}`. Missing, mismatched, inferred,
fallback, or cross-epoch selection is RED.

## Production leaves

P0 owns exactly four production leaves:

| Leaf | Exact invariant | Code |
|---|---|---|
| `validateDeclarationHash` | external declaration pin equals canonical bytes | `DECLARATION_HASH_MISMATCH` |
| `validateLedgerRoot` | external ledger pin/root equals both canonical components | `LEDGER_ROOT_MISMATCH` |
| `validateVersionParent` | parent/edit replay/source hash/version epoch are coherent | `VERSION_PARENT_INVALID` |
| `validateEffectKey` | epoch-qualified key/order/table hash/cardinality are closed | `EFFECT_KEY_INVALID` |

Each leaf returns the typed E19 receipt from the same production path; P6 owns
no copy. P0 accepts a P6 audit rebase only when the exact collateral manifest
is separately authenticated and never suppresses a non-owning leaf.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | strict codec; P0 owns declaration/ledger schema |
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` | versions bind sourceVersion to identityEpochId |
| `E04` | `P0 -> P4` | `selectEffectTable(root: LedgerRoot, sourceVersion: U53, identityEpochId: Id) -> SelectedEffectTable` | target VersionRecord binds exact epoch; cross-epoch reuse rejected |
| `E12` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` | exact bytes, epoch selection, leaves, and budgets |
| `E19` | `P0 -> P6` | `declarationValidation(input: P0ValidationInput) -> OwnerValidationReceipt<P0>` | four reachable P0 leaves; typed outcome and collateral root |

No other edge exists. P0 has no candidate executor, product comparator, CSS
grammar, audit evaluator, fallback, or direct Fourier edge.
