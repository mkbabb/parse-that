# parse-that

Parser combinator library — TypeScript + Rust monorepo with shared BBNF grammars.

## Structure

```
typescript/                TS library (@mkbabb/parse-that v0.7.0)
  src/parse/               Core parser modules (isomorphic layout)
    parser.ts              Parser<T> class, combinators, recover(), memoization, flags
    leaf.ts                Leaf parsers (string, regex, eof, dispatch, etc.)
    lazy.ts                Lazy evaluation infrastructure
    span.ts                Zero-copy span combinators
    state.ts               ParserState, Span, ParserContext
    debug.ts               Diagnostics rendering, ANSI output, formatDiagnostic()
    ansi.ts                Zero-dep ANSI helpers (NO_COLOR + TTY aware)
    parsers/               Domain parsers (JSON, CSV, TOML)
  test/                    Vitest tests (11 test files)
  test/benchmarks/         Competitor JSON parsers for benchmarking (9 files)
rust/                      Rust workspace
  parse_that/              Core parser combinator lib (crate)
    src/
      parse.rs             Parser<'a, O> struct, ParseError, ParserFn trait
      combinators.rs       impl block combinators (then, or, map, many, recover, etc.)
      leaf.rs              Leaf parsers (string, regex, dispatch_byte, etc.)
      lazy.rs              LazyParser, lazy() function
      span_parser.rs       SpanParser<'a> — enum-dispatched, vtable-free
      state.rs             ParserState, Span, Diagnostic, diagnostics types (feature-gated)
      debug.rs             Diagnostics rendering, format_diagnostic() (feature-gated)
      parsers/             Domain parsers (JSON + scanners, CSV, TOML)
    tests/                 Integration tests (5 files)
    benches/               Benchmark suite (10 benches × 6 datasets)
  src/                     CLI binary (parse_that_cli)
grammar/                   Shared BBNF grammar files (16 .bbnf files)
  tests/json/              Shared JSON test vectors (valid + invalid JSONL)
  tests/css/               CSS test vectors (complex-errors.css for recovery)
  tests/debug/             Shared diagnostic output vectors
docs/                      Performance chronicles, API reference
data/                      Benchmark datasets (JSON, CSV)
assets/                    Images (logo, debug screenshot)
```

## Build & Test

### TypeScript
```bash
cd typescript
npm ci
npm test          # vitest — 11 test files
npm run build     # vite → dist/parse.js (ES) + parse.cjs (CJS)
npx tsc --noEmit  # type check
```

### Rust
```bash
cd rust
cargo test --workspace      # nightly required (cold_path)
cargo check --workspace
cargo bench --bench parse_that  # single bench
```

### Just
```bash
just all          # ts-all + rs-all
just ts-test      # cd typescript && npm test
just rs-test      # cd rust && cargo test --workspace
```

## Key Conventions

- TS: `strict:true`, `verbatimModuleSyntax:true`, ES2022+, zero runtime deps
- TS: `Parser.lazy(() => ...)` for recursive definitions (no decorators)
- TS: Mutable `ParserState` with save/restore — zero-alloc hot path
- TS: Span variants (`regexSpan`, `manySpan`, `sepBySpan`, `wrapSpan`) for zero-copy
- Rust: `pprint` (path dep to `/Programming/pprint`) for pretty-printing
- Rust: nightly required — `#![feature(cold_path)]`
- Rust: `Parser<'a, O>` (boxed dyn) + `SpanParser<'a>` (enum-dispatched, vtable-free)
- Rust: `diagnostics` Cargo feature — expected sets, suggestions, secondary spans, error recovery
- Both: `recover(sync, sentinel)` combinator — parse past errors, collect multi-error diagnostics
- Rust: edition 2024
- BBNF grammars are the shared contract between TS and Rust
- BBNF ecosystem extracted to separate [`bbnf-lang`](https://github.com/mkbabb/bbnf-lang) repo
- Benchmark competitors are in devDependencies/dev-dependencies only

## CI

GitHub Actions (`.github/workflows/ci.yml`):
- **TypeScript**: Node 24 → tsc --noEmit → vitest → vite build
- **Rust**: nightly → clippy -D warnings → cargo test --workspace
