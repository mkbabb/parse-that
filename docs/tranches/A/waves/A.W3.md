# A.W3 — Subpath split + SpanParser tagged-union

- **Band:** perf + structure — **Class:** additive (new exports, new subpaths; existing single-barrel `.` is kept as re-export so no consumer breaks)
- **Gate:** (a) a TS bench shows `SpanParser` dispatch ≥10% faster than the `regexSpan`-as-closure baseline on a span-eligible scan-loop — born-RED today because `SpanParser` does not exist; (b) `import { regexSpan } from "@mkbabb/parse-that/core"` resolves (subpath import exits 0 in a type-check fixture) — born-RED today because the `./core` subpath is absent from `package.json`.
- **Decision:** D7 (the SpanParser tagged-union technique per future-research §7) + the subpath split structural work (consumed by value.js-O's own subpath split downstream).
- **Dep:** A.W1 (CSS removal simplifies the barrel; A.W3 splits what remains), A.W2 (packrat subpath is clean only after the soundness fix)

---

## Context

### The structural problem: one giant barrel, no subpaths

Today `@mkbabb/parse-that` has a single export path (`.` → `dist/parse.js`). The full barrel
re-exports 40+ symbols from 8 source files: core combinators, span combinators, diagnostics,
packrat, domain parsers (`json`, `csv`), utilities. A consumer that wants only the span
combinators for a hot CSS scan pulls the full diagnostics infrastructure, the packrat tier, the
JSON and CSV parsers, the debug formatter. After A.W1 removes the CSS parser (1202 LoC + 2075
LoC of tests), the barrel is clean enough to split without circular-dependency risk.

The subpath split is the structural pre-work value.js-O requires: when value.js imports only
`./parsing` from parse-that it must not pull the packrat tier, the full diagnostics stack,
or domain parsers. The campaign blueprint (§3, O.W1) gates value.js's subpath pre-work on
parse-that's subpaths being available. This is the parse-that side of that edge.

### The performance problem: closures and megamorphic IC

Every span combinator (`regexSpan`, `manySpan`, `sepBySpan`, `wrapSpan`, `optSpan`, …) is
today a closure allocated at construction time. A CSS-grade scan loop that calls many distinct
`regexSpan` instances triggers V8's megamorphic inline-cache: the JIT sees a different closure
shape at each call site, preventing speculative inlining. The `dispatch` function in `leaf.ts`
already shows the payoff of first-byte table dispatch (O(1) lookup, zero IC pollution). The
future-research §7 item proposes the same technique for span combinators: a `SpanParser`
tagged-union whose `call()` method dispatches via `switch` on a string or numeric tag — V8
optimizes a switch over a small closed set to a jump table, eliminating per-closure megamorphic
IC.

The Rust `SpanParser` enum (the motivation for §7) achieves this structurally because Rust
enums are value types dispatched by the compiler. The TS equivalent is a discriminated union
with a tag field and a `call(state)` method on a shared `SpanParser` class (or a factory
function returning tagged objects). The `switch` over the tag in `call()` is what V8 will
optimize to a jump table — not magic, just closing the shape-polymorphism that closures open.

**Baseline source.** The `css-comprehensive.bench.ts` is deleted in A.W1 (CSS removal) — its
benchmark data is NOT available as the baseline for A.W3. The MEASURE-FIRST baseline is
captured by the new `span-baseline.bench.ts` (a `regexSpan`-only bench with no `SpanParser`
import, authored in S3) run on today's tree BEFORE SpanParser is written. The SpanParser bench
must show ≥10% improvement over this fresh baseline on the real machine.

**The future-research §7 formulation (verbatim):**

> Introduce a `SpanParser` tagged union (discriminated union in TS) that mirrors the Rust
> `SpanParser` enum. Each variant stores its configuration inline. `call()` dispatches via
> a `switch` on the tag — V8 optimizes this to a jump table, eliminating closure allocation
> and virtual dispatch overhead.
>
> **Expected impact**: ~10–20% improvement for BBNF-generated TS parsers on span-eligible
> rules. Requires changes to the TS BBNF codegen path.

The 10% threshold in the born-RED gate is the lower bound of that estimate. The gate measures
it on real inputs, not a projection.

---

## Scope

### S1 — Four subpaths in `package.json` `exports`

**Breach.** Today `package.json` has one export:
```json
".": { "types": "./dist/index.d.ts", "import": "./dist/parse.js", "require": "./dist/parse.cjs" }
```
The `./core`, `./diagnostics`, `./packrat`, and `./utils` subpaths are absent. A consumer
writing `import { regexSpan } from "@mkbabb/parse-that/core"` gets a Module Not Found error.

**Cure.** Add four subpath entries after A.W1 completes (so the CSS surface is gone):

| Subpath | Entry file | Contents |
|---|---|---|
| `./core` | `src/parse/core.ts` (new barrel) | `Parser`, `ParserState`, `ParserFunction`, `ParserContext`, `Span`, `string`, `regex`, `eof`, `any`, `all`, `dispatch`, `whitespace`, `Parser.lazy`, `getLazyParser`, `createLazyCached`, `mergeErrorState`, `splitBalanced`, `containsDelimiter`, `escapedString`, `quotedString`, `numberParser` + all 15 span combinators: `stringSpan`, `regexSpan`, `manySpan`, `sepBySpan`, `wrapSpan`, `optSpan`, `skipSpan`, `nextSpan`, `altSpan`, `takeUntilAnySpan`, `negateSpan`, `peekSpan`, `notSpan`, `minusSpan`, `lookAheadSpan`, `SpanParser` (new, A.W3's addition) |
| `./diagnostics` | `src/parse/diagnostics.ts` (new barrel) | `enableDiagnostics`, `disableDiagnostics`, `collectDiagnostic`, `getCollectedDiagnostics`, `clearCollectedDiagnostics`, `Diagnostic`, `Suggestion`, `SecondarySpan`, `formatDiagnostic`, `formatAllDiagnostics`, `parserDebug`, `parserPrint` |
| `./packrat` | `src/parse/packrat.ts` (existing, post-A.W2 fix) | `memoize`, `mergeMemos`, `resetPackrat` |
| `./utils` | `src/parse/utils-barrel.ts` (new barrel) | `skipWhitespace`, `skipBlockComments` (harvested from A.W1 S1), `jsonParser`, `csvParser` |

The root `.` export is KEPT as a re-export of all four subpaths — no existing consumer breaks.
The `typesVersions` stale-pointing bug is fixed as part of A.W0 (the manifest hygiene wave);
A.W3 only adds the new subpath entries.

The Vite build config gains four entry points (one per subpath) so each gets its own compiled
chunk. The `sideEffects: false` field (introduced at A.W0) enables tree-shaking at the
consumer.

**Falsifiable check.** A node fixture:
```sh
node --input-type=module <<'EOF'
import { regexSpan, Parser } from "@mkbabb/parse-that/core";
import { memoize } from "@mkbabb/parse-that/packrat";
import { enableDiagnostics } from "@mkbabb/parse-that/diagnostics";
console.log(typeof regexSpan, typeof memoize, typeof enableDiagnostics, typeof Parser);
EOF
```
→ prints `function function function function`, exits 0. Today: exits 1 with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

### S2 — `SpanParser` tagged-union added to `./core`

**Problem (from future-research §7).** Every `regexSpan(r)` call allocates a new closure
`regexSpanParser` (a function object in V8's heap, shape-unique per regex). A scan loop
calling `manySpan(regexSpan(/[a-z]+/))` at construction time is fine, but a grammar that
constructs span parsers in a hot path (e.g. a grammar-compilation loop) pays allocation and
IC-pollution costs.

**The tagged-union shape.** A `SpanParser` is an object with a discriminant `tag` field plus
variant-specific data stored inline. The `call(state)` method dispatches on `tag` via
`switch`. The variants mirror the existing span function set:

```ts
type SpanParserTag =
    | "regex"
    | "string"
    | "many"
    | "sepBy"
    | "wrap"
    | "opt"
    | "skip"
    | "next"
    | "alt"
    | "takeUntilAny"
    | "negate"
    | "peek"
    | "not"
    | "minus"
    | "lookAhead";

class SpanParser {
    readonly tag: SpanParserTag;
    // variant data stored as typed fields (no boxing to unknown)
    // ...
    call(state: ParserState<Span>): ParserState<Span> {
        switch (this.tag) {
            case "regex": /* inline regexSpan body */ break;
            case "many":  /* inline manySpan body  */ break;
            // ... one branch per variant
        }
    }
}
```

The key invariant: `SpanParser.call()` never allocates. All closures live on the `SpanParser`
object itself (the sticky regex, the LUT for `takeUntilAny`, the inner/left/right references
for compound variants). The `switch` is the ONLY dispatch mechanism — no `this.fn = fn` slot
that would re-introduce shape polymorphism.

Factory functions (`spanRegex(r)`, `spanMany(inner, min?, max?)`, etc.) return `SpanParser`
instances. The existing `regexSpan`, `manySpan`, etc. functions remain as thin wrappers (or
are updated to delegate to `SpanParser`) — no API break.

**Falsifiable check.** `import { SpanParser } from "@mkbabb/parse-that/span"` resolves and
`new SpanParser("regex", r)` (or the factory `spanRegex(r)`) returns an object with `.call`
method. `tsc --noEmit` passes.

### S3 — Born-RED bench: `SpanParser` ≥10% faster than `regexSpan`-closure baseline

**Breach (born-RED today).** `SpanParser` does not exist. The comparison bench cannot import
it. The born-RED condition is that the comparison bench file (`span-parser.bench.ts`) fails to
import on the current tree.

**MEASURE-FIRST discipline — two-phase approach.** The baseline is captured BEFORE `SpanParser`
is written, using a `regexSpan`-only bench that requires no `SpanParser` import. This establishes
the `closureHz` reference on the real machine (today's V8 JIT, today's CPU). The comparison
bench is authored in this wave spec but runs only after `SpanParser` lands.

**Phase 1 — baseline bench (runs today, no SpanParser import):**

```ts
// test/benchmarks/span-baseline.bench.ts — author NOW, run BEFORE SpanParser lands
import { bench, describe } from "vitest";
import { regexSpan, manySpan } from "../../src/parse/span.js";
import type { Span } from "../../src/parse/span.js";
import { ParserState } from "../../src/parse/state.js";

// Representative identifier scan (same grammar the comparison bench will use)
const identClosure = manySpan(regexSpan(/[a-zA-Z_-][a-zA-Z0-9_-]*/));
const src = "abc-def foo-bar baz-qux ".repeat(1000);

describe("regexSpan closure baseline", () => {
    bench("regexSpan closure (baseline)", () => {
        const state = new ParserState<Span>(src);
        identClosure.parser(state);
    });
});
```

This bench runs on today's tree (no `SpanParser` reference). Its output `closureHz` is the
reference point. Born-RED today: the comparison bench (`span-parser.bench.ts`) CANNOT run
(SpanParser absent), but this baseline bench CAN run — establishing the measurement before
SpanParser exists, as MEASURE-FIRST requires.

**Phase 2 — comparison bench (authors now, runs after SpanParser lands):**

```ts
// test/benchmarks/span-parser.bench.ts — born-RED today (SpanParser absent)
import { bench, describe } from "vitest";
import { regexSpan, manySpan, SpanParser } from "../../src/parse/span.js";
import type { Span } from "../../src/parse/span.js";
import { ParserState } from "../../src/parse/state.js";

const identClosure = manySpan(regexSpan(/[a-zA-Z_-][a-zA-Z0-9_-]*/));
const identSpan = SpanParser.many(SpanParser.regex(/[a-zA-Z_-][a-zA-Z0-9_-]*/));
const src = "abc-def foo-bar baz-qux ".repeat(1000);

describe("SpanParser dispatch vs regexSpan closure", () => {
    bench("regexSpan closure (baseline)", () => {
        const state = new ParserState<Span>(src);
        identClosure.parser(state);
    });

    bench("SpanParser tagged-union", () => {
        const state = new ParserState<Span>(src);
        identSpan.call(state);
    });
});
```

**Gate condition.** `SpanParser tagged-union` bench result ≥ 1.10× the closure baseline.
The ≥10% threshold comes from the future-research §7 lower-bound estimate. If the measured
improvement on the real machine is less than 10% but positive, the gate is revised to the
measured delta (the improvement is real and worth having; the threshold is an estimate, not
a law). If negative, the SpanParser design is iterated before merging.

**Born-RED today.** `span-parser.bench.ts` references `SpanParser` which does not exist →
the import fails → `vitest bench span-parser` exits 1. `span-baseline.bench.ts` runs
(no SpanParser reference) — this is the correct MEASURE-FIRST posture.

### S4 — Subpath bundle isolation: `./core` pulls zero packrat / diagnostics

**Breach (born-RED today).** The subpaths don't exist. After they do, the isolation must hold.

**Cure.** The `./core` subpath entry point (`src/parse/core.ts`) imports only from
`./parser.js`, `./state.js`, `./span.js`, `./leaf.js`, `./lazy.js`, `./split.js`, and
`./utils.js`. It does NOT import from `./packrat.js` or `./debug.js`. The `SpanParser` class
lives in `span.ts` alongside its companions — no new inter-file dependency is introduced.

**Falsifiable check.** After build:
```sh
node -e "
  // The core chunk must not reference the packrat or diagnostics modules
  const src = require('fs').readFileSync('./dist/core.js', 'utf-8');
  console.assert(!src.includes('resetPackrat'), 'core imports packrat');
  console.assert(!src.includes('formatDiagnostic'), 'core imports diagnostics');
  console.log('isolation: OK');
"
```

Alternatively via a rollup/vite bundle analyzer: `./core` import graph must not contain
`packrat.ts` or `debug.ts`.

---

## Born-RED gate (composite — two clauses, both born-RED today)

**Gate A — subpath import resolves.**
```sh
node --input-type=module -e 'import { regexSpan } from "@mkbabb/parse-that/core"'
```
Today: exits 1 (`ERR_PACKAGE_PATH_NOT_EXPORTED`). After A.W3: exits 0.

**Gate B — SpanParser bench shows ≥10% improvement.**
```sh
cd typescript && npx vitest bench span-parser --reporter=json
```
Today: exits 1 (bench file references non-existent `SpanParser`). After A.W3: exits 0
and the Hz comparison satisfies the ≥10% threshold.

Both clauses are REAL observable behaviors — not a source-shape check, not a file-presence
check. Gate A exercises the Node module resolver against the real `package.json`. Gate B runs
the real V8 JIT over real CSS input and measures real throughput. A `SpanParser` that
compiles but dispatches identically to the closure baseline would fail Gate B.

**Why a bench gate (not just a unit gate) is appropriate here.** The SpanParser is a
performance optimization. Its correctness is verified by S2 (the `tsc` check + the same
output as the closure for the same inputs — added as unit tests alongside). Its REASON for
existing is the dispatch improvement. A correctness-only gate would pass a SpanParser that
wraps the closure (zero improvement). The bench gate ensures the optimization actually
materializes on the real V8 JIT over a real CSS corpus.

---

## Dependencies

- **A.W1 precedes A.W3.** The CSS parser removal (A.W1) cleans the barrel (zero consumers of
  the CSS surface remain in-repo), which makes the subpath split safe. Without A.W1, the
  `./core` subpath would also need to re-export `cssParser` / `parseSingleValue` /
  `parseFunctionArgs` — defeating the split intent.
- **A.W2 precedes A.W3.** The `./packrat` subpath exports `memoize` / `mergeMemos` /
  `resetPackrat`. Splitting an unsound tier under its own subpath before fixing the soundness
  is backwards. After A.W2, the `./packrat` subpath is both structurally clean and
  behaviorally correct.
- **No cross-repo dep.** parse-that A.W3 is internally complete. value.js-O.W1 consumes the
  published subpaths (after parse-that 0.10.0 is cut) — that is a downstream consume edge,
  not a prerequisite here.

---

## Version note

A.W3 lands as **0.11.0** (A.W1 = 0.10.0 for the CSS surface removal; A.W2 = 0.10.1 for the
packrat soundness fix; A.W3 = 0.11.0 for the subpath split + SpanParser). The root `.` export
must not break any existing consumer of the pre-A.W1 API (it re-exports all surviving symbols).
The contracting part is the CSS surface removal (A.W1's wave, version-cut at 0.10.0); the
subpath additions and `SpanParser` are additive on top of the 0.10.x series.

---

## What this wave does NOT change

- The root `.` export — still resolves all non-CSS symbols; existing consumers unaffected.
- The `Parser<T>` class API — `SpanParser` is a separate type, not a replacement.
- The existing span combinator functions (`regexSpan`, `manySpan`, etc.) — kept as-is or
  as thin `SpanParser` factories; no API break.
- The `jsonParser` / `csvParser` domain parsers — re-exported from `.` and from their own
  eventual subpaths (not scoped to this wave; a follow-on addition).
- The packrat API (`memoize`, `mergeMemos`, `resetPackrat`) — behavior unchanged (A.W2 fixed
  the key; A.W3 just splits it to `./packrat`).
- The test suite for existing combinators — passes through A.W3 unchanged.
