# P3 same-FIRST recovery hostile case

Date: 2026-07-29

Accepted-M2 control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **DIVERGENCE REPRODUCED; D REMAINS KILLED; CLOSURE ORDER IS THE CONTROL LAW; NO RELEASE**

## Subject

This is the smallest scannerless product that combines:

- a globally reopened prefix choice (`"ab"` versus `"a"` plus a separate
  `"b"` member);
- a recovery sync (`"bad;"`) sharing FIRST `"b"` with that separate member;
- one independent `"c03;"` member;
- exact authored slots and UTF-16 spans.

The harness parses all six permutations of `"ab"`, `"bad;"` and `"c03;"`
with diagnostics disabled and enabled. The control is accepted-M2 leaves plus
the minimal consumer-owned exhaustive slot search. The candidate is the
already retired D residual route. Both use the same scalar
offset/value/diagnostic-length/error rollback law.

## Result

All twelve products return identical values, authored slots, spans, final
offset and success status. With diagnostics enabled, all six complete state
views are equal.

With diagnostics disabled, four of six immutable recovery diagnostics differ:

| Source | M2 recovery furthest | D recovery furthest |
|---|---:|---:|
| `abc03;bad;` | 6 | 10 |
| `bad;abc03;` | 1 | 2 |
| `bad;c03;ab` | 1 | 2 |
| `c03;bad;ab` | 5 | 6 |

The two remaining permutations are equal at offset 10. M2's recovery
`furthestOffset` is invariant when diagnostics are toggled:
`10/6/1/1/10/5`. D changes from `10/10/2/2/10/6` with diagnostics disabled
to M2's sequence when diagnostics are enabled.

The divergence is not a rollback leak. Failure frontier is intentionally
monotone across rejected branches; D changes which speculative branch is
visited before recovery. Because recovery captures that frontier, changed
search order changes immutable provenance.

## Ruling

The hostile case closes three ambiguities:

1. enabling diagnostics may add labels, suggestions and secondary spans, but
   may not change recovery offsets or found-source provenance;
2. a candidate that reorders speculation must not feed its reordered global
   frontier into an accepted-M2-equivalent recovery diagnostic;
3. the simplest conforming P3 route is the incumbent closure traversal. A
   local-recovery-frontier redesign would change baseline behavior and needs
   an explicit future semantic decision, not a hidden optimization.

D is already performance-killed and is not repaired. No unordered engine,
new checkpoint field, recovery layer or public API is introduced. This
artifact constrains the direct closure-kernel cut and grants no P3 completion,
formation, consumer, execution or release credit.
