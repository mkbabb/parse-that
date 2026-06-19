# A — The founding tranche: pure parsing primitives

**Tranche letter**: A — parse-that's FIRST tranche (no predecessor). The tranche
that dissolves the CSS grammar, heals the packrat soundness defect, ships the
manifest hygiene fixes, and delivers the subpath split + `SpanParser` tagged-union
dispatch — transforming parse-that into a pure parsing primitives library that
value.js builds its ONE canonical grammar on top of.

**Opened**: 2026-06-18, from the Constellation Lib-Perf + Grammar Campaign
(`keyframes.js/docs/tranches/M/CONSTELLATION-CAMPAIGN.md` §2, decisions D2–D4,
D7). The campaign drives all three repos in a coordinated arc; parse-that A is the
**upriver** leg — its deliverables unblock value.js O.

**Mode**: DEVELOPMENT (charter). A.W1–A.W3 dispatch on explicit user ratification.
A.W0 is low-risk manifest hygiene and ships first (version bump to 0.9.1).

---

## §0 — Why this tranche exists

parse-that has no tranche system. A is its founding tranche — every subsequent
tranche letter follows this one's shape conventions.

Three forces converge:

**1. A grammar that nobody consumes.** The CSS parser (`parsers/css/` — 1,202 LoC,
8 files, 5 test files, 2,075 LoC) is "L1.75", frozen at an intermediate spec level,
and has **zero non-test consumers in the constellation** (confirmed: value.js imports
only `Parser`, `all`, `any`, `regex`, `string`, `whitespace`, `dispatch`, `memoize`
from parse-that — zero CSS symbols; the `parseSingleValue`/`parseFunctionArgs` exports
sit on the dist surface unused). Meanwhile value.js ships its own parallel CSS grammar
at `src/parsing/` that IS consumed and IS maintained. Two grammars exist where one is
authoritative. Decision D2 (campaign blueprint) resolves this: **parse-that = primitives;
value.js = the one grammar.**

**2. A packrat bug that is documented but unsound.** The `MEMO` in `packrat.ts` is
keyed on `parser.id` only, not `(id, offset)`. The file itself contains the comment:
*"KNOWN LIMITATION … latently unsound for the non-recursive same-parser-at-two-offsets
case."* The `memoize.test.ts` test `"id-only memo mis-restores across offsets"` pins
the **defective** behaviour with a comment saying *"SOUND target (flips when
(id, offset)-keying lands)"*. The fix helper `getCijKey(parser, state)` — the correct
`(id << 20) | offset` compound key — is already written (`packrat.ts:36-38`) and used
in `LEFT_RECURSION_COUNTS` but NOT in the `MEMO` cache lookup or storage (lines 62,
76-82). The cure is surgical: route `MEMO` through `getCijKey` rather than `p.id`.

**3. A `typesVersions` entry that points to a path that does not exist.** The
`package.json` `typesVersions` block maps `"*"` to `["dist/src/parse/index.d.ts"]`.
That path does not exist — the actual types are at `dist/index.d.ts` (confirmed live:
`ls dist/src/` → no such directory). Any TypeScript consumer using `moduleResolution:
node` falls back to the `exports.types` field and gets the correct types; a consumer
on an older resolution strategy hits TS7016. The `exports["."].types` field is correct
(`"./dist/index.d.ts"`), so the fix is removing the stale `typesVersions` block.

These three are independent and purely subtractive (the CSS deletion) or surgical
(the packrat fix, the manifest fix). KISS governs: small changes, no new language,
no new architecture beyond what the perf research already ratified.

---

## §1 — The tranche thesis

**parse-that becomes pure parsing primitives.** The combinator core
(`parser.ts`, `leaf.ts`, `span.ts`, `split.ts`, `state.ts`, `packrat.ts`,
`lazy.ts`, `utils.ts`, `debug.ts`, `ansi.ts`) is the product. The domain parsers
that belong here are: `json.ts` (the combinator showcase), `csv.ts` (the terse
example). The CSS grammar does not belong: it is value.js's responsibility (D2).

