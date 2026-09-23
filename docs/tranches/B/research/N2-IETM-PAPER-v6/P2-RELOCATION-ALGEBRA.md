# P2 — epoch-aware relocation algebra

Status: `PAPER_V6_RED / ZERO_CREDIT / SOURCE_WITHHELD`.
Future ceiling: `1 module / 90 charged LOC`.

P2 retains the closed `Point`, `Interval`, `Eof`, `LineColumnAnchor`, and
`DepthDelta` algebra. It derives one total immutable relocation map from the
admitted ledger. Replacement/insertion bias, interval intersection, failed-arm
and EOF dependency, source replay, line/column recomputation, composition,
recovery/diagnostic invalidation, and epoch transition are exact. Epoch change
invalidates depth reuse; P3 alone compares target products.

P2 owns only `C06`; its full production identity is derived from the machine
row. It participates in `E02/E03/E14/E20`. No product visitor, caller map,
public edit API, callback, CSS grammar, or Fourier edge is permitted.
