# rust/

Rust parser combinator workspace. Workspace members: `parse_that` (core library), `bbnf-regex` (bespoke regex engine — see `regex/CLAUDE.md`), `bootstrap`, and `parse_that_cli` (CLI binary).

## Structure

```
Cargo.toml                Workspace root (members: src, parse_that, bootstrap, regex)
parse_that/               Core library crate
  src/
    lib.rs                Barrel re-exports, #![feature(cold_path, portable_simd, ...)]
    parse.rs              Parser<'a, O> struct, ParserResult, ParserFn trait
    state.rs              ParserState<'a>, Span<'a>, Diagnostic, Suggestion, SecondarySpan
    bump_slab.rs          BumpSlab — byte-based bump allocator for monolithic codegen
    lazy.rs               LazyParser, lazy() function
    leaf.rs               Leaf parsers (string, regex, take_while, dispatch_byte, etc.)
    scanners.rs           Shared inline byte scanners (LUT, memchr fast-paths)
    span_trait.rs         ParserSpan trait (Span combinator aliases), ParserFlat trait
    split.rs              split_balanced(), contains_delimiter() — format-time balanced splitting
    debug.rs              Colored debug output, format_diagnostic() (feature-gated)
    utils.rs              extract_bounds(), get_cargo_root_path()
    combinators/          Parser<'a, O> combinators (directory module)
      mod.rs              Module declarations
      macros.rs           seq! / alt! flat N-ary macros
      methods/            impl-block combinators split per category
        mod.rs            Module declarations
        sequence.rs       then, next, skip, chain
        alternation.rs    or, dispatch_byte variants
        repetition.rs     many, many1, repeat, optional
        sep_by.rs         sep_by, sep_by1, trailing variants
        minus.rs          minus (set-difference), negate, not
        map.rs            map, map_with_span
        recover.rs        recover — error-recovery combinator
    span_parser/          SpanParser<'a> — enum-dispatched, vtable-free (directory module)
      mod.rs              SpanParser struct, dispatch router, sp_new! macro
      leaves.rs           Leaf SpanKind variants (StringLiteral, RegexMatch, Eof, …)
      constructors.rs     sp_string, sp_regex, sp_json_* constructors
      methods.rs          Combinator methods + bridge helpers
      combinators.rs      Sequence / alternation SpanKind handlers
      sep_by.rs           SpanParser sep_by variants
      wrap.rs             Wrap (delim-bounded) handler
      scan.rs             Inline scan dispatch (LUT, byte-class loops)
      span_scanner.rs     SpanScanner variants (CssIdent, CssWsComment, CssString, CssBlockComment)
      assertions.rs       Negate / not / eof assertion handlers
    regex/                Internal bridge to bbnf-regex (generated DFA tables, host glue)
      mod.rs              Module declarations
      host.rs             Host-side regex runtime helpers
      generated.rs        Pre-compiled DFA tables
    parsers/              Domain parsers + scanner primitives (directory module)
      mod.rs              Module exports
      utils.rs            escaped_span(), quoted_span(), number_span()
      json.rs             JsonValue<'a>, combinator + fast JSON + scanners
      csv.rs              RFC 4180 CSV parser
      css/                CSS L1.75 parser (types, scan, value, selector, declaration, media, specificity, mod)
      scan/               Scanner primitives — number / ident / ws / quoted / balanced
        mod.rs            Module declarations
        number.rs         Integer + float scanners
        number_f64.rs     css_number_scan_f64 fused scanner (Eisel-Lemire fast path)
        ident.rs          Identifier scanners (css_ident_fast, etc.)
        ws_comment.rs     Whitespace + comment-aware scanners
        quoted.rs         Quoted-string scanners
        balanced.rs       Balanced delimiter scanners
      eisel_lemire/       Eisel-Lemire f64 conversion algorithm
        mod.rs            Public surface
        algorithm.rs      Core algorithm
        table.rs          POWER_OF_FIVE_128 — 660 LOC of pure data (exempt from 500-LOC ceiling)
  tests/
    combinator_test.rs    Core combinator coverage
    css_parse_test.rs     CSS parser integration tests
    css_recovery_test.rs  Multi-error recovery via recover() combinator (13 tests, diagnostics feature)
    debug_test.rs         Diagnostics system tests (103 tests — labels, suggestions, spans, CSS grammar)
    json_test.rs          JSON parsing + escape edge cases
    csv_test.rs           CSV parsing + large file test
    regex.rs              Regex bridge smoke test
    regex/                Regex engine tests (accel, byteset, dfa, equiv, hir, nfa, parser, utf8)
  benches/
    README.md             Benchmark methodology & work equivalence
    parse_that/           Parser<Span> JSON benches
    competitors/          nom / winnow / pest / serde_json / simd-json / sonic-rs / jiter baselines
bootstrap/                Bootstrap grammar tooling (workspace member)
regex/                    bbnf-regex workspace member — bespoke NFA/DFA regex engine (see regex/CLAUDE.md)
src/                      CLI binary
  Cargo.toml              parse_that_cli
  main.rs                 JSON + CSV benchmark runner
```

