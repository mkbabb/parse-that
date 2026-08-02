# P6 — closed canonical-byte predicate and injector ownership

Status: `PAPER_V2 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 100 charged LOC`. Paper budget: `100 nonblank lines`.

## Closed ownership table

P6 owns all canonical-value transforms and no source/AST/prose/budget mutant.
P1 only decodes/encodes. Production calls the exact `PredicateId`; no message,
substring, path, stack, expected code, case ID, or group token selects it.

| `InjectorId` | Exact canonical-value mutation | Owning `PredicateId` |
|---|---|---|
| `I_DECLARATION_HASH` | flip one declaration hash nibble | `P_DECLARATION` |
| `I_LEDGER_ROOT` | replace ledger-root bytes | `P_LEDGER` |
| `I_DUPLICATE_KEY` | introduce duplicate decoded key before encode refusal | `P_CANONICAL` |
| `I_NONCANONICAL_ESCAPE` | request escaped slash spelling; encoder refuses | `P_CANONICAL` |
| `I_VERSION_PARENT` | replace child parent ordinal | `P_VERSION_EDIT` |
| `I_EDIT_START` | move child edit start one UTF-16 unit | `P_VERSION_EDIT` |
| `I_COORDINATE_ATOM` | replace atom bias/value | `P_RELOCATION` |
| `I_TARGET_PRODUCT` | swap target product row ID | `P_TARGET_JOIN` |
| `I_EFFECT_CALLBACK` | replace callbackHash | `P_EFFECT_IDENTITY` |
| `I_CONTROL_ROW` | swap FreshControlReceipt row ID | `P_FRESH_CONTROL` |

`PredicateId` is exactly the ten IDs in the table. `InjectorId` is exactly the
ten injector IDs. The table itself is the only injector→owner authority. A
mutation that cannot be canonically encoded is an owner rejection, not a raw-
byte escape hatch.

For every injector: baseline, production owner rejection, owner suppression,
all nine non-owner retentions, byte-identical unaffected records, erased
mutation, unknown ID, duplicate/multi-use ID, and production/audit separation
are mandatory. The private audit wrapper and observer logic count in P6's 100
charged LOC; production input/output exposes no token or suppression count.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E07` | `P1 -> P6` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | codec only; P6 owns transforms |
| `E08` | `P1 -> P6` | `encodeCanonical(value: CanonicalValue) -> CanonicalBytes` | codec only; P6 owns transforms |
| `E18` | `P6 -> P7` | `byteHostileClaim() -> InterfaceClaim<ByteHostileManifest>` | closed IDs/table and controls-of-control |

No other edge exists. Source/prose/forbidden-edge/LOC mutations belong only to
P7. Hidden injector, unreachable baseline, false non-owner, message routing,
or helper module outside the ceiling is RED. No hostile execution is authorized.
