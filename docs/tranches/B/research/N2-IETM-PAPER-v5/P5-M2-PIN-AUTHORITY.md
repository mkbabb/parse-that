# P5 — pre-run input authority and post-run observation seals

Status: `PAPER_V5_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 85 charged LOC`.

P5 owns the only candidate/control spawn authority, callback invocation,
actual-byte capture, capability/freshness observation, and run seal. It has two
strictly separated authority phases. No root includes future bytes.

## Phase A — immutable pre-run input/executor authority

P5 consumes the E26 `ExperimentSelectionReceipt`. For each role it accepts an
external owner pin fixed before spawn over exactly these existing inputs:

```text
InputDescriptor = {ordinal,blobId,kind,encoding,size,sha256}
InputKinds = [source,fixture,artifact,executor,harness,runtime,toolchain,
              environmentDeclaration,capabilityDeclaration]
ExecutablePin = {path,realpath,device,inode,mode,size,mtimeNs,sha256}
InputAuthorityPin = {role,rowId,selectionHash,sourceVersion,identityEpochId,
 inputMembershipBytes,inputMembershipRoot,executablePin,boundedEnvKeys,
 capabilitySurfaceIds,externalPinHash,immutable}
```

`inputMembershipRoot` hashes exactly nine descriptor↔blob pairs plus role,
selection, and executable pin. The pin contains no PID, timestamp, command
observation, stdout, stderr, result, product, effect, provenance, freshness
observation, or post-run root. It cannot predict or reserve output bytes.

Candidate and control use independent pins, artifacts, executors, harnesses,
environment declarations, and output roots. Shared source/fixture/runtime/
toolchain bytes are allowed only as separately listed descriptors with equal
hashes. An input pin cannot name the other role's observations.

## Production-derived invocation authority

Before spawn, P5 derives rather than accepts:

```text
InvocationAuthority = {invocationAuthorityId,artifactAstRoot,
 transitiveImportRoot,actionBodyRoot,callbackClosureRoot,captureGraphRoot,
 mutableIdentityEpochRoot,environmentClosureRoot,capabilityClosureRoot,
 exceptionLawRoot,allocationAliasingRoot,returnedParserTopologyRoot,
 derivationToolchainRoot}
```

The derivation walks the authenticated artifact/executor/harness blobs,
resolved imports, free bindings, captured values and mutable identities,
bounded environment declaration, and capability declaration. A caller
`actionHash`, `callbackHash`, `environmentHash`, action class, or capability
claim is never authority. Any unresolved dynamic import, capture, environment
read, callback, capability, or topology is fail-closed.

N3 may later supply a typed `CapabilityCapsuleReceipt` only after a separate
owner acceptance. In v5 its dependency state is `PENDING / NOT CONSUMED`; the
local P5 authority cannot claim N3 review or replace its future predicates.

## Phase B — exactly-once execution and actual observation

For candidate, chronology is:

1. E26 selection and candidate input pin seal;
2. declared freshness/capability surfaces snapshot before spawn;
3. candidate spawns exactly once;
4. command, raw spawn receipt, stdout/stderr, result/product/effects/
   provenance, invocation authority, and after snapshot are captured;
5. actual observation membership and seal are derived from those bytes;
6. candidate seal becomes immutable;
7. only then may the independent control input pin seal and control start;
8. control repeats steps 2–6 once; only then may P3/P4 receive both seals.

No retry, repair, placeholder, prior hidden run, shared output root, output
copy, or caller-authored observation is legal.

## Full command capture

```text
CommandCapture = {executablePath,executableRealpath,executableDevice,
 executableInode,executableMode,executableSize,executableMtimeNs,
 executableSha256,argv0,argc,argv[0..argc-1],cwd,boundedEnvSorted,
 pid,ppid,processStartNs,processEndNs,exitCode,signal,
 stdoutDescriptor,stderrDescriptor,rawSpawnReceiptDescriptor,
 runtimeDescriptor,toolchainDescriptor}
```

`argv0` is separately captured and equals the OS spawn receipt. `argv` order
and cardinality are exact. Exit code and signal are a closed exclusive union.
The executable stat/hash are rechecked immediately before and after spawn.
CommandCapture is produced after execution from the raw spawn receipt; no
pre-run command summary can substitute.

## Freshness and capability isolation

The pre-pin declares every reachable filesystem root/file, process-child
scope, network endpoint/namespace, file descriptor, environment key, callback,
and host capability. P5 records exact before/after snapshots:

