# typescript/

TypeScript parser combinator library. Published as `@mkbabb/parse-that` v0.7.0.

## Structure

```
src/parse/
  index.ts          Core Parser<T> class, combinators, dispatch, memoization (1090 lines)
  state.ts          ParserState<T>, Span, ParserContext types (152 lines)
  debug.ts          parserDebug(), parserPrint(), statePrint(), addCursor() (200 lines)
  json-fast.ts      Monolithic JSON parser — charCode dispatch, no combinators (376 lines)
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
// Core
Parser<T>, ParserState<T>, ParserFunction<T>, Span

// Leaf parsers
string(s), regex(r), regexSpan(r), eof(), whitespace

// Combinators
any(...), all(...), dispatch(table, fallback?)
Parser.lazy(fn)

// Span variants (zero-copy)
regexSpan(), manySpan(), sepBySpan(), wrapSpan()
mergeSpans(a, b), spanToString(span, src)
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
