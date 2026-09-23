# P5 — owner pins and authenticated FreshControlReceipt

Status: `PAPER_V2 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 60 charged LOC`. Paper budget: `100 nonblank lines`.

## Owner-held canonical record

P5 is the sole owner-side control/harness module and all its executable logic
counts in 60 charged LOC. It P1-decodes externally pinned canonical bytes over
actual source/artifact/fixture/command/result bytes, never candidate metadata.
Accepted M2 commit is `de36d57dccdd20068b8c11a78f6e83d42e7d681f`;
rebuilt M2 and current semantic-envelope obligations are separately pinned.

`FreshControlReceipt` has exactly:

```text
{receiptId,rowId,runId,targetVersion,targetSourceHash,controlArtifactHash,
 sourceManifestHash,fixtureHash,commandHash,nodeHash,v8Hash,toolchainHash,
 semanticEnvelopeHash,targetProductBytes,targetProductHash,
 observedEffectBytes,observedEffectHash,provenanceBytes,provenanceHash,
 finalOffset,terminalStatus,immutable}
```

All byte hashes are recomputed from owner-held bytes. Target product/effects are
freshly observed under the pinned command/runtime and bind exact row/run/source
and identity epoch. Candidate evidence can reference `receiptId` but supplies
none of these fields. Accepted M2 is speed control; the semantic envelope owns
rollback/depth/recovery/diagnostic/provenance/EOF/complete-product obligations.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E05` | `P5 -> P3` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | owner target product/effects/provenance bytes |
| `E06` | `P5 -> P4` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | owner target product/effects/provenance bytes |
| `E11` | `P1 -> P5` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | owner fresh-control/pin bytes only |
| `E17` | `P5 -> P7` | `freshControlClaim() -> InterfaceClaim<FreshControlAuthority>` | actual bytes/commands/runtime/products/effects |

No other edge exists. Self-hashed manifests, synthetic controls, candidate-
authored expected values, missing source bytes, shared executor, one-sided
warm/cache policy, observer/harness outside P5, or product/effect summaries are
RED. No build/control execution is authorized.