```text
IsolationSnapshot = {filesystemEntries,processChildren,networkEndpoints,
 fileDescriptors,environmentValues,capabilityIdentities,outputRootState,
 observationTimeNs,snapshotRoot}
```

Candidate output root must be absent before spawn. Afterward, only the exact
declared observation files may exist; no undeclared process, socket, FD,
filesystem write, environment mutation, or capability access is permitted.
If any reachable surface cannot be measured, mapped to the declaration, or
observed with adequate authority, `validateFreshnessIsolation` or
`validateCapabilityIsolation` fails closed. Control cannot read candidate
outputs and candidate cannot precreate control state.

## Post-run observation membership and seal

Each role has exactly twelve actual observation blobs, ordered:

```text
commandCapture,rawSpawnReceipt,stdout,stderr,result,product,effects,
provenance,semanticEnvelope,invocationAuthority,freshnessBefore,freshnessAfter
```

`ObservationDescriptor={ordinal,blobId,kind,encoding,size,sha256}`. Descriptor
and blob are a bijection with no missing, extra, duplicate, orphan, alias, or
unused member.

```text
ObservationMembershipRoot = SHA256(canonical actual descriptors and hashes)
ObservationSealRoot = SHA256("parse-that:N2:observation:v5\0" || role ||
 selectionHash || InputAuthorityPin.externalPinHash || inputMembershipRoot ||
 ObservationMembershipRoot || chronologyOrdinal)
ObservationSeal = {role,rowId,selectionHash,inputPinRoot,
 observationMembershipBytes,observationMembershipRoot,observationSealRoot,
 descriptors[12],chronologyOrdinal,externalPostRunPin,immutable}
```

The owner issues `externalPostRunPin` only after recomputing actual sizes,
hashes, membership, root, command, and snapshots. Neither the pin nor seal is
known before execution. Candidate seal ordinal precedes control pre-pin.

## Ten P5 production leaves

| Leaf | Code |
|---|---|
| `validateRunRole` | `RUN_ROLE_MISMATCH` |
| `validateInputAuthorityPin` | `INPUT_AUTHORITY_PIN_MISMATCH` |
| `validateExecutorHarnessBinding` | `EXECUTOR_HARNESS_BINDING_MISMATCH` |
| `validateCommandCapture` | `COMMAND_CAPTURE_MISMATCH` |
| `validateRunChronology` | `RUN_CHRONOLOGY_MISMATCH` |
| `validateCapabilityIsolation` | `CAPABILITY_ISOLATION_MISMATCH` |
| `validateInvocationAuthority` | `INVOCATION_AUTHORITY_MISMATCH` |
| `validateFreshnessIsolation` | `FRESHNESS_ISOLATION_MISMATCH` |
| `validateObservationMembershipRoot` | `OBSERVATION_MEMBERSHIP_ROOT_MISMATCH` |
| `validatePostRunSeal` | `POST_RUN_SEAL_MISMATCH` |

Each is a separately reachable production leaf with one unique code and P6
control row. There is no aggregate shadow leaf or suppression parameter.

## Cross-interface edges

| Edge | Direction | Signature |
|---|---|---|
| `E05` | `P5 -> P3` | `freshControl(selection: ExperimentSelectionReceipt) -> ControlObservationSeal` |
| `E06` | `P5 -> P4` | `freshControl(selection: ExperimentSelectionReceipt) -> ControlObservationSeal` |
| `E11` | `P1 -> P5` | `decodeCanonical(bytes: CanonicalBytes) -> CanonicalValue` |
| `E17` | `P5 -> P7` | `runAuthorityClaim() -> InterfaceClaim<PrePinAndPostRunSeal>` |
| `E23` | `P5 -> P6` | `bundleRunValidation(input: P5ValidationInput) -> OwnerValidationReceipt<P5>` |
| `E24` | `P5 -> P3` | `candidateRun(selection: ExperimentSelectionReceipt) -> CandidateObservationSeal` |
| `E25` | `P5 -> P4` | `candidateRun(selection: ExperimentSelectionReceipt) -> CandidateObservationSeal` |
| `E26` | `P0 -> P5` | `selectExperiment(root: LedgerRoot) -> ExperimentSelectionReceipt` |

No other edge exists. No future-output pin, hidden prior run, caller output,
shared executor/root, callback outside P5, fallback, CSS grammar, or Fourier
edge is permitted.
