# P2-UO mixed-overlap unordered product

Date: 2026-07-29

Accepted-M2 control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **CORRECTNESS GREEN; PERFORMANCE RED; D KILL; NO BOOTSTRAP; NO RELEASE**

## Subject

This private, scannerless assay closes the performance-evidence gap left by
the disjoint-only unordered tournament. Each successful 4/8/16/33-member
product contains:

- a globally reopened prefix choice: `"ab"` must dead-end and reopen as
  `"a"` followed by the separate `"b"` member;
- repeated FIRST buckets among the remaining clause-shaped literals;
- one successful opaque recovery with an immutable diagnostic;
- exact authored slots and UTF-16 spans;
- three input orders, including reverse and pivoted order.

The recovery source has a unique FIRST code. This product therefore proves
successful recovery and live overlap in the same parse, but does not claim a
same-FIRST speculative-recovery frontier result.

The candidate is the private D residual/FIRST family. Its metrics count live
residual route consultations, not newly allocated cache entries. The measured
products perform `7/15/31/65` residual consultations,
`7/16/46/163` checkpoints and the same number of attempts at
4/8/16/33 members. No timed success row uses the old disjoint
`residuals: 0` path.

The accepted M2 package has no public unordered primitive. The equal-semantic
control therefore uses accepted-M2 `Parser` leaves plus the smallest
consumer-owned exhaustive slot search needed to express the same product.
It returns the same values, offsets, UTF-16 spans, immutable diagnostics,
recovery result, failure frontier and labels. It is a parser and product
materializer, not a recognizer.

No production source, public export, CSS grammar, tokenizer, scanner facade,
token array, event tape or second production parser path is introduced.

## Correctness

The focused U/S-kernel suite is 41/41 green: 28 unordered tests and 13
shared-kernel regressions. The four new cases assert the exact 4/8/16/33
mixed-overlap products, authored slots, recovery diagnostic, UTF-16 spans,
live residual routing and bounded exploration.

Before every timing point, the harness compares complete success or failure
views. The state, value, internal, public-result and failure planes are
therefore equal semantic work.

## Equal-plane performance

`profile-abba.json` contains eleven alternating AB/BA batches per point.
Ratios are accepted-M2 control/candidate medians:

| Members | State | Value | Internal | Result | Failure |
|---:|---:|---:|---:|---:|---:|
| 4 | 0.7362× | 0.9854× | 0.8829× | 0.9431× | 1.9054× |
| 8 | 0.8630× | 1.4184× | 1.1949× | 0.9820× | 2.1748× |
| 16 | 1.0741× | 1.7836× | 1.2602× | 1.0660× | 2.1813× |
| 33 | 1.1709× | 2.2994× | 1.4731× | 1.3769× | 2.1235× |

The complete range is 0.7362–2.2994×. Multiple binding success, internal and
result points are slower than the accepted-M2 control, and every point is far
below the required 10× floor. Bootstrap sampling would add no decision
information and was not run.

Stable retained grammar rows are approximately 2.40×, 2.06× and 2.11× the
control heap at 8/16/33 members. The 4-member grammar row is a noisy 11.60×.
Result allocations are too noisy for a binding memory claim.

## CPU, deoptimization and production guard

The CPU profile and raw V8 log are retained. The mixed run records 97
Scavenge/Mark-Compact events, 63 bailout lines and 141 dependent-code marking
lines. Samples concentrate in both the control exhaustive search and the
candidate residual search; this is not a clean hot-only optimization seal and
exposes no order-of-magnitude seam.

The unchanged production `proof:perf` guard is green: retained fused/unfused
heap is 1.70×, real CSS function-name dispatch is 76.7% faster, and the JSON
sample is +8.4% against its checked-in baseline. This is a regression guard,
not formal admission evidence and not a causal result of the private
prototype.

## Ruling

D is terminally retired with the already retired S family. No unordered
candidate survives P2:

- overlap correctness is kept as reusable research evidence;
- the disjoint speedup is rejected as non-general and below the every-scale
  floor;
- the live residual path is rejected because it is slower on binding planes,
  allocates more grammar heap and has no credible route to 10×;
- the isolated formation proof remains RED;
- P3, formation Clean A/B, candidate packing, consumer receipts and release
  receive no credit.

The next transaction is P2 full-subject reconciliation: bind every generic
leaf/runtime/performance row to its terminal evidence, prune dead candidate
surface, and route only genuinely open rows. Same-FIRST speculative recovery
under unordered overlap remains an explicit hostile-audit item; it is not
silently inferred from this fixture.
