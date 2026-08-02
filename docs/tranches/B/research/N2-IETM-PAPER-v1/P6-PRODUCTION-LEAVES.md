# P6 — production predicate leaves and controls-of-control

Status: `PAPER_ONLY / ZERO_CREDIT / SOURCE_WITHHELD`

Future source budget: `1 module / 100 nonblank noncomment LOC maximum`.
Paper budget: `100 nonblank lines maximum`.

## Production law

P6 owns a closed `PredicateId` union with one unique ID per invariant, including
declaration/ledger root, canonical bytes, version/edit replay, relocation,
coordinate schema, complete product, effect provenance, M2 pins, row joins,
budget, and forbidden edge. Production calls `reject(PredicateId)` directly at
the owning check. No message text, substring, regex, stack, path, grouped code,
case label, caller token, or expected reason selects ownership.

Production input/output contains no audit token, suppression state, injector,
mutant identity, expected code, or suppression count. A separate private audit
wrapper owns opaque one-use predicate tokens and concrete `InjectorId` records.
Each injector is a deterministic transformation of authenticated canonical
bytes through P1; it changes exactly one declared invariant while keeping all
unaffected bytes and external pins fixed.

For every injector, the paper matrix requires baseline acceptance; ordinary
production rejection at the owner ID; owner suppression reaching exactly the
next dependent result; retention under every non-owner suppression;
byte-identical unaffected rows; erased mutation returning baseline; unknown
injector rejection; duplicate/multi-use rejection; group-token rejection; and
production/audit output separation. No synthetic object or path-presence test
substitutes for the canonical bytes consumed by production.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E07` | `P1 -> P6` | `rewriteCanonical(bytes: CanonicalBytes, injector: InjectorId) -> CanonicalBytes` | output must round-trip canonically |
| `E08` | `P6 -> P7` | `leafAuditClaim() -> InterfaceClaim<LeafAuditManifest>` | owner/non-owner/control closure |

P6 has no other interface input or output. P1 canonicalizes bytes without
choosing the expected result. P7 verifies the closed predicate/injector graph
but cannot self-certify a production result.

## Minimum injector ownership rows

The eventual paper-to-source ruling must bind concrete rows for copied ledger
handle, empty edit chain, noncanonical escape, duplicate key, source replay
drift, coordinate omission, stale top-level memo offset, target-product swap,
effect echo, self-hashed M2 manifest, row/product cross-swap, source/prose drift,
forbidden scanner/token/event/VM edge, and module/LOC overflow.

Any absent owner row, false non-owner rejection, message classification,
production-visible audit state, unreachable injector, or expected-code oracle
is `RED`. No hostile execution is authorized here.
