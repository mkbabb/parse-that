# N3 capability-sealed actions — paper v4

Date: 2026-08-02

Status: **PAPER_V4_RED — TWO FRESH REVIEWS REQUIRED — ZERO CREDIT — UNDISPATCHED**

## Frozen v3 terminal intake

- commit/tree: `060a724c017678569e994558cbbf9d7beaf2b309` /
  `99b9290d5b5f02417f275c82a77649029a8a3a57`;
- contract: `0bb020673f9f023759fec744b28a3a6ba029c1abf9694d7242fb8b0b7c80f23c`;
- control matrix: `ee1d3f4ac2e9c5a25a6f8cc63ba736794ebad4021c2fd507bab259f9711ae8ad`;
- manifest: `ca3f291ca01ac816d4fe30e8f6cd2b81d4e410f50eb2844169ce54ac20424a09`.

Both reviews are terminal AMEND/RED on
`LEASE_POLICY_AUTHORITY_NOT_SEALED`: v3 controlled `leasePolicyRoot` but omitted
it from the signed lease root. V3 remains immutable negative evidence. Its
length-prefix law, 51+3 control census, 2,550 explicit nonowner pairs and
2,759-receipt arithmetic remain KEEP; nothing receives retrospective credit.

`CONTROL-MATRIX.json` is the sole machine authority. Prose cannot introduce a
field, rule, receipt, source byte, root, control, or integration edge.

## Binary root closure

All roots use schema-ordered length-prefixed fields:

```text
H(domain, fields) = SHA256(
 u32be(len(domain)) || domain || u32be(fieldCount) ||
 each(u32be(len(field)) || field)
)
```

JSON order, labels, delimiter concatenation, caller serialization, or unordered
sets have no authority. V4 machine-defines typed canonical schemas and formulas
for `ActionDefinitionV4`, `AttemptV4`, `EffectRecordV4`, `EffectTraceV4`,
`ReuseDecisionV4`, `LedgerVersionV4`, `LedgerTransitionV4`, `CommitV4`,
`IssuerKeyAuthorityV4`, and `SuppressionReceiptV4`.

The lease field order now includes every authority-bearing field, including
`leasePolicyRoot`:

```text
schemaVersion, actionDefinitionRoot, normalizedInputRoot,
authenticatedBundleRoot, closureIdentity, behaviorIdentity,
leasePolicyRoot, effectPolicyRoot, reusePolicyRoot, epoch, leaseId,
holderAuthorityRoot, exclusiveCommitAuthorityRoot, predecessorStateRoot,
acquireSequence, expiryGeneration, commitGenerationDomain
```

Omission, substitution, reordering, duplication, or an alternate root formula
changes `leaseRoot` and is separately attributable. The ledger version and
transition schemas bind before/after roots, states, lease, holder/commit
authorities, sequence, expected/observed CAS versions, and issuer signature.
The OPEN→HELD→RUNNING→FINISHED→COMMITTED/ABORTED state law remains atomic and
single-use; terminal states cannot replay.

## Issuer and commit authority

The matrix pins an ED25519 issuer identity, exact public-key bytes/hash,
valid-from sequence, rotation predecessor, rotation policy, revocation policy,
and post-revocation denial. The trusted pin lives outside submitted evidence.
`N3V4-H35` substitutes the key ID and bytes while keeping the rest of the
envelope stable; `leafIssuerKeyAuthority` owns
`N3_ISSUER_KEY_AUTHORITY_SUBSTITUTED`. Issuer labels or boolean trust assertions
are insufficient.

`CommitV4` binds lease, attempt, reuse decision, raw result/exception identity,
effect identity, terminal state, predecessor commit, sequence, exact ledger
transition, and commit-authority signature. A commit cannot be authored by an
evidence row or inferred from a state label.

## Raw attempt, effects, and reuse decision

`ActionDefinitionV4` binds authenticated action AST bytes, import closure,
types, capture schema, capabilities, read law, identity laws, policies, and
topology policy. `AttemptV4` binds raw normalized input bytes/hash/root,
authenticated bundle members/root, closure and behavior identity, lease,
sequence, and capabilities.

Every mediated effect is an `EffectRecordV4` keyed by exact
`(leaseId,effectSequence)`. `EffectTraceV4` requires sequence zero, contiguous
ordinals, exact count, no duplicate/gap, and exact record lease. Insert,
delete, reorder, or direct/unmediated effect has its own material control.

The one production reuse predicate consumes authenticated raw result bytes and
hash, typed result identity, raw exception bytes and hash, typed exception
identity, the exact effect trace and mediation status, closure identity, and
both identity/effect/reuse policies. It derives exactly one declared mode:

- `REFUSE_REUSE` for opaque, unknown, unmediated, or any effectful attempt;
- `SAME_RESULT_IDENTITY_ALLOWED` only for a pure result or pinned pure exception
  whose replay identity law is proved;
- `REEXECUTE_ACTION_REQUIRED` for otherwise safe pure result/exception work;
- bounded source readers first prove their full read footprint, then apply the
  same result/exception rules.

The caller supplies no class, hash, capability truth, effect truth, or reuse
bit. `N3V4-H42` rejects a resealed decision.

## Same-value distinct wrappers

Positive controls `N3V4-P01/P02` bind exact fixture bytes and hashes for two
instrumented wrappers with identical factory body and captured value `1`, but
different wrapper nonces. Their wrapper identity roots are derived from those
bytes and differ. Closure and capsule identities must therefore differ even
though the observable value is equal; cross-application refuses reuse.
`N3V4-P03` is the exact byte no-op.

## Proposed leaf bytes and suppression receipts

Every material row carries exact proposed injector and predicate source bytes,
SHA-256, entry function, full leaf identity, and a typed
`N3SuppressionReceiptV4` proposal. These bytes are paper fixtures, not executed
or authorized production source. The audit wrapper removes the exact same
leaf body; production has no suppression parameter. Owner bypass,
control-of-control, and all nonowner receipts bind that identity.

All `51 × 50 = 2,550` nonowner pairs remain explicitly enumerated and sorted.
Their v4 root is
`4d056c1d3c152fb5f9eadbbd904f298d05bc8e5d1c834e6d8b24d4f3640d76b2`.
The future denominator remains 2,759 receipts.

## Reconstructable integrations

Five integration schemas now define typed length-prefixed fields and root
formulas rather than name arrays. Receipts carry raw member descriptors/bytes,
source pins, issuer authority, ledger transitions, attempt/capabilities,
ordered effects, raw result/exception, reuse decision, commit/signatures, and
full leaf identities as applicable. Each edge exact-binds receipt schema root,
producer, consumer, cardinality, order, transport, before/after roots, owner,
and code, and declares raw reconstruction mandatory.

N2 P0/P4/P6, existing-source AOT, and N-CBLC remain separate consumers. N3
does not merge or supply their executors. Value retains sole CSS grammar,
consumer, and UI ownership. There is no direct Fourier edge.

## Boundary

World novelty remains rejected. Caller truth, unresolved/native/dynamic/proxy
closures, PID/environment provenance, general closure equivalence, direct
effects, ledger atomicity, key rotation/revocation, and crash recovery remain
born RED until future executable evidence. Actual source bytes/LOC are absent;
the exact proposed control snippets grant no source credit.

Two fresh independent reviews are required and undispatched. No parser, AST
tool, prototype, benchmark, product, CSS, package, release, rebind, or law
execution is authorized. Every credit dimension remains zero.
