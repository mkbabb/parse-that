# Pass 3 S4 authored-span sequence

Date: 2026-07-29

Authority parent: `302c623b4ffddf76bc4ee042cad1d3c5e739ef9d`

Control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **HELD — RED**

S4 recognizes the consumed idiomatic graph
`sequence(choice(...literal(name).spanned()), literal(":").spanned())` at
compile time. It projects both authored UTF-16 spans directly from the source
cursor, preserves the one-code-unit suffix as a combinator child, and uses no
token, scanner, generated source or second parser path. Standalone spans and
nonmatching graphs retain the generic compiler path.

The hot diagnostics-off path advances only the scalar failure frontier.
Diagnostics-on parsing retains ordered labels through `mergeLabels`; the
profile asserts equal values, spans, offsets, frontiers, diagnostics and
failures before timing. Winner depth is stored in the smallest safe typed
array, reducing the 96-name table from 60,816 to 58,730 bytes.

## Corrected accepted-M2 result

| Plane | Exact-bootstrap 95% low | Median | 95% high |
|---|---:|---:|---:|
| 96-name matched-boundary sequence | 9.063× | 9.257× | 9.799× |
| 96-name raw internal sequence | 9.017× | 9.614× | 10.079× |
| 96-name immutable result | 4.573× | 4.742× | 4.838× |
| late success | 20.160× | 21.436× | 22.301× |
| unknown-head failure | 21.217× | 24.416× | 26.002× |
| diagnostics-on tail failure | 24.434× | 27.494× | 28.195× |

The prior accepted-M2 control was 8.179× matched, 8.698× internal and 4.420×
result at CI-low. S4 materially improves all three small success planes, but
none clears the formal ≥10× lower bound. It therefore advances no formation,
execution, candidate or release boundary.

Dense sentinel-column, arithmetic alphabet, row-displaced compact-table,
packed winner/depth, two-code-unit bucket, conditional frontier-clear and
projection-branch variants were measured and killed. They are not retained in
source.

## Seal

- Kernel SHA-256:
  `19d835b0bbaac70dc4d6a074335a6f42b351e30d7cbc29cc8f21d6f4157019f9`.
- Profile SHA-256:
  `b578a3e7db6c3e1742f68f7d37329952cd889370d0a0cf6b53e338f9f30a7bfb`.
- Node `26.0.0`; V8 `14.6.202.33-node.19`; Darwin arm64.
- Five fresh processes alternate candidate/control first and preserve all
  eleven AB/BA batches.
- `bootstrap-sample-96.json` enumerates the exact `5^5 = 3,125` resamples.
