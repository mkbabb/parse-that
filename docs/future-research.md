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

## 7. TS SpanParser Equivalent — perf hypothesis FALSIFIED + tier KILLED (Tranche A.W3 / B.W0, 2026-06-19/22)

**Current**: TypeScript has `regexSpan()`, `manySpan()`, `sepBySpan()`, `wrapSpan()`
as individual functions — no unified enum-dispatched type.

**Approach (hypothesis, A.W3)**: Introduce a `SpanParser` tagged union (discriminated union
in TS) mirroring the Rust `SpanParser` enum. Each variant stores config inline;
`callSpan()` dispatches via a `switch` on a numeric tag — V8 "should" lower this to a
jump table, escaping the megamorphic IC of >4 distinct closure targets at one call site.

**Expected impact (claimed)**: ~10–20% improvement on span-eligible rules.

**MEASURED + FALSIFIED on V8/TS (A.W3, `span-dispatch.bench.ts`)**:
the tagged `callSpan` switch-dispatch is **~10–14% SLOWER** than the closure span lane on a
representative 8-arm CSS-value alt-token scan, reproduced across three workloads (the tagged
path lost every time; an independent adversarial re-run measured −14%). V8's
monomorphic-per-call-site closure dispatch with inlining beats the recursive switch — the
OPPOSITE of the Rust `enum`-vs-`Box<dyn>` regime that motivated this item. The jump-table
*speedup* premise does **not** transfer from Rust to V8/TS. The tagged-union was implemented
(byte-identical behavior, verified) but offered no speed win.

**KILLED (Tranche B.W0, P-inv-28, 2026-06-22)**: The SpanParser tagged-union
(`SpanParserKind`, `SpanParser` type, all `*Node` constructors, `callSpan()`,
`spanParserToParser()`) and the `span-dispatch.bench.ts` A.W3 bench artifact have been
deleted. Its only production rationale (the codegen foundation for BBNF) moved to a
separate bbnf-lang session outside this campaign's scope. With no in-realm consumer
(confirmed: zero hits across `parse-that/src`, `value.js/src`, `keyframes.js/src` —
all production grammars route through `dispatch()+regex`/`all`/`any`/closure-span
combinators), P-invariant-28 resolves to KILL, not a 4th bare carry.

**What survives**: only the `Span` *value* type and its two helpers (`spanToString`,
`mergeSpans`), which operate on a `Span`, not on any span-producing builder. The 15 closure
`*Span` combinators (`altSpan`, `manySpan`, `regexSpan`, …) — previously the public
span-producing API — were themselves **removed in the 1.0.0 breaking cut** (Tranche S / S.H2,
fold row 48; zero consumers across the constellation), so parse-that no longer ships a
span-producing combinator surface at all. The A.W3 falsification result is recorded here as
documentation: do not re-attempt the runtime-switch SpanParser approach
on V8 without a fundamentally different encoding (e.g., a flat array-of-ops with a
generated specialized dispatcher — not a recursive runtime `switch`).

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

**Current**: BBNF JSON at 540 MB/s vs hand-rolled at 926 MB/s (0.58x).

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

## 17. Recorded decisions — Tranche S 1.0.0 cut (S.H4, 2026-07-03)

Not open research — settled decisions recorded here so a future pass does not silently
re-litigate them.

**Deliberate non-goals of the 1.0.0 cut**: token streams, incremental parsing, Squirrel
LR, and SpanParser resurrection are out of scope by design. The cut is combinator-tier
only — **no bbnf-lang / grammar-DSL work** (a separate session owns that). The SpanParser
tagged-union tier stays permanently KILLED (§7 above).

**r6 #6 — do NOT zone-partition parse-that**: the subpath export map (`.` / `core` /
`diagnostics` / `packrat` / `utils`) IS the zone map; splitting the ~711-LOC `parser.ts`
is net-negative and is not pursued.

**r6 #8 — zero-copy is delegated to value.js's scanner layer**: the `*Span` retirement (the
1.0.0 cut) is the correct direction for the real consumer; parse-that does not build a
zero-copy span surface of its own.

**The WDM/LR left-recursion tier keep is PROVISIONAL**: `PACKRAT_ARMED` (S.H1) makes the
packrat/LR tier free for the LL(1) constellation — but **only for memoize-free processes**
(the latch never disarms; this is the honest framing, distinct from a blanket "made free").
The tier is kept pending the bbnf-lang LR-consumer question — bbnf-lang is the one grammar-DSL
that would exercise it. There is deliberately **NO throughput-% gate** on the arming (a
workload-dependent flake trap; the retained-heap flat clause is the only born-RED perf oracle).
If no LR consumer materializes, a future cut may retire the tier.

**Ledger rows closed**: DQ-1 (fold row 47, packrat re-entrancy) verified landed in 0.13.0
(PT-Q1, `proof:packrat-reentrant`); DQ-2 (fold row 48, the dead `*Span` API) excised at 1.0.0
(S.H2, `proof:no-span-surface`); `color2Into` (fold row 46) is verified at the value.js re-pin
(born-SPECIFIED — value.js's `^1.0.0`-carrying 2.0.x follow-on), never silently re-WATCHed.

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

**Result**: 38x improvement on bootstrap, building a fully typed L1.75 AST.

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
