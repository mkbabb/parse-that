# P3 — closed coordinate-bearing memo and product schema

Status: `PAPER_ONLY / ZERO_CREDIT / SOURCE_WITHHELD`

Future source budget: `1 module / 160 nonblank noncomment LOC maximum`.
Paper budget: `100 nonblank lines maximum`.

## Closed types

P3 owns one algebraic schema; evidence cannot invent fields or coordinate
tags. Scalar variants are `SemanticInt`, `SourcePoint`, `SourceInterval`,
`LineColumnAtPoint`, `DepthDelta`, `Utf16Slice`, `ByteString`, and graph/value
atoms. A schema-generated visitor, relocation visitor, freezer, and comparator
cover the same exhaustive variants. There is no evidence-authored coordinate
manifest and no name/string dispatch.

`TypedMemoProduct` contains parser/rule/action/environment epoch; source
version; start/final offsets; consumed and examined intervals; source-read,
negative-read, failed-arm, lookahead and EOF dependencies; examined UTF-16 and
hash; value graph; slots; spans; terminal/furthest/frontier state; expected and
suggestion sets; secondary spans; rollback; recovery and sync; diagnostics;
fault; selection; provenance; entry depth and max-depth delta; effect trace;
and immutable source slices. Every coordinate-bearing occurrence uses a typed
point/interval variant, including top-level memo fields and nested diagnostics,
rollback, recovery, selection, slot, span, provenance, and frontier fields.

Semantic integers cannot be relocated. Graph equality preserves prototypes,
holes, `undefined`, `-0`, `NaN`, infinities, cycles, aliases, own keys, property
descriptors, bytes, and frozen state without invoking accessors. Unowned
accessors are rejected. Sets and ordered diagnostics have declared equality;
no digest, sink, JSON stringify, or normalized product substitutes.

P3 applies P2 to the entire `TypedMemoProduct`, then joins the resulting full
state to one freshly produced target candidate under P5 pins. It separately
joins P4's observed effects. A product-only match with stale memo metadata or
an unused `targetProduct` field is RED.

## Cross-interface edges

| Edge | Direction | Exact signature | Constraint |
|---|---|---|---|
| `E03` | `P2 -> P3` | `relocate(entry: TypedMemoProduct, from: VersionOrdinal, to: VersionOrdinal) -> RelocationResult` | `from != to` |
| `E05` | `P4 -> P3` | `observeEffects(row: RowIdentity) -> ObservedEffectTrace` | external expected identity, runtime observation only |
| `E06` | `P5 -> P3` | `controlPins(row: RowIdentity) -> TrustedM2Pins` | owner bytes, never submitted evidence |
| `E12` | `P3 -> P7` | `coordinateProductClaim() -> InterfaceClaim<CoordinateProductSchema>` | exhaustive variants and generated traversal |

P3 has no other interface input or output. P2 receives the same schema type
and cannot add fields; P4 supplies observations, not expectations; P5 supplies
external pins, not decoded candidate summaries.

## Fatal paper checks

Untyped numeric domains, evidence-provided manifests, field-name filtering,
locale sorting, partial top-level relocation, product-only joins, stale source
slices, callback/environment omission, lossy equality, mutable results, or a
second raw/product representation are `RED`. The schema must enumerate every
current semantic-law observable before any future source review.

No product parser, CSS AST, source projection, serializer, or execution is
authorized.
