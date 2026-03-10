# docs/

Project documentation. Performance chronicles, API reference.

## Structure

```
api.md                         TypeScript API reference (Parser<T>, leaf, span, diagnostics, domain parsers)
publishing.md                  Dependency graph, publish order, local dev workflow
perf-optimization-rust.md      Rust optimization chronicle: ~400 → 1,030 MB/s (1000+ lines)
perf-optimization-ts.md        TS optimization chronicle: 746 → 5,480 ops/s (600+ lines)
future-research.md             Research roadmap: 16 items (8 resolved, 8 open)
benchmarks/                    Benchmark baselines (latest: 2026-03-09)
left-recursion.md              Stub — see README.md and memoize.test.ts
pretty.md                      Stub — Rust pprint utility
```

## Notes

- Performance docs are comprehensive: methodology, phase-by-phase optimization, competitor analysis, compiler theory
- Rust doc covers SIMD, integer fast paths, monolithic scanners, u32 keyword loads, Cow<str> zero-copy
- TS doc covers mutable state, Tarjan's SCC, FIRST-set dispatch, regex test()+substring(), V8-specific tuning
- API doc covers TypeScript only — Rust API follows the same patterns with lifetime annotations
- API doc includes diagnostics section: enableDiagnostics(), Suggestion, SecondarySpan, formatExpected()
