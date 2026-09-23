# P4 — epoch-qualified effect adjudication and production validation

Status: `PAPER_V4 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 70 charged LOC`. Paper ceiling: `120 nonblank lines`.

P4 consumes one E04 table selected by the exact target VersionRecord and one
authenticated `identityEpochId`. Candidate events arrive only through E25;
fresh events arrive only through E06; P1 only decodes their P5-authenticated
bytes through E10.

```text
ObservedEvent = {sourceVersion,identityEpochId,eventId,rowId,phase,ordinal,
 occurrence,runId,grammarHash,ruleHash,actionHash,callbackHash,
 environmentHash,payloadBytes,payloadHash}
LookupKey = {identityEpochId,eventId,rowId,phase,ordinal}
```

The receipt sourceVersion and identityEpochId must equal the E04 selection and
the target VersionRecord. Cross-epoch reuse, missing/duplicate/ambiguous key,
prefix/default/fallback lookup, and candidate-supplied selection are RED.
Occurrence is exactly `0..cardinality-1`; zero cardinality proves complete
absence. Positive rows match fresh count, global order, identity, payload,
run, version, and epoch.

P5 owns execution and callback invocation. P4 owns only the sealed-event
comparator and `validateEffectOccurrence` production leaf. E22 binds that same
leaf's typed result; P6 has no effect predicate or callback. Candidate/control
event bundles are independently sealed before comparison.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E04` | `P0 -> P4` | `selectEffectTable(root: LedgerRoot, sourceVersion: U53, identityEpochId: Id) -> SelectedEffectTable` | target VersionRecord binds exact epoch; cross-epoch reuse rejected |
| `E06` | `P5 -> P4` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | owner-rooted control events with sourceVersion and identityEpochId |
| `E10` | `P1 -> P4` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | P5-authenticated candidate/control event bytes only |
| `E16` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` | epoch lookup, sealed traces, leaf, and budget |
| `E22` | `P4 -> P6` | `effectValidation(input: P4ValidationInput) -> OwnerValidationReceipt<P4>` | reachable occurrence/order leaf; typed event outcome |
| `E25` | `P5 -> P4` | `candidateRun(row: RowIdentity) -> CandidateRunReceipt` | owner-executed candidate events sealed before control exposure |

No other edge exists. No implicit event contract, self-authored expectation,
mutable environment, aggregate-only result, callback, reparse, fallback,
dual path, CSS grammar, or Fourier edge is permitted.
