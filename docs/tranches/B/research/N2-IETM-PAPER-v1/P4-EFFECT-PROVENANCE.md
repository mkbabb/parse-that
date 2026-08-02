# P4 — external identity and exactly-once effect provenance

Status: `PAPER_ONLY / ZERO_CREDIT / SOURCE_WITHHELD`

Future source budget: `1 module / 70 nonblank noncomment LOC maximum`.
Paper budget: `100 nonblank lines maximum`.

## Authority

P4 separates expected identity from observed execution. P0 supplies the
externally pinned `IdentityEpoch` containing grammar, rule, action, callback,
and environment hashes. The candidate evidence cannot author or replace these
identities. Arbitrary `Parser`, `map`, `mapState`, `chain`, `call`, `debug`,
custom regex, recovery callbacks, and closure/environment reads are
non-reusable unless their identities and effects are explicitly versioned;
otherwise recognition may rerun and semantic callbacks must rerun.

The future observer is outside submitted evidence. It records immutable events
`{eventId,rowId,versionOrdinal,grammarHash,actionHash,callbackHash,
environmentHash,phase,ordinal,payloadHash}` at the actual callback boundary.
The expected ordered event identities come from the external epoch and frozen
row contract; observed events come only from instrumentation. The same party
cannot supply both.

For an effect-bearing row, the observed trace is nonempty and exactly equals
the fresh control trace in identity, order, phase, count, payload and source
version. Each declared event occurs exactly once at its declared ordinal.
Recognition reuse cannot reuse an old value object or old effect event;
reconstructed values are fresh. Empty-equals-empty, echoed evidence fields,
aggregate counts, or sink-only equality are RED.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E04` | `P0 -> P4` | `identityEpoch(root: LedgerRoot) -> IdentityEpoch` | grammar/action/environment hashes |
| `E05` | `P4 -> P3` | `observeEffects(row: RowIdentity) -> ObservedEffectTrace` | external expected identity, runtime observation only |
| `E13` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` | independent identity/observation ownership |

P4 has no other interface input or output. P3 may compare the trace but cannot
manufacture it. P0 may name epochs but cannot claim an event occurred.

## Fatal paper checks

Evidence-authored action/callback/phase/count, mutable environment without an
epoch, hidden closure reads, persisted LR/in-progress state, reused semantic
objects, missing callback positions, multiple executions, absent nonzero
effect rows, or a self-observing candidate are `RED`.

No instrumentation, callback execution, parser, or prototype is authorized.
