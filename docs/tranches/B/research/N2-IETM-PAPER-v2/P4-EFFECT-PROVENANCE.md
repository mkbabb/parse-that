# P4 — closed effect identity and observed trace

Status: `PAPER_V2 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 70 charged LOC`. Paper budget: `100 nonblank lines`.

## Inputs and observation

P4 receives complete expected identity only from E04 and fresh-control
observation only from E06. It has no implicit row contract, expected-event
table, grammar/action/callback registry, or self-authored identity.

Candidate observed-event bytes are decoded only through P1 and have exactly:

```text
{eventId,rowId,runId,sourceVersion,grammarHash,ruleHash,actionHash,
 callbackHash,environmentHash,phase,ordinal,payloadHash}
```

The observer is the P4 module and is included in its 70 charged LOC. It records
at the actual callback boundary. Expected `{eventId,rowId,phase,ordinal}` and
all five identity hashes come from `IdentityEpoch`; expected fresh occurrence,
order, payload and target version come from `FreshControlReceipt`. Candidate
evidence cannot provide the expected side. `ruleHash` is mandatory.

Each declared effect occurs exactly once and candidate global order/payload/
identity equals the fresh sequential control. Recognition reuse never reuses
old value/effect objects; callbacks rerun under the pinned environment. Empty
traces are legal only for a declaration row explicitly cardinality `0`.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E04` | `P0 -> P4` | `identityEpoch(root: LedgerRoot) -> IdentityEpoch` | grammar/rule/action/callback/environment plus ExpectedEventContract |
| `E06` | `P5 -> P4` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | owner target product/effects/provenance bytes |
| `E10` | `P1 -> P4` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | candidate observed-event bytes only |
| `E16` | `P4 -> P7` | `effectProvenanceClaim() -> InterfaceClaim<EffectProvenance>` | E04 identity plus E06 fresh observation |

No other edge exists. Shared E04 identity for distinct callbacks, evidence
echo, mutable ambient state, aggregate count, reordered/duplicate/missing
event, or observer outside the module/LOC ceiling is RED. No callback/parser
execution is authorized.
