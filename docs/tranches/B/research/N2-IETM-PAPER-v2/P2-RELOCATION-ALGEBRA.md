# P2 — edit-chain and coordinate-map algebra

Status: `PAPER_V2 / ZERO_CREDIT / SOURCE_WITHHELD`.
Future budget: `1 module / 110 charged LOC`. Paper budget: `100 nonblank lines`.

## Owned atoms and edits

P2 owns only `CoordinateAtom = Point(offset,bias) | Interval(start,end) | Eof |
LineColumnAnchor(point) | DepthDelta(value)` and `Edit = {start,end,insertUtf16}`.
It never accepts, visits, clones, or compares a P3 product. `from` and `to` are
distinct authenticated ancestor/descendant versions with a nonempty replayed
edit chain.

For replacement `[s,e)` with inserted length `m`:

- point `< s` is unchanged;
- point `> e` shifts by `m-(e-s)`;
- point `= e` maps to `s+m`, retaining bias;
- point `= s` maps to `s` for `before`, and `s+m` for `after`;
- point strictly inside `(s,e)` invalidates.

The same start-bias law applies when `s=e` insertion: `before -> s`,
`after -> s+m`. Intervals have explicit endpoint biases and invalidate when
consumed/read/lookahead/negative/failed-arm/recovery/diagnostic/EOF dependency
intersects an edit. EOF uses `after`. Line/column is recomputed from target
UTF-16. `DepthDelta` is source-invariant but invalidates if target entry depth,
limit, or identity epoch changes.

Composition applies maps in parent-path order; source slice/hash replay occurs
at every version. `RelocationMapResult` is a total immutable mapping over P2
atoms plus invalidation reasons. It contains no product callback or visitor.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E02` | `P0 -> P2` | `openLedger(root: LedgerRoot) -> VersionLedgerView` | declaration/ledger bytes and root externally pinned |
| `E03` | `P2 -> P3` | `relocationMap(from: VersionOrdinal, to: VersionOrdinal) -> RelocationMapResult` | distinct versions; P2 coordinate atoms only |
| `E14` | `P2 -> P7` | `relocationAlgebraClaim() -> InterfaceClaim<RelocationAlgebra>` | biases, composition, invalidation, reached edit |

No other edge exists. Same-version, empty-chain, consumed-only invalidation,
undefined replace-start bias, P3 traversal, or caller-precomputed mapping is
RED. No rope/index/public edit API or execution is authorized.
