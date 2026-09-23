SERVED MODEL: claude-opus-5[1m]

# The totality corpus — what it proves, and what it does not

Authored at **X.P.W1.a**, 2026-09-17, under `docs/tranches/X/parse-that/waves/W1.md`
(sha256 `519df03ff21b48f3b2c4f352d6a4d8ae98c86d3dde117ba786b6c924204c6d09`) §5 `X.P.W1.a`,
§3 item 1, §6 **G-1**, §2c rows L73 / L220–222, §4 rows L138–139.

> **Goal (§5.a)**: _coverage becomes a number the harness prints, over the exact surface
> value.js ships._

This is the wave-level `harness/README.md`'s sibling, not its substitute: that file is
unit `.e`'s at close and describes all three instruments. This one describes only the
totality corpus.

## Run it

```
node harness/totality/derive.mjs            # writes manifest.json from source
node harness/totality/derive.mjs --check    # asserts manifest vs source, then reports
```

Both are run **from `<p2>`** (`/Users/mkbabb/Programming/parse-that-css-totality-p2`).
`--check` is **G-1's literal invocation**.

Plain `node`. No `tsx`, no `npm ci`, no `node_modules` under `<p2>` — **Q-1** (the fresh
root has no root `package.json`, and creating one would be the §3a file-bound-expansion
trigger that invalidates the wave). Every foreign tree is addressed by absolute path from
`lib/config.mjs` and read **read-only**; each root is overridable by env (`VALUE_JS_ROOT`,
`KF_ROOT`, `PROTO_WORKSPACE`, `PARSER_PROOF_DIR`) so the instrument is portable off this
box without editing its bytes.

## What it proves

1. **The 52 are the 52.** `manifest.json` is **derived by script from
   `src/css/index.ts` at run time** — never hand-typed. `lib/surface.mjs` contains **zero
   export names**: it parses the barrel's `export [type] { … } from "…"` blocks, so a
   reformat cannot move the derived set and a surface change always does.

   The derivation is **double-read**: the export-block parse (52 = 33 types + 19 runtime;
   7 grammar + 1 syntax + 3 timeline + 8 stylesheet) and, independently, G-1's own
   2026-08-03 baseline arithmetic re-derived in-process (**51 block members + 1 single-line
   `export { coerceToSyntax }` = 52**). `--check` fails if the two disagree with each other.

2. **The manifest cannot go stale silently.** `--check` compares the manifest to a fresh
   derivation on **counts, name sets, and each name's kind and slice** — strictly stronger
   than the count equality G-1's wording names, because a _rename_ preserves the count.
   Four falsifiers were run at authoring, each exiting non-zero (true exit, unpiped):

   | #   | mutation                                                         | reading                                               |
   | --- | ---------------------------------------------------------------- | ----------------------------------------------------- |
   | 1   | delete a manifest type (`CssLinearStop`), counts left stale      | ``source exports `CssLinearStop`, manifest omits it`` |
   | 2   | delete it **and** make the counts self-consistent (51 = 32 + 19) | count disagreement + omission + slice disagreement    |
   | 3   | **rename** `parseCssColor`→`parseCssColour` — count stays 52     | `counts … EQUAL`, `sets *** DIVERGED ***`             |
   | 4   | the **source** grows a 53rd export                               | `derived 53 … manifest 52 *** DISAGREE ***`           |

   Falsifier 4 ran against a scratchpad copy of `src/css/{index,types}.ts` via
   `VALUE_JS_ROOT`. **No byte of value.js's own source tree is ever written** (§3a),
   re-confirmed after every falsifier by
   `git -C …/value.js status --porcelain -- src api demo test e2e` → 0 lines.

3. **Coverage is classified, not asserted.** `lib/classify.mjs` reproduces `coverage.md`'s
   legend exactly — **TOTAL** = covered by name _and_ shape · **PARTIAL** = present but
   narrower, _with what is missing named_ · **ABSENT** = no peer. Both limbs must hold for
   TOTAL. A candidate that is present but satisfies no cell is **PARTIAL, not ABSENT**:
   that distinction is the difference between _unimplemented_ and _narrower than the
   contract_, and it is what the legend means.

   The shape limb's cells are **derived from the frozen unions** in `src/css/types.ts`
   wherever one exists — 13 colour spaces, 4 timing kinds, 2 keyframe-selector kinds,
   5 timeline kinds, 7 range phases, 9 stylesheet-item kinds, 8 `ParseIssue` codes. Add a
   14th colour space to the frozen union and a 14th cell appears with no byte of this
   harness moving. Where no frozen union enumerates a vocabulary (`CssScalar` / `CssCall` /
   `CssList` are re-exported from `../value`), the cells are labelled **DECLARED** and
   carry their citation. Every cell prints its provenance; the two modes never impersonate
   one another (**L-16**).

   A candidate that **throws** fails the cell and is counted in a `throws` column. That is
   the R1 contract measured, not a defect swallowed: `(source: string) => ParseResult<T>`
   is total by construction, so a parser that throws has already failed its shape.

4. **Per-slice and in aggregate.** Two cuts, because the lane reads it two ways: the
   barrel's own module slices, and **the nine public parsers each on its own row** — folding
   the parser band's observation that the probe _"targets ALL nine public parsers, so the
   colour wave discharges only its slice and the probe stays wired until the whole surface
   is total."_

