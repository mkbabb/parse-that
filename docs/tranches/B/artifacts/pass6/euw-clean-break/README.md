# EUW clean-break fatal assay

Date: 2026-07-30

Status: **P5-EUW KILL — RAW PERFORMANCE RED**

This assay answers the hostile owner question left open by the sealed Luna
phase-zero packet: whether a clean breaking raw ABI, with no compatibility
wrapper or second executor, rescues exceptional-unwind mismatch.

## Variants

- `cursor`: one raw executor `(state, cursor) => nextCursor`; success writes
  the ordinary value, routine mismatch throws the frozen singleton.
- `state`: one raw executor `(state) => sameState`; success preserves the
  returned-state shape, routine mismatch throws the frozen singleton.

Neither variant has a compatibility path, fallback, scanner, token plane,
compiler, VM, region, slab, journal, or finalizer.

`json-factory.mjs` authors one dispatch-based idiomatic JSON grammar against a
generic API. It is instantiated with accepted-M2 primitives and each
candidate. The timed control is the exact accepted-M2 exported `jsonParser`,
not a sequential or rebuilt substitute. The rebuilt M2 factory is checked
against that exact control before timing.

## Boundary

- accepted M2: `de36d57dccdd20068b8c11a78f6e83d42e7d681f`;
- M2 JSON/parser/state SHA-256:
  `efec8b86…` / `4962e021…` / `ff9eb71f…`;
- ephemeral esbuild control bundle SHA-256:
  `3751609e01dc46f5ad50f31d4d5f9ecc05e2aad5ccdb61e1508ae780715a8770`;
- esbuild `0.27.3`;
- Node `v26.0.0`;
- V8 `14.6.202.33-node.19`;
- four alternating nested object/array success fixtures;
- immutable public state/value/result projection;
- seven fresh paired processes per variant, fourteen unique PIDs;
- 2,000 iterations per arm in each of ten balanced AB/BA batches;
- independently seeded fixture permutations.

All 56 per-row fixture checks reproduce exact M2 value and public-result
bytes. The rebuilt-control check is green in every row. Each variant's raw
success ABI and singleton mismatch behavior are green.

## Result

```text
cursor raw ratios  0.6076393886x – 0.7527093117x
state raw ratios   0.6148784530x – 0.7001295582x
required floor    10.0000000000x in every process
```

Both variants are slower than accepted M2 in every process. Bootstrap is
withheld because the first raw row is terminally RED. CSS, failure/recovery,
allocation, IC, deopt, GC, and retained-heap work cannot rescue a candidate
that already loses on a weaker success-only product, so those stages did not
run.

The assay does not claim complete failure/recovery equivalence. That omission
favors the candidates; it cannot rescue their sub-`1x` result.

## Reproduction

Build the accepted-M2 bundle outside the repository:

```sh
cd /Users/mkbabb/Programming/parse-that-css-totality/typescript
./node_modules/.bin/esbuild \
  /tmp/parse-that-m2-baseline-20260729/typescript/src/parse/index.ts \
  --bundle --format=esm --platform=node --target=node24 \
  --outfile=/tmp/parse-that-p6-m2-control.mjs
```

Run:

```sh
P6_M2_BUNDLE=/tmp/parse-that-p6-m2-control.mjs \
P6_ITERATIONS=2000 \
P6_OUTPUT=/Users/mkbabb/Programming/parse-that-css-totality/docs/tranches/B/artifacts/pass6/euw-clean-break/raw.json \
node test/prototypes/pass6/euw/run.mjs
```

`MANIFEST.sha256` binds the raw result and all executable prototype sources.