The `parseSingleValue`/`parseFunctionArgs` functions that were exposed as a
"SOTA reader" are removed with the rest of the CSS surface — value.js has its
own equivalent at `src/parsing/index.ts` and never imported these from
parse-that (confirmed).

The subpath split (`./core`, `./diagnostics`, `./packrat`, `./utils`) in A.W3 is
the structural corollary: if the library is primitives, consumers should be able
to import exactly what they need without pulling the full barrel. The `SpanParser`
tagged-union also in A.W3 is the perf corollary: the V8 megamorphic IC ceiling
(documented at `docs/perf-optimization-ts.md §5`) is attacked by enum-dispatch —
the `future-research.md §7` item, ratified in the campaign as D7.

---

## §2 — The invariant set

These hold at every wave's close and at the tranche close.

- **inv-A-1 — zero CSS surface.** The built `dist/index.d.ts` contains zero
  occurrences of `cssParser`, `parseSingleValue`, `parseFunctionArgs`, `CssNode`,
  `MediaQuery`, `KeyframeBlock`, `CssColor`, `CssSelector`. No CSS grammar code
  in `src/` or `dist/`. *The CSS-parser removal is permanent and complete.*
- **inv-A-2 — packrat sound.** `memoize.test.ts` "id-only memo mis-restores"
  assertion targets the SOUND behaviour (error at offset 0 — the commented-out
  SOUND target flips to active). The existing left-recursion tests (`should 123456`,
  `should mSL`, `should sS`, `should math again`) remain green — the fix changes
  the non-recursive case without breaking the LR-grow use.
- **inv-A-3 — manifest resolves.** `typesVersions` removed or corrected; a
  consumer on any TypeScript `moduleResolution` strategy resolves `@mkbabb/parse-that`
  types without TS7016. `sideEffects: false` present. Package version at `0.9.1`
  (A.W0) through `0.10.0` (A.W1 — the contracting change: CSS surface gone).
- **inv-A-4 — json and csv unbroken.** `json.test.ts`, `csv.test.ts`,
  `json-vectors.test.ts`, `validate-parsers.test.ts` all green through every wave.
  No regression to the combinator core.
- **inv-A-5 — value.js edge unbroken.** value.js imports ONLY the combinator
  core symbols (`Parser`, `all`, `any`, `regex`, `string`, `whitespace`, `dispatch`,
  `memoize`, `ParserState`, `mergeErrorState`) — none of these are touched by the
  CSS deletion. A.W1 does not perturb the edge. Confirmed at A.W1 close by a
  typecheck of value.js against the post-deletion dist.

---

## §3 — The wave map

