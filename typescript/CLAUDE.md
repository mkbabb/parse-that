# typescript/

TypeScript parser combinator library. Published as `@mkbabb/parse-that` v0.7.0.

## Structure

```
src/parse/
  index.ts          Barrel re-exports from all sub-modules
  parser.ts         Parser<T> class, ParserFunction type, memoization, flags
  combinators.ts    (reserved — combinator methods live on Parser class)
  leaf.ts           Leaf parsers: string, regex, eof, any, dispatch, all, whitespace
  lazy.ts           getLazyParser(), createLazyCached(), lazy decorator
  span.ts           regexSpan(), manySpan(), sepBySpan(), wrapSpan()
  state.ts          ParserState<T>, Span, ParserContext types (152 lines)
  utils.ts          mergeErrorState(), error tracking globals
  debug.ts          parserDebug(), parserPrint(), statePrint(), addCursor() (200 lines)
  json-fast.ts      Monolithic JSON parser — charCode dispatch, no combinators (376 lines)
  parsers/
    index.ts        Barrel re-exports for domain parsers
    json.ts         JsonValue type, jsonParser() — combinator JSON
    csv.ts          csvParser() — RFC 4180 CSV
    toml.ts         TOML parser (placeholder)
    utils.ts        escapedString(), quotedString(), numberParser()
test/
  csv.test.ts             CSV parsing with quoted fields
  json.test.ts            JSON combinator parser
  json-vectors.test.ts    Shared BBNF test vectors (grammar/tests/json/)
  math.test.ts            Math expressions with operator precedence
  memoize.test.ts         Left recursion via .memoize() / .mergeMemos()
  print.test.ts           parserPrint() output
  validate-parsers.test.ts  Competitor parsers vs JSON.parse()
  verify-parse-output.test.ts  Hand-written JSON correctness
  setup.ts                CWD setup
  utils.ts                Test helpers
  benchmarks/             9 competitor implementations + comprehensive bench suite
```

## Build

```bash
npm ci
npm test          # vitest (pool: forks, 8GB heap)
npm run build     # vite → dist/parse.js (ES) + parse.cjs (CJS) + .d.ts
npx tsc --noEmit  # type check
```

## Key Exports

```ts
// Core (parser.ts)
Parser<T>, ParserState<T>, ParserFunction<T>, Span

// Leaf parsers (leaf.ts)
string(s), regex(r), eof(), any(...), all(...), dispatch(table, fallback?), whitespace

// Lazy (lazy.ts)
Parser.lazy(fn), getLazyParser(), createLazyCached()

// Span variants (span.ts — zero-copy)
regexSpan(), manySpan(), sepBySpan(), wrapSpan()
mergeSpans(a, b), spanToString(span, src)

// Domain parsers (parsers/)
jsonParser(), JsonValue, csvParser(), jsonParseFast()
escapedString(), quotedString(), numberParser()
```

## Conventions

- `strict:true`, `verbatimModuleSyntax:true`, ES2022+ target
- Zero runtime deps — competitors (chevrotain, parsimmon, etc.) are benchmark-only
- Single export path: `.` → `dist/parse.js`
- No `src/bbnf/` — extracted to [`bbnf-lang`](https://github.com/mkbabb/bbnf-lang)
- Mutable ParserState with `save()`/`restore()` for backtracking
- Numeric memo keys: `(parserId << 20) | offset` — no string alloc
- `dispatch(table)` for O(1) ASCII first-char branching
- Flag-based trim/EOF inlined in `Parser.call()` hot path
