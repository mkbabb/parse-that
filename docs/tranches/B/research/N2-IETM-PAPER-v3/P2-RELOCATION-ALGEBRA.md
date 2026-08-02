# P2 — edit-chain and coordinate-map algebra

Status: `PAPER_V3 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 110 charged LOC`. Paper budget: `100 nonblank lines`.

## Owned atoms and edits

P2 owns only `CoordinateAtom = Point(offset,bias) | Interval(start,end) | Eof |
LineColumnAnchor(point) | DepthDelta(value)` and `Edit = {start,end,insertUtf16}`.
It never accepts, visits, clones, or compares a P3 product, target entry depth,
maximum depth, nesting limit, or P5 receipt. `from` and `to` are distinct
authenticated ancestor/descendant versions with a nonempty replayed edit chain.

For replacement `[s,e)` with inserted length `m`: point `<s` is unchanged;
point `>e` shifts by `m-(e-s)`; point `=e` maps to `s+m` retaining bias;
point `=s` maps to `s` for `before` and `s+m` for `after`; a point strictly
inside `(s,e)` invalidates. For insertion `s=e`, `before -> s` and `after ->
s+m`. Intervals apply endpoint biases and invalidate when consumed, read,
lookahead, negative, failed-arm, recovery, diagnostic, or EOF dependency
intersects an edit. EOF uses `after`. Line/column is recomputed from target
UTF-16.

`DepthDelta` relocates unchanged. It invalidates only when P0's authenticated
ledger changes `identityEpochId`; P2 cannot inspect depth or limit values.
P3 owns all target depth/limit comparison after applying E03.

Composition applies maps in parent-path order and replays source slice/hash at
every version. `RelocationMapResult` is a total immutable mapping over P2 atoms
plus closed invalidation reasons. It contains no product callback or visitor.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` | canonical versions, edits, epochs; no product/depth state |
| `E03` | `P2 -> P3` | `relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult` | P2 atoms only; DepthDelta unchanged absent epoch change |
| `E14` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` | biases, composition, invalidation, and no reverse edge |

No other edge exists. Same-version, empty-chain, consumed-only invalidation,
undefined replace-start bias, target-depth access, P3 traversal, or caller map
is RED. No rope/index/public edit API or execution is authorized.
