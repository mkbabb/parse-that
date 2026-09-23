SERVED MODEL: claude-opus-5[1m]

# `harness/w2/` — one harness, all candidates

Authored by **X.P.W2 unit `.g`** under `value.js/docs/tranches/X/parse-that/waves/W2.md` (sha256
`248eb0889f7ef101591435bd6bd2b6b5efc7e571cf9955a6360338507b29a4cd`) §5 `.g` and §4's Surface-B rows,
against the ratified `experiments/w2/contract/ALGEBRA.md`.

It **extends** W1's three instruments and **never edits them**: `harness/{totality,equivalence,bench}/**`
is execute + read, and an edit there is a `W2.md` §3a halt. Two of W1's modules are *imported* by the
probes below — `totality/lib/classify.mjs` (the verb assay) and `bench/lib/engines.mjs` (the
parse-that dist path) — because a second copy of either would be a second definition of the thing
being measured.

**A per-candidate harness is a defect** (`W2.md` §3 item 7). Every candidate reaches every probe
through one adapter shape, so a probe cannot be tuned to a candidate and a candidate cannot be
tuned to a probe. **No probe holds a per-candidate expectation** — self-authored answer keys are
PRUNED.

---

## 1. The ten probes

| probe                    | gate           | what it reads                                                                                 |
| ------------------------ | -------------- | --------------------------------------------------------------------------------------------- |
| `op-bijection.mjs`       | G-1, G-2, G-12 | the contract's 22-row registry; each lowering's registry; the structural walks                 |
| `eq-six.mjs`             | G-3            | EQ-1..EQ-6 across JS · Wasm · the vendored 4.0.0 third cell                                    |
| `recovery-laws.mjs`      | G-4            | R-LAW-1..5, each with a positive control that must make the checker fire                       |
| `r1-candidates.mjs`      | G-5            | zero throws over 172 + the seven non-string shapes; the published baseline reproduced          |
| `coverage-52-report.mjs` | G-6            | the 52-map joined to **W1's** manifest; verbs from W1's own re-run assay                       |
| `alloc-latch.mjs`        | G-8            | history invariance · steady-state heap · reject-path allocation · reset residue · arena · DM-1 |
| `wasm-audit.mjs`         | G-9            | `WebAssembly.Module.imports` over all kinds · start section · K-9 · K-10                       |
| `substrate-receipt.mjs`  | G-7, G-9       | repo · commit · package version · node version · dist-or-tree, per subject                     |
| `idiom-nocst.mjs`        | G-10           | the built graph · comment-stripped textual zeros · the excess-property `tsc` fixture           |
| `depth-scan.mjs`         | G-11           | the `lazy` ceiling measured at this clock · the scan census · the deep-nesting row             |

Every probe answers `--self-test` or a baseline invocation **with candidates absent**, and every
such run either reproduces a pasted known or exercises a control built to fail. That is the §5 `.g`
sub-gate: *a harness that cannot reproduce the knowns may not judge the unknowns.*

## 2. The adapter contract (what a candidate seat writes)

One file, `experiments/w2/<home>/harness-adapter.mjs`:

```js
export const meta = {
    id: "ac1",                       // one of the four ids fixed at ALGEBRA.md §12
    name: "TAGLESS-TWIN",
    postures: { /* FF-4's declared postures, written BEFORE measurement */ },
    sources: { algebra: [...], js: [...], wasm: [...] },   // three DISJOINT file lists
    artifacts: { jsEntry: "…", dts: "…", wasm: "…" },      // built artifacts
    build: { jsArtifactReproduction: ["npm run build:ac1"] }, // K-9 is read from this
};

export const lowerings = { js: <Lowering>, wasm: <Lowering> };
```

```
<Lowering> = {
    kind: "js" | "wasm",
    registry(): Row[],       // the §4.6 rows: { opId, name, arity, argKinds, symbol }
    labels(): string[],      // the L index; EQ-4 compares INDICES into it
    grammar(): { entries: { "<prod>": "<term name>" }, terms: { "<name>": Term } },
    parse(prod, source, theta?): Product,
    entry(prod): (source: unknown) => ParseResult,   // BND-1, above the algebra
    module?(): WebAssembly.Module,   wasmBytes?(): Uint8Array,   memory?(): WebAssembly.Memory,
    arenaHighWater?(): number,       reset?(): void,             entryNoFreeze?(prod): fn,
    parserGraph?(): unknown[],       // js only — G-10's graph roots
}
```

`Term` is **JSON**: `{ op: "<one of the 22>", args: Arg[] }` with
`Arg = Term | {lit} | {ref} | {reg} | {label} | {code} | {kind}`. A function, class instance, symbol
or getter anywhere under `terms` fails CL-1 — that is the closure test, and it is the difference
between "one algebra" and "one algebra plus whatever the host closure does".

`Product` carries the four parts and the σ coordinates the laws need:

```
{ ok, V, C: [[offset, length, kind]], P: [[start, end]], D: [{code, start, end, expected, actual}],
  far: {f, code, labels}, sigma: {i, depth, arena},
  marks: [{site, at, mark: [i,lenC,lenP,lenD,depth,arena], restored: [...]}],
  recoveries: [{at, skipped: [offset, length], code}] }
```

An absent optional member is **reported as UNREAD with the member named** — no probe invents a
default for it, because a harness that fills in a missing measurement has measured itself.

## 3. The three corpora

`experiments/w2/corpus/build-corpus.mjs` derives all three and `--check` re-derives them:

- **`slice.json`** — §10's shared slice, 527 rows: hex · the 148 named colours · the context
  postures · rgb/hsl in both forms · oklch · `var()` · numeric edges · the DM-2/DM-7 declared marks ·
  clamps · the band's seven unsound accepts · the **generated** GROUND-A cross-product (21 × 10 =
  **210**, plus the six guarded heads as the fixture's own control) · all four timing-function kinds ·
  the stylesheet recovery scenario with N ∈ {1,2,3,5,8} planted sites · the deep-nesting row. It
  carries the eleven **declared third-cell divergence rows** of §10.5 and **no expected values**.
- **`r1.json`** — the 172 (18 × 9 + 10, derived from the probe of record's own data) + the seven
  non-string shapes. See the header comment in `build-corpus.mjs` for the measured correction that
  fixed the boundary corpus at seven **non-strings**.
- **`fuzz-seed.json`** — the PIN, not the rows: `mulberry32` seed `0x5eedc0de`, 30,000 rows
  regenerated by `corpus/fuzz-gen.mjs`, with `rowsSha256` banked so a drifting replay is caught.

## 4. What none of this proves

It does not rank candidates, and it sets **no bar**: `COHESION.md` §0j.E OC-1 rules the bench table
RECORDED-NOT-GATING and ratifies no replacement, so every bench-adjacent print carries
`BAR: OWNER-GATED-PENDING-RATIFICATION` and no probe prints a pass/fail verdict on a speed reading.
It does not cure the 52 (OP-8: G-6 reports). It cannot see a defect its corpora do not contain —
the fuzz corpus is 30,000 rows of a generator this seat wrote, not the language. And a green probe
against one candidate says nothing about another: the kill ledger is `.h`'s, and nothing here
adjudicates.
