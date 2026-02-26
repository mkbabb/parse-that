# JSON Benchmark Suite

8 parsers × 6 datasets. All benchmarks report MB/s throughput via `bencher`.

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
| **nom** | Borrowed `&str` | Raw (not decoded) | Zero-copy | Most equivalent to parse_that |
| **winnow** | Borrowed `&str` | Raw (not decoded) | Zero-copy | nom's successor, uses `dispatch!` for O(1) branching |
| **pest** | Borrowed `Span` | Raw | Zero-copy | PEG parser generator |
| **jiter** | `Cow<str>` | Decoded selectively | Zero-copy + selective alloc | Slightly more work than parse_that |
| **serde_json** | Owned `String` | Fully decoded + validated | Allocates every string | Does MORE work |
| **simd-json** | `Cow<str>` (borrowed mode) | Decoded selectively | Buffer clone per iteration | `.to_vec()` is inherent (mutable input required) |
| **sonic-rs** | Owned `Value` | Fully decoded | Arena allocation | Does MORE work, but extremely fast (SIMD) |

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
