# docs/

Project documentation. Performance chronicles, API reference.

## Structure

```
api.md                         TypeScript API reference (Parser<T>, ParserState<T>, functions)
perf-optimization-rust.md      Rust optimization chronicle: ~400 → 1,730 MB/s (1000+ lines)
perf-optimization-ts.md        TS optimization chronicle: 746 → 5,480 ops/s (600+ lines)
left-recursion.md              Stub — see README.md and memoize.test.ts
pretty.md                      Stub — Rust pprint utility
```

## Notes

- Performance docs are comprehensive: methodology, phase-by-phase optimization, competitor analysis, compiler theory
- Rust doc covers SIMD, integer fast paths, monolithic scanners, u32 keyword loads, Cow<str> zero-copy
- TS doc covers mutable state, Tarjan's SCC, FIRST-set dispatch, regex test()+substring(), V8-specific tuning
- API doc covers TypeScript only — Rust API follows the same patterns with lifetime annotations
