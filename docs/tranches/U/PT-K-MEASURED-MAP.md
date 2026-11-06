# PT-K measured Rust safety map

Measured at parse-that `ef10d5b78236c4a30a7bb22a6113b60bdc4bdf42` on
2026-07-18. This is U.W0 evidence, not a safety ruling and not an implementation
approval. Counts exclude `target` and include generated Rust because generated
unsafe is shipped unsafe.

## Baseline

- `rust/parse_that/src`, `rust/regex/src`, and `rust/simd_scan/src` contain
  20,295 Rust lines.
- `rg '\bunsafe\b'` reports 136 occurrences across 20 production files. The
  files include the run state, lazy parser, bump slab, leaf and span scanners,
  number/quote/structural kernels, CSS value parsing, and the 2,293-line
  generated regex parser.
- A precise authored/test scan finds 24 x86/SSE/AVX/PCLMUL vocabulary matches
  in six files. Shipping architecture branches live in
  `scan/number_simd.rs` and `scan/quote_parity.rs`; documentation and tests also
  establish x86 as a supported contract. PT-K is therefore RED against the
  Apple/aarch64-only law.
- `Span::new` has 199 production/test call sites. It accepts arbitrary byte
  bounds; `Span::as_str` relies on `debug_assert!` and then calls
  `get_unchecked`. Safe release code can construct a reversed, out-of-range, or
  non-UTF-8-boundary span and trigger undefined behavior.
- `PaddedView` has 42 production/test references. Its public constructor proves
  length and zero padding only with `debug_assert!`; safe release callers can
  forge the witness consumed by raw-pointer scanner loads.
- `BumpSlab` has eight direct references but is amplified through the generated
  regex parser. Its safe generic API rests on a `Vec<u8>` allocation whose
  requested alignment is one, accepts zero-sized and over-aligned `T`, and
  exposes a clone loop after reserving a raw destination. A re-entrant `Clone`
  can grow/move the current buffer before the reserved pointer is filled.
- `lazy` has eight direct definition/call references. It turns a captured
  `UnsafeCell<LazyParser>` into `&mut` on every recursive call. Re-entry can
  overlap mutable access to the same cache; the public safe combinator does not
  encode or reject that state.
- `ParserState` publicly exposes source, byte slice, end, offset, furthest
  offset, erased `*const ()` context, and caches while privately owning a full
  padded copy. Callers can create incoherent states through public fields or
  `Default`, and context type correctness is not carried by the type system.
- `cargo test --workspace` is already RED before PT-K work:
  `parse_that/tests/regex/parser_test.rs` imports the absent
  `parse_that::regex::parser` module. This is a distinct baseline defect; safety
  work cannot declare the suite green by excluding it.

## Safe-boundary counterexamples to land first

Each witness must compile against the safe public API and fail on the incumbent
implementation for its named reason. Crashes are run in subprocesses so the
test harness records rather than masks them.

1. construct `Span::new(3, 1, "abc")`, `Span::new(0, 4, "abc")`, and a range
   splitting a multi-byte scalar; call `as_str` in a release build;
2. construct `PaddedView::new` with a short buffer, a false public length, and
   nonzero tail; call every accepting scanner at boundary offsets;
3. allocate `#[repr(align(64))]` and zero-sized values through `BumpSlab` and
   assert pointer alignment without dereferencing a known-invalid address;
4. use a `Clone` implementation that re-enters the same slab during
   `alloc_slice_clone`, forcing growth before the outer write;
5. recursively enter one `lazy` parser during cache construction and exercise
   nested, panicking, repeated, and parallel invocations;
6. build `ParserState::default()` and safe public-field mutations with
   inconsistent `src`, `src_bytes`, `end`, and `offset`, then call every scanner
   façade;
7. pass a context of one type and read it as another through every erased
   context route;
8. run exhaustive inputs of length 0–31 and guard-page tails through scalar and
   accelerated scanners, recording offset and output parity;
9. compile-test the absence of public raw span/view/state constructors after
   the cut;
10. repository-scan authored, generated, test, benchmark, config, and docs for
    x86/SSE/AVX/PCLMUL vocabulary.

## Replacement boundaries

