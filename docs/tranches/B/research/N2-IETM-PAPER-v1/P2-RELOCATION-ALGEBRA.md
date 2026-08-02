# P2 — ancestor-to-descendant relocation algebra

Status: `PAPER_ONLY / ZERO_CREDIT / SOURCE_WITHHELD`

Future source budget: `1 module / 110 nonblank noncomment LOC maximum`.
Paper budget: `100 nonblank lines maximum`.

## Domain

P2 consumes only a P0-authenticated `VersionLedgerView`. A relocation requires
distinct ancestor `from` and descendant `to`; the edit chain is nonempty. An
edit is `{start, end, insertUtf16}` over half-open `[start,end)`, with
`0 <= start <= end <= oldLength`, and at least one removed or inserted unit.
The chain is the unique parent path and is replayed before mapping.

`SourcePoint = {offset, bias}` where `bias` is `before` or `after`. For a
nonempty replacement: points before `start` stay; points at/after `end` shift
by `insertLength-(end-start)`; interior points invalidate. For zero-width
insertion at `start`, `before` stays at `start` and `after` maps to
`start+insertLength`. EOF is a point with `after` bias. Half-open intervals map
both biased endpoints only when their dependency footprint does not intersect
the edit; otherwise the entry invalidates.

Composition applies edits in ledger order and maps each later edit in its
declared parent coordinate space. Intersection is exact UTF-16 interval
intersection and separately includes negative reads, failed-choice reads,
lookahead, recovery sync, diagnostic frontier, and EOF dependency. Consumed
span alone never defines reuse. Source slices and examined hashes are
revalidated in the target version.

Depth is not a source offset: reusable entries carry relative
`maxDepthDelta`; target entry depth plus the delta must remain within the pinned
limit. Line/column is recomputed from target UTF-16 bytes at the relocated
offset, never shifted arithmetically. Rollback/frontier provenance retains the
original role and obtains a target coordinate or invalidates.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` | root bytes/hash externally pinned |
| `E03` | `P2 -> P3` | `relocate(entry: TypedMemoProduct, from: VersionOrdinal, to: VersionOrdinal) -> RelocationResult` | `from != to` |
| `E11` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` | edit laws and reached nonidentity proof |

P2 has no other interface input or output. `RelocationResult` is either a full
schema-owned relocated state or a typed invalidation reason; partial success is
not representable.

## Laws and falsifiers

- identity is permitted only as an algebra law, never as the mandatory assay;
- sequential composition equals relocation through the same pinned path;
- an edit/read intersection, foreign branch, ambiguous bias, invalid parent,
  source/hash drift, depth-limit drift, or missing EOF read invalidates;
- the smallest admitted paper witness has at least two versions, a nonidentity
  edit, `from != to`, a changed coordinate, and an exact target join in P3;
- empty edit arrays, same-version benchmarks, consumed-only invalidation, and
  precomputed caller relocation are `RED`.

No rope, interval tree, public edit API, implementation, or timing is
authorized by this paper algebra.
