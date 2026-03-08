# JSON Benchmark Suite

10 parsers × 6 datasets. All benchmarks report MB/s throughput via `bencher`.

## Datasets

| File | Size | Character |
|---|---|---|
| data.json | 35 KB | Mixed types, moderate nesting |
| canada.json | 2.1 MB | 99% numbers (coordinates), minified, 56K-element arrays |
| apache-builds.json | 127 KB | String-heavy, `\/` escapes |
| data-xl.json | 39 MB | Large mixed (data.json × 1000) |
| twitter.json | 632 KB | String/unicode-heavy, CJK text, escape sequences |
| citm_catalog.json | 1.7 MB | Wide objects, many keys, integer-heavy, whitespace-heavy |

## Parser Work Equivalence

Not all parsers do the same work. This matters for interpreting results.

| Parser | String handling | Escapes | Allocation | Notes |
|---|---|---|---|---|
| **parse_that** | Borrowed `&str` | Raw (not decoded) | Zero-copy | Our library |
| **parse_that (BBNF)** | Borrowed `&str` | Raw (not decoded) | Zero-copy | `#[derive(Parser)]` from `.bbnf` grammar |
| **nom** | Borrowed `&str` | Raw (not decoded) | Zero-copy | Most equivalent to parse_that |
| **winnow** | Borrowed `&str` | Raw (not decoded) | Zero-copy | nom's successor, uses `dispatch!` for O(1) branching |
| **pest** | Borrowed `Span` | Raw | Zero-copy | PEG parser generator |
| **jiter** | `Cow<str>` | Decoded selectively | Zero-copy + selective alloc | Slightly more work than parse_that |
| **serde_json** | Owned `String` | Fully decoded + validated | Allocates every string | Does MORE work |
| **simd-json** | `Cow<str>` (borrowed mode) | Decoded selectively | Buffer clone per iteration | `.to_vec()` is inherent (mutable input required) |
| **sonic-rs** | Owned `Value` | Fully decoded | Arena allocation | Does MORE work, but extremely fast (SIMD) |

---

# CSS Benchmark Suite

4 parsers × 3 datasets (+ TypeScript: 3 parsers × 2 datasets).

## CSS Datasets

| File | Size | Character |
|---|---|---|
| normalize.css | 6 KB | Simple selectors, few at-rules |
| bootstrap.css | 281 KB | Media queries, selector lists, variables |
| tailwind-output.css | 3.6 MB | Massive utility classes, stress test |

## CSS Parser Work Equivalence

CSS parsing exists on a spectrum. Comparing parsers across levels is misleading without documentation.

| Parser | Selectors | Values | Allocation | Level |
|---|---|---|---|---|
| **parse_that** (hand-rolled) | Typed AST (compound/complex) | Typed (dimension, color, fn) + media/supports/specificity | Zero-copy spans + SmallVec | L1.75 |
| **parse_that (BBNF)** | Opaque span | Opaque span | Zero-copy spans | L1 (LESS work) |
| **cssparser** (servo) | Callback tokens | Callback tokens | User-controlled | L0-L1 (LESS work) |
| **lightningcss** | Typed (specificity) | Typed (units, colors) | Arena | L2 (MORE work) |
| **postcss** (TS) | String array | String | GC-managed | L1 (LESS work) |
| **css-tree** (TS) | Typed AST | Typed AST | GC-managed | L1-L2 |

### Fairness Notes

- **postcss** treats selectors and values as opaque strings. parse-that produces typed AST nodes for both (Dimension/Percentage/Color/Function for values, Type/Class/Id/Compound/Complex for selectors). parse-that does **more work** than postcss.
- **cssparser** is a tokenizer with callback-based visitors. It doesn't build an AST. parse-that does **more work**.
- **lightningcss** resolves cascade semantics, validates properties, and computes specificity. It does **more work** than parse-that.
- Declaration counts match exactly across all parsers on normalize.css and bootstrap.css, validating that parse-that is doing real parsing, not skipping content.

---

## Running

```bash
# All benchmarks
cargo bench

# Single parser
cargo bench --bench parse_that

# All parsers sequentially (cleaner numbers)
for bench in parse_that serde nom pest jiter simd_json sonic_rs winnow; do
  cargo bench --bench $bench
done
```

## Notes

- No `-C target-cpu=native` is set. All parsers use default optimization.
  sonic-rs would benefit from native SIMD tuning but we keep benchmarks reproducible.
- simd-json requires mutable input, so `.to_vec()` per iteration is an inherent library cost.
- `to_borrowed_value` is used (not `to_owned_value`) for fairer string comparison.
