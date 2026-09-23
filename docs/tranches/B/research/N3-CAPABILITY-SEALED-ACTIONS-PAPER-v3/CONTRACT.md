# N3 capability-sealed actions — paper v3

Date: 2026-08-02

Status: **PAPER_V3_RED — TWO FRESH REVIEWS REQUIRED — ZERO CREDIT — UNDISPATCHED**

## Frozen v2 and terminal reviews

- commit: `74535791e854a23403c33a4fa7147d90aefe4e3e`;
- tree: `bc4dc014a533b403fea12338df16f1b349da153a`;
- contract: `f256e5592c6a0afc6e431c0e773938f22a44be04b8ad1e8c24cd96e00c0544c9`;
- control matrix: `97196f2684705141d2a224e6c49b57e89b9f5c54cd42973d4c359d22737f1923`;
- manifest: `5876f1f9c4c248bbbe68839ad8c66e763a422e46f1123d42bf7a400b8db395f0`.

Both v2 reviews are terminal AMEND/RED on
`EPOCH_LEASE_AUTHORITY_FIELDS_UNBOUND`: the root omitted `leaseId` and
`exclusiveCommitAuthority`, and no control owned either field. Their
secondaries bind an undefined lease policy, a wrapper/value-confounded
positive control, compressed nonowner evidence, tuple-only integrations, and
a stored rather than derived reuse decision. V2 remains immutable negative
evidence and grants no retrospective credit.

## Scope and retained hypothesis

World novelty remains rejected. The narrow local hypothesis remains that a
production-derived action/effect authority can safely inform incremental
reuse, existing-source AOT, and caller-bounded lane cohorting without merging
their executors. This packet defines only a paper protocol. It adds no parser,
runtime, AST tool, transformer, executor, package, Value CSS grammar, consumer,
release, rebind, or Fourier edge.

`CONTROL-MATRIX.json` is the sole machine authority for ordered root fields,
state transitions, action classes, reuse rules, controls, full leaf
identities, explicit nonowner pairs, integration schemas/edges, denominators,
and born-RED risks. Prose references those machine declarations and cannot
override them.

## Length-prefixed binary authority

All roots use the matrix `H(domain, fields)` primitive. Domain and every field
are length-prefixed binary values in schema order. Object iteration order,
JSON property order, caller serialization, labels, delimiter concatenation,
and unordered sets have no authority.

The production action definition binds authenticated body AST, transitive
imports, input/output types, explicit closure-converted capture slots, mutable
object identities, permitted capabilities, source-read law, result/exception
identity laws, allocation/alias/lifetime law, environment epoch, effect law,
and returned-parser topology. An instrumented owner factory derives these
facts from live slots and pinned modules. Function identity or source text
alone is insufficient. Native, dynamic, proxy-mediated, `eval`/`Function`,
unresolved, or uninstrumented closures are `OPAQUE`.

## Descriptive class and derived reuse

The four descriptive classes remain `PURE`, `BOUNDED_SOURCE_READER`,
`DETERMINISTIC_EFFECTFUL`, and `OPAQUE`; classification alone grants nothing.
The only modes remain `SAME_RESULT_IDENTITY_ALLOWED`,
`REEXECUTE_ACTION_REQUIRED`, and `REFUSE_REUSE`.

One closed production predicate derives the mode from behavior class,
result-identity law, exception-identity law, effect epoch and mediation,
closure identity, and pinned reuse/effect policies. A caller cannot submit,
store, reseal, or override the decision.

- opaque, unknown, unmediated, or effectful behavior is `REFUSE_REUSE`;
- pure success is reusable only when replay preserves result identity and
  lifetime; otherwise the action must reexecute;
- pure exception is reusable only under a pinned exception replay policy;
  otherwise it must reexecute; and
- a bounded source reader first proves its complete read footprint, then
  follows the same identity rules.

`N3V3-H18/H19/H39/H47` own the fresh result, fresh exception, resealed decision,
and effectful-reuse failures. N3 supplies no rematerializing executor.

## Capsule, lease, attempt, and commit roots

The machine-declared lease field order is complete and exact. In notation:

```text
leaseRoot = H("parse-that:N3:epoch-lease:v3", [
 schemaVersion, actionDefinitionRoot, normalizedInputRoot,
 authenticatedBundleRoot, closureIdentity, behaviorIdentity,
 effectPolicyRoot, reusePolicyRoot, epoch, leaseId, holderAuthorityRoot,
 exclusiveCommitAuthorityRoot, predecessorStateRoot, acquireSequence,
 expiryGeneration, commitGenerationDomain
])
```

