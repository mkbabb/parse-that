# P4 — keyed effect identity, occurrence, and trace adjudication

Status: `PAPER_V3 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 70 charged LOC`. Paper budget: `100 nonblank lines`.

## Exact inputs and lookup

P4 receives the complete ordered `EffectIdentityTable` only from E04 and
fresh-control observations only from E06. Candidate observed-event bytes are
decoded only through P1 and have exactly:

```text
ObservedEvent = {eventId,rowId,phase,ordinal,occurrence,runId,sourceVersion,
  grammarHash,ruleHash,actionHash,callbackHash,environmentHash,
  payloadBytes,payloadHash}
```

P4 looks up exactly one table entry by `{eventId,rowId,phase,ordinal}`. Missing,
duplicate, extra, ambiguous, prefix, default, or fallback lookup is RED. All
five identity hashes must match that entry. `occurrence` is the canonical
integer sequence `0..cardinality-1`; cardinality zero requires no candidate
event and no fresh event for that key. The complete key set proves absence.

For positive cardinality, candidate occurrence count, table order, global
event order, payload bytes/hash, run, target version, and identity equal E06's
fresh sequential observation. The observer records at the actual callback
boundary and is charged to P4. Recognition reuse never reuses value/effect
objects; callbacks rerun under the pinned environment. P4 has no implicit row
contract, candidate-authored expectation, or singular identity tuple.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E04` | `P0 -> P4` | `effectIdentityTable(root: LedgerRoot) -> EffectIdentityTable` | ordered keyed entries with five hashes and cardinality |
| `E06` | `P5 -> P4` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | raw-authenticated event bytes, order, payload, run, and target version |
| `E10` | `P1 -> P4` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | typed candidate observed-event bytes only |
| `E16` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` | exact lookup, cardinality, occurrence, order, and payload law |

No other edge exists. Singular identity, self-authored cardinality, evidence
echo, mutable ambient state, aggregate-only count, trace drift, or observer
outside the ceiling is RED. No callback/parser execution is authorized.
