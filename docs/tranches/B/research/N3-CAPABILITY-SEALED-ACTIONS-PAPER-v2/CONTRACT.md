# N3 capability-sealed actions — paper v2

Date: 2026-08-02

Status: **PAPER_V2_RED — TWO FRESH REVIEWS REQUIRED — ZERO CREDIT — UNDISPATCHED**

## Frozen v1 and terminal review intake

- v1 commit: `e9cff12182dd55bf03561c2d0beed7c1cdceb534`;
- v1 tree: `5e26faa265776d22d1fe50bff9c91affb2320a6f`;
- v1 manifest: `a009507b20b7385ccf473b2e06f33de89be8488cb2f804422907fa30e46c4ed6`;
- Review A and Review B: `TERMINAL AMEND/RED`;
- v1 mutation/reseal and retrospective credit: `FORBIDDEN / 0`.

V1's four descriptive classes, narrow prior-art ruling, executor separation,
unique row IDs/codes, and historical `227` arithmetic remain KEEP. V1's reuse
implication, caller-ledger bridge, H08 refusal, derivation root, epoch timing,
and non-replayable matrix remain negative evidence only.

N2 v5 is a separate committed transaction. N3 v2 neither edits nor gains
credit from N2.

## Narrow local hypothesis and prior art

World novelty remains rejected. Typed closure conversion, proof-carrying code,
object capabilities, and effect-aware parser verification already establish
adjacent code/environment, host-policy, authority, and effect principles. The
only retained local hypothesis is that a production-derived action/effect
capsule plus an atomic epoch lease can serve as a shared safety oracle for
parse-that incremental reuse, existing-source proof-carrying AOT, and caller-
bounded lane cohorting without merging their executors.

## Descriptive class is not reuse eligibility

Production derives exactly the same four descriptive action classes:

| Class | Description |
|---|---|
| `PURE` | no source or external effect capability in the authenticated closure |
| `BOUNDED_SOURCE_READER` | otherwise pure with an exact finite UTF-16 read footprint |
| `DETERMINISTIC_EFFECTFUL` | permitted deterministic effects with exact order and identity laws |
| `OPAQUE` | any closure, source read, effect, environment, identity, or topology obligation is unproved |

Class alone never authorizes result reuse. `PURE` may allocate a fresh object or
throw a fresh exception on every call. The per-artifact production decision is
exactly one of:

| Reuse mode | Meaning |
|---|---|
| `SAME_RESULT_IDENTITY_ALLOWED` | returning the already produced result/exception identity is observationally permitted by both identity laws |
| `REEXECUTE_ACTION_REQUIRED` | parse/memo/recognition work may be reused, but the action must run exactly once to produce fresh result/exception/effects before commit |
| `REFUSE_REUSE` | neither action result nor action-adjacent optimized work may be reused under this capsule |

N3 supplies no rematerializer, action runner, memo executor, AOT executor, lane
scheduler, or commit path. A consumer owning `REEXECUTE_ACTION_REQUIRED` must
invoke its own authenticated action exactly once under the lease.

## Result and exception identity laws

```text
ResultIdentityLaw = {resultTypeRoot,primitiveValueLaw,objectIdentityLaw,
 allocationMultiplicity,aliasGraphLaw,lifetimeLaw,prototypeDescriptorLaw,
 freezeLaw,inputCaptureAliasLaw,observableEqualityRoot}
ExceptionIdentityLaw = {throwCardinality,constructorRoot,prototypeRoot,
 nameMessageCauseLaw,payloadGraphLaw,allocationMultiplicity,identityLaw,
 stackObservationLaw,lifetimeLaw,observableEqualityRoot}
```

The typed observable comparator preserves prototypes, descriptors, symbols,
holes, `undefined`, `-0`, NaN/infinities, typed arrays, cycles, alias bijection,
fresh/retained identity, exception identity, and lifetime. JSON, digest, or
enumerable-only equality is insufficient.

Two mandatory hostiles are load-bearing:

```text
fresh result:    () => ({})
fresh exception: () => { throw new Error("fresh") }
```

For two calls under an unchanged capsule, result objects `R1 !== R2` and error
objects `E1 !== E2`. Replaying `R1` or `E1` for call two violates identity and
lifetime even though the action body is deterministic. Both rows require
`REEXECUTE_ACTION_REQUIRED`; parse/memo work may remain reusable only if its
own consumer law permits it.