## Workspace Members

- **parse_that** — this crate. Parser combinators, SpanParser, scanner primitives, domain parsers.
- **bbnf-regex** (`regex/`) — separate workspace member; bespoke HIR → NFA → DFA regex engine. Has its own `regex/CLAUDE.md`. `parse_that` re-exports it via `parse_that::regex`.
- **bootstrap** — bootstrap grammar tooling.
- **parse_that_cli** (`src/`) — CLI binary: JSON + CSV benchmark runner.

## Build

```bash
cargo test --workspace      # nightly required
cargo check --workspace
cargo clippy --workspace -- -D warnings
cargo bench --bench parse_that_combinator
```

## Key Types

```rust
// Core (parse.rs)
Parser<'a, Output>           // Box<dyn ParserFn> — runtime dispatch
ParserResult<'a, O> = Option<O>

// Span-optimized (span_parser.rs)
SpanParser<'a>               // Enum-dispatched, no vtable on hot path
SpanKind<'a>                 // StringLiteral | RegexMatch | JsonNumber | JsonString | TakeUntilAny | Seq | OneOf | Minus | Negate | Eof | ...

// State (state.rs)
ParserState<'a>              // src, src_bytes, offset, furthest_offset
Span<'a>                     // start, end, src — zero-copy as_str()
Diagnostic                   // (diagnostics feature) error snapshot — offset, expected, suggestions, spans
Suggestion, SuggestionKind   // (diagnostics feature) unclosed-delimiter, trailing-content
SecondarySpan                // (diagnostics feature) related source locations

// Domain (parsers/json.rs)
JsonValue<'a>                // Null | Bool | Number | String(Cow) | Array | Object(Vec<(K,V)>)
```

## Conventions

- Edition 2024, nightly required for `#![feature(cold_path)]`
- `diagnostics` Cargo feature — expected sets, suggestions, secondary spans, error recovery (zero overhead when off). `colored` crate optional behind this feature.
- `recover(sync, sentinel)` — parse past errors, collect Diagnostic snapshots into thread-local store
- `minus(excluded)` — EBNF set-difference: match self only if excluded fails at same position. Saves/restores `furthest_offset`.
- `negate()` — zero-width negative assertion: succeeds when inner parser fails, never consumes input. Saves/restores `furthest_offset`.
- `not(next)` — consuming negative lookahead: parse self, then reject if `next` matches at resulting position. Saves/restores `furthest_offset`.
- `chain(f)` — monadic bind (flatMap): parse with self, use result to choose next parser
- `memoize()` — packrat memoization: cache parse results by input offset, O(1) on cache hit
- `sep_by` — strictly interleaving `elem (sep elem)*`, never accepts trailing separators
- `pprint` path dep (`/Programming/pprint`) for Pretty derive
- Two parser tiers: `Parser<'a, O>` (flexible, boxed) and `SpanParser<'a>` (fast, enum)
- Zero-copy: `Span<'a>` borrows source, `Cow<'a, str>` for decoded strings
- SIMD acceleration: `memchr2` for JSON string scanning
- Integer fast path: accumulate digits inline, `fast-float2` for decimals
- Monolithic scanners in `parsers/json.rs`: `json_string_fast`, `number_span_fast` bypass combinator overhead
- `dispatch_byte()` / `dispatch_byte_multi()` for O(1) first-byte branching
- `cached_regex()` — global `Arc<Regex>` cache keyed by pattern string, avoids recompilation
- `take_until_any_span(excluded)` — 256-byte LUT byte scanner for negated character classes (`[^...]+`); used by BBNF codegen for CSS patterns like `/[^;{}!,]+/`
- `sp_take_until_any(excluded)` — SpanParser variant of LUT scanner (no boxing, enum-dispatched)
- `seq!` / `alt!` macros — flat N-ary combinators (2-8 elements), single Box allocation instead of N-1 intermediate boxes
- `split_balanced(text, delim)` — format-time balanced splitting on delimiter at nesting depth 0, respects `()[]` nesting + `""''` quoting. Used by BBNF `@pretty split("...")` codegen.
- `contains_delimiter(text, delim)` — memchr fast-path guard to skip `split_balanced()` when delimiter absent
- Benchmark profiles: `release-lto`, `bench` (fat LTO, codegen-units=1, opt-level=3)
