# Future Research

Organized by bottleneck. Each item: problem statement, current numbers, proposed
approach, expected impact.

---

## 1. CSS Parse Throughput

**Current**: ~31 MB/s (prettify pipeline).

**Bottleneck**: Deep alternation chains in the CSS grammar produce `Box<Enum>` per
recursive value. Each rule invocation allocates a heap-boxed enum variant, and the
CSS grammar has 21 rules with significant nesting depth (selectors, declarations,
media queries).

**Approach**: Extend the BBNF codegen to detect linear-chain rules (rules whose body
is a single nonterminal reference) and eliminate the intermediate `Box<Enum>`
allocation via direct inlining. For alternation-heavy rules, investigate arena
allocation (`bumpalo`) scoped to a single parse call.

**Expected impact**: 2–3x improvement to ~60–90 MB/s, closing the gap with JSON
parse throughput.

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

## 5. Re-run 11-parser Benchmark Matrix

**Current**: BBNF row shows 249–552 MB/s from Phase D results. Phase E (recursive
SpanParser codegen) was added after the last full benchmark run.

**Approach**: Run the full 11-parser × 6-dataset matrix with current code. Update
`README.md` and `docs/perf-optimization-rust.md` tables.

**Expected impact**: BBNF numbers should improve 5–15% from Phase E.

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
