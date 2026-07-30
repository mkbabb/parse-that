# P6-SIR-A1 owner adjudication and A2 dispatch

Date: 2026-07-30

Status: **A1 AMEND BEFORE TIMING — RAW INADMISSIBLE — A2 ROUTED — NO
DISTINCT P7 — ZERO CREDIT — NO RELEASE**

## Ruling

P6-SIR-A1 repairs the three obvious `sepBy` typed-fault masks, but it does not
prove or implement the complete atomic checkpoint required by the signed ABI.
Fresh-Sol poisoning exposes four binding defects:

1. `sepBy` does not restore `suggestionCount` or `secondaryCount` when the
   first element, separator or later element returns sticky `-2`.
2. A typed fault from `recover`'s sync child leaves
   `diagnosticFurthest`/`diagnosticFound` changed and erases the inner
   mismatch frontier.
3. The direct and nested typed-fault rows remain exempt from exact assertion.
4. The row labeled native-value equality compares accepted M2 with a second
   accepted-M2 invocation instead of `JSON.parse`.

The A1 pre-timing gate is therefore false-green. Its seven raw ratios are
arithmetically exact but inadmissible for disposing of the conforming
signed-step atom.

## Bound identities

- A1 Luna root:
  `/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-luna-a1/outputs`
- A1 manifest SHA-256:
  `43944afe23d45fcc340eb0237b892a6ee03b32757cc5e40398b4f00ebe491103`
- A1 raw SHA-256:
  `e9479e7ee7e2114f9c17f53369f4f4311dee1ed940cb26897b92b70e841dd9db`
- A1 fresh-Sol task:
  `019fb1bb-7b9e-7790-acb1-63366e2d2051`
- A1 fresh-Sol root:
  `/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-a1-fresh-sol-adjudication/outputs`
- A1 fresh-Sol checksum-manifest SHA-256:
  `55a44e09a8f7b2c7c3943b60110f36eb9becea5cd67bef931eb9da596c49b03d`
- A1 fresh-Sol report SHA-256:
  `f1950e4e059bd456423cced329ce3afe3f6835a92b09b99bb7ae1442dabc7804`
- A1 fresh-Sol findings SHA-256:
  `43513ddcf528153fdb148957aa19b2a03369d57415d9448935ee5f08fea82123`
- A1 fresh-Sol mutant receipt SHA-256:
  `b1a17c7f50ffb8397cb80592a678f63ff69e9b71f5ab5589d274d63d729b68da`
- A1 fresh-Sol replay receipt SHA-256:
  `4b7f38f34721da93e797247663dd554a49308170113b7312a37cc8e03d93d09f`
- A1 fresh-Sol integrity receipt SHA-256:
  `10caba63b8bf8d6c10824a8ba4cba8d7026f8ee2991a58e5c997d215da4115b8`

The owner independently observed exactly six fresh-Sol regular files, no
subdirectories, and two green 5/5 checksum passes. The A1 packet remains
exactly eight regular files with no subdirectories and two green 7/7
manifest passes.

## Exact checkpoint failures

With entry `suggestionCount = 11` and `secondaryCount = 12`, a legal child
that mutates both fields and returns the real frozen `-2` fault leaves
`112`/`214` at every `sepBy` typed-fault position. Value, six diagnostic
scalars and public typed projection happen to restore in those probes; the
two omitted counts do not.

For `recover(string("a"), typedFault(), "REC")` on `x`, the result is `-2`
and the public fault is present, but hidden state changes:

| Field | Entry | Observed |
|---|---:|---:|
| `diagnosticFurthest` | `-1` | `0` |
| `diagnosticFound` | `""` | `"x"` |
| mismatch frontier | `0` | `-1` |

The public empty diagnostic array masks that drift. An atomic result cannot
be admitted on selected public fields while its run-owned checkpoint is
incoherent.

## Raw disposition

The seven unique PID/seed rows, ten AB/BA batches, 2,000 deterministic
selections per arm per batch, sinks, totals and
`sum(control ns) / sum(candidate ns)` ratios reproduce exactly. The range is
`0.8716349950368936x`–`1.0327489885223390x`; all rows are below `10x`.

