# P6-SIR owner adjudication and A1 dispatch

Date: 2026-07-30

Status: **SEALED PROTOTYPE REJECTED BEFORE TIMING — RAW INADMISSIBLE —
P6-A1 ROUTED — ZERO CREDIT — NO RELEASE**

## Ruling

The first P6-SIR prototype does not satisfy its mandatory pre-timing
taxonomy. Its `sepBy` implementation treats both legal negative returns as
ordinary mismatch. A sticky typed fault (`-2`) is converted into success in
all three repetition positions:

| Position | Required return | Observed return | Residual run fault | Public result |
|---|---:|---:|---|---|
| first element | `-2` | `0` | present | success, `fault: null` |
| separator | `-2` | `1` | present | success, `fault: null` |
| later element | `-2` | `1` | present | success, `fault: null` |

The common cause is
`/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-luna/outputs/runtime.mjs:149-172`.
The branches use `< 0` where the signed ABI requires `-1` mismatch to remain
distinct from `-2` typed fault.

The sealed preflight did not exercise those positions. Its direct and
`then`-nested fault rows were excluded from deep equality, and its `sepBy`
probe covered only routine trailing-separator rollback. Therefore
`preflight.ok: true` and the taxonomy `GREEN` claim are false-greens.

## Bound identities

- Sol design commit:
  `b2c7447bac97f948b5b5fefe8d3f0885ab4b3e32`
- Sol design file SHA-256:
  `4f1a3bf0546796a398804c5afc4f1fa1f9ced682fdd86745144fe9d99bcadbbd`
- Original Luna packet:
  `/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-luna/outputs`
- Original Luna manifest SHA-256:
  `d16787b3761e2d8f2eefe7a01ffc8c49da73627123dc1eecf5b0fa1f72e2edb9`
- Original raw SHA-256:
  `7655b467d1345add6053cc83667cd779c61f7a436cbf0d687f1b8e7893107a69`
- Fresh-Sol task:
  `019fb19f-e092-7e60-99af-1226adab7b61`
- Fresh-Sol packet:
  `/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-fresh-sol-adjudication/outputs`
- Fresh-Sol checksum-manifest SHA-256:
  `78cb1aa0897412ed83f43d9d93fccd28b2eccea20d9fe805c571b6a019f0aa27`
- Fresh-Sol report SHA-256:
  `3c170d3c06c67361df1b69e04259735da464f23b0637b472c80e479759b441ce`
- Fresh-Sol findings SHA-256:
  `76006423ba2f2eab350dc884254aba2bed0134a906bce66094a5013cd58d1239`
- Fresh-Sol mutant receipt SHA-256:
  `d9eb24cf7320766ce6b176b08b8209d154ad7900bfacf61f66296c41832267c3`
- Fresh-Sol replay receipt SHA-256:
  `9ef0881f0f4a3e62a826fcc3dc1ac6bc959b77b0e0c82c27aac4137fa9910209`
- Fresh-Sol integrity receipt SHA-256:
  `53ee3c43ac9e7359adef052ecee27920fba56289d8d859c39260b3392a9c54d6`

The owner independently observed exactly six regular Sol files, no
subdirectories, and two green 5/5 checksum passes. The original Luna packet
remains exactly eight regular files with no subdirectories and two green 7/7
manifest passes.

## Evidence disposition

The seven original timing rows are internally coherent:

- seven unique PIDs and process seeds;
- ten alternating AB/BA batches per row;
- 2,000 deterministic selections per arm per batch;
- equal selection sinks; and
- ratio computed as the sum of ten control batch times divided by the sum of
  ten candidate batch times.

The exact ratios span
`0.9563973480051526x`–`1.1820048770512361x`. Every row is below `10x`.
Those bytes remain negative evidence about the defective prototype, but they
were reached through a false-green correctness gate. They are inadmissible
for terminally killing or pruning the conforming signed-step atom.

The exact dispositions are:

- sealed P6 prototype: **REJECT**;
- pre-timing taxonomy: **RED**;
- original raw arithmetic: **GREEN, INADMISSIBLE**;
- `RSR.signed-step` genealogy: **SPLIT**, unchanged;
- surrounding native-closure topology: **FOLD into P3 `19c1e12`**;
- novelty/family credit: **ZERO**;
- atom-level `KILL/PRUNE`: **REVOKED pending P6-A1**;
- bootstrap, CSS, profiles, allocation, GC, IC and deopt: **WITHHELD**;
- formation, product, API, release, Value, Keyframes and BBNF credit:
  **ZERO**.

The original Luna packet and `raw.json` are immutable and must not be
rewritten, relabeled or reused as P6-A1 output.

## P6-A1 transaction

Resume the existing Luna xhigh seat
`019fb16a-09d7-7d80-ae5f-3d894e25855d`; create no task. Its sole new writer
root is:

`/Users/mkbabb/Documents/Codex/2026-07-30/parser-p6-sir-luna-a1/outputs/**`

P6-A1 may copy the sealed P6 prototype into that new root and make only the
following semantic repair:

1. `sepBy` must propagate `-2` from the first element, separator and later
   element without converting the parse to success.
2. Each path must restore its exact local atomic cursor/value/diagnostic
   checkpoint while retaining the sticky fault/frontier evidence required by
   the signed ABI.
3. The public projection must report error with the exact typed fault; it may
   not expose success with a hidden `run.fault`.
4. Direct probes must reach all three positions and compare exact return,
   run state and immutable result. No typed-fault row may be skipped.
5. The existing routine-mismatch rollback, full-grammar alias trap,
   four-fixture native/accepted-M2/candidate equality, safe-integer domain,
   fixed grammar-time dispatch and forbidden-mechanism checks must remain
   green.

No region, slab, journal, scanner, token plane, compiler, VM, generated
grammar, wrapper, fallback, alternate executor, compatibility surface or
per-parse control container may be introduced.

Only after every pre-timing probe is green may P6-A1 produce a new raw
artifact from the exact accepted-M2 scale-4 live `jsonParser` assay:

- seven fresh processes and seeds;
- ten AB/BA batches per row;
- 2,000 deterministic selections per arm per batch;
- equal immutable success values/results and selection sinks; and
- ratio `sum(control ns) / sum(candidate ns)`.

Any corrected raw row below `10x` terminally kills P6-A1 and the conforming
signed-step atom. The remaining already-launched raw processes may finish,
but bootstrap, CSS, profiles and every broader plane remain forbidden after
the first miss. A corrected packet must have its own manifest and raw hash;
the prior raw bytes remain immutable negative evidence.

## Boundary

P6-A1 is an isolated tranche-development assay. It changes no production
source, public runtime surface, package, Value CSS grammar, Keyframes
consumer, release edge or BBNF handoff. Formation remains RED and release
remains `NO RELEASE`.
