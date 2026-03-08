# Future Research

Organized by bottleneck. Each item: problem statement, current numbers, proposed
approach, expected impact.

---

## 1. CSS Parse Throughput — RESOLVED

**Previous**: 6-38 MB/s (hand-rolled), ~31 MB/s (prettify pipeline).

**Current**: **237-287 MB/s** (hand-rolled), 67-241 MB/s (BBNF-generated).

**What was done** (2026-03-08):
- Added 3 monolithic SpanParser scanners: `CssIdent` (byte loop), `CssWsComment` (memchr for `*/`), `CssString` (memchr2 for quote/backslash)
- Hoisted all parser construction out of hot loops (eliminated thousands of `Box<dyn ParserFn>` allocations per parse)
- Inlined value parsing (replaced `dispatch_byte_multi` + `.or()` vtable chains with direct byte-match dispatch)
- Inlined selector suffix parsing (replaced 5-branch `.or()` chain with first-byte match)
- Inlined `css_rule()` dispatch (first-byte match instead of `.or()` chain)
- Removed 6 unnecessary `lazy()` wrappers from non-recursive rules

**Result**: 34x improvement on bootstrap.css. Now faster than lightningcss (L2 semantic parser) while building a full typed AST.

---

## 2. CSS to_doc Throughput

**Current**: ~28 MB/s (prettify pipeline).

**Bottleneck**: O(n) `Doc` allocations proportional to AST depth. Each AST node
produces at least one `Doc` variant, and compound nodes produce 3–5 (separator +
children + wrapper). The CSS AST is deeper than JSON due to nested selectors and
declaration blocks.

**Approach**: Fuse adjacent `Doc::String` nodes during `to_doc()` emission — detect
sequences of string concatenation and emit a single `Doc::String` covering the full
span. For wrapped patterns, emit `Doc::BracketIndent` (a single allocation) instead
of `String + Group(Indent(Softline + body)) + String` (4 allocations).

**Expected impact**: ~1.5–2x improvement to ~45–55 MB/s.

---

## 3. pprint text_justify O(n^2)

**Current**: `SmartJoin` uses a Knuth-Plass-style DP algorithm for optimal text
justification — O(n^2) where n is item count.

**Bottleneck**: For large CSS declaration blocks (50+ items), the DP computation
dominates formatting time. The quadratic inner loop computes line-break penalties
for all possible break points.

**Approach**: Add a greedy fast path for cases where all items are short (below a
configurable threshold, e.g., `max_width / 3`). The greedy algorithm packs items
left-to-right — O(n) with no quality loss for uniformly-sized items. Fall back to
DP only when item widths vary significantly. The `@pretty fast` hint provides
user-level control: when present, `SmartJoin` is replaced with `Join` (linear,
no DP) unconditionally.

**Expected impact**: 5–10x improvement for large repetitions. Negligible impact on
small containers (DP is already fast for n < 20).

---

## 4. pprint count_text_length HashMap

**Current**: `count_text_length()` uses a `HashMap<*const Doc, usize>` to memoize
Doc width computations. Hash computation and probe overhead on every Doc node.

**Approach**: Replace with a pointer-indexed flat table — assign sequential IDs to
Doc nodes during construction, use a `Vec<Option<usize>>` indexed by ID. Eliminates
SipHash computation and reduces to a single array index per lookup.

**Expected impact**: ~10–20% improvement in pprint render phase.

---

## 5. Re-run 11-parser Benchmark Matrix — RESOLVED

**Done**: Full matrix re-run completed 2026-03-08. BBNF JSON improved to 323-735 MB/s
(from 249-552). All docs updated with current numbers.

BBNF CSS benchmarks added: 67-241 MB/s on css-fast.bbnf grammar (opaque spans).
Hand-rolled CSS benchmarks added: 237-287 MB/s on bootstrap/normalize/tailwind.

---

## 6. TS Benchmark Automation

**Current**: TypeScript benchmarks run manually via `npx vitest bench`. No CI
integration, no `just` target.

**Approach**: Add `just ts-bench` target that runs
`cd typescript && npx vitest bench --reporter=verbose`. Optionally add a CI job
that runs benchmarks on PRs and posts a comparison comment.