## Production-owned live capture bridge

Caller ledgers and hashes are never sufficient. A future production-owned
instrumented action factory performs AST closure conversion before the action
becomes eligible:

1. authenticate module bytes and AST/toolchain pins;
2. rewrite every free binding to an explicit wrapper-owned capture slot;
3. resolve transitively imported bindings to authenticated module/export
   slots;
4. observe immutable captured values and unforgeable mutable object identities
   through wrapper-owned slots;
5. derive module, environment, capability, and mutable-epoch ledgers from
   those observed slots; and
6. seal the wrapper/action association so a capsule cannot be applied to a
   different live closure.

Uninstrumented functions, native functions, dynamic import, `eval`/`Function`,
proxy-mediated capture, and unresolved closures classify `OPAQUE` and receive
`REFUSE_REUSE`. The caller cannot provide a replacement ledger or assert that
an opaque action is pure.

The future transformer, AST parser, closure-conversion bridge, capture-slot
runtime, module/environment observer, capsule deriver, epoch lease, and audit
adapter are all charged executable work. No role may be excluded as generated,
tooling, owner-side, test-only, or external. Their actual bytes/LOC are absent,
so source readiness and budget credit remain RED; no source is authorized.

## Legitimate closure distinction

For `factory = x => () => x`, `factory(1)` and `factory(2)` have identical
action body source but distinct wrapper-owned capture slots and
`captureClosureRoot`s. Both may derive valid, distinct capsule IDs. This is a
positive control, not a refusal. A separate hostile applies closure A's capsule
to closure B; the sealed wrapper/action/capture association must return
`REFUSE_REUSE`.

## Closed capsule schema and noncircular roots

```text
CapabilityCapsuleFields = {
 capsuleVersion,actionClass,resultIdentityLawRoot,exceptionIdentityLawRoot,
 reuseDecision,inputTypeRoot,outputTypeRoot,bodyAstRoot,importClosureRoot,
 captureClosureRoot,mutableIdentityEpochRoot,capabilitySetRoot,
 sourceReadLawRoot,effectLawRoot,effectOrderRoot,environmentEpochRoot,
 allocationAliasingLawRoot,returnedParserTopologyRoot,
 wrapperActionAssociationRoot,derivationToolchainRoot
}

productionDerivationRoot = SHA256(
 "parse-that:N3:production-derivation:v2\0" ||
 canonical(CapabilityCapsuleFields)
)

capsuleId = SHA256(
 "parse-that:N3:capability-capsule:v2\0" || productionDerivationRoot
)

CapabilityCapsule = CapabilityCapsuleFields +
 {productionDerivationRoot,capsuleId}
```

Neither `productionDerivationRoot` nor `capsuleId` appears inside
`CapabilityCapsuleFields`. The root binds every derived field exactly once;
the capsule ID is derived only afterward. A self-reference, caller root,
omitted field, duplicate field, unknown field, or alternate formula is RED.

Composite formulas are closed:

- `inputTypeRoot` and `outputTypeRoot` hash authenticated closed type graphs;
- `effectLawRoot` hashes permitted capability operations, exact event and
  exception laws, and callback identities;
- `effectOrderRoot` hashes the total/partial order, cardinalities, and
  caller-order constraints for those events;
- `returnedParserTopologyRoot` hashes authenticated parser-node identities,
  finite branch/recursion edges, allocation multiplicity, and topology epoch;
- `allocationAliasingLawRoot` hashes result/exception allocation and graph
  identity laws; and
- every component root is independently recomputed from authenticated bytes.

No undeclared `effectLawRoot`, `effectOrderRoot`, `typeRoots`, or topology root
may appear only in an integration receipt.

## Atomic epoch lease

Validation and use are one production-owned transaction:

```text
EpochLease = {leaseId,capsuleId,orderedIdentityEpochs,sourceVersion,
 acquiredGeneration,leaseRoot,exclusiveCommitAuthority}
leaseRoot = SHA256("parse-that:N3:epoch-lease:v2\0" || capsuleId ||
                   canonical(orderedIdentityEpochs) || sourceVersion ||
                   acquiredGeneration)
```

