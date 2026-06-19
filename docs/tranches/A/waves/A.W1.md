# A.W1 — CSS-parser removal

- **Band:** subtraction · **Class:** contracting (CSS leaves the public API) · **Dep:** A.W0 (preferred order; can run after A.W0 closes or in parallel)
- **Gate:** `proof:no-css-surface` — born-RED today (17 CSS symbols confirmed in `dist/index.d.ts`)
- **Version:** 0.10.0 (the contracting change — a semver-minor under pre-1.0 convention)
- **Folds (locked decisions):** D2 (parse-that = primitives, value.js = grammar), D3 (delete CSS, keep json/csv), D8 (all() footgun stays VALUE.JS-SIDE for now)

---

## Context

The CSS parser in `parsers/css/` is "L1.5" (as the index comment says), frozen at an
intermediate spec level, and has **zero non-test consumers** in the constellation.
Confirmed:

```
$ grep -rn "parseSingleValue\|parseFunctionArgs\|cssParser\|CssNode\|CssColor\|MediaQuery\|KeyframeBlock" \
    /Users/mkbabb/Programming/value.js/src/ 2>/dev/null
(zero hits)
```

value.js imports only the combinator core from parse-that:
`Parser`, `all`, `any`, `regex`, `string`, `whitespace`, `dispatch`, `memoize`,
`ParserState`, `mergeErrorState` — none are CSS surface symbols. The CSS grammar
at value.js's `src/parsing/` is the authoritative grammar that IS consumed and IS
maintained. Two grammars exist where one is authoritative; the campaign adjudicates:
**parse-that = primitives; value.js = the one grammar** (D2, D3).

The CSS source lives in:

```
typescript/src/parse/parsers/css/    (8 files, 1,202 LoC total)
  index.ts      63 lines
  media.ts     322 lines
  rule.ts      256 lines
  scan.ts       93 lines
  selector.ts  173 lines
  specificity.ts 48 lines
  types.ts     144 lines
  value.ts     103 lines

typescript/test/
  css-diagnostics.test.ts        925 lines
  css-fairness-validation.test.ts 200 lines
  css-parse.test.ts              662 lines
  css-recovery-demo.test.ts      288 lines
  test/benchmarks/css-comprehensive.bench.ts (separate benchmark)
  Total test LoC: 2,075
```

Before deletion, the **scanner technique** in `parsers/css/scan.ts` is worth
harvesting. The inline `skipWsAndComments` loop (lines 36-49 of scan.ts) is the
only substantial technique not already present in the core:

```ts
export function skipWsAndComments(state: ParserState<unknown>): void {
    const src = state.src;
    let i = state.offset;
    while (i < src.length) {
        const ch = src.charCodeAt(i);
        if (ch <= 32) { i++; continue; }
        if (ch === 47 /* / */ && i + 1 < src.length && src.charCodeAt(i + 1) === 42 /* * */) {
            const end = src.indexOf("*/", i + 2);
            if (end === -1) break;
            i = end + 2;
            continue;
        }
        break;
    }
    state.offset = i;
}
```

The monolithic byte-loop pattern (inline charCode scan + `indexOf` for block-comment
end) is the "technique" D7 says to keep — harvest it as a standalone core export
before the CSS parser goes.

The `parseSingleValue`/`parseFunctionArgs` exports that were exposed as a "SOTA single-value
reader" (see `css/index.ts:39`) are removed with the CSS surface — value.js has its own
equivalent reader and never imported these from parse-that.

---

## Scope

### S1 — Harvest: `skipWsAndComments` technique

**Motivation.** The inline whitespace+comment scanner is a reusable pattern for any
grammar that needs to ignore CSS/C-style `/* ... */` block comments. The core currently
has `trimStateWhitespace` (whitespace only) but not a whitespace+block-comment variant.
Consumers building CSS-like grammars on top of parse-that's primitives would benefit
from having this in the core.