The smallest coherent safety cut is not a collection of patched assertions.
It is four sealed values and one unsafe implementation island:

```text
Input<'src>          validated source identity and bytes
Cursor<'src>         private offset; checked advance/checkpoint/span production
Run<'src, C>         typed context, diagnostics, recovery, memo, recursion, arena
Span<'src>           private source identity and proven UTF-8 byte range
scanner::aarch64     private unsafe NEON kernels behind safe checked contracts
```

`Input` does not make a permanent full-input padding copy. The scalar reference
checks the tail. A NEON kernel may accept a sealed short-lived padded stripe or
load only a proved full stripe; the representation stays private. The two
routes share one operation-level result contract. Scalar is the executable
oracle, not a legacy semantic fallback.

`Cursor` is the only offset writer. A checkpoint belongs to the same input/run
revision and can produce a `Span` only through checked cursor operations.
External code receives `Span::try_new(&Input, Range<usize>)`; parser code does
not call a public unchecked constructor repeatedly.

`Run<'src, C>` owns all call-local mutation. It replaces `ParserState`, raw
context casts, thread-local diagnostic aggregation, `LazyParser` cache state,
and generated-parser arena access. Parser definitions are immutable graph
values; recursion is explicit evaluation state, not closure self-aliasing.

The present `BumpSlab` is deleted, not commented into acceptability. The
replacement choice is earned by a prototype comparison:

- typed/established bump arena with safe aligned allocation and scoped
  lifetime;
- compact owned value tape with indices and no self-referential arena values.

The tape wins by default if it expresses the generated regex value graph
without cloning or lifetime inflation; the arena survives only with a smaller
measured carrier. No safe generic raw-byte allocator is reimplemented locally.

All target-specific unsafe lives under `scanner/aarch64`; public operations
remain safe. Each block names the exact input length/alignment/read/write proof,
has scalar property parity, and is exercised under sanitizers where supported.
No x86 cfg, intrinsic, benchmark, documentation, or generated reference remains.

## Ordered implementation slice

1. Land the external, source-isomorphic counterexample bank under
   `rust/parse_that/tests/{value,run,scanner}` and record release/subprocess,
   Miri-capable, sanitizer, and Apple/aarch64 commands.
2. Introduce private `Input`, `Cursor`, `Run<C>`, and checked `Span` in the
   target U topology. Route one leaf, one combinator, one recovery case, and one
   generated regex value vertically through them.
3. Translate the sealed T invocation graph into Rust evaluation ownership;
   delete raw context and `LazyParser` in the same cut. No second recursion path
   remains.
4. Replace `BumpSlab` through the measured tape/arena prototype and regenerate
   the regex parser. Delete the old allocator and all generated call sites
   atomically.
5. Consolidate scalar scanner operations, then add only measured NEON kernels.
   Delete SpanParser scanner duplication and all x86 routes in each vertical
   consumer cut.
6. Re-run value/span/diagnostic differential corpora, release invalid-input
   subprocesses, sanitizer/Miri-capable subsets, exhaustive short-input parity,
   and benchmarks twice.
7. Extract the PT-K graph, dispatch two fresh hostile critics, and have a third
   adjudicate every unsafe boundary and topology claim. Supersede findings and
   repeat until two consecutive whole-lock audits are clean.

## Closure predicates

- no safe public path can forge source identity, span bounds, padding, cursor,
  context type, or recursion state;
- no public struct exposes independently mutable fields whose relationship is a
  safety invariant;
- every remaining unsafe block is private to the aarch64 kernel island or an
  independently justified allocator dependency boundary;
- no x86 vocabulary remains anywhere in the repository surface;
- scalar/NEON outputs and stopping offsets are exhaustive-equivalent on the
  short-input bank and property-equivalent on generated corpora;
- the old `ParserState`, `PaddedView`, `LazyParser`, `BumpSlab`, SpanParser
  scanner paths, and direct raw-context symbols are absent, not aliased;
- tests live outside `src` and mirror the accepted `run`, `value`, and `scanner`
  modules;
- the full workspace suite is green twice, including the previously broken
  regex parser test, and every artifact/lock hash is unchanged by read-only
  commands.
