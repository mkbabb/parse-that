# P5 — raw control bytes and authenticated FreshControlReceipt

Status: `PAPER_V3 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 60 charged LOC`. Paper budget: `100 nonblank lines`.

## Owner-held raw bundle

`SafeNat` is a canonical safe nonnegative integer and `Hash` is 64 lowercase
hex. `Blob = {kind:string,encoding:string,bytes:ByteString,size:SafeNat,
sha256:Hash}` with `size` equal to the decoded byte length.

P5 is the sole owner-side control/harness module; all its executable logic is
charged. It P1-decodes an externally pinned canonical `RawControlBundle` whose
every blob is one `Blob` and whose hashes are
recomputed from bytes. The bundle contains actual accepted/rebuilt-M2 source
bytes, built artifact bytes, fixture bytes, command-record bytes, stdout bytes,
stderr bytes, result/product bytes, effect bytes, provenance bytes, semantic-
envelope bytes, runtime/toolchain bytes, and the canonical bundle manifest.

`CommandCapture` is decoded from the authenticated command-record bytes and
has exactly `{argv:string[1..*],cwd:string,env:{key,value}[0..*],
exit:{kind:"code",value:SafeNat}|{kind:"signal",value:string},stdoutBlob:Hash,
stderrBlob:Hash,nodeVersion:string,v8Version:string,toolchainHash:Hash,
compileCachePolicy:string,processStart:string,processEnd:string}`. Environment
keys are unique and sorted; stdout/stderr descriptors must resolve to the exact
bound blobs. No caller command summary is authoritative.

Accepted M2 commit is `de36d57dccdd20068b8c11a78f6e83d42e7d681f`;
rebuilt M2 and current semantic-envelope obligations are separately pinned.

`FreshControlReceipt` has exactly:

```text
{receiptId,rowId,runId,targetVersion,targetSourceBlob,controlArtifactBlob,
 fixtureBlob,commandBlob,stdoutBlob,stderrBlob,resultBlob,productBlob,
 effectBlob,provenanceBlob,semanticEnvelopeBlob,runtimeBlob,toolchainBlob,
 targetProductBytes,targetProductHash,observedEffectBytes,observedEffectHash,
 provenanceBytes,provenanceHash,finalOffset,terminalStatus,immutable}
```

Every descriptor resolves to one bundle blob exactly once where closure
requires it. Raw result/product/effect/provenance bytes decode to the receipt's
typed projections; summaries cannot replace bytes. Target product/effects are
freshly observed under the pinned argv/cwd/env/runtime and bind exact
row/run/source/version. Candidate evidence supplies none of the expected side.
Accepted M2 is speed control; the semantic envelope owns rollback, depth,
recovery, diagnostic, provenance, EOF, and complete-product obligations.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E05` | `P5 -> P3` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | raw-authenticated target product/effects/provenance bytes |
| `E06` | `P5 -> P4` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | raw-authenticated event bytes, order, payload, run, and target version |
| `E11` | `P1 -> P5` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | owner raw-control bundle and pin metadata only |
| `E17` | `P5 -> P7` | `freshControlClaim() -> InterfaceClaim<FreshControlAuthority>` | raw blobs, command capture, closure, and exact typed projections |

No other edge exists. Missing raw bytes, forged argv/cwd/env/exit/streams,
self-hashed manifests, synthetic control, shared executor, or summary-only
product/effects are RED. No build/control execution is authorized.
