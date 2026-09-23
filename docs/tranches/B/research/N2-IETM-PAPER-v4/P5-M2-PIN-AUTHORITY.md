# P5 — noncircular raw bundles, candidate executor, and sealed receipts

Status: `PAPER_V4 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 85 charged LOC`. Paper ceiling: `120 nonblank lines`.

## External pins and exact membership

P5 owns the only candidate/control executor, command capture, callback
invocation, raw bundle assembly, and run seal. An external owner pin is fixed
before either run and contains `{schema,role,bundleId,rowId,runId,
sourceVersion,identityEpochId,membershipHash,bundleRoot,sourceCommit,
artifactHash,executorHash,harnessHash,runtimeHash,toolchainHash}`.

Each candidate or control bundle contains exactly fourteen regular byte blobs,
one for each kind in this order:

```text
source, artifact, fixture, executor, command, stdout, stderr, result,
product, effects, provenance, semanticEnvelope, runtime, toolchain
```

`BlobDescriptor={ordinal,blobId,kind,encoding,size,sha256}`. Membership has
exactly fourteen unique descriptors and fourteen blobs; descriptor↔blob is a
bijection, ordinal/kind order is exact, sizes/hashes recompute, and every blob
appears once in the receipt projection. Missing, extra, orphan, duplicate,
aliased-path, or unused membership is RED.

`MembershipBytes` contain descriptors but no root. `MembershipHash =
SHA256(MembershipBytes)`. `BundleRoot = SHA256("parse-that:N2:bundle:v4\0" ||
role || bundleId || MembershipHash || descriptor hashes in ordinal order)`.
The separately supplied external pin must match; neither bundle nor receipt
can self-author it. This construction is noncircular.

## Command, chronology, and receipts

`CommandCapture={argv[1..*],cwd,envSorted[0..*],exitCodeOrSignal,stdoutBlob,
stderrBlob,nodeVersion,v8Version,compileCachePolicy,processStart,processEnd}`
is decoded from the bound command blob and matches the bound executor,
artifact, runtime, toolchain, source, and fixture.

P5 chronology is exact: `(1)` external pins seal; `(2)` candidate receives only
shared source/fixture/runtime/toolchain plus candidate artifact/executor and
runs once; `(3)` candidate bundle/receipt seal; `(4)` only then control starts;
`(5)` control seals; `(6)` P3/P4 receive both. Candidate capabilities never
include control command/result/product/effects/provenance/stdout/stderr bytes.
Equal final products are permitted; copying is not.

`CandidateRunReceipt` and `FreshControlReceipt` have the same closed fields:
`{role,receiptId,bundleId,bundleRoot,membershipHash,rowId,runId,sourceVersion,
identityEpochId,sourceBlob,artifactBlob,fixtureBlob,executorBlob,commandBlob,
stdoutBlob,stderrBlob,resultBlob,productBlob,effectsBlob,provenanceBlob,
semanticEnvelopeBlob,runtimeBlob,toolchainBlob,chronologyOrdinal,immutable}`.
Candidate role is `candidate`; fresh role is `control`. Raw bytes—not evidence
summaries—own products and effects.

P5 owns `validateFreshControlRow` and the complete bundle/run validator; E23
binds their production result. Accepted M2 commit remains
`de36d57dccdd20068b8c11a78f6e83d42e7d681f`; rebuilt M2 and semantic envelope
are separate exact artifacts, not fallback paths.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E05` | `P5 -> P3` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | owner-rooted control product/effects/provenance bytes |
| `E06` | `P5 -> P4` | `freshControl(row: RowIdentity) -> FreshControlReceipt` | owner-rooted control events with sourceVersion and identityEpochId |
| `E11` | `P1 -> P5` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` | externally pinned bundle/pin/command schemas only |
| `E17` | `P5 -> P7` | `freshControlClaim() -> InterfaceClaim<FreshControlAuthority>` | membership/root/executor/chronology/leaves and budget |
| `E23` | `P5 -> P6` | `bundleRunValidation(input: P5ValidationInput) -> OwnerValidationReceipt<P5>` | reachable bundle/control leaf; typed raw-root outcome |
| `E24` | `P5 -> P3` | `candidateRun(row: RowIdentity) -> CandidateRunReceipt` | owner-executed candidate bytes sealed before control exposure |
| `E25` | `P5 -> P4` | `candidateRun(row: RowIdentity) -> CandidateRunReceipt` | owner-executed candidate events sealed before control exposure |

No other edge exists. No self-hashed outer bundle, evidence-authored output,
shared executor, control-copy capability, hidden evaluator, reparse, callback
outside P5, fallback, CSS grammar, or Fourier edge is permitted.
