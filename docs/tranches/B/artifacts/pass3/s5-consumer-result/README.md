# Pass 3 S5 consumer-owned result projection

Date: 2026-07-29

Source parent: `6f893bebce3c7bbe7322c77acc709fe53349abdc`

Control: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`

Disposition: **HELD — RED**

S5 removes the unconsumed private `.result` method and its result types from
the staged compiler. `ParserState` remains the parse-that-owned provenance
surface. A colocated consumer harness materializes the timed immutable shape,
shares frozen empty evidence, constructs one result object rather than
spreading an intermediate evidence object, and gives the M2 control and S
candidate separate projector closures so their different state maps do not
pollute one inline-cache feedback site.

This is an ownership and net-runtime-deletion cut, not an exclusion of result
work. The profile still times immutable result materialization on both sides,
and recovery tests still require frozen results, expected labels, diagnostics,
nested diagnostic arrays and typed faults.

## Corrected accepted-M2 result

| Plane | Exact-bootstrap 95% low | Median | 95% high |
|---|---:|---:|---:|
| 96-name matched-boundary sequence | 8.985× | 9.492× | 10.161× |
| 96-name raw internal sequence | 9.040× | 9.289× | 9.705× |
| 96-name immutable result | 7.254× | 7.486× | 7.762× |
| late success | 19.755× | 21.562× | 21.902× |
| unknown-head failure | 23.135× | 23.558× | 25.040× |
| diagnostics-on tail failure | 24.703× | 27.152× | 28.159× |

The binding result CI-low rises from S4's 4.573× to 7.254×. Process variance
moves the unchanged matched/internal source planes within their prior range;
they receive no advancement credit. Every small success/result plane remains
below the formal ≥10× lower bound.

An isolated eager-versus-lazy M3 state-field probe produced 9.039× matched
CI-low against S4's 9.063× and was deleted. No production state accessor or
lazy nesting-object complexity survives.

## Package guard observation

Strict TypeScript, focused 8/8, package 14/14 files and 134/134 tests, build,
and the non-performance proof scripts are green. The unchanged production
JSON guard is noisy and presently RED: it passed immediately before S5 at
+13.2%, then returned +64.0%, +23.6% and +24.4% against its fixed 15% point
threshold. S5 changes only private prototype/test files, so these samples
receive no S5 advancement credit and the failed guard is not concealed.

## Seal

- Kernel SHA-256:
  `30a3f1c2e549496b90ea5da4db0795b04417531a5eadb10ea3dd621505fce32b`.
- Profile SHA-256:
  `9529e650d9a7b9073f368034fb67386825bd94ef132c5392120bb0264920fd6b`.
- Consumer result SHA-256:
  `43a4592529962bcecfb9a88562830ef507062762799327d406c756badc7452a2`.
- Focused test SHA-256:
  `d4901159ceaa33f7aac8b87a940c43190a046370ad41b9c49b686ec6edee80ee`.
- Node `26.0.0`; V8 `14.6.202.33-node.19`; Darwin arm64.
- Five fresh processes alternate candidate/control first and preserve all
  eleven AB/BA batches.
- `bootstrap-sample-96.json` enumerates the exact `5^5 = 3,125` resamples.
