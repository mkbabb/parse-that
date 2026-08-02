# P0 — canonical declaration, version ledger, and identity epoch

Status: `PAPER_V2 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 120 charged LOC`. Paper budget: `100 nonblank lines`.

## External authority

The owner supplies immutable canonical `DeclarationBytes`, `LedgerBytes`, byte
counts, and domain-separated SHA-256 pins. P0 decodes both only through P1.
`LedgerRoot = SHA256("parse-that:N2:IETM:ledger:v2\0" || DeclarationBytes ||
LedgerBytes)`. Evidence supplies only declared ordinals; a copied handle,
self-hash, live node, parent, edit, epoch, ID, count, or expected value is RED.

The declaration is the sole source of run/row/transition/effect/version IDs,
counts, schema IDs, budgets, and one closed `IdentityEpoch`:

```text
IdentityEpoch = {epochId, grammarHash, ruleHash, actionHash, callbackHash,
  environmentHash, expectedEventContractBytes, expectedEventContractHash}
```

The contract bytes enumerate exact `{eventId,rowId,phase,ordinal}` rows and are
included in `DeclarationBytes`; their hash is recomputed after P1 byte identity.
Two callbacks sharing grammar/action/environment remain distinct by
`callbackHash` and `ruleHash`. P0 never claims that an event occurred.

## Ledger

`VersionRecord = {ordinal,parentOrdinal,edit,sourceUtf16,sourceHash,
identityEpochId}`. There are at least two immutable records. Root has no edit;
each child names an earlier parent and one nonidentity insert/delete/replace.
Replay must exactly produce child UTF-16 units/hash. Ordinals are contiguous;
parents acyclic; epochs declared; source/edit arrays frozen. No LR seed/head,
callback object, or mutable environment is serializable.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | decode then encode returns identical bytes |
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` | declaration/ledger bytes and root externally pinned |
| `E04` | `P0 -> P4` | `identityEpoch(root: LedgerRoot) -> IdentityEpoch` | grammar/rule/action/callback/environment plus ExpectedEventContract |
| `E12` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` | exact bytes/hash/identity ownership |

No other edge exists. P0 outputs authority, never candidate/control
observations. One version, empty edit chain, unconsumed declaration hash, or
parallel registry is RED. N2e/source/execution remains withheld.
