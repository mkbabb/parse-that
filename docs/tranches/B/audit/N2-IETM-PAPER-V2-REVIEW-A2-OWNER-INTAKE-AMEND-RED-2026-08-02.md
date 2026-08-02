# N2 IETM paper v2 — Review A2 owner intake

Date: 2026-08-02

Status: **TERMINAL AMEND/RED — PAPER ONLY — ZERO CREDIT — A3 NOT DISPATCHED**

## Frozen input

- packet commit: `9605c077ac47bbcbc1cacb35a6d45a48f8105d2e`;
- packet root: `docs/tranches/B/research/N2-IETM-PAPER-v2/`;
- manifest SHA-256:
  `7252fb2696904638317ea0de60f7212264113f10d28d8a4782ada656364c5552`;
- manifest replay: `9/9 EXACT`;
- v2 mutation or reseal: `FORBIDDEN`;
- source, prototype, Node, parser, AST, test, build, benchmark, product,
  package, review dispatch, and N2e execution: `0`.

The v2 packet remains immutable. This intake records the supplied fresh Review
A2 ruling without claiming an external review-file identity that was not
provided. It grants no source or execution authority.

## First exact falsifier

```text
P2_DEPTH_LIMIT_HIDDEN_REVERSE_EDGE
```

P2 says it owns only coordinate atoms and never accepts, visits, clones, or
compares a P3 product. E03 carries only authenticated version ordinals into P2
and returns a map over P2 atoms. Yet P2's `DepthDelta` law also says to
invalidate when target entry depth or nesting limit changes. Those target
values exist only in P3's `CompleteProduct` and the P5 fresh-control input
consumed by P3.

P2 therefore cannot decide the stated invalidation without a hidden P3→P2
reverse edge or an undeclared duplicate of P3-owned product state. Either
violates the closed duplicated-edge graph. Review A2 rejects v2 before source
or execution.

## Required v3 closure

1. P2 relocates `DepthDelta` unchanged. P2 may invalidate it only when the
   authenticated ledger reports an identity-epoch change; it consumes no
   entry depth, maximum depth, nesting limit, product, or fresh-control field.
2. P3 alone applies E03 through its exhaustive visitor and compares target
   `entryDepth`, `maxDepthDelta`, nesting limit, fault, and all depth-bearing
   product state against E05's fresh target receipt.
3. P3 enumerates exact payload types and cardinalities for every constructor,
   memo field, node, dependency read, frontier, rollback, recovery,
   diagnostic, selection, slot, span, provenance, depth, and effect field.
4. P0 exposes a closed ordered event-identity table, not a singular identity
   tuple; P4 performs exact keyed lookup and cardinality/order comparison.
5. P1 specifies every tagged non-JSON constructor's canonical encoding, not
   only the JSON byte envelope.
6. P5 owns raw source, artifact, fixture, command, and result bytes and binds
   argv, cwd, environment, exit, stdout, and stderr in its fresh-control
   authority.
7. P6 separates canonical-value mutations from raw noncanonical and
   duplicate-key hostiles, with one unique production leaf per invariant.
8. P7 closes the AST-tool/raw-source injector→leaf→code→control table.

All changed edges must remain byte-identical at both owners. These corrections
move atomically in a fresh ten-file v3 packet; mixed v2/v3 interfaces are RED.

## Review A2 disposition

| Interface | v2 ruling | Required v3 result |
|---|---|---|
| P0 | `AMEND` | closed ordered effect-identity table |
| P1 | `AMEND` | exhaustive canonical tagged encodings |
| P2 | `RED` | coordinate relocation only; no target-depth dependency |
| P3 | `AMEND` | sole target-depth/product comparison using E03 + E05 |
| P4 | `AMEND` | exact event-table lookup/cardinality/order |
| P5 | `AMEND` | full raw control/command/result authority |
| P6 | `AMEND` | canonical and raw hostile domains split into unique leaves |
| P7 | `AMEND` | closed source/AST hostile ownership table |

## Exact boundary

- Review A2 terminal result: `AMEND/RED`;
- scientific/equivalence/timing/novelty/law/product/downstream credit: `0`;
- v2 mutation or reseal: `FORBIDDEN`;
- source/prototype/N2e execution: `WITHHELD`;
- Review A3: `NOT DISPATCHED`;
- next action: bank Review B2 independently, then author one immutable
  ten-file paper v3 resolving both reviews before any A3/B3.