| Wave | Title | Scope | Born-RED gate | Version |
|---|---|---|---|---|
| **A.W0** | Manifest hygiene | `typesVersions` fix; `sideEffects: false` | consumer resolves types (gate: `node --input-type=module` + `import type` from the dist succeeds without TS7016) | **0.9.1** |
| **A.W1** | CSS-parser removal | Delete `parsers/css/` (1,202 LoC) + 5 CSS test files (2,075 LoC) + `postcss`/`css-tree` devDeps; clean `parsers/index.ts`; **harvest** the monolithic byte-loop scanner technique (the `skipWs`/`skipWsAndComments`/`matchStr`/`parseIdent`/`takeUntilAnySpan` pattern) into the core before deletion | `proof:no-css-surface` — built `dist/index.d.ts` contains zero CSS symbols | **0.10.0** |
| **A.W2** | Packrat `(id,offset)` FIX | Route `MEMO` through `getCijKey`; flip the `memoize.test.ts` SOUND assertion to active | `memoize.test.ts` "id-only memo mis-restores" flips: `st.isError === true` (born-RED on today's tree) | **0.10.1** |
| **A.W3** | Subpath split + `SpanParser` tagged-union | `./core ./diagnostics ./packrat ./utils` export map; `SpanParser` discriminated union + `switch`-dispatch in `span.ts`; multi-entry vite build | (a) subpath import resolves; (b) CSS bench shows `SpanParser` dispatch ≥10% over `regexSpan` baseline on a representative span-heavy grammar | **0.11.0** |

---

## §4 — Wave detail

### A.W0 — Manifest hygiene

**Premise.** Two manifest defects ship silently in 0.9.0:

1. `typesVersions["*"]["*"]` = `["dist/src/parse/index.d.ts"]` — the path
   `dist/src/parse/` does not exist (the build emits to `dist/`, not `dist/src/parse/`).
   A consumer on `moduleResolution: node` (Node10 or pre-bundler) will hit TS7016
   on a plain `import { Parser } from "@mkbabb/parse-that"` — the types are found
   only via `exports["."].types` (`./dist/index.d.ts`), which works on modern resolvers
   but not legacy ones. Since value.js and keyframes.js use `moduleResolution: bundler`,
   they are unaffected in practice; but any downstream consumer on the Node10 path
   gets a broken types experience from 0.9.0.
2. `sideEffects` is absent from `package.json`. A bundler (Rollup, Vite, esbuild)
   that tree-shakes a consumer importing only `Parser` from the barrel cannot
   confirm the import is side-effect-free and may over-include. Adding
   `"sideEffects": false` unlocks tree-shaking for ALL downstream consumers
   (including value.js and keyframes.js, which import a strict subset of the barrel).

**Scope (S-clauses).**

- S1: Remove `typesVersions` from `package.json` (the entire block — the `exports`
  map is already correct and sufficient for modern TS 5.x consumers; the stale
  `typesVersions` block does nothing useful and actively misleads old resolvers).
- S2: Add `"sideEffects": false` to `package.json`.
- S3: Bump version to `0.9.1`.

**Born-RED gate (inv-A-3).** Create a minimal ESM consumer fixture
(`test/manifest-gate.mjs`) that does:
```js
import { createRequire } from "module";
const r = createRequire(import.meta.url);
const pkg = r("../package.json");
// Gate 1: typesVersions absent or points to an existing path
if (pkg.typesVersions) {
    const path = Object.values(pkg.typesVersions)[0]["*"][0];
    const { existsSync } = await import("node:fs");
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    if (!existsSync(resolve(__dirname, "..", path))) {
        process.exit(1); // stale path
    }
}
// Gate 2: sideEffects present
if (pkg.sideEffects !== false) process.exit(1);
```
This gate runs on `node test/manifest-gate.mjs` (no build required — it reads
`package.json` directly). Born-RED today: `typesVersions` points to a
non-existent path (gate 1 fires). Green after: `typesVersions` removed,
`sideEffects: false` present.

**Dependencies.** None.

---

### A.W1 — CSS-parser removal

**Premise.** The CSS parser was purpose-built as a combinator showcase (the
"L1.75" parse.that-native grammar) and as a performance artifact (the
monolithic byte-loop scanners — `skipWs`, `skipWsAndComments`, the
`takeUntilAnySpan` technique). Both purposes are served without keeping the
grammar:

- The combinator showcase is better served by `json.ts` and `csv.ts`, which
  are terse, correct, and tested against spec vectors.
- The scanner technique is already partially present in the core:
  `trimStateWhitespace` (inline charCode loop in `leaf.ts:236-254`),
  `takeUntilAnySpan` (LUT-based, `span.ts`). The CSS scanner's
  `skipWsAndComments` (memchr2-style `*/` scan) is worth harvesting as a
  `takeUntilSpanFrom` or inline comment-skip utility before deletion.

Decision D3 (campaign blueprint): **DELETE** — pure subtraction, no migration
needed (value.js already has its own grammar; it never imported the CSS surface).

**Scope (S-clauses).**

- S1: **Harvest** before delete. Before removing `parsers/css/scan.ts`,
  extract the `skipWsAndComments` comment-skip loop into a standalone inline
  helper in `utils.ts` or as an exported `skipCssComments(state)` primitive
  (decision: if value.js expresses a need, export it; otherwise inline in
  the JSON/CSV helpers that use whitespace skip). The `takeUntilAnySpan`
  LUT scanner is already in the core — no harvest needed.
- S2: Delete `typescript/src/parse/parsers/css/` (all 8 files, 1,202 LoC):
  `index.ts`, `media.ts`, `rule.ts`, `scan.ts`, `selector.ts`, `specificity.ts`,
  `types.ts`, `value.ts`.
- S3: Delete the 5 CSS test files (2,075 LoC):
  `test/css-diagnostics.test.ts`, `test/css-fairness-validation.test.ts`,
  `test/css-parse.test.ts`, `test/css-recovery-demo.test.ts`,
  `test/benchmarks/css-comprehensive.bench.ts`.
- S4: Clean `parsers/index.ts`: remove the CSS re-exports (`cssParser`,
  `specificity`, `parseSingleValue`, `parseFunctionArgs`, and all CSS types).
  Keep `jsonParser`, `csvParser`, `escapedString`, `quotedString`, `numberParser`.
- S5: Remove `postcss` and `css-tree` devDependencies from `package.json`
  (they are CSS-grammar benchmark competitors — zero use after deletion).
- S6: Update `dist-surface.test.ts` to NOT expect the 15 span functions list
  to include CSS symbols (the gate enumerates span functions, not CSS — no
  change needed there) and add a negative assertion confirming `cssParser` is
  absent from the dist.
- S7: Bump version to `0.10.0` (the contracting change: CSS symbols leave the
  public API — a semver-major in spirit; use 0.10.0 as the pre-1.0 convention).

**Born-RED gate (inv-A-1).** `proof:no-css-surface`:

```js
// scripts/proof-no-css-surface.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = readFileSync(resolve(__dirname, "../dist/index.d.ts"), "utf8");
const CSS_SYMBOLS = [
    "cssParser", "parseSingleValue", "parseFunctionArgs",
    "CssNode", "CssColor", "CssSelector", "CssDeclaration",
    "KeyframeBlock", "KeyframeStop", "MediaQuery", "MediaCondition",
    "MediaFeature", "RangeOp", "SupportsCondition", "Specificity",
    "specificity",
];
const present = CSS_SYMBOLS.filter(s => dist.includes(s));
if (present.length > 0) {
    console.error("CSS symbols still in dist:", present);
    process.exit(1);
}
console.log("proof:no-css-surface GREEN — zero CSS symbols in dist.");
```

Born-RED today: all 16 CSS symbols present in `dist/index.d.ts` (confirmed —
`export * from './parsers/index.js'` re-exports them all). Green after: the CSS
surface is gone and the build succeeds without it.

**The `all()` drop-undefined footgun (D8 note).** The `all()` combinator in
`leaf.ts:125` drops `undefined` values from its result array (the `if (state.value
!== undefined) matches.push(state.value)` clause). This was the root of the
P0 `linear-gradient` crash in value.js — value.js worked around it with explicit
`any()` branches. The decision (D8) is: do NOT change `all()`'s semantics here
(it would alter global `all()` behaviour with blast radius across all consumers
including value.js); instead, record it as a parse-that-A evaluation item. If
the O.W0 value.js fix exposes this as a primitive issue that parse-that should
resolve, the fix is scoped to a post-A.W1 wave with explicit test coverage.

**Dependencies.** A.W0 (manifest hygiene should land before the delete).

---

### A.W2 — Packrat `(id,offset)` FIX

**Premise.** The `MEMO` map in `packrat.ts` is keyed on `p.id` (the parser
object's integer identifier), not on `(id, offset)`. The correct compound key
`(id << 20) | (state.offset & 0xFFFFF)` — `getCijKey(parser, state)` — is
already written and used for `LEFT_RECURSION_COUNTS`. The `MEMO` lookups
at lines 62 (`MEMO.get(p.id)`) and 82 (`MEMO.set(p.id, ...)`) and 99
(`MEMO.get(p.id)`) and 113 (`MEMO.set(p.id, ...)`) all need to use
`getCijKey` instead.

The existing test `"id-only memo mis-restores across offsets"` pins the
**defective** behaviour:

```ts
// CURRENT (unsound): the offset-6 cache mis-restores at offset 0.
expect(st.isError).toBe(false);
expect(st.offset).toBe(6);
expect(st.value).toBe("hello");
// SOUND target (flips when (id, offset)-keying lands):
//   expect(st.isError).toBe(true);
```

The wave flips this: the commented-out SOUND assertions become the active ones;
the current (defective) assertions are removed.

**Scope (S-clauses).**

- S1: In `packrat.ts`, change all four `MEMO.get(p.id)` and `MEMO.set(p.id, ...)`
  calls to use `getCijKey(p, state)` as the key. (`MEMO` changes type from
  `Map<number, ParserState<unknown>>` to remain `Map<number, ParserState<unknown>>`
  — the key type is already `number`, so this is a drop-in swap.)
- S2: In `memoize.test.ts`, flip the "id-only memo mis-restores" test:
  remove the defective assertions; uncomment the SOUND target:
  `expect(st.isError).toBe(true)` (the sound result: `P` at offset 0 fails
  because `[a-z]+` cannot match `'X'`).
- S3: Confirm the four existing LR tests (`should 123456`, `should mSL`,
  `should sS`, `should math again`) remain green. The LR-grow mechanism relies
  on the count-bounded `LEFT_RECURSION_COUNTS` (already position-keyed via
  `getCijKey`) — the `MEMO` position-keying change means each `(parser, offset)`
  pair has its own cache slot, which is the correct semantics. The seed-and-grow
  loop still works because `mergeMemos` and `memoize` are called at the SAME
  offset each grow iteration — the key is consistent within a single LR step.

**Born-RED gate (inv-A-2).** `memoize.test.ts` itself IS the gate — the
"id-only memo mis-restores" test is already written and already asserts the
defective behaviour, meaning it would FAIL (go red) if the fix were applied
without updating the assertions. The born-RED condition: run `vitest run
test/memoize.test.ts` on today's tree with the S1 fix (position-keyed MEMO)
but WITHOUT the S2 assertion flip — the test fails. After S1+S2, the test
suite is green AND the SOUND behaviour is asserted.

Concretely: the `st.isError` assertion at line 98 (`expect(st.isError).toBe(false)`)
becomes the born-RED indicator for the SOUND fix. Today it passes (defective
behaviour is green). After the fix, the `false` assertion fails — that is the
born-RED moment. The S2 assertion flip makes it green again on the sound
observable.

**Dependencies.** A.W1 (not strictly required, but order matters for the version
sequence; A.W2 can run independently of A.W1 in parallel if needed).

---

### A.W3 — Subpath split + `SpanParser` tagged-union

**Premise.** Two independent improvements that are sequenced together because
they both touch the build configuration:

**Subpath split.** The single-barrel `"."` export forces every consumer to pull
the entire build graph. value.js needs only the combinator core; a consumer that
only uses diagnostics should not pull the packrat tier. The glass-ui subpath
pattern (established in the constellation campaign) applies: a multi-entry vite
build produces named chunks, and the `exports` map gains subpaths that resolve
to those chunks.

Proposed subpaths:
- `"."` (root) — the current full barrel; unchanged for backward compatibility.
- `"./core"` — `Parser`, `ParserState`, `ParserContext`, `Span`, leaf parsers,
  span combinators (including `SpanParser`), `lazy`, `split`. The zero-side-effect
  primitive set.
- `"./diagnostics"` — `enableDiagnostics`, `disableDiagnostics`, `Diagnostic`,
  `Suggestion`, `SecondarySpan`, `collectDiagnostic`, `getCollectedDiagnostics`,
  `clearCollectedDiagnostics`. The diagnostic accumulation tier.
- `"./packrat"` — `memoize`, `mergeMemos`, `resetPackrat`. Opt-in LR tier.
- `"./utils"` — `skipWhitespace`, `skipBlockComments` (harvested from CSS scanner
  in A.W1 S1), `jsonParser`, `csvParser`, `escapedString`, `quotedString`,
  `numberParser`. Utility functions and domain parsers.

**`SpanParser` tagged-union.** The `future-research.md §7` item: a
discriminated union type for the span-combinator tier that enables V8's switch
jump-table dispatch instead of closure-per-combinator megamorphic dispatch. The
perf-optimization-ts.md §5 documents the megamorphic IC ceiling (documented as
the structural ceiling of the closure-based pattern). The Rust `SpanParser` enum
in `rust/parse_that/src/span_parser/mod.rs` is the reference implementation.

The TS equivalent: a `SpanParser` discriminated union (tag + payload) with a
`call(state)` method that `switch`es on the tag. The span-combinator functions
(`regexSpan`, `manySpan`, `sepBySpan`, `wrapSpan`, `optSpan`, `skipSpan`,
`nextSpan`, `altSpan`, `takeUntilAnySpan`) become constructors that return
`SpanParser` instances. A `Parser<Span>` bridge allows the span tier to compose
with the combinator tier.

**Scope (S-clauses).**

- S1: Multi-entry vite build — `vite.config.ts` gains an `entry` map with
  `core`, `diagnostics`, `packrat`, `utils` in addition to the existing
  `parse` (root barrel). Each entry exports only its tier's symbols.
- S2: `package.json` `exports` map gains `"./core"`, `"./diagnostics"`,
  `"./packrat"`, `"./utils"` entries (each with `types`, `import`,
  `require` fields matching the build output).
- S3: `SpanParser` discriminated union in `span.ts`: a `SpanParserKind` string
  enum (or numeric enum for V8 jump-table eligibility), a `SpanParser` type with
  `kind: SpanParserKind`, and a `callSpan(sp: SpanParser, state: ParserState<Span>)`
  dispatch function. Existing span functions are shimmed to return `SpanParser`
  instances. The `Parser<Span>` bridge converts via `.map()`.
- S4: Bump version to `0.11.0` (subpath split is a contracting change in the
  direction of additive — new surface, no removal — but the version signals the
  new subpath API is stable).

**Born-RED gate (inv-A-3 extension + new perf gate).** Two clauses:

**Gate 1 (subpath resolves):** A node import fixture:
```js
// test/subpath-gate.mjs — run after build
import { Parser } from "@mkbabb/parse-that/core";
import { memoize } from "@mkbabb/parse-that/packrat";
if (typeof Parser !== "function") process.exit(1);
if (typeof memoize !== "function") process.exit(1);
console.log("subpath-gate GREEN");
```
Born-RED today: the `"./core"` subpath does not exist in `package.json` —
the import throws `ERR_PACKAGE_PATH_NOT_EXPORTED`.

**Gate 2 (SpanParser ≥10% perf):** A vitest bench
(`test/benchmarks/span-dispatch.bench.ts`) that runs a span-heavy CSS-ident
scan grammar under (a) `regexSpan`-only (the baseline, using closures) and (b)
`SpanParser`-tagged dispatch. The gate asserts the tagged variant is ≥10% faster
on at least one of the benchmark inputs (consistent with the `future-research.md §7`
expected impact of 10–20%). The baseline is measured first (born-RED: the
`SpanParser` type does not exist yet; the bench import fails).

**Dependencies.** A.W1 (CSS deletion should be done — the build config change
is simpler on a clean `parsers/` directory). A.W2 is independent and can
parallelize.

---

## §5 — The KILL / deferred ledger

Items considered for this tranche and explicitly disposed:

| Item | Disposition | Rationale |
|---|---|---|
| `all()` drop-undefined footgun (`leaf.ts:125`) | **DEFERRED to post-A** (D8) | Changing `all()` global semantics has constellation-wide blast radius; the P0 was fixed on value.js's side; the fix belongs in a dedicated correctness wave with explicit value.js coordination |
| byte-lossless CST / comment/trivia preservation | **OUT** (D5) | A rewrite, not a primitive addition; semantic idempotence (value.js O.W5) is the contracted form of "bidirectional"; parse-that has no serializer to make bidirectional |
| `SpanParser` codegen tier for BBNF | **DEFERRED** | The `SpanParser` type (A.W3) is the prerequisite; BBNF codegen changes are a separate tranche B concern once the primitive is stable |
| Rust CSS parser retention | **N/A** | The Rust CSS parser lives in `rust/parse_that/src/parsers/css/` and is NOT removed by this tranche — the campaign decision (D3) is TS-only; the Rust grammar is idiomatic Rust and has different consumers |
| Node10 `moduleResolution` compatibility beyond `typesVersions` fix | **OUT of A.W0** | The `exports` map already works for Node16/bundler; a full `main`/`types` field for Node10 is a KISS violation (adds complexity for a deprecated resolution strategy); remove the stale `typesVersions` block, do nothing else |
| A packrat soundness rewrite (full Warth-Douglass-Millstein) | **DOWNGRADED to surgical fix** (D4) | The WDM head-recursion algorithm is a from-scratch reimplementation on a tier with zero production consumers; the campaign adjudicates: fix the MEMO keying (A.W2's surgical change), not a full rewrite |
| `console.error` diagnostic leak in `parser.ts` | **DEFERRED to A.W3 or later** | Currently fires when diagnostics are enabled and a parse fails (`parseState` in `parser.ts:48`); gated by `isDiagnosticsEnabled()`. The leak is real but controlled (opt-in path). Record: add a `setDiagnosticLogger(fn)` override to let consumers redirect it |
| CSV parser removal | **KEPT** | csv.ts is a terse, correct, spec-grade combinator example with no dependency on value.js; it serves as the second domain-parser showcase alongside json.ts |

---

## §6 — Critical files (the binding sites)

| File | Relevance |
|---|---|
| `typescript/package.json` | A.W0: `typesVersions` removal + `sideEffects`; A.W3: subpath exports map |
| `typescript/src/parse/packrat.ts` | A.W2: `MEMO.get(p.id)` → `MEMO.get(getCijKey(p, state))` (6 sites: lines 61, 76, 82 in `memoize()` + lines 99, 112, 114 in `mergeMemos()`) |
| `typescript/src/parse/parsers/css/` (8 files, 1,202 LoC) | A.W1: entire directory deleted |
| `typescript/src/parse/parsers/index.ts` | A.W1: CSS re-exports removed |
| `typescript/test/css-*.test.ts` (5 files, 2,075 LoC) | A.W1: entire set deleted |
| `typescript/test/memoize.test.ts:88-103` | A.W2: "id-only memo mis-restores" assertion flipped to SOUND |
| `typescript/vite.config.ts` | A.W3: multi-entry build config |
| `typescript/src/parse/span.ts` | A.W3: `SpanParser` tagged-union added |
| `typescript/test/dist-surface.test.ts` | A.W1: negative assertion for CSS symbols added |

---

## §7 — Cross-repo discipline

- parse-that A does NOT make `file:` links to value.js or keyframes.js. All
  consume-edges go through the registry (`publish then re-pin`).
- A.W0 ships as `0.9.1` (manifest fix, backward-compatible). A.W1 ships as
  `0.10.0` (contracting: CSS surface removed from the public API). The semver
  is deliberate: pre-1.0, the contraction is minor-bumped under the convention
  that API surface is not yet stable.
- value.js re-pins to `^0.10.0` after A.W1 publishes (the `any()` combinator
  it imports is unchanged; the re-pin is a `^`-range move, not a breaking
  consumer change). keyframes.js currently imports parse-that 0-consumer
  (zero direct imports from `@mkbabb/parse-that` in `src/` — it consumes
  through value.js); no re-pin needed on the kf side.
- The DAG (constellation campaign §5):
  ```
  A.W0 (0.9.1 manifest) ─┐
  A.W1 (CSS removal)      ├─► value.js O.W0 (P0 crashes)
  A.W2 (packrat FIX)      │
  A.W3 (subpath+SpanU) ───┘
  ```
  value.js O.W0 can proceed against parse-that `^0.9.0` (the P0 crashes are
  value.js-side fixes per D8); it does NOT wait for A.W1. A.W3 publishes as
  `0.11.0` and unblocks value.js O.W1/O.W2 (which may consume `./core` for
  the subpath-split pre-work).

---

## §8 — Mode + authority

A.W0 is IMPLEMENTATION (low-risk manifest fix; no source change). A.W1–A.W3
dispatch on explicit user ratification. Authority: the Constellation
Lib-Perf + Grammar Campaign
(`keyframes.js/docs/tranches/M/CONSTELLATION-CAMPAIGN.md`) under the standing
mandate — NO legacy, NO workarounds, KISS, no contrivance. D2/D3/D4/D7 are
locked decisions; this charter implements them.
