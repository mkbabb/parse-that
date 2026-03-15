# Future Research

Organized by bottleneck. Each item: problem statement, current numbers, proposed
approach, expected impact.

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

**Current**: `SmartJoin` uses a greedy bin-packing algorithm for text
justification — O(n) for uniform items, O(n^2) worst case for variable-width items.

**Bottleneck**: For large CSS declaration blocks (50+ items) with variable-width
entries, the computation dominates formatting time.

**Approach**: Add a greedy fast path for cases where all items are short (below a
configurable threshold, e.g., `max_width / 3`). The greedy algorithm packs items
left-to-right — O(n) with no quality loss for uniformly-sized items. The `@pretty fast`
hint provides user-level control: when present, `SmartJoin` is replaced with `Join`
(linear, no justification) unconditionally.

**Expected impact**: 5–10x improvement for large repetitions. Negligible impact on
small containers (already fast for n < 20).

---

## 4. pprint count_text_length HashMap

**Current**: `count_text_length()` uses a `HashMap<*const Doc, usize>` to memoize
Doc width computations. Hash computation and probe overhead on every Doc node.

**Approach**: Replace with a pointer-indexed flat table — assign sequential IDs to
Doc nodes during construction, use a `Vec<Option<usize>>` indexed by ID. Eliminates
SipHash computation and reduces to a single array index per lookup.

**Expected impact**: ~10–20% improvement in pprint render phase.

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

## 9. SIMD Whitespace Scanning

**Current**: Whitespace scanning uses a scalar byte-by-byte loop (5 predicate checks
per byte). The micro-benchmark "chunked" variant (8-byte u64 loads) shows modest gains.

**Approach**: Use 128-bit NEON/SSE to compare 16 bytes against `{0x20, 0x09, 0x0A, 0x0D}`
simultaneously. Find first non-whitespace via movemask + trailing zeros. Would give
~16x throughput on whitespace-heavy regions (pretty-printed JSON, CSS indentation).

**Expected impact**: 5-10% on whitespace-heavy files (citm_catalog, pretty-printed CSS).
Limited impact on minified inputs.

---

## 11. Close BBNF-to-Hand-Rolled JSON Gap

**Current**: BBNF JSON at 540 MB/s vs hand-rolled at 926 MB/s (0.58x, measured 2026-03-08).

**Bottleneck**: `lazy()` indirection for recursive rules (UnsafeCell + branch + vtable
per call), `trim_whitespace()` double-dispatch (redundant whitespace scanning at
boundaries), and `sep_by` + comma parsing overhead.

**Approach**: (a) Replace `dispatch_byte_multi` with inline `match` in BBNF codegen,
(b) fuse whitespace skipping into array/object loops rather than wrapping comma parser,
(c) explore function-pointer recursion instead of `lazy()` for known recursive rules.

**Expected impact**: Close gap to 0.75-0.85x of hand-rolled.

---

## 13. CSS Byte-Table Dispatch for Property Values

**Current**: `parse_value_inline()` uses sequential byte matching for value types.

**Approach**: Build a 256-entry function pointer table indexed by first byte. Map
`#` → hex color, `0-9`/`.`/`-` → number, `"` → string, `a-z` → ident/keyword/function.
Eliminates branch misprediction on heterogeneous value sequences.

**Expected impact**: 10-20% CSS throughput improvement on declaration-heavy files.

---

## 14. Arena Allocator (bumpalo) for JSON/CSS

**Current**: Per-node `Vec` allocation hits the global allocator. SmallVec mitigates
for small containers, but spills still go to jemalloc/system.

**Approach**: Wrap parse in a `bumpalo::Bump` arena. All transient allocations
(Vec backing stores, Box<CssSelector>, Cow::Owned strings) allocate from the arena
and free in bulk on parse completion. Eliminates per-allocation bookkeeping.

**Expected impact**: 15-25% throughput improvement on allocation-heavy files
(bootstrap.css, citm_catalog.json). Near-zero benefit on number-heavy files (canada).

---

## 15. SIMD String Scanning

**Current**: JSON string scanning uses `memchr2` for `"`/`\\`. Fast on AArch64
(NEON-accelerated), but processes one match at a time.

**Approach**: Use `std::simd` (nightly) for 32-byte-wide ASCII validation + escape
detection. Scan entire cache lines of string content in one operation. sonic-rs and
simd-json use this for their string hot paths.

