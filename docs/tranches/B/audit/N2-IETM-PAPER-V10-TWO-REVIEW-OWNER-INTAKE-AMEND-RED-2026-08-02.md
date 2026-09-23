# N2 IETM paper v10 — two-review owner intake

Date: 2026-08-02

Status: **TERMINAL AMEND/RED — PAPER ONLY — ZERO CREDIT — V10 FROZEN**

## Frozen packet

- packet commit: `fd6bc0b48f8ecc112d21c15c2dd593db580e5970`;
- packet tree: `27edbd60be4d87aad9fc1a27137fc7c8f2dad25f`;
- packet root: `docs/tranches/B/research/N2-IETM-PAPER-v10/`;
- topology: `10 regular files / 1,512,975 bytes`;
- `PAPER-READY.md` SHA-256:
  `5c0ebad4e425bcaa53418f27e95df26767e517fc8beadb093c220387a3d25f42`;
- `PAPER-MANIFEST.sha256` SHA-256:
  `bf3aaaa1d65cd1976d6b699d3b73f8decc4a427a8d2b0061390a275c95804694`;
- manifest replay: `9/9 EXACT`;
- v10 mutation, amendment, reseal, source execution, or retrospective credit:
  `FORBIDDEN`.

This append-only intake records the supplied two independent review rulings.
It does not amend the ten-file packet, execute its proposed modules, claim an
external review-file identity that was not supplied, or authorize a successor.

## Review A — first material falsifier

```text
N2V10_STATIC_TRAVERSAL_BASELINE_ROLE_UNRESOLVABLE
```

`runStaticTraversal` selects `productionInstances` when
`row.variant === "BASELINE"`, then searches for an instance whose role equals
the variant. All forty-three baseline traversal rows use `BASELINE`; the
corresponding production instances use `BEFORE`. The first row therefore
throws `TRAVERSAL_OBJECT_MISSING` and aborts the sweep. The claimed `172/172`
traversal authority is `0/172`, with `43/172` baseline joins unresolvable.

The following Review A defects remain independently binding:

1. If the missing `BASELINE -> BEFORE` role map were supplied, the production
   validator would return canonical success as `null`, while all forty-three
   baseline rows expect the string `GREEN`; the runner would then throw
   `TRAVERSAL_RESULT`.
2. The traversal runner does not consume or exact-compare the advertised
   `objectRoot`, `schemaId`, `semanticDiscriminantRoot`, `routeKey`,
   `routeCardinality`, `predicateLeafFunctionIdentityRoot`, or
   `predecessorUnrelatedLeafRoots` fields on any of the 172 rows.
3. P7's C32 source-authority prose remains mislabeled as v9 rather than v10.

## Review B — independent falsifier

```text
N2V10_STATIC_TRAVERSAL_SUCCESS_REPRESENTATION_MISMATCH
```

Review B independently reached the `null` versus `GREEN` defect without
depending on Review A's role analysis. Authenticated validator success is
`null`; every baseline traversal row and all forty-three corresponding planned
baseline receipts require `"GREEN"`. The first baseline comparison therefore
throws `TRAVERSAL_RESULT` even under a hypothetical correct role map.

Impact:

- baseline traversal expectations false: `43/43`;
- executable traversal authority: `0/172`;
- impossible planned baseline receipts: at least `43/2,113`;
- scientific, equivalence, performance, novelty, CSS, product, law,
  formation, package, release, and rebind credit: `0`.

## KEEP — authenticated negative-evidence substrate

The following data-side evidence remains useful only as frozen paper
archaeology:

- exact schemas: `43`;
- production instances: `86`;
- alternate instances: `86`;
- schema/object/operation joins: `172`;
- predicate wrapper spans: `43`;
- transitive implementation spans: `53`;
- signed registry authority: authenticated;
- C19 baseline Ed25519 signature: valid;
- C19 corrected invalid variants: `3`, each with an exact recomputed and stored
  derived message root, each reaching and failing Ed25519 verification;
