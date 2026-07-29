# Tranche B constellation coordination

Date: 2026-07-29

Status: `in_progress`

## Coordinates at open

| Repository | Tranche / role | Coordinate |
|---|---|---|
| parse-that worktree | B / generic runtime producer | source/evidence `c480578`; canonical authority `f3ed3b6` plus this P-B1 amendment |
| Value | V / sole CSS grammar, consumer and UI owner | repository HEAD `e01d0065fa6c7c80282280566af2b9a4add809bf`; formation packet independently admitted at reported SHA prefix `aa684060` with zero execution credit |
| Keyframes | W / Value CSS consumer | receipt-only through Value |
| BBNF | post-Value-W3 ABI peer | no implementation or CSS parser before W3 |

Value's working tree is active and dirty. Parse-that does not read dirty heads
as release proof and does not modify Value files. The immutable candidate and
later released coordinate are the only executable package boundaries.

## Writer / reader boundary

| Surface | Writer | Other party |
|---|---|---|
| generic parse runtime, result provenance, spans, recovery, diagnostics, recursion, performance | parse-that | Value and JSON consume |
| CSS Syntax/VDS/selectors/at-rules/Webref grammar, CSS results/inverses, transform/path, UI | Value | parse-that reads receipts |
| local CSS/path/serializer deletion and animation runtime | Keyframes | Value supplies surface; parse-that does not write |
| grammar IR/ABI after Value W3 | BBNF | parse-that sends frozen receipt only |

## Release-cycle cure

1. Parse-that converges privately and freezes a locally correct,
   reproducible source state.
2. Parse-that produces one immutable unpublished candidate tarball.
3. Value and parse-that's JSON grammar consume the exact tarball SHA.
4. Both return equivalent-product, deletion and formal consumer-proof
   receipts; corrected profiles clear ≥10× at CI-low at every binding scale.
5. Two clean adversarial audits accept the same frozen source, tarball and
   consumer evidence.
6. Parse-that releases.
7. Value rebinds to the released coordinate and reruns full gates.
8. BBNF receives the post-W3 frozen ABI receipt.

No raw-source alias, mutable link, dirty head, package-link evidence or
competing grammar can close an edge.

## Conflict resolution

- A CSS/domain request is routed to Value; parse-that exposes no domain type.
- A generic runtime request needs Value plus JSON consumption before it can
  alter the release surface.
- A write overlap stops at the immutable package boundary; repositories do
  not edit each other's active worktrees.
- A changed candidate invalidates both consumer receipts and restarts at the
  candidate-tarball step.
- A RED equivalence, deletion, CI-low or audit row prevents release and Value
  rebind. It is not converted to narrative proof.

## Current receipt

Value formation is independently admitted with zero execution credit.
V.L1/V.L5 remain blocked on the exact release chain above. Parse-that's
corrected accepted-M2 96-name matched-boundary CI-low is 8.179×,
raw-internal CI-low is 8.698× and immutable-result CI-low is 4.420×;
therefore the producer edge is **RED** and
`NO RELEASE`.
