# N3 capability-sealed actions — paper v1

Date: 2026-08-02

Status: **PAPER_V1_SOURCE_RED — TWO FRESH REVIEWS REQUIRED — ZERO CREDIT — UNDISPATCHED**

## Scope and authority

This packet specifies one independent paper family. It does not amend or earn
credit for N2 IETM paper v4, N-DNF-BIR, N-CBLC, parser source, Value CSS,
packages, benchmarks, candidates, releases, or downstream work. It creates no
AST tool, capsule builder, prototype, executor, test, task, or evidence root.

The local hypothesis is deliberately narrower than world novelty:

> A production-derived action/effect authority is a common precondition for
> safe incremental reuse, proof-carrying AOT, and caller-bounded batching in
> parse-that's callback-rich surface.

Broad novelty is **rejected**. Typed closure conversion already treats code
and captured environment as one semantic object
([Minamide, Morrisett, and Harper, 1996](https://doi.org/10.1145/237721.237791));
proof-carrying code already separates untrusted producers from a host-owned
policy checker ([Necula, 1997](https://doi.org/10.1145/263699.263712)); object
capabilities already make held authority, not a caller label, decisive
([Miller et al., 2003](https://pdos.csail.mit.edu/6.828/2004/readings/miller03paradigm.pdf));
and Morpheus already exposes parser-combinator effects and data-dependent
semantic actions as verification obligations
([Mishra and Jagannathan, 2023](https://arxiv.org/abs/2305.07901)). None of
those sources proves this local parse-that integration or its products.

## Exactly four action classes

No fifth class, alias, `UNKNOWN`, caller override, or optimistic default exists.
The production derivation returns exactly one of:

| Class | Production-derived meaning | Optimization eligibility |
|---|---|---|
| `PURE` | The complete transitive closure has no source/environment/effect capability; result, exception, allocation, aliasing, and returned topology are deterministic under the sealed inputs and captures. | Complete result may be reused only while every capsule field and input identity remains valid. |
| `BOUNDED_SOURCE_READER` | The action is otherwise pure and may read only the authenticated UTF-16 source through a proved finite dependency footprint. | Result may be reused only after exact source-version relocation and footprint revalidation; an unbounded or hidden read makes the action `OPAQUE`. |
| `DETERMINISTIC_EFFECTFUL` | The sealed capability set permits deterministic effects with an exact caller-order event, exception, allocation, and alias contract. | Recognition/topology may be optimized, but the action must execute exactly once in the authorized order. A memo, compiler, or lane runtime may not skip, replay, duplicate, or reorder the effect. |
| `OPAQUE` | Any body, import, capture, capability, environment, exception, allocation, alias, source-read, or returned-topology obligation is absent, mutable without an authenticated epoch, dynamic, or unprovable. | Always correct through ordinary incumbent execution and **never reusable**. No cached result, emitted substitute, cohort shortcut, or inferred downgrade is legal. |

`OPAQUE` is fail-closed correctness, not a failure to parse. Production may
classify an action more conservatively than necessary; it may never upgrade an
action from evidence supplied by its caller.

Classification precedence is closed. Any unresolved obligation yields
`OPAQUE`; otherwise any permitted deterministic effect beyond source reads
yields `DETERMINISTIC_EFFECTFUL` (and retains any bounded-source obligation);
otherwise any source read yields `BOUNDED_SOURCE_READER`; otherwise the class
is `PURE`. No intersection class or caller-selected precedence exists.

## Production derivation and trust boundary

The owner-authenticated input is `ActionArtifactPin`, fixed outside submitted
evidence before derivation:

```text
ActionArtifactPin = {
  moduleBytes, moduleSha256, actionExportPath, bodyAstBytes, bodyAstSha256,
  importGraphBytes, importGraphSha256, typeGraphBytes, typeGraphSha256,
  captureLedgerBytes, captureLedgerSha256, capabilityPolicyBytes,
  capabilityPolicySha256, environmentLedgerBytes, environmentLedgerSha256,
  topologySchemaBytes, topologySchemaSha256, toolchainBytes, toolchainSha256
}
```

The future production deriver—not the action, parser, caller, benchmark, or
evidence packet—must authenticate bytes, decode one closed schema, walk the
action-body AST and transitive imports, resolve every free binding, and derive
one immutable `CapabilityCapsule`:

```text
CapabilityCapsule = {
  capsuleVersion, capsuleId, actionClass,
  bodyAstRoot, importClosureRoot, inputTypeRoot, outputTypeRoot,
  captureClosureRoot, mutableIdentityEpochRoot,
  capabilitySetRoot, sourceReadLawRoot, exceptionLawRoot,
  allocationAliasingLawRoot, environmentEpochRoot,
  returnedParserTopologyRoot, productionDerivationRoot
}

capsuleId = SHA256("parse-that:N3:capability-capsule:v1\0" ||
                   canonical(CapabilityCapsule without capsuleId))
```

Every field is mandatory and singular. Duplicate keys, omitted fields,
unknown fields, caller-computed roots, caller-supplied `actionHash`,
`environmentHash`, capability truth, action class, or eligibility are RED.
Function object identity and `Function.prototype.toString()` may be recorded
as observations but are never authority and never sufficient.

### Body, imports, types, and captures

- `bodyAstRoot` binds the authenticated parsed body, binding resolution, free
  identifiers, syntactic capabilities, dynamic constructs, and source range.
- `importClosureRoot` binds every transitively reachable module/file/export
  byte hash and rejects unresolved, conditional, dynamic, or drifting imports.
- input/output type roots bind closed constructors, prototypes, descriptors,
  symbols, nullable/exceptional branches, and graph identity requirements;
  erased TypeScript names alone are insufficient.
- immutable captures bind canonical typed graph bytes. Mutable captures bind
  unforgeable object identity, prototype/descriptors, alias graph, and an
  owner-issued mutation epoch. If an identity or epoch cannot be observed by
  the owner, the action is `OPAQUE`.
- two closures with identical source but different captures receive different
  capsule IDs. Two function objects with equivalent sealed closures may share
  eligibility only after structural capsule equality, never by function or
  source-text equality.

### Capabilities, exceptions, allocation, and environment

The capability policy is an owner pin and a closed allowlist. Reads of clock,
randomness, process/environment, module/global mutable state, DOM, filesystem,
network, reflection, dynamic import, `eval`, `Function`, weak reachability, or
host callbacks are forbidden unless the exact capability, object identity,
operation, order, and epoch appear in the sealed class law. Widening is RED.

The exception law binds success/throw alternatives; exact constructor and
prototype; name, message, cause, descriptors, and payload graph; and whether
allocation is fresh on each invocation. The allocation/aliasing law binds
fresh versus retained objects, prototypes, own string/symbol keys,
descriptors, holes, typed arrays, cycles, left/right alias bijection, returned
references to inputs/captures, freezing, and lifetime. A digest or JSON value
comparison cannot substitute.

The environment ledger assigns owner-issued epochs to every permitted mutable
identity. Any capture, module, capability, environment, prototype, descriptor,
exception, allocation, or topology epoch change invalidates the capsule before
reuse. A stale or incomparable epoch is never repaired by a caller hash.

### Returned-parser topology

`returnedParserTopologyRoot` binds `chain`, `lazy`, callback-produced parser
objects, branch identity, recursion knots, construction multiplicity, and the
finite versus data-dependent topology law. If returned topology cannot be
closed from authenticated artifacts and captures, the action is `OPAQUE`.
N3 never creates, schedules, interprets, batches, memoizes, compiles, or calls
that topology.

## Structural equality and canonical bytes

`CONTROL-MATRIX.json` is decoded by one future strict production codec that
rejects duplicate keys, unknown keys, invalid UTF-8/Unicode scalars,
noncanonical escapes, non-safe integers, and trailing bytes. Structural JSON
equality requires identical JSON types; exact object key sets independent of
serialization order; ordered arrays; Unicode-scalar string equality; and
mathematical safe-integer equality. Decode followed by canonical encode must
be byte-stable. Stringification, digest-only comparison, key-order-only
comparison, or JavaScript coercion is RED.

The matrix is the sole paper row authority. Its action class set is exactly
four; its row IDs, families, owner predicate IDs, and codes are each globally
unique. Its recorded denominators must recompute from the rows and control law
or the packet is RED.

## Exact hostile and control law

The matrix contains `15` production rows: `14` material hostile families and
one no-op control. Expected dispositions are `9 INVALIDATE_CAPSULE`,
`5 REFUSE_CAPSULE`, and `1 ACCEPT_NO_CHANGE`.

`REFUSE_CAPSULE` refuses optimization authority and routes the action to
ordinary `OPAQUE` incumbent execution; it never refuses parsing.
`INVALIDATE_CAPSULE` discards the prior seal and requires owner derivation
against the new epoch, falling back to `OPAQUE` if closure cannot be proved.
`ACCEPT_NO_CHANGE` preserves the structurally identical class and capsule ID.

For each of the 14 material rows, the later same production predicate path
must produce:

1. one ordinary owner rejection/invalidation receipt;
2. one owner-predicate suppression receipt that exposes that exact defect;
3. thirteen non-owner-retention receipts, each byte-identical at the retained
   predicate while only the owner may lose the defect; and
4. one mutation-erasure receipt that returns to the no-op structural product.

Unknown owner and duplicate row-ID each contribute one terminal receipt. The
exact paper-derived denominator is therefore:

```text
matrix production rows  = 15
owner suppressions      = 14
non-owner retentions    = 14 * 13 = 182
mutation erasures       = 14
unknown owner           = 1
duplicate row ID        = 1
total future receipts   = 227
```

The production function accepts no suppression, expected code, case label, or
audit token. A separate audit wrapper may suppress exactly one private owner
predicate. The matrix carries expected outcomes for review; mutants never
carry their expected code. Baseline, hostiles, suppressions, non-owner
retentions, erasures, unknown, and duplicate all call the same internal
production derivation. Message matching, row-specific branches, a shadow
validator, or a self-certified result is RED.

## Oracle-only integration; executors remain separate

N3 exports only immutable authority receipts. These are future paper edges,
not APIs or amendments to frozen packets:

| Edge | Consumer | Receipt | Non-merger law |
|---|---|---|---|
| `N3-E01` | N2 P0 | `CapabilityEpochReceipt{sourceVersion,identityEpochId,capsuleId,environmentEpochRoot}` | P0 may bind an epoch to a capsule; N3 never owns version/edit/memo state. |
| `N3-E02` | N2 P4 | `ActionEffectAuthority{capsuleId,actionClass,effectLawRoot,exceptionLawRoot,allocationAliasingLawRoot}` | P4 may compare events; N3 never invokes or replays callbacks. |
| `N3-E03` | N2 P6 | `CapabilityValidationReceipt{rowId,ownerPredicateId,code,outcome,capsuleBefore,capsuleAfter}` | P6 may aggregate the production receipt; it may not copy N3 predicates or classify actions. |
| `N3-E04` | existing-source proof-carrying AOT (`TRANSLATE_EXISTING` arm) | `ActionClosureAuthority{capsuleId,bodyAstRoot,importClosureRoot,typeRoots,capabilitySetRoot,topologyRoot}` | AOT still owns source authority, normalization, emitter, artifact, and executor. No capsule embeds or becomes an AOT executor. |
| `N3-E05` | caller-bounded lane cohorting | `LaneActionAuthority{capsuleId,actionClass,effectOrderRoot,topologyRoot}` | N-CBLC still owns lane grouping/runtime and its corrected 46,176 equality denominator; N3 cannot regroup lanes or scalarize continuations. |

N2 IETM paper v4 remains byte-frozen and externally reviewed. A future owner
ruling would have to amend P0/P4/P6 explicitly; this packet grants no such
edge credit. N-DNF-BIR remains `AMEND/HOLD`: N3 may close only its action-
closure precondition and cannot choose translation authority, prove
normalization, emit source, or audit the artifact. N-CBLC remains
`AMEND/HOLD`, `0/2` consumers: N3 may classify action/effect eligibility but
cannot resolve the scheduler/scalar fork, dynamic continuation identity,
consumer deficit, or PL-BE law.

The three executors remain disjoint: N2 owns versioned transactional memo
execution; AOT owns its direct generated parser; N-CBLC owns one width-generic
lane runtime. No result cache, callback invocation, topology scheduler,
compiler, state container, control path, fallback, or benchmark harness is
shared through N3.

Value remains the sole owner of CSS grammar, CSS actions, CSS recovery,
consumer behavior, typed products, canonical inverses, UI, and public CSS
surface. Parse-that may validate a generic capsule over Value-supplied action
artifacts without acquiring CSS semantics. N3 contains no CSS grammar and no
direct or indirect parser-to-Fourier edge.

## Born-RED review and credit boundary

This packet is `PAPER_V1_SOURCE_RED` until two separately authorized fresh non-author
reviews independently verify the three file hashes, matrix structure and
arithmetic, four-class closure, production derivation, control ownership,
N2/AOT/N-CBLC non-merger, and zero-credit boundary. This turn dispatches no
review.

No prototype, AST tool, source, parser, Node, test, build, benchmark, package,
consumer, CSS, Browser, candidate, release, rebind, deletion, or law execution
is authorized. Paper/source/correctness/performance/product/law/release credit
is exactly zero. A review disagreement remains RED; it does not authorize a
repair packet or source attempt.

## Terminal receipt

- action classes: `4/4 paper-defined`;
- hostile/control rows: `15 = 14 material + 1 no-op`;
- future control receipts: `227`;
- N2/AOT/N-CBLC oracle edges: `5 paper-only / 0 consumed`;
- reviews: `0/2`;
- implementation/execution/dispatch: `NONE`;
- product, CSS, law, package, release, and downstream credit: `0`.
