# Instructions

Read `docs/precepts/instructions/` first. Local parse-that rules:

- Parse-that is a TypeScript and Rust parser-combinator workspace. Keep the
  two implementations conceptually aligned unless a tranche explicitly scopes
  divergence.
- TypeScript work lives under `typescript/` and uses `npm run test`,
  `npm run build`, and Vitest benchmark comparators where relevant.
- Rust work lives under `rust/` and uses cargo from the Rust workspace:
  `cargo test`, `cargo bench`, and focused package commands.
- Performance claims require benchmark artefacts. Parser correctness claims
  require fixture or unit-test evidence.
- Shared grammar/test vectors live under `grammar/`; avoid changing them as a
  side effect of implementation unless the wave owns corpus evolution.
- BBNF integration is an owned sibling concern only when the tranche names
  `../bbnf-lang`.
