# P4 — epoch-qualified effects from actual invocation authority

Status: `PAPER_V5_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 70 charged LOC`.

P4 consumes the target E04 epoch table. Candidate events arrive through E25;
control events arrive through E06. Each is part of an actual post-run P5 seal
and decodes through E10.

```text
ObservedEvent = {sourceVersion,identityEpochId,eventId,rowId,phase,ordinal,
 occurrence,runId,actionSlotId,invocationAuthorityId,payloadBytes,payloadHash}
LookupKey = {identityEpochId,eventId,rowId,phase,ordinal}
```

`invocationAuthorityId` is production-derived by P5 from the invoked artifact,
executor, harness, action-body/import/capture observations, callback closure,
bounded environment, capability declaration, and returned topology. Caller
`actionHash`, `callbackHash`, `environmentHash`, and classification are absent.
N3 capability capsules are a typed pending dependency only; v5 neither accepts
nor assumes one.

Candidate/control receipts must match E26 row/version/epoch/role and their own
P5 invocation authority. P4 compares exact cardinality, order, payload,
exceptions, and action-slot policy. Missing/duplicate event, fallback lookup,
cross-epoch authority, or evidence-authored trace is RED.

P4 owns `validateEffectOccurrence / EFFECT_OCCURRENCE_MISMATCH`; E22 returns
the production leaf receipt. P5 alone invokes callbacks; P4 only compares
sealed observations.

## Cross-interface edges

| Edge | Direction | Signature |
|---|---|---|
| `E04` | `P0 -> P4` | `selectEffectTable(root: LedgerRoot, sourceVersion: U53, identityEpochId: Id) -> SelectedEffectTable` |
| `E06` | `P5 -> P4` | `freshControl(selection: ExperimentSelectionReceipt) -> ControlObservationSeal` |
| `E10` | `P1 -> P4` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` |
| `E16` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` |
| `E22` | `P4 -> P6` | `effectValidation(input: P4ValidationInput) -> OwnerValidationReceipt<P4>` |
| `E25` | `P5 -> P4` | `candidateRun(selection: ExperimentSelectionReceipt) -> CandidateObservationSeal` |

No other edge exists. No caller hash, implicit event contract, callback,
reparse, fallback, dual path, CSS grammar, or Fourier edge is permitted.
