# Tranche T — invocation truth prototype bank

Status: **THREE FALSIFIED PROTOTYPES; CLEAN-BREAK V4 AUTHORIZED IN ISOLATION**. V1 and V2
compile and demonstrate useful local properties, but hostile audits found
load-bearing semantic omissions. The clean-break V3 package now kills the recorded
execution counterexamples and passes its declared oracle/package gates; it has no
source-migration authority. `prototypes/invocation-kernel-v3/REVIEW-A.md` proves
cross-SCC host-stack overflow, foreign-cut interception, an unadjudicated rule-cell
contract substitution, unbalanced exception traces, and a public graph leak.
`REVIEW-B.md` independently falsifies semantic values through recovery/right-guard
misclassification and proves eager unreachable callback execution, recursive
sealing, incomplete oracle/packed gates, unchecked coordinates, and structural
debt. `prototypes/invocation-kernel-v3/ADJUDICATION.md` reproduces every finding,
freezes v3 as a falsifier, and binds the sole v4 carrier; production and Value
transposition remain prohibited.

`P2-EXECUTION-ADJUDICATION.md` is the canonical ruling. It proves all ten v2
failures and binds the clean-break v3 sealed-graph/iterative-machine contract.
`prototypes/invocation-kernel-v3/` is the completed replacement candidate: root
replayed 31 tests, the 1,654,175-case bounded exhaustive oracle plus 10,000 seeded
cases, 100,000-code-unit right recursion, terminal-state measurement, and packed
ESM/declaration consumers. Those are machine facts, not an adoption verdict.

`VALUEJS-BANK-ADJUDICATION.md` is the canonical reading of the newly banked
value.js V-next research and PT-E handoff. It admits the reproduced consumer
defects and corpus/adoption requirements, corrects two framed observations, and
rules that the packet is partial research rather than an implemented uplift.

`VALUE-VNEXT-COORDINATION.md` pins the newly active 190-wave Value formation and
keeps its published-1.0 full-CSS lane separate from this breaking major session.
It defines the re-pin, corpus-ingest, packed-crater, coordinate, and versioned
return checkpoints required before any parser adoption can cross repositories.

The historical v1 artifact isolated the minimum carrier then supported by
reproduced facts:

- parser definitions are immutable;
- one call owns source, memo cells, diagnostics, recovery, and commitment;
- speculative execution uses complete checkpoints;
- the public result is a discriminated success/failure value;
- no last-run state lives on a parser object;
- no module global participates in execution.

Run the falsifier from the repository root:

```sh
prototype_dir=$(mktemp -d /tmp/parse-that-t-kernel.XXXXXX)
./typescript/node_modules/.bin/tsc \
  --strict --target ES2022 --module NodeNext --moduleResolution NodeNext \
  --outDir "$prototype_dir" \
  docs/tranches/T/prototypes/invocation-kernel.ts
node "$prototype_dir/invocation-kernel.js"
```

The artifact is intentionally small. It does not claim left-recursion,
performance, package, or consumer proof; those remain separate locks.

## Historical v1 falsifiers

- A checkpoint omitted the memo/LR frontier, so speculative cells could survive
  restore.
- Memo entries captured whole-run evidence instead of an operation delta, omitted
  recovered diagnostics, and could overwrite an enclosing commitment value.
- Commitment was one boolean rather than a scoped choice boundary.
- `Parser.define` exposed the mutable `Run` capability to arbitrary user steps.
- The prototype had no LR seed/grow protocol, coordinate model, full-consumption
  policy, or non-string input experiment.

V2 reproduced these defects and added ten executable counterexamples; V3 claims to
close those exact families with sealed definitions, invocation-owned state, scoped
choice identities, journalled memo/LR state, an iterative machine, UTF-16 positions,
and explicit full/prefix entry points. Those claims remain candidate evidence until
the current two-reviewer adjudication closes; they are not silently retired.
