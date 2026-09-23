# P0 — authenticated declaration and version ledger

Status: `PAPER_ONLY / ZERO_CREDIT / SOURCE_WITHHELD`

Future source budget: `1 module / 120 nonblank noncomment LOC maximum`.
Paper budget: `100 nonblank lines maximum`.

## Ownership and trust

P0 owns the only machine declaration and version-ledger domain. The external
owner supplies immutable `DeclarationBytes`, `LedgerBytes`, their byte counts,
and domain-separated SHA-256 pins. Submitted evidence supplies only ordinals;
it never supplies ledger nodes, hashes, handles, parents, edits, epochs, IDs,
or expected counts.

`LedgerRoot = SHA256("parse-that:N2:IETM:ledger:v1\0" || DeclarationBytes ||
LedgerBytes)`. A handle is derived from `LedgerRoot` and a version ordinal; it
is never accepted as proof of either byte stream. The declaration is decoded
once through P1 and is the sole source of run, row, transition, effect,
version, product-schema, coordinate-schema, grammar, action, environment, and
budget identities. No parallel constant or prose registry exists.

## Closed ledger

`VersionRecord = {ordinal, parentOrdinal, edit, sourceUtf16, sourceHash,
grammarHash, actionHash, environmentHash}`. The canonical ledger contains at
least two records: ordinal 0 has no parent/edit; every child names an earlier
parent and one nonidentity `insert`, `delete`, or `replace`. At least one child
must change source length or source units. Replaying each edit over its pinned
parent must byte-equal the child's UTF-16 units and hash.

All records, edits, unit arrays, parent links, declaration values, and epoch
identities are deeply immutable after P1 decoding. Ordinals are contiguous,
labels and handles are unique, the parent graph is acyclic, and no LR seed,
head, in-progress growth, callback closure, or mutable environment is
serializable. Evidence referring to an unknown or foreign ordinal is RED.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E01` | `P1 -> P0` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | canonical byte identity already proved |
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` | root bytes/hash externally pinned |
| `E04` | `P0 -> P4` | `identityEpoch(root: LedgerRoot) -> IdentityEpoch` | grammar/action/environment hashes |
| `E09` | `P0 -> P7` | `declarationLedgerClaim() -> InterfaceClaim<DeclarationLedger>` | exact bytes/hash/symbol ownership |

P0 has no other interface input or output. P1 returns a frozen value; P0
checks it against externally pinned bytes before constructing `LedgerRoot`.

## Paper falsifiers

- copied handle plus self-hash without ledger bytes: `RED`;
- one version, null-only edits, same base/target, or empty mandatory edit chain:
  `RED`;
- evidence-authored root, count, epoch, parent, edit, or expected hash: `RED`;
- declaration/constants divergence or unconsumed declaration hash: `RED`;
- replay, immutability, parent, uniqueness, or foreign-ordinal failure: `RED`.

No source, executable declaration, prototype, parser, timing, or N2e authority
is created by this contract.