**Deliverable.** Before any deletion, extract `skipWsAndComments` (and the minimal
helper `skipWs` — though the core's `trimStateWhitespace` is equivalent) into
`src/parse/utils.ts` as exported helpers:

```ts
/** Skip ASCII whitespace (≤U+0020). Equivalent to trimStateWhitespace() but
 *  operates inline without the fast-exit branch. */
export function skipWhitespace(state: ParserState<unknown>): void { ... }

/** Skip ASCII whitespace + CSS/C-style block comments (/* ... *‌/).
 *  Does NOT skip line comments (//) — those are not part of CSS. */
export function skipBlockComments(state: ParserState<unknown>): void { ... }
```

These join the exports barrel at `src/parse/index.ts`. The CSS parser's internal uses
of these helpers become the harvest target; after the harvest, the CSS parser itself is
deleted.

**Falsifiable check.** `import { skipBlockComments } from "@mkbabb/parse-that"` resolves
after the build.

### S2 — Delete `parsers/css/` (8 files)

**Deliverable.** Remove the entire `typescript/src/parse/parsers/css/` directory and all
its files:

```
index.ts media.ts rule.ts scan.ts selector.ts specificity.ts types.ts value.ts
```

No migration — value.js has its own parallel grammar. The deletion is pure subtraction.

**Falsifiable check.** `ls typescript/src/parse/parsers/css/` → no such directory.

### S3 — Delete CSS test files (5 files)

**Deliverable.** Remove:

```
test/css-diagnostics.test.ts
test/css-fairness-validation.test.ts
test/css-parse.test.ts
test/css-recovery-demo.test.ts
test/benchmarks/css-comprehensive.bench.ts
```

**Falsifiable check.** `ls test/css-*.test.ts` → no matches; vitest lists zero CSS test cases.

### S4 — Clean `parsers/index.ts`

**Breach.** `parsers/index.ts:3` re-exports all CSS surface symbols:

```ts
export { cssParser, specificity, parseSingleValue, parseFunctionArgs } from "./css/index.js";
export type {
    CssNode, CssValue, CssColor, CssSelector, CssDeclaration,
    KeyframeBlock, KeyframeStop, MediaQuery, MediaCondition, MediaFeature,
    RangeOp, SupportsCondition, Specificity,
} from "./css/index.js";
```

**Cure.** Remove these two export blocks. `parsers/index.ts` retains only:

```ts
export { jsonParser } from "./json.js";
export type { JsonValue } from "./json.js";
export { csvParser } from "./csv.js";
export { escapedString, quotedString, numberParser } from "./utils.js";
```

**Falsifiable check.** `grep -c "cssParser\|parseSingleValue\|CssNode" typescript/src/parse/parsers/index.ts` → 0.

### S5 — Remove CSS-related devDependencies

**Breach.** `package.json` `devDependencies` carries `postcss` and `css-tree` — both
CSS benchmark competitors with no remaining use after the CSS grammar and its bench
are deleted.

**Cure.** Remove `postcss` and `css-tree` from `devDependencies`. The remaining
benchmark competitors (`arcsecond`, `chevrotain`, `ohm-js`, `parjs`, `parsimmon`,
`peggy`, `nearley`, `moo`) remain (used by JSON benchmarks).

**Falsifiable check.** `node -e "const p=require('./package.json'); console.log('postcss' in p.devDependencies, 'css-tree' in p.devDependencies)"` → `false false`.

### S6 — Update `dist-surface.test.ts` with CSS-absent assertion

**Motivation.** The existing `dist-surface.test.ts` checks that the dist exports
the same set as the source barrel. After deletion, the CSS symbols leave the source
— the gate's positive check adjusts naturally (source no longer has them). Add a
NEGATIVE assertion to lock in the absence permanently:

```ts
it("CSS parser symbols are absent from the dist (inv-A-1)", () => {
    if (!hasDist) return;
    const dist = readFileSync(DIST_INDEX, "utf8");
    const CSS_SYMBOLS = [
        "cssParser", "parseSingleValue", "parseFunctionArgs",
        "CssNode", "MediaQuery", "KeyframeBlock", "CssColor",
    ];
    const present = CSS_SYMBOLS.filter(s => dist.includes(s));
    expect(present, `CSS symbols must not be in the dist: ${present.join(", ")}`).toEqual([]);
});
```

**Falsifiable check.** This test is GREEN on a post-deletion build and RED on the
current dist (the `proof:no-css-surface` gate catches the same breach at CI level).

### S7 — Version bump to 0.10.0

**Cure.** `package.json` `"version"` → `"0.10.0"`. The CSS symbols leave the public
API — a contracting change signaled by the minor bump under pre-1.0 convention.

---

## Born-RED gate

**Gate name:** `proof:no-css-surface` (NEW node script in `scripts/`).

**The REAL observable (inv-A-1).** The CSS parser has zero consumers in the
constellation — its dist presence is pure surface pollution. The real breach
is that a consumer importing `@mkbabb/parse-that` gets CSS symbols on the namespace
that have no meaning for them (and that value.js, the constellation's grammar layer,
redundantly re-publishes via its own surface). The gate bites this directly: it reads
the built `dist/index.d.ts` and asserts zero CSS symbols are present.

**Gate script:**

```js
// scripts/proof-no-css-surface.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist/index.d.ts");

let dist;
try {
    dist = readFileSync(DIST, "utf8");
} catch {
    console.error("FAIL: dist/index.d.ts not found — run npm run build first");
    process.exit(1);
}

const CSS_SYMBOLS = [
    "cssParser", "parseSingleValue", "parseFunctionArgs",
    "CssNode", "CssValue", "CssColor", "CssSelector", "CssDeclaration",
    "KeyframeBlock", "KeyframeStop", "MediaQuery", "MediaCondition",
    "MediaFeature", "RangeOp", "SupportsCondition", "Specificity",
    "specificity",
];

const present = CSS_SYMBOLS.filter(s => dist.includes(s));
if (present.length > 0) {
    console.error("FAIL: CSS symbols still in dist:", present.join(", "));
    process.exit(1);
}
console.log(`proof:no-css-surface GREEN — zero CSS symbols in dist (${CSS_SYMBOLS.length} checked).`);
```

Add to `package.json scripts`:
```json
"proof:no-css-surface": "node scripts/proof-no-css-surface.mjs"
```

**Today's tree result.** Exits 1: all 17 CSS symbols present in `dist/index.d.ts`
(the barrel's `export * from './parsers/index.js'` pulls them all in; confirmed by
reading the built dist).

**Green condition.** All 17 CSS symbols absent from `dist/index.d.ts` after a clean
build following the deletion. The full test suite (json, csv, combinator tests)
remains green — no regression to the core.

---

## The `all()` drop-undefined note (D8, DEFERRED)

The `all()` combinator in `leaf.ts:125` has this clause:

```ts
if (state.value !== undefined) {
    matches.push(state.value);
}
```

This silently drops `undefined` from the result array. The P0 `linear-gradient`
crash in value.js was caused by this (a sub-parser returning `undefined` was
silently dropped, producing an incorrect array). Decision D8: the fix is
value.js-side (explicit `any()` branches — not changing `all()`'s global
semantics here). This decision stands for A.W1: do NOT touch `all()`. Record
the footgun in the KILL/deferred ledger; the correctness fix is a future parse-that
wave coordinated with value.js.

---

## Dependencies

- **A.W0** (preferred sequence: manifest hygiene before the contracting delete,
  so 0.10.0 ships with both fixes). Can run in parallel if urgency demands.
- **No value.js or keyframes.js dependency.** The deletion is additive on the
  downstream side: value.js imports only core symbols (unchanged); no re-pin
  is needed at A.W1 (value.js still satisfies `^0.9.0`; if value.js O.W0 bumps
  the pin to `^0.10.0` for a semantic signal, that is an O.W0 editorial choice,
  not a requirement).

---

## Excluded from this wave

- **Rust CSS parser.** `rust/parse_that/src/parsers/css/` is NOT touched. D3 is
  TS-only; the Rust grammar is idiomatic Rust and has different consumers. Any
  Rust CSS parser decision is a separate, later item.
- **`all()` footgun fix.** Deferred per D8 (recorded in KILL/deferred ledger).
- **json/csv parsers.** These are kept as the combinator showcase. They are NOT
  in scope for deletion.
- **The `takeUntilAnySpan` LUT scanner.** Already in the core (`span.ts`) —
  no harvest needed for this one. The CSS scanner's `skipWsAndComments` is the
  only unique technique worth preserving.
