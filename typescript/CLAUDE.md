# typescript/

TypeScript parser combinator library. Published as `@mkbabb/parse-that` v1.0.0 —
the Tranche S **breaking cut** (the `*Span` surface excision + the `chain()`
falsy-seed fix / `chainError` retirement + the `PACKRAT_ARMED` epoch latch; cut at
S.H4). Reaches keyframes.js only via value.js's `^1.0.0`-carrying 2.0.x follow-on.

## Structure

```
src/parse/
  index.ts          Barrel (the `.` export) — re-exports from all sub-modules
  core.ts           `./core` subpath — the zero-side-effect primitive set
  parser.ts         Parser<T> class + combinators (then/or/chain/map/many/wrap/…), recover(), ParserFunction, flags
  leaf.ts           Leaf parsers: string, regex, eof, any, dispatch, all, whitespace
  packrat.ts        Opt-in packrat memoization + WDM left recursion (memoize/mergeMemos); armed behind PACKRAT_ARMED
  packrat-entry.ts  `./packrat` subpath entry
  lazy.ts           getLazyParser(), createLazyCached(), lazy decorator
  split.ts          splitBalanced(), containsDelimiter() — format-time balanced splitting
  state.ts          ParserState<T>, Span, ParserContext, spanToString(), mergeSpans()
  ansi.ts           Zero-dep ANSI helpers (bold, red, green, etc.) — NO_COLOR + TTY aware
  utils.ts          mergeErrorState(), Diagnostic, collectDiagnostic(), Suggestion, SecondarySpan
  utils-entry.ts    `./utils` subpath entry
  debug.ts          parserDebug(), statePrint(), formatDiagnostic(), formatAllDiagnostics()
  diagnostics.ts    `./diagnostics` subpath entry
  parsers/
    index.ts        Barrel re-exports for domain parsers
    json.ts         JsonValue type, jsonParser() — combinator JSON
    csv.ts          csvParser() — RFC 4180 CSV
    utils.ts        escapedString(), quotedString(), numberParser()
test/                          # 13 *.test.ts files (derive: `ls test/*.test.ts | wc -l`)
  chain.test.ts             chain() falsy-seed thread + error short-circuit + chainError 0-caller scan (C-16)
  csv.test.ts               CSV parsing with quoted fields
  debug.test.ts             Diagnostics unit tests (summarizeLine, formatExpected, labels, suggestions)
  dist-surface.test.ts      Publish-discipline: dist == source surface; zero `*Span`, zero CSS symbols
  json.test.ts              JSON combinator parser
  json-vectors.test.ts      Shared JSON test vectors (grammar/tests/json/)
  math.test.ts              Math expressions with operator precedence (left recursion)
  memoize.test.ts           Left recursion via .memoize() / .mergeMemos()
  print.test.ts             parserPrint() output
  reentrancy.test.ts        Per-parse error state + nested/interleaved parse re-entrancy
  split.test.ts             splitBalanced() format-time splitting
  validate-parsers.test.ts  Competitor parsers vs JSON.parse()
  verify-parse-output.test.ts  Hand-written JSON correctness
  setup.ts                  CWD setup
  utils.ts                  Test helpers
  benchmarks/               Competitor implementations + comprehensive bench suite
scripts/                       # proof-*.mjs runtime gates (wired to npm run proof:*)
```

## Build

```bash
npm ci
npm test          # vitest (pool: forks, 8GB heap) — 13 test files
npm run build     # vite → dist/parse.js (ES) + parse.cjs (CJS) + .d.ts (multi-entry: parse/core/diagnostics/packrat/utils)
npx tsc --noEmit  # type check
npm run proof:all # runtime gate roster (manifest, subpath, packrat-*, no-span-surface, no-dead-combinator, perf, …)
```

## Key Exports

```ts
// Core (parser.ts)
Parser<T>, ParserState<T>, ParserFunction<T>, Span

// Leaf parsers (leaf.ts)
string(s), regex(r), eof(), any(...), all(...), dispatch(table), whitespace

// Lazy (lazy.ts)
Parser.lazy(fn), getLazyParser(), createLazyCached()

// Span helpers (state.ts) — the Span TYPE + its two helpers survive; the 15
// closure `*Span` BUILDERS were excised in the 1.0.0 cut (S.H2, zero consumers).
mergeSpans(a, b), spanToString(span, src)

// Packrat / left recursion (packrat.ts, opt-in — off the default LL(1) path)
memoize(p), mergeMemos(p), resetPackrat()

// Balanced splitting (split.ts)
splitBalanced(), containsDelimiter()

// Domain parsers (parsers/)
jsonParser(), JsonValue, csvParser()
escapedString(), quotedString(), numberParser()

// Diagnostics (utils.ts + debug.ts)
enableDiagnostics(), disableDiagnostics()
Diagnostic, Suggestion, SecondarySpan
collectDiagnostic(), getCollectedDiagnostics(), clearCollectedDiagnostics()
formatDiagnostic(), formatAllDiagnostics()

// Error recovery (parser.ts)
parser.recover(sync, sentinel)        // parse past errors, collect Diagnostic snapshots
```

## Conventions

- `strict:true`, `verbatimModuleSyntax:true`, ES2022+ target
- Zero runtime deps — competitors (chevrotain, parsimmon, etc.) are benchmark-only
- Single export path: `.` → `dist/parse.js`
- No `src/bbnf/` — extracted to [`bbnf-lang`](https://github.com/mkbabb/bbnf-lang)
- Mutable ParserState with `save()`/`restore()` for backtracking
- Float64-safe numeric memo keys: `parser.id * 2**32 + offset` (offset added WHOLE,
  no mask; fail-loud `RangeError` past the safe-integer ceiling — PT-Q2). The old
  `<< 20` shift aliased at id ≥ 4096 and masked offsets ≥ 1 MB — both fixed.
- Packrat is OPT-IN and OFF the default LL(1) path. The epoch machinery is armed
  behind a `PACKRAT_ARMED` latch that trips on the first `memoize()`/`mergeMemos()`
  construction (S.H1) — `packratEnter`/`packratExit`/`resetPackrat` are no-ops until
  then, so a non-memoizing grammar allocates zero packrat Maps per parse.
- `dispatch(table)` for O(1) ASCII first-char branching (single-arg; the speculative
  2nd-byte subTable was retracted at PT-Q5)
- Flag-based trim/EOF inlined in the `Parser` hot path
- `sepBy` strictly interleaving `elem (sep elem)*` — never accepts trailing separators
- `chain(fn)` threads EVERY successful value (including falsy `0`/`''`/`false`) into
  the continuation; it short-circuits only on error (C-16, the 1.0.0 cut)
