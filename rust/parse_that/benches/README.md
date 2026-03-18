# parse-that Benchmark Suite

3 benchmarks focused on parse-that's own combinator performance.

All competitor and BBNF benchmarks have been moved to
[bbnf-lang](https://github.com/mkbabb/bbnf-lang).

## Benchmarks

| File | What |
|------|------|
| `parse_that_combinator.rs` | Hand-rolled JSON combinators (parse_that's own parsers) |
| `parse_that_css.rs` | Hand-rolled CSS combinators (L1.75 typed AST) |
| `micro_parse_that.rs` | Primitive micro-benchmarks (take_until_any, json_string, etc.) |

## JSON Datasets

| File | Size | Character |
|---|---|---|
| data.json | 35 KB | Mixed types, moderate nesting |
| canada.json | 2.1 MB | 99% numbers (coordinates), minified, 56K-element arrays |
| apache-builds.json | 127 KB | String-heavy, `\/` escapes |
| data-xl.json | 39 MB | Large mixed (data.json × 1000) |
| twitter.json | 632 KB | String/unicode-heavy, CJK text, escape sequences |
| citm_catalog.json | 1.7 MB | Wide objects, many keys, integer-heavy, whitespace-heavy |

## CSS Datasets

| File | Size | Character |
|---|---|---|
| normalize.css | 6 KB | Simple selectors, few at-rules |
| bootstrap.css | 281 KB | Media queries, selector lists, variables |
| tailwind-output.css | 3.6 MB | Massive utility classes, stress test |

## Running

```bash
# All parse-that benches
cargo bench

# Single bench
cargo bench --bench parse_that_combinator
cargo bench --bench parse_that_css
cargo bench --bench micro_parse_that
```

## Competitor Benchmarks

For the full competitor shootout (serde_json, sonic-rs, simd-json, jiter,
serde_json_borrow, nom, winnow, pest, cssparser, lightningcss) see:

```bash
cd bbnf-lang/rust
cargo bench -p bbnf --bench json_competitors
cargo bench -p bbnf --bench css_competitors
```