- proposed modules imported or executed: `0`.

These facts do not rescue the traversal claim or grant execution credit.

## PRUNE — false traversal authority

Prune as authority:

- `staticSelfAudit` and its `172/172` claim;
- all traversal-derived baseline, owner, alternate, route, discriminant,
  predecessor, and receipt credit;
- the `PAPER-READY.md` statement that the 172-row matrix binds every variant
  to an executable intended invariant.

The bytes remain immutable negative evidence. “PRUNE” does not authorize
editing or deleting the frozen packet.

## Primary-literature novelty boundary

The supplied primary-literature falsification closes broad novelty labels for
the constituent mechanisms:

| Mechanism | Prior-art boundary | V10/future disposition |
| --- | --- | --- |
| staged and specialized source parsers | staged combinators and `flap` | no broad novelty claim |
| direct PEG-to-Wasm, regions, sparse memoization | Ohm v18 | competitor/control |
| fused semantic reductions and closed action algebras | Paguroidea, Nez, Morpheus | no broad novelty claim |
| direct semantic products without a CST | staged combinators, Vermillion, PADS | no broad novelty claim |
| transactional rollback | Ohm, Nez, principled stateful parsing | no broad novelty claim |
| PEG recovery | labeled-failure and automatic recovery work | no broad novelty claim |
| spans and provenance | PADS and Vermillion | no broad novelty claim |
| inverse parse/print | Invertible Syntax Descriptions, exact biparsers, EverParse | no broad novelty claim |
| generated-parser trust | Vermillion and Morpheus | overlap; no broad novelty claim |

`N-WRR`, `N-DNF`, `BIR-AOT`, `ActionRef`, staging, Wasm, memoization,
regions, action algebras, recovery, provenance, and inverses therefore cannot
individually carry a novelty label.

### Only surviving hypothesis

Status: **OPEN-UNPROVEN — INTEGRATION/ENGINEERING RESEARCH ONLY**.

A finite, validated CSS semantic-and-recovery algebra may lower from one
closed authenticated IR into both:

1. source-direct JavaScript; and
2. zero-function-import WebAssembly;

while materializing no CST and making the two backends observationally
equivalent over:

- semantic value;
- byte-slice complement;
- byte-based provenance;
- diagnostics;
- rollback;
- recovery residue; and
- malformed-input round-trip laws.

Novelty survives only if the combined zero-CST/callback, recovery, inverse,
and provenance contract is absent from prior art and removing its claimed
mechanism removes the measured gain.

Before any novelty claim, a later separately authorized tranche must:

1. source-audit Ohm, Paguroidea, Nez, and exact-biparser artifacts;
2. search browser engines, Servo, Lightning CSS, csstree, PostCSS, theses,
   patents, and 2025–2026 citations;
3. define byte, code-point, and UTF-16 semantics plus the Wasm output ABI;
4. formalize IR typing, effects, rollback, and translation validation;
5. define malformed-input lens laws; and
6. run exhaustive short-input and grammar fuzzing against an independent CSS
   oracle.

This is a future research checklist, not an N4 release.

## Exact successor boundary

The smallest mechanical v11 correction would require:

- `BASELINE -> BEFORE` mapping;
- one canonical success representation;
- consumption and exact comparison of every advertised traversal field;
- corrected C32 v10 prose; and
- regeneration of every dependent object, fixture, root, signature, receipt,
  manifest, and packet hash.

That description grants no v11 authority. Root is separately adjudicating the
literature/design boundary and N4 versus v11 order.

Final disposition:

- v10: `FROZEN / TERMINAL AMEND-RED`;
- KEEP data-side and C19 evidence: `NEGATIVE EVIDENCE ONLY`;
- traversal authority: `PRUNE`;
- v11: `NOT AUTHORIZED`;
- N4: `NOT AUTHORIZED`;
- N2e, N3 continuation, source execution, review dispatch, parser/product/CSS
  work, benchmark, package, release, and rebind: `WITHHELD`;
- all credit: `0`.
