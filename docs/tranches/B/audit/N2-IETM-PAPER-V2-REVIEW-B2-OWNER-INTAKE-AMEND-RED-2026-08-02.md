# N2 IETM paper v2 — Review B2 owner intake

Date: 2026-08-02

Status: **TERMINAL AMEND/RED — PAPER ONLY — ZERO CREDIT — B3 NOT DISPATCHED**

## Frozen input

- packet commit: `9605c077ac47bbcbc1cacb35a6d45a48f8105d2e`;
- packet root: `docs/tranches/B/research/N2-IETM-PAPER-v2/`;
- manifest SHA-256:
  `7252fb2696904638317ea0de60f7212264113f10d28d8a4782ada656364c5552`;
- manifest replay: `9/9 EXACT`;
- Review A2 owner-intake commit:
  `7f801e70c93503aa9efe3ada3b703a4cd9ad4996`;
- v2 mutation or reseal: `FORBIDDEN`;
- source, prototype, Node, parser, AST, test, build, benchmark, product,
  package, review dispatch, and N2e execution: `0`.

The v2 packet remains immutable. This intake records the supplied fresh Review
B2 ruling without claiming an external review-file identity that was not
provided. It grants no source or execution authority.

## First exact falsifier

```text
P0_EVENT_IDENTITY_CONTRACT_NOT_CLOSED
```

P0 authenticates one singular `IdentityEpoch` tuple containing one grammar,
rule, action, callback, and environment identity plus expected-event contract
bytes. That tuple cannot authenticate a declaration containing multiple event
rows whose rules, actions, callbacks, environments, phases, ordinals, and
cardinalities differ. P4 also permits a declared zero-event row but P0's
contract schema contains no exact per-row cardinality field.

P4 must therefore self-author per-event identity/cardinality, infer it from
untyped contract bytes, or use an undeclared table. Every option violates the
closed authority and no-fallback laws. Review B2 rejects v2 before source or
execution.

## Required v3 closure

1. P0's canonical `DeclarationBytes` own one strictly ordered
   `EffectIdentity[]` keyed by `{eventId,rowId,phase,ordinal}`. Every entry has
   exact grammar, rule, action, callback, and environment hashes plus canonical
   cardinality. The complete table bytes and hash are bound in the declaration.
2. P4 performs exact table lookup and compares candidate occurrence count,
   global order, identity, payload, and fresh-control observation. Missing,
   duplicate, extra, reordered, ambiguous, and fallback lookup are RED;
   cardinality zero is explicit and executable in the future contract.
3. P1 closes canonical tagged encodings for every non-JSON value constructor,
   including tag spelling, field order, payload domain, and byte identity.
4. P2 relocates `DepthDelta` unchanged and uses only ledger epoch invalidation.
   P3 alone compares entry depth, maximum-depth delta, nesting limit, and all
   depth-bearing product state after E03 relocation against E05.
5. P3 enumerates exact constructor payload types and field cardinalities for
   every node/read/memo/product domain and rejects unknown constructors/fields.
6. P5 authenticates raw source, artifact, fixture, command, and result bytes;
   command authority includes argv, cwd, environment, exit, stdout, stderr,
   runtime, toolchain, and exact product/effect linkage.
7. P6 owns two disjoint hostile domains: canonical-value mutation after P1
   decode and raw-byte noncanonical/duplicate-key mutation before decode. Each
   invariant has one exact production leaf, injector, code, owner suppression,
   and all non-owner retentions.
8. P7 owns one closed AST-tool/raw-source
   injector→production-leaf→reason-code→control table with no message or
   self-authored classification.

All eight contracts, manifest, and receipt move atomically to v3. Changed edge
rows remain exact at both owners; no mixed v2/v3 packet exists.

## Review B2 disposition

| Interface | v2 ruling | Required v3 result |
|---|---|---|
| P0 | `RED` | ordered closed per-event identity/cardinality table |
| P1 | `AMEND` | exhaustive canonical tagged encodings |
| P2 | `AMEND` | no hidden target-depth input |
| P3 | `AMEND` | exact payload/cardinality schema and depth comparison |
| P4 | `RED` | exact table lookup, occurrence, order, payload; no fallback |
| P5 | `AMEND` | raw bytes and complete command/result receipt |
| P6 | `AMEND` | raw/canonical domains and one leaf per invariant |
| P7 | `AMEND` | closed AST/source injector/leaf/code/control table |

## Exact boundary

- Review B2 terminal result: `AMEND/RED`;
- scientific/equivalence/timing/novelty/law/product/downstream credit: `0`;
- v2 mutation or reseal: `FORBIDDEN`;
- source/prototype/N2e execution: `WITHHELD`;
- Review B3: `NOT DISPATCHED`;
- next action: author one immutable ten-file paper v3 resolving A2 and B2
  atomically, then freeze it for fresh A3/B3 without dispatch.
