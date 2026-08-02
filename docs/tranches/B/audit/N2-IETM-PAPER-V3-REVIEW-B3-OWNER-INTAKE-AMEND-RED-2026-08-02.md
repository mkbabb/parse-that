# N2 IETM paper v3 — Review B3 owner intake

Date: 2026-08-02

Status: **TERMINAL AMEND/RED — PAPER ONLY — ZERO CREDIT — V4/B4 NOT AUTHORIZED**

## Frozen input

- packet commit: `1fae739bb251541a37df17dd4a3dc54b793b5835`;
- packet tree: `6f5c9106c5e163dac6fe5e412dfff6c5e98b1c47`;
- packet root: `docs/tranches/B/research/N2-IETM-PAPER-v3/`;
- manifest SHA-256:
  `b79b03030a38ff1724d6f20c25fef7ffbb1820246e840ea085b63ed73905e322`;
- manifest replay: `9/9 EXACT`;
- packet diff from commit: `EMPTY`;
- topology: `10 regular files / 31,179 bytes`;
- Review A3 owner-intake commit:
  `b1ecf63ec89c5e6c048345dc49778f675be14bfa`;
- source, prototype, Node, parser, AST, test, build, benchmark, CSS, product,
  package, review dispatch, and N2e execution: `0`.

The v3 packet is immutable. This intake records the supplied fresh Review B3
ruling without claiming an external review-file identity that was not
provided. It grants no correction, source, execution, or v4 authority.

## First exact falsifier

```text
P0_EFFECT_EPOCH_SELECTION_UNBOUND
```

P0 permits multiple `IdentityEpoch` records and guarantees event-key
uniqueness only within each epoch. The same `{eventId,rowId,phase,ordinal}` key
may therefore occur under different identity tables. E04 nevertheless returns
`effectIdentityTable(root)` without an authenticated selected epoch;
`ObservedEvent`, `FreshControlReceipt`, and P4 lookup also omit
`identityEpochId`.

P4 cannot choose the applicable table without hidden source-version→epoch
authority, a fallback search across epochs, or candidate-authored selection.
All three violate the closed exact-lookup law. V3 is RED before source or
execution.

## Independent secondary findings

1. Candidate execution, reuse, callback invocation, raw command, and result
   capture have no owner. Candidate products and events can therefore remain
   evidence-authored even if their envelopes are canonical.
2. P3's `Semantic`, `Descriptor`, and `Slot` domains cannot contain a
   graph-embedded `Coordinate`; coordinate-bearing values nested inside arrays,
   objects, descriptors, or slots escape the sole relocation visitor.
3. P5 does not authenticate a closed outer bundle: exact members, order,
   unique use, root construction, external root pin, and extra/orphan rejection
   are absent.
4. P6 RAW hostiles are rejected inside P1 before a distinct P6 production leaf
   can own them. P6 VALUE mutations do not bind the full induced collateral or
   prove only the named invariant changed.
5. P7's raw source-hash leaf rejects a mutation before structural leaves can
   establish their own reasons. Executable AST tool/adapter work is also
   described as external while excluded from the eight-module budget.

## Non-authorizing future recommendation

A later owner/root ruling may require `sourceVersion` and authenticated
`identityEpochId` through E04, `ObservedEvent`, `FreshControlReceipt`, and exact
lookup; an owner-bound candidate executor/raw command/schema/pin; Coordinate in
semantic graphs; a noncircular closed P5 root/inventory; precise RAW/VALUE
collateral and outcome denominators; and rebased source pins so P7 structural
leaves reach their own reasons while all AST executable work is budgeted.
Typed P6 leaf edges or reassigned P0–P5 ownership must be decided at the same
boundary. This is recommendation only: no v4 packet or work is authorized.

## Exact boundary

- Review B3 terminal result: `AMEND/RED`;
- scientific/equivalence/performance/novelty/CSS/product/law/release credit:
  `0`;
- v3 mutation or reseal: `FORBIDDEN`;
- v4, N2e, source, execution, and Review B4: `WITHHELD / NOT AUTHORIZED`;
- next action: reconcile external tranche status and await a later owner/root
  ruling; do not author or dispatch v4.
