# Publishing & Dependency Graph

parse-that is the root of a family of libraries spanning TypeScript (npm) and Rust (crates.io). This document covers the dependency graph and publish order.

## Dependency Graph

```
                    crates.io                              npm
              ┌──────────────────┐              ┌──────────────────────┐
              │                  │              │                      │
              │  pprint_derive   │              │  @mkbabb/parse-that  │
              │       ↓          │              │     ↓           ↓    │
              │    pprint        │              │  value.js    pprint  │
              │       ↓          │              │     ↓                │
              │  parse_that ←────┤              │  keyframes.js        │
              │     ↓    ↓       │              │                      │
              │   bbnf  (used by)│              │  @mkbabb/bbnf-lang   │
              │     ↓            │              │     ↓                │
              │  bbnf_derive     │              │  playground          │
              │     ↓            │              │  (keyframes.js,      │
              │   gorgeous       │              │   parse-that, pprint)│
              └──────────────────┘              └──────────────────────┘
```

### npm packages

| Package | Version | Depends on |
|---------|---------|------------|
| `@mkbabb/parse-that` | 0.8.x | — |
| `@mkbabb/pprint` | 0.3.x | — |
| `@mkbabb/value.js` | 0.5.x | `@mkbabb/parse-that` |
| `@mkbabb/keyframes.js` | 1.2.x | `@mkbabb/parse-that`, `@mkbabb/value.js` |
| `@mkbabb/bbnf-lang` | 0.1.x | `@mkbabb/parse-that`, `@mkbabb/pprint` |

### Rust crates

| Crate | Version | Depends on |
|-------|---------|------------|
| `pprint` | 0.3.x | `pprint_derive` |
| `parse_that` | 0.3.x | `pprint` |
| `bbnf` | 0.2.x | `parse_that`, `pprint` |
| `bbnf_derive` | 0.2.x | `bbnf`, `parse_that`, `pprint` |
| `gorgeous` | 0.1.x | all of the above |

## Publish Order

Bottom-up. Never publish a package before its dependencies.

### npm

```
1. @mkbabb/parse-that     (leaf)
2. @mkbabb/pprint          (leaf)
3. @mkbabb/value.js        (depends on parse-that)
4. @mkbabb/keyframes.js    (depends on parse-that, value.js)
5. @mkbabb/bbnf-lang       (depends on parse-that, pprint)
```

### crates.io

```
1. pprint / pprint_derive  (leaf — lives in /Programming/pprint)
2. parse_that              (depends on pprint)
3. bbnf                    (depends on parse_that, pprint)
4. bbnf_derive             (depends on bbnf, parse_that, pprint)
5. gorgeous                (depends on all above — lives in /Programming/bbnf-lang)
```

## Local Development

All repos use path overrides for local dev. These are transparent to consumers.

**Rust**: `.cargo/config.toml` (gitignored) with `[patch.crates-io]` entries pointing to sibling repos. Temporarily rename to `.cargo/config.toml.bak` before `cargo publish`, restore after.

**npm**: `npm link` for cross-repo resolution after switching from `file:` to versioned deps:

```bash
# Register (one-time per repo)
cd /Programming/parse-that/typescript && npm link
cd /Programming/pprint/typescript && npm link
cd /Programming/value.js && npm link
cd /Programming/keyframes.js && npm link

# Wire consumers
cd /Programming/value.js && npm link @mkbabb/parse-that
cd /Programming/keyframes.js && npm link @mkbabb/parse-that @mkbabb/value.js
cd /Programming/bbnf-lang/typescript && npm link @mkbabb/parse-that @mkbabb/pprint
cd /Programming/bbnf-lang/playground && npm link @mkbabb/parse-that @mkbabb/pprint @mkbabb/keyframes.js
```

## Publishing Checklist

1. **Version bump**: `npm version patch|minor|major --no-git-tag-version` (npm) or edit `Cargo.toml` (Rust)
2. **Build**: `npm run build` / `cargo check`
3. **Test**: `npm test` / `cargo test --workspace`
4. **Publish**: `npm publish --access public` / `cargo publish` (use `--allow-dirty` if uncommitted)
5. **Rust**: disable `.cargo/config.toml` patches before `cargo publish`, restore after
6. **Propagation**: first-time scoped packages may take a few minutes to appear on the registry. Use `npm link` to bypass during that window.

## Repository Locations

```
/Programming/parse-that/       @mkbabb/parse-that (TS) + parse_that (Rust)
/Programming/pprint/           @mkbabb/pprint (TS) + pprint (Rust)
/Programming/value.js/         @mkbabb/value.js
/Programming/keyframes.js/     @mkbabb/keyframes.js
/Programming/bbnf-lang/        @mkbabb/bbnf-lang (TS) + bbnf, bbnf_derive, gorgeous (Rust)
```
