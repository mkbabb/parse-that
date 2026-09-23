# N2 IETM paper v1 — Review A owner intake

Date: 2026-08-02

Status: **TERMINAL AMEND/RED — PAPER ONLY — ZERO CREDIT — A2 NOT DISPATCHED**

## Frozen input

- packet commit: `e1fd16591ac850ffe102fb8287f6640fc9173e9c`;
- packet root: `docs/tranches/B/research/N2-IETM-PAPER-v1/`;
- manifest SHA-256:
  `c67b8e09e279895fcd2940b7ccb5e7b4e562303679435bd0015aabf1a2719363`;
- manifest replay: `9/9 EXACT`;
- source, prototype, Node, parser, static analysis, build, benchmark, product,
  package, review dispatch, and N2e execution: `0`.

The v1 packet remains immutable. This intake records the reported fresh Review
A ruling; it does not claim an external review-file identity that was not
supplied, modify v1, or authorize source/execution.

## First exact falsifier

```text
E04_EFFECT_IDENTITY_UNCLOSED
```

P0 authenticates `grammarHash`, `actionHash`, and `environmentHash` in each
`VersionRecord`. Its E04 output therefore carries only those identities. P4,
however, requires `ruleHash`, `callbackHash`, and an expected-event row contract
without declaring any interface input that can own them.

Two callbacks can share the same grammar/action/environment triple while
having distinct callback bodies and effect traces. Under v1 both receive the
same E04 authority. P4 must then self-author the missing rule/callback/event
identity or depend on an undeclared source. Either route violates the closed,
duplicated-edge law.

Review A therefore rejects v1 as interface-incomplete even before any source,
relocation, product, or performance claim.

## Required v2 closure

1. P0's P1-decoded canonical declaration/ledger bytes own `ruleHash`,
   `callbackHash`, and canonical `ExpectedEventContractBytes` plus SHA-256 in
   `IdentityEpoch`; E04 exports all five identity classes and the expected
   event contract.
2. P4 removes every implicit row/event expectation. It consumes the complete
   E04 identity epoch and a P5-authenticated fresh-control receipt, while its
   observed events include `ruleHash` and `callbackHash`.
3. P5 owns `FreshControlReceipt` bytes outside candidate evidence and exports
   target complete-product and observed-effect identities separately to P3 and
   P4.
4. P2 outputs relocation maps over P2-owned coordinate atoms only. P3 alone
   owns and applies the generated full-product visitor, so relocation algebra
   cannot reach into P3 through a hidden reverse dependency.
5. P3 binds exact typed memo-entry and fresh-target-candidate provenance and
   input. It enumerates closed constructors, fields, scalar types, graph types,
   order/cardinality, and every coordinate-bearing occurrence.
6. Every changed edge row is duplicated byte-for-byte in both owning
   contracts. No prose-only, reverse, callback, expected-row, or verifier edge
   may remain hidden.

## Review A disposition

| Interface | v1 ruling | Required v2 result |
|---|---|---|
| P0 | `AMEND` | canonical declaration/ledger owns full identity/event contract |
| P1 | `AMEND` | P0 input remains canonical and byte-identical |
| P2 | `AMEND` | coordinate-atom relocation map; no P3-owned traversal |
| P3 | `AMEND` | sole full-product visitor and exact target provenance |
| P4 | `RED` | no implicit identity/row contract; consume E04 + fresh control |
| P5 | `AMEND` | authenticated fresh-control receipt to P3/P4 |
| P6 | `HOLD` | must follow the closed v2 edge graph |
| P7 | `HOLD` | must reject any missing/hidden identity edge |

The packet cannot be corrected interface-by-interface across mutable commits.
All eight contracts, manifest, and receipt must move atomically to paper v2.

## Exact boundary

- Review A terminal result: `AMEND/RED`;
- scientific/equivalence/timing/novelty/law/product/downstream credit: `0`;
- v1 mutation or reseal: `FORBIDDEN`;
- source/prototype/N2e execution: `WITHHELD`;
- Review A2: `NOT DISPATCHED`;
- next action: bank independent Review B intake, then author one immutable
  ten-file paper v2 resolving both reviews before any fresh A2/B2.