Those bytes remain immutable negative evidence about A1 only. Timing followed
a false-green gate and the timed runtime does not implement the complete
checkpoint. Therefore:

- A1 packet: **AMEND**;
- A1 raw arithmetic: **GREEN, INADMISSIBLE**;
- conforming signed-step atom `KILL/PRUNE`: **NOT ESTABLISHED**;
- genealogy: **SPLIT**;
- surrounding topology: **FOLD into P3 `19c1e12`**;
- novelty/family/formation/product/API/release credit: **ZERO**; and
- bootstrap, CSS, profiles, allocation, GC, IC and deopt: **WITHHELD**.

## P6-A2 transaction

Resume the existing Luna xhigh seat
`019fb16a-09d7-7d80-ae5f-3d894e25855d`; create no task. Its sole new writer
root is:

`/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-luna-a2/outputs/**`

Preserve the original P6 packet, A1 packet and both raw artifacts byte-for-byte.
A2 may only:

1. define one complete scalar checkpoint schema for every atomic typed-fault
   boundary, covering value, suggestion/secondary counts, diagnostic count
   and all diagnostic shadow fields while preserving the required sticky
   fault/frontier;
2. apply exact save/restore to the first `sepBy` element, separator, later
   element and recovery-sync typed-fault path;
3. assert direct, nested, first-element, separator, later-element and
   recovery-sync faults with no exemption, comparing exact return, complete
   run snapshot and immutable public result;
4. compare `JSON.parse`, exact accepted M2, rebuilt M2 and A2 independently
   on all four frozen fixtures; and
5. retain every routine rollback, alias, dispatch, safe-return and
   forbidden-mechanism probe.

No checkpoint object, journal, region, slab, token plane, scanner, compiler,
VM, generated grammar, wrapper, fallback, alternate executor or per-parse
control container may be added. Direct scalar locals and a single tiny
colocated save/restore helper are allowed only if they reduce repetition
without allocating on the parse path.

Only after every pre-timing row is green may A2 create a new raw artifact:
exact accepted-M2 live `jsonParser`, scale 4, seven fresh processes/seeds,
ten AB/BA batches, 2,000 deterministic selections per arm/batch, equal sinks
and immutable success products, ratio `sum(control ns) / sum(candidate ns)`.
Any admissible row below `10x` kills the conforming signed-step atom.
Bootstrap and all broader planes remain withheld after the first miss.

## No-contrivance feasibility boundary

There is no admissible distinct P7 implementation under the current laws.
The sealed P3 cost attribution gives a complete 10x budget of `187,063 us`;
candidate-native regular-expression work is `144,501 us` and required
products are `167,382 us`, totaling `311,883 us` or `1.667x` the entire
budget before parser runtime. Native `JSON.parse` reaches only `5.005x` at
scale 4 and `6.083x` at scale 8 on equal immutable products.

Carrier genealogy is exhausted:

- child-result carriers fold into P1–P6;
- direct builders fold into regions, journals or finalizers;
- compound regular expressions fold into staged/generated/manual grammar;
  and
- scalar registers fold into P3/P6.

A future family may not be dispatched by renaming one of those forms. It must
first name and executably reach a genuinely new cost-removal edge.

No domain-neutral fixture can earn the binding second-consumer receipt. The
minimum isolated product is one lossless nested-record grammar authored once
from generic primitives, with nested components, opaque recovery provenance,
original UTF-16 spans, canonical serialize/reparse, and nonzero mechanism
counters for exact live `jsonParser` and the shaped product. Only after every
row clears `10x` may a real Value-owned vertical run. That later vertical must
cover 1,717 raw/1,653 active Webref rows, 1,503 raw/1,439 active
property/function/type rows, the 60-row Values 5 overlay and 53 Keyframes
references across 51 files, while deleting superseded splitter/scanner
slices. P4's handwritten same-body CSS pattern is permanently inadmissible.

## Boundary

A2 remains private tranche-development evidence. Production source, CSS,
Value, Keyframes, API, formation, candidate packing, release, ABI freeze and
BBNF remain blocked. Release status is `NO RELEASE`.
