# N3 capability-sealed actions — paper v5

Status: **PAPER RED / ZERO CREDIT / TWO FRESH REVIEWS REQUIRED**

N3-v5 freezes v4 as immutable negative evidence and repairs its split authority
without executing any source. The credible local hypothesis remains narrow:
production-derived action/effect authority is a shared safety prerequisite for
incremental reuse, existing-source AOT, and caller-bounded lane cohorting.
World novelty is rejected, and executor topologies remain separate.

## Canonical authority

All authoritative roots use length-prefixed binary hashing:
`H(domain, fields) = SHA256(u32be(|domain|) || domain || u32be(|fields|) ||
each(u32be(|field|) || field))`. JSON ordering is never authority. Every rooted
type has one exact field list, byte-identical to its typed schema.

`LeaseGrantMessageV5` is unsigned. Its root binds the exact lease root and ID,
ledger predecessor/version, holder, exclusive commit authority, lease policy,
issuer authority, and grant sequence. `LeaseGrantReceiptV5` carries the
external issuer signature and is not part of the message root.

`CommitMessageV5` is likewise unsigned. It binds the lease, attempt, derived
reuse decision, result/exception/effect identities, terminal state, predecessor,
commit sequence, ledger transition, and exclusive authority.
`CommitReceiptV5` carries the external commit signature outside that root.
The concrete OPEN→HELD and FINISHED→COMMITTED transitions bind leaseRoot and
leaseId, exact before/after ledger roots, and exact CAS expected/observed roots.

The issuer key, rotation policy, revocation policy, and public key are pinned by
an owner-validator argument that submitted evidence cannot supply or override.

## Derived behavior and effects

The concrete `ActionDefinitionV5` authenticates action AST bytes, transitive
imports, types, captures, capabilities, identity laws, effect/reuse policies,
and returned-parser topology policy. `BehaviorDerivationReceiptV5` binds the
classifier source bytes and derives the action class from that definition.
Callers cannot submit behavior class.

`EffectTraceV5` binds ordered, lease-qualified effect records and exact
contiguity. `EffectStatusDerivationReceiptV5` binds its classifier bytes and
derives mediation status and effect count from the authenticated trace. Callers
cannot submit effect status. `ReuseDecisionV5` consumes both derivation roots,
raw typed result/exception bytes and identities, closure identity, and all
policies; its mode is derived, not stored as caller truth.

## Controls

The sole machine matrix contains:

- 51 material and three positive rows;
- 102 concrete before/after production instances;
- 51 self-contained proposed predicate/injector modules;
- 51 full function identities over exact module and function bytes;
- 51 schema-valid suppression/control-of-control receipts;
- all 2,550 ordered material-control × nonowner full-function-identity pairs;
- concrete issuer, policies, action, lease, three ledger versions, two
  transitions, attempt, effect, reuse, grant, commit, and signed receipt objects;
- five concrete, reconstructable integration receipt instances.

Each material predicate consumes a target-valid
`ControlProductionInstanceV5`. Owner suppression and control-of-control retain
the byte-identical mutant root and disable only the exact owning full function
identity. Production has no suppression argument. Nonowner pair roots contain
the complete function-identity root, never only rowId or leafId.

The future denominator is mechanically 51 baseline + 3 positive + 51 owner
reject + 51 combined owner-suppression/control-of-control + 2,550 nonowner +
51 exact no-op + one unknown + one duplicate = **2,759**.

## Boundary

This packet is paper-only and born RED. It authorizes no source, Node/AST tool,
prototype, benchmark, parser, CSS grammar, product, package, release, rebind, or
law credit. Value remains sole CSS grammar/consumer/UI owner. N3 introduces no
direct Fourier edge and does not merge N2, AOT, or CBLC executors. Two fresh
non-author reviews are required and are not dispatched by this packet.