Authority roots identify independently pinned key material and ledger grants,
not labels. An owner signature over `leaseRoot` is outside the root and
exact-binds it. The issuer key and rotation policy are pinned outside submitted
evidence. Acquiring the grant and moving the ledger state are one atomic
transition.

Wall time has no authority. A pinned monotonic sequencer owns acquire, expiry,
attempt, and commit generations. The state machine is exactly:

```text
OPEN --CAS+signed grant--> HELD
HELD --holder/root validation--> RUNNING
RUNNING --mediated effects + raw outcome seal--> FINISHED
FINISHED --CAS exact lineage--> COMMITTED
HELD|RUNNING|FINISHED --abort--> ABORTED
```

`COMMITTED` and `ABORTED` are terminal. A stale, substituted, duplicated,
expired, raced, replayed, prematurely committed, or double-committed lease
fails its own control. Validation, derived decision, optional consumer-owned
reexecution, effect mediation, and commit occur under the same single-use
lease.

Every effect passes through the owner mediator and binds
`(leaseId, effectSequence)`. A direct or missing effect makes the attempt born
RED; it cannot be reconstructed by a later log. The commit root is:

```text
commitRoot = H("parse-that:N3:commit:v3", [
 leaseRoot, attemptRoot, resultIdentity, exceptionIdentity,
 effectIdentityRoot, terminalState, predecessorCommitRoot, commitSequence
])
```

The commit authority independently signs `commitRoot` after the exact
FINISHED→COMMITTED CAS. Result, exception, effect, terminal, predecessor, and
sequence identities are raw authenticated artifacts, not summaries.

## Exact controls and nonowner domain

The matrix has `51` MATERIAL controls and `3` POSITIVE controls. The positive
pair `N3V3-P01/P02` gives two wrapper-owned closures the same captured value
while requiring distinct wrapper/capsule identities; it does not confound
value drift. `N3V3-P03` is the exact byte-no-op.

Each material row binds target, exact before/after bytes, operation, injector,
full leaf function identity, predicate identity, unique code, owner bypass,
and control-of-control. Lease, holder, commit authority, lease/effect/reuse
policies, root formula, signatures, stale/expiry/replay/races, predecessor,
premature/double commit, behavior/bundle/input, fresh identities, effect
insert/delete/reorder, unmediated effect, and effectful reuse are separately
owned.

The file explicitly enumerates all `51 × 50 = 2,550` nonowner pairs, sorted by
row ID then leaf ID. Their binary root is
`32f11dc05755ef1f2bcab596e5944ba29de19773d44ce0e9efd1f6fa7af1d0c5`.
There is no `OTHER*_IDENTICAL`, wildcard, complement label, or count-only
substitute.

Derived future arithmetic is:

```text
material baselines      51
positive baselines       3
owner rejects            51
owner bypasses           51
nonowner retentions    2550
erasures/no-ops          51
unknown owner             1
duplicate row             1
total                  2759
```

Production accepts no suppression or expected code. An audit-only wrapper
removes the exact same leaf function identity; all explicitly named nonowners
retain their byte-identical bodies.

## Closed integration receipts

The matrix defines five full receipt schemas and five typed edges. Every
receipt carries source pins, raw member descriptors and bytes, grant/ledger
transitions, attempt envelope and capabilities where applicable, ordered raw
effects, raw result/exception, commit and signatures, and full production leaf
identities. Every edge names producer, consumer, schema, cardinality, order,
transport, before/after roots, owner, and failure code.

The consumers remain separate: N2 P0/P4/P6, existing-source AOT, and N-CBLC.
No integration receipt contributes an executor or merges those topologies.
Value retains the sole CSS grammar/consumer/UI authority. No direct Fourier
edge exists.

## Born-RED boundary

Caller-supplied lease/behavior/closure/effect/reuse truth, PID/environment
provenance, general closure equivalence, direct effects, unproved ledger
atomicity, key rotation, and crash recovery remain explicit born-RED risks.
Future executable bytes and charged LOC are `null`. Two fresh independent
reviews are required and remain undispatched.

This packet authorizes no source, prototype, AST execution, benchmark, parser
or consumer mutation, package, release, rebind, or credit. Its only terminal
state is `PAPER_V3_RED` pending those reviews.
