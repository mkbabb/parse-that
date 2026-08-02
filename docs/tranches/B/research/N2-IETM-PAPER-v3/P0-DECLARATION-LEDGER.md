# P0 — canonical declaration, version ledger, and effect identities

Status: `PAPER_V3 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 120 charged LOC`. Paper budget: `100 nonblank lines`.

## External byte authority

The owner supplies immutable canonical `DeclarationBytes` and `LedgerBytes`,
their byte counts, and domain-separated SHA-256 pins. P0 decodes them only
through P1. `LedgerRoot = SHA256("parse-that:N2:IETM:ledger:v3\0" ||
DeclarationBytes || LedgerBytes)`. A copied handle, self-hash, live object,
evidence-owned count, or expected value is RED.

The declaration is the sole source of IDs, counts, schema IDs, budgets, and
one or more immutable identity epochs. Each epoch contains exactly:

```text
IdentityEpoch = {epochId, effectIdentityTableBytes, effectIdentityTableHash}
EffectIdentity = {eventId,rowId,phase,ordinal,grammarHash,ruleHash,
  actionHash,callbackHash,environmentHash,cardinality}
```

`EffectIdentity[]` is nonempty or explicitly empty for an epoch, strictly
ordered and unique by unsigned canonical bytes of
`{eventId,rowId,phase,ordinal}`. `phase` is a declared enum; `ordinal` and
`cardinality` are canonical safe nonnegative integers. Each table entry owns
all five hashes and exact cardinality. Table bytes are embedded in
`DeclarationBytes`; P0 recomputes their hash after P1 byte identity. No
singular tuple supplies identity for multiple rows. P0 never records or claims
that an event occurred.

## Version ledger

`VersionRecord = {ordinal,parentOrdinal,edit,sourceUtf16,sourceHash,
identityEpochId}`. There are at least two immutable records. Root has no edit;
each child names an earlier parent and one nonidentity insert/delete/replace.
Replay exactly produces child UTF-16 units/hash. Ordinals are contiguous,
parents acyclic, epochs declared, and arrays frozen. No LR seed/head, callback
object, mutable environment, product, depth, or fresh-control field is stored.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | declaration, ledger, table decode; byte identity required |
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` | canonical versions, edits, epochs; no product/depth state |
| `E04` | `P0 -> P4` | `effectIdentityTable(root: LedgerRoot) -> EffectIdentityTable` | ordered keyed entries with five hashes and cardinality |
| `E12` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` | exact bytes, tables, hashes, and identity ownership |

No other edge exists. Missing/duplicate/ambiguous event keys, unbound table
bytes/hash, singular identity fallback, or parallel registry is RED.
N2e/source/execution remains withheld.