The owner acquires a lease over every mutable capture, module, environment,
capability, topology, and source epoch; validates the capsule; derives the
reuse decision; lets the consumer either reuse or reexecute its action; checks
the same epochs again; and commits while the lease remains held. Mutation
between validation and decision, during reexecution, or before commit aborts
the lease and invalidates the result. A caller token, optimistic check without
commit authority, or validate-then-use gap is RED.

## Exact controls and arithmetic

`CONTROL-MATRIX.json` is the sole row authority. It has exactly `31` rows:
`29 MATERIAL` and `2 POSITIVE_CONTROL`. Each row machine-binds target,
canonical before/after, operation, injector, unique leaf and predicate IDs,
unique code, expected outcome, disabled leaf, owner bypass, every nonowner
retention, and control-of-control.

The five caller-authority mutations are separate rows: action class, action
hash, environment hash, capability truth, and reuse eligibility. The six opaque
bridge failures are also separate: uninstrumented, native, dynamic import,
eval/Function, proxy capture, and unresolved closure. No OR-row exists.

Only MATERIAL rows participate in suppression controls. With `N=29`:

```text
matrix production rows   = 31
owner suppressions       = 29
nonowner retentions      = 29 * 28 = 812
mutation erasures        = 29
unknown owner            = 1
duplicate row ID         = 1
total future receipts    = 903
```

The same production predicate body identity is used for baseline, mutation,
owner suppression, nonowner retention, erasure, unknown, and duplicate.
Production accepts no suppression or expected code; an audit-only wrapper may
disable exactly one private leaf. Mutants contain no expected outcome.

## Typed oracle edges; executors stay separate

All edges are paper-only dependencies, not APIs or consumed credit:

| Edge | Consumer | Receipt | Separation law |
|---|---|---|---|
| `N3v2-E01` | N2 P0 | `CapabilityEpochReceipt{capsuleId,environmentEpochRoot,mutableIdentityEpochRoot,leasePolicyRoot}` | N2 owns version/edit/memo execution and must separately accept this pending receipt. |
| `N3v2-E02` | N2 P4 | `ActionEffectAuthority{capsuleId,effectLawRoot,effectOrderRoot,exceptionIdentityLawRoot}` | N2/P5 invokes callbacks; N3 never invokes or replays them. |
| `N3v2-E03` | N2 P6 | `CapabilityValidationReceipt{rowId,leafId,predicateId,code,outcome,beforeRoot,afterRoot}` | N2 may aggregate only after its own owner ruling; it cannot copy N3 predicates. |
| `N3v2-E04` | existing-source proof-carrying AOT | `ActionClosureAuthority{capsuleId,bodyAstRoot,importClosureRoot,inputTypeRoot,outputTypeRoot,capabilitySetRoot,returnedParserTopologyRoot,reuseDecision}` | AOT owns translation, normalization, emission, artifact, and executor. |
| `N3v2-E05` | caller-bounded lane cohorting | `LaneActionAuthority{capsuleId,reuseDecision,effectOrderRoot,returnedParserTopologyRoot,leasePolicyRoot}` | N-CBLC owns cohort/scheduler/runtime and must preserve its dynamic-chain/effect laws. |

N2, AOT, and N-CBLC executors, state, caches, schedulers, callbacks, and commit
paths remain disjoint. N3 provides authority receipts only. Value remains sole
owner of CSS grammar/actions/consumer/UI/public behavior. N3 contains no CSS
grammar and no direct or indirect parser→Fourier edge.

## Review and credit boundary

V2 remains `PAPER_V2_RED` until two separately authorized fresh non-author
reviews verify the exact three-file packet, capture bridge, identity laws,
root formulas, epoch transaction, matrix/prose arithmetic, integration
composites, and executor separation. This turn dispatches no review.

No source, transformer, AST tool, prototype, parser, Node, test, build,
benchmark, product, CSS, package, law, release, rebind, or Fourier work is
authorized or credited. Review disagreement remains RED and cannot self-open
v3 or implementation.

## Terminal receipt

- descriptive action classes: `4`;
- reuse modes: `3`;
- machine rows: `31 = 29 material + 2 positive`;
- future control receipts: `903`;
- typed oracle edges: `5 paper-only / 0 consumed`;
- fresh reviews: `0/2`;
- source/execution/dispatch: `NONE`;
- all downstream credit: `0`.