**Expected impact**: Prevents performance regressions from going unnoticed.

---

## 7. TS SpanParser Equivalent

**Current**: TypeScript has `regexSpan()`, `manySpan()`, `sepBySpan()`, `wrapSpan()`
as individual functions — no unified enum-dispatched type.

**Approach**: Introduce a `SpanParser` tagged union (discriminated union in TS) that
mirrors the Rust `SpanParser` enum. Each variant stores its configuration inline.
`call()` dispatches via a `switch` on the tag — V8 optimizes this to a jump table,
eliminating closure allocation and virtual dispatch overhead.

**Expected impact**: ~10–20% improvement for BBNF-generated TS parsers on
span-eligible rules. Requires changes to the TS BBNF codegen path.

---

## 8. SmallVec for CSS AST Allocations

**Current**: CSS parser allocates `Vec` for selectors, declarations, values, and
function args. Most of these are small (1-5 elements). Each Vec starts at capacity 0
and grows, causing multiple reallocs.

**Approach**: Replace with `SmallVec<[T; N]>` (or `tinyvec::ArrayVec`) where N covers
the common case: `SmallVec<[CssSelector; 4]>` for selector lists,
`SmallVec<[CssValue; 6]>` for declaration values, `SmallVec<[CssDeclaration; 8]>` for
declaration blocks. Eliminates heap allocation for the common case.

**Expected impact**: 10-20% throughput improvement on bootstrap.css (allocation-heavy).

---

## 9. SIMD Whitespace Scanning

**Current**: Whitespace scanning uses a scalar byte-by-byte loop (5 predicate checks
per byte). The micro-benchmark "chunked" variant (8-byte u64 loads) shows modest gains.

**Approach**: Use 128-bit NEON/SSE to compare 16 bytes against `{0x20, 0x09, 0x0A, 0x0D}`
simultaneously. Find first non-whitespace via movemask + trailing zeros. Would give
~16x throughput on whitespace-heavy regions (pretty-printed JSON, CSS indentation).

**Expected impact**: 5-10% on whitespace-heavy files (citm_catalog, pretty-printed CSS).
Limited impact on minified inputs.

---

## 10. Eliminate Remaining Regex on CSS Hot Paths

**Current**: Four regex patterns remain in CSS parser hot/warm paths:
- `sp_regex(r"(?s)/\*.*?\*/")` for standalone comment nodes
- `sp_regex(r"[~|^$*]?=")` for attribute selector matchers
- `sp_regex(r"#[0-9a-fA-F]{3,8}")` for hex colors
- `sp_regex(r"...")` for `:nth-child()` An+B syntax

**Approach**: Replace each with trivial hand-written byte checks. Hex color: consume
`#`, scan 3-8 hex digits. Attribute matcher: peek 1-2 bytes. Comment: consume `/*`,
memchr for `*`, check `/`.

**Expected impact**: 5-10% on selector-heavy and color-heavy CSS.

---

## 11. Close BBNF-to-Hand-Rolled JSON Gap

**Current**: BBNF JSON at 573 MB/s vs hand-rolled at 940 MB/s (0.61x).

**Bottleneck**: `lazy()` indirection for recursive rules (UnsafeCell + branch + vtable
per call), `trim_whitespace()` double-dispatch (redundant whitespace scanning at
boundaries), and `sep_by` + comma parsing overhead.

**Approach**: (a) Replace `dispatch_byte_multi` with inline `match` in BBNF codegen,
(b) fuse whitespace skipping into array/object loops rather than wrapping comma parser,
(c) explore function-pointer recursion instead of `lazy()` for known recursive rules.

**Expected impact**: Close gap to 0.75-0.85x of hand-rolled.

---

## 12. CSS L1.75 — Typed Media/Supports Preludes

**Current**: `@media` and `@supports` preludes are captured as raw `Span`. Specificity
is not computed.

**Approach**: Parse `@media` preludes into typed conditions (`MediaFeature`,
`MediaCondition` with boolean combinators). Parse `@supports` conditions into boolean
expression trees. Add specificity computation as a post-parse utility.

**Expected impact**: Bounded, well-specified additions that bring parse_that closer to
lightningcss's feature set without the full L2 property registry.