5. **The kf seam column is separate.** `coverage.md`'s Finding F-3 — _every one of the 37
   KF-consumed symbols is exported by `src/css/index.ts`; zero orphan imports_ — is
   **measured, not quoted**: `lib/kf-seams.mjs` derives the seam from
   `keyframes-v-exec/src` and reproduces the record's census to the digit (**37 distinct ·
   75 occurrences · 27 files · 29 line-hits**, orphans **0**). Per §5.a the column is
   printed under its own heading and **never merged into the 52**;
   `assertDisjointFromManifest` asserts the separation rather than trusting it.

## The three candidates, and why three

An instrument that can only ever print ABSENT has not been shown to be able to print TOTAL.

| candidate         | role                                                                           | reading at 2026-09-17                                          |
| ----------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `published-4.0.0` | **positive control** — the vendored sha-pinned `@mkbabb/value.js@4.0.0` `/css` | **51 TOTAL · 1 PARTIAL · 0 ABSENT**; kf column **37/37 TOTAL** |
| `c14-assay`       | **negative control** — the C14 W0-only mirror, the gate-time census subject    | **runtime 0 TOTAL / 3 PARTIAL / 16 ABSENT · types 0/0/33**     |
| `p2-native`       | the lane's own distance — the fresh root ships no CSS surface                  | **0 / 0 / 52**                                                 |

The negative control's reading is `coverage.md` Surface 1's **published tally, reproduced
rather than restated** (§1a _"Runtime tally: 0 TOTAL / 3 PARTIAL / 16 ABSENT"_; §1b
_"Type tally: 0 TOTAL / 0 PARTIAL / 33 ABSENT"_). That reproduction is this instrument's
own correctness evidence.

The positive control is read against the **vendored, sha-pinned published tarball**, never
the working-tree dist — parser-band **G6**: the repo's own `dist/subpaths/css.js` differs
from what 4.0.0 ships, and that dist-drift is a separately ledgered finding.

## What it does **not** prove

- **Not a product claim (L-16).** Every block is labelled SOURCE (read from disk) or
  API-TEST (a call into a candidate's module). Nothing here is a proof of a product, a
  speed claim, or a release condition.
- **Not a defect report against value.js 4.0.0.** `coverage.md`'s own words: the census is
  _assay-vs-frozen-contract_ coverage. The shipped surface is total and is a complete
  superset of everything keyframes imports.
- **Not a grammar.** X.P.W1 ports instruments. `p2-native` reads 0/0/52 because no CSS
  surface exists in the fresh root, and that distance _is_ the wave's subject, not its
  failure.
- **Not a bar.** This instrument classifies; it sets no threshold and publishes no
  pass/fail on any plane.

## Findings recorded at authoring (dated, beside — never folded into a sealed record)

**A-F1 — the kf column's assay reading is 2/37, not the record's 3/37.** `W1.md` §5.a and
`coverage.md` Surface 2 both carry _3/37_ for the assay. Measured here: **2 PARTIAL / 35
ABSENT of 37**. Cause, measured: `parseCssColor` is **not** one of the 37 kf-consumed
symbols — `grep -rn 'parseCssColor' keyframes-v-exec/src` returns **0**, and it appears
nowhere in Surface 2's own 37-row table — yet Surface 2's Finding B counts it among the
three assay peers. _3 PARTIAL is correct for the **52**; carried into the **37**-symbol
column it is 2._ `coverage.md` is a sealed gate record (**E-3**): read, re-measured, never
folded in place.

**A-F2 — published 4.0.0's `parseCssColor` does not accept `color-mix()`.** Measured:
`parseCssColor("color-mix(in oklch, red, blue)")` → `ok:false`, code `css_syntax`,
`expected ["CSS color"]`. `coverage.md` Surface 1 §1a lists `color-mix` in the _assay's_
Missing column, which reads as implying the frozen contract covers it. At the published
bytes it does not. This is the positive control's sole PARTIAL. No grammar is written by
this wave; the row is recorded as the lane's standing input.

**A-F3 — `rgb(from red r g b)` is a typed refusal, and that is the contract working.**
`parseCssColor(source)` takes no context, and the frozen `ParseIssue` union carries
`color_context_required` for exactly this class (`expected ["context-free color"]`). The
relative-colour cell therefore passes on `ok:true` **or** on that derived code, and on
nothing else — a bare `css_syntax`, or a throw, still fails it. The accepted code is read
from the derived union, so deleting it from `types.ts` breaks the cell loudly rather than
widening the taxonomy silently.

**A-F4 — the positive control earned its keep immediately.** Its first run reported five
PARTIALs; **three were this harness's own errors**, not the candidate's: two probe inputs
that failed for a reason other than the cell's subject (`@scroll-timeline`'s
`source: selector(#x)`; `@property` without its `initial-value` descriptor) and two wrong
return-shape expectations (`serializeCssColor` returns `Result<string, ColorIssue>`, not a
bare string; `serializeTimelineOptions` returns the declaration map, not a string). All
four were cured against the measured contract before landing. A runner with no positive
control would have published those three as candidate gaps. **This is the §12 false-precision
exposure, caught by construction.**

## Layout

```
harness/totality/
  derive.mjs          the gate entry (G-1). write mode | --check mode
  manifest.json       DERIVED — never hand-edit; --check is what makes an edit red
  lib/config.mjs      absolute roots, env-overridable (Q-1)
  lib/surface.mjs     the derivation: the 52 + the frozen union vocabulary
  lib/kf-seams.mjs    the 37-symbol kf column + the F-3 orphan measurement
  lib/probes.mjs      the shape cells, DERIVED and DECLARED, each with provenance
  lib/candidates.mjs  the three candidates and their peer maps
  lib/classify.mjs    the TOTAL/PARTIAL/ABSENT runner
  lib/report.mjs      the printed reading
```
