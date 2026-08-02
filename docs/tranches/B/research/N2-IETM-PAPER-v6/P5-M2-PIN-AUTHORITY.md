# P5 — immutable experiment plan and admitted actual observations

Status: `PAPER_V6_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 85 charged LOC`.

P5 owns the only candidate/control spawn, callback invocation, actual-byte
capture, isolation observation, and admission seals. Nothing pre-run predicts
an output, timestamp, PID, effect, product, or returned topology.

## Domain-separated input pin

`InputAuthorityPinCanonicalBytes` is the canonical encoding of every immutable
pre-run member:

```text
{schema,role,selectionReceipt,sourceVersion,identityEpochId,
 inputDescriptorsAndHashes,executablePath,executableRealpath,executableStat,
 executableSha256,harnessDescriptor,runtimeDescriptor,toolchainDescriptor,
 commandEnvelope,boundedEnvironmentKeyValues,capabilitySurfaceIds,
 filesystemBounds,processBounds,networkBounds,fileDescriptorBounds,
 staticReturnedTopologyConstraint,ownerId,signaturePolicy}
```

Input membership includes source, fixture, artifact, executor, harness,
runtime, toolchain, full command envelope, environment declaration, capability
declaration, and static topology policy. Environment keys and values and all
capability/bound sets are inside the canonical bytes, not adjacent metadata.

```text
inputPinRoot = SHA256("parse-that:N2:input-pin:v6\0" ||
                      InputAuthorityPinCanonicalBytes)
InputAdmissionReceipt = {schema,inputPinRoot,ownerId,keyId,algorithm,
 signatureBytes,issuedPlanOrdinal}
```

The signed receipt is outside the root but exact-binds it. There is no
`externalPinHash`. Signature verification uses an owner key pinned outside
submitted evidence.

## Complete pre-run command envelope

`CommandEnvelope` fixes executable path/realpath/device/inode/mode/size/mtime/
SHA, argv0 and ordered argv/cardinality, cwd, bounded environment keys+values,
runtime/toolchain, and all declared filesystem/process/network/FD/capability
bounds. It contains no actual PID, time, exit, signal, stdout, or stderr.

The post-run `CommandCapture` adds actual PID/PPID, start/end, exit-or-signal,
stdout/stderr descriptors, raw spawn receipt, and pre/post executable stat/hash.
Production exact-compares every intended field to actual capture.

## One immutable two-role ExperimentPlan

Before candidate starts, the owner admits both complete pins and commands:

```text
ExperimentPlanBytes = canonical({selectionReceipt,candidateInputPinRoot,
 candidateInputAdmissionReceipt,controlInputPinRoot,
 controlInputAdmissionReceipt,executionOrder:[candidate,control]})
experimentPlanRoot = SHA256("parse-that:N2:experiment-plan:v6\0" ||
                            ExperimentPlanBytes)
ExperimentPlanAdmissionReceipt = {experimentPlanRoot,ownerId,keyId,algorithm,
 signatureBytes,issuedOrdinal}
```

Candidate executes exactly once from the plan. Only after its admitted
observation seal may control execute exactly once from the already-fixed
control pin. No control field may adapt to candidate bytes. Shared immutable
inputs require distinct descriptors in both pins; observation roots are never
shared.

Pre-run topology contains only typed static constraints: allowed node kinds,
branch/recursion bounds, allocation policy, and topology schema hash. The
actual `returnedParserTopologyRoot` exists only in the post-run invocation-
authority observation.

## Actual observation seal and owner admission

Each role captures exactly: command, raw spawn receipt, stdout, stderr, result,
product, effects, provenance, semantic envelope, invocation authority including
actual returned topology, and before/after isolation snapshots.

```text
ObservationMembershipBytes = canonical(ordered actual descriptors)
observationMembershipRoot = SHA256(
 "parse-that:N2:observation-membership:v6\0" || ObservationMembershipBytes)
ObservationSealBytes = canonical({role,experimentPlanRoot,inputPinRoot,
 selectionHash,observationMembershipRoot,chronologyOrdinal})
observationSealRoot = SHA256("parse-that:N2:observation-seal:v6\0" ||
                             ObservationSealBytes)
ObservationAdmissionReceipt = {observationSealRoot,role,experimentPlanRoot,
 ownerId,keyId,algorithm,signatureBytes,admittedOrdinal}
```

The admission receipt is issued only after actual byte/root recomputation and
is outside but exact-binds the seal. It cannot detach, precede execution, or
bind another role/plan. Candidate admission precedes control spawn.

All declared filesystem/process/network/FD/capability surfaces receive exact
before/after observations. Unmeasured reachable surfaces, undeclared access,
non-absent output root, unexpected process/socket/FD/write, or control access
to candidate output fails closed.

P5 owns controls `C10–C19`. PAPER-READY derives their full leaf identities and
audit rebases. P5 participates in `E05/E06/E11/E17/E23/E24/E25/E26`. N3
capsules remain `PENDING_NOT_CONSUMED`; caller hashes/classes cannot replace
invoked-byte/capture derivation.

No hidden prior run, future-output pin, adaptive control, caller output,
shared executor/root, callback outside P5, fallback, CSS grammar, or Fourier
edge is permitted.