**Expected impact**: 2-4x faster string scanning on long strings. 20-40% overall
JSON throughput improvement on string-heavy files (twitter, apache).

---

## 16. Tape/Event Output Mode for JSON

**Current**: JSON parser always builds a `JsonValue` tree. Each node allocates.

**Approach**: Add a `json_parser_tape()` that returns `Vec<JsonEvent>` (flat tape of
Open/Close/String/Number tokens). Eliminates AST allocation entirely. Offer both
modes — `JsonValue` for convenience, tape for throughput-critical paths.

**Expected impact**: 40-60% throughput improvement, approaching jiter/simd-json
territory.

---

# Resolved

## 1. CSS Parse Throughput (resolved 2026-03-08)

**Previous**: 6-38 MB/s (hand-rolled), ~31 MB/s (prettify pipeline).

**Current**: **229-457 MB/s** (hand-rolled L1.75), 61-159 MB/s (BBNF-generated).

**What was done**:
- Added 4 monolithic SpanParser scanners: `CssIdent` (byte loop), `CssWsComment` (memchr for `*/`), `CssString` (memchr2 for quote/backslash), `CssBlockComment` (memchr for `*/`)
- Hoisted all parser construction out of hot loops (eliminated thousands of `Box<dyn ParserFn>` allocations per parse)
- Inlined value parsing (replaced `dispatch_byte_multi` + `.or()` vtable chains with direct byte-match dispatch)
- Inlined selector suffix parsing (replaced 5-branch `.or()` chain with first-byte match)
- Inlined `css_rule()` dispatch (first-byte match instead of `.or()` chain)
- Removed 6 unnecessary `lazy()` wrappers from non-recursive rules
- Added typed MediaQuery, SupportsCondition, Specificity (L1.75) — both Rust + TS
- SmallVec for selectors (N=2) and values (N=2) — kept declarations as Vec to avoid stack bloat from nested SmallVec

**Result**: 38x improvement on bootstrap. 2.2x faster than lightningcss (L2 semantic parser) on bootstrap, within 0.93x of cssparser (tokenizer-only) on tailwind — while building a fully typed L1.75 AST.

---

## 5. Re-run 11-parser Benchmark Matrix (resolved 2026-03-08)

Full matrix re-run completed. All docs updated.

parse_that JSON: 358–1,006 MB/s. BBNF JSON: 312–703 MB/s.
CSS L1.75: 229–457 MB/s. BBNF CSS: 61–159 MB/s.
10 Rust JSON competitors, 3 CSS competitors benchmarked.

---

## 8. SmallVec for CSS AST Allocations (resolved 2026-03-08)

SmallVec applied to SelectorVec (N=2) and ValueVec (N=2). DeclVec
remains `Vec<CssDeclaration>` — nested SmallVec for declarations caused a 5x
regression due to ~4.4KB `CssNode` stack size (DeclVec<[CssDeclaration; 8]> where
each declaration contains ValueVec<[CssValue; 6]>). Smaller N values avoid this.

**Lesson**: SmallVec is counterproductive when the element type itself contains
SmallVec. Nested inline storage cascades to kilobyte-scale stack objects.

---

## 10. Eliminate Remaining Regex on CSS Hot Paths (resolved 2026-03-08)

Zero `sp_regex()` calls remain in css.rs. All replaced with hand-written
byte scanners: hex color (inline scan in `parse_value_inline`), attribute matcher
(inline peek in `css_attribute_selector`), An+B syntax (hand-written), block comment
(new `SpanScanner::CssBlockComment` variant).

---

## 12. CSS L1.75 — Typed Media/Supports Preludes (resolved 2026-03-08)

Fully typed ASTs for both Rust and TypeScript:
- `MediaQuery` with modifier, media_type, `Vec<MediaCondition>` (Feature/And/Or/Not)
- `MediaFeature` with Plain, Range (Level 4 range syntax), and RangeInterval variants
- `SupportsCondition` with Declaration, Not, And, Or variants
- `Specificity(u16, u16, u16)` with `:where()` → zero, `:is()`/`:not()`/`:has()` → max arg
- Module split: Rust CSS 7 files (max 520 lines), TS CSS 8 files (max 322 lines)
