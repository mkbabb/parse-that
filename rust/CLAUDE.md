# rust/

Rust parser combinator workspace. Two crates: `parse_that` (library) and `parse_that_cli` (binary).

## Structure

```
Cargo.toml                Workspace root (members: src, parse_that)
parse_that/               Core library crate
  src/
    lib.rs                Barrel re-exports, #![feature(cold_path)]
    parse.rs              Parser<'a, O> struct, ParseError, ParserFn trait
    combinators.rs        impl block combinators (then, or, map, many, sep_by, etc.)
    leaf.rs               Leaf parsers (string, regex, take_while, dispatch_byte, etc.)
    lazy.rs               LazyParser, lazy() function
    span_parser.rs        SpanParser<'a> — enum-dispatched, vtable-free
    state.rs              ParserState<'a>, Span<'a> (66 lines)
    debug.rs              Colored debug output, cursor display (159 lines)
    utils.rs              extract_bounds(), get_cargo_root_path() (20 lines)
    parsers/
      mod.rs              Module exports
      json.rs             JsonValue<'a>, combinator + fast JSON + scanners
      csv.rs              RFC 4180 CSV parser (47 lines)
      toml.rs             TOML parser (incomplete)
      utils.rs            escaped_span(), quoted_span(), number_span() (38 lines)
  tests/
    combinator_test.rs    Core combinator coverage (698 lines)
    json_test.rs          JSON parsing + escape edge cases (799 lines)
    csv_test.rs           CSV parsing + large file test (49 lines)
  benches/
    README.md             Benchmark methodology & work equivalence
    parse_that.rs         SpanParser JSON bench
    parse_that_combinator.rs  Parser<Span> JSON bench
    nom.rs                nom 7.1.3
    winnow.rs             winnow 0.7
    pest.rs               pest 2.5.6
    serde.rs              serde_json
    serde_json_borrow.rs  serde_json_borrow 0.9
    jiter.rs              jiter 0.8
    simd_json.rs          simd-json 0.14
    sonic_rs.rs           sonic-rs 0.5
src/                      CLI binary
  Cargo.toml              parse_that_cli
  main.rs                 JSON + CSV benchmark runner
```

## Build

```bash
cargo test --workspace      # nightly required
cargo check --workspace
cargo clippy --workspace -- -D warnings
cargo bench --bench parse_that
```

## Key Types

```rust
// Core (parse.rs)
Parser<'a, Output>           // Box<dyn ParserFn> — runtime dispatch
ParserResult<'a, O> = Option<O>

// Span-optimized (span_parser.rs)
SpanParser<'a>               // Enum-dispatched, no vtable on hot path
SpanKind<'a>                 // StringLiteral | RegexMatch | JsonNumber | JsonString | Seq | OneOf | ...

// State (state.rs)
ParserState<'a>              // src, src_bytes, offset, furthest_offset
Span<'a>                     // start, end, src — zero-copy as_str()

// Domain (parsers/json.rs)
JsonValue<'a>                // Null | Bool | Number | String(Cow) | Array | Object(Vec<(K,V)>)
```

## Conventions

- Edition 2024, nightly required for `#![feature(cold_path)]`
- `pprint` path dep (`/Programming/pprint`) for Pretty derive
- Two parser tiers: `Parser<'a, O>` (flexible, boxed) and `SpanParser<'a>` (fast, enum)
- Zero-copy: `Span<'a>` borrows source, `Cow<'a, str>` for decoded strings
- SIMD acceleration: `memchr2` for JSON string scanning
- Integer fast path: accumulate digits inline, `fast-float2` for decimals
- Monolithic scanners: `json_string_fast`, `number_span_fast` bypass combinator overhead
- `dispatch_byte()` / `dispatch_byte_multi()` for O(1) first-byte branching
- Benchmark profiles: `release-lto`, `bench` (fat LTO, codegen-units=1, opt-level=3)
