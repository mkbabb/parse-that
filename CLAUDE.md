# parse-that

Parser combinator library — TypeScript + Rust monorepo with shared BBNF grammars.

## Structure
```
typescript/          TS library (@mkbabb/parse-that)
  src/parse/         Core parser combinators
  src/bbnf/          BBNF grammar → parser generator
  test/              Vitest tests
rust/                Rust workspace
  parse_that/        Core parser combinators (lib)
  bbnf/              BBNF grammar framework
  bbnf/derive/       Proc-macro derive for BBNF
  src/               CLI binary (parse_that_cli)
grammar/             Shared BBNF grammar files
```

## Build & Test

### TypeScript
```bash
cd typescript
npm ci
npm test          # vitest (34 pass, 4 todo)
npm run build     # → dist/parse.js + bbnf.js
npx tsc --noEmit  # type check
```

### Rust
```bash
cd rust
cargo test --workspace    # requires nightly (box_patterns)
cargo check --workspace
```

## Key Conventions
- TS: strict:true, verbatimModuleSyntax:true, ES2022+
- TS: zero runtime deps — no prettier, no chalk
- TS: `@lazy` decorators replaced with `_field ??= Parser.lazy(...)` pattern
- Rust: pprint (path dep to /Programming/pprint) for pretty-printing
- Rust: nightly required for `box_patterns` in bbnf/src/generate.rs
- BBNF grammars are the shared contract between TS and Rust

## Known Issues
See PARSER_ISSUES.md for tracked parser bugs.
